---
layout: null
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Explainers</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;700&family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/scss/home.css">
  </head>
  <body>
    {% include site-top-nav.md %}
    <div class="posts">
      {% assign sorted_posts = collections.posts | sort: "data.published_on" | where: "data.published", true | reverse %}
      {% for post in sorted_posts %}
        <div class="post">
          <a href="{{ post.url }}">
            <div class="post-wrapper">
              <div class="post-image">
                {%- assign img_ext = post.data.img_on_homepage | split: '.' | last -%}
                {%- if img_ext == 'html' -%}
                  {% include {{ post.data.img_on_homepage }} %}
                {%- else -%}
                  {%- if post.data.video_on_homepage -%}
                    {%- assign vid_ext = post.data.video_on_homepage | split: '.' | last -%}
                    <video class="post-video"
                           poster="/assets/img/{{ post.data.img_subdir }}/{{ post.data.img_on_homepage }}"
                           playsinline muted loop autoplay preload="metadata">
                      <source src="/assets/img/{{ post.data.img_subdir }}/{{ post.data.video_on_homepage }}"
                              type="video/{{ vid_ext }}">
                    </video>
                    <noscript>
                      <img src="/assets/img/{{ post.data.img_subdir }}/{{ post.data.img_on_homepage }}" alt="">
                    </noscript>
                  {%- else -%}
                    <img src="/assets/img/{{ post.data.img_subdir }}/{{ post.data.img_on_homepage }}" alt="">
                  {%- endif -%}
                {%- endif -%}
              </div>
              <div class="post-text">
                <h2 class="post-title">{{ post.data.title }}</h2>
                <p class="post-subtitle">{{ post.data.subtitle }}</p>
                <p class="post-date mono">{{ post.data.published_on | date: "%b %Y" }}</p>
              </div>
            </div>
          </a>
        </div>
      {% endfor %}
    </div>
  </body>
</html>


