import { useGameStore } from '../store/gameStore';
import { useUiStore } from '../store/uiStore';
import './TitleScreen.css';

/** Hosted privacy policy (no data collected). Same URL used for the store listings. */
export const PRIVACY_URL = 'https://github.com/QuinnPorter/WestminsterSim/blob/main/PRIVACY.md';

export function TitleScreen() {
  const game = useGameStore((s) => s.game);
  const slots = useGameStore((s) => s.slots);
  const setLanding = useUiStore((s) => s.setLanding);
  const requestConfirm = useUiStore((s) => s.requestConfirm);

  const hasSave = game !== null || slots.length > 0;

  const beginNew = () => {
    if (game) {
      requestConfirm({
        title: 'Start a new career?',
        message: 'This replaces your current (auto-saved) game. Any named saves are kept.',
        confirmLabel: 'New career',
        danger: true,
        onConfirm: () => setLanding('create'),
      });
    } else {
      setLanding('create');
    }
  };

  return (
    <div className="screen title-screen">
      <div className="title-crest">
        {/* The Palace of Westminster: Victoria Tower, the Gothic hall, and the
            Elizabeth Tower (Big Ben) with its clock. */}
        <svg viewBox="0 0 100 76" width="150" height="114" role="img" aria-label="Palace of Westminster">
          <g fill="#33415C">
            {/* Victoria Tower */}
            <rect x="10" y="22" width="20" height="44" />
            <rect x="10" y="18" width="4" height="5" />
            <rect x="18" y="18" width="4" height="5" />
            <rect x="26" y="18" width="4" height="5" />
            <rect x="19.2" y="9" width="1.6" height="10" />
            <path d="M20.8 9 L29 11.5 L20.8 14 Z" />
            {/* Main hall */}
            <rect x="30" y="44" width="34" height="22" />
            <path d="M32 44 L35 38 L38 44 Z" />
            <path d="M40 44 L43 38 L46 44 Z" />
            <path d="M48 44 L51 38 L54 44 Z" />
            <path d="M56 44 L59 38 L62 44 Z" />
            {/* Elizabeth Tower (Big Ben) */}
            <rect x="66" y="30" width="16" height="36" />
            <rect x="67" y="26" width="14" height="4" />
            <path d="M66 26 L82 26 L74 8 Z" />
            <rect x="73.2" y="3" width="1.6" height="5" />
            <circle cx="74" cy="6" r="1.6" />
          </g>
          {/* windows (cream cut-outs) */}
          <g fill="#FAF7F1">
            <rect x="14" y="30" width="2.6" height="8" rx="1.3" />
            <rect x="18.7" y="30" width="2.6" height="8" rx="1.3" />
            <rect x="23.4" y="30" width="2.6" height="8" rx="1.3" />
            <rect x="14" y="48" width="2.6" height="10" rx="1.3" />
            <rect x="18.7" y="48" width="2.6" height="10" rx="1.3" />
            <rect x="23.4" y="48" width="2.6" height="10" rx="1.3" />
            <rect x="34" y="50" width="3" height="12" rx="1.5" />
            <rect x="41" y="50" width="3" height="12" rx="1.5" />
            <rect x="48" y="50" width="3" height="12" rx="1.5" />
            <rect x="55" y="50" width="3" height="12" rx="1.5" />
          </g>
          {/* the clock: cream face, navy hands */}
          <circle cx="74" cy="40" r="5" fill="#FAF7F1" />
          <path d="M74 40 L74 36.2 M74 40 L77 41" stroke="#33415C" strokeWidth="1.1" strokeLinecap="round" fill="none" />
        </svg>
      </div>
      <h1 className="title-name">WestminsterSim</h1>
      <button className="btn btn-primary title-start" onClick={beginNew}>
        Begin your career
      </button>
      {hasSave && (
        <button className="btn title-secondary" onClick={() => setLanding('load')}>
          Load game
        </button>
      )}
      <button className="btn title-secondary" onClick={() => setLanding('tutorial')}>
        Tutorial
      </button>
      <p className="title-foot">
        A political simulator · All political figures are fictional
        <br />
        <a
          className="title-privacy"
          href={PRIVACY_URL}
          target="_blank"
          rel="noreferrer"
          style={{ color: 'inherit', textDecoration: 'underline' }}
        >
          Privacy Policy
        </a>
      </p>
    </div>
  );
}
