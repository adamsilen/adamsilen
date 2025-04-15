document.addEventListener('DOMContentLoaded', function() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  // --- Add body element reference ---
  const bodyElement = document.body;

  const lightboxContent = lightbox.querySelector('.lightbox-content');
  const previewImg = lightboxContent.querySelector('.preview-img');
  const fullImg = lightboxContent.querySelector('.full-img');
  const lightboxDate = lightbox.querySelector('.photo-date');
  const lightboxDescription = lightbox.querySelector('.photo-description');
  const photos = document.querySelectorAll('.photo-item');
  let currentIndex = 0;

  // Variables for swipe detection
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  const swipeThreshold = 50; // Minimum pixels to count as a swipe

  // Variable and check for swipe hint animation
  let swipeHintTimeout;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  function showPhoto(index) {
    const photo = photos[index];
    if (!photo) return;

    const fullUrl = photo.dataset.url;
    const previewUrl = photo.querySelector('.preview-img').src;

    previewImg.src = previewUrl;
    previewImg.style.opacity = '1';
    fullImg.src = '';
    fullImg.style.opacity = '0';

    const tempImg = new Image();
    tempImg.onload = function() {
      fullImg.src = fullUrl;
      fullImg.style.opacity = '1';
      previewImg.style.opacity = '0';
    }
    tempImg.onerror = function() {
      console.error("Error loading image:", fullUrl);
      previewImg.style.opacity = '1'; // Fallback to preview on error
      fullImg.style.opacity = '0';
    }
    tempImg.src = fullUrl;

    lightboxDate.textContent = photo.dataset.date;
    lightboxDescription.textContent = photo.dataset.description;
    currentIndex = index;
  }

  function showPrevImage() {
    const newIndex = (currentIndex - 1 + photos.length) % photos.length;
    showPhoto(newIndex);
  }

  function showNextImage() {
    const newIndex = (currentIndex + 1) % photos.length;
    showPhoto(newIndex);
  }

  // --- Function to OPEN lightbox ---
  function openLightbox(index) {
    showPhoto(index);
    lightbox.classList.add('active');
    bodyElement.style.overflow = 'hidden'; // Prevent body scroll

    // --- Trigger Swipe Hint Animation on Touch Devices ---
    if (isTouchDevice) {
      if (swipeHintTimeout) { // Clear previous timeout if reopening quickly
        clearTimeout(swipeHintTimeout);
      }
      lightbox.classList.add('show-swipe-hint');
      swipeHintTimeout = setTimeout(() => {
        lightbox.classList.remove('show-swipe-hint');
        swipeHintTimeout = null; // Clear reference
      }, 1800); // Duration matches CSS animation
    }
  }

  // --- Function to CLOSE lightbox and clean up swipe hint ---
  function closeLightbox() {
    lightbox.classList.remove('active');
    bodyElement.style.overflow = ''; // Restore body scroll
    if (swipeHintTimeout) {
      clearTimeout(swipeHintTimeout);
      swipeHintTimeout = null;
    }
    lightbox.classList.remove('show-swipe-hint'); // Ensure class is removed
  }

  // --- Masonry Initialization ---
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

  // --- Bind click events to grid items ---
  photos.forEach((photo, index) => {
    photo.addEventListener('click', (e) => {
      e.preventDefault();
      openLightbox(index); // Use openLightbox function
    });
  });

  // --- Lightbox controls ---

  // Close button
  const closeButton = lightbox.querySelector('.close');
  if (closeButton) {
    closeButton.addEventListener('click', closeLightbox); // Use shared close function
  }

  // --- Click Listener for Left/Right Navigation ---
  if (lightboxContent) {
    lightboxContent.addEventListener('click', function(event) {
      // Ensure click is directly on content area or images, not info/buttons
      if (event.target === lightboxContent || event.target === fullImg || event.target === previewImg) {
        const rect = lightboxContent.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        if (clickX < rect.width / 2) {
          showPrevImage();
        } else {
          showNextImage();
        }
      }
    });

    // --- Touch Event Listeners for Swipe ---
    lightboxContent.addEventListener('touchstart', function(event) {
       if (event.target === lightboxContent || event.target === fullImg || event.target === previewImg) {
        touchStartX = event.changedTouches[0].screenX;
        touchStartY = event.changedTouches[0].screenY;
      } else {
          touchStartX = 0; // Ignore swipe if starting on info/buttons
          touchStartY = 0;
      }
    }, { passive: true });

    lightboxContent.addEventListener('touchend', function(event) {
      if (touchStartX === 0) return; // Only process if swipe started on valid area

      touchEndX = event.changedTouches[0].screenX;
      touchEndY = event.changedTouches[0].screenY;
      handleSwipe(); // Call the updated handler
    }, { passive: true });

  } // End if(lightboxContent)

  // --- MODIFIED handleSwipe function ---
  function handleSwipe() {
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Check if horizontal swipe is dominant and meets threshold
      if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX < 0) { // Swiped Left (Next)
              showNextImage();
          } else { // Swiped Right (Prev)
              showPrevImage();
          }
      }
      // Else, check if vertical swipe is dominant and meets threshold
      else if (Math.abs(deltaY) > swipeThreshold && Math.abs(deltaY) > Math.abs(deltaX)) {
          if (deltaY < 0) { // Swiped Up (Next) - Negative deltaY means moving up
              showNextImage();
          } else { // Swiped Down (Prev) - Positive deltaY means moving down
              showPrevImage();
          }
      }

      // Reset touch coordinates regardless of swipe action
      touchStartX = 0;
      touchStartY = 0;
      touchEndX = 0;
      touchEndY = 0;
  }
  // --- END MODIFIED handleSwipe function ---

  // Click outside content to close
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox(); // Use shared close function
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    switch(e.key) {
      case 'Escape':
        closeLightbox(); // Use shared close function
        break;
      // Add Up/Down arrow keys to match swipe directions
      case 'ArrowLeft':
      case 'ArrowUp': // Down arrow = Previous
        showPrevImage();
        break;
      case 'ArrowRight':
      case 'ArrowDown': // Up arrow = Next
        showNextImage();
        break;
    }
  });

}); // End DOMContentLoaded for Lightbox

// --- Progressive lazy loading (Separate DOMContentLoaded for clarity) ---
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
    } else if (img.complete && img.naturalHeight > 0) { // Handle already cached images
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
}); // End DOMContentLoaded for Lazy Loading

