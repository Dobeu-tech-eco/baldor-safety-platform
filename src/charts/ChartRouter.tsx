import { ChartId } from '../lib/parser';
import NetworkYoYSnow from './NetworkYoYSnow';
import NetworkYoYStack from './NetworkYoYStack';
import BranchWeekly from './BranchWeekly';
import BranchInjury from './BranchInjury';
import NetworkInjuriesYTD from './NetworkInjuriesYTD';
import IncidentTypeBreakdown from './IncidentTypeBreakdown';
import NewHireShare from './NewHireShare';
import Branch30Trend from './Branch30Trend';
import APMM from './APMM';
import Unclassified from './Unclassified';

export default function ChartRouter({ chartId, range }: { chartId: ChartId; range?: { from: Date; to: Date } }) {
  switch (chartId) {
    case 'network-yoy-snow': return <NetworkYoYSnow />;
    case 'network-yoy-stack': return <NetworkYoYStack />;
    case 'branch-weekly': return <BranchWeekly range={range} />;
    case 'branch-injury': return <BranchInjury />;
    case 'network-injuries-ytd': return <NetworkInjuriesYTD />;
    case 'incident-type-breakdown': return <IncidentTypeBreakdown />;
    case 'new-hire-share': return <NewHireShare />;
    case 'branch-30-trend': return <Branch30Trend />;
    case 'apmm': return <APMM />;
    case 'unclassified': return <Unclassified />;
    default: {
      const _exhaustive: never = chartId;
      return _exhaustive;
    }
  }
}
