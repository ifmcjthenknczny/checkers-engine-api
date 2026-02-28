<script setup lang="ts">
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

