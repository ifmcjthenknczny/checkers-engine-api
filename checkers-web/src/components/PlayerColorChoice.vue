<script lang="ts" setup>
import { useGameStore } from '@/stores/gameStore'
import ButtonComponent from './ButtonComponent.vue';
import ButtonContainer from './ButtonContainer.vue';

const gameStore = useGameStore()

function chooseColor(color: 'white' | 'black') {
  gameStore.chooseColor(color)
}
</script>

<template>
<div class="container">
  <h2 class="question">choose your color</h2>
  <ButtonContainer type="question">
    <ButtonComponent
      color-variant="white"
      button-type="color"
      @click="chooseColor('white')">
        white
    </ButtonComponent>
    <ButtonComponent
      color-variant="black"
      button-type="color"
      @click="chooseColor('black')">
        black
    </ButtonComponent>
  </ButtonContainer>
</div>
</template>

<style lang="scss" scoped>
@use 'sass:color';
    .question {
    text-transform: uppercase;
    font-weight: 650;
    font-size: 2.8rem;
    align-self: center;
    text-align: center;
    font-family: $secondaryFont;
    transition: $colorTransitionTime;
    color: color.mix(darkgray, black, 20%);

    // &--hover {
    //     &-white {
    //         color: white;
    //         -webkit-text-stroke: 1.5px black;
    //     }

    //     &-black {
    //         color: black;
    //         -webkit-text-stroke: 1.5px black;
    //     }
    // }
  }

  @media (max-width: $breakpoint) {
    .question {
      font-size: 3rem;
    }
  }
</style>