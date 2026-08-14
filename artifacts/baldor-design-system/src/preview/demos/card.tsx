import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Eyebrow } from '../../components/ui/eyebrow';
import { Stack, Guidelines } from '../parts';

export function CardDemo() {
  return (
    <div className="space-y-6 rounded-xl border bg-card p-6 text-card-foreground">
      {/* Editorial card */}
      <Stack label="Editorial card — cream surface">
        <Card className="max-w-sm">
          <CardHeader>
            <Eyebrow className="mb-1">Peak season</Eyebrow>
            <CardTitle className="font-serif text-2xl font-bold uppercase leading-tight">Stone Fruit Arrives</CardTitle>
            <CardDescription>White peaches, nectarines, and donut peaches from Hudson Valley.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            Order by Thursday for Friday delivery to your dock. Quantities limited — reserve early.
          </CardContent>
          <CardFooter className="gap-2">
            <Button size="sm">Order now</Button>
            <Button size="sm" variant="outline">See full list</Button>
          </CardFooter>
        </Card>
      </Stack>

      {/* Card with category chips */}
      <Stack label="Card with category chips">
        <Card className="max-w-sm">
          <CardHeader>
            <div className="flex gap-2 mb-2">
              <Badge variant="local">Local</Badge>
              <Badge variant="featured">Featured</Badge>
            </div>
            <CardTitle className="font-serif text-xl font-bold uppercase">Baldor Heirloom Mix</CardTitle>
            <CardDescription>Tomatoes grown within 150 miles of the Bronx terminal.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Available June–September. Sourced from 12 partner farms.
          </CardContent>
          <CardFooter>
            <Button size="sm" variant="cta">Request sample</Button>
          </CardFooter>
        </Card>
      </Stack>

      {/* Forest comms canvas card */}
      <Stack label="Forest comms canvas — driver / signage context">
        <div className="rounded-xl p-6 max-w-sm" style={{ background: '#064725', color: '#FAF8F3' }}>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: '#B3CF44' }}>
            Safety reminder
          </span>
          <p className="font-serif text-2xl font-black uppercase leading-[0.95] mb-3">
            Chock your wheels before leaving your cab.
          </p>
          <p className="text-sm" style={{ color: '#FAF8F3', opacity: 0.85 }}>
            Required at all Baldor NY docks. En español: cuña las ruedas.
          </p>
        </div>
      </Stack>

      <div className="border-t pt-5">
        <Guidelines items={[
          { kind: 'do', text: 'Follow eyebrow → headline → body rhythm. Eyebrow sets context; headline leads; body explains.' },
          { kind: 'do', text: 'Use white (bg-card) on cream surface for elevation; forest green for comms canvases.' },
          { kind: 'do', text: 'Use r-lg (16px) for cards — matches the spec scale.' },
          { kind: 'dont', text: 'Add generic rounded-left-border accent cards (not in brand).' },
          { kind: 'dont', text: 'Mix more than 2 background colors inside a single card.' },
        ]} />
      </div>
    </div>
  );
}
