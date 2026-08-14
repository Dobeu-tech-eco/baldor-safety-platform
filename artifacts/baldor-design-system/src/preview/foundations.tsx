import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { Eyebrow } from '../components/ui/eyebrow';
import { ShieldAlert } from 'lucide-react';
import { Guidelines } from './parts';

// ─── Color swatches ────────────────────────────────────────────────────────

const CORE_SWATCHES = [
  { name: 'Primary', sub: '#20491D · green-primary', className: 'bg-primary' },
  { name: 'Accent', sub: '#B3CF44 · lime', className: 'bg-accent' },
  { name: 'Secondary', sub: '#F1F0EC · cream-panel', className: 'bg-secondary border' },
] as const;

const GREEN_SWATCHES = [
  { name: 'deep-green-black', hex: '#20280B', className: 'bg-[#20280B]' },
  { name: 'green-forest', hex: '#064725', className: 'bg-[#064725]' },
  { name: 'green-primary', hex: '#20491D', className: 'bg-[#20491D]' },
  { name: 'green-secondary', hex: '#08563F', className: 'bg-[#08563F]' },
  { name: 'green-digital', hex: '#007050', className: 'bg-[#007050]' },
  { name: 'green-lime', hex: '#B3CF44', className: 'bg-[#B3CF44]' },
] as const;

const CREAM_SWATCHES = [
  { name: 'cream', hex: '#FAF8F3', className: 'bg-background border' },
  { name: 'cream-panel', hex: '#F1F0EC', className: 'bg-secondary border' },
  { name: 'white (elevated)', hex: '#FFFFFF', className: 'bg-white border' },
  { name: 'ink-true', hex: '#182230', className: 'bg-[#182230]' },
  { name: 'ink', hex: '#1E1B1D', className: 'bg-[#1E1B1D]' },
  { name: 'ink-muted', hex: '#344054', className: 'bg-[#344054]' },
] as const;

const ACCENT_SWATCHES = [
  { name: 'gold · Local', hex: '#F2A813', className: 'bg-[#F2A813]' },
  { name: 'purple · Featured', hex: '#5C4E71', className: 'bg-[#5C4E71]' },
  { name: 'sky · Supply', hex: '#79B0C8', className: 'bg-[#79B0C8]' },
  { name: 'alert', hex: '#E00000', className: 'bg-destructive' },
  { name: 'coral', hex: '#EE8B84', className: 'bg-[#EE8B84]' },
] as const;

function Swatch({ name, hex, className, sub }: { name: string; hex?: string; sub?: string; className: string }) {
  const label = hex ?? sub ?? '';
  return (
    <div className="space-y-1.5">
      <div className={`h-14 rounded-md ${className}`} />
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground leading-tight">{name}</p>
      {label && <p className="text-[10px] font-mono text-muted-foreground">{label}</p>}
    </div>
  );
}

// ─── Type scale ────────────────────────────────────────────────────────────

const TYPE_SCALE = [
  { label: 'Display', className: 'font-serif text-5xl font-black uppercase leading-[0.92] tracking-tight', sample: 'Baldor Food' },
  { label: 'Headline', className: 'font-serif text-3xl font-bold uppercase leading-[1.02]', sample: 'Fresh From The Bronx' },
  { label: 'Title', className: 'text-xl font-semibold', sample: 'Seasonal produce guide' },
  { label: 'Body large', className: 'text-lg', sample: 'Direct. Confident. No hedging.' },
  { label: 'Body', className: 'text-base', sample: 'Quality you can trust. Service that delivers.' },
  { label: 'Caption', className: 'text-[13px] text-muted-foreground', sample: 'Updated weekly · Driver edition' },
  { label: 'Eyebrow', className: 'text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground', sample: 'Section label' },
  { label: 'Button', className: 'text-[13px] font-semibold uppercase tracking-[0.08em]', sample: 'Order now' },
] as const;

const SPACING_SCALE = [
  { label: '4px · s-2', px: 16 },
  { label: '8px · s-3', px: 32 },
  { label: '16px · s-5', px: 64 },
  { label: '24px · s-7', px: 96 },
  { label: '48px · s-10', px: 192 },
] as const;

// ─── Pages ─────────────────────────────────────────────────────────────────

