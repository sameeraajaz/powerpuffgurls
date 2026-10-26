# PowerpuffGurls — Cinematic Website V4 (Review Build)

This is a **separate V4 release**; it does not overwrite the V3 project or your Cursor workspace.

## What's intentionally different

- Characters exist in one **full-viewport, transparent, persistent 3D scene**, not a mini-panel or bottom-right widget.
- The public **Wave / Fly / Land / Run / Bounce control strip is removed**.
- An editorial, dark-neon layout uses an oversized full-body 3D cast in the hero, a live three-character squad section, and directed moments in strategy, method and consultation sections.
- Scroll determines scene positions and continuous flight arcs. Character selections, hover proximity and section entrances trigger animations.
- A rail on the right navigates between major sections. The top gradient strip shows reading progress.
- Sound is opt-in. There are no character voices.
- Existing business inquiry wizard and non-AI rule-based diagnosis remain. **No production lead endpoint configured by default.**

## The 3D files

The web-ready assets in `assets/models` were produced from your updated Meshy Mixamo GLBs and have the same vertex counts, mesh bounds, skinning data, joints and named clips. Textures have been reduced from 4096px to 2304px for loading efficiency, **not remeshed**.

Available clips:
`Running`, `Walking`, `Dive_Down_and_Land_2`, `Jump_Rope`, `Leap_of_Faith`, `Wave_One_Hand`.

The first sampled Wave frame is used as a stable resting pose instead of exposing the bind pose. Extra vertical drift, floating and flight path movement is controlled by the website. During a scene change characters transition along the viewport without reloading their GLBs. Landing and gestures are approximate; clips do not have separate clean Idle/FlyLoop in the upload.

**Important:** This does not repair any bad underlying image-to-3D geometry or animation skin weights. To diagnose a character that still bends strangely, view the Meshy model in 360 degrees both *unrigged and rigged*, then preview every clip. If deformation exists there, fix/re-rig the source character before expecting browser rendering to solve it.

## Vercel — recommended

1. Upload the V4 project folder (or its ZIP) as a new Vercel project, **not over the current V3 project** until inspected.
2. Framework preset: `Other` (plain static with build step).
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Vercel installs `three@0.180.0`, and build script copies it locally into `dist/vendor`, along with all GLBs and site assets.
6. Open the staging link and test desktop and mobile. Sound must be explicitly enabled by the visitor.

The project includes `vercel.json` with the build command and output directory; don't configure conflicting manual settings.

## Conventional static hosting / file manager

On a computer with Node.js installed, open the extracted V4 project folder:

```powershell
npm install
npm run build
```

Upload **the contents of `dist`** to `public_html`. Do not upload `node_modules`. The site needs HTTPS for dependable browser support.

## Review checklist before replacing the live site

- The 3 GLB characters are clearly visible at the hero and physically move through the story as the page scrolls.
- No lower-right dock or public animation control strip appears.
- The squad section displays actual interactive 3D characters, not just still photos.
- Verify Buttercup's shape both when resting and during landing/waving. If she is warped, compare the same clip inside Meshy.
- Check mouse/scroll on desktop and positioning on a real mobile device.
- Check audio off by default, then enable SFX and test landing/hover/wave sounds.
- Try the business diagnosis form in demonstration mode. **Contact information is not submitted to a real endpoint unless `config.js` is configured.**
- Open `?debug3d=1` if the WebGL module or models do not appear; inspect developer console.

## Verification and limitations

- Verified: JavaScript syntax, GLB JSON/geometry/skins/animations, site element IDs and asset paths.
- Not verified: live WebGL visual playback in the tool environment; its browser blocks local navigation. Test on a staging deployment before adopting this design.
- This is a review candidate, **not a production launch**. It should not be represented as tested or visually approved.

## Intellectual-property note

These are recognizable adaptations of established media characters. Commercial launch should use an independently designed set of mascots and reviewed brand identity.
