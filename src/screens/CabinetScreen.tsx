import { useState } from 'react';
import { GameState, OfficeId } from '../types/game';
import { CABINET_OFFICES, OFFICES } from '../data/offices';
import { PARTIES, partyTextColour } from '../data/parties';
import { useGameStore } from '../store/gameStore';
import { useUiStore } from '../store/uiStore';
import { playerIsLeader, playerIsPM, cabinetTitleFor, benchPoolFor, isReshuffleBlocking } from '../engine/career';
import { Avatar } from '../avatar/Avatar';
import { tap } from '../native/haptics';
import './CabinetScreen.css';

export function CabinetScreen({ game }: { game: GameState }) {
  const [side, setSide] = useState<'gov' | 'opp'>('gov');
  const [sackTarget, setSackTarget] = useState<{ officeId: OfficeId; name: string } | null>(null);
  const sackMinister = useGameStore((s) => s.sackMinister);
  const setDeputyPm = useGameStore((s) => s.setDeputyPm);
  const reshuffleCabinet = useGameStore((s) => s.reshuffleCabinet);
  const requestConfirm = useUiStore((s) => s.requestConfirm);
  const setPmHistoryOpen = useUiStore((s) => s.setPmHistoryOpen);
  const setLoHistoryOpen = useUiStore((s) => s.setLoHistoryOpen);
  const isGov = side === 'gov';
  const leaderId = isGov ? game.government.pmId : game.government.loId;
  const posts = isGov ? game.government.cabinet : game.government.shadowCabinet;
  const party = isGov ? game.government.governingParty : game.government.oppositionParty;
  // only the PM controls the government cabinet; only the official Leader of the
  // Opposition controls the shadow cabinet. A minor-party / junior-coalition leader
  // controls neither.
  const leadsOpposition = playerIsLeader(game) && game.player.partyId === game.government.oppositionParty;
  const canSack = (isGov && playerIsPM(game)) || (!isGov && leadsOpposition);
  // only a sitting Prime Minister names the Deputy PM
  const canMakeDeputy = isGov && playerIsPM(game);
  // a reshuffle only waits on genuinely vital business (a contest, an election, a
  // confidence vote, a multi-step set-piece) — not on routine cards
  const reshuffleBlocked = isReshuffleBlocking(game.currentCard);

  return (
    <div className="screen">
      <div className="cab-toggle">
        <button className={isGov ? 'active' : ''} onClick={() => setSide('gov')}>
          Government
        </button>
        <button className={!isGov ? 'active' : ''} onClick={() => setSide('opp')}>
          Opposition
        </button>
      </div>

      <FeaturedMember
        game={game}
        characterId={leaderId}
        title={isGov ? 'Prime Minister' : 'Leader of the Opposition'}
        onTitleClick={isGov ? () => setPmHistoryOpen(true) : () => setLoHistoryOpen(true)}
        titleColour={isGov
          ? partyTextColour(game.government.governingParty)
          : partyTextColour(game.government.oppositionParty)}
        onReshuffle={canSack ? () => { tap(); reshuffleCabinet(); } : undefined}
        reshuffleDisabled={reshuffleBlocked}
      />

      {sackTarget && (
        <SackPicker
          game={game}
          party={party}
          target={sackTarget}
          onClose={() => setSackTarget(null)}
          onSack={(replacementId) => { sackMinister(sackTarget.officeId, replacementId); setSackTarget(null); }}
        />
      )}

      <div className="cab-grid">
        {/* a Deputy PM who holds no department (Clegg-style) isn't a post-holder, so
            give the player a standalone cabinet card */}
        {isGov && game.government.deputyPmId === 'player'
          && !posts.some((p) => p.characterId === 'player') && (
          <MemberCard
            game={game}
            characterId="player"
            title={game.government.deputyTitle === 'firstSec' ? 'First Secretary of State' : 'Deputy Prime Minister'}
            coalitionOf={game.player.partyId !== game.government.governingParty
              ? PARTIES[game.player.partyId].shortName : undefined}
          />
        )}
        {CABINET_OFFICES.map((officeId) => {
          const post = posts.find((p) => p.officeId === officeId);
          if (!post) return null;
          // the deputy PM / First Secretary doubles up an existing cabinet seat
          const isDeputy = isGov && game.government.deputyPmId === post.characterId;
          const isNpc = post.characterId !== 'player';
          const memberParty = isNpc ? game.characters[post.characterId]?.partyId : undefined;
          // a coalition partner's minister sits in the governing cabinet
          const coalitionOf = isGov && memberParty && memberParty !== game.government.governingParty
            ? PARTIES[memberParty].shortName : undefined;
          // deputy PM is a departmental Secretary of State — never the Chief Whip,
          // the Chief Secretary, or a coalition partner's minister
          const deputyEligible = (!!OFFICES[officeId]?.department || officeId === 'chancellor_duchy')
            && officeId !== 'chief_sec' && !coalitionOf;
          return (
            <MemberCard
              key={officeId}
              game={game}
              characterId={post.characterId}
              title={cabinetTitleFor(officeId, isGov, isDeputy, game.government.deputyTitle)}
              coalitionOf={coalitionOf}
              onSack={canSack && isNpc
                ? () => {
                    const name = game.characters[post.characterId]?.name ?? 'this minister';
                    setSackTarget({ officeId: officeId as OfficeId, name });
                  }
                : undefined}
              onMakeDeputy={canMakeDeputy && isNpc && deputyEligible && !isDeputy
                ? () => {
                    const name = game.characters[post.characterId]?.name ?? 'this minister';
                    requestConfirm({
                      title: `Make ${name} your deputy?`,
                      message: 'They will serve as Deputy Prime Minister / First Secretary alongside their brief.',
                      confirmLabel: 'Make deputy',
                      onConfirm: () => setDeputyPm(post.characterId),
                    });
                  }
                : undefined}
            />
          );
        })}
      </div>
      <p style={{
        marginTop: 12, fontSize: 'var(--fs-xs)', color: 'var(--muted)', textAlign: 'center',
      }}>
        {PARTIES[party].name}
      </p>
    </div>
  );
}

