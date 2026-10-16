import { useEffect, useRef } from 'react';

const FOCUSABLE = 'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';

// Accessible dialog: ESC closes, Tab stays inside, focus returns to the opener.
export default function Modal({ open, title, onClose, children, actions }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement;
    ref.current?.querySelector(FOCUSABLE)?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const items = [...ref.current.querySelectorAll(FOCUSABLE)].filter((el) => !el.disabled);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); opener?.focus?.(); };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={ref}>
        <h2 id="modal-title" className="modal__title">{title}</h2>
        {children}
        {actions && <div className="modal__actions">{actions}</div>}
      </div>
    </div>
  );
}
