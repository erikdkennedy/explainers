<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ title }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/scss/quantum.css">
  </head>
  <body class="post-grid">
    {% include site-top-nav.md %}
    <header>
        <div class="header__text">
            <h1 class="post-title">{{ title }}</h1>
            <h2 class="post-subtitle">{{ subtitle }}</h2>
        </div>
    </header>
    <article>
        {%- if nutshell -%}
            <div class="nutshell">{{ nutshell }}</div>
            <hr class="full-width" />
        {%- endif -%}

        {%- if toc -%}{% include {{ toc }} %}{%- endif -%}
        
        <div class="post-body">    
            {{ content }}
        </div>
        
        {%- if js -%}
        {% assign js_list = js | split: ' ' %}
        {%- for name in js_list -%}
        <script defer src="/assets/js/{{ name }}.js"></script>
        {%- endfor -%}
        {%- endif -%}
    </article>
  </body>
</html>