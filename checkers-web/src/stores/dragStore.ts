import type { SquareContent } from '@/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type DragContext = 'board' | 'spawn'

export const useDragStore = defineStore('drag', () => {
  const draggedIndex = ref<number | null>(null)
  const dragContext = ref<DragContext | null>(null)
  const activePiece = ref<SquareContent | null>(null)

  const startDrag = (context: DragContext, piece: SquareContent, fromIndex?: number) => {
    draggedIndex.value = fromIndex ?? null
    activePiece.value = piece
    dragContext.value = context
  }
  const stopDrag = () => {
    draggedIndex.value = null
    activePiece.value = null
    dragContext.value = null
  }

  return { draggedIndex, startDrag, stopDrag, dragContext, activePiece }
})
