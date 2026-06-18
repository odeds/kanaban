import { Board } from '@/components/board/Board';
import { useZustandAdapter } from './useZustandAdapter';

export function ZustandAdapter() {
  const adapter = useZustandAdapter();
  return <Board {...adapter} />;
}
