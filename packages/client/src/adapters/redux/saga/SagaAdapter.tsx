import { useEffect } from 'react';
import { Provider } from 'react-redux';
import type { Task } from 'redux-saga';
import { store, sagaMiddleware } from './store';
import { rootSaga } from './sagas';
import { Board } from '@/components/board/Board';
import { useSagaAdapter } from './useSagaAdapter';

function SagaBoard() {
  const adapter = useSagaAdapter();

  useEffect(() => {
    const task: Task = sagaMiddleware.run(rootSaga);
    return () => task.cancel();
  }, []);

  return <Board {...adapter} />;
}

export function SagaAdapter() {
  return (
    <Provider store={store}>
      <SagaBoard />
    </Provider>
  );
}
