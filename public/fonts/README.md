# Be Vietnam Pro

Self-hosted Be Vietnam Pro assets in two formats.

The game UI loads ten WOFF2 subset pairs: five weights, each split into a Latin
and a Vietnamese file and scoped with `unicode-range` in
`src/styles/fonts.css`. The server-rendered Open Graph image keeps the five
full-charset TrueType faces because Takumi renders from SFNT data.

## UI WOFF2 subsets

The ten WOFF2 files are the Google Fonts Latin and Vietnamese subsets for the
Be Vietnam Pro 1.0083 family build, fetched from the Google Fonts CSS API v2:

`https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap`

They carry the `BeVietnamPro-*` PostScript names and report version 1.0083, the
same family version as the TTF faces below.

| Weight | Subset | Repository file | SHA-256 |
| --- | --- | --- | --- |
| 400 | Latin | `be-vietnam-pro-400-latin.woff2` | `03d1b589cff172e1a670b3573e731d3380bc326f80cf83b0d3504e3188e2e074` |
| 400 | Vietnamese | `be-vietnam-pro-400-vietnamese.woff2` | `dc085e2fba3414e5c5bf1e6172f921a9f81c5859946a4ed3d63c1e470d96a9e2` |
| 500 | Latin | `be-vietnam-pro-500-latin.woff2` | `a87c248b3b6f67a6f83f213ef2f5a570a97f3d98418fd87c6da672938607ceca` |
| 500 | Vietnamese | `be-vietnam-pro-500-vietnamese.woff2` | `856e328c3cfb5912799ed2ef2cca3e3c597f4ed2dd57844ad22ee1b423ff85e8` |
| 600 | Latin | `be-vietnam-pro-600-latin.woff2` | `d928c31789fd105be223f001720aeadaabd2406b79987c1030c891aa2af00b63` |
| 600 | Vietnamese | `be-vietnam-pro-600-vietnamese.woff2` | `f64c28070cc98dd1a7e087aecacaa80b88fac47cb7ee28a2266777bb2f89a4d6` |
| 700 | Latin | `be-vietnam-pro-700-latin.woff2` | `a193dd87699bd2e18ddf72dc271493ea82a23dad9f5c334d9f2a257b1e05fc30` |
| 700 | Vietnamese | `be-vietnam-pro-700-vietnamese.woff2` | `4f58af2d1c3e28a9ba14c51c82db2751d78344b75bdcb34de24a1031ebe59da6` |
| 800 | Latin | `be-vietnam-pro-800-latin.woff2` | `63fc13e26c32fd739477f4f04db2927b6cee73a02f874522e61522d7a51350e3` |
| 800 | Vietnamese | `be-vietnam-pro-800-vietnamese.woff2` | `1ff170b6c0a4bd05526a36154555f46a91566005a37e20ade2cda4a7287e5926` |

## OG TTF faces

All five files come from the same Google Fonts family download
(`Be_Vietnam_Pro.zip`, 2025-09-09 build, archive SHA-256
`face57846cbffec56f8ade07a43f130349b13f2edfd2c6e88ff8a9b44af9e91c`). The
archive keeps the original filenames:

| Weight | Repository file | Archive file | SHA-256 |
| --- | --- | --- | --- |
| 400 | `be-vietnam-pro-regular.ttf` | `BeVietnamPro-Regular.ttf` | `cb6f53d6fd56316356c55b067474d9621c27b7182b124063b8f6eab6acef63bd` |
| 500 | `be-vietnam-pro-medium.ttf` | `BeVietnamPro-Medium.ttf` | `f493144cb53c78c6f0819bc9b73de274486618ac609bc92b3b79d4efc76f95c6` |
| 600 | `be-vietnam-pro-semibold.ttf` | `BeVietnamPro-SemiBold.ttf` | `04db63d2a82dd4bb35ba25e00dab1d12febcd0e917856b174b71a24d6f0c9afa` |
| 700 | `be-vietnam-pro-bold.ttf` | `BeVietnamPro-Bold.ttf` | `2fe6c3f9dbb65f61554d530c16b2eb4ec32ca437dc8f9999a6ec0f6403b30bfe` |
| 800 | `be-vietnam-pro-extrabold.ttf` | `BeVietnamPro-ExtraBold.ttf` | `10fcb42b9cee8e30918843416676ae059e8f77fe439d0c3a4350617ef9f77a75` |

Only the OG route reads these TTF files; the UI never requests them.

All faces report family version 1.0083 and the same 1000 unit em metrics.
Licensed under the SIL Open Font License 1.1; see `OFL.txt`.
