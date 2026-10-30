/* Which cinematic photos and video loops are in public/media (see docs/media.md). Checked when the page is rendered,
   at build time for static pages, so a slot only appears once its file is in the repository: no 404s, no layout jump. */
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export type MediaSlot = { name: string; video: boolean } | null;

export function mediaSlot(name: string, { video = false } = {}): MediaSlot {
  const has = (ext: string) => existsSync(join(process.cwd(), 'public', 'media', `${name}.${ext}`));
  if (!has('jpg')) return null;
  return { name, video: video && has('mp4') };
}

/* "base has-media" when the slot has a file, so the section switches to its photo or video layout. */
export const withMedia = (base: string, slot: MediaSlot) => (slot ? `${base} has-media` : base);
