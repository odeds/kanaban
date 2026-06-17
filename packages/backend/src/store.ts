import { Board, Card, ColumnId, COLUMN_IDS, COLUMN_TITLES } from '@kanaban/shared';

function buildInitialBoard(): Board {
  const columns = {} as Board['columns'];
  for (const id of COLUMN_IDS) {
    columns[id] = { id, title: COLUMN_TITLES[id], cardIds: [] };
  }
  return { columns, cards: {} };
}

export class BoardStore {
  private state: Board = buildInitialBoard();

  reset(): void {
    this.state = buildInitialBoard();
  }

  getBoard(): Board {
    return structuredClone(this.state);
  }

  createCard(params: {
    title: string;
    description: string;
    assignee: string;
    columnId: ColumnId;
  }): Card {
    const now = new Date().toISOString();
    const card: Card = {
      id: crypto.randomUUID(),
      ...params,
      order: this.state.columns[params.columnId].cardIds.length,
      createdAt: now,
      updatedAt: now,
    };
    this.state.cards[card.id] = card;
    this.state.columns[params.columnId].cardIds.push(card.id);
    return structuredClone(card);
  }

  updateCard(
    cardId: string,
    updates: { title?: string; description?: string; assignee?: string },
  ): Card | null {
    const card = this.state.cards[cardId];
    if (!card) return null;
    Object.assign(card, { ...updates, updatedAt: new Date().toISOString() });
    return structuredClone(card);
  }

  deleteCard(cardId: string): boolean {
    const card = this.state.cards[cardId];
    if (!card) return false;
    const col = this.state.columns[card.columnId];
    col.cardIds = col.cardIds.filter((id) => id !== cardId);
    delete this.state.cards[cardId];
    // recompute order for remaining cards in that column
    col.cardIds.forEach((id, idx) => {
      this.state.cards[id].order = idx;
    });
    return true;
  }

  moveCard(cardId: string, columnId: ColumnId, order: number): Card | null {
    const card = this.state.cards[cardId];
    if (!card) return null;

    const fromCol = this.state.columns[card.columnId];
    fromCol.cardIds = fromCol.cardIds.filter((id) => id !== cardId);

    const toCol = this.state.columns[columnId];
    const clampedOrder = Math.min(order, toCol.cardIds.length);
    toCol.cardIds.splice(clampedOrder, 0, cardId);

    card.columnId = columnId;
    card.updatedAt = new Date().toISOString();

    // recompute order for all columns touched
    for (const col of Object.values(this.state.columns)) {
      col.cardIds.forEach((id, idx) => {
        this.state.cards[id].order = idx;
      });
    }

    return structuredClone(card);
  }
}

export const store = new BoardStore();
