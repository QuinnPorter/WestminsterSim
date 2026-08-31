import { GameState } from '../types/game';
import { useGameStore } from '../store/gameStore';
import { TopBar } from '../components/TopBar';
import { StatChips } from '../components/StatChips';
import { RelationshipBadges } from '../components/RelationshipBadges';
import { SituationPanel } from '../components/SituationPanel';
import { DecisionCardView } from '../components/DecisionCardView';
import { playerIsLeader } from '../engine/career';

export function PlayScreen({ game }: { game: GameState }) {
  const resolveChoice = useGameStore((s) => s.resolveChoice);
  const continueAfterOutcome = useGameStore((s) => s.continueAfterOutcome);

  return (
    <div className="screen screen-play">
      <TopBar game={game} />
      <div style={{ marginBottom: 12 }}>
        <StatChips stats={game.player.stats} />
      </div>
      <RelationshipBadges game={game} />
      {playerIsLeader(game) && <SituationPanel game={game} />}
      {game.currentCard ? (
        <DecisionCardView
          game={game}
          card={game.currentCard}
          onChoose={resolveChoice}
          onContinue={continueAfterOutcome}
        />
      ) : (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)' }}>
          The House is quiet…
        </div>
      )}
    </div>
  );
}
