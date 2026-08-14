import { Eyebrow } from '../components/ui/eyebrow';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Guidelines } from './parts';

/**
 * Brand page — Layout patterns, canvas contexts, imagery rules.
 * The three Baldor canvas types: cream editorial, forest comms, poster/signage.
 */
export function LayoutPatternsPage() {
  return (
    <div className="space-y-8">
      {/* Cream editorial */}
      <section className="rounded-xl border bg-card p-6 text-card-foreground">
        <Eyebrow className="mb-4">Canvas 1 — Cream editorial</Eyebrow>
        <p className="text-sm text-muted-foreground mb-5">
          Cream surface, generous margins, display headline + body columns. The default for marketing, documents, and web UI.
        </p>
        <div className="rounded-xl border" style={{ background: '#FAF8F3', padding: '32px 28px' }}>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#344054] mb-2">
            Seasonal produce
          </span>
          <p className="font-serif text-5xl font-black uppercase leading-[0.9] tracking-tight text-[#182230] mb-4">
            Fresh From The Bronx
          </p>
          <p className="text-base text-[#344054] max-w-sm mb-6">
            Direct relationships with 200+ farms mean shorter supply chains and better produce for your kitchen.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Button>Order now</Button>
            <Button variant="outline">Browse catalogue</Button>
          </div>
        </div>
        <div className="mt-3 flex gap-2 flex-wrap text-xs text-muted-foreground">
          <span className="font-mono">Background: cream (#FAF8F3)</span>
          <span>·</span>
          <span className="font-mono">Display: Barlow Condensed UPPERCASE</span>
          <span>·</span>
          <span className="font-mono">Max 1–2 bg colors</span>
        </div>
      </section>

      {/* Forest comms canvas */}
      <section className="rounded-xl border bg-card p-6 text-card-foreground">
        <Eyebrow className="mb-4">Canvas 2 — Forest comms canvas</Eyebrow>
        <p className="text-sm text-muted-foreground mb-5">
          Full-bleed forest green, cream and lime text. Driver postcards, slides, signage.
        </p>
        <div className="rounded-xl" style={{ background: '#064725', padding: '32px 28px' }}>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: '#B3CF44' }}>
            Driver bulletin
          </span>
          <p className="font-serif text-4xl font-black uppercase leading-[0.9]" style={{ color: '#FAF8F3' }}>
            Safety rules save lives.
          </p>
          <p className="mt-4 text-base" style={{ color: '#FAF8F3', opacity: 0.85 }}>
            Chock your wheels. Wear your hi-vis. Check your mirrors.
          </p>
          <p className="mt-1 text-sm italic" style={{ color: '#FAF8F3', opacity: 0.7 }}>
            Cuña las ruedas. Use tu chaleco. Revisa tus espejos.
          </p>
          <div className="mt-6">
            <button
              className="text-[13px] font-semibold uppercase tracking-[0.08em] px-5 py-2 rounded-md"
              style={{ background: '#B3CF44', color: '#1E1B1D' }}
            >
              Read full policy
            </button>
          </div>
        </div>
        <div className="mt-3 flex gap-2 flex-wrap text-xs text-muted-foreground">
          <span className="font-mono">Background: green-forest (#064725)</span>
          <span>·</span>
          <span className="font-mono">Text: cream · Accent: lime CTA</span>
          <span>·</span>
          <span className="font-mono">Bilingual EN/ES for driver-facing</span>
        </div>
      </section>

      {/* Poster / signage */}
      <section className="rounded-xl border bg-card p-6 text-card-foreground">
        <Eyebrow className="mb-4">Canvas 3 — Poster and signage</Eyebrow>
        <p className="text-sm text-muted-foreground mb-5">
          Gold caution field, ink bars, huge condensed display. Dock signs, truck wraps, printed safety notices.
          Mirror-reversed copy for dock mirror reading where applicable.
        </p>
        <div className="rounded-xl overflow-hidden">
          <div style={{ background: '#F2A813', padding: '20px 28px' }}>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#182230]">
              Caution · Baldor NYC Terminal
            </span>
          </div>
          <div style={{ background: '#182230', padding: '24px 28px' }}>
            <p className="font-serif font-black uppercase leading-[0.85] text-[#FAF8F3]"
               style={{ fontSize: 'clamp(36px, 6vw, 64px)', letterSpacing: '-0.01em' }}>
              STOP.<br />CHOCK BEFORE EXIT.
            </p>
          </div>
          <div style={{ background: '#F2A813', padding: '12px 28px' }}>
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#182230]">
              155 Food Center Drive · Bronx NY 10474
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-2 flex-wrap text-xs text-muted-foreground">
          <span className="font-mono">Gold (#F2A813) for caution fields</span>
          <span>·</span>
          <span className="font-mono">Ink (#182230) for high-contrast bars</span>
          <span>·</span>
          <span className="font-mono">Display: Barlow Condensed, max weight</span>
        </div>
      </section>

      {/* Category chips in context */}
      <section className="rounded-xl border bg-card p-6 text-card-foreground">
        <Eyebrow className="mb-4">Category chips — editorial</Eyebrow>
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap items-center p-4 rounded-lg border" style={{ background: '#FAF8F3' }}>
            <Badge variant="local">Local</Badge>
            <Badge variant="featured">Featured</Badge>
            <span className="font-serif text-xl font-bold uppercase text-[#182230] ml-1">Hudson Valley Peaches</span>
          </div>
          <div className="flex gap-2 flex-wrap items-center p-4 rounded-lg border" style={{ background: '#FAF8F3' }}>
            <Badge variant="supply">Supply Update</Badge>
            <span className="text-sm text-[#344054] ml-1">Hass avocados limited through Friday — order early</span>
          </div>
        </div>
      </section>

      {/* Guidelines */}
      <section className="rounded-xl border bg-card p-6 text-card-foreground">
        <Eyebrow className="mb-4">Brand rules</Eyebrow>
        <Guidelines items={[
          { kind: 'do', text: 'Limit each artifact to 1–2 background colors. Pick one canvas type and commit.' },
          { kind: 'do', text: 'Use real product/food and facility photography. Full-bleed or framed at r-lg.' },
          { kind: 'do', text: 'Include bilingual EN/ES copy on all driver-facing materials.' },
          { kind: 'dont', text: 'Use aggressive gradients or generic rounded-left-border accent cards.' },
          { kind: 'dont', text: 'Use emoji — not in the Baldor brand voice.' },
          { kind: 'dont', text: 'Use SVG illustrations of food subjects — use real photography or leave a placeholder.' },
        ]} />
      </section>
    </div>
  );
}
