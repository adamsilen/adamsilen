---
layout: home
description:
imagekit_base_url: https://ik.imagekit.io/adamsilen/
title: Adam Silén
custom_js:
  - theme-toggle
  - photo-nav
---

<div class="w">
  {% if page.title %}<h1>{{ page.title }}</h1>{% endif %}
  {% if page.description %}<p>{{ page.description }}</p>{% endif %}
</div>

{% assign sorted_photos = site.data.photos | sort: 'date' | reverse %}

{% comment %} Build a list of unique YYYY-MM months in order {% endcomment %}
{% assign all_months = "" %}
{% for photo in sorted_photos %}
  {% assign ym = photo.date | date: '%Y-%m' %}
  {% unless all_months contains ym %}
    {% if all_months == "" %}
      {% assign all_months = ym %}
    {% else %}
      {% assign all_months = all_months | append: ',' | append: ym %}
    {% endif %}
  {% endunless %}
{% endfor %}
{% assign months_array = all_months | split: ',' %}

{% comment %} Build a sorted unique list of all tags {% endcomment %}
{% assign all_tags = "" %}
{% for photo in sorted_photos %}
  {% for tag in photo.tags %}
    {% unless all_tags contains tag %}
      {% if all_tags == "" %}
        {% assign all_tags = tag %}
      {% else %}
        {% assign all_tags = all_tags | append: ',' | append: tag %}
      {% endif %}
    {% endunless %}
  {% endfor %}
{% endfor %}
{% assign tags_array = all_tags | split: ',' | sort %}

{% comment %} Build months JSON for JS {% endcomment %}
<script>
  window.PHOTO_MONTHS = [
    {% for ym in months_array %}
      {% assign parts = ym | split: '-' %}
      {% assign y = parts[0] %}
      {% assign fake_date = ym | append: '-01' %}
      {% assign month_name = fake_date | date: '%B' | replace:'January','januari' | replace:'February','februari' | replace:'March','mars' | replace:'April','april' | replace:'May','maj' | replace:'June','juni' | replace:'July','juli' | replace:'August','augusti' | replace:'September','september' | replace:'October','oktober' | replace:'November','november' | replace:'December','december' %}
      { "id": "{{ ym }}", "label": "{{ month_name }} {{ y }}", "year": "{{ y }}" }{% unless forloop.last %},{% endunless %}
    {% endfor %}
  ];
</script>

<div class="photo-list" id="photo-list">

  {% assign prev_ym = "" %}
  {% for photo in sorted_photos %}

    {% assign ym = photo.date | date: '%Y-%m' %}
    {% assign photo_date_formatted = photo.date | date: '%-d %B %Y' | replace:'January','januari' | replace:'February','februari' | replace:'March','mars' | replace:'April','april' | replace:'May','maj' | replace:'June','juni' | replace:'July','juli' | replace:'August','augusti' | replace:'September','september' | replace:'October','oktober' | replace:'November','november' | replace:'December','december' %}
    {% assign imagekit_full_path = page.imagekit_base_url | append: photo.image %}
    {% assign large_url = imagekit_full_path | append: "?tr=w-1400,h-1400,c-at_max,q-99,f-auto" %}

    {% if ym != prev_ym %}
      <div id="month-{{ ym }}" class="month-anchor"></div>
      {% assign prev_ym = ym %}
    {% endif %}

    <div class="photo-item"
         data-tags="{{ photo.tags | join: ',' }}"
         data-month="{{ ym }}">
      <img data-src="{{ large_url }}"
           src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
           alt="{{ photo.description | escape }}"
           class="photo-img lazy-image"
           width="800"
           height="800">
      <div class="photo-caption">
        <span class="photo-date">{{ photo_date_formatted }}</span> –
        <span class="photo-description">{{ photo.description }}</span>
        {% if photo.tags %}
          <span class="photo-tags">
            {% for tag in photo.tags %}
              <a class="photo-tag" href="?tag={{ tag }}">{{ tag }}</a>{% unless forloop.last %} {% endunless %}
            {% endfor %}
          </span>
        {% endif %}
      </div>
    </div>

  {% endfor %}
</div>

<div id="nav-bar">

  {% comment %} Tag navigator {% endcomment %}
  <div id="tag-nav" aria-label="Taggfilter">
    <button id="tag-label" aria-haspopup="listbox" aria-expanded="false">
      <span id="tag-label-text">filtrera</span>
    </button>
    <button id="tag-clear" aria-label="Rensa taggfilter" hidden>&#x2715;</button>

    <div id="tag-dropdown" role="listbox" hidden>
      {% for tag in tags_array %}
        <button class="tag-option" data-tag="{{ tag }}" role="option" aria-selected="false">{{ tag }}</button>
      {% endfor %}
    </div>
  </div>

  {% comment %} Month navigator {% endcomment %}
  <div id="month-nav" aria-label="Månadsnavigation">
    <button id="month-label" aria-haspopup="listbox" aria-expanded="false">
      <span id="month-label-text">–</span>
    </button>

    <div id="month-dropdown" role="listbox" hidden>
      {% assign prev_year = "" %}
      {% for ym in months_array %}
        {% assign parts = ym | split: '-' %}
        {% assign y = parts[0] %}
        {% assign fake_date = ym | append: '-01' %}
        {% assign month_name = fake_date | date: '%B' | replace:'January','januari' | replace:'February','februari' | replace:'March','mars' | replace:'April','april' | replace:'May','maj' | replace:'June','juni' | replace:'July','juli' | replace:'August','augusti' | replace:'September','september' | replace:'October','oktober' | replace:'November','november' | replace:'December','december' %}

        {% if y != prev_year %}
          {% unless prev_year == "" %}</div>{% endunless %}
          <div class="month-year-group">
          <span class="month-year-label">{{ y }}</span>
          {% assign prev_year = y %}
        {% endif %}

        <button class="month-option" data-month="{{ ym }}" role="option">{{ month_name }}</button>

        {% if forloop.last %}</div>{% endif %}
      {% endfor %}
    </div>
  </div>

</div>
