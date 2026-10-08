# Clément Deleau, personal webpage

Live at https://clementdeleau.github.io/webpage/

Static site, no build step:

- `index.html`: home page content
- `optoelectronics.html`, `cleanroom.html`, `ai.html`: the three research pages
- `style.css`: shared styles (blue theme, page "warp" transition)
- `site.js`: hero slideshow, typed role line, background waves, publication filters, page transitions
- `voxel-lab.js`: the two 3D voxel scenes in the hero ("lab" and "ai"), three.js + OrbitControls (vendored in `vendor/`)
- `anim.js`: canvas animations on the research cards and page headers
- `img/`: photos (`og.jpg` is the link-preview image)

Edit, commit, and GitHub Pages republishes within a minute or two.

**Hero slideshow:** edit the `window.SLIDES` list near the bottom of `index.html`. Entries are either a voxel scene or a photo:

```js
{ voxel: "ai", label: "LIVE · training a neural network", hold: 10000 },
{ src: "img/cleanroom.jpg", label: "CLEANROOM", pos: "50% 40%" },
```

`pos` is the focal point used when the photo is cropped to the 4:3 frame, `hold` is how long the slide stays (ms). `index.html?slide=2` opens the hero on a given slide.

**Add a publication:** copy one `<li class="card pub" ...>` block in the Publications section of `index.html` (`data-t` is `journal`, `conf` or `thesis`), and add it to the matching research page.
