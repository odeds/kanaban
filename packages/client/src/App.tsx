import { lazy, Suspense } from 'react';

const adapter = import.meta.env.VITE_STATE_ADAPTER;

const AdapterComponent =
  adapter === 'redux'
    ? lazy(() => import('@/adapters/redux/thunks/ThunksAdapter').then((m) => ({ default: m.ThunksAdapter })))
    : adapter === 'saga'
    ? lazy(() => import('@/adapters/redux/saga/SagaAdapter').then((m) => ({ default: m.SagaAdapter })))
    : lazy(() => import('@/adapters/zustand/ZustandAdapter').then((m) => ({ default: m.ZustandAdapter })));

function App() {
  return <Suspense fallback={null}><AdapterComponent /></Suspense>;
}

export default App;
