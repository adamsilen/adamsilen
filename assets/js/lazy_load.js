document.addEventListener("DOMContentLoaded", function() {
  const photoItems = document.querySelectorAll(".photo-item");

  if ("IntersectionObserver" in window) {
    const loadObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const photoItem = entry.target;
          const lazyImage = photoItem.querySelector("img[data-src]");
          const caption = photoItem.querySelector('.photo-caption');

          if (lazyImage) {
            lazyImage.src = lazyImage.dataset.src;
            lazyImage.removeAttribute('data-src');
            lazyImage.classList.add('lazy-loaded');

            photoItem.classList.add('has-loaded');
            if (caption) {
              setTimeout(() => caption.classList.add('has-loaded'), 100);
            }
            observer.unobserve(photoItem);
          }
        }
      });
    }, {
      rootMargin: "0px 0px 200px 0px",
      threshold: 0.01
    });

    photoItems.forEach(item => {
      if (item.querySelector("img[data-src]")) {
           loadObserver.observe(item);
      } else {
           item.classList.add('has-loaded');
           const caption = item.querySelector('.photo-caption');
           if (caption) caption.classList.add('has-loaded');
      }
    });

  } else {
    
    photoItems.forEach(item => {
        const lazyImage = item.querySelector("img[data-src]");
        const caption = item.querySelector('.photo-caption');
        if (lazyImage) {
            lazyImage.src = lazyImage.dataset.src;
            lazyImage.removeAttribute('data-src');
            lazyImage.classList.add('lazy-loaded');
        }
        item.classList.add('has-loaded');
        if(caption) caption.classList.add('has-loaded');
    });
  }
});
