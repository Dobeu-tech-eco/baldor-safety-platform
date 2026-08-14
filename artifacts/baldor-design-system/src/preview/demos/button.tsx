import { Button } from '../../components/ui/button';
import { Row, Stack, Guidelines } from '../parts';
import { Truck, ArrowRight, Loader2 } from 'lucide-react';

export function ButtonDemo() {
  return (
    <div className="space-y-6 rounded-xl border bg-card p-6 text-card-foreground">
      <Stack label="Variants">
        <Row>
          <Button>Primary</Button>
          <Button variant="cta">CTA — Lime</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Safety action</Button>
        </Row>
      </Stack>

      <Stack label="Sizes">
        <Row>
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Truck"><Truck /></Button>
        </Row>
      </Stack>

      <Stack label="With icon">
        <Row>
          <Button><Truck /> Schedule delivery</Button>
          <Button variant="cta">Order now <ArrowRight /></Button>
          <Button variant="secondary"><Truck /> View route</Button>
        </Row>
      </Stack>

      <Stack label="States">
        <Row>
          <Button disabled>Disabled</Button>
          <Button disabled><Loader2 className="animate-spin" /> Loading</Button>
        </Row>
      </Stack>

      <div className="border-t pt-5">
        <Guidelines items={[
          { kind: 'do', text: 'Use the primary (green) button as the single main action per page.' },
          { kind: 'do', text: 'Reserve CTA lime for the single highest-emphasis call to action — order flow, sign-up.' },
          { kind: 'do', text: 'Use the safety/destructive variant only for irreversible safety-critical actions.' },
          { kind: 'dont', text: 'Place two primary or two CTA buttons side by side — one action leads.' },
          { kind: 'dont', text: 'Use ghost or link variants for high-value actions — they lack visual weight.' },
        ]} />
      </div>
    </div>
  );
}
