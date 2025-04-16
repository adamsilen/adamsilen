let masonry;

document.addEventListener('DOMContentLoaded', function() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    const htmlElement = document.documentElement;
    const bodyElement = document.body;

    // Lightbox elements
    const imageWrapper = lightbox.querySelector('.lightbox-image-wrapper');
    const photoInfo = lightbox.querySelector('.photo-info');
    const previewImg = imageWrapper.querySelector('.preview-img');
    const fullImg = imageWrapper.querySelector('.full-img');
    const lightboxDate = photoInfo.querySelector('.photo-date');
    const lightboxDescription = photoInfo.querySelector('.photo-description');
    const indicatorLeft = lightbox.querySelector('.swipe-indicator-left');
    const indicatorRight = lightbox.querySelector('.swipe-indicator-right');

    const photos = document.querySelectorAll('.photo-item');
    let currentIndex = 0;

    // Touch/Swipe handling variables
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    const swipeThreshold = 50; // Min distance for a swipe
    let isSwiping = false; // Flag to track if a swipe action occurred

    // UI Timer
    let uiTimer = null;

    // --- Image Preloading ---
    function preloadImage(url) {
        if (!url) return;
        const img = new Image();
        img.src = url;
    }

    function triggerPreloadNext(index) {
        const nextIndex = (index + 1) % photos.length;
        const nextPhoto = photos[nextIndex];
        if (nextPhoto) {
            preloadImage(nextPhoto.dataset.url);
        }
    }

    // --- UI Visibility Control ---
    function showUIElements() {
        if (indicatorLeft && indicatorRight) {
            indicatorLeft.classList.add('indicators-visible');
            indicatorRight.classList.add('indicators-visible');
        }
        if (uiTimer) clearTimeout(uiTimer);
        // Hide indicators after a short delay
        uiTimer = setTimeout(hideUIElements, 1500); // Reduced time
    }

    function hideUIElements() {
        if (indicatorLeft && indicatorRight) {
            indicatorLeft.classList.remove('indicators-visible');
            indicatorRight.classList.remove('indicators-visible');
        }
        if (uiTimer) {
            clearTimeout(uiTimer);
            uiTimer = null;
        }
    }

    // --- Displaying Photos ---
    function showPhoto(index, isOpening = false) {
        const photo = photos[index];
        if (!photo) return;

        const newFullUrl = photo.dataset.url;
        const newPreviewUrl = photo.querySelector('.preview-img')?.src;

        // Update photo metadata
        lightboxDate.textContent = photo.dataset.date;
        lightboxDescription.textContent = photo.dataset.description;

        // Calculate max height for the image wrapper dynamically
        const lightboxStyles = window.getComputedStyle(lightbox);
        const lightboxPaddingY = parseFloat(lightboxStyles.paddingTop) + parseFloat(lightboxStyles.paddingBottom);
        const photoInfoHeight = (photoInfo && window.getComputedStyle(photoInfo).display !== 'none') ? photoInfo.offsetHeight : 0;
        const buffer = 20; // Vertical buffer space
        const viewportMaxHeight = window.innerHeight - lightboxPaddingY - photoInfoHeight - buffer;
        // Cap max height (adjust 800 if needed)
        const finalMaxHeight = Math.max(100, Math.min(viewportMaxHeight, 800)); // Ensure min height

        if (imageWrapper) {
            imageWrapper.style.height = `${finalMaxHeight}px`;
        }

        // --- Transition Logic ---
        // 1. Fade out the current full image (if not the initial opening)
        if (!isOpening) {
            fullImg.style.opacity = '0';
        }

        // 2. Set preview image src and fade it in immediately (provides quick feedback)
        if (newPreviewUrl && previewImg) {
            previewImg.src = newPreviewUrl;
            requestAnimationFrame(() => {
                previewImg.style.opacity = '1';
            });
        } else if (previewImg) {
            previewImg.style.opacity = '0'; // Hide if no preview available
        }

        // 3. Clear full image src to prevent flash of old image during load
        fullImg.src = '';
        if(isOpening) fullImg.style.opacity = '0'; // Ensure opacity is 0 when opening


        // 4. Load the new full image in the background
        const tempImg = new Image();
        tempImg.onload = function() {
            fullImg.src = newFullUrl;
            // 5. Once loaded, schedule the fade-in of full & fade-out of preview
            requestAnimationFrame(() => {
                fullImg.style.opacity = '1'; // Fade in full image
                if (previewImg) {
                    previewImg.style.opacity = '0'; // Fade out preview
                }
                // Preload the *next* image after the current one is displayed
                triggerPreloadNext(index);
            });
        };
        tempImg.onerror = function() {
            console.error("Error loading image:", newFullUrl);
            // Keep preview visible on error, or show an error message
            if (previewImg) previewImg.style.opacity = '1';
            fullImg.style.opacity = '0'; // Ensure broken image doesn't show
        };
        tempImg.src = newFullUrl; // Start loading

        currentIndex = index;
    }

    // --- Navigation Functions ---
    function showPrevImage() {
        hideUIElements(); // Ensure UI is hidden on navigation
        const newIndex = (currentIndex - 1 + photos.length) % photos.length;
        showPhoto(newIndex);
    }

    function showNextImage() {
        hideUIElements(); // Ensure UI is hidden on navigation
        const newIndex = (currentIndex + 1) % photos.length;
        showPhoto(newIndex);
    }

    // --- Lightbox Open/Close ---
    function openLightbox(index) {
        currentIndex = index;
        if (imageWrapper) imageWrapper.style.height = 'auto'; // Reset height before calculation
        lightbox.classList.add('active');
        htmlElement.style.overflow = 'hidden';
        bodyElement.classList.add('lightbox-open');

        // Show the first photo without the initial fade-out of the (non-existent) previous image
        showPhoto(index, true);

        // Briefly show UI indicators only when first opening
        showUIElements();
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        hideUIElements(); // Ensure UI is hidden
        htmlElement.style.overflow = '';
        bodyElement.classList.remove('lightbox-open');

        // Fade out current images smoothly
        fullImg.style.opacity = '0';
        if (previewImg) previewImg.style.opacity = '0';

        // Reset images after transition (duration matches CSS: 0.3s)
        setTimeout(() => {
            // Check if still closed, in case reopened quickly
            if (!lightbox.classList.contains('active')) {
                fullImg.src = '';
                if (previewImg) previewImg.src = '';
                if (imageWrapper) imageWrapper.style.height = 'auto'; // Reset dynamic height
            }
        }, 300);
    }

    // --- Masonry Grid Setup ---
    const grid = document.querySelector('.photo-grid');
    if (grid && typeof Masonry !== 'undefined') {
        masonry = new Masonry(grid, {
            itemSelector: '.photo-item',
            columnWidth: '.photo-item',
            gutter: 16,
            percentPosition: true,
            transitionDuration: 0 // Disable Masonry transitions
        });
    }

    // --- Lazy Loading Grid Images ---
    const loadImage = (img) => {
        const highRes = img.dataset.src;
        if (!highRes) { // Handle missing data-src
            console.warn("Image missing data-src:", img);
            const preview = img.parentElement.querySelector('.preview-img');
            if (preview) preview.style.opacity = 0;
            if (masonry) masonry.layout();
            return;
        }

        // Check if already loaded or currently loading
        if (img.src === highRes || img.classList.contains('loaded')) {
             if (img.complete && img.naturalHeight > 0) { // Ensure fully loaded if src matches
                img.classList.add('loaded');
                const preview = img.parentElement.querySelector('.preview-img');
                if (preview) preview.style.opacity = 0;
                if (masonry) setTimeout(() => { if (masonry) masonry.layout(); }, 0);
             }
            return;
        }


        const tempLoader = new Image();
        tempLoader.onload = () => {
            img.src = highRes;
            img.classList.add('loaded');
            const preview = img.parentElement.querySelector('.preview-img');
            if (preview) preview.style.opacity = 0;
            if (masonry) masonry.layout();
        };
        tempLoader.onerror = () => {
            console.error("Failed to load lazy image:", highRes);
            if (masonry) masonry.layout();
        };
        tempLoader.src = highRes;
    };

    // --- Event Listeners ---

    // Grid item click
    photos.forEach((photo, index) => {
        photo.addEventListener('click', (e) => {
            e.preventDefault();
            openLightbox(index);
        });
    });

    // Lightbox interaction (Desktop Clicks)
    if (lightbox) {
        lightbox.addEventListener('click', function(event) {
            // Ignore clicks during swipe action
            if (isSwiping) {
                return;
            }
            // Ignore clicks on photo info area
            if (photoInfo.contains(event.target)) {
                return;
            }

            const clickX = event.clientX;
            const windowWidth = window.innerWidth;
            const leftZoneEnd = windowWidth * 0.30;
            const rightZoneStart = windowWidth * 0.70;

            if (clickX < leftZoneEnd) {
                showPrevImage();
            } else if (clickX > rightZoneStart) {
                showNextImage();
            } else {
                closeLightbox();
            }
        });

        // Touch Interactions (Mobile Swipes and Taps)
        lightbox.addEventListener('touchstart', function(event) {
            if (event.touches.length === 1) { // Ignore multi-touch gestures
                touchStartX = event.touches[0].clientX;
                touchStartY = event.touches[0].clientY;
                isSwiping = false; // Reset swipe flag
            }
        }, { passive: true });

        lightbox.addEventListener('touchmove', function(event) {
            if (event.touches.length === 1 && touchStartX !== 0) {
                touchEndX = event.touches[0].clientX;
                touchEndY = event.touches[0].clientY;
                 // Check if movement exceeds threshold - helps distinguish tap from scroll/swipe start
                if (Math.abs(touchEndX - touchStartX) > 10 || Math.abs(touchEndY - touchStartY) > 10) {
                    isSwiping = true; // Consider it a swipe if moved significantly
                }
            }
        }, { passive: true });

        lightbox.addEventListener('touchend', function(event) {
            if (event.changedTouches.length === 1 && touchStartX !== 0) { // Ensure it's the end of our tracked touch
                touchEndX = event.changedTouches[0].clientX;
                touchEndY = event.changedTouches[0].clientY;

                const deltaX = touchEndX - touchStartX;
                const deltaY = touchEndY - touchStartY;
                const absDeltaX = Math.abs(deltaX);
                const absDeltaY = Math.abs(deltaY);

                // Determine action based on swipe or tap
                if (absDeltaX > swipeThreshold && absDeltaX > absDeltaY) {
                    // Horizontal Swipe
                    if (deltaX < 0) { // Swipe Left
                        showNextImage();
                    } else { // Swipe Right
                        showPrevImage();
                    }
                    isSwiping = true; // Explicitly mark as swipe completed
                } else if (absDeltaX < swipeThreshold && absDeltaY < swipeThreshold) {
                    // Tap (minimal movement) - Simulate click logic zones
                    const windowWidth = window.innerWidth;
                    const leftZoneEnd = windowWidth * 0.30;
                    const rightZoneStart = windowWidth * 0.70;

                    if (touchStartX < leftZoneEnd) {
                        showPrevImage();
                    } else if (touchStartX > rightZoneStart) {
                        showNextImage();
                    } else {
                        closeLightbox();
                    }
                     // Reset isSwiping just in case it was incorrectly set by small movement
                     isSwiping = false;
                }
                // Reset touch coordinates
                touchStartX = 0;
                touchStartY = 0;
            }
             // After touchend completes, ensure isSwiping is reset if needed for the next click event.
             // Using a small timeout allows the click event to potentially check this flag.
             setTimeout(() => { isSwiping = false; }, 50);
        });
    }

    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;

        switch (e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                showPrevImage();
                break;
            case 'ArrowRight':
            case 'ArrowDown':
                showNextImage();
                break;
        }
    });

    // --- Initialize Grid Lazy Loading ---
    const mainImages = document.querySelectorAll('.photo-item .main-img');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadImage(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '100px 0px', threshold: 0.01 }); // Load slightly sooner

        mainImages.forEach(img => {
             if (img.dataset.src) { // Only observe if data-src exists
                observer.observe(img);
             } else { // Handle missing data-src immediately
                 const preview = img.parentElement.querySelector('.preview-img');
                 if (preview) preview.style.opacity = 0;
                 console.warn("Image missing data-src, cannot lazy load:", img);
             }
        });
         // Initial layout check for Masonry after setup
         if (masonry) {
            setTimeout(() => { if(masonry) masonry.layout(); }, 100);
         }

    } else {
        // Fallback for older browsers
        console.warn("IntersectionObserver not supported, loading all grid images.");
        mainImages.forEach(img => loadImage(img));
        if (masonry) {
            if (typeof imagesLoaded !== 'undefined') {
                imagesLoaded(grid).on('always', function() {
                    if (masonry) masonry.layout();
                });
            } else {
                console.warn("imagesLoaded library not found. Using timeout fallback for Masonry layout.");
                setTimeout(() => { if (masonry) masonry.layout(); }, 1000);
            }
        }
    }

}); // End DOMContentLoaded
