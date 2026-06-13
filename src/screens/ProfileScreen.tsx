import { useMemo, useState } from 'react';
import { GameState, OfficeId, PartyId } from '../types/game';
import type { RoleSide } from '../engine/career';
import { useGameStore } from '../store/gameStore';
import { Avatar } from '../avatar/Avatar';
import { PARTIES, PLAYABLE_PARTIES } from '../data/parties';
import { REGIONS } from '../data/regions';
import { BACKGROUNDS } from '../data/backgrounds';
import { STAT_LABELS } from '../engine/effects';
import {
  playerOfficeLabel, playerOfficeTitle, playerIsLeader, playerInGovernment, playerTier,
} from '../engine/career';
import { formatMonthYear, yearsBetween } from '../engine/clock';

interface OfficeSpan {
  officeId: OfficeId;
  start: number;
  end: number | null;
  becamePM: boolean;
  roleSide?: RoleSide;
  partyId?: PartyId;
}

/** chronological portfolio history, derived from roleChange entries */
function officeSpans(game: GameState): OfficeSpan[] {
  const spans: OfficeSpan[] = [];
  let current: OfficeSpan | null = null;
  for (const entry of game.history) {
    if (entry.kind !== 'roleChange') continue;
    if (current) {
      current.end = entry.date;
      if (current.end !== current.start) spans.push(current);
      current = null;
    }
    if (entry.officeId) {
      current = {
        officeId: entry.officeId,
        start: entry.date,
        end: null,
        becamePM: entry.how === 'becamePM',
        roleSide: entry.roleSide,
        partyId: entry.partyId,
      };
    }
  }
  if (current) spans.push(current);
  return spans.reverse(); // newest first
}

function spanTitle(game: GameState, span: OfficeSpan): string {
  if (span.becamePM) return 'Prime Minister';
  return playerOfficeLabel(game, span.officeId, span.start, {
    roleSide: span.roleSide, partyId: span.partyId,
  });
}

