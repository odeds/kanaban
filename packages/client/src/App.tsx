import { Board } from '@/components/board/Board';
import { useZustandAdapter } from '@/adapters/zustand/useZustandAdapter';

// To add a second adapter: import it here and switch on import.meta.env.VITE_STATE_ADAPTER.
function App() {
  const adapter = useZustandAdapter();
  return <Board {...adapter} />;
}

export default App;
