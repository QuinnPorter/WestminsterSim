import { ReactNode, useState } from 'react';
import { PlayerStats } from '../types/game';
import { StatChips } from './StatChips';
import './TutorialOverlay.css';

interface Page { title: string; body: string; visual?: ReactNode }

const SAMPLE_STATS: PlayerStats = {
  profile: 45, partyStanding: 60, competence: 55, constituencyApproval: 70, integrity: 40,
};

/** a non-interactive mock of an in-game decision card, for illustration */
function MockCard() {
  return (
    <div className="card tut-mockcard">
      <h4 className="tut-mockcard-title">Whipped against your patch</h4>
      <p className="tut-mockcard-body">The party line is unpopular at home, and the whip is on. What do you do?</p>
      <div className="tut-mockcard-choices">
        <span className="btn">Vote for the constituency</span>
        <span className="btn">Hold the line, explain later</span>
      </div>
    </div>
  );
}

const PAGES: Page[] = [
  {
    title: 'Your story',
    body: "You're a newly elected MP. There's no set goal: climb toward the Cabinet and Number 10, or make your name as a rebel, a campaigner, a conscience.",
  },
  {
    title: 'Decisions',
    body: 'Most turns hand you a card — a dilemma with no perfect answer. Your choice shifts your stats and your relationships. Only trade-offs.',
    visual: <MockCard />,
  },
  {
    title: 'The five stats',
    body: 'Five stats track your standing — tap any chip to see what it does. They decide who rises, who is sacked, and who is trusted.',
    visual: <StatChips stats={SAMPLE_STATS} />,
  },
  {
    title: 'Time passes',
    body: 'Each choice advances the calendar by weeks. Between them the world turns on its own — reshuffles, scandals, leadership contests, elections.',
  },
  {
    title: 'Many roles',
    body: 'Politics is many jobs: take hard calls in office, hold the government to account, lead a party, or fight from the back benches.',
  },
  {
    title: 'That’s it',
    body: "That's all you need — the rest you'll pick up as you go.",
  },
];

export function TutorialOverlay({ onDone }: { onDone: () => void }) {
  const [page, setPage] = useState(0);
  const p = PAGES[page];
  const last = page === PAGES.length - 1;

  return (
    <div className="screen tut">
      <div className="tut-dots">
        {PAGES.map((_, i) => (
          <span key={i} className={`tut-dot${i === page ? ' active' : ''}`} />
        ))}
      </div>

      <div className="card tut-card fade-in" key={page}>
        <h2 className="tut-title">{p.title}</h2>
        <p className="tut-body">{p.body}</p>
        {p.visual && <div className="tut-visual">{p.visual}</div>}
      </div>

      <div className="tut-nav">
        <button
          className="btn"
          onClick={() => (page > 0 ? setPage(page - 1) : onDone())}
        >
          {page > 0 ? 'Back' : 'Skip'}
        </button>
        <button
          className="btn btn-primary"
          onClick={() => (last ? onDone() : setPage(page + 1))}
        >
          {last ? 'Done' : 'Next'}
        </button>
      </div>
    </div>
  );
}
