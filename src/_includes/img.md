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
            -%} aria-label="{{ alt }}" {%- endif -%} autoplay loop muted playsinline{%- if controls %} controls{%- endif -%}></video>
        {%- else -%}
        {%- comment -%}
            The .webp is written next to the original by tools/webp at build time and is
            offered first. It is a <source>, not a swap, so a raster that WebP could not
            actually shrink has no .webp on disk, no <source> matches, and the original is
            served — the markup cannot outrun the converter.
        {%- endcomment -%}
        {%- assign webp_src = src | split: "." | first | append: ".webp" -%}
        <picture>
            <source srcset="/assets/img/{{ img_subdir }}/{{ webp_src }}" type="image/webp">
            <img loading="lazy" decoding="async" src="/assets/img/{{ img_subdir }}/{{ src }}" {%- if width -%} width="{{ width }}" {%- endif -%}{%- if alt
                -%} alt="{{ alt }}" {%- endif -%} />
        </picture>
        {%- endif -%}
    {%- if link -%}
    </a>
    {%- endif -%}
    {%- if caption -%}<figcaption class="post__figcaption">{{ caption }}</figcaption>{%- endif -%}
    {%- if image-credit -%}<p class="image-credit">{{ image-credit }}</p>{%- endif -%}
</figure>