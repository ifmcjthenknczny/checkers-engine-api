<script setup lang="ts">
import Board from '@/components/BoardComponent.vue'
import EvaluationContainer from '@/components/EvaluationContainer.vue'
import PieceToolbox from '@/components/PieceToolbox.vue'
</script>

<template>
  <div class="analysis-page">
    <div class="analysis-page__board-col">
      <Board context="analysis" />
    </div>
    <aside class="analysis-page__side">
      <div class="analysis-page__analysis-col">
        <EvaluationContainer />
      </div>
      <div class="analysis-page__toolbox-col">
        <PieceToolbox />
      </div>
    </aside>
  </div>
</template>

<style lang="scss" scoped>
.analysis-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: inherit;
  width: 100%;
  box-sizing: border-box;
}

.analysis-page__board-col {
  display: flex;
  flex-shrink: 0;
  justify-content: center;
}

.analysis-page__side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
}

@media (min-width: $breakpoint) {
  .analysis-page {
    flex: 1;
    flex-direction: row;
    align-items: flex-start;
  }

  .analysis-page__board-col {
    flex: 1;
    justify-content: center;
    min-width: 0;
  }

  .analysis-page__side {
    flex-shrink: 0;
    flex-direction: row;
    align-items: flex-start;
    gap: 1.5rem;
    width: auto;
  }

  .analysis-page__analysis-col {
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    align-items: stretch;
  }

  .analysis-page__toolbox-col {
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
