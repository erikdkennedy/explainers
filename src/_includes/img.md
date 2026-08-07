<figure class="post__figure">
    {%- if link -%}
    <a href="{{ link }}" target="_blank">
    {%- endif -%}
        {%- if src contains '.mp4' -%}
        {%- comment -%}
            Pass controls: true for a video the reader is meant to scrub rather than just
            watch. Encode those with a short GOP (see tools/wavefunction-studio/encode.sh)
            — the default single-GOP encode makes every backwards seek decode from frame 0.
        {%- endcomment -%}
        <video src="/assets/img/{{ img_subdir }}/{{ src }}" {%- if width -%} width="{{ width }}" {%- endif -%}{%- if alt
            -%} alt="{{ alt }}" {%- endif -%} autoplay loop muted playsinline{%- if controls %} controls{%- endif -%}></video>
        {%- else -%}
        <img src="/assets/img/{{ img_subdir }}/{{ src }}" {%- if width -%} width="{{ width }}" {%- endif -%}{%- if alt
            -%} alt="{{ alt }}" {%- endif -%} />
        {%- endif -%}
    {%- if link -%}
    </a>
    {%- endif -%}
    {%- if caption -%}<figcaption class="post__figcaption">{{ caption }}</figcaption>{%- endif -%}
    {%- if image-credit -%}<p class="image-credit">{{ image-credit }}</p>{%- endif -%}
</figure>