import { useEffect, useRef } from 'react'

export function usePolling(
  callback: () => void | Promise<void>,
  interval: number,
  deps: React.DependencyList = []
) {
  const savedCallback = useRef(callback)
  const intervalId = useRef<NodeJS.Timeout>()

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    const tick = () => {
      savedCallback.current()
    }

    // Run immediately
    tick()

    intervalId.current = setInterval(tick, interval)

    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
