import { useEffect } from 'react';
import { useUiStore } from './store/uiStore';
import { useGameStore } from './store/gameStore';
import { TabBar } from './components/TabBar';
import { ConfirmModal } from './components/ConfirmModal';
import { PmHistoryModal } from './components/PmHistoryModal';
import { TitleScreen } from './screens/TitleScreen';
import { NewCareerScreen } from './screens/NewCareerScreen';
import { LoadGameScreen } from './screens/LoadGameScreen';
import { TutorialOverlay } from './components/TutorialOverlay';
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
  const started = useUiStore((s) => s.started);
  const setStarted = useUiStore((s) => s.setStarted);
  const landing = useUiStore((s) => s.landing);
  const setLanding = useUiStore((s) => s.setLanding);

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

  // if the live game vanishes (abandoned / new game discarded) while "started",
  // fall back to the landing menu
  useEffect(() => {
    if (started && !game) {
      setStarted(false);
      setLanding('menu');
    }
  }, [started, game, setStarted, setLanding]);

  // ---- landing flow (always shown first on launch) ----
  if (!started) {
    return (
      <div className="shell">
        {landing === 'create' && <NewCareerScreen />}
        {landing === 'tutorial' && <TutorialOverlay onDone={() => setLanding('menu')} />}
        {landing === 'load' && <LoadGameScreen onBack={() => setLanding('menu')} />}
        {landing === 'menu' && <TitleScreen />}
        <ConfirmModal />
      </div>
    );
  }

  if (game?.gameOver) {
    return (
      <div className="shell">
        <GameOverScreen game={game} />
        <ConfirmModal />
      </div>
    );
  }

  if (game?.pendingElectionId) {
    return (
      <div className="shell">
        <ElectionNightScreen game={game} />
        {debug && <DebugMenu />}
        <ConfirmModal />
      </div>
    );
  }

  if (!game) return null; // transient; the effect above resets to the menu

  return (
    <div className="shell">
      {activeTab === 'play' && <PlayScreen game={game} />}
      {activeTab === 'history' && <HistoryScreen game={game} />}
      {activeTab === 'cabinet' && <CabinetScreen game={game} />}
      {activeTab === 'parliament' && <ParliamentScreen game={game} />}
      {activeTab === 'profile' && <ProfileScreen game={game} />}
      <TabBar />
      {debug && <DebugMenu />}
      <ConfirmModal />
      <PmHistoryModal game={game} />
    </div>
  );
}
