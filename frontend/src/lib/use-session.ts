'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ApiError, type Me } from './api';

export type SessionState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'forbidden'; message: string }
  | { status: 'error'; error: unknown }
  | { status: 'ready'; me: Me };

/** อ่านตัวตนจาก GET /api/v1/me (คุกกี้ HttpOnly ของ SSO) */
export function useSession() {
  const [state, setState] = useState<SessionState>({ status: 'loading' });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.get<Me>('/api/v1/me').then(
      (me) => !cancelled && setState({ status: 'ready', me }),
      (error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.code === 'UNAUTHORIZED') setState({ status: 'anonymous' });
        else if (error instanceof ApiError && error.code === 'FORBIDDEN') setState({ status: 'forbidden', message: error.message });
        else setState({ status: 'error', error });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { state, reload };
}
