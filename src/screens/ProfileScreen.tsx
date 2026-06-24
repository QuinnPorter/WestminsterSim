import { useMemo, useState } from 'react';
import { GameState, OfficeId, PartyId } from '../types/game';
import type { RoleSide } from '../engine/career';
import { useGameStore } from '../store/gameStore';
import { useUiStore } from '../store/uiStore';
import { Avatar } from '../avatar/Avatar';
import { PARTIES, playablePartiesForEra } from '../data/parties';
import { REGIONS } from '../data/regions';
import { BACKGROUNDS } from '../data/backgrounds';
import { CAUSES_BY_ID } from '../data/causes';
import { STAT_LABELS } from '../engine/effects';
import {
  playerOfficeLabel, playerOfficeTitle, playerIsLeader, playerInGovernment, playerTier,
} from '../engine/career';
import { relationshipName, getRelationship } from '../engine/relationships';
import { formatMonthYear, yearsBetween } from '../engine/clock';

export interface OfficeSpan {
  officeId: OfficeId;
  start: number;
  end: number | null;
  becamePM: boolean;
  roleSide?: RoleSide;
  partyId?: PartyId;
  label?: string;
}

/** chronological portfolio history, derived from roleChange entries (newest first) */
export function buildOfficeSpans(history: GameState['history']): OfficeSpan[] {
  const spans: OfficeSpan[] = [];
  let current: OfficeSpan | null = null;
  for (const entry of history) {
    if (entry.kind !== 'roleChange') continue;
    // a 'continued' move into the IDENTICAL role just extends the open span — e.g. a
    // Speaker re-elected each parliament shows as one continuous entry, not one per term
    if (
      current && entry.how === 'continued' && entry.officeId === current.officeId &&
      (entry.label ?? null) === (current.label ?? null) &&
      (entry.roleSide ?? null) === (current.roleSide ?? null) &&
      (entry.partyId ?? null) === (current.partyId ?? null)
    ) {
      continue;
    }
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
        label: entry.label,
      };
    }
  }
  if (current) spans.push(current);
  return spans.reverse(); // newest first
}

function officeSpans(game: GameState): OfficeSpan[] {
  return buildOfficeSpans(game.history);
}

export interface DeputySpan { title: 'dpm' | 'firstSec'; start: number; end: number | null; }

/** the Deputy-PM / First-Secretary overlay spans — a concurrent track, paired from
 *  the deputyOverlay start/end history entries (an open span runs to "now") */
export function buildDeputySpans(history: GameState['history']): DeputySpan[] {
  const spans: DeputySpan[] = [];
  let open: DeputySpan | null = null;
  for (const entry of history) {
    if (entry.kind !== 'deputyOverlay') continue;
    if (entry.action === 'start') {
      if (open) spans.push(open);
      open = { title: entry.title ?? 'dpm', start: entry.date, end: null };
    } else if (entry.action === 'end' && open) {
      open.end = entry.date;
      spans.push(open);
      open = null;
    }
  }
  if (open) spans.push(open);
  return spans;
}

export interface TimelineRow { title: string; start: number; end: number | null; }

/** office spans + concurrent deputy-overlay spans, merged newest-first for the timeline */
export function timelineRows(game: GameState): TimelineRow[] {
  // once the career is over, an office still "open" ended on the final day — so the
  // timeline (and the shared rundown) reads as a closed date range, not "– present"
  const end = game.gameOver ? game.day : null;
  const close = (e: number | null) => (e === null ? end : e);
  const office: TimelineRow[] = officeSpans(game).map((s) => ({
    title: spanTitle(game, s), start: s.start, end: close(s.end),
  }));
  const deputy: TimelineRow[] = buildDeputySpans(game.history).map((d) => ({
    title: d.title === 'firstSec' ? 'First Secretary of State' : 'Deputy Prime Minister',
    start: d.start, end: close(d.end),
  }));
  return [...office, ...deputy].sort((a, b) => b.start - a.start);
}

export function spanTitle(game: GameState, span: OfficeSpan): string {
  if (span.becamePM) return 'Prime Minister';
  if (span.label) return span.label; // composite roles (e.g. junior coalition partner)
  return playerOfficeLabel(game, span.officeId, span.start, {
    roleSide: span.roleSide, partyId: span.partyId,
  });
}

