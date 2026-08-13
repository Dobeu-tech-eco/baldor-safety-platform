import { useEffect, useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
type ToastEntry = { id: number; kind: ToastKind; text: string };

type ToastCtx = { toast: (kind: ToastKind, text: string) => void };
const Ctx = createContext<ToastCtx>({ toast: () => {} });
export const useToast = () => useContext(Ctx);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ToastEntry[]>([]);

  const toast = useCallback((kind: ToastKind, text: string) => {
    const id = nextId++;
    setEntries((prev) => [...prev, { id, kind, text }]);
    setTimeout(() => setEntries((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setEntries((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none" aria-live="polite">
        {entries.map((e) => (
          <ToastItem key={e.id} entry={e} onDismiss={dismiss} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

function ToastItem({ entry, onDismiss }: { entry: ToastEntry; onDismiss: (id: number) => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  const styles: Record<ToastKind, string> = {
    success: 'bg-green-50 border-green-300 text-[#2E7D32]',
    error: 'bg-red-50 border-red-300 text-[#C0392B]',
    info: 'bg-blue-50 border-blue-300 text-blue-900',
  };
  const Icon = entry.kind === 'success' ? CheckCircle2 : entry.kind === 'error' ? AlertCircle : Info;

  return (
    <div
      className={`pointer-events-auto border rounded-lg shadow-lg px-4 py-3 flex items-start gap-2 transition-all duration-300 ${styles[entry.kind]} ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span className="text-sm flex-1">{entry.text}</span>
      <button onClick={() => onDismiss(entry.id)} className="opacity-60 hover:opacity-100">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
