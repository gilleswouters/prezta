import { create } from 'zustand';

interface UIStore {
    isChatOpen: boolean;
    openChat: () => void;
    closeChat: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
    isChatOpen: false,
    openChat: () => set({ isChatOpen: true }),
    closeChat: () => set({ isChatOpen: false }),
}));
