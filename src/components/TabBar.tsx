import { useUiStore, TabId } from '../store/uiStore';
import { useGameStore } from '../store/gameStore';
import { isKeyMoment } from '../engine/cardEngine';
import './TabBar.css';

const ICONS: Record<TabId, JSX.Element> = {
  play: (
    // stack of cards
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="7" width="14" height="13" rx="2" />
      <path d="M8 4h11a2 2 0 0 1 2 2v11" opacity="0.45" />
    </svg>
  ),
  history: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  ),
  cabinet: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="3.2" />
      <path d="M3.5 19c.7-3 2.9-4.5 5.5-4.5S13.8 16 14.5 19" />
      <circle cx="17" cy="8" r="2.4" opacity="0.5" />
      <path d="M15.5 13.5c2.3 0 4.2 1.3 4.9 4" opacity="0.5" />
    </svg>
  ),
  parliament: (
    // hemicycle arch
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19a8 8 0 0 1 16 0" />
      <path d="M8.5 19a3.5 3.5 0 0 1 7 0" opacity="0.5" />
      <path d="M3 19h18" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M5 20c1-3.6 3.8-5.3 7-5.3s6 1.7 7 5.3" />
    </svg>
  ),
};

const LABELS: Record<TabId, string> = {
  play: 'Play',
  history: 'History',
  cabinet: 'Cabinet',
  parliament: 'Parliament',
  profile: 'Profile',
};

const TABS: TabId[] = ['play', 'history', 'cabinet', 'parliament', 'profile'];

export function TabBar() {
  const activeTab = useUiStore((s) => s.activeTab);
  const setTab = useUiStore((s) => s.setTab);
  const game = useGameStore((s) => s.game);
  // flag the Play tab when a high-stakes decision (or an election to acknowledge)
  // is waiting and the player is looking elsewhere
  const playAlert =
    activeTab !== 'play' &&
    (isKeyMoment(game?.currentCard) || !!game?.pendingElectionId);

  return (
    <nav className="tabbar">
      {TABS.map((tab) => (
        <button
          key={tab}
          className={`tabbar-item${tab === activeTab ? ' active' : ''}`}
          onClick={() => setTab(tab)}
          aria-label={LABELS[tab]}
        >
          <span className="tabbar-icon">
            {ICONS[tab]}
            {tab === 'play' && playAlert && <span className="tabbar-badge">!</span>}
          </span>
          <span>{LABELS[tab]}</span>
        </button>
      ))}
    </nav>
  );
}
