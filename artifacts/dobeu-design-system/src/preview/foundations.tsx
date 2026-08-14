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
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Guidelines } from './parts';

// Brand primitives with names and hex for the color page
const BRAND_PRIMITIVES = [
  { name: 'Indigo Primary', hex: '#6B5CE7', token: '--brand-indigo-primary', role: 'Left circle · light CTA · links' },
  { name: 'Indigo Slate', hex: '#5A4FAB', token: '--brand-indigo-slate', role: 'Right circle · wordmark · headings' },
  { name: 'Amber Warm', hex: '#F4A261', token: '--brand-amber-warm', role: 'Lens · dark CTA · rating stars' },
] as const;

const SURFACE_TOKENS = [
  { name: 'Dark Surface', hex: '#1A1A2E', token: '--brand-dark-surface', role: 'Dark page background' },
  { name: 'Dark Elevated', hex: '#242440', token: '--brand-dark-elevated', role: 'Dark card surface' },
  { name: 'Cream Soft', hex: '#FFF8F0', token: '--brand-cream-soft', role: 'Light card surface' },
  { name: 'Neutral Gray', hex: '#F5F5F7', token: '--brand-neutral-gray', role: 'Muted surface' },
] as const;

const SEMANTIC_TOKENS = [
  { name: 'Success', hex: '#4CAF50', token: '--semantic-success', role: 'Positive states · dobeu.io accent' },
  { name: 'Warning', hex: '#F4A261', token: '--semantic-warning', role: 'Same as amber warm' },
  { name: 'Error', hex: '#E07A5F', token: '--semantic-error', role: 'Destructive actions' },
] as const;

const ROLE_SWATCHES = [
  { name: 'Primary', className: 'bg-primary' },
  { name: 'Secondary', className: 'bg-secondary' },
  { name: 'Accent', className: 'bg-accent' },
] as const;

const SUPPORTING_SWATCHES = [
  { name: 'Background', className: 'border bg-background' },
  { name: 'Foreground', className: 'bg-foreground' },
  { name: 'Muted', className: 'bg-muted' },
  { name: 'Destructive', className: 'bg-destructive' },
  { name: 'Border', className: 'bg-border' },
] as const;

// Dobeu type scale from the design system spec
const TYPE_SCALE = [
  { label: 'Display', className: 'font-extrabold', style: { fontSize: 48, lineHeight: 1.05, letterSpacing: '-0.02em' } },
  { label: 'H1', className: 'font-extrabold', style: { fontSize: 36, lineHeight: 1.10, letterSpacing: '-0.01em' } },
  { label: 'H2', className: 'font-bold', style: { fontSize: 28, lineHeight: 1.15, letterSpacing: '-0.005em' } },
  { label: 'H3', className: 'font-bold', style: { fontSize: 22, lineHeight: 1.20 } },
  { label: 'H4', className: 'font-bold', style: { fontSize: 18, lineHeight: 1.30 } },
  { label: 'Body', className: 'font-normal', style: { fontSize: 16, lineHeight: 1.55 } },
  { label: 'Small', className: 'font-normal', style: { fontSize: 14, lineHeight: 1.50 } },
  { label: 'Label', className: 'font-bold uppercase tracking-widest', style: { fontSize: 12, lineHeight: 1.20 } },
  { label: 'Code', className: 'font-mono font-normal', style: { fontSize: 13, lineHeight: 1.55 } },
] as const;

const SPACING_SCALE = [
  { label: '4px', className: 'w-4' },
  { label: '8px', className: 'w-8' },
  { label: '16px', className: 'w-16' },
  { label: '24px', className: 'w-24' },
  { label: '40px', className: 'w-40' },
] as const;

function ColorSwatch({
  name,
  hex,
  token,
  role,
}: {
  name: string;
  hex: string;
  token: string;
  role: string;
}) {
  return (
    <div className="space-y-2">
      <div className="h-14 rounded-lg border" style={{ background: hex }} />
      <div>
        <p className="text-sm font-semibold">{name}</p>
        <p className="text-xs font-mono text-muted-foreground">{hex}</p>
        <p className="text-xs text-muted-foreground">{role}</p>
      </div>
    </div>
  );
}

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="space-y-2">
      <div className={`h-14 rounded-lg ${className}`} />
      <p className="text-sm font-medium">{name}</p>
    </div>
  );
}

