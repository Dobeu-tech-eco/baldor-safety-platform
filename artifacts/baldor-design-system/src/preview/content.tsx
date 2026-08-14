import { Eyebrow } from '../components/ui/eyebrow';
import { Guidelines } from './parts';

export function VoiceTonePage() {
  const comparisons: Array<{ do: string; dont: string }> = [
    {
      do: 'Chock your wheels before leaving the cab.',
      dont: "Please remember to ensure your vehicle's wheels are properly secured prior to exiting.",
    },
    {
      do: 'Hass avocados limited through Friday. Order early.',
      dont: "We're experiencing some supply constraints with our Hass avocado inventory at this time.",
    },
    {
      do: 'Order by Thursday. Delivers Friday.',
      dont: 'Orders placed before end of business Thursday will be delivered on Friday pending availability.',
    },
    {
      do: 'Call out tradeoffs honestly — no hype, no hedge.',
      dont: "We're excited to share this amazing opportunity that you definitely won't want to miss!",
    },
    {
      do: 'Quality you can trust. Service that delivers.',
      dont: 'Best-in-class synergistic food solutions for discerning culinary professionals.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Voice principles */}
      <section className="rounded-xl border bg-card p-6 text-card-foreground">
        <Eyebrow className="mb-4">Voice principles</Eyebrow>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { name: 'Direct', desc: 'Say the thing plainly. Cut qualifiers. Imperative for instructions.' },
            { name: 'Confident', desc: 'No hedging. No "please consider" or "you might want to." State it.' },
            { name: 'Plain', desc: 'No jargon, no corporate speak, no AI-slop superlatives. Real words.' },
          ].map((p) => (
            <div key={p.name} className="rounded-lg border p-4">
              <Eyebrow accent className="mb-1">{p.name}</Eyebrow>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Tagline: <span className="font-semibold text-foreground italic">"Quality you can trust. Service that delivers."</span>
        </p>
      </section>

      {/* Do / don't comparisons */}
      <section className="rounded-xl border bg-card p-6 text-card-foreground">
        <Eyebrow className="mb-4">Do / Don't comparisons</Eyebrow>
        <div className="space-y-4">
          {comparisons.map((c, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-2 text-sm">
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-primary mb-1">Do</span>
                <p>{c.do}</p>
              </div>
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-destructive mb-1">{"Don't"}</span>
                <p className="text-muted-foreground">{c.dont}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bilingual / driver-facing */}
      <section className="rounded-xl border bg-card p-6 text-card-foreground">
        <Eyebrow className="mb-4">Driver-facing copy</Eyebrow>
        <p className="text-sm text-muted-foreground mb-4">
          All driver-facing materials (postcards, dock signs, safety bulletins) include bilingual EN/ES copy. Other languages added as needed for the workforce.
        </p>
        <div className="space-y-3">
          {[
            { en: 'Chock your wheels before leaving the cab.', es: 'Cuña las ruedas antes de salir de la cabina.' },
            { en: 'Wear your hi-vis vest past the yellow line.', es: 'Use su chaleco de alta visibilidad después de la línea amarilla.' },
            { en: 'Check your mirrors before reversing.', es: 'Revise sus espejos antes de retroceder.' },
          ].map((pair, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-1">
              <p className="text-sm font-medium">{pair.en}</p>
              <p className="text-sm text-muted-foreground italic">{pair.es}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Formatting rules */}
      <section className="rounded-xl border bg-card p-6 text-card-foreground">
        <Eyebrow className="mb-4">Formatting rules</Eyebrow>
        <Guidelines items={[
          { kind: 'do', text: 'Use imperative verbs for instructions: "Chock your wheels", "Order by Thursday."' },
          { kind: 'do', text: 'Short sentences. One idea per sentence. Maximum two sentences per callout.' },
          { kind: 'do', text: 'Uppercase display/poster type for headlines (Barlow Condensed).' },
          { kind: 'do', text: 'Include EN/ES on all driver-facing material.' },
          { kind: 'dont', text: 'Use qualifiers: "please," "consider," "might," "perhaps," "feel free to."' },
          { kind: 'dont', text: 'Use emoji — not part of the Baldor brand.' },
          { kind: 'dont', text: 'Use superlatives: "best-in-class," "amazing," "world-class."' },
          { kind: 'dont', text: 'Write in passive voice for safety instructions.' },
        ]} />
      </section>
    </div>
  );
}
