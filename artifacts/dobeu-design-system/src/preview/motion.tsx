import { useState } from 'react';
import { Guidelines } from './parts';
import { Button } from '../components/ui/button';

function TransitionDemo({ label, style }: { label: string; style: React.CSSProperties }) {
  const [active, setActive] = useState(false);
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <button
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
        className="h-12 w-full rounded-md border bg-muted flex items-center justify-center text-sm text-muted-foreground cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ transition: 'all 175ms ease-out', ...active ? style : {} }}
      >
        Hover me
      </button>
    </div>
  );
}

export function MotionPage() {
  const [pressed, setPressed] = useState(false);

  return (
    <div className="space-y-8">

      {/* Principles */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <div>
          <h2 className="font-semibold">Motion principles</h2>
          <p className="text-sm text-muted-foreground mt-1">
            All transitions are 150–200ms <code className="font-mono text-xs bg-muted px-1 rounded">ease-out</code>.
            Small, purposeful — never bouncy, no spring, no scale pops.
          </p>
        </div>
        <Guidelines items={[
          { kind: 'do', text: 'Use 150–200ms ease-out for all transitions.' },
          { kind: 'do', text: 'Fades + small 4–8px translates only. Page transitions are opacity-only.' },
          { kind: 'do', text: 'Rating stars fill instantly (no transition — they convey fact, not process).' },
          { kind: 'do', text: 'Hover: brightness(0.94) on indigo, brightness(1.05) on dark surfaces.' },
          { kind: 'do', text: 'Press: translateY(1px) + darker brightness — no scale.' },
          { kind: 'do', text: 'Focus ring: 3px indigo rgba(107,92,231,0.22), offset 2px. Always visible.' },
          { kind: 'dont', text: 'Bounce, spring, or scale-pop animations anywhere in the UI.' },
          { kind: 'dont', text: 'Remove focus outlines — keyboard users rely on them.' },
          { kind: 'dont', text: 'Use border color change on hover — only brightness changes.' },
        ]} />
      </section>

      {/* Live demos */}
      <section className="rounded-xl border bg-card p-6 space-y-6">
        <h2 className="font-semibold">Interactive examples</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <TransitionDemo
            label="Hover — indigo button"
            style={{ filter: 'brightness(0.94)', background: '#6B5CE7', color: '#fff' }}
          />
          <TransitionDemo
            label="Hover — dark surface"
            style={{ filter: 'brightness(1.05)', background: '#242440', color: '#E0E0E0' }}
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Press — translateY(1px)</p>
          <button
            onMouseDown={() => setPressed(true)}
            onMouseUp={() => setPressed(false)}
            onMouseLeave={() => setPressed(false)}
            className="h-10 px-5 rounded-md text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{
              background: '#6B5CE7',
              transition: 'transform 150ms ease-out, filter 150ms ease-out',
              transform: pressed ? 'translateY(1px)' : 'none',
              filter: pressed ? 'brightness(0.88)' : 'none',
            }}
          >
            Hold to press
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Focus ring</p>
          <Button className="focus-visible:ring-[3px] focus-visible:ring-[rgba(107,92,231,0.22)] focus-visible:ring-offset-2">
            Tab to focus me
          </Button>
        </div>
      </section>

      {/* Timing tokens */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Timing reference</h2>
        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          {[
            { label: 'Hover / press', value: '150ms ease-out' },
            { label: 'Reveal / fade', value: '175ms ease-out' },
            { label: 'Page transition', value: 'opacity only, 200ms ease-out' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border bg-muted/40 p-3 space-y-1">
              <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="font-mono text-xs">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
