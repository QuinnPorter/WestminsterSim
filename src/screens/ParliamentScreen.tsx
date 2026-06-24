import { GameState, PartyId } from '../types/game';
import { PARTIES, partyTextColour } from '../data/parties';
import { Hemicycle } from '../components/Hemicycle';
import { PollGraph } from '../components/PollGraph';
import { partyPolling } from '../engine/polling';
import { polledPartiesForEra } from '../data/parties';
import { useUiStore } from '../store/uiStore';
import { useGameStore } from '../store/gameStore';
import { playerIsPM } from '../engine/career';

export function ParliamentScreen({ game }: { game: GameState }) {
  const setPmHistoryOpen = useUiStore((s) => s.setPmHistoryOpen);
  const setLoHistoryOpen = useUiStore((s) => s.setLoHistoryOpen);
  const setElectionsOpen = useUiStore((s) => s.setElectionsOpen);
  const setSeatHistoryOpen = useUiStore((s) => s.setSeatHistoryOpen);
  const requestConfirm = useUiStore((s) => s.requestConfirm);
  const callSnapElection = useGameStore((s) => s.callSnapElection);
  const sorted = (Object.entries(game.seats) as [PartyId, number][])
    .filter(([, n]) => (n ?? 0) > 0)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));

  const gov = game.government;
  const sfSeats = game.seats.sf ?? 0;
  const workingTarget = Math.floor((650 - sfSeats - 1) / 2) + 1;
  const leadSeats = game.seats[gov.governingParty] ?? 0;
  // a formal coalition's seats are counted toward the government total
  const coalitionSeats = gov.arrangement === 'coalition' && gov.coalitionPartner
    ? (game.seats[gov.coalitionPartner] ?? 0) : 0;
  const govSeats = leadSeats + coalitionSeats;

  const isPM = playerIsPM(game);
  // hide the snap-election button once an election is already on its way
  const electionImminent = game.day >= game.nextElectionBy - 60
    || game.forcedQueue.some((e) => e.kind === 'campaign' || e.kind === 'electionNight');

  const ranked = polledPartiesForEra(game.startEra)
    .map((p) => ({ p, v: partyPolling(game, p) }))
    .sort((a, b) => b.v - a.v);
  // always keep the Lib Dems on the board, even if they slip out of the top five
  const ldIncluded = ranked.some((x, i) => i < 5 && x.p === 'ld');
  const ldEntry = ranked.find((x) => x.p === 'ld');
  const polls = ldIncluded || !ldEntry
    ? ranked.slice(0, 5)
    : [...ranked.filter((x) => x.p !== 'ld').slice(0, 4), ldEntry].sort((a, b) => b.v - a.v);

  return (
    <div className="screen">
      <h2 style={{ marginBottom: 4 }}>The House of Commons</h2>
      <p style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)', marginBottom: 12 }}>
        {PARTIES[gov.governingParty].name}{' '}
        {gov.majority > 0
          ? `majority of ${gov.majority}`
          : gov.arrangement === 'coalition' && gov.coalitionPartner
            ? `coalition with the ${PARTIES[gov.coalitionPartner].shortName}`
            : gov.arrangement === 'supplyConfidence' && gov.confidencePartner
              ? `minority, with ${PARTIES[gov.confidencePartner].shortName} support`
              : 'minority government'}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, rowGap: 8, alignItems: 'center', marginBottom: 12 }}>
        <button
          onClick={() => setPmHistoryOpen(true)}
          style={{
            background: 'none', border: 'none', padding: '6px 0',
            color: partyTextColour(gov.governingParty), fontWeight: 700, fontSize: 'var(--fs-xs)', cursor: 'pointer',
          }}
        >
          Prime Ministers ›
        </button>
        <button
          onClick={() => setLoHistoryOpen(true)}
          style={{
            background: 'none', border: 'none', padding: '6px 0',
            color: partyTextColour(gov.oppositionParty), fontWeight: 700, fontSize: 'var(--fs-xs)', cursor: 'pointer',
          }}
        >
          Opposition Leaders ›
        </button>
        <button
          onClick={() => setElectionsOpen(true)}
          style={{
            background: 'none', border: 'none', padding: '6px 0',
            color: partyTextColour(gov.governingParty), fontWeight: 700, fontSize: 'var(--fs-xs)', cursor: 'pointer',
          }}
        >
          Elections ›
        </button>
        {isPM && !electionImminent && (
          <button
            onClick={() => requestConfirm({
              title: 'Call a snap election?',
              message: 'You dissolve Parliament and go to the country. The campaign begins at your next decision.',
              confirmLabel: 'Go to the country',
              onConfirm: callSnapElection,
            })}
            style={{
              background: 'none', border: 'none', padding: '6px 0',
              color: 'var(--party)', fontWeight: 700, fontSize: 'var(--fs-xs)', cursor: 'pointer',
            }}
          >
            Call a snap election ›
          </button>
        )}
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <Hemicycle seats={game.seats} />
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '6px 14px',
          marginTop: 10, justifyContent: 'center',
        }}>
          {sorted.map(([p, n]) => (
            <span key={p} style={{
              fontSize: 'var(--fs-xs)', fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{
                width: 9, height: 9, borderRadius: '50%',
                background: PARTIES[p].colour, border: '1px solid rgba(0,0,0,0.1)',
              }} />
              {PARTIES[p].shortName} {n}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
          <button
            onClick={() => setSeatHistoryOpen(true)}
            style={{
              background: 'none', border: 'none', padding: '6px 0',
              color: partyTextColour(gov.governingParty), fontWeight: 700, fontSize: 'var(--fs-xs)', cursor: 'pointer',
            }}
          >
            Seats over time ›
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <h3 style={{ fontSize: 'var(--fs-sm)', marginBottom: 8 }}>Majority maths</h3>
        <div style={{
          height: 16, background: 'var(--surface-2)', borderRadius: 8,
          overflow: 'hidden', position: 'relative',
        }}>
          <div style={{
            width: `${(govSeats / 650) * 100}%`, height: '100%',
            background: PARTIES[gov.governingParty].colour,
          }} />
          <div style={{
            position: 'absolute', left: `${(workingTarget / 650) * 100}%`,
            top: 0, bottom: 0, width: 2, background: 'var(--ink)',
          }} />
        </div>
        <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 6 }}>
          {govSeats} government seats{coalitionSeats > 0 ? ' (incl. coalition partner)' : ''} · {workingTarget} needed to win votes
          {sfSeats > 0 ? ` (Sinn Féin's ${sfSeats} MPs don't take their seats)` : ''}
        </p>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 'var(--fs-sm)', marginBottom: 8 }}>Latest polling</h3>
        {polls.map(({ p, v }) => (
          <div key={p} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '4px 0', fontSize: 'var(--fs-sm)',
          }}>
            <span style={{ fontWeight: 700, color: partyTextColour(p) }}>
              {PARTIES[p].shortName}
            </span>
            <span style={{ fontWeight: 700 }}>{v.toFixed(0)}%</span>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ fontSize: 'var(--fs-sm)', marginBottom: 8 }}>Polling since the last election</h3>
        <PollGraph game={game} />
      </div>
    </div>
  );
}
