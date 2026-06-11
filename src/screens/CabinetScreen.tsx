import { useState } from 'react';
import { GameState } from '../types/game';
import { CABINET_OFFICES, OFFICES } from '../data/offices';
import { PARTIES } from '../data/parties';
import { Avatar } from '../avatar/Avatar';
import './CabinetScreen.css';

export function CabinetScreen({ game }: { game: GameState }) {
  const [side, setSide] = useState<'gov' | 'opp'>('gov');
  const isGov = side === 'gov';
  const leaderId = isGov ? game.government.pmId : game.government.loId;
  const posts = isGov ? game.government.cabinet : game.government.shadowCabinet;
  const party = isGov ? game.government.governingParty : game.government.oppositionParty;

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

function MemberCard({ game, characterId, title }: {
  game: GameState; characterId: string; title: string;
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
    </div>
  );
}
