import { ReactNode, useRef } from 'react';
import { Download } from 'lucide-react';
import { toPng } from 'html-to-image';

type Props = { title: string; caption?: string; square?: boolean; children: ReactNode; controls?: ReactNode; };

export default function ChartCard({ title, caption, square, children, controls }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  async function exportPng() {
    if (!ref.current) return;
    const dataUrl = await toPng(ref.current, { backgroundColor: square ? '#F1F0EC' : '#ffffff', pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = `${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`;
    link.href = dataUrl;
    link.click();
  }

  return (
    <div className="card-surface overflow-hidden">
      <div className="card-header-bar">
        <div>
          <h3 className="t-headline text-lg text-ink-true">{title}</h3>
          {caption && <p className="text-xs text-ink-muted mt-0.5">{caption}</p>}
        </div>
        <div className="flex items-center gap-2">
          {controls}
          <button type="button" onClick={exportPng} className="btn-secondary min-h-[36px] text-[11px] px-3">
            <Download className="w-3.5 h-3.5" />Export PNG
          </button>
        </div>
      </div>
      <div ref={ref} className={`p-6 ${square ? 'bg-cream-panel' : 'bg-white'}`} style={square ? { aspectRatio: '1 / 1' } : undefined}>
        {square && <h2 className="t-headline text-2xl text-ink-true mb-4">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
