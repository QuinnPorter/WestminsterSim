import { useState } from 'react';
import { GameState, OfficeId } from '../types/game';
import { CABINET_OFFICES, OFFICES } from '../data/offices';
import { PARTIES, partyTextColour } from '../data/parties';
import { useGameStore } from '../store/gameStore';
import { useUiStore } from '../store/uiStore';
import { playerIsLeader, playerIsPM, cabinetTitleFor } from '../engine/career';
import { Avatar } from '../avatar/Avatar';
import './CabinetScreen.css';

export function CabinetScreen({ game }: { game: GameState }) {
  const [side, setSide] = useState<'gov' | 'opp'>('gov');
  const sackMinister = useGameStore((s) => s.sackMinister);
  const setDeputyPm = useGameStore((s) => s.setDeputyPm);
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
      />

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
                    requestConfirm({
                      title: `Sack ${name}?`,
                      message: "It spends political capital, and they won't forget.",
                      confirmLabel: 'Sack',
                      danger: true,
                      onConfirm: () => sackMinister(officeId as OfficeId),
                    });
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

function FeaturedMember({ game, characterId, title, onTitleClick, titleColour }: {
  game: GameState; characterId: string; title: string; onTitleClick?: () => void; titleColour?: string;
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
      <div>
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
