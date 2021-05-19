import type { DependencyList } from 'react';
import { useCallback, useRef } from 'react';

/**
 * Throttled version of `useCallback`.
 *
 * @param callback The callback to throttle
 * @param wait The milliseconds of throttling
 * @param dependencies Dependencies of the throttled callback
 * @returns The throttled callback and `flush` function to reset the inner timer.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function useThrottledCallback<T extends (...args: never[]) => any>(
  callback: T, // useCallback
  wait: number,
  dependencies: DependencyList,
): [fn: (...args: Parameters<T>) => ReturnType<T> | null, reset: () => void] {
  const lastTimeCalled = useRef<number>(0);

  return [
    useCallback(
      (...args) => {
        if (Date.now() - lastTimeCalled.current < wait) {
          return null;
        }

        lastTimeCalled.current = Date.now();

        return callback(...args);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [...dependencies, wait],
    ),
    useCallback(() => {
      lastTimeCalled.current = 0;
    }, []),
  ];
}
