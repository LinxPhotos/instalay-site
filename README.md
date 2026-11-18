# InstaLay website (SolidStart)

Static documentation shell for GitHub Pages. **Checkout and license status live on [linx.photos](https://linx.photos/apps/instalay).**

```bash
pnpm install
pnpm dev
pnpm build
```

**Site URL:** https://instalay.linx.photos/

GitHub Pages serves this site on the custom domain in `public/CNAME`. CI sets `GITHUB_PAGES_BASE=/`. The old project path `https://linxphotos.github.io/InstaLay/` is not this site — download and docs live at `https://instalay.linx.photos/download` and `https://instalay.linx.photos/docs`.

Canonical pricing page: `/docs/pricing` (buy CTAs → `https://linx.photos/apps/instalay`). Legacy `/buy` redirects there (or straight to Linx when `?plan=` is set). Nav **Login** → `https://linx.photos/login?next=/account/instalay`.

Nested routes must use a folder + `index.tsx` (e.g. `routes/buy/index.tsx` + `routes/buy/success.tsx`). A sibling `buy.tsx` becomes a layout and leaves `/buy` blank if there is no index.

## Changelog

See [CHANGELOG.adoc](CHANGELOG.adoc).
