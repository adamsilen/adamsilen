---
layout: home
description:
---
<ul class="page-links">
{% if site.pages %}
{% assign pages_with_order = site.pages | where_exp: "page", "page.order != nil" | sort: 'order' %}
{% assign pages_without_order = site.pages | where_exp: "page", "page.order == nil" | sort: 'title' %}
{% assign sorted_pages = pages_with_order | concat: pages_without_order %}
  {% for page in sorted_pages %}
    <li><a href="{{ page.url | relative_url }}">{{ page.title }}</a></li>
  {% endfor %}
  {% endif %}
</ul>



<!-- HOME PAGE RECENT GALLERY

{% if site.data.photos %}
<div class="photo-grid recent">
  {% assign recent_photos = site.data.photos | sort: 'date' | reverse %}
  {% assign limit_photos = 9 %}
  {% for photo in recent_photos limit: limit_photos %}
<div class="photo-item" 
     data-url="https://ik.imagekit.io/adamsilen/{{ photo.image }}?tr=q-60" 
     data-date="{{ photo.date | date: '%-d %B %Y' | replace:'January','januari' | replace:'February','februari' | replace:'March','mars' | replace:'April','april' | replace:'May','maj' | replace:'June','juni' | replace:'July','juli' | replace:'August','augusti' | replace:'September','september' | replace:'October','oktober' | replace:'November','november' | replace:'December','december'}}"
     data-description="{{ photo.description }}">
  
  <img src="https://ik.imagekit.io/adamsilen/{{ photo.image }}?tr=bl-90,q-1"
      class="preview-img" 
      alt="">
  
  <img src="https://ik.imagekit.io/adamsilen/{{ photo.image }}?tr=q-60" 
       data-src="https://ik.imagekit.io/adamsilen/{{ photo.image }}?tr=w-600,q-60" 
       class="main-img" alt="{{ photo.description }}" loading="lazy" decoding="async">
</div>

  {% endfor %}
</div>

<div class="more-link"><a class="nav" href="/fotat/">Mer fotat »</a></div>

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



{% endif %}

HOME PAGE RECENT GALLERY -->

<div class="photo-grid full">
  {% assign sorted_photos = site.data.photos | sort: 'date' | reverse %}
  {% for photo in sorted_photos %}
<div class="photo-item" 
     data-url="https://ik.imagekit.io/adamsilen/{{ photo.image }}?tr=q-60" 
     data-date="{{ photo.date | date: '%-d %B %Y' | replace:'January','januari' | replace:'February','februari' | replace:'March','mars' | replace:'April','april' | replace:'May','maj' | replace:'June','juni' | replace:'July','juli' | replace:'August','augusti' | replace:'September','september' | replace:'October','oktober' | replace:'November','november' | replace:'December','december'}}"
     data-description="{{ photo.description }}">
  <img src="https://ik.imagekit.io/adamsilen/{{ photo.image }}?tr=bl-90,q-1" 
       class="preview-img" alt="">
  <img src="https://ik.imagekit.io/adamsilen/{{ photo.image }}?tr=q-60"
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

<script src="https://unpkg.com/masonry-layout@4/dist/masonry.pkgd.min.js"></script>
<script src="https://unpkg.com/imagesloaded@5/imagesloaded.pkgd.min.js"></script>


<!--
---

 <h2>Skrivet</h2>
<ul class="post-list">
  {% for post in site.posts limit:2 %}
    <li>
        <span class="post-date">{{ post.date | date: "%-d %B %Y" | replace:'January','januari' | replace:'February','februari' | replace:'March','mars' | replace:'April','april' | replace:'May','maj' | replace:'June','juni' | replace:'July','juli' | replace:'August','augusti' | replace:'September','september' | replace:'October','oktober' | replace:'November','november' | replace:'December','december' }}</span>
        <a class="post-list-title" href="{{ post.url | relative_url }}">{{ post.title }}</a>
      {% if post.excerpt != post.content %}
        <p class="excerpt">
          {{ post.excerpt }}
        </p>
      {% endif %}
    </li>
  {% endfor %}
</ul>

<div class="more-link"><a class="nav" href="/skrivet/">Mer skrivet »</a></div> -->