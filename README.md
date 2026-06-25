# lbk-time-camera

![logo](./public/android-chrome-192x192.png)

Pick an area of Lubbock on the map and watch it change over the years — then download a timelapse video to keep or share.

Uses the City of Lubbock's [aerial imagery service](https://pubgis.ci.lubbock.tx.us/server/rest/services/Imagery) - high-resolution (~6.5cm/pix) imagery captured across multiple years, made available by the City of Lubbock [GIS & Data Services Department](https://www.mylubbock.us/318/GIS-Data-Services).

## Contributing

Contributions, bug reports, and feature ideas are welcome. Open an issue or pull request at [github.com/2600-lbk/lbk-time-camera](https://github.com/2600-lbk/lbk-time-camera). If you have a suggestion but don't want to write code, an issue with a description is just as valuable.

## How it works

1. The user draws a box or circle on an OpenStreetMap base map centered on Lubbock.
2. The selection is validated (max ~300m in any dimension) and expanded to match the chosen output aspect ratio.
3. For each of the 11 available imagery years, the app requests a high-resolution export from the City's ArcGIS ImageServer using `ol/source/ImageArcGISRest`. Images are fetched in parallel with a concurrency limit of 3 to be kind to the City's servers.
4. Each frame is rendered to an HTML Canvas: the aerial image is drawn first, then a dark vignette overlay highlights the selected area, then a configurable year label and a small `lbk-time-camera` watermark are drawn on top.
5. Frames are sequenced into a video using the browser's built-in APIs.
6. The result can be saved as a video or as a ZIP of individual PNG frames.

The app is entirely front-end — no server component. It can be served as a static site (e.g. GitHub Pages).

## Getting started

```bash
git clone https://github.com/2600-lbk/lbk-time-camera.git
cd lbk-time-camera
npm install
npm run dev
```

Open the local URL shown in the terminal. To test on another device on your network, pass `--host`:

```bash
npm run dev -- --host
```

To build for production:

```bash
npm run build
npm run preview   # serve the built output locally
```

**Stack:** Vue 3 + TypeScript + Vite. Source is in `src/` — composables handle map drawing (`useMapDraw`), image fetching (`useImageFetch`), frame rendering (`useFrameRenderer`), and video encoding (`useVideoEncoder`).
