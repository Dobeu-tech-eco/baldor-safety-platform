import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useRef, useState } from 'react';
import userEvent from '@testing-library/user-event';
import { useFocusTrap } from './useFocusTrap';

function TrapHarness() {
  const [open, setOpen] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(open, ref);

  if (!open) return <button type="button">Outside</button>;

  return (
    <div ref={ref} role="dialog" aria-label="Trap">
      <button type="button">First</button>
      <button type="button">Last</button>
      <button type="button" onClick={() => setOpen(false)}>Close</button>
    </div>
  );
}

describe('useFocusTrap', () => {
  it('moves focus into the container when active', () => {
    render(<TrapHarness />);
    expect(document.activeElement?.textContent).toBe('First');
  });

  it('cycles Tab from last to first', async () => {
    const user = userEvent.setup();
    render(<TrapHarness />);
    const first = screen.getByRole('button', { name: 'First' });
    const last = screen.getByRole('button', { name: 'Close' });
    last.focus();
    await user.tab();
    expect(document.activeElement).toBe(first);
  });
});
