import { useState } from 'react';
import './TutorialOverlay.css';

interface Page { title: string; body: string }

const PAGES: Page[] = [
  {
    title: 'Your story',
    body: 'You are a newly elected backbench MP. There is no single way to play and no score to chase — you might claw your way toward the Cabinet and Number 10, or make your name as a rebel, a campaigner, a conscience. The path is yours.',
  },
  {
    title: 'Decisions',
    body: 'Most turns hand you a card: a dilemma with no perfect answer. Your choice nudges your five stats — profile, party standing, competence, constituency approval and integrity — and your relationships with colleagues, whips and the press. Everything is a trade-off.',
  },
  {
    title: 'Time passes',
    body: 'Between your decisions, the political world turns on its own: reshuffles, leadership contests, scandals and general elections come and go. Choices compound — do one thing and doors open, do another and they quietly close.',
  },
  {
    title: 'Many jobs',
    body: 'Politics is lots of different roles, and each feels different. You might take tough decisions in government, hold ministers to account from opposition, lead a party, or fight your corner from the back benches — sometimes holding the balance of power.',
  },
  {
    title: 'That’s it',
    body: 'There is nothing more to learn — the rest you will pick up as you go. Your story is yours to write.',
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
