import { DrawnCard, GameState } from '../types/game';
import { Avatar } from '../avatar/Avatar';
import { PARTIES } from '../data/parties';
import './DecisionCardView.css';

interface DecisionCardViewProps {
  game: GameState;
  card: DrawnCard;
  onChoose: (index: number) => void;
  onContinue: () => void;
}

export function DecisionCardView({ game, card, onChoose, onContinue }: DecisionCardViewProps) {
  const speaker = card.speakerId ? game.characters[card.speakerId] : undefined;

  return (
    <div className="dcard card fade-in" key={card.cardId + (card.outcome ? '-outcome' : '')}>
      {speaker && (
        <div className="dcard-speaker">
          <Avatar
            config={speaker.avatar}
            size={44}
            partyColour={PARTIES[speaker.partyId].colour}
          />
          <div>
            <div className="dcard-speaker-name">{speaker.name}</div>
            <div className="dcard-speaker-party">{PARTIES[speaker.partyId].shortName}</div>
          </div>
        </div>
      )}
      <h3 className="dcard-title">{card.title}</h3>

      {!card.outcome ? (
        <>
          <p className="dcard-body">{card.body}</p>
          <div className="dcard-choices">
            {card.choices.map((c, i) => (
              <button key={i} className="btn" onClick={() => onChoose(i)}>
                {c.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="dcard-body">{card.outcome.text}</p>
          {card.outcome.deltas.length > 0 && (
            <div className="dcard-deltas">
              {card.outcome.deltas.map((d, i) => (
                <span
                  key={i}
                  className={`dcard-delta ${d.delta >= 0 ? 'pos' : 'neg'}`}
                >
                  {d.label} {d.delta > 0 ? '+' : ''}{d.delta}
                </span>
              ))}
            </div>
          )}
          <button className="btn btn-primary dcard-continue" onClick={onContinue}>
            Continue
          </button>
        </>
      )}
    </div>
  );
}
