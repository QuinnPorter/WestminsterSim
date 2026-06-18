import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useUiStore } from './store/uiStore';
import { useGameStore } from './store/gameStore';
import { TabBar } from './components/TabBar';
import { ConfirmModal } from './components/ConfirmModal';
import { PmHistoryModal } from './components/PmHistoryModal';
import { LoHistoryModal } from './components/LoHistoryModal';
import { MentorHistoryModal } from './components/MentorHistoryModal';
import { ElectionsModal } from './components/ElectionsModal';
import { SeatHistoryModal } from './components/SeatHistoryModal';
import { AgendaEditor } from './components/AgendaEditor';
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
  const protege = useUiStore((s) => s.protege);

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

  // native shell setup (no-op on web): status-bar styling for the cream theme, and
  // the Android hardware back button — close any open modal first, then walk back
  // through tabs to Play, then exit. State is read fresh via getState().
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    // Style.Light = dark icons/text, suited to the light (cream) background
    StatusBar.setStyle({ style: Style.Light }).catch(() => {});

    let handle: { remove: () => void } | undefined;
    CapacitorApp.addListener('backButton', () => {
      const s = useUiStore.getState();
      if (s.confirm) { s.closeConfirm(); return; }
      if (s.pmHistoryOpen) { s.setPmHistoryOpen(false); return; }
      if (s.loHistoryOpen) { s.setLoHistoryOpen(false); return; }
      if (s.mentorHistoryOpen) { s.setMentorHistoryOpen(false); return; }
      if (s.electionsOpen) { s.setElectionsOpen(false); return; }
      if (s.seatHistoryOpen) { s.setSeatHistoryOpen(false); return; }
      if (s.agendaEditorOpen) { s.setAgendaEditorOpen(false); return; }
      if (s.protege) { s.setProtege(null); return; }
      if (!s.started && s.landing !== 'menu') { s.setLanding('menu'); return; }
      if (s.started && s.activeTab !== 'play') { s.setTab('play'); return; }
      CapacitorApp.exitApp();
    }).then((h) => { handle = h; });

    return () => { handle?.remove(); };
  }, []);

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
    // "continue as protégé": the end screen hands off to character creation in the
    // same world (party/era locked); on submit the store swaps in the fresh player
    if (protege) {
      return (
        <div className="shell">
          <NewCareerScreen />
          <ConfirmModal />
        </div>
      );
    }
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
      <LoHistoryModal game={game} />
      <MentorHistoryModal game={game} />
      <ElectionsModal game={game} />
      <SeatHistoryModal game={game} />
      <AgendaEditor game={game} />
    </div>
  );
}
