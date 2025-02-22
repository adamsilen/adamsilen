---
layout: page
title: Fotat
---
<div class="photo-grid full">
  {% assign sorted_photos = site.data.photos | sort: 'date' | reverse %}
  {% for photo in sorted_photos %}
    <div class="photo-item" 
         data-url="https://ik.imagekit.io/adamsilen/{{ photo.image }}?tr=w-2000,h-2000,c-maintain_ratio" 
         data-date="{{ photo.date | date: '%-d %B %Y' | replace:'January','januari' | replace:'February','februari' | replace:'March','mars' | replace:'April','april' | replace:'May','maj' | replace:'June','juni' | replace:'July','juli' | replace:'August','augusti' | replace:'September','september' | replace:'October','oktober' | replace:'November','november' | replace:'December','december'}}"
         data-description="{{ photo.description }}">
      <img src="https://ik.imagekit.io/adamsilen/{{ photo.image }}?tr=w-400,h-400" 
           alt="{{ photo.description }}" 
           loading="lazy">
    </div>
  {% endfor %}
</div>

<div id="lightbox" class="lightbox">
  <button class="close">&times;</button>
  <button class="prev">&larr;</button>
  <button class="next">&rarr;</button>
  <div class="lightbox-content">
    <img src="" alt="">
    <div class="photo-info">
      <div class="photo-date"></div>
      <p class="photo-description"></p>
    </div>
  </div>
</div>