export function OverviewPage() {
  return (
    <div className="space-y-4">
      {/* Core palette callout */}
      <section className="rounded-xl border bg-card p-5 text-card-foreground">
        <Eyebrow className="mb-3">Core palette</Eyebrow>
        <p className="mb-4 text-sm text-muted-foreground">
          Cream is the default surface · greens carry brand and comms canvases · lime is the single loud accent · gold for caution / local · red/alert only for safety.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {CORE_SWATCHES.map((s) => <Swatch key={s.name} {...s} />)}
        </div>
      </section>

      {/* Pilot components grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Buttons */}
        <section className="rounded-xl border bg-card p-5 text-card-foreground">
          <Eyebrow className="mb-3">Buttons</Eyebrow>
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="cta">CTA Lime</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Safety</Button>
          </div>
        </section>

        {/* Badges / chips */}
        <section className="rounded-xl border bg-card p-5 text-card-foreground">
          <Eyebrow className="mb-3">Chips</Eyebrow>
          <div className="flex flex-wrap gap-2">
            <Badge variant="local">Local</Badge>
            <Badge variant="featured">Featured</Badge>
            <Badge variant="supply">Supply Update</Badge>
            <Badge>Default</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </section>
      </div>

      {/* Card */}
      <section className="rounded-xl border bg-card p-5 text-card-foreground">
        <Eyebrow className="mb-3">Card — editorial rhythm</Eyebrow>
        <Card className="max-w-sm">
          <CardHeader>
            <Eyebrow accent>Peak season</Eyebrow>
            <CardTitle className="font-serif text-2xl font-bold uppercase mt-1">Stone fruit arrives</CardTitle>
            <CardDescription>White peaches, nectarines, and donut peaches from Hudson Valley.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Order by Thursday for Friday delivery to your dock.
          </CardContent>
          <CardFooter className="gap-2">
            <Button size="sm">Order now</Button>
            <Button size="sm" variant="outline">See all</Button>
          </CardFooter>
        </Card>
      </section>

      {/* Alert / callout */}
      <section className="rounded-xl border bg-card p-5 text-card-foreground space-y-3">
        <Eyebrow className="mb-1">Alerts — safety callouts</Eyebrow>
        <Alert variant="safety">
          <ShieldAlert />
          <AlertTitle>Chock your wheels</AlertTitle>
          <AlertDescription>Place wheel chocks before leaving cab. Required at all Baldor docks.</AlertDescription>
        </Alert>
        <Alert variant="info">
          <AlertTitle>Supply update</AlertTitle>
          <AlertDescription>Hass avocados temporarily limited — expect 3-day lead time.</AlertDescription>
        </Alert>
      </section>

      {/* Eyebrow utility */}
      <section className="rounded-xl border bg-card p-5 text-card-foreground space-y-4">
        <Eyebrow className="mb-1">Eyebrow text</Eyebrow>
        <div className="space-y-1">
          <Eyebrow>Muted — default above body</Eyebrow>
          <p className="font-serif text-2xl font-bold uppercase">Drive safe. Deliver fresh.</p>
        </div>
        <div className="space-y-1">
          <Eyebrow accent>Lime accent — key headlines</Eyebrow>
          <p className="font-serif text-2xl font-bold uppercase">Quality you can trust.</p>
        </div>
      </section>
    </div>
  );
}

export function ColorsPage() {
  return (
    <div className="space-y-8 rounded-xl border bg-card p-6 text-card-foreground">
      <section className="space-y-4">
        <div>
          <h2 className="font-semibold">Core palette</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Primary CTA (green-primary), lime accent, cream surface — the three roles every surface is built from.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {CORE_SWATCHES.map((s) => <Swatch key={s.name} {...s} />)}
        </div>
      </section>

      <section className="space-y-4 border-t pt-6">
        <div>
          <h2 className="font-semibold">Greens — brand spine</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            From deep-green-black (cover/hero) through forest, primary, secondary, digital, to lime (the accent). Max 1–2 bg greens per artifact.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          {GREEN_SWATCHES.map((s) => <Swatch key={s.name} {...s} />)}
        </div>
        <Guidelines items={[
          { kind: 'do', text: 'Use cream as the default surface; bring in a single green for brand canvases.' },
          { kind: 'do', text: 'Use lime as the one loud accent — numerals, CTA highlights, section rules.' },
          { kind: 'dont', text: 'Stack more than two background colors in a single artifact.' },
          { kind: 'dont', text: 'Use deep-green-black and forest green as backgrounds in the same view.' },
        ]} />
      </section>

      <section className="space-y-4 border-t pt-6">
        <div>
          <h2 className="font-semibold">Cream surface tones + ink</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Paper hierarchy: cream (bg) → cream-panel → white (elevated). Ink scale for text.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          {CREAM_SWATCHES.map((s) => <Swatch key={s.name} {...s} />)}
        </div>
      </section>

      <section className="space-y-4 border-t pt-6">
        <div>
          <h2 className="font-semibold">Accents and semantic</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gold = Local tag / caution. Purple = Featured. Sky = Supply Update / info. Alert = safety only.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
          {ACCENT_SWATCHES.map((s) => <Swatch key={s.name} {...s} />)}
        </div>
        <Guidelines items={[
          { kind: 'do', text: 'Reserve red/alert exclusively for safety warnings and destructive actions.' },
          { kind: 'do', text: 'Use gold for Local tags, peak-season callouts, and caution signage.' },
          { kind: 'dont', text: 'Use alert red for general errors or UI feedback — only safety.' },
        ]} />
      </section>
    </div>
  );
}

