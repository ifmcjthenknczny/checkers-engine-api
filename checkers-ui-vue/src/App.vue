<template>
  <main>
    <RouterView />
  </main>
</template>

<style lang="scss">
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
