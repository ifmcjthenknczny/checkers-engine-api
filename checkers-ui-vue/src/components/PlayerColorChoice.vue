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