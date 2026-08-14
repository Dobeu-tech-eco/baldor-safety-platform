import { Guidelines } from './parts';

/** The Overlap — SVG recreation of the Dobeu logo mark for preview purposes.
 *  Two overlapping soft circles (indigo + slate) with an amber lens at intersection. */
function TheOverlapMark({ size = 64 }: { size?: number }) {
  const r = size * 0.36;
  const cx1 = size * 0.37;
  const cx2 = size * 0.63;
  const cy = size * 0.5;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="Dobeu mark — The Overlap">
      {/* Left circle — indigo-primary */}
      <circle cx={cx1} cy={cy} r={r} fill="#6B5CE7" />
      {/* Right circle — indigo-slate */}
      <circle cx={cx2} cy={cy} r={r} fill="#5A4FAB" />
      {/* Amber lens at intersection — clipped to the right half of the left circle */}
      <clipPath id="lens-clip">
        <circle cx={cx1} cy={cy} r={r} />
      </clipPath>
      <circle cx={cx2} cy={cy} r={r} fill="#F4A261" clipPath="url(#lens-clip)" />
    </svg>
  );
}

function WordmarkLockup() {
  return (
    <div className="flex items-center gap-3">
      <TheOverlapMark size={48} />
      <span
        style={{
          fontFamily: 'Nunito, Quicksand, sans-serif',
          fontWeight: 800,
          fontSize: '2rem',
          letterSpacing: '-0.02em',
          color: '#5A4FAB',
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        dobeu
      </span>
    </div>
  );
}

const SUB_BRANDS = [
  { tld: '.tech', mode: 'Light', primary: '#6B5CE7', slate: '#5A4FAB', lens: '#F4A261', surface: '#1A1A2E' },
  { tld: '.dev', mode: 'Dark', primary: '#4F6BE8', slate: '#2D3F7A', lens: '#F4A261', surface: '#0F1A33' },
  { tld: '.net', mode: 'Light', primary: '#7F6FD8', slate: '#7459A8', lens: '#F4A261', surface: '#FFF8F0' },
  { tld: '.ai', mode: 'Dark', primary: '#3F8CB8', slate: '#2A4D6E', lens: '#D89544', surface: '#0E2230' },
  { tld: '.io', mode: 'Dark/Light', primary: '#4FA763', slate: '#2D5F30', lens: '#F4A261', surface: '#0E1F12' },
];

function SubBrandCard({ tld, mode, primary, slate, lens, surface }: (typeof SUB_BRANDS)[number]) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <svg width={28} height={28} viewBox="0 0 28 28" aria-hidden>
          <circle cx={10} cy={14} r={10} fill={primary} />
          <circle cx={18} cy={14} r={10} fill={slate} />
          <clipPath id={`clip-${tld}`}><circle cx={10} cy={14} r={10} /></clipPath>
          <circle cx={18} cy={14} r={10} fill={lens} clipPath={`url(#clip-${tld})`} />
        </svg>
        <span
          style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '1rem', color: slate }}
        >
          dobeu
          <span style={{ color: primary }}>{tld}</span>
        </span>
      </div>
      <div className="flex gap-2 flex-wrap text-xs text-muted-foreground">
        <span className="rounded px-2 py-0.5 border" style={{ background: primary, color: '#fff' }}>Primary</span>
        <span className="rounded px-2 py-0.5 border" style={{ background: slate, color: '#fff' }}>Slate</span>
        <span className="rounded px-2 py-0.5 border" style={{ background: lens, color: '#2D2D3A' }}>Lens</span>
        <span className="rounded px-2 py-0.5 border" style={{ background: surface, color: '#E0E0E0' }}>Surface</span>
      </div>
      <p className="text-xs text-muted-foreground">Default mode: {mode}</p>
    </div>
  );
}

export function BrandLogoPage() {
  return (
    <div className="space-y-8">
      {/* Mark anatomy */}
      <section className="rounded-xl border bg-card p-6 space-y-6">
        <div>
          <h2 className="font-semibold text-lg">The Overlap</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Two soft overlapping circles with an amber crescent lens at their intersection.
            The mark shape never changes — sub-brands differentiate only by recoloring the three regions.
          </p>
        </div>

        <div className="flex flex-wrap gap-8 items-end">
          <div className="space-y-2 text-center">
            <TheOverlapMark size={80} />
            <p className="text-xs text-muted-foreground">Icon only (≥20px)</p>
          </div>
          <div className="space-y-2">
            <WordmarkLockup />
            <p className="text-xs text-muted-foreground">Horizontal lockup (≥96px tall)</p>
          </div>
          <div className="space-y-2 text-center p-4 rounded-lg" style={{ background: '#1A1A2E' }}>
            <TheOverlapMark size={48} />
            <p className="text-xs" style={{ color: '#9A9AB0' }}>On dark surface</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          {[
            { label: 'Left circle', color: '#6B5CE7', name: 'Indigo Primary' },
            { label: 'Right circle', color: '#5A4FAB', name: 'Indigo Slate' },
            { label: 'Center lens', color: '#F4A261', name: 'Amber Warm' },
          ].map(({ label, color, name }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full shrink-0 border" style={{ background: color }} />
              <div>
                <p className="font-medium text-xs">{label}</p>
                <p className="text-xs text-muted-foreground font-mono">{color}</p>
                <p className="text-xs text-muted-foreground">{name}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Usage guidelines */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Logo usage</h2>
        <Guidelines items={[
          { kind: 'do', text: 'Use the icon-only mark for app icons, favicons, and social avatars.' },
          { kind: 'do', text: 'Maintain clear space of at least 0.25× mark height on every side.' },
          { kind: 'do', text: 'Use mark + typed wordmark in Nunito ExtraBold (lowercase) for navbars.' },
          { kind: 'dont', text: 'Redraw, recolor, rotate, skew, outline, or animate the mark.' },
          { kind: 'dont', text: 'Separate the amber lens from the circles.' },
          { kind: 'dont', text: 'Place the mark inside a container shape (badge, circle, rounded box).' },
          { kind: 'dont', text: 'Use the mark below 20px (icon-only) or the stacked lockup below 96px tall.' },
        ]} />
      </section>

      {/* Sub-brands */}
      <section className="space-y-4">
        <div>
          <h2 className="font-semibold">Sub-brand variants</h2>
          <p className="text-sm text-muted-foreground mt-1">
            The mark shape never changes. Each sub-brand recolors the three logo regions via
            a <code className="font-mono text-xs bg-muted px-1 rounded">.brand-&#123;tld&#125;</code> or{' '}
            <code className="font-mono text-xs bg-muted px-1 rounded">data-brand</code> attribute.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SUB_BRANDS.map((b) => <SubBrandCard key={b.tld} {...b} />)}
        </div>
      </section>
    </div>
  );
}
