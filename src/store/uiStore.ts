import { create } from 'zustand';
import { PartyId, Era } from '../types/game';

export type TabId = 'play' | 'history' | 'cabinet' | 'parliament' | 'profile';

/** which pre-game landing view is showing (only when not yet `started`) */
export type LandingView = 'menu' | 'create' | 'tutorial' | 'load';

/** a request to show the in-app confirmation modal */
export interface ConfirmRequest {
  title?: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}

interface UiState {
  activeTab: TabId;
  setTab: (tab: TabId) => void;
  /** session flag (not persisted): have we entered the live game this session? */
  started: boolean;
  setStarted: (v: boolean) => void;
  /** which landing view to show while not started */
  landing: LandingView;
  setLanding: (v: LandingView) => void;
  /** the active confirmation request, or null when the modal is closed */
  confirm: ConfirmRequest | null;
  requestConfirm: (req: ConfirmRequest) => void;
  closeConfirm: () => void;
  /** whether the Prime-Minister succession modal is open */
  pmHistoryOpen: boolean;
  setPmHistoryOpen: (v: boolean) => void;
  /** whether the Leader-of-the-Opposition succession modal is open */
  loHistoryOpen: boolean;
  setLoHistoryOpen: (v: boolean) => void;
  /** whether the mentor (past-career) history modal is open */
  mentorHistoryOpen: boolean;
  setMentorHistoryOpen: (v: boolean) => void;
  /** when set, the new-career screen runs in "continue as protégé" mode: same
   *  world, locked to the mentor's party and era */
  protege: { partyId: PartyId; era: Era } | null;
  setProtege: (v: { partyId: PartyId; era: Era } | null) => void;
  /** whether the in-game agenda editor modal is open */
  agendaEditorOpen: boolean;
  setAgendaEditorOpen: (v: boolean) => void;
  /** whether the general-elections history modal is open */
  electionsOpen: boolean;
  setElectionsOpen: (v: boolean) => void;
  /** whether the historical seat-count graph modal is open */
  seatHistoryOpen: boolean;
  setSeatHistoryOpen: (v: boolean) => void;
  /** whether the Settings (version / privacy / about) modal is open */
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
  debug: boolean;
}

export const useUiStore = create<UiState>((set) => ({
  activeTab: 'play',
  setTab: (tab) => set({ activeTab: tab }),
  started: false,
  setStarted: (v) => set({ started: v }),
  landing: 'menu',
  setLanding: (v) => set({ landing: v }),
  confirm: null,
  requestConfirm: (req) => set({ confirm: req }),
  closeConfirm: () => set({ confirm: null }),
  pmHistoryOpen: false,
  setPmHistoryOpen: (v) => set({ pmHistoryOpen: v }),
  loHistoryOpen: false,
  setLoHistoryOpen: (v) => set({ loHistoryOpen: v }),
  mentorHistoryOpen: false,
  setMentorHistoryOpen: (v) => set({ mentorHistoryOpen: v }),
  protege: null,
  setProtege: (v) => set({ protege: v }),
  agendaEditorOpen: false,
  setAgendaEditorOpen: (v) => set({ agendaEditorOpen: v }),
  electionsOpen: false,
  setElectionsOpen: (v) => set({ electionsOpen: v }),
  seatHistoryOpen: false,
  setSeatHistoryOpen: (v) => set({ seatHistoryOpen: v }),
  settingsOpen: false,
  setSettingsOpen: (v) => set({ settingsOpen: v }),
  debug:
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('debug'),
}));
