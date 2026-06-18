import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

// These are re-exported from store.ts to avoid circular imports at the type level.
// Import RootState and AppDispatch from store.ts directly in application code.
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType | Promise<ReturnType>,
  // Using unknown here breaks the cycle; store.ts will cast getState() as needed.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  unknown,
  UnknownAction
>;
