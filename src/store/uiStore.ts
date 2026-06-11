import { create } from 'zustand';

export type TabId = 'play' | 'history' | 'cabinet' | 'parliament' | 'profile';

interface UiState {
  activeTab: TabId;
  setTab: (tab: TabId) => void;
  debug: boolean;
}

export const useUiStore = create<UiState>((set) => ({
  activeTab: 'play',
  setTab: (tab) => set({ activeTab: tab }),
  debug:
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('debug'),
}));
