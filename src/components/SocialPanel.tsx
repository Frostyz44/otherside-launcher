import { MessageSquare, Mic, Users } from 'lucide-react';
import { Tooltip } from './Tooltip';
import NotifBell from './NotifBell';

interface Friend { id: number; name: string; status: string; activity: string; avatar: string; }

export const FRIENDS: Friend[] = [
  { id: 1, name: 'Figge', status: 'ingame', activity: 'Playing VibeMaker', avatar: 'https://pbs.twimg.com/profile_images/1988344914074365952/yZsaD2JO_400x400.jpg' },
  { id: 2, name: 'Garga', status: 'online', activity: 'Browsing OSWiki', avatar: 'https://pbs.twimg.com/profile_images/1826272616354660352/GTUwX_rD_400x400.jpg' },
  { id: 3, name: 'Dong Socks', status: 'ingame', activity: 'Playing Bathroom Blitz', avatar: 'https://pbs.twimg.com/profile_images/1984636520666386432/XfbIxoE-_400x400.jpg' },
  { id: 4, name: 'Cryptollie.eth', status: 'online', activity: 'Online', avatar: 'https://pbs.twimg.com/profile_images/2019834881044312064/drL4flEi_400x400.jpg' },
  { id: 5, name: 'Peter Parker', status: 'ingame', activity: 'Playing VibeMaker', avatar: 'https://pbs.twimg.com/profile_images/2019524715983826944/66gTwxxl_400x400.jpg' },
  { id: 6, name: 'pm0721', status: 'online', activity: 'Browsing OSWiki', avatar: 'https://pbs.twimg.com/profile_images/1893018291691528192/TsvykeER_400x400.jpg' },
  { id: 7, name: 'Cryptoangie', status: 'away', activity: 'Away', avatar: 'https://pbs.twimg.com/profile_images/2010778872988524544/BAx4Ho2L_400x400.jpg' },
  { id: 8, name: 'abp.eth', status: 'away', activity: 'Away', avatar: 'https://pbs.twimg.com/profile_images/2026698711175475200/yxqjaF4i_400x400.jpg' },
  { id: 9, name: 'wale.moca', status: 'offline', activity: 'Last seen 30m ago', avatar: 'https://pbs.twimg.com/profile_images/1700199367511064576/v-3PNyPw_400x400.jpg' },
  { id: 10, name: 'greg', status: 'offline', activity: 'Last seen 1h ago', avatar: 'https://pbs.twimg.com/profile_images/1581014308397502464/NPogKMyk_400x400.jpg' },
  { id: 11, name: 'vitalik.eth', status: 'offline', activity: 'Last seen 2h ago', avatar: 'https://pbs.twimg.com/profile_images/2006515705223516160/wGIa8vCp_400x400.png' },
  { id: 12, name: 'beeple', status: 'offline', activity: 'Last seen 3h ago', avatar: 'https://pbs.twimg.com/profile_images/264316321/beeple_headshot_beat_up_400x400.jpg' },
  { id: 13, name: 'Luca Netz', status: 'offline', activity: 'Last seen 1d ago', avatar: 'https://pbs.twimg.com/profile_images/1849498278255071232/drdvg74U_400x400.jpg' },
  { id: 14, name: 'Sketch', status: 'online', activity: 'Online', avatar: 'https://pbs.twimg.com/profile_images/1963899125188976640/zDxVTF-W_400x400.jpg' },
];

const STATUS_DOT: Record<string, string> = {
  ingame: '#4ade80',
  online: '#60a5fa',
  away: '#fbbf24',
  offline: '#374151',
};

export default function SocialPanel() {
  const online = FRIENDS.filter(f => f.status !== 'offline');
  const offline = FRIENDS.filter(f => f.status === 'offline');

  return (
    <aside className="social-panel">
      <div className="social-header">
        <span className="social-title">Social</span>
        <span className="social-count">{online.length} online</span>
      </div>

      <div className="social-body">
        <div className="social-section-label">Online — {online.length}</div>
        <div className="friends-list">
          {online.map(f => (
            <div key={f.id} className="friend-row">
              <div className="friend-avatar">
                <img src={f.avatar} alt={f.name} className="friend-avatar-img" />
                <span className="friend-status-dot" style={{ background: STATUS_DOT[f.status] }} />
              </div>
              <div className="friend-info">
                <span className="friend-name">{f.name}</span>
                <span className="friend-activity" style={{ color: f.status === 'ingame' ? '#4ade80' : undefined }}>
                  {f.activity}
                </span>
              </div>
            </div>
          ))}
        </div>

        {offline.length > 0 && (
          <>
            <div className="social-section-label" style={{ marginTop: 12 }}>Offline — {offline.length}</div>
            <div className="friends-list">
              {offline.map(f => (
                <div key={f.id} className="friend-row friend-row-offline">
                  <div className="friend-avatar friend-avatar-offline">
                    <img src={f.avatar} alt={f.name} className="friend-avatar-img" />
                    <span className="friend-status-dot" style={{ background: STATUS_DOT[f.status] }} />
                  </div>
                  <div className="friend-info">
                    <span className="friend-name">{f.name}</span>
                    <span className="friend-activity">{f.activity}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="social-actions">
        <div className="social-actions-left">
          <NotifBell />
          <Tooltip label="Chat" side="top"><button className="social-action-btn"><MessageSquare size={15} strokeWidth={1.75} /></button></Tooltip>
          <Tooltip label="Voice" side="top"><button className="social-action-btn"><Mic size={15} strokeWidth={1.75} /></button></Tooltip>
          <Tooltip label="Party" side="top"><button className="social-action-btn"><Users size={15} strokeWidth={1.75} /></button></Tooltip>
        </div>
      </div>
      <span className="social-version">v{__APP_VERSION__}</span>
    </aside>
  );
}
