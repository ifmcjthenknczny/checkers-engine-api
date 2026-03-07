import { watch, type WatchSource } from 'vue'

export function useDebouncedWatch(
  source: WatchSource | WatchSource[],
  callback: () => void,
  delay: number,
) {
  let timeout: ReturnType<typeof setTimeout>

  watch(
    source,
    () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        callback()
      }, delay)
    },
    { deep: true },
  )
}
