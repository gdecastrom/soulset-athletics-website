import Image from 'next/image';
import { dict } from '../../../lib/dict.ts';
import type { Lang } from '../../../lib/i18n.ts';

export default async function Cover({ params }: { params: Promise<{ lang: string }> }) {
  const lang = (await params).lang as Lang;
  const h = dict(lang).home;
  return (
    <main className="cover">
      <Image className="cover-img" src="/media/run-track.webp" alt="" fill priority sizes="100vw" />
      <div className="cover-in">
        {/* The ">" stays with the second word when the line wraps on a phone. */}
        <h1>{h.h1a} <span className="gt">&gt;</span>{' '}{h.h1b}</h1>
        <p>Soulset Athletics</p>
      </div>
    </main>
  );
}
