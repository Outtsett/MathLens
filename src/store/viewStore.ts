import { create } from 'zustand';

type ViewMode = '2d' | '3d' | 'split';
type GridType = 'cartesian' | 'polar' | 'spherical';
export type SidebarTab = 'browse' | 'compose' | 'sigma' | 'transform';
export type ActivePanel = null | 'history' | 'export' | 'guided';

interface ViewStore {
  mode: ViewMode;
  gridType: GridType;

  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;

  cameraPosition: [number, number, number];

  sidebarOpen: boolean;
  algebraPanelOpen: boolean;

  sidebarTab: SidebarTab;
  activePanel: ActivePanel;

  setMode: (mode: ViewMode) => void;
  setGridType: (type: GridType) => void;
  setViewport: (xMin: number, xMax: number, yMin: number, yMax: number) => void;
  resetViewport: () => void;
  toggleSidebar: () => void;
  toggleAlgebraPanel: () => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setActivePanel: (panel: ActivePanel) => void;
}

const DEFAULT_VIEWPORT = {
  xMin: -10,
  xMax: 10,
  yMin: -6,
  yMax: 6,
} as const;

export const useViewStore = create<ViewStore>((set) => ({
  mode: '2d',
  gridType: 'cartesian',

  ...DEFAULT_VIEWPORT,

  cameraPosition: [5, 5, 5],

  sidebarOpen: true,
  algebraPanelOpen: false,

  sidebarTab: 'browse',
  activePanel: null,

  setMode: (mode) => set({ mode }),
  setGridType: (gridType) => set({ gridType }),
  setViewport: (xMin, xMax, yMin, yMax) => set({ xMin, xMax, yMin, yMax }),
  resetViewport: () => set({ ...DEFAULT_VIEWPORT }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleAlgebraPanel: () =>
    set((state) => ({ algebraPanelOpen: !state.algebraPanelOpen })),
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setActivePanel: (panel) =>
    set((state) => ({ activePanel: state.activePanel === panel ? null : panel })),
}));