export function ProfileScreen({ game }: { game: GameState }) {
  const retire = useGameStore((s) => s.retire);
  const crossFloor = useGameStore((s) => s.crossFloor);
  const resignOffice = useGameStore((s) => s.resignOffice);
  const callForPmResignation = useGameStore((s) => s.callForPmResignation);
  const [pickingParty, setPickingParty] = useState(false);

  const player = game.player;
  const seat = game.seatMap.find((s) => s.id === player.seatId);
  const party = PARTIES[player.partyId];
  const spans = useMemo(() => officeSpans(game), [game]);

  const playerShare = seat?.shares[player.partyId] ?? 0;
  const runnerUp = seat
    ? Math.max(
        0,
        ...Object.entries(seat.shares)
          .filter(([p]) => p !== player.partyId)
          .map(([, v]) => v ?? 0)
      )
    : 0;
  const margin = (playerShare - runnerUp) * 100;
  const marginality = margin > 20 ? 'Safe' : margin > 8 ? 'Comfortable' : 'Marginal';
  const years = Math.floor(yearsBetween(player.enteredParliament, game.day));

  const switchableParties: PartyId[] = PLAYABLE_PARTIES.filter(
    (p) => p !== player.partyId && PARTIES[p].contestsRegions.includes(player.region)
  );

  return (
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <Avatar config={player.avatar} size={84} partyColour={party.colour} />
        <div>
          <h2 style={{ fontSize: 'var(--fs-lg)' }}>{player.name}</h2>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', fontWeight: 600 }}>
            {party.name} · {player.age} years old
          </p>
          <p style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--party)' }}>
            {player.hasSeat ? playerOfficeTitle(game) : 'Out of Parliament'}
          </p>
        </div>
      </div>

      {seat && (
        <div className="card" style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: 'var(--fs-sm)', marginBottom: 6 }}>
            {player.hasSeat ? 'Member for' : 'Candidate for'} {seat.name}
          </h3>
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
            {REGIONS[seat.region].name} · {marginality} seat
            {margin > 0 ? ` (margin ${margin.toFixed(1)}%)` : ''} · {years}{' '}
            {years === 1 ? 'year' : 'years'} in public life
          </p>
          {player.flags.defected === 1 && (
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)', fontWeight: 700, marginTop: 6 }}>
              ⚠ Recently crossed the floor — the voters will have their say at the next election.
            </p>
          )}
        </div>
      )}

      <div className="card" style={{ marginBottom: 12 }}>
        <h3 style={{ fontSize: 'var(--fs-sm)', marginBottom: 8 }}>Career</h3>
        {spans.length === 0 ? (
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
            Backbencher so far — every great career starts somewhere near the back.
          </p>
        ) : (
          spans.map((span, i) => (
            <div
              key={i}
              style={{
                display: 'flex', justifyContent: 'space-between', gap: 10,
                padding: '6px 0',
                borderBottom: i < spans.length - 1 ? '1px solid var(--line)' : 'none',
                fontSize: 'var(--fs-xs)',
              }}
            >
              <span style={{ fontWeight: 700 }}>{spanTitle(game, span)}</span>
              <span style={{ color: 'var(--muted)', flexShrink: 0 }}>
                {formatMonthYear(span.start)} – {span.end ? formatMonthYear(span.end) : 'now'}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <h3 style={{ fontSize: 'var(--fs-sm)', marginBottom: 10 }}>Reputation</h3>
        {Object.entries(player.stats).map(([key, value]) => (
          <div key={key} style={{ marginBottom: 8 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 'var(--fs-xs)', fontWeight: 700, marginBottom: 3,
            }}>
              <span>{STAT_LABELS[key]}</span>
              <span>{Math.round(value)}</span>
            </div>
            <div style={{ height: 7, background: 'var(--surface-2)', borderRadius: 4 }}>
              <div style={{
                width: `${value}%`, height: '100%',
                background: 'var(--party)', borderRadius: 4,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <h3 style={{ fontSize: 'var(--fs-sm)', marginBottom: 6 }}>Background</h3>
        <p style={{ fontSize: 'var(--fs-sm)', fontWeight: 700 }}>
          {BACKGROUNDS[player.background].name}
        </p>
        <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>
          {BACKGROUNDS[player.background].blurb}
        </p>
        {player.rebellionCount > 0 && (
          <p style={{ fontSize: 'var(--fs-xs)', marginTop: 8, fontWeight: 600 }}>
            🔥 Rebellions this parliament: {player.rebellionCount}
          </p>
        )}
      </div>

      {!playerIsLeader(game) && player.hasSeat && switchableParties.length > 0 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: 'var(--fs-sm)', marginBottom: 6 }}>Cross the floor</h3>
          {!pickingParty ? (
            <>
              <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginBottom: 10 }}>
                Defection is forever — you'll lose any job, start at the bottom of a new
                pecking order, and face the voters without your old rosette.
              </p>
              <button
                className="btn"
                style={{ textAlign: 'center' }}
                onClick={() => {
                  if (window.confirm(
                    'Are you sure? Crossing the floor costs you your role, your standing, and possibly your seat at the next election.'
                  )) {
                    setPickingParty(true);
                  }
                }}
              >
                Change party…
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginBottom: 10 }}>
                Choose your new colours:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {switchableParties.map((p) => (
                  <button
                    key={p}
                    className="btn"
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    onClick={() => {
                      crossFloor(p);
                      setPickingParty(false);
                    }}
                  >
                    <span style={{
                      width: 11, height: 11, borderRadius: '50%',
                      background: PARTIES[p].colour,
                      border: '1px solid rgba(0,0,0,0.12)', flexShrink: 0,
                    }} />
                    {PARTIES[p].name}
                  </button>
                ))}
                <button
                  className="btn"
                  style={{ textAlign: 'center', color: 'var(--muted)' }}
                  onClick={() => setPickingParty(false)}
                >
                  Stay where you are
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {player.officeId && player.hasSeat && (
        <button
          className="btn"
          style={{ textAlign: 'center', marginBottom: 8 }}
          onClick={() => {
            const isLeader = playerIsLeader(game);
            const msg = isLeader
              ? 'Resign the leadership? A successor will take over and you will return to the backbenches.'
              : `Resign as ${playerOfficeTitle(game)}? You will stay on as an MP.`;
            if (window.confirm(msg)) resignOffice();
          }}
        >
          Resign your office
        </button>
      )}

      {playerInGovernment(game) && !playerIsLeader(game) && player.hasSeat
        && game.government.pmId !== 'player' && (
        <button
          className="btn"
          style={{ color: 'var(--danger)', textAlign: 'center', marginBottom: 8 }}
          onClick={() => {
            const frontbench = playerTier(game) >= 1;
            const msg = frontbench
              ? `Resign as ${playerOfficeTitle(game)} and publicly call for the Prime Minister to go? This will destroy your relationship with the leadership — but a senior resignation carries real weight.`
              : 'Submit a letter of no confidence in the Prime Minister? It will anger the whips and the leader, and may or may not move the dial.';
            if (window.confirm(msg)) callForPmResignation();
          }}
        >
          {playerTier(game) >= 1 ? 'Resign and call for the PM to go' : 'Call for the PM to resign'}
        </button>
      )}

      <button
        className="btn"
        style={{ color: 'var(--danger)', textAlign: 'center', marginBottom: 8 }}
        onClick={() => {
          if (window.confirm('Retire from politics? This ends your career.')) retire();
        }}
      >
        Retire from politics
      </button>
    </div>
  );
}
