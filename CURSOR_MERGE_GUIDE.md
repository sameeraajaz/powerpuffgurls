# Integrate V3 into your Cursor-edited site

Your Cursor screenshot shows local edits to `three-stage.js` and `index.html`, including locally vendored Three.js. **Your Cursor free-tier usage limit does not prevent you from using or copying those files.** They remain on your Windows drive:

`C:\Users\Asus\Downloads\PowerpuffGurls_3D_Fixed_V2`

## Safest path

1. **Back up** the existing `PowerpuffGurls_3D_Fixed_V2` folder first. Do not delete it.
2. Download and extract the new V3 ZIP to a separate folder.
3. Copy only the three files from V3 `assets/models/` over the corresponding model files in your Cursor project.
4. Open V3 `three-stage.js` and compare it with your Cursor-edited version. V3 contains the six-clip state machine and scene choreography; Cursor may already contain more robust local `three` imports. Preserve those local imports instead of reverting to CDN imports.
5. Bring over the `stage-interface` HTML from V3 `index.html`, the V3 additions at the bottom of `styles.css`, and the `ppg-action-sfx` event handler in `app.js`.
6. Test all five actions in the browser via a local HTTP server or HTTPS deployment; check `?debug3d=1`.

## Alternatively

Use the complete V3 folder as a new standalone project. For independence from CDN:

```powershell
npm install
npm run vendor:three
```

Then redeploy the entire result, including the generated `vendor/` directory.

## Exact clip names inside the updated GLBs

- `Walking` (loop)
- `Running` (loop)
- `Wave_One_Hand` (once)
- `Leap_of_Faith` (once; website controls flight travel)
- `Dive_Down_and_Land_2` (once; website controls descent)
- `Jump_Rope` (loop; exposed as BOUNCE)

Idle and levitation are synthesized in the browser. Meshy did not export them as standalone named clips.
