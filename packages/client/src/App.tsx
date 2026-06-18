import { ZustandAdapter } from '@/adapters/zustand/ZustandAdapter';
import { ReduxAdapter } from '@/adapters/redux/ReduxAdapter';

function App() {
  return import.meta.env.VITE_STATE_ADAPTER === 'redux' ? <ReduxAdapter /> : <ZustandAdapter />;
}

export default App;
