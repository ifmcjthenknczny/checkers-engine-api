<script setup lang="ts">
// TODO: rename this component, it is not a wrapper
import { computed, provide } from 'vue'

interface Props {
  color: 'black' | 'white'
}

const props = defineProps<Props>()

provide(
  'tileColor',
  computed(() => props.color)
)
</script>
<template>
  <div :class="['grid__square', color === 'white' ? 'grid__square--white' : 'grid__square--black']">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.grid__square {
  aspect-ratio: 1;
  border: 0.8px solid $borderColor;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: center;

  &--black {
    background-color: $blackSquareColor;
  }

  &--white {
    background-color: $whiteSquareColor;
  }
}
</style>
