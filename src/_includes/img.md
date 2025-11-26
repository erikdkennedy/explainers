<figure class="post__figure">
{%- if link -%}<a href="{{ link }}" target="_blank">{%- endif -%}
{%- if src contains '.mp4' -%}
<video src="/assets/img/{{ img_subdir }}/{{ src }}"{%- if width -%} width="{{ width }}"{%- endif -%}{%- if alt -%} alt="{{ alt }}"{%- endif -%} autoplay loop muted playsinline></video>
{%- else -%}
<img src="/assets/img/{{ img_subdir }}/{{ src }}"{%- if width -%} width="{{ width }}"{%- endif -%}{%- if alt -%} alt="{{ alt }}"{%- endif -%} />
{%- endif -%}
{%- if link -%}</a>{%- endif -%}
{%- if caption -%}<figcaption class="post__figcaption">{{ caption }}</figcaption>{%- endif -%}
</figure>