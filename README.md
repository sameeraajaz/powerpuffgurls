# PowerpuffGurls — Cinematic V3 (3D character director)

This is the website code, including three newly supplied rigged GLB models with their **six** animations each. It retains the V2 consultancy and inquiry wizard and adds visitor-controlled and section-driven 3D choreography.

## What actually changed

- Replaced all three older two-clip GLBs with the updated files supplied on October 26.
- Kept six clips per model: `Running`, `Walking`, `Dive_Down_and_Land_2`, `Jump_Rope`, `Leap_of_Faith`, `Wave_One_Hand`.
- Removed **Hips translation tracks** from the clips while optimizing for web. This is intentional: the imported leap and dive animations contain extreme travel values that make models disappear off camera. Bone rotations and posing are preserved. The website now controls in-scene flight and landing trajectories.
- Web-optimized textures: 2304x2304 JPEG atlases. Combined GLBs approx. 10.5 MB instead of 63+ MB.
- Generates a static idle pose from the opening keyframe of the `Wave_One_Hand` animation instead of returning to a T-pose. A breathing bob and modest cursor-driven head movement supply continuous life.
- Buttons for **Wave, Fly, Land, Run, Bounce**, live specialist selection, model raycasting/click selection, section-triggered choreography, subtle particles and halo effects, and opt-in sound cues.
- The inquiry system remains a **rules-based prototype**, not a live LLM. It does not submit leads until you set a valid endpoint in `config.js`.

## Deployment (simplest)

Extract the ZIP; upload **all contents** of this folder as the site's root, preserving `assets/models` and `assets/images`.

- Vercel Drop: <https://vercel.com/drop> (use the extracted folder or ZIP)
- Static hosting file manager: upload the extracted contents into `public_html`, and serve the website over **HTTPS**.
- Local test on Windows (Python installed): `py -m http.server 8000`, then visit `http://localhost:8000`.
- Do **not** double-click `index.html` under `file://` to test 3D: module imports and model loading need HTTP(S).

### Make the Three.js engine local (strongly recommended for final deployment)

The standalone package references a CDN for Three.js because this build environment cannot fetch npm dependencies. The GLBs, images and business logic are already in the ZIP.

If you want to eliminate reliance on CDN imports, on your Windows PC, inside the extracted folder:

```powershell
npm install
npm run vendor:three
```

That copies Three.js and GLTFLoader modules into the local `vendor/` directory and automatically updates the import map in `index.html`. **Afterwards** redeploy the *whole folder*, including `vendor/`, using Vercel Drop or File Manager. This is particularly relevant because your Cursor fix already vendored Three.js. If you are merging into Cursor's working project, **retain Cursor's already-local dependency imports** and replace only the model assets and animation controller carefully.

## Action map

| Visitor action | In-site behavior | Source GLB animation |
|---|---|---|
| Page ready | Breathing, small floating motion, pointer gaze | Sampled idle pose from `Wave_One_Hand` |
| Click / hover / wave | Wave action then blend back to idle | `Wave_One_Hand` |
| Press FLY | Leaping transition, then suspended airborne pose | `Leap_of_Faith` + procedural hovering |
| Press LAND | Controlled descent with a hero landing pose | `Dive_Down_and_Land_2` |
| Press RUN | In-place run, then idle | `Running` |
| Press BOUNCE | Extra motion loop | `Jump_Rope` |
| Scroll to sections | Specialist activation and contextual motion | Combination above |

**Limitation:** The GLBs do not include a named `Idle` or `Superhero Floating` clip. Those behaviors are approximated procedurally from the available animations, and may need further refinement in Blender for production-grade performance.

## Troubleshooting

Append `?debug3d=1` to your hosted site and open browser DevTools > Console. Check `window.PPG_3D_DEBUG` to see loaded models, six clips per character, and any loading errors.

- `/assets/models/*.glb` must return HTTP 200 (not HTML). Case-sensitive host filenames are all lowercase.
- If the 3D engine is blocked, the page shows static image fallbacks; use the local vendoring procedure above.
- Ensure browsers support WebGL and GPU acceleration.
- Sound starts **off**, on purpose; visitor must click the sound toggle.
- Test desktop and mobile separately, and confirm scroll-triggered animations and character buttons don't obscure the inquiry flow.

## Inquiry backend

Configure `config.js`:
- `leadEndpoint`: your secure HTTPS POST endpoint for visitor inquiries. Empty = demo/local export only.
- `bookingUrl`: optional genuine scheduling URL.
- `contactEmail`: optional legitimate company email for drafting mailto links.

Never place API keys in `config.js` or other front-end files. Do not treat the rules-based diagnosis as a fully trained AI business consultant.

## Scope and caveats

This package was built from the **previous V2 ZIP**, plus the updated Meshy GLBs and the animation fix described from your Cursor screenshot. Your latest Cursor edits live on your PC and were **not** available here, so this isn't a binary copy of those local changes. Back up your Cursor folder before replacing it.

Validation completed: JavaScript syntax checks, GLB structural checks, clip counts, model asset paths, ZIP packaging. A full WebGL browser-rendering regression test was **not available** in this environment; verify on a live staging URL before declaring this production-ready.
