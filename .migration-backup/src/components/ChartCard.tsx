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
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50">
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {caption && <p className="text-xs text-gray-500 mt-0.5">{caption}</p>}
        </div>
        <div className="flex items-center gap-2">
          {controls}
          <button onClick={exportPng} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            <Download className="w-3.5 h-3.5" />Export PNG
          </button>
        </div>
      </div>
      <div ref={ref} className={`p-6 ${square ? 'bg-[#F1EFEC]' : 'bg-white'}`} style={square ? { aspectRatio: '1 / 1' } : undefined}>
        {square && <h2 className="text-2xl font-extrabold text-black mb-4">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
