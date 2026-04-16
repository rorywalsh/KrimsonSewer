# KrimsonSewer

Krimson Sewer model from Sketchfab
https://sketchfab.com/3d-models/krimson-city-sewers-e229b9cbd8514d02972b3b724c08536d

A scene for sound design students to explore spatial audio, collision triggers, and ambient soundscapes in a 3D environment.

---

## Sound System Overview

All sound logic lives in `audioClasses.js`. There are five sound types you can place in the scene:

| Type | Description |
|---|---|
| `AreaSound` | Looping ambient sound that fades in/out as you enter/leave a sphere |
| `OneShotCollisionSound` | One-shot sound triggered when the player walks into a box zone |
| `RandomNonSpatialSound` | Non-spatial sound played at random intervals |
| `LoopedSound` | Continuously looping sound with optional crossfade |
| `FootstepSystem` | Automatic footstep sounds that react to the surface underfoot |

Sounds are defined in `sounds.js` inside the `initSounds()` function. Use the visual editor to design your layout, then paste the generated code into that file.

---

## Using the Visual Editor

Open `index.html` in a browser. Press **Ctrl+E** to toggle the sound editor panel.

### Placing a sound

1. Choose a **Type** from the radio buttons at the top of the panel.
2. Fill in the **File** path (relative to the project root, e.g. `./audio/drip.wav`). For `OneShotCollisionSound` and `RandomNonSpatialSound` you can enter multiple comma-separated paths to have one chosen at random each time.
3. Adjust **Volume** and any type-specific options (see below).
4. Press **Spacebar** or click **Place Sound** — a ghost wireframe mesh appears in the scene showing the trigger zone.
5. Use **X / Y / Z** sliders to reposition it, or drag the ghost mesh directly.

### Selecting and editing a placed sound

Click a sound in the **Placed Sounds** list at the bottom of the panel to select it. All sliders update to reflect that sound's current settings. Changes are previewed live in the scene immediately. The editor auto-saves your layout to the browser's local storage, so it will be restored next time you open the page in the same browser. However, nothing is written to disk until you copy the generated code into `sounds.js`.

Click **✕ deselect** to deselect.

### Removing a sound

Select the sound in the list and click **Remove**.

### Saving your work

Click **Copy Code** to copy the complete initialisation block to your clipboard. Paste it into `sounds.js`, replacing the contents of the `initSounds()` function body, to make the placement permanent.

---

## Sound Types — Editor Options

### AreaSound

A looping ambient sphere. The sound plays at full volume inside the **Min Distance** radius and fades to silence at the outer edge of the sphere.

| Option | Description |
|---|---|
| File | Single audio file path |
| Volume | Master volume (0–1) |
| Rolloff | Curve steepness of the fade (0.1–10). Higher = faster fade. |
| Min Distance | Radius (world units) at which volume is at maximum |

### OneShotCollisionSound

Plays once when the player walks into the trigger box. The player must leave the box before it can fire again (unless Cooldown is set to **once**).

| Option | Description |
|---|---|
| File | Single path or comma-separated list of paths (random pick each trigger) |
| Volume | Master volume (0–1) |
| Width | Half-size of the trigger box (world units) |
| Cooldown (ms) | Milliseconds before the sound can retrigger. Drag to **-1** to set **once** — the sound plays exactly once per session and never repeats. |
| Area Rolloff | When > 0, the triggered sound attenuates with distance from the box centre after firing. 0 = disabled. Higher = faster fade. |

### RandomNonSpatialSound

Plays sounds at random intervals. Not spatially positioned — heard equally everywhere.

| Option | Description |
|---|---|
| File | Single path or comma-separated list |
| Volume | Base amplitude (0–1) |
| Min / Max Interval (ms) | Random wait time between plays |
| Base Pitch | Playback rate multiplier (1 = normal) |
| Pitch Variation | Random ± offset applied to pitch each play |
| Amplitude Variation | Random ± offset applied to volume each play |

### LoopedSound

Continuously loops a single file. Not spatially positioned.

| Option | Description |
|---|---|
| File | Single audio file path |
| Volume | Master volume (0–1) |
| Playback Rate | Pitch multiplier (1 = normal) |
| Crossfade | 0–1 fraction of the clip length used for fade in/out at each loop point. 0 = hard loop, 1 = maximum crossfade. |

### FootstepSystem

Configured via the **Footsteps** tab in the editor. Footsteps fire automatically as the player moves. Sounds switch between a **dry** bank (normal ground) and a **wet** bank (water) based on a downward raycast.

| Option | Description |
|---|---|
| Dry files | Audio files for normal ground |
| Wet files | Audio files for water surfaces |
| Volume | Base footstep volume (0–1) |
| Volume Variation | Random ± offset per step |
| Pitch Variation | Random ± pitch offset per step |
| Stride Length | Distance walked (world units) between steps |
| Step Interval Variation | Random ± fraction applied to stride length |

---

## How the Attenuation Works

### AreaSound

- Inside **minDistance**: volume = full
- Between **minDistance** and the outer sphere edge: `gain = (1 - t) ^ rolloff` where `t` is a normalised 0–1 distance across the fade zone
- Outside the sphere: volume = 0

The sphere radius is derived from rolloff: `radius = (8 / rolloff) * 1.5`

### OneShotCollisionSound area rolloff (optional)

When **Area Rolloff** > 0, after the sound is triggered the same attenuation formula is applied every frame from the box centre outward. Full volume anywhere inside the trigger box; silence at the same outer radius as `AreaSound` with the same rolloff value.

---

## File Reference

| File | Purpose |
|---|---|
| `sounds.js` | **Edit this** — all sound placement lives here inside `initSounds()` |
| `audioClasses.js` | Sound class definitions and the per-frame collision/attenuation loop |
| `index.html` | Main entry point and visual editor |