export function ProfileScreen({ game }: { game: GameState }) {
  const retire = useGameStore((s) => s.retire);
  const crossFloor = useGameStore((s) => s.crossFloor);
  const resignOffice = useGameStore((s) => s.resignOffice);
  const callForPmResignation = useGameStore((s) => s.callForPmResignation);
  const callForLeaderResignation = useGameStore((s) => s.callForLeaderResignation);
  const slots = useGameStore((s) => s.slots);
  const saveToSlot = useGameStore((s) => s.saveToSlot);
  const overwriteSlot = useGameStore((s) => s.overwriteSlot);
  const requestConfirm = useUiStore((s) => s.requestConfirm);
  const setAgendaEditorOpen = useUiStore((s) => s.setAgendaEditorOpen);
  const setMentorHistoryOpen = useUiStore((s) => s.setMentorHistoryOpen);
  const [pickingParty, setPickingParty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const player = game.player;
  const seat = game.seatMap.find((s) => s.id === player.seatId);
  const party = PARTIES[player.partyId];
  const rows = useMemo(() => timelineRows(game), [game]);

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

  // defection targets: any playable party that contests the player's region,
  // plus sitting as an Independent (defection only — never a start option, and
  // it ends any chance of climbing the ministerial ladder)
  const switchableParties: PartyId[] = [...playablePartiesForEra(game.startEra), 'ind' as PartyId].filter(
    (p) => p !== player.partyId
      && (p === 'ind' || PARTIES[p].contestsRegions.includes(player.region))
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontSize: 'var(--fs-sm)' }}>Your Agenda</h3>
          <button
            onClick={() => setAgendaEditorOpen(true)}
            style={{
              background: 'none', border: 'none', padding: '6px 0',
              color: 'var(--party)', fontWeight: 700, fontSize: 'var(--fs-xs)', cursor: 'pointer',
            }}
          >
            Change ›
          </button>
        </div>
        {(player.causes ?? []).length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {player.causes.map((c) => (
              <span key={c} style={{
                fontSize: 'var(--fs-xs)', fontWeight: 700, padding: '4px 10px',
                borderRadius: 999, background: 'var(--surface-2)',
              }}>
                {CAUSES_BY_ID[c]?.label ?? c}
              </span>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
            No causes chosen — pick what you stand for.
          </p>
        )}
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontSize: 'var(--fs-sm)', margin: 0 }}>Career</h3>
          {(game.mentors?.length ?? 0) > 0 && (
            <button
              onClick={() => setMentorHistoryOpen(true)}
              style={{
                background: 'none', border: 'none', padding: 0,
                color: 'var(--party)', fontWeight: 700, fontSize: 'var(--fs-xs)', cursor: 'pointer',
              }}
            >
              Mentors ›
            </button>
          )}
        </div>
        {rows.length === 0 ? (
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
            Backbencher so far — every great career starts somewhere near the back.
          </p>
        ) : (
          rows.map((row, i) => (
            <div
              key={i}
              style={{
                display: 'flex', justifyContent: 'space-between', gap: 10,
                padding: '6px 0',
                borderBottom: i < rows.length - 1 ? '1px solid var(--line)' : 'none',
                fontSize: 'var(--fs-xs)',
              }}
            >
              <span style={{ fontWeight: 700 }}>{row.title}</span>
              <span style={{ color: 'var(--muted)', flexShrink: 0 }}>
                {formatMonthYear(row.start)} – {row.end ? formatMonthYear(row.end) : 'now'}
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
                onClick={() =>
                  requestConfirm({
                    title: 'Cross the floor?',
                    message: 'Crossing the floor costs you your role, your standing, and possibly your seat at the next election.',
                    confirmLabel: 'Choose new party',
                    danger: true,
                    onConfirm: () => setPickingParty(true),
                  })
                }
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
            requestConfirm({
              title: isLeader ? 'Resign the leadership?' : 'Resign your office?',
              message: isLeader
                ? 'A successor will take over and you will return to the backbenches.'
                : `Step down as ${playerOfficeTitle(game)}? You will stay on as an MP.`,
              confirmLabel: 'Resign',
              onConfirm: resignOffice,
            });
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
            requestConfirm({
              title: frontbench ? 'Resign and move against the PM?' : 'Call for the PM to go?',
              message: frontbench
                ? `Resign as ${playerOfficeTitle(game)} and publicly call for the Prime Minister to go? It will destroy your relationship with the leadership — but a senior resignation carries real weight.`
                : 'Submit a letter of no confidence in the Prime Minister? It will anger the whips and the leader, and may or may not move the dial.',
              confirmLabel: frontbench ? 'Resign and call' : 'Submit letter',
              danger: true,
              onConfirm: callForPmResignation,
            });
          }}
        >
          {playerTier(game) >= 1 ? 'Resign and call for the PM to go' : 'Call for the PM to resign'}
        </button>
      )}

      {!playerInGovernment(game) && !playerIsLeader(game) && player.hasSeat
        && getRelationship(game, 'leader')?.characterId !== 'player' && (
        <button
          className="btn"
          style={{ color: 'var(--danger)', textAlign: 'center', marginBottom: 8 }}
          onClick={() => {
            const frontbench = playerTier(game) >= 1;
            const leaderName = relationshipName(game, 'leader');
            requestConfirm({
              title: frontbench ? 'Resign and move against the leader?' : 'Call for the leader to go?',
              message: frontbench
                ? `Resign as ${playerOfficeTitle(game)} and publicly call for ${leaderName} to go? It will destroy your relationship with the leadership — but a senior resignation carries real weight.`
                : `Submit a letter of no confidence in ${leaderName}? It will anger the whips and the leadership, and may or may not move the dial.`,
              confirmLabel: frontbench ? 'Resign and call' : 'Submit letter',
              danger: true,
              onConfirm: callForLeaderResignation,
            });
          }}
        >
          {playerTier(game) >= 1 ? 'Resign and call for the leader to go' : 'Call for the leader to resign'}
        </button>
      )}

      {player.hasSeat && (
        <button
          className="btn"
          style={{ textAlign: 'center', marginBottom: 8 }}
          onClick={() => { setSavedMsg(false); setSaving(true); }}
        >
          Save game
        </button>
      )}

      <button
        className="btn"
        style={{ color: 'var(--danger)', textAlign: 'center', marginBottom: 8 }}
        onClick={() =>
          requestConfirm({
            title: 'Retire from politics?',
            message: 'This ends your career for good.',
            confirmLabel: 'Retire',
            danger: true,
            onConfirm: retire,
          })
        }
      >
        Retire from politics
      </button>

      {/* discreet settings access — version / privacy / about */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
        <button
          aria-label="Settings"
          onClick={() => useUiStore.getState().setSettingsOpen(true)}
          style={{
            background: 'none', border: 'none', padding: 8, cursor: 'pointer',
            color: 'var(--muted)', opacity: 0.5, lineHeight: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {saving && (
        <SaveModal
          game={game}
          slots={slots}
          onSaveNew={(name) => { saveToSlot(name); finishSave(); }}
          onOverwrite={(id, name) => { overwriteSlot(id, name); finishSave(); }}
          onClose={() => setSaving(false)}
        />
      )}
      {savedMsg && (
        <p style={{ textAlign: 'center', color: 'var(--success)', fontWeight: 600, marginTop: 4 }}>
          Saved ✓
        </p>
      )}
    </div>
  );

  function finishSave() {
    setSaving(false);
    setSavedMsg(true);
  }
}

function SaveModal({
  game, slots, onSaveNew, onOverwrite, onClose,
}: {
  game: GameState;
  slots: { id: string; name: string; legacyLabel: string }[];
  onSaveNew: (name: string) => void;
  onOverwrite: (id: string, name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(`${game.player.name} — ${playerOfficeTitle(game)}`);
  const full = slots.length >= 3;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3 className="modal-title">Save game</h3>
        <input
          className="nc-input"
          style={{ width: '100%', marginBottom: 14 }}
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
        />
        {full ? (
          <>
            <p className="modal-message" style={{ marginBottom: 10 }}>
              All 3 save slots are full — choose one to overwrite:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {slots.map((s) => (
                <button key={s.id} className="btn" style={{ textAlign: 'left' }}
                  onClick={() => onOverwrite(s.id, name)}>
                  <strong>{s.name}</strong>
                  <span style={{ display: 'block', fontSize: 'var(--fs-sm)', color: 'var(--muted)' }}>{s.legacyLabel}</span>
                </button>
              ))}
            </div>
            <button className="btn modal-cancel" style={{ textAlign: 'center' }} onClick={onClose}>Cancel</button>
          </>
        ) : (
          <div className="modal-actions">
            <button className="btn modal-cancel" onClick={onClose}>Cancel</button>
            <button className="btn modal-confirm" onClick={() => onSaveNew(name)}>Save</button>
          </div>
        )}
      </div>
    </div>
  );
}