function FeaturedMember({ game, characterId, title, onTitleClick, titleColour, onReshuffle, reshuffleDisabled }: {
  game: GameState; characterId: string; title: string; onTitleClick?: () => void;
  titleColour?: string; onReshuffle?: () => void; reshuffleDisabled?: boolean;
}) {
  const isPlayer = characterId === 'player';
  const char = isPlayer ? null : game.characters[characterId];
  const name = isPlayer ? game.player.name : char?.name ?? '—';
  const avatar = isPlayer ? game.player.avatar : char?.avatar;
  const partyId = isPlayer ? game.player.partyId : char?.partyId ?? 'ind';

  return (
    <div className="card cab-featured">
      {avatar && (
        <Avatar config={avatar} size={68} partyColour={PARTIES[partyId].colour} />
      )}
      <div className="cab-featured-body">
        <div className="cab-featured-name">
          {name} {isPlayer && <span className="cab-you">YOU</span>}
        </div>
        {onTitleClick ? (
          <button
            className="cab-featured-title cab-title-link"
            onClick={onTitleClick}
            style={titleColour ? { color: titleColour } : undefined}
          >
            {title} <span aria-hidden>›</span>
          </button>
        ) : (
          <div className="cab-featured-title">{title}</div>
        )}
      </div>
      {onReshuffle && (
        <button
          className="cab-reshuffle"
          onClick={onReshuffle}
          disabled={reshuffleDisabled}
          title={reshuffleDisabled ? 'Deal with the matter in hand first' : undefined}
        >
          Reshuffle
        </button>
      )}
    </div>
  );
}

/** picking a named replacement when the player-leader sacks a minister — the ablest
 *  available hand by default, or any backbencher from the party's real bench pool. */
function SackPicker({ game, party, target, onClose, onSack }: {
  game: GameState; party: GameState['player']['partyId'];
  target: { officeId: OfficeId; name: string };
  onClose: () => void;
  onSack: (replacementId?: string) => void;
}) {
  const pool = benchPoolFor(game, party).slice(0, 5);
  const choose = (replacementId?: string) => { tap(); onSack(replacementId); };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3 className="modal-title">Sack {target.name}?</h3>
        <p className="modal-message">
          It spends political capital, and they won&rsquo;t forget. Choose who steps up.
        </p>
        <div className="sack-pool">
          <button className="sack-option sack-option-default" onClick={() => choose(undefined)}>
            <span className="sack-option-text">
              <span className="sack-option-name">Promote the ablest available</span>
              <span className="sack-option-sub">Let the whips find the strongest hand</span>
            </span>
          </button>
          {pool.map((c) => {
            const loyalty = c.loyalty ?? 0;
            return (
              <button key={c.id} className="sack-option" onClick={() => choose(c.id)}>
                <Avatar config={c.avatar} size={30} partyColour={PARTIES[c.partyId].colour} />
                <span className="sack-option-name">{c.name}</span>
                <span className="sack-option-stats">
                  <span title="Competence">{Math.round(c.competence)}</span>
                  <span
                    className={`sack-loyalty${loyalty >= 0 ? ' pos' : ' neg'}`}
                    title="Loyalty to you"
                  >
                    {loyalty > 0 ? '+' : ''}{Math.round(loyalty)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="modal-actions">
          <button className="btn modal-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function MemberCard({ game, characterId, title, onSack, onMakeDeputy, coalitionOf }: {
  game: GameState; characterId: string; title: string;
  onSack?: () => void; onMakeDeputy?: () => void; coalitionOf?: string;
}) {
  const isPlayer = characterId === 'player';
  const char = isPlayer ? null : game.characters[characterId];
  const name = isPlayer ? game.player.name : char?.name ?? '—';
  const avatar = isPlayer ? game.player.avatar : char?.avatar;
  const partyId = isPlayer ? game.player.partyId : char?.partyId ?? 'ind';
  const rel = isPlayer ? undefined
    : game.relationships.find((r) => r.characterId === characterId);

  return (
    <div className={`card cab-member${isPlayer ? ' cab-member-you' : ''}`}>
      {avatar && (
        <Avatar config={avatar} size={46} partyColour={PARTIES[partyId].colour} />
      )}
      <div className="cab-member-name">
        {name} {isPlayer && <span className="cab-you">YOU</span>}
        {coalitionOf && (
          <span className="cab-coalition" title="Coalition partner">{coalitionOf}</span>
        )}
        {rel && (
          <span className="cab-rel" title="Your relationship">
            {rel.value > 0 ? '+' : ''}{Math.round(rel.value)}
          </span>
        )}
      </div>
      <div className="cab-member-title">{title}</div>
      <div className="cab-actions">
        {onMakeDeputy && (
          <button className="cab-deputy" onClick={onMakeDeputy}>Make deputy</button>
        )}
        {onSack && (
          <button className="cab-sack" onClick={onSack}>Sack</button>
        )}
      </div>
    </div>
  );
}
