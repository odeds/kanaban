import { COLUMN_IDS, COLUMN_TITLES } from '@kanaban/shared';

function App() {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="mb-8 text-2xl font-bold tracking-tight">Kanban Board</h1>
      <div className="flex gap-4">
        {COLUMN_IDS.map((id) => (
          <div
            key={id}
            className="flex-1 rounded-lg border bg-card p-4 shadow-sm"
          >
            <h2 className="mb-4 font-semibold text-card-foreground">
              {COLUMN_TITLES[id]}
            </h2>
            <p className="text-sm text-muted-foreground">No cards yet.</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
