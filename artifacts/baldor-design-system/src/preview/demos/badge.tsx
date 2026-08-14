import { Badge } from '../../components/ui/badge';
import { Row, Stack, Guidelines } from '../parts';

export function BadgeDemo() {
  return (
    <div className="space-y-6 rounded-xl border bg-card p-6 text-card-foreground">
      <Stack label="Category chips">
        <Row label="Local — gold · peak-season · caution signage">
          <Badge variant="local">Local</Badge>
          <Badge variant="local">Hudson Valley</Badge>
          <Badge variant="local">Peak season</Badge>
        </Row>
        <Row label="Featured — purple">
          <Badge variant="featured">Featured</Badge>
          <Badge variant="featured">Chef's pick</Badge>
        </Row>
        <Row label="Supply Update — sky">
          <Badge variant="supply">Supply Update</Badge>
          <Badge variant="supply">Limited stock</Badge>
          <Badge variant="supply">Lead time: 3 days</Badge>
        </Row>
      </Stack>

      <Stack label="Base variants">
        <Row>
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Safety</Badge>
          <Badge variant="outline">Outline</Badge>
        </Row>
      </Stack>

      <Stack label="In context — editorial card chips">
        <div className="flex flex-wrap gap-2 p-4 rounded-lg border bg-background">
          <Badge variant="local">Local</Badge>
          <Badge variant="featured">Featured</Badge>
          <span className="font-serif text-lg font-bold uppercase ml-1">Hudson Valley Peaches</span>
        </div>
        <div className="flex flex-wrap gap-2 p-4 rounded-lg border bg-background">
          <Badge variant="supply">Supply Update</Badge>
          <span className="text-sm text-muted-foreground ml-1">Hass avocados — limited through Friday</span>
        </div>
      </Stack>

      <div className="border-t pt-5">
        <Guidelines items={[
          { kind: 'do', text: 'Use uppercase, small-caps style — chips are always .t-eyebrow (tracked uppercase).' },
          { kind: 'do', text: 'Place chips above or beside headlines, not below copy.' },
          { kind: 'do', text: 'Use gold (local) for origin/geography tags and caution signage labels.' },
          { kind: 'dont', text: 'Mix more than 2 category chip types on a single card.' },
          { kind: 'dont', text: 'Use the destructive/safety chip for anything other than safety-critical states.' },
        ]} />
      </div>
    </div>
  );
}
