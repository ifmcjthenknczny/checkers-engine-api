<template>
  <main>
    <RouterView />
  </main>
</template>

<style lang="scss">
// Współdzielone style planszy (BoardComponent i PlayPage)
.board {
  display: grid;
  grid-auto-flow: row;
  width: $boardSizeHorizontal;
  height: $boardSizeHorizontal;
}

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

.grid__square--name {
  text-align: center;
  font-weight: 700;
  font-size: 1rem;
  font-family: $secondaryFont;
  user-select: none;

  &-col {
    text-transform: uppercase;
  }

  &-row {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

@media (max-width: 700px) {
  .board {
    width: $boardSizeVertical;
    height: $boardSizeVertical;
  }
}

html {
  font-family: $globalFont;
  font-size: clamp(10px, $nameSquareSizeVertical, 20px);
}

body {
  display: flex;
  flex-flow: column;
  background-image: url('/src/assets/what-the-hex.png');
  min-height: 100vh;
  overflow: hidden;
}

main {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1;
  width: 100%;
  min-height: 0;
}

@media (min-width: 700px) {
  html {
    font-size: 20px;
  }
}
</style>