export function OverviewPage() {
  return (
    <div className="space-y-4">
      {/* Core CTA swap callout */}
      <section className="rounded-xl border bg-card p-5 text-card-foreground">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Core palette
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          <strong>CTA swap:</strong> indigo in light mode, amber in dark — the primary button always reads against its surface.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {ROLE_SWATCHES.map((swatch) => (
            <Swatch key={swatch.name} {...swatch} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5 text-card-foreground">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Typography — Nunito
          </h2>
          <div className="mt-4 space-y-3">
            {[
              { label: 'Display 48', className: 'font-extrabold', style: { fontSize: 32, letterSpacing: '-0.02em' } },
              { label: 'Heading 28', className: 'font-bold', style: { fontSize: 22 } },
              { label: 'Body 16', className: 'font-normal', style: { fontSize: 16, lineHeight: 1.55 } },
              { label: 'Label', className: 'font-bold uppercase tracking-widest', style: { fontSize: 12 } },
            ].map((entry) => (
              <p key={entry.label} className={entry.className} style={entry.style}>
                {entry.label}
              </p>
            ))}
            <p className="font-mono text-sm text-muted-foreground" style={{ fontSize: 13 }}>
              Code: JetBrains Mono
            </p>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-5 text-card-foreground">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            In use
          </h2>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Software review</CardTitle>
              <CardDescription>
                Honest, plain-language analysis — no hype, no hedges.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="overview-name">Product name</Label>
                <Input id="overview-name" placeholder="Enter a product" />
              </div>
              <div className="flex items-center gap-2">
                <Switch defaultChecked id="overview-notify" />
                <Label htmlFor="overview-notify">Email updates</Label>
                <Badge className="ml-auto">New</Badge>
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button>Save</Button>
              <Button variant="outline">Cancel</Button>
            </CardFooter>
          </Card>
        </section>
      </div>

      <section className="space-y-4 rounded-xl border bg-card p-5 text-card-foreground">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Components
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Badge>Badge</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>
    </div>
  );
}

export function ColorsPage() {
  return (
    <div className="space-y-8 rounded-xl border bg-card p-6 text-card-foreground">

      {/* Brand primitives */}
      <section className="space-y-4">
        <div>
          <h2 className="font-semibold">Brand primitives</h2>
          <p className="text-sm text-muted-foreground">
            Seven brand colors, directly from the logo. All three purples come from The Overlap mark.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {BRAND_PRIMITIVES.map((s) => (
            <ColorSwatch key={s.name} {...s} />
          ))}
        </div>
      </section>

      {/* CTA swap rule */}
      <section className="space-y-3 border-t pt-6">
        <div>
          <h2 className="font-semibold">CTA swap</h2>
          <p className="text-sm text-muted-foreground">
            Primary (CTA) swaps between modes so it always reads against its surface.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg p-4 space-y-2 border" style={{ background: '#FFFFFF' }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#888' }}>Light mode</p>
            <div className="inline-flex h-9 items-center rounded-md px-4 text-sm font-medium text-white" style={{ background: '#6B5CE7' }}>
              Indigo CTA
            </div>
          </div>
          <div className="rounded-lg p-4 space-y-2 border" style={{ background: '#1A1A2E' }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9A9AB0' }}>Dark mode</p>
            <div className="inline-flex h-9 items-center rounded-md px-4 text-sm font-medium" style={{ background: '#F4A261', color: '#2D2D3A' }}>
              Amber CTA
            </div>
          </div>
        </div>
      </section>

      {/* Surfaces */}
      <section className="space-y-4 border-t pt-6">
        <div>
          <h2 className="font-semibold">Surfaces</h2>
          <p className="text-sm text-muted-foreground">
            Flat fills only — no gradients, no photography in marketing. Hero is always the mark on a flat dark or cream surface.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {SURFACE_TOKENS.map((s) => (
            <ColorSwatch key={s.name} {...s} />
          ))}
        </div>
      </section>

      {/* Semantic */}
      <section className="space-y-4 border-t pt-6">
        <div>
          <h2 className="font-semibold">Semantic colors</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {SEMANTIC_TOKENS.map((s) => (
            <ColorSwatch key={s.name} {...s} />
          ))}
        </div>
      </section>

      {/* Semantic roles in context */}
      <section className="space-y-4 border-t pt-6">
        <div>
          <h2 className="font-semibold">Semantic roles — current theme</h2>
          <p className="text-sm text-muted-foreground">
            Role swatches rendered from the active CSS theme variables.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {SUPPORTING_SWATCHES.map((swatch) => (
            <Swatch key={swatch.name} {...swatch} />
          ))}
        </div>
      </section>

      {/* Usage guidelines */}
      <section className="space-y-4 border-t pt-6">
        <h2 className="font-semibold">Color usage guidelines</h2>
        <Guidelines items={[
          { kind: 'do', text: 'Use indigo as the primary CTA in light mode; amber in dark mode.' },
          { kind: 'do', text: 'Use amber only as accent dots, rating stars, bars, or dark-mode CTA — never on large surfaces.' },
          { kind: 'do', text: 'Use 1px solid borders — brand-border-light (#E0DFF5) in light, brand-border-dark (#2A2A45) in dark.' },
          { kind: 'dont', text: 'Use gradients or drop-shadows on hero elements.' },
          { kind: 'dont', text: 'Use colored borders on cards except active/selected state (indigo).' },
          { kind: 'dont', text: 'Apply amber to large surface backgrounds.' },
        ]} />
      </section>
    </div>
  );
}

export function FontsPage() {
  return (
    <div className="space-y-8 rounded-xl border bg-card p-6 text-card-foreground">
      {/* Primary family */}
      <section className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Primary — Nunito
        </h2>
        <p className="text-4xl font-extrabold" style={{ letterSpacing: '-0.02em' }}>
          The quick brown fox
        </p>
        <p className="text-sm text-muted-foreground">
          Warm rounded humanist. Weights 400 / 500 / 600 / 700 / 800. Fallback: Quicksand.
          Used for all UI copy, headings, labels, and the wordmark (800 ExtraBold, all-lowercase).
        </p>
        <p
          className="font-extrabold lowercase"
          style={{ fontFamily: 'Nunito, Quicksand, sans-serif', fontSize: '1.5rem', letterSpacing: '-0.02em', color: '#5A4FAB' }}
        >
          dobeu
        </p>
      </section>

      {/* Mono family */}
      <section className="space-y-2 border-t pt-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Mono — JetBrains Mono
        </h2>
        <p className="font-mono" style={{ fontSize: 13, lineHeight: 1.55 }}>
          const reviews = await fetch('/api/reviews?sort=honest')
        </p>
        <p className="text-sm text-muted-foreground">
          Weights 400 / 500 / 700. Used for code blocks, token values, and dev-portal UI chrome.
        </p>
      </section>

      {/* Type scale */}
      <section className="space-y-4 border-t pt-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Type scale
        </h2>
        {TYPE_SCALE.map((entry) => (
          <div key={entry.label} className="grid gap-1 sm:grid-cols-[96px_1fr]">
            <span className="pt-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {entry.label}
            </span>
            <p className={entry.className} style={entry.style as React.CSSProperties}>
              Build products people understand.
            </p>
          </div>
        ))}
      </section>

      {/* Usage */}
      <section className="space-y-4 border-t pt-6">
        <h2 className="font-semibold">Typography guidelines</h2>
        <Guidelines items={[
          { kind: 'do', text: 'Set headings in Nunito 800 (ExtraBold) with negative tracking.' },
          { kind: 'do', text: 'Use Label style (12px / 700 / uppercase / 0.08em tracking) for meta labels like RATINGS · TAGS.' },
          { kind: 'do', text: 'Write "dobeu" and all TLDs in lowercase — in code, UI, and copy.' },
          { kind: 'dont', text: 'Retype the wordmark — use the PNG/SVG masters.' },
          { kind: 'dont', text: 'Mix Nunito with unrelated display faces. Nunito is the only sans.' },
        ]} />
      </section>
    </div>
  );
}

export function LayoutPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Spacing */}
      <section className="rounded-xl border bg-card p-6 text-card-foreground">
        <h2 className="font-semibold">Spacing — 4pt grid</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          All spacing is a multiple of 4px. Card internal padding: 20px. Navbar height: 64px fixed.
        </p>
        <div className="mt-6 space-y-4">
          {SPACING_SCALE.map((space) => (
            <div key={space.label} className="flex items-center gap-4">
              <span className="w-10 text-xs font-mono text-muted-foreground">
                {space.label}
              </span>
              <div className={`h-3 rounded-full bg-primary ${space.className}`} />
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-2 text-sm border-t pt-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Key values</p>
          {[
            { label: 'Card padding', value: '20px (28px in hub layout)' },
            { label: 'Navbar height', value: '64px — never taller' },
            { label: 'Page gutter (1440+)', value: '80px' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-mono text-xs">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Radius */}
      <section className="rounded-xl border bg-card p-6 text-card-foreground">
        <h2 className="font-semibold">Radius</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Four sizes plus pill. Base = 12px (buttons, inputs, avatars).
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4">
          {[
            { label: 'sm — 6px', note: 'Tags, badges, tight controls', className: 'rounded-sm' },
            { label: 'md — 12px', note: 'Buttons, inputs, avatars', className: 'rounded-md' },
            { label: 'lg — 20px', note: 'Cards, modals, hero elements', className: 'rounded-lg' },
            { label: 'Pill — 999px', note: 'Rating chips, status pills', className: 'rounded-full' },
          ].map((radius) => (
            <div
              key={radius.label}
              className={`flex h-24 flex-col justify-end border bg-muted p-3 ${radius.className}`}
            >
              <span className="text-xs font-medium">{radius.label}</span>
              <span className="text-xs text-muted-foreground">{radius.note}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Elevation */}
      <section className="rounded-xl border bg-card p-6 text-card-foreground lg:col-span-2">
        <h2 className="font-semibold">Elevation & shadows</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Four-step scale, all warm-tinted toward <code className="font-mono text-xs bg-muted px-1 rounded">rgba(26,26,46,*)</code> — never pure black, never above ~18% alpha. No inner shadows.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'xs', shadow: '0 1px 2px rgba(26,26,46,0.06)', note: 'Subtle lift' },
            { label: 'sm', shadow: '0 2px 6px rgba(26,26,46,0.08)', note: 'Cards at rest' },
            { label: 'md', shadow: '0 6px 18px rgba(26,26,46,0.10)', note: 'Cards on hover' },
            { label: 'lg', shadow: '0 16px 40px rgba(26,26,46,0.14)', note: 'Modals, sheets' },
          ].map(({ label, shadow, note }) => (
            <div
              key={label}
              className="flex h-20 flex-col justify-end rounded-lg bg-background p-3 border"
              style={{ boxShadow: shadow }}
            >
              <span className="text-xs font-mono font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">{note}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
