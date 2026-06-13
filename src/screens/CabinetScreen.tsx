import { useState } from 'react';
import { GameState, OfficeId } from '../types/game';
import { CABINET_OFFICES, OFFICES } from '../data/offices';
import { PARTIES } from '../data/parties';
import { useGameStore } from '../store/gameStore';
import { useUiStore } from '../store/uiStore';
import { playerIsLeader, playerInGovernment } from '../engine/career';
import { Avatar } from '../avatar/Avatar';
import './CabinetScreen.css';

export function CabinetScreen({ game }: { game: GameState }) {
  const [side, setSide] = useState<'gov' | 'opp'>('gov');
  const sackMinister = useGameStore((s) => s.sackMinister);
  const requestConfirm = useUiStore((s) => s.requestConfirm);
  const isGov = side === 'gov';
  const leaderId = isGov ? game.government.pmId : game.government.loId;
  const posts = isGov ? game.government.cabinet : game.government.shadowCabinet;
  const party = isGov ? game.government.governingParty : game.government.oppositionParty;
  // the player can sack ministers on the side they lead
  const canSack =
    playerIsLeader(game) &&
    ((isGov && playerInGovernment(game)) || (!isGov && !playerInGovernment(game)));

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
      />

      <div className="cab-grid">
        {CABINET_OFFICES.map((officeId) => {
          const post = posts.find((p) => p.officeId === officeId);
          if (!post) return null;
          return (
            <MemberCard
              key={officeId}
              game={game}
              characterId={post.characterId}
              title={isGov ? OFFICES[officeId].title : OFFICES[officeId].shadowTitle}
              onSack={canSack && post.characterId !== 'player'
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

function FeaturedMember({ game, characterId, title }: {
  game: GameState; characterId: string; title: string;
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
        <div className="cab-featured-title">{title}</div>
      </div>
    </div>
  );
}

function MemberCard({ game, characterId, title, onSack }: {
  game: GameState; characterId: string; title: string; onSack?: () => void;
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
        {rel && (
          <span className="cab-rel" title="Your relationship">
            {rel.value >= 25 ? '🙂' : rel.value <= -25 ? '😠' : '😐'}
          </span>
        )}
      </div>
      <div className="cab-member-title">{title}</div>
      {onSack && (
        <button className="cab-sack" onClick={onSack}>Sack</button>
      )}
    </div>
  );
}
