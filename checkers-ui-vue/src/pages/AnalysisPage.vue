<script setup lang="ts">
import Board from '@/components/BoardComponent.vue'
import EvaluationContainer from '@/components/EvaluationContainer.vue'
import PieceToolbox from '@/components/PieceToolbox.vue'
</script>

<template>
  <div class="analysis-page">
    <Board />
    <aside class="analysis-page__side">
      <EvaluationContainer />
      <PieceToolbox />
    </aside>
  </div>
</template>

<style lang="scss" scoped>
.analysis-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 1rem;
  min-height: 100%;
  width: 100%;
  box-sizing: border-box;
}

.analysis-page__side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
}

@media (min-width: 900px) {
  .analysis-page {
    flex-direction: row;
    gap: 2rem;
    padding: 1.5rem;
  }

  .analysis-page__side {
    flex-direction: row;
    align-items: center;
    gap: 2rem;
  }
}
</style>
