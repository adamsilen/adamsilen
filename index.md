---
layout: home
description:
imagekit_base_url: https://ik.imagekit.io/adamsilen/
title: Adam Silén
---

<div class="w">
  {% if page.title %}<h1>{{ page.title }}</h1>{% endif %}
  {% if page.description %}<p>{{ page.description }}</p>{% endif %}
</div>

<div class="photo-list">

  {% assign sorted_photos = site.data.photos | sort: 'date' | reverse %}
  {% for photo in sorted_photos %}

    {% assign photo_date_formatted = photo.date | date: '%-d %B %Y' | replace:'January','januari' | replace:'February','februari' | replace:'March','mars' | replace:'April','april' | replace:'May','maj' | replace:'June','juni' | replace:'July','juli' | replace:'August','augusti' | replace:'September','september' | replace:'October','oktober' | replace:'November','november' | replace:'December','december' %}
    {% assign imagekit_full_path = page.imagekit_base_url | append: photo.image %}
    {% assign large_url = imagekit_full_path | append: "?tr=w-1200,h-1200,c-at_max,q-99,f-auto" %}

    <div class="photo-item">
      <img data-src="{{ large_url }}"
           src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
           alt="{{ photo.description | escape }}"
           class="photo-img lazy-image"
           width="800"
           height="800">
      <div class="photo-caption">
        <span class="photo-date">{{ photo_date_formatted }}</span> – <span class="photo-description">{{ photo.description }}</span>
      </div>
    </div>

  {% endfor %}
</div>

