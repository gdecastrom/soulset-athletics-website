# Cinematic media

Background photos and video loops for the home page and the manifesto page. Drop files here with these exact names.
Each slot only appears once its `.jpg` loads, so a missing file leaves the plain black or bone section, never a broken image.

| File | Type | Where it shows | Shot to look for |
|---|---|---|---|
| `hero.jpg` + `hero.mp4` | Video loop (jpg is the still shown before/without video) | Home hero, full-bleed behind "Mentality > everything" | Runner at dawn or dusk, low angle, wide, subject on the right third (copy sits on the left) |
| `training.jpg` + `training.mp4` | Video loop | Home, "The work no one sees" band | Training in low light: sled push, sprints, heavy lift, chalk, sweat |
| `portrait.jpg` | Photo, 4:5 portrait | Home manifesto band (bone), right column | Athlete close-up, focused, before or after effort |
| `relentless.jpg` | Photo | Home waitlist sign-up and the end of the manifesto page | Lone runner on an open road or track, wide, lots of dark space |

## Specs

- **Stills (`.jpg`)**: 1920 × 1080 (portrait: 1200 × 1500), under ~300 KB. For video slots use the first frame of the clip, so the switch to video is seamless.
- **Video (`.mp4`)**: H.264, no audio, 8–15 s seamless loop, 1920 × 1080 or smaller, under ~4 MB.
- Darker footage works best: the site adds a dark overlay and a slight desaturation so different clips match.
- Videos only load when on screen, and never play for visitors with reduced motion or data saver on (they see the still).

Compress a clip and grab its first frame with ffmpeg:

```bash
ffmpeg -i in.mov -an -vf "scale=1920:-2,fps=25" -c:v libx264 -crf 28 -preset slow -movflags +faststart -t 12 hero.mp4
ffmpeg -i hero.mp4 -frames:v 1 -q:v 4 hero.jpg
```

## Sources

Your own shoot is best. For stock, [Pexels](https://www.pexels.com/videos/) and [Unsplash](https://unsplash.com) allow free commercial use without attribution; avoid footage where a visible third-party brand or a recognisable person implies endorsement.
