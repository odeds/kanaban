import type { ColumnId } from '@kanaban/shared';
import type { CardFormValues } from '@/components/card-form/CardForm';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export const api = {
  createCard(columnId: ColumnId, values: CardFormValues): Promise<Response> {
    return fetch(`${API_BASE}/api/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...values, columnId }),
    });
  },

  updateCard(cardId: string, values: CardFormValues): Promise<Response> {
    return fetch(`${API_BASE}/api/cards/${cardId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
  },

  deleteCard(cardId: string): Promise<Response> {
    return fetch(`${API_BASE}/api/cards/${cardId}`, { method: 'DELETE' });
  },

  moveCard(cardId: string, columnId: ColumnId, order: number): Promise<Response> {
    return fetch(`${API_BASE}/api/cards/${cardId}/move`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ columnId, order }),
    });
  },
};
