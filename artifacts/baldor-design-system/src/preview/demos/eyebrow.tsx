import { Eyebrow } from '../../components/ui/eyebrow';
import { Stack, Guidelines } from '../parts';

export function EyebrowDemo() {
  return (
    <div className="space-y-6 rounded-xl border bg-card p-6 text-card-foreground">
      <Stack label="Default — muted foreground">
        <div className="space-y-1">
          <Eyebrow>Peak season arrivals</Eyebrow>
          <p className="font-serif text-3xl font-bold uppercase leading-[0.95]">Hudson Valley Stone Fruit</p>
        </div>
        <div className="space-y-1">
          <Eyebrow>Driver bulletin</Eyebrow>
          <p className="font-serif text-2xl font-bold uppercase">Dock safety update</p>
        </div>
        <div className="space-y-1">
          <Eyebrow>Section label</Eyebrow>
          <p className="text-base">Body copy follows — eyebrow establishes context before the content.</p>
        </div>
      </Stack>

      <Stack label="Accent — lime, for key headlines">
        <div className="space-y-1">
          <Eyebrow accent>Quality you can trust</Eyebrow>
          <p className="font-serif text-3xl font-bold uppercase leading-[0.95]">Direct. Fresh. Reliable.</p>
        </div>
        <div className="space-y-1">
          <Eyebrow accent>Local harvest</Eyebrow>
          <p className="font-serif text-2xl font-bold uppercase">Grown within 150 miles</p>
        </div>
      </Stack>

      <Stack label="On forest canvas">
        <div className="rounded-lg p-6" style={{ background: '#064725' }}>
          <Eyebrow className="text-[#B3CF44] mb-1">Safety bulletin</Eyebrow>
          <p className="font-serif text-2xl font-bold uppercase text-white leading-[0.95]">Chock your wheels</p>
        </div>
      </Stack>

      <div className="border-t pt-5">
        <Guidelines items={[
          { kind: 'do', text: 'Place eyebrows directly above the headline with 4–8px gap.' },
          { kind: 'do', text: 'Use lime (accent) eyebrows sparingly — only on the single most important headline per view.' },
          { kind: 'do', text: 'Keep eyebrow copy short: 2–4 words max.' },
          { kind: 'dont', text: 'Use eyebrows as standalone labels without a following headline.' },
          { kind: 'dont', text: 'Sentence-case eyebrows — they are always uppercase and tracked.' },
        ]} />
      </div>
    </div>
  );
}
