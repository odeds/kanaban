import { useEffect } from 'react';

// Transport is initialised once on mount and torn down on unmount.
// The initFn is always a module-level stable reference so no deps are needed.
export function useTransportEffect(initFn: () => () => void): void {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => initFn(), []);
}
