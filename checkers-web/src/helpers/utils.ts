export function range(size: number | string, startAt = 0) {
  return [...Array(size).keys()].map((i) => i + startAt)
}

export function rangeChar(size: number, startAt = 'a') {
  return String.fromCharCode(...range(size, startAt.charCodeAt(0))).split('')
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const chunkArray = <T>(array: T[], size: number) => {
  const chunked = []
  for (let i = 0; i < array.length; i += size) {
    chunked.push(array.slice(i, i + size))
  }
  return chunked
}

export const chooseRandomly = <T>(array: T[]) => {
  return array[Math.floor(Math.random() * array.length)]
}