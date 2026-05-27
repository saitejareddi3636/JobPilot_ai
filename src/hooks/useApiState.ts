import { useEffect, useRef, useState } from 'react';

export function useApiState<T>(loader: () => Promise<T>, deps: ReadonlyArray<unknown> = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const loaderRef = useRef(loader);

  loaderRef.current = loader;

  useEffect(() => {
    let active = true;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const next = await loaderRef.current();
        if (active) {
          setData(next);
        }
      } catch (loaderError) {
        if (active) {
          setError(loaderError instanceof Error ? loaderError.message : 'Request failed');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void run();

    return () => {
      active = false;
    };
  }, [refreshIndex, ...deps]);

  return {
    data,
    loading,
    error,
    refetch: () => setRefreshIndex((value) => value + 1),
  };
}
