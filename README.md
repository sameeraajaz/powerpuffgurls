# PowerpuffGurls — repaired 3D build

Brand: PowerpuffGurls / powerpuffgurls.com.

This package retains the supplied Blossom and Buttercup GLBs. Bubbles is the optimized seven-clip model (Running, Walking, Dive_Down_and_Land_2, Idle_5, Jump_Rope, Leap_of_Faith, Wave_One_Hand) with a 2048 JPEG texture.

Fixes:
- Three.js and GLTFLoader are bundled inside app.js. No CDN, import map, missing characters.js request, or npm build is required for deployment.
- Apply the initial skeletal animation pose before calculating character bounds and scale. Previously the rest pose dimensions produced dramatically oversized characters.
- Constrain headline grid sizing so the character stage remains within the viewport.
- Removed unrelated static character illustrations. If WebGL is unavailable, a Canvas2D software rasterizer renders the same GLB meshes, skeleton poses and embedded textures. This fallback has simpler lighting and a lower frame rate than the GPU renderer.
- Reduced motion keeps the 3D models visible.
- Bubbles no longer freezes on a two-clip file. Each character crossfades through a superhero entrance, a staggered showcase (flight, landing, jump, wave, run), and scroll, role, and click poses, then returns to Idle_5.
- Characters are smaller, lit with a dark neon rim rig, and travel with the scroll across the hero, problem, missions, method, and diagnostic sections.

Deployment:
Upload ALL extracted files and the assets folder to the existing Vercel project, replacing the previous deployment. The output directory is the folder containing index.html. No build command is required. The same contents work in public_html on static hosting.

Validation performed:
- All three GLBs parsed with Three.js GLTFLoader; each contains one mesh, one skin, 23 bones, embedded textures and animation clips.
- Animation-applied bounding dimensions checked for all three characters.
- app.js syntax checked.
- Desktop page layout checked in browser.
- Browser verification: all three actual GLBs visible on the homepage with the software renderer; consultant selection and canvas movement tested. WebGL is disabled in this browser, so the GPU rendering path is not visually verified. The existing Vercel deployment has not been changed by this package.

Business integrations remain unconfigured in config.js. The diagnostic is rules-based; inquiry delivery, booking and live AI require real service endpoints.
