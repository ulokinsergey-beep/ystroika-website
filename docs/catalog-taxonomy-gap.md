# Catalog Taxonomy Gap

Date: 2026-06-04

Source architecture: `C:\Projects\SiteCatalogStructure\data\catalog-structure.json`

Current project: `C:\Projects\ystroika-website`

## Summary

The current site already has a real catalog data layer, but its slugs and URL model do not fully match the newer Google Sheet architecture.

This is not a reason to rewrite everything immediately. The safe route is to create a slug mapping layer first.

## Numbers

Target architecture:

- Categories: 8
- Subcategories: 80

Current Astro project:

- Categories in `src/data/categories.ts`: 8
- Subcategories in `src/data/categories.ts`: 18
- JSON catalog subcategory files: 28

Direct slug matches between target architecture and current JSON catalog:

- `krovlya/profnastil`
- `fasad/fasadnye-paneli`
- `fasad/fasadnaya-plitka`

Only 3 direct matches were found, but this is mostly because names/slugs differ.

Examples:

- target: `krovlya/metallocherepica`
- current: `krovlya/metallocherepitsa`

- target: `krovlya/falcevaya-krovlya`
- current: `krovlya/faltsevaya`

- target: `vodostok/metallicheskie-vodostochnye-sistemy`
- current: `vodostok/metallicheskiy-vodostok`

- target: `fasad/sayding-metallicheskiy`
- current: `fasad/metallicheskiy-sayding`

- target: `komplektuyuschie`
- current: `komplektuyushchie`

- target: `blagoustroystvo-uchastka`
- current: `blagoustrojstvo`

- target: `uteplenie-i-izolyaciya`
- current: `uteplenie`

- target: `ventilyaciya`
- current: `ventilyatsiya`

## Current JSON Catalog Files

Current site has JSON data for these subcategories:

- `blagoustrojstvo/ograzhdenie`
- `blagoustrojstvo/terrasa`
- `fasad/fasadnaya-plitka`
- `fasad/fasadnye-paneli`
- `fasad/fibrocementnyy-sayding`
- `fasad/metallicheskiy-sayding`
- `fasad/termopaнели`
- `fasad/vinilovyy-sayding`
- `komplektuyushchie/germetiki`
- `komplektuyushchie/krepezh`
- `komplektuyushchie/plenki`
- `krovlya/cherepitsa-braas`
- `krovlya/faltsevaya`
- `krovlya/gibkaya-cherepitsa`
- `krovlya/komplektuyushchie-krovli`
- `krovlya/kompozitnaya-cherepitsa`
- `krovlya/metallocherepitsa`
- `krovlya/profnastil`
- `krovlya/rulonnye-materialy`
- `ograzhdeniya/vorota`
- `ograzhdeniya/zabory`
- `uteplenie/fanera`
- `uteplenie/mineralnaya`
- `uteplenie/osb`
- `ventilyatsiya/aeratory`
- `ventilyatsiya/mansardnye`
- `vodostok/metallicheskiy-vodostok`
- `vodostok/plastikovy-vodostok`

## Risk

If we rename slugs immediately:

- existing local routes can break;
- product JSON paths can break;
- links in components can break;
- search engines can see duplicate or moved pages without redirects;
- current pixel-perfect catalog work can be damaged.

## Recommended Decision

Keep current working URLs for now.

Add a mapping layer:

```text
target taxonomy slug -> current site slug
```

Then decide per category:

1. Keep current slug as canonical.
2. Add alias/redirect from target slug.
3. Rename only after redirects and data paths are ready.

## Next Implementation Step

Create `src/data/catalogSlugMap.ts`.

It should map the high-priority differences first:

- `metallocherepica` -> `metallocherepitsa`
- `falcevaya-krovlya` -> `faltsevaya`
- `rulonnye-krovelnye-materialy` -> `rulonnye-materialy`
- `metallicheskie-vodostochnye-sistemy` -> `metallicheskiy-vodostok`
- `plastikovye-vodostochnye-sistemy` -> `plastikovy-vodostok`
- `sayding-metallicheskiy` -> `metallicheskiy-sayding`
- `sayding-vinilovyy` -> `vinilovyy-sayding`
- `sayding-fibrocementyy` -> `fibrocementnyy-sayding`
- `fasadnye-termopaneli` -> `termopaнели`
- `komplektuyuschie` -> `komplektuyushchie`
- `blagoustroystvo-uchastka` -> `blagoustrojstvo`
- `uteplenie-i-izolyaciya` -> `uteplenie`
- `ventilyaciya` -> `ventilyatsiya`

After that, add redirects or canonical logic, not both blindly.
