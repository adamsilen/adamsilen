let masonry;

document.addEventListener('DOMContentLoaded', function() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    const htmlElement = document.documentElement;
    const bodyElement = document.body;

    const lightboxContent = lightbox.querySelector('.lightbox-content');
    const previewImg = lightboxContent.querySelector('.preview-img');
    const fullImg = lightboxContent.querySelector('.full-img');
    const lightboxDate = lightbox.querySelector('.photo-date');
    const lightboxDescription = lightbox.querySelector('.photo-description');
    const closeButton = lightbox.querySelector('.close');
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
        if (closeButton) {
            closeButton.classList.remove('close-hidden');
        }
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
        if (closeButton) {
            closeButton.classList.add('close-hidden');
        }
        if (indicatorLeft && indicatorRight) {
            indicatorLeft.classList.remove('indicators-visible');
            indicatorRight.classList.remove('indicators-visible');
        }
        if (uiTimer) {
            clearTimeout(uiTimer);
            uiTimer = null;
        }
    }

    function showPhoto(index, isInitialLoad = false) {
        const photo = photos[index];
        if (!photo) return;

        const newFullUrl = photo.dataset.url;
        const newPreviewUrl = photo.querySelector('.preview-img')?.src;

        lightboxDate.textContent = photo.dataset.date;
        lightboxDescription.textContent = photo.dataset.description;

        const needsFadeOut = !isInitialLoad && fullImg.style.opacity === '1' && fullImg.src;

        if (needsFadeOut) {
            fullImg.style.opacity = '0';
            if (previewImg && previewImg.style.opacity === '1') {
                previewImg.style.opacity = '0';
                setTimeout(() => { if (previewImg) previewImg.style.display = 'none'; }, 300);
            }
        }

        setTimeout(() => {

            if (newPreviewUrl && previewImg) {
                previewImg.src = newPreviewUrl;
                previewImg.style.display = '';
                previewImg.style.opacity = '1';
            } else if (previewImg) {
                previewImg.style.display = 'none';
                previewImg.style.opacity = '0';
            }

            const tempImg = new Image();
            tempImg.onload = function() {
                if (previewImg) {
                    previewImg.style.opacity = '0';
                    // setTimeout(() => { if (previewImg) previewImg.style.display = 'none'; }, 300); // Optional hide after fade
                }
                fullImg.src = newFullUrl;
                fullImg.style.opacity = '1';

                triggerPreloadNext(index);
            }
            tempImg.onerror = function() {
                console.error("Error loading image:", newFullUrl);
                fullImg.src = '';
                fullImg.style.opacity = '0';
                if (previewImg) {
                    previewImg.style.display = '';
                    previewImg.style.opacity = '1';
                }
            }
            tempImg.src = newFullUrl;

        }, needsFadeOut ? 300 : (isInitialLoad ? 0 : 50));

        currentIndex = index;
    }


    function showPrevImage() {
        hideUIElements();
        const newIndex = (currentIndex - 1 + photos.length) % photos.length;
        showPhoto(newIndex);
    }

    function showNextImage() {
        hideUIElements();
        const newIndex = (currentIndex + 1) % photos.length;
        showPhoto(newIndex);
    }

    function openLightbox(index) {
        currentIndex = index;
        showPhoto(index, true);
        lightbox.classList.add('active');
        htmlElement.style.overflow = 'hidden';
        bodyElement.style.overflow = 'hidden';
        showUIElements();
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        hideUIElements();
        if (uiTimer) {
            clearTimeout(uiTimer);
            uiTimer = null;
        }

        setTimeout(() => {
            if (!lightbox.classList.contains('active')) {
                htmlElement.style.overflow = '';
                bodyElement.style.overflow = '';
                fullImg.src = '';
                if (previewImg) previewImg.src = '';
                fullImg.style.opacity = '0';
                if (previewImg) {
                    previewImg.style.opacity = '0';
                    previewImg.style.display = 'none';
                }
            }
        }, 300);
    }

    const grid = document.querySelector('.photo-grid');
    if (grid && typeof Masonry !== 'undefined') {
        masonry = new Masonry(grid, {
            itemSelector: '.photo-item',
            columnWidth: '.photo-item',
            gutter: 16,
            percentPosition: true,
            transitionDuration: 0
        });
    }

    const loadImage = (img) => {
        const highRes = img.dataset.src;
        if (highRes && img.src !== highRes) {
            const tempLoader = new Image();
            tempLoader.onload = () => {
                img.src = highRes;
                img.classList.add('loaded');
                const preview = img.parentElement.querySelector('.preview-img');
                if (preview) {
                    preview.style.opacity = 0;
                }
                if (masonry) {
                    masonry.layout();
                }
            };
            tempLoader.onerror = () => {
                 console.error("Failed to load lazy image:", highRes);
                 if (masonry) {
                    masonry.layout();
                 }
            }
            tempLoader.src = highRes;
        } else if (img.complete && img.naturalHeight > 0 && highRes && img.src === highRes) {
            img.classList.add('loaded');
            const preview = img.parentElement.querySelector('.preview-img');
            if (preview) preview.style.opacity = 0;
            if (masonry) {
               setTimeout(() => { if (masonry) masonry.layout(); }, 0);
            }
        } else if (!highRes) {
             console.warn("Image missing data-src:", img);
             const preview = img.parentElement.querySelector('.preview-img');
             if (preview) preview.style.opacity = 0;
             if (masonry) {
                 masonry.layout();
             }
        }
    };

    photos.forEach((photo, index) => {
        photo.addEventListener('click', (e) => {
            e.preventDefault();
            openLightbox(index);
        });
    });

    if (closeButton) {
        closeButton.addEventListener('click', closeLightbox);
    }

    if (lightboxContent) {
        lightboxContent.addEventListener('click', function(event) {
            if (event.target === closeButton || closeButton?.contains(event.target)) {
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
                showUIElements();
            }
        });

        lightboxContent.addEventListener('touchstart', function(event) {
            touchStartX = event.changedTouches[0].screenX;
            touchStartY = event.changedTouches[0].screenY;
        }, { passive: true });

        lightboxContent.addEventListener('touchend', function(event) {
            if (touchStartX === 0) return;

            touchEndX = event.changedTouches[0].screenX;
            touchEndY = event.changedTouches[0].screenY;

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            touchStartX = 0;
            touchStartY = 0;

            if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX < 0) {
                    showNextImage();
                } else {
                    showPrevImage();
                }
            }

        }, { passive: true });

    }

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

    const mainImages = document.querySelectorAll('.photo-item .main-img');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadImage(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '50px 0px', threshold: 0.01 });
        mainImages.forEach(img => {
            if (img.dataset.src) {
                observer.observe(img)
            } else {
                const preview = img.parentElement.querySelector('.preview-img');
                if (preview) preview.style.opacity = 0;
                console.warn("Image missing data-src, cannot lazy load:", img);
                if (masonry) {
                    masonry.layout();
                }
            }
        });
    } else {
        console.warn("IntersectionObserver not supported, loading all grid images.");
        mainImages.forEach(img => loadImage(img));
        if (masonry) {
             if (typeof imagesLoaded !== 'undefined') {
                 imagesLoaded(grid).on('always', function() {
                    if (masonry) masonry.layout();
                 });
             } else {
                 setTimeout(() => { if (masonry) masonry.layout(); }, 500);
             }
        }
    }

});
