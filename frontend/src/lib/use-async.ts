'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError, notifySessionExpired } from './api';

interface AsyncState<T> {
  data: T | undefined;
  error: unknown;
  loading: boolean;
}

/**
 * โหลดข้อมูลแบบ async พร้อม reload() · ได้ 401 จะแจ้ง AppShell ให้พากลับพอร์ทัล/re-SSO (auth-contract ข้อ 7)
 * deps ทำหน้าที่เหมือน dependency ของ useEffect
 */
export function useAsync<T>(factory: () => Promise<T>, deps: readonly unknown[]) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<AsyncState<T>>({ data: undefined, error: null, loading: true });

  useEffect(() => {
    let cancelled = false;
    factory().then(
      (data) => {
        if (!cancelled) setState({ data, error: null, loading: false });
      },
      (error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.code === 'UNAUTHORIZED') notifySessionExpired();
        setState((prev) => ({ data: prev.data, error, loading: false }));
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
}
