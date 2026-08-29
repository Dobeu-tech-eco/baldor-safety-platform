import { Link } from 'react-router-dom';
import { AlertCircle, Info, Inbox } from 'lucide-react';

type BannerKind = 'error' | 'empty' | 'info';

type Props = {
  kind: BannerKind;
  text: string;
  to?: string;
};

function bannerStyles(kind: BannerKind): { box: string; Icon: typeof AlertCircle } {
  switch (kind) {
    case 'error':
      return {
        box: 'bg-red-50 border-red-400 text-[#C0392B]',
        Icon: AlertCircle,
      };
    case 'empty':
      return {
        box: 'bg-gray-50 border-gray-300 text-gray-700',
        Icon: Inbox,
      };
    case 'info':
      return {
        box: 'bg-blue-50 border-blue-300 text-blue-900',
        Icon: Info,
      };
    default: {
      const _exhaustive: never = kind;
      throw new Error(`Unhandled banner kind: ${String(_exhaustive)}`);
    }
  }
}

export default function PageBanner({ kind, text, to }: Props) {
  const { box, Icon } = bannerStyles(kind);

  return (
    <div className={`rounded-lg border px-4 py-3 flex items-start gap-3 ${box}`}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div className="text-sm flex-1 space-y-1">
        <p>{text}</p>
        {kind === 'empty' && to && (
          <Link to={to} className="inline-block text-sm font-medium text-[#006838] underline hover:no-underline">
            Go to Upload
          </Link>
        )}
      </div>
    </div>
  );
}
