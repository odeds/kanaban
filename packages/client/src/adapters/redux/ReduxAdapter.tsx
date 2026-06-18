import { Provider } from 'react-redux';
import { store } from './store';
import { Board } from '@/components/board/Board';
import { useReduxAdapter } from './useReduxAdapter';

function ReduxBoard() {
  const adapter = useReduxAdapter();
  return <Board {...adapter} />;
}

export function ReduxAdapter() {
  return (
    <Provider store={store}>
      <ReduxBoard />
    </Provider>
  );
}
