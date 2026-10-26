# THE GURLS — The Possible Department (V3)

Static, deployable website for the experimental PowerpuffGurls.com business consultancy project.

## What changed

- New client-facing positioning: **Your website is live. Is your business?**
- Clear consulting specialties: Strategy / AI & automation / Lead generation & growth.
- Intelligent, four-step rules-based business discovery with a personalized, copyable/downloadable next-move brief.
- The 3D characters are the storytelling interface, not a 3D viewer. No orbital camera, material sliders, file inspectors or software-like model controls.
- Bubbles stays from the original Meshy rig. Blossom and Buttercup are replaced with the newly supplied Cyber rigs.
- Models optimized for web: about 12.2 MB total instead of approximately 69.6 MB in source. Original uploads are preserved separately.
- Character animation: Blossom has Idle_5, Walking, Running, Jump_Rope and Dive_Down_and_Land_2; Buttercup additionally has Leap_of_Faith; Bubbles has Walking and Running. The website adds procedural idle floating, cursor tracking and transitions; it does **not** pretend to have natural facial lip sync or new authored animation clips.
- Web Audio API sound effects, muted by default, with a visible Sound On/Off control. No character voices.
- Desktop/mobile layout, scroll reveal, specialty transitions, purpose-led call-to-action flow.

## Quick deployment

### Vercel

1. Upload the contents of this ZIP as a static website using Vercel Drop, or put this directory in a Git repository and import that repository to Vercel.
2. No npm install or build command is needed for the supplied deployment package. The root contains `index.html`.
3. The deployment should serve `assets/models/*.glb` with a binary Content-Type (ideally `model/gltf-binary`).
4. Test `<your-site>/?debug3d=1` and inspect the browser console for `[The Gurls 3D]` messages. Verify `assets/models/blossom.glb`, `bubbles.glb`, `buttercup.glb` return HTTP 200.

### cPanel / conventional file manager

Extract the ZIP and upload **the ZIP contents** (not the top-level folder) into `public_html`. Keep relative asset paths unchanged. The files do not require a Node.js server. Always test through HTTPS, not `file://`.

## Business integration

The page is a real static interactive prototype. It does **not** yet connect to a private AI model, send inquiries, or make calendar reservations by itself.

Edit `config.js`:

```js
window.GURLS_CONFIG = {
  inquiryEndpoint: '', // Your HTTPS POST JSON endpoint
  bookingUrl: '',     // Your scheduling URL
  contactEmail: ''    // Optional email-draft destination
};
```

- When `inquiryEndpoint` is provided, visitors can choose "Send my inquiry" after they create their brief. This sends JSON to the configured endpoint. The endpoint must validate and store/forward inquiries, handle spam protection, and support CORS if cross-origin.
- `bookingUrl` reveals a booking link on the results page.
- `contactEmail` reveals an email-draft action, which opens the visitor's email client rather than sending mail server-side.
- With no endpoint set, the site explicitly says **Preview mode** and allows visitors to **copy** or **save** their summary. It does not claim to have sent anything.
- Do not put API keys, service secrets, SMTP credentials or tokens in `config.js`; this file is public.

## 3D loading and troubleshooting

The GLBs are self-hosted, but the Three.js and GLTFLoader runtime is loaded from jsDelivr, with an esm.sh backup. An internet connection and permission to access one of those CDNs are required for 3D. The site retains static fallback character artwork if 3D fails; the business flows remain operational. To make the site fully CDN-independent later, bundle the Three.js library and GLTFLoader locally with a production bundler (e.g. Vite).

Load failures are described in browser developer tools. The query param `?debug3d=1` shows a minimal debug overlay; ordinary visitors do not see it.

## Preview / release validation

- GLB internal structure, embedded JPEG textures and buffer bounds validated for all three models.
- `app.js` and `characters.js` passed JavaScript syntax checks.
- Desktop screenshot and the complete diagnostic result were rendered and inspected using browser automation with inlined assets (the 3D runtime itself could not be exercised in the offline browser).
- The mobile hero layout was visually checked. Final 3D rendering, audio playback, and all interactions still need a live-deployment smoke test.

## Brand/IP note

The uploaded models are stylized references to established cartoon characters. Commercial public deployment of recognizable characters or a confusingly similar franchise name may require licenses or original redesigns. The frontend branding here uses "The Gurls" without an original franchise logo.
