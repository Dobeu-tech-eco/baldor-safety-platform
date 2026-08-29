import { ACCIDENT_TYPES } from '../lib/classify';

export default function Methodology() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Methodology</h1>
        <p className="text-sm text-gray-500 mt-1">
          Classification and charting rules used across Safety Insights. All auto chart families follow these rules.
        </p>
      </div>

      <ol className="space-y-5 list-decimal list-inside text-sm text-gray-800">
        <li className="space-y-1">
          <span className="font-semibold text-gray-900">First record only.</span>
          <p className="ml-5 text-gray-700">
            Each accident is counted once. Suffixed follow-on rows (record ids ending in <code className="text-xs bg-gray-100 px-1 rounded">-##</code>)
            are dropped. Ingest marks these as follow-ons (<code className="text-xs bg-gray-100 px-1 rounded">is_followon</code>); charts exclude them.
          </p>
        </li>

        <li className="space-y-1">
          <span className="font-semibold text-gray-900">Injuries excluded from auto charts.</span>
          <p className="ml-5 text-gray-700">
            Families 1–4 and APMM use auto (vehicle) accidents only. Injury rows are identified when the Origami incident type
            contains “injured” and are shown on the Injuries page, not mixed into auto type or APMM charts.
          </p>
        </li>

        <li className="space-y-1">
          <span className="font-semibold text-gray-900">Accident type from event description.</span>
          <p className="ml-5 text-gray-700">
            Type is classified from the event description with a fixed keyword list (maneuver-first), not from Origami Incident Type.
            Canonical types: {ACCIDENT_TYPES.join(', ')}. Unmapped descriptions become Other and are counted, not dropped.
            The same keyword order is used for both years in any YoY comparison.
          </p>
        </li>

        <li className="space-y-1">
          <span className="font-semibold text-gray-900">Preventable includes pending on type charts.</span>
          <p className="ml-5 text-gray-700">
            On Family 1 (accidents by type), blank or pending preventability is folded into Preventable. The legend reads
            “Preventable (incl. pending/blank)”. Families that exclude pending (certain YoY preventability views) state that in the footnote.
          </p>
        </li>

        <li className="space-y-1">
          <span className="font-semibold text-gray-900">APMM formula.</span>
          <p className="ml-5 text-gray-700">
            Accidents per million miles = (accidents ÷ miles) × 1,000,000. Only auto-related classified accidents after rules 1–2
            enter the numerator. Miles come from the mileage table (manual entry or jurisdiction upload).
          </p>
        </li>

        <li className="space-y-1">
          <span className="font-semibold text-gray-900">Branch maps.</span>
          <p className="ml-5 text-gray-700">
            Incident branch is derived from location via the existing branch rules. Samsara tags and jurisdiction miles map to
            BNY / BMA / BPA / BDC through tag→branch patterns maintained in Settings (defaults cover New York, Boston, Philadelphia/Philly, DC).
          </p>
        </li>

        <li className="space-y-1">
          <span className="font-semibold text-gray-900">New-hire window.</span>
          <p className="ml-5 text-gray-700">
            A new-hire incident is one where tenure at the loss date is under 90 days (<code className="text-xs bg-gray-100 px-1 rounded">tenure_days &lt; 90</code>).
            The New-Hire page reports that share among auto preventables.
          </p>
        </li>
      </ol>
    </div>
  );
}
