---
layout: page
title: Fotat
---
<div class="photo-grid full">
  {% assign sorted_photos = site.data.photos | sort: 'date' | reverse %}
  {% for photo in sorted_photos offset:9 %}
<div class="photo-item" 
     data-url="https://ik.imagekit.io/adamsilen/{{ photo.image }}" 
     data-date="{{ photo.date | date: '%-d %B %Y' | replace:'January','januari' | replace:'February','februari' | replace:'March','mars' | replace:'April','april' | replace:'May','maj' | replace:'June','juni' | replace:'July','juli' | replace:'August','augusti' | replace:'September','september' | replace:'October','oktober' | replace:'November','november' | replace:'December','december'}}"
     data-description="{{ photo.description }}">
  <img src="https://ik.imagekit.io/adamsilen/{{ photo.image }}?tr=bl-90,q-1" 
       class="preview-img" alt="">
  <img src="https://ik.imagekit.io/adamsilen/{{ photo.image }}"
       class="main-img" alt="{{ photo.description }}" loading="lazy" decoding="async" data-src="https://ik.imagekit.io/adamsilen/{{ photo.image }}?tr=w-600,q-60">
</div>

  {% endfor %}
</div>

<div id="lightbox" class="lightbox">
  <button class="close">&times;</button>
  <button class="prev">&larr;</button>
  <button class="next">&rarr;</button>
  <div class="lightbox-content">
    <img class="preview-img" src="" alt="">
    <img class="full-img" src="" alt="">
    <div class="photo-info">
      <div class="photo-date"></div>
      <p class="photo-description"></p>
    </div>
  </div>
</div>


<a class="nav" href="{{ site.baseurl }}/">« {{ site.theme_config.back_home_text }}</a>

<script src="https://unpkg.com/masonry-layout@4/dist/masonry.pkgd.min.js"></script>
<script src="https://unpkg.com/imagesloaded@5/imagesloaded.pkgd.min.js"></script>