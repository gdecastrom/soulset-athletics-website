# Cinematic media

Full-bleed athlete imagery behind four sections:

| Section | File(s) in `public/media/` | Grade |
|---|---|---|
| Home hero | `run-track.webp` (still) | Full colour (`cine-color`) |
| Home waitlist sign-up | `gym-barbell.webp` (still) | Black and white (`cine-bw`) |
| Manifesto mid-page line | `sweat-bw.mp4` + `sweat-bw.jpg` poster (clip) | Centred (`cine-center`) |
| Manifesto closer | `gym-sweat.webp` (still) | Black and white, mirrored so the face sits clear of the copy (`cine-bw cine-flip`) |

The sections are in `app/[lang]/page.tsx` and `app/[lang]/manifesto/page.tsx`; the media layer is `components/CineMedia.tsx`
(`<CineMedia still="run-track" />` or `<CineMedia clip="sweat-bw" />`). The grade is applied in CSS (`app/globals.css`,
`.cine…`), so footage can be shot in colour. `--pos` on the section sets the focal point (`object-position`).

- A still is `<name>.webp`, about 2400 px wide; `next/image` resizes it and serves AVIF/WebP per screen.
- A clip is `<name>.mp4` with a `<name>.jpg` poster (its first frame). The poster shows first; the video loads only when
  the section nears the screen and pauses when it leaves. Visitors with reduced motion or Data Saver only see the poster.
- Clips: 720p, 6–15 s seamless loop, muted, under ~5 MB.
- To swap in your own shoot, replace the files keeping the names, or add new ones and change the name in the page.
- **No visible brands:** clothing, shoes and gear in any image must show no logos.

Compress a clip and grab its first frame with ffmpeg:

```bash
ffmpeg -i in.mov -an -vf "scale=1280:-2,fps=25" -c:v libx264 -crf 28 -preset slow -movflags +faststart -t 12 name.mp4
```

```bash
ffmpeg -i name.mp4 -frames:v 1 -q:v 4 name.jpg
```

## Current files are placeholders

- [Mixkit](https://mixkit.co/license/#videoFree) clip, free for commercial use with no attribution required: sweat-bw (50964)
- [Unsplash](https://unsplash.com/license) stills, free for commercial use: run-track (photo-1766970096346), gym-barbell (photo-1639653816698), gym-sweat (photo-1570095354203)

Replace them with your own shoot before launch, ideally with Soulset product in shot.
