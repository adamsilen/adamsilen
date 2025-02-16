---
layout: home
description:
---
<ul class="page-links">
{% assign pages_with_order = site.pages | where_exp: "page", "page.order != nil" | sort: 'order' %}
{% assign pages_without_order = site.pages | where_exp: "page", "page.order == nil" | sort: 'title' %}
{% assign sorted_pages = pages_with_order | concat: pages_without_order %}
  {% for page in sorted_pages %}
    <li><a href="{{ page.url | relative_url }}">{{ page.title }}</a></li>
  {% endfor %}
</ul>


<ul class="post-list">
  {% for post in site.posts limit:3 %}
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

<div class="more-link"><a class="nav" href="/posts/">Visa fler »</a></div>