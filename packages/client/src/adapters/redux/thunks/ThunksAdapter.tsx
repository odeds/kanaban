import { Provider } from 'react-redux';
import { store } from './store';
import { Board } from '@/components/board/Board';
import { useThunksAdapter } from './useThunksAdapter';

function ThunksBoard() {
  const adapter = useThunksAdapter();
  return <Board {...adapter} />;
}

export function ThunksAdapter() {
  return (
    <Provider store={store}>
      <ThunksBoard />
    </Provider>
  );
}
