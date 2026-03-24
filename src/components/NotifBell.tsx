import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { sfxClick } from '../sounds';

interface Notif { id: number; title: string; body: string; time: string; unread: boolean; }

const NOTIFICATIONS: Notif[] = [
  { id: 1, title: 'CHAOS TRIALS', body: 'Starting in 30 minutes — Kodas weekly event', time: '2m ago', unread: true },
  { id: 2, title: 'Patch 2026.03.19', body: 'Mega Koda room now open to all Kodas', time: '1h ago', unread: true },
  { id: 3, title: 'The Render Pool', body: 'Weekly session starts at 8:00 PM UTC', time: '3h ago', unread: false },
  { id: 4, title: 'Otherside Update', body: 'New daily tasks and challenge leaderboard reset', time: '1d ago', unread: false },
];

export default function NotifBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState(NOTIFICATIONS);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifs.filter(n => n.unread).length;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  function markAllRead() {
    sfxClick();
    setNotifs(n => n.map(x => ({ ...x, unread: false })));
  }

  return (
    <div className="notif-wrap" ref={ref} data-tauri-drag-region={false}>
      <Tooltip label="Notifications" side="bottom">
        <button className="notif-btn" onClick={() => { sfxClick(); setOpen(o => !o); }}>
          <Bell size={18} strokeWidth={1.75} />
        </button>
      </Tooltip>
      {unread > 0 && <span className="notif-dot">{unread}</span>}
      {open && (
        <div className="notif-panel">
          <div className="notif-head">
            <span className="notif-title">Notifications</span>
            {unread > 0 && <button className="notif-mark" onClick={markAllRead}>Mark all read</button>}
          </div>
          <div className="notif-list">
            {notifs.map(n => (
              <div key={n.id} className={`notif-item${n.unread ? ' unread' : ''}`} onClick={() => { sfxClick(); setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, unread: false } : x)); }}>
                {n.unread && <span className="notif-item-dot" />}
                <div className="notif-item-body">
                  <div className="notif-item-title">{n.title}</div>
                  <div className="notif-item-text">{n.body}</div>
                  <div className="notif-item-time">{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
