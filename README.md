# Clément Deleau, personal webpage

Live at https://clementdeleau.github.io/webpage/

Static site, no build step:

- `index.html`: all content and styles
- `site.js`: hero slideshow, typed role line, background waves, publication filters
- `voxel-lab.js`: the animated 3D voxel lab scene in the hero (three.js, vendored in `vendor/`)
- `img/`: photos used in the hero slideshow

Edit, commit, and GitHub Pages republishes within a minute or two.

**Add or change hero photos:** put a JPEG in `img/` (about 1400 px on the long side) and add a line to the `window.PHOTOS` list near the bottom of `index.html`:

```js
{ src: "img/cleanroom.jpg", label: "CLEANROOM · e-beam lithography", pos: "50% 40%" },
```

`pos` is the focal point used when the photo is cropped to the 4:3 frame.

**Add a publication:** copy one `<li class="card pub" ...>` block in the Publications section. `data-t` is `journal`, `conf` or `thesis` for the filter buttons.
