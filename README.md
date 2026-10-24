# Powerpuff Gurls — Experimental AI Consultancy Website

A fully designed portable static website, with your **actual three optimized Meshy GLBs**, React-free vanilla JS interactions, a Three.js 3D stage, synthesized Web Audio sound effects, and a guided business-discovery inquiry flow. No build process required.

## Launch locally

Use a local server so `.glb` assets and ES modules load correctly:

```bash
python -m http.server 8080
```

Open http://localhost:8080. With internet access the browser can load the Three.js modules from jsDelivr and render the real GLB models. If WebGL/CDN is unavailable, the fallback character artwork and entire inquiry interface continue working. Do not open via `file://` and expect the 3D files to load.

## Deploy to Vercel

1. Place the whole `powerpuffgurls-site` folder in a Git repository.
2. In Vercel, Import Project → select repository.
3. **Framework Preset: Other**, root directory as this folder, **Build Command: empty**, **Output Directory: `.`** (project root). If your Vercel dashboard requires an output folder, deploy using the Vercel CLI (`vercel --prod`) with no framework build; or copy this folder into a `public` directory and configure it as the output.
4. Deploy and test HTTPS, 3D character loading, audio toggle and mobile navigation.

For the cleanest version-controlled deployment, `vercel.json` is included. No server runtime or secrets are needed for the static frontend.

## Upload using a conventional file manager / HTML host

Upload **the CONTENTS** of this directory (not the outer folder) into your website's `public_html` or document root:

- `index.html`
- `styles.css`
- `app.js`
- `three-stage.js`
- `config.js`
- `assets/` including `models/` and `images/`

The site is static HTML/CSS/JS. Keep the directory structure unchanged; paths are relative, and all pages/sections are anchors in `index.html`. These GLBs are about 7.4 MB combined rather than the original ~60 MB. The original GLBs are not modified.

**CDN note:** Three.js and two fonts currently load from public CDNs. Thus the site requires internet access for enhanced 3D rendering. The website itself (text/form/illustrations/scroll/sound) continues to work if the CDN is blocked. For fully self-hosted operation, download and serve compatible Three.js ES modules and update the import map in `index.html`.

## Business lead collection — must configure before going live

Open `config.js` and populate:

- `leadEndpoint`: Your secure HTTPS endpoint accepting JSON POST (e.g. a trusted serverless function, CRM webhook proxied through your own API).
- `contactEmail`: A verified recipient email. Enables a user-initiated email draft button.
- `bookingUrl`: Your real consultation-booking URL. Enables a booking button.

**Important:** All values start empty. Until configured, the guided business-diagnosis **DOES NOT send leads** anywhere. It shows a local, rules-based recommendation and gives the visitor Download Brief / Copy Summary actions, without claiming it was submitted. There is no real generative-AI consultation backend in this version. User-entered personal details are not persisted in browser storage by default. Never insert private API keys in `config.js`; host them behind a server-side endpoint.

## GLB animations and natural motion

All supplied exports contain a Mixamo skeleton with ONLY two clips: `Running`, `Walking`. This website implements continuous subtle procedural bob/sway, cursor-responsive head movement, and brief walking-on-selection. `Waving`, `Flying`, `Takeoff`, `Landing`, facial morphs, and speech lipsync require additional authored animations or bespoke rigs. We do not pretend those animation clips exist. For production-grade animation, author and export these in Blender, inspect root translation and retarget clips to each rig.

## Controls

- Sound is OFF by default and requires visitor activation (browser autoplay compliance). Synthesized tones create cyberpunk/arcade micro-interactions without external audio files.
- Supports `prefers-reduced-motion` and static 3D fallback.
- Click service or specialist cards to preselect a matching consultation goal.
- Close the floating mini-stage using × while scrolling.

## Checks

- Desktop & mobile layout.
- Keyboard focus states and reduced motion.
- Form validation and draft download.
- WebGL GLB renderer (requires browser internet to get Three.js from CDN).
- Privacy/consent and destination configuration.

## Commercial use / intellectual property

The experimental name `PowerpuffGurls.com` and cartoon-inspired mascot designs may raise third-party trademark/copyright issues. Review and replace with distinct, original branding/assets and secure necessary rights before public commercial launch.
