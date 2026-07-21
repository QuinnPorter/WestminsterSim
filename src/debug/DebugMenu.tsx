import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { updatePolling, samplePolling } from '../engine/polling';
import { nextStep, queueGeneralElection } from '../engine/scheduler';
import { runReshuffle, openLeadershipVacancy } from '../engine/career';

/** dev-only panel, shown when the URL has ?debug */
export function DebugMenu() {
  const [open, setOpen] = useState(false);
  const debugMutate = useGameStore((s) => s.debugMutate);
  const game = useGameStore((s) => s.game);
  if (!game) return null;

  const advance = (days: number) =>
    debugMutate((g, rng) => {
      g.day += days;
      updatePolling(g, rng, g.day);
      samplePolling(g);
      g.currentCard = null;
      nextStep(g, rng);
    });

  return (
    <div style={{
      position: 'fixed', top: 8, right: 8, zIndex: 100,
      fontSize: '0.7rem',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: '#26221C', color: '#fff', borderRadius: 8,
          padding: '4px 8px', fontWeight: 700,
        }}
      >
        🐛
      </button>
      {open && (
        <div style={{
          background: '#26221C', color: '#fff', borderRadius: 10,
          padding: 10, marginTop: 4, display: 'flex',
          flexDirection: 'column', gap: 5, width: 170,
        }}>
          <DebugBtn label="+1 month" onClick={() => advance(30)} />
          <DebugBtn label="+1 year" onClick={() => advance(365)} />
          <DebugBtn
            label="Force election"
            onClick={() => debugMutate((g, rng) => {
              queueGeneralElection(g);
              g.currentCard = null;
              nextStep(g, rng);
            })}
          />
          <DebugBtn
            label="Force reshuffle"
            onClick={() => debugMutate((g, rng) => {
              runReshuffle(g, rng);
              g.currentCard = null;
              nextStep(g, rng);
            })}
          />
          <DebugBtn
            label="Leadership vacancy"
            onClick={() => debugMutate((g, rng) => {
              openLeadershipVacancy(g, rng, g.player.partyId);
              g.currentCard = null;
              nextStep(g, rng);
            })}
          />
          <DebugBtn
            label="Force opposition vacancy"
            onClick={() => debugMutate((g, rng) => {
              openLeadershipVacancy(g, rng, g.government.oppositionParty);
              g.currentCard = null;
              nextStep(g, rng);
            })}
          />
          <DebugBtn
            label="Max stats"
            onClick={() => debugMutate((g) => {
              g.player.stats = {
                profile: 85, partyStanding: 85, competence: 85,
                constituencyApproval: 85, integrity: 85,
              };
            })}
          />
          <DebugBtn
            label="Crash polling (own)"
            onClick={() => debugMutate((g) => {
              g.polling.shares[g.player.partyId] = 0.15;
            })}
          />
        </div>
      )}
    </div>
  );
}

function DebugBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: '#4F4A41', color: '#fff', borderRadius: 6,
        padding: '5px 8px', textAlign: 'left', fontWeight: 600,
      }}
    >
      {label}
    </button>
  );
}
