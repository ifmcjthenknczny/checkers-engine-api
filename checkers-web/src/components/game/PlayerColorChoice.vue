<script lang="ts" setup>
import { useGameStore } from '@/stores/gameStore'
import Button from '@/components/ui/Button.vue'
import ButtonGroup from '@/components/ui/ButtonGroup.vue'

const gameStore = useGameStore()

function chooseColor(color: 'white' | 'black') {
  gameStore.chooseColor(color)
}
</script>

<template>
<div class="container">
  <h2 class="question">choose your color</h2>
  <ButtonGroup type="question">
    <Button
      color-variant="white"
      button-type="color"
      @click="chooseColor('white')">
        white
    </Button>
    <Button
      color-variant="black"
      button-type="color"
      @click="chooseColor('black')">
        black
    </Button>
  </ButtonGroup>
</div>
</template>

<style lang="scss" scoped>
@use 'sass:color';
    .question {
    text-transform: uppercase;
    font-weight: 650;
    font-size: 3rem;
    align-self: center;
    text-align: center;
    font-family: $secondaryFont;
    transition: $colorTransitionTime;
    color: color.mix(darkgray, black, 20%);
  }

  @media (min-width: $breakpoint) {
    .question {
      font-size: 2.8rem;
    }
  }
</style>
