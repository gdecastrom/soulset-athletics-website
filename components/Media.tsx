'use client';
/* Background photo or video loop behind a section (files in public/media, see docs/media.md).
   The photo shows straight away; the video loads and plays only while on screen, and never for visitors with reduced
   motion or data saver on, who keep the photo. */
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { MediaSlot } from '../lib/server/media.ts';

export function Media({ slot, priority = false }: { slot: NonNullable<MediaSlot>; priority?: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || conn?.saveData || !('IntersectionObserver' in window)) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) { v.pause(); return; }
      if (!v.getAttribute('src')) v.src = `/media/${slot.name}.mp4`;
      v.play().catch(() => {});
    }, { rootMargin: '200px 0px' });
    obs.observe(v);
    return () => obs.disconnect();
  }, [slot.name]);

  return (
    <div className={'media' + (playing ? ' playing' : '')} aria-hidden>
      <Image src={`/media/${slot.name}.jpg`} alt="" fill sizes="100vw" priority={priority} />
      {slot.video && <video ref={video} muted loop playsInline preload="none" onPlaying={() => setPlaying(true)} />}
    </div>
  );
}
