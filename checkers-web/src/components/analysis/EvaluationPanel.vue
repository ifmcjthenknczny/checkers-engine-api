<script setup lang="ts">
import EngineEval from './EngineEval.vue'
import MoveInput from './MoveInput.vue'
</script>

<template>
  <div class="eval-block">
    <MoveInput />
    <EngineEval />
  </div>
</template>

<style lang="scss" scoped>
.eval-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: 280px;
  min-width: 0;
}
</style>
