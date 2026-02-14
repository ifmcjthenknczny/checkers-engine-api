import { defineStore } from 'pinia'
import { ref } from 'vue'

type DragContext = 'board' | 'spawn'

export const useDragStore = defineStore('drag', () => {
  const draggedIndex = ref<number | null>(null)
  const dragContext = ref<DragContext | null>(null)

  const startDrag = (index: number, context: DragContext) => {
    draggedIndex.value = index
    dragContext.value = context
  }
  const stopDrag = () => {
    draggedIndex.value = null
    dragContext.value = null
  }

  return { draggedIndex, startDrag, stopDrag, dragContext }
})
