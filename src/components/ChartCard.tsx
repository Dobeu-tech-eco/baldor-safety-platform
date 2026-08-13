import { ReactNode, useRef } from 'react';
import { Download } from 'lucide-react';
import { toPng } from 'html-to-image';

type Props = { title: string; caption?: string; square?: boolean; children: ReactNode; controls?: ReactNode; };

export default function ChartCard({ title, caption, square, children, controls }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  async function exportPng() {
    if (!ref.current) return;
    const dataUrl = await toPng(ref.current, { backgroundColor: square ? '#F1EFEC' : '#ffffff', pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = `${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`;
    link.href = dataUrl;
    link.click();
  }

  return (
    <div className="si-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-gray-200 bg-baldor-cream/60">
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {caption && <p className="text-xs text-gray-500 mt-0.5">{caption}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {controls}
          <button type="button" onClick={exportPng} className="si-btn-secondary text-xs">
            <Download className="w-3.5 h-3.5" aria-hidden="true" />Export PNG
          </button>
        </div>
      </div>
      <div ref={ref} className={`p-6 ${square ? 'bg-baldor-cream' : 'bg-white'}`} style={square ? { aspectRatio: '1 / 1' } : undefined}>
        {square && <h2 className="text-2xl font-extrabold text-black mb-4">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
