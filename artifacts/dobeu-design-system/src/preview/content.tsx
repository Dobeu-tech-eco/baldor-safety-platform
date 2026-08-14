import { Guidelines } from './parts';

const VOICE_EXAMPLES = [
  { do: 'Simplify your software decisions', dont: 'Revolutionize your SaaS procurement journey' },
  { do: 'Your AI pair programmer', dont: 'Unlock next-gen AI-powered developer productivity' },
  { do: 'Honest software reviews', dont: 'Crowdsourced ecosystem intelligence' },
  { do: 'We read the release notes so you don\'t have to', dont: 'Stay ahead of the curve with our platform' },
];

export function ContentPage() {
  return (
    <div className="space-y-8">

      {/* Voice */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <div>
          <h2 className="font-semibold">Voice</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Second-person, direct, confident — never salesy. The knowledgeable friend who used
            the software and tells you honestly whether it's any good. Short sentences, plain words.
          </p>
        </div>
        <Guidelines items={[
          { kind: 'do', text: 'Say "you" and "we" — never "our users" or third-person marketing-speak.' },
          { kind: 'do', text: 'Sentence case for UI labels, headings, and buttons.' },
          { kind: 'do', text: 'Write "dobeu" and TLD always lowercase: dobeu.dev, dobeu.net.' },
          { kind: 'do', text: "Call out tradeoffs honestly — don't hype, don't hedge." },
          { kind: 'dont', text: 'Use exclamation marks in product UI.' },
          { kind: 'dont', text: 'Use emoji in UI. The one "visual emoji" is the mark itself.' },
          { kind: 'dont', text: 'Use ellipses except for loading states.' },
        ]} />
      </section>

      {/* Example comparisons */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Examples</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-6 font-medium text-muted-foreground uppercase tracking-wide text-xs">Do</th>
                <th className="text-left py-2 font-medium text-muted-foreground uppercase tracking-wide text-xs">Don't</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {VOICE_EXAMPLES.map(({ do: doText, dont }) => (
                <tr key={doText}>
                  <td className="py-3 pr-6 text-primary font-medium">{doText}</td>
                  <td className="py-3 text-muted-foreground line-through decoration-destructive/60">{dont}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Formatting rules */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Formatting</h2>
        <div className="grid gap-4 sm:grid-cols-2 text-sm">
          <div className="space-y-1">
            <p className="font-medium">Numbers</p>
            <p className="text-muted-foreground">Ratings as numeric <span className="font-mono bg-muted px-1 rounded">4.8</span> + star icons. Prices use currency symbols. Dates as <span className="font-mono bg-muted px-1 rounded">Apr 24, 2026</span> (consumer) or <span className="font-mono bg-muted px-1 rounded">2026-04-24</span> (dev docs).</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium">Uppercase</p>
            <p className="text-muted-foreground">Reserved for tiny meta labels only: <span className="tracking-widest text-xs font-medium">RATINGS · BADGES · TAGS</span>. Never used for body or heading copy.</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium">Punctuation</p>
            <p className="text-muted-foreground">No exclamation marks in product UI. Ellipses only for loading. Em-dashes fine in marketing copy.</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium">Casing</p>
            <p className="text-muted-foreground">Sentence case everywhere — headings, buttons, nav items. <code className="font-mono bg-muted px-1 rounded text-xs">dobeu</code> always lowercase, including in code and UI.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
