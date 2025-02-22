document.addEventListener('DOMContentLoaded', function() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return; // Exit if no lightbox is present on the page
  
  const lightboxImg = lightbox.querySelector('img');
  const lightboxDate = lightbox.querySelector('.photo-date');
  const lightboxDescription = lightbox.querySelector('.photo-description');
  const photos = document.querySelectorAll('.photo-item');
  let currentIndex = 0;

  function showPhoto(index) {
    const photo = photos[index];
    lightboxImg.src = photo.dataset.url;
    lightboxImg.alt = photo.dataset.description;
    lightboxDate.textContent = photo.dataset.date;
    lightboxDescription.textContent = photo.dataset.description;
    currentIndex = index;
  }

  photos.forEach((photo, index) => {
    photo.addEventListener('click', () => {
      showPhoto(index);
      lightbox.classList.add('active');
    });
  });

  lightbox.querySelector('.close').addEventListener('click', () => {
    lightbox.classList.remove('active');
  });

  lightbox.querySelector('.prev').addEventListener('click', () => {
    showPhoto((currentIndex - 1 + photos.length) % photos.length);
  });

  lightbox.querySelector('.next').addEventListener('click', () => {
    showPhoto((currentIndex + 1) % photos.length);
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    
    if (e.key === 'Escape') lightbox.classList.remove('active');
    if (e.key === 'ArrowLeft') lightbox.querySelector('.prev').click();
    if (e.key === 'ArrowRight') lightbox.querySelector('.next').click();
  });
});
