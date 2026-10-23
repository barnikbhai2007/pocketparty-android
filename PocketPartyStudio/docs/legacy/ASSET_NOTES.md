# Asset notes

This project uses original AI-generated illustrated game tiles/material atlases and original code-produced transparent game sprites and instrumental music loops. No reference app artwork, branding, source code, sampled music or remote asset URLs are used.

- Menu atlas: ten intentionally distinct illustrations; source JPEG plus PNG crops retained.
- Material atlas: asphalt, tatami, ice and paper; source retained.
- Sprites: transparent PNGs with repeatable generation scripts. Editable vector logo in asset-source/art/logo.svg.
- Audio: eleven original synthesized instrumental loops (menu plus one per game). 24-bar loops with per-theme tempo/melody variations, stereo parts and gentle delays. WAV masters plus compressed Ogg runtime versions. No vocals. Signal peak/RMS/duration documented in audio/MANIFEST.json. Generated signal levels were inspected numerically; device listening and lifecycle/latency validation are still required.
- Five short WAV effects are provided as editable production assets. The existing game also synthesizes immediate gameplay tones through Web Audio for low latency; not every provided effect file is currently used by runtime logic.
- All runtime dependencies are bundled locally; only initial Android/Node build dependency installation needs internet.

The large WAV masters are meaningful source assets, not file-size padding. Production build only packages app/src/main/assets.
