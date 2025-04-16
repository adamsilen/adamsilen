---
layout: home
description: 
imagekit_base_url: https://ik.imagekit.io/adamsilen/
title:
---

{% if page.title %}<h1>{{ page.title }}</h1>{% endif %}
{% if page.description %}<p>{{ page.description }}</p>{% endif %}

<div class="photo-grid-flex">

  {% assign sorted_photos = site.data.photos | sort: 'date' | reverse %}
  {% for photo in sorted_photos %}

    {% assign photo_date_formatted = photo.date | date: '%-d %B %Y' | replace:'January','januari' | replace:'February','februari' | replace:'March','mars' | replace:'April','april' | replace:'May','maj' | replace:'June','juni' | replace:'July','juli' | replace:'August','augusti' | replace:'September','september' | replace:'October','oktober' | replace:'November','november' | replace:'December','december' %}
    {% assign caption_text = photo.description | prepend: ' &ndash; ' | prepend: photo_date_formatted %}

    {% assign imagekit_full_path = page.imagekit_base_url | append: photo.image %}

    {% assign thumb_url = imagekit_full_path | append: "?tr=w-400,q-auto,f-auto" %}
    {% assign large_url = imagekit_full_path | append: "?tr=w-1600,h-1600,c-at_max,q-auto,f-auto" %}

    <a href="{{ large_url }}"
       data-fancybox="gallery"
       data-caption="{{ caption_text | escape }}"
       class="photo-item-flex">
      <img src="{{ thumb_url }}"
           alt="{{ photo.description | escape }}"
           class="main-img"
           loading="lazy">
    </a>

  {% endfor %}
</div>
