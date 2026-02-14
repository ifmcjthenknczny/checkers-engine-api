<script setup lang="ts">
import CheckersBoard from './components/CheckersBoard.vue';

</script>

<template>
  <CheckersBoard />
</template>

<style lang="scss">
html {
    font-family: $globalFont;
    font-size: 20px;
}

body {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-flow: column;
    background-image: url("/src/assets/what-the-hex.png");
    min-height: 100vh;
    overflow: hidden;
}

@media (max-width: 700px) {
    html {
        font-size: clamp(10px, $nameSquareSizeVertical, 20px);
    }
}
</style>
