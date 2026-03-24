import { useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  label: string;
  children: ReactNode;
  side?: 'top' | 'bottom';
}

export function Tooltip({ label, children, side = 'top' }: TooltipProps) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const wrapRef = useRef<HTMLSpanElement>(null);

  const onEnter = () => {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    setPos({
      x: r.left + r.width / 2,
      // top: anchor from bottom of chip upward (no height dependency)
      // bottom: anchor from top of chip downward
      y: side === 'top' ? window.innerHeight - r.top + 8 : r.bottom + 8,
    });
    setShow(true);
  };

  const onLeave = () => setShow(false);

  return (
    <span ref={wrapRef} style={{ display: 'inline-flex' }} onMouseEnter={onEnter} onMouseLeave={onLeave} onMouseDown={onLeave}>
      {children}
      {show && createPortal(
        <span style={{
          position: 'fixed',
          left: pos.x,
          top: side === 'bottom' ? pos.y : undefined,
          bottom: side === 'top' ? pos.y : undefined,
          transform: 'translateX(-50%)',
          background: '#0a0a0a',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(240,230,211,0.9)',
          fontSize: 11,
          fontFamily: "'Barlow', sans-serif",
          whiteSpace: 'nowrap',
          padding: '4px 10px',
          borderRadius: 6,
          pointerEvents: 'none',
          zIndex: 9999,
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          animation: 'tooltip-in 0.1s ease',
        }}>
          {label}
        </span>,
        document.body,
      )}
    </span>
  );
}
