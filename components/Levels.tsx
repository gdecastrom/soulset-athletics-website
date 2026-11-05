/* Caffeine level shown as three small chevrons, filled up to n. */
export function Levels({ n }: { n: number }) {
  return (
    <span className="levels" aria-hidden>
      {[0, 1, 2].map(i => <i key={i} className={i < n ? '' : 'off'} />)}
    </span>
  );
}