export function FontsPage() {
  return (
    <div className="space-y-8 rounded-xl border bg-card p-6 text-card-foreground">
      <section className="space-y-3">
        <Eyebrow>Font families</Eyebrow>
        <div className="space-y-4 mt-2">
          <div className="border rounded-lg p-4">
            <Eyebrow className="mb-1">Display — Barlow Condensed</Eyebrow>
            <p className="font-serif text-4xl font-black uppercase leading-[0.92] tracking-tight">Freshness Delivered Daily</p>
            <p className="mt-2 text-xs text-muted-foreground">Substitutes proprietary <span className="font-mono">Ruder Plakat</span>. Always UPPERCASE for poster headlines. Weights 400–900.</p>
          </div>
          <div className="border rounded-lg p-4">
            <Eyebrow className="mb-1">Body — DM Sans</Eyebrow>
            <p className="text-lg">Direct. Confident. Plain. Imperative for instructions — "Chock your wheels." No AI-slop tropes.</p>
            <p className="mt-1 text-base italic text-muted-foreground">Italic available for driver communications and editorial pull quotes.</p>
            <p className="mt-2 text-xs text-muted-foreground">Substitutes proprietary <span className="font-mono">Herbik</span>. Weights 300–700, italic.</p>
          </div>
          <div className="border rounded-lg p-4">
            <Eyebrow className="mb-1">Accent / Kicker — Space Grotesk</Eyebrow>
            <p className="font-mono text-xl font-semibold tracking-[0.02em]">Quality you can trust. Service that delivers.</p>
            <p className="mt-2 text-xs text-muted-foreground">Substitutes proprietary <span className="font-mono">FT Polar</span>. Used for pull quotes and section kickers. Weight 600.</p>
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t pt-6">
        <Eyebrow>Type scale</Eyebrow>
        <div className="mt-2 space-y-5">
          {TYPE_SCALE.map((entry) => (
            <div key={entry.label} className="grid gap-1 sm:grid-cols-[120px_1fr]">
              <span className="pt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground self-start">{entry.label}</span>
              <p className={entry.className}>{entry.sample}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 border-t pt-6">
        <Eyebrow>Usage rules</Eyebrow>
        <Guidelines items={[
          { kind: 'do', text: 'Use Barlow Condensed (font-serif) UPPERCASE for display and poster headlines.' },
          { kind: 'do', text: 'Use DM Sans (font-sans) for all body copy, captions, and UI controls.' },
          { kind: 'do', text: 'Use Space Grotesk (font-mono) for pull quotes and section kickers.' },
          { kind: 'dont', text: 'Substitute Inter, Roboto, or Arial for display headlines — they lack the condensed poster quality.' },
          { kind: 'dont', text: 'Use sentence case for display or headline type. Baldor display is always UPPERCASE.' },
        ]} />
      </section>
    </div>
  );
}

export function LayoutPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Spacing */}
        <section className="rounded-xl border bg-card p-6 text-card-foreground">
          <Eyebrow className="mb-4">Spacing scale (4pt grid)</Eyebrow>
          <div className="space-y-3">
            {SPACING_SCALE.map((sp) => (
              <div key={sp.label} className="flex items-center gap-4">
                <span className="w-24 shrink-0 text-[10px] font-mono text-muted-foreground">{sp.label}</span>
                <div className="h-3 rounded-full bg-primary" style={{ width: sp.px }} />
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Full scale: 2/4/8/12/16/20/24/32/40/48/64/96px. Never invent values outside this scale.</p>
        </section>

        {/* Radius */}
        <section className="rounded-xl border bg-card p-6 text-card-foreground">
          <Eyebrow className="mb-4">Radius scale</Eyebrow>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'r-xs · 4px', className: 'rounded-[4px]' },
              { label: 'r-sm · 8px', className: 'rounded-md' },
              { label: 'r-md · 12px', className: 'rounded-xl' },
              { label: 'r-lg · 16px', className: 'rounded-[16px]' },
              { label: 'r-xl · 24px', className: 'rounded-[24px]' },
              { label: 'pill · 999px', className: 'rounded-full' },
            ].map((r) => (
              <div key={r.label} className={`flex h-16 items-end border bg-muted p-2.5 ${r.className}`}>
                <span className="text-[10px] font-mono text-muted-foreground">{r.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Shadows */}
      <section className="rounded-xl border bg-card p-6 text-card-foreground">
        <Eyebrow className="mb-4">Shadow scale</Eyebrow>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'sm', style: '0 1px 2px rgba(24,34,48,.06)' },
            { label: 'md', style: '0 4px 12px rgba(24,34,48,.08)' },
            { label: 'lg', style: '0 12px 32px rgba(24,34,48,.12)' },
            { label: 'xl', style: '0 24px 56px rgba(24,34,48,.18)' },
          ].map((sh) => (
            <div key={sh.label} className="flex flex-col gap-2">
              <div className="h-16 rounded-lg bg-white" style={{ boxShadow: sh.style }} />
              <span className="text-[10px] font-mono text-muted-foreground">{sh.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">All shadows tinted rgba(24,34,48,α) — ink-true. Cream surface only.</p>
      </section>
    </div>
  );
}
