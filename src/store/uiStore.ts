import { create } from 'zustand';

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
  debug:
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('debug'),
}));
