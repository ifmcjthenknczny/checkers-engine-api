export function range(size: number | string, startAt = 0) {
  return [...Array(size).keys()].map((i) => i + startAt)
}

export function rangeChar(size: number, startAt = 'a') {
  return String.fromCharCode(...range(size, startAt.charCodeAt(0))).split('')
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function getSquareColAndRow(square: Element) {
  const [col, ...row] = square.id
  const rowNumber = +row.join('')
  return [col, rowNumber]
}

export function createDiagonalIterable(startIndex: number, targetIndex: number) {
  return startIndex < targetIndex
    ? range(targetIndex - startIndex, startIndex + 1)
    : range(startIndex - targetIndex, targetIndex).reverse()
}

export const chunkArray = <T>(array: T[], size: number) => {
  const chunked = []
  for (let i = 0; i < array.length; i += size) {
    chunked.push(array.slice(i, i + size))
  }
  return chunked
}
