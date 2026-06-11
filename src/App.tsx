import { useEffect, useState } from 'react';
import { useUiStore } from './store/uiStore';
import { useGameStore } from './store/gameStore';
import { TabBar } from './components/TabBar';
import { TitleScreen } from './screens/TitleScreen';
import { NewCareerScreen } from './screens/NewCareerScreen';
import { PlayScreen } from './screens/PlayScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { CabinetScreen } from './screens/CabinetScreen';
import { ParliamentScreen } from './screens/ParliamentScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ElectionNightScreen } from './screens/ElectionNightScreen';
import { GameOverScreen } from './screens/GameOverScreen';
import { DebugMenu } from './debug/DebugMenu';
import { PARTIES } from './data/parties';

export default function App() {
  const game = useGameStore((s) => s.game);
  const activeTab = useUiStore((s) => s.activeTab);
  const debug = useUiStore((s) => s.debug);
  const [creating, setCreating] = useState(false);

  // theme the UI with the player's party colour
  useEffect(() => {
    const root = document.documentElement;
    if (game) {
      const party = PARTIES[game.player.partyId];
      // pale party colours (SNP, Alliance) use their darker text variant as accent
      root.style.setProperty('--party', party.textColour ?? party.colour);
      root.style.setProperty('--party-ink', '#ffffff');
    } else {
      root.style.setProperty('--party', '#33415C');
      root.style.setProperty('--party-ink', '#ffffff');
    }
  }, [game?.player.partyId, game]);

  // leaving a finished game resets the creation flow
  useEffect(() => {
    if (game) setCreating(false);
  }, [game]);

  if (!game) {
    return (
      <div className="shell">
        {creating ? (
          <NewCareerScreen />
        ) : (
          <TitleScreen onNewCareer={() => setCreating(true)} />
        )}
      </div>
    );
  }

  if (game.gameOver) {
    return (
      <div className="shell">
        <GameOverScreen game={game} />
      </div>
    );
  }

  if (game.pendingElectionId) {
    return (
      <div className="shell">
        <ElectionNightScreen game={game} />
        {debug && <DebugMenu />}
      </div>
    );
  }

  return (
    <div className="shell">
      {activeTab === 'play' && <PlayScreen game={game} />}
      {activeTab === 'history' && <HistoryScreen game={game} />}
      {activeTab === 'cabinet' && <CabinetScreen game={game} />}
      {activeTab === 'parliament' && <ParliamentScreen game={game} />}
      {activeTab === 'profile' && <ProfileScreen game={game} />}
      <TabBar />
      {debug && <DebugMenu />}
    </div>
  );
}
