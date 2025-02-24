document.addEventListener('DOMContentLoaded', function() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  
  const lightboxContent = lightbox.querySelector('.lightbox-content');
  const previewImg = lightboxContent.querySelector('.preview-img');
  const fullImg = lightboxContent.querySelector('.full-img');
  const lightboxDate = lightbox.querySelector('.photo-date');
  const lightboxDescription = lightbox.querySelector('.photo-description');
  const photos = document.querySelectorAll('.photo-item');
  let currentIndex = 0;
  
  function showPhoto(index) {
    const photo = photos[index];
    const fullUrl = photo.dataset.url.replace('?tr=pr-true', '');
    const previewUrl = photo.querySelector('.preview-img').src;
    
    previewImg.src = previewUrl;
    previewImg.style.opacity = '1';
    fullImg.style.opacity = '0';
    
    fullImg.src = fullUrl;
    fullImg.onload = function() {
      fullImg.style.opacity = '1';
      previewImg.style.opacity = '0';
    };
    
    lightboxDate.textContent = photo.dataset.date;
    lightboxDescription.textContent = photo.dataset.description;
    currentIndex = index;
  }
  
  // Initialize Masonry
  const grid = document.querySelector('.photo-grid');
  const masonry = new Masonry(grid, {
    itemSelector: '.photo-item',
    columnWidth: '.photo-item',
    gutter: 16,
    percentPosition: true,
    transitionDuration: 0
  });

  // Update layout after all images are loaded
  imagesLoaded(grid).on('progress', function() {
    masonry.layout();
  });

  // Bind click events after Masonry is initialized
  photos.forEach((photo, index) => {
    photo.addEventListener('click', (e) => {
      e.preventDefault();
      showPhoto(index);
      lightbox.classList.add('active');
    });
  });
  
  // Lightbox controls
  lightbox.querySelector('.close').addEventListener('click', () => {
    lightbox.classList.remove('active');
  });
  
  lightbox.querySelector('.prev').addEventListener('click', (e) => {
    e.stopPropagation();
    showPhoto((currentIndex - 1 + photos.length) % photos.length);
  });
  
  lightbox.querySelector('.next').addEventListener('click', (e) => {
    e.stopPropagation();
    showPhoto((currentIndex + 1) % photos.length);
  });
  
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.classList.remove('active');
    }
  });
  
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    
    switch(e.key) {
      case 'Escape':
        lightbox.classList.remove('active');
        break;
      case 'ArrowLeft':
        showPhoto((currentIndex - 1 + photos.length) % photos.length);
        break;
      case 'ArrowRight':
        showPhoto((currentIndex + 1) % photos.length);
        break;
    }
  });
});

// Progressive lazy loading for main gallery images
document.addEventListener('DOMContentLoaded', function() {
  const mainImages = document.querySelectorAll('.photo-item .main-img');
  
  const loadImage = (img) => {
    const highRes = img.dataset.src;
    if (highRes && img.src !== highRes) {
      img.src = highRes;
      img.onload = () => {
        img.classList.add('loaded');
        img.parentElement.querySelector('.preview-img').style.opacity = 0;
      };
    }
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        loadImage(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.01
  });
  
  mainImages.forEach(img => observer.observe(img));
});
