# Lez Basin Crop Water Use: viewer

A static, no-build web viewer presenting one year (2018) of satellite-derived
water-use analysis for the Lez basin around Montpellier, France. MSc research,
IHE Delft Institute for Water Education, Group 2.

The site has two pages today (`index.html` story + `about.html` methods) and
an early-stage interactive map (`viewer.html`). All content is bilingual
(English + French) and switchable via the header toggle.

## View it locally

The viewer is plain static HTML/CSS/JS; no build step. **But** it needs an
HTTP server with **Range request support** so the PMTiles vector overlay can
stream tiles. Python's stock `http.server` does NOT support Range; we ship a
small drop-in replacement:

```sh
cd viewer
python serve.py            # defaults to port 8765
# or: python serve.py 8080
```

Open <http://127.0.0.1:8765/> in a modern browser (Chrome / Firefox / Safari /
Edge, recent versions). Older browsers are redirected to `unsupported.html`.

## Editing content

For copy edits (story text, captions, about page, citation block):

| File                              | What it controls                                |
|-----------------------------------|-------------------------------------------------|
| `content/site.en.yml` / `.fr.yml` | Site title, navigation, attribution, viewer UI strings |
| `content/story.en.md` / `.fr.md`  | Each scrollable story section (frontmatter + body) |
| `content/about.en.md` / `.fr.md`  | Methods, data sources, citation, license       |
| `content/findings.yml`            | Numeric values referenced from story prose with `{{ findings.* }}` |

A story section's frontmatter sets its title, label, and visual type
(`image`, `chart`, `pie_pair`, `image_gallery`, `none`). The body below is
markdown.

**Translation:** every translatable string lives in a per-language file
(`*.en.yml` / `*.en.md` and `*.fr.yml` / `*.fr.md`); the JS never hardcodes
language. To edit French copy, edit only the `.fr.*` files; the English
versions stay untouched. Adding a third language is a copy of the four
content files plus an entry in `content/languages.yml`.

## Deploying

GitHub Pages: enable Pages on this repository and set the source to the
branch + root directory containing this `viewer/` folder (or move the
contents to the repo root). The `.nojekyll` file disables Jekyll
preprocessing so our `*.md` content files are served raw rather than
rendered as Jekyll pages.

After every deployment, bump `CACHE_VERSION` in `sw.js` so returning users
see the new release rather than the cached one.

## License

Code: MIT (`LICENSE`). Content (text, figures, captions): CC BY 4.0
(`LICENSE-CONTENT`). Underlying datasets retain their original licenses; see
the about page for full attributions.
