# Clément Deleau, personal webpage

Live at https://clementdeleau.github.io/webpage/

Static site, no build step:

- `index.html`: home page content
- `optoelectronics.html`, `cleanroom.html`, `ai.html`: the three research pages
- `style.css`: shared styles (blue theme, page "warp" transition)
- `site.js`: hero scene tabs, About photo gallery, typed role line, background waves, publication filters, page transitions
- `voxel-lab.js`: the four 3D voxel scenes in the hero, three.js + OrbitControls (vendored in `vendor/`)
- `anim.js`: canvas animations on the research cards and page headers
- `img/`: photos (`og.jpg` is the link-preview image)

Edit, commit, and GitHub Pages republishes within a minute or two.

**Hero voxel scenes:** four three.js scenes in `voxel-lab.js` (`lab`, `clean`, `talk`, `ai`) cycle every few seconds with a cascade transition. Their tab names and captions are in the `window.SCENES` list near the bottom of `index.html`. `index.html?scene=talk` opens on one scene and stays there.

**Photos:** the About section gallery reads `window.PHOTOS` in `index.html`. Put a JPEG in `img/` (about 1400 px on the long side) and add a line:

```js
{ src: "img/cleanroom.jpg", alt: "In the cleanroom", pos: "50% 40%" },
```

`pos` is the focal point used when the photo is cropped.

**Add a publication:** copy one `<li class="card pub" ...>` block in the Publications section of `index.html` (`data-t` is `journal`, `conf` or `thesis`), and add it to the matching research page.
