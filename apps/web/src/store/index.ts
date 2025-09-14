import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type User = {
  id: string;
  email: string;
  role: 'admin' | 'teacher';
  firstName: string;
  lastName: string;
} | null;

type StoreState = {
  user: User;
  setUser: (user: User) => void;
  clearUser: () => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
};

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'academic-management-store',
      partialize: (state) => ({ user: state.user }),
    }
  )
);