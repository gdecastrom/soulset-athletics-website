import { notFound } from 'next/navigation';

/* Any unknown path under a language renders that language's 404 page inside the site layout. */
export default function CatchAll() {
  notFound();
}
