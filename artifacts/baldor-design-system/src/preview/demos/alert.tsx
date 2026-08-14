import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';
import { ShieldAlert, Info, AlertTriangle } from 'lucide-react';
import { Stack, Guidelines } from '../parts';

export function AlertDemo() {
  return (
    <div className="space-y-6 rounded-xl border bg-card p-6 text-card-foreground">
      <Stack label="Safety callout — driver comms, dock signage">
        <Alert variant="safety">
          <ShieldAlert />
          <AlertTitle>Chock your wheels</AlertTitle>
          <AlertDescription>
            Place wheel chocks before leaving cab. Required at all Baldor NY docks.<br />
            <span className="text-muted-foreground italic text-[12px]">Cuña las ruedas antes de salir de la cabina.</span>
          </AlertDescription>
        </Alert>
        <Alert variant="safety">
          <ShieldAlert />
          <AlertTitle>High-visibility zone</AlertTitle>
          <AlertDescription>
            Wear your hi-vis vest at all times past the yellow line.
          </AlertDescription>
        </Alert>
      </Stack>

      <Stack label="Supply update — info">
        <Alert variant="info">
          <Info />
          <AlertTitle>Supply update</AlertTitle>
          <AlertDescription>
            Hass avocados temporarily limited — expect 3-day lead time through Friday.
          </AlertDescription>
        </Alert>
        <Alert variant="info">
          <AlertTitle>Route change</AlertTitle>
          <AlertDescription>
            FDR Drive closed northbound Saturday 6am–2pm. Use Harlem River Drive alternate.
          </AlertDescription>
        </Alert>
      </Stack>

      <Stack label="Default callout">
        <Alert>
          <AlertTriangle />
          <AlertTitle>Order deadline</AlertTitle>
          <AlertDescription>
            Holiday orders must be placed by December 20th for guaranteed delivery.
          </AlertDescription>
        </Alert>
      </Stack>

      <div className="border-t pt-5">
        <Guidelines items={[
          { kind: 'do', text: 'Use the safety variant (squared border, red) for physical-safety warnings — dock rules, chocking, hi-vis.' },
          { kind: 'do', text: 'Lead with an imperative verb: "Chock your wheels", not "Please ensure wheels are chocked."' },
          { kind: 'do', text: 'Include bilingual (EN/ES) copy for all driver-facing safety callouts.' },
          { kind: 'dont', text: 'Use the safety/destructive variant for general UX errors or form validation — reserve it for safety.' },
          { kind: 'dont', text: 'Add decorative accents or gradients to alerts — plain, boxed, high-contrast only.' },
        ]} />
      </div>
    </div>
  );
}
