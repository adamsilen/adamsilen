let masonry;

document.addEventListener('DOMContentLoaded', function() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    const htmlElement = document.documentElement;
    const bodyElement = document.body;

    const lightboxContent = lightbox.querySelector('.lightbox-content');
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

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    const swipeThreshold = 50;

    let uiTimer = null;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    function preloadImage(url) {
        if (!url) return;
        const img = new Image();
        img.src = url;
    }

    function triggerPreloadNext(currentIndex) {
        const nextIndex = (currentIndex + 1) % photos.length;
        const nextPhoto = photos[nextIndex];
        if (nextPhoto) {
            preloadImage(nextPhoto.dataset.url);
        }
    }

    function showUIElements() {
        if (indicatorLeft && indicatorRight) {
            indicatorLeft.classList.add('indicators-visible');
            indicatorRight.classList.add('indicators-visible');
        }
        if (uiTimer) {
            clearTimeout(uiTimer);
        }
        uiTimer = setTimeout(hideUIElements, 2000);
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

    function showPhoto(index) {
        const photo = photos[index];
        if (!photo) return;

        const newFullUrl = photo.dataset.url;
        const newPreviewUrl = photo.querySelector('.preview-img')?.src;

        lightboxDate.textContent = photo.dataset.date;
        lightboxDescription.textContent = photo.dataset.description;

        const lightboxStyles = window.getComputedStyle(lightbox);
        const lightboxPaddingY = parseFloat(lightboxStyles.paddingTop) + parseFloat(lightboxStyles.paddingBottom);
        const photoInfoHeight = (photoInfo && window.getComputedStyle(photoInfo).display !== 'none') ? photoInfo.offsetHeight : 0;
        const buffer = 20; // Extra vertical space buffer
        const viewportMaxHeight = window.innerHeight - lightboxPaddingY - photoInfoHeight - buffer;
        const finalMaxHeight = Math.min(viewportMaxHeight, 800); // Cap max height if needed

        if (imageWrapper) {
             imageWrapper.style.height = `${finalMaxHeight}px`;
        }

        // Start fading out current full image
        fullImg.style.opacity = '0';

        // Set and fade in new preview image
        if (newPreviewUrl && previewImg) {
            previewImg.src = newPreviewUrl;
            previewImg.style.opacity = '1';
        } else if (previewImg) {
            previewImg.style.opacity = '0'; // Hide preview if none exists
        }

        // Clear full image src immediately to prevent flash of old image during load/fade
        fullImg.src = '';

        const tempImg = new Image();
        tempImg.onload = function() {
            fullImg.src = newFullUrl;
            // Use requestAnimationFrame for smoother transition start
            requestAnimationFrame(() => {
                fullImg.style.opacity = '1'; // Fade in full image
                if (previewImg) {
                    previewImg.style.opacity = '0'; // Fade out preview
                }
                triggerPreloadNext(index);
            });
        }
        tempImg.onerror = function() {
            console.error("Error loading image:", newFullUrl);
            if (previewImg) {
                previewImg.style.opacity = '1'; // Keep preview visible on error
            }
            // Potentially show an error message to the user here
        }
        tempImg.src = newFullUrl;

        currentIndex = index;
    }


    function showPrevImage() {
        hideUIElements(); // Hide indicators on navigation
        const newIndex = (currentIndex - 1 + photos.length) % photos.length;
        showPhoto(newIndex);
    }

    function showNextImage() {
        hideUIElements(); // Hide indicators on navigation
        const newIndex = (currentIndex + 1) % photos.length;
        showPhoto(newIndex);
    }

    function openLightbox(index) {
        currentIndex = index;
        if (imageWrapper) imageWrapper.style.height = 'auto'; // Reset height before calculating
        lightbox.classList.add('active');
        htmlElement.style.overflow = 'hidden'; // Prevent scrolling background
        bodyElement.classList.add('lightbox-open'); // Add class for potential body styling

        // Initial show without fade-in delay for the *first* image opened
        const photo = photos[index];
        if (!photo) return;
        const newFullUrl = photo.dataset.url;
        const newPreviewUrl = photo.querySelector('.preview-img')?.src;
        lightboxDate.textContent = photo.dataset.date;
        lightboxDescription.textContent = photo.dataset.description;

        // Calculate max height for the image
        const lightboxStyles = window.getComputedStyle(lightbox);
        const lightboxPaddingY = parseFloat(lightboxStyles.paddingTop) + parseFloat(lightboxStyles.paddingBottom);
        const photoInfoHeight = (photoInfo && window.getComputedStyle(photoInfo).display !== 'none') ? photoInfo.offsetHeight : 0;
        const buffer = 20; // Extra vertical space buffer
        const viewportMaxHeight = window.innerHeight - lightboxPaddingY - photoInfoHeight - buffer;
        const finalMaxHeight = Math.min(viewportMaxHeight, 800); // Cap max height

        if (imageWrapper) {
             imageWrapper.style.height = `${finalMaxHeight}px`;
        }

        // Show preview instantly while full loads
        if (newPreviewUrl && previewImg) {
            previewImg.src = newPreviewUrl;
            previewImg.style.opacity = '1';
        } else if (previewImg) {
            previewImg.style.opacity = '0';
        }
        fullImg.style.opacity = '0'; // Ensure full starts hidden
        fullImg.src = ''; // Clear src

        const tempImg = new Image();
        tempImg.onload = function() {
            fullImg.src = newFullUrl;
            // Direct opacity set for first image load (no transition needed here)
            fullImg.style.opacity = '1';
            if (previewImg) {
                previewImg.style.opacity = '0'; // Hide preview once full is ready
            }
            triggerPreloadNext(index); // Preload next image
        }
        tempImg.onerror = function() {
            console.error("Error loading image:", newFullUrl);
             if (previewImg) {
                previewImg.style.opacity = '1'; // Keep preview on error
            }
             // Optionally show an error message
        }
        tempImg.src = newFullUrl; // Start loading the full image

        showUIElements(); // Show indicators briefly
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        hideUIElements();
        if (uiTimer) {
            clearTimeout(uiTimer);
            uiTimer = null;
        }
        htmlElement.style.overflow = ''; // Restore scrolling
        bodyElement.classList.remove('lightbox-open');

        // Fade out the current image(s)
        fullImg.style.opacity = '0';
        if(previewImg) previewImg.style.opacity = '0';

        // Reset images after transition ends to clean up
        setTimeout(() => {
            if (!lightbox.classList.contains('active')) { // Ensure lightbox is still closed
                fullImg.src = '';
                if (previewImg) {
                    previewImg.src = '';
                }
                if (imageWrapper) imageWrapper.style.height = 'auto'; // Reset dynamic height
            }
        }, 300); // Match CSS transition duration
    }

    const grid = document.querySelector('.photo-grid');
    if (grid && typeof Masonry !== 'undefined') {
        masonry = new Masonry(grid, {
            itemSelector: '.photo-item',
            columnWidth: '.photo-item',
            gutter: 16,
            percentPosition: true,
            transitionDuration: 0 // Masonry transitions disabled
        });
    }

    // --- Lazy Loading Logic for Grid Images ---
    const loadImage = (img) => {
        const highRes = img.dataset.src;
        if (highRes && img.src !== highRes) { // Check if not already loaded
            const tempLoader = new Image();
            tempLoader.onload = () => {
                img.src = highRes;
                img.classList.add('loaded');
                const preview = img.parentElement.querySelector('.preview-img');
                if (preview) {
                    preview.style.opacity = 0; // Hide blurred preview
                }
                if (masonry) {
                    masonry.layout(); // Re-layout Masonry after image load
                }
            };
            tempLoader.onerror = () => {
                 console.error("Failed to load lazy image:", highRes);
                 // Optionally remove the broken image or show placeholder
                 if (masonry) {
                    masonry.layout(); // Layout might still be needed
                 }
            }
            tempLoader.src = highRes; // Start loading high-res
        } else if (img.complete && img.naturalHeight > 0 && highRes && img.src === highRes) {
            // Already loaded (e.g., cached), just ensure state is correct
            img.classList.add('loaded');
            const preview = img.parentElement.querySelector('.preview-img');
            if (preview) preview.style.opacity = 0;
            if (masonry) {
               // Use setTimeout to ensure layout happens after potential render updates
               setTimeout(() => { if (masonry) masonry.layout(); }, 0);
            }
        } else if (!highRes) {
             // Handle cases where data-src might be missing
             console.warn("Image missing data-src:", img);
             const preview = img.parentElement.querySelector('.preview-img');
             if (preview) preview.style.opacity = 0; // Hide preview anyway
             if (masonry) {
                 masonry.layout();
             }
        }
    };

    // --- Event Listeners Setup ---

    // Open lightbox on photo item click
    photos.forEach((photo, index) => {
        photo.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default anchor behavior if any
            openLightbox(index);
        });
    });


    // Lightbox click/tap handler
    if (lightbox) {
        lightbox.addEventListener('click', function(event) {
            // Prevent closing if clicking directly on image info area
            if (photoInfo.contains(event.target)) {
                return;
            }
             // Prevent closing if click lands exactly on an indicator *while visible*
            if (indicatorLeft.contains(event.target) || indicatorRight.contains(event.target)) {
                 // Check computed opacity to see if they are actually visible
                 if (window.getComputedStyle(indicatorLeft).opacity !== '0' || window.getComputedStyle(indicatorRight).opacity !== '0') {
                    return; // Don't close if clicking visible indicator
                 }
            }

            const clickX = event.clientX;
            const windowWidth = window.innerWidth;
            const leftZoneEnd = windowWidth * 0.30; // Left 30% for previous
            const rightZoneStart = windowWidth * 0.70; // Right 30% for next

            if (clickX < leftZoneEnd) {
                showPrevImage();
            } else if (clickX > rightZoneStart) {
                showNextImage();
            } else {
                // Click in the middle (40%) closes the lightbox
                closeLightbox();
            }
        });

        // Touch start listener
        lightbox.addEventListener('touchstart', function(event) {
            // Only track single touch
            if (event.touches.length === 1) {
                touchStartX = event.changedTouches[0].screenX;
                touchStartY = event.changedTouches[0].screenY;
            }
        }, { passive: true });

        // Touch end listener
        lightbox.addEventListener('touchend', function(event) {
            if (touchStartX === 0) return; // Exit if touch didn't start properly

            // Only track single touch end
            if (event.changedTouches.length === 1) {
                touchEndX = event.changedTouches[0].screenX;
                touchEndY = event.changedTouches[0].screenY;

                const deltaX = touchEndX - touchStartX;
                const deltaY = touchEndY - touchStartY;

                // Store start X before resetting, needed for tap zone check
                const startX = touchStartX;
                const windowWidth = window.innerWidth;
                const leftZoneEnd = windowWidth * 0.30;
                const rightZoneStart = windowWidth * 0.70;

                // Reset coordinates immediately
                touchStartX = 0;
                touchStartY = 0;

                // Check for horizontal swipe first (more horizontal movement than vertical)
                if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY)) {
                    if (deltaX < 0) { // Swipe left
                        showNextImage();
                    } else { // Swipe right
                        showPrevImage();
                    }
                }
                // Else, check for tap (minimal movement)
                else if (Math.abs(deltaX) < swipeThreshold && Math.abs(deltaY) < swipeThreshold) {
                     // Check if the tap occurred in the middle zone
                     if (startX >= leftZoneEnd && startX <= rightZoneStart) {
                          closeLightbox();
                     } else {
                        // If tap was in side zones, briefly show indicators as feedback
                        showUIElements();
                     }
                }
                // Vertical swipes or ambiguous gestures are ignored
            }

        }, { passive: true });
    }


    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return; // Only act if lightbox is open

        switch (e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowLeft':
            case 'ArrowUp': // Treat Up as previous as well
                showPrevImage();
                break;
            case 'ArrowRight':
            case 'ArrowDown': // Treat Down as next as well
                showNextImage();
                break;
        }
    });

    // --- Initialize Lazy Loading for Grid ---
    const mainImages = document.querySelectorAll('.photo-item .main-img');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadImage(entry.target); // Load image when it enters viewport
                    observer.unobserve(entry.target); // Stop observing once loaded
                }
            });
        }, { rootMargin: '50px 0px', threshold: 0.01 }); // Trigger slightly before visible

        mainImages.forEach(img => {
            if (img.dataset.src) {
                observer.observe(img); // Observe images with data-src
            } else {
                // Handle images missing data-src (log warning, hide preview)
                const preview = img.parentElement.querySelector('.preview-img');
                if (preview) preview.style.opacity = 0;
                console.warn("Image missing data-src, cannot lazy load:", img);
                if (masonry) {
                    masonry.layout(); // Still layout
                }
            }
        });
    } else {
        // Fallback for browsers without IntersectionObserver
        console.warn("IntersectionObserver not supported, loading all grid images eagerly.");
        mainImages.forEach(img => loadImage(img));
        // Ensure Masonry layouts after images load (using imagesLoaded library if available)
        if (masonry) {
             if (typeof imagesLoaded !== 'undefined') {
                 imagesLoaded(grid).on('always', function() {
                    // Layout Masonry once all images (even broken ones) are settled
                    if (masonry) masonry.layout();
                 });
             } else {
                 // Fallback if imagesLoaded isn't present, layout after a delay
                 console.warn("imagesLoaded library not found. Using timeout for Masonry layout fallback.");
                 setTimeout(() => { if (masonry) masonry.layout(); }, 500); // Adjust delay as needed
             }
        }
    }

}); // End DOMContentLoaded
