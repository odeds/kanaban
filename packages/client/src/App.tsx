import { Board } from '@/components/board/Board';

// Temporary stub — will be replaced by real state adapters in later steps.
function App() {
  return (
    <Board
      cards={{}}
      columnCardIds={{ todo: [], 'in-progress': [], done: [] }}
      userIds={[]}
      onCreateCard={() => {}}
      onEditCard={() => {}}
      onDeleteCard={() => {}}
      onMoveCard={() => {}}
    />
  );
}

export default App;
