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

  function showUIElements() {
    if (closeButton) {
      closeButton.classList.remove('close-hidden');
    }
    if(indicatorLeft && indicatorRight) {
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
     if(indicatorLeft && indicatorRight) {
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
    const newPreviewUrl = photo.querySelector('.preview-img').src;

    const needsFadeOut = !isInitialLoad && fullImg.style.opacity === '1' && fullImg.src;

    if (needsFadeOut) {
        fullImg.style.opacity = '0';
        if (previewImg.style.opacity === '1') {
             previewImg.style.opacity = '0';
             setTimeout(() => { previewImg.style.display = 'none'; }, 300);
        }
    }

    setTimeout(() => {
        lightboxDate.textContent = photo.dataset.date;
        lightboxDescription.textContent = photo.dataset.description;

        const tempImg = new Image();
        tempImg.onload = function() {
            previewImg.style.display = 'none';
            previewImg.style.opacity = '0';
            previewImg.src = newPreviewUrl;

            fullImg.src = newFullUrl;
            fullImg.style.opacity = '1';
        }
        tempImg.onerror = function() {
            console.error("Error loading image:", newFullUrl);
            fullImg.src = '';
            fullImg.style.opacity = '0';
            previewImg.src = newPreviewUrl;
            previewImg.style.display = '';
            previewImg.style.opacity = '1';
        }
        tempImg.src = newFullUrl;

    }, needsFadeOut ? 300 : 0);

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
            previewImg.src = '';
            fullImg.style.opacity = '0';
            previewImg.style.opacity = '0';
            previewImg.style.display = 'none';
        }
    }, 300);
  }


  const grid = document.querySelector('.photo-grid');
  if (grid && typeof Masonry !== 'undefined') {
    const masonry = new Masonry(grid, {
      itemSelector: '.photo-item',
      columnWidth: '.photo-item',
      gutter: 16,
      percentPosition: true,
      transitionDuration: 0
    });
    if (typeof imagesLoaded !== 'undefined') {
      imagesLoaded(grid).on('progress', function() {
        masonry.layout();
      });
    }
  }

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

      // Check if touch events already handled navigation (to prevent double nav/flash)
       if (event.detail === 0) { // detail is often 0 for events triggered programmatically or after touch
          // Potentially triggered after touchend handled navigation/UI show.
          // Decide if we need to do anything here. Might be safe to just return.
          // Let's try returning to see if it fixes the flash without breaking clicks.
          // return;
          // If returning breaks normal clicks, we might need a more robust flag system.
      }


      const rect = lightboxContent.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickZoneWidth = rect.width;

      const leftZoneEnd = clickZoneWidth * 0.30;
      const rightZoneStart = clickZoneWidth * 0.70;

      if (clickX < leftZoneEnd) {
        showPrevImage();
      } else if (clickX > rightZoneStart) {
        showNextImage();
      } else {
        showUIElements();
      }
    });

    lightboxContent.addEventListener('touchstart', function(event) {
       if (event.target === fullImg || event.target === previewImg) {
        touchStartX = event.changedTouches[0].screenX;
        touchStartY = event.changedTouches[0].screenY;
       } else {
           touchStartX = 0;
           touchStartY = 0;
       }
    }, { passive: true });

    lightboxContent.addEventListener('touchend', function(event) {
      if (touchStartX === 0) return;
      if (previewImg.style.opacity === '1') {
        touchStartX = 0;
        return;
      }

      touchEndX = event.changedTouches[0].screenX;
      touchEndY = event.changedTouches[0].screenY;

      // Store end coordinates before resetting, for tap zone check
      const finalTouchX = touchEndX;
      const finalTouchY = touchEndY; // Though Y is not used here

      handleSwipe(finalTouchX); // Pass the final X coordinate

       // Reset touch coordinates AFTER passing to handleSwipe
      touchStartX = 0;
      touchStartY = 0;
      touchEndX = 0;
      touchEndY = 0;
    }, { passive: true });

  }

  function handleSwipe(finalX) { // Receive finalX coordinate
      const deltaX = touchEndX - touchStartX; // Use class-level variables for calculation
      const deltaY = touchEndY - touchStartY;

      if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX < 0) {
              showNextImage();
          } else {
              showPrevImage();
          }
      } else if (Math.abs(deltaX) < swipeThreshold && Math.abs(deltaY) < swipeThreshold) {
           // Treat as a TAP if movement is below threshold for both axes

           // Check tap location using finalX relative to lightboxContent
            const rect = lightboxContent.getBoundingClientRect();
            const tapXRelative = finalX - rect.left;
            const clickZoneWidth = rect.width;
            const leftZoneEnd = clickZoneWidth * 0.30;
            const rightZoneStart = clickZoneWidth * 0.70;

            if (tapXRelative >= leftZoneEnd && tapXRelative <= rightZoneStart) {
                // TAP was in the CENTER zone
                showUIElements();
            }
            // If tap was in SIDE zones, do nothing here - let the click listener handle it.
      }
       // Resetting touch coordinates moved to touchend listener
  }

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (previewImg.style.opacity === '1' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) return;

    switch(e.key) {
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

});

document.addEventListener('DOMContentLoaded', function() {
  const mainImages = document.querySelectorAll('.photo-item .main-img');

  const loadImage = (img) => {
    const highRes = img.dataset.src;
    if (highRes && img.src !== highRes) {
        const tempLoader = new Image();
        tempLoader.onload = () => {
            img.src = highRes;
            img.classList.add('loaded');
            const preview = img.parentElement.querySelector('.preview-img');
            if (preview) preview.style.opacity = 0;
        };
        tempLoader.onerror = () => console.error("Failed to load lazy image:", highRes);
        tempLoader.src = highRes;
    } else if (img.complete && img.naturalHeight > 0) {
        img.classList.add('loaded');
        const preview = img.parentElement.querySelector('.preview-img');
        if (preview) preview.style.opacity = 0;
    }
  };

  if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            loadImage(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { rootMargin: '50px 0px', threshold: 0.01 });
      mainImages.forEach(img => observer.observe(img));
  } else {
      console.warn("IntersectionObserver not supported, loading all images.");
      mainImages.forEach(img => loadImage(img));
  }
});
