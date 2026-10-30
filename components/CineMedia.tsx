'use client';
/* Full-bleed athlete photo or video behind a .cine section (files in public/media, see docs/media.md).
   A still is <name>.webp. A clip is <name>.mp4 with <name>.jpg as its poster: the poster shows first, the video loads
   only when the section nears the screen and pauses when it leaves. Reduced motion and Save-Data keep the poster. */
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

export function CineMedia({ still, clip, priority = false }: { still?: string; clip?: string; priority?: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const v = video.current;
    if (!v || !clip) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || conn?.saveData || !('IntersectionObserver' in window)) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) { v.pause(); return; }
      if (!v.getAttribute('src')) v.src = `/media/${clip}.mp4`;
      v.play().catch(() => {});
    }, { rootMargin: '200px 0px' });
    obs.observe(v);
    return () => obs.disconnect();
  }, [clip]);

  const poster = still ? `/media/${still}.webp` : `/media/${clip}.jpg`;
  return (
    <div className="cine-media" aria-hidden>
      <Image src={poster} alt="" fill sizes="100vw" priority={priority} />
      {clip && <video ref={video} className={on ? 'on' : undefined} muted loop playsInline preload="none" onPlaying={() => setOn(true)} />}
    </div>
  );
}
