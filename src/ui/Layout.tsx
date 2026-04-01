import { useViewStore } from '../store/viewStore';
import FunctionBrowser from '../composer/FunctionBrowser';
import FunctionList from '../composer/FunctionList';
import FunctionBar from '../composer/FunctionBar';
import Canvas2D from '../canvas/Canvas2D';
import ParamSliders from '../composer/ParamSliders';
import AlgebraPanel from '../panels/AlgebraPanel';
import Toolbar from '../ui/Toolbar';

export default function Layout() {
  const sidebarOpen = useViewStore((s) => s.sidebarOpen);
  const algebraPanelOpen = useViewStore((s) => s.algebraPanelOpen);

  return (
    <div
      className="flex h-screen w-screen flex-col overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Top toolbar */}
      <Toolbar />

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR */}
        {sidebarOpen && (
          <aside
            className="flex w-80 shrink-0 flex-col overflow-y-auto"
            style={{
              background: 'var(--bg-secondary)',
              borderRight: '1px solid var(--border)',
            }}
          >
            <FunctionBrowser />
            <div
              className="mx-3 my-1 shrink-0"
              style={{ borderTop: '1px solid var(--border)' }}
            />
            <FunctionList />
            <div className="flex-1" />
            <FunctionBar />
          </aside>
        )}

        {/* CENTER */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <Canvas2D />
          <ParamSliders />
        </main>

        {/* RIGHT PANEL */}
        {algebraPanelOpen && (
          <aside
            className="w-[350px] shrink-0 overflow-y-auto"
            style={{
              background: 'var(--bg-secondary)',
              borderLeft: '1px solid var(--border)',
            }}
          >
            <AlgebraPanel />
          </aside>
        )}
      </div>
    </div>
  );
}
