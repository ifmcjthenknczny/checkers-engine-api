<script lang="ts" setup>
defineProps<{
  colorVariant?: 'white' | 'black'
  buttonType?: 'color' | 'game'
}>()

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    type="button"
    :class="[
      'button',
      colorVariant && `button--${colorVariant}`,
      buttonType && `button--${buttonType}`,
    ].filter(Boolean)"
    @click="emit('click')"
  >
    <slot />
  </button>
</template>
<style lang="scss" scoped>
@use 'sass:color';
@import url('https://fonts.googleapis.com/css2?family=Source+Sans+Pro:ital,wght@0,400;0,550;0,650;0,700;0,900;1,400&display=swap');

.button {
  font-family: 'Source Sans Pro', sans-serif;
  font-size: 1rem;
  transition: 0.5s;
  height: 50px;
  width: 150px;
  background-color: color.mix(white, lightgrey);
  text-transform: uppercase;
  font-weight: 550;
  border: 1.5px solid black;

  &--game {
    margin-top: calc($minipieceSize / 2);
    border-radius: 12px;
    font-weight: 650;
    font-size: 22px;

    &:hover,
    &:active {
      background-color: $clickedColor;
      color: white;
    }
  }

  &--color {
    font-size: 1.6rem;
    margin-top: 60px;
    width: 200px;
    height: 75px;
  }

  &--white:hover,
  &--white:active {
    background-color: white;
    font-weight: 900;
    box-shadow: 0 0 40px 9px #808080;
    font-size: 1.8rem;
  }

  &--black:hover,
  &--black:active {
    background-color: black;
    font-weight: 900;
    color: white;
    box-shadow: 0 0 40px 9px #606060;
    font-size: 1.8rem;
  }
}

@media (max-width: $breakpoint) {
  .button {
    &--color {
      width: 30vw;
      height: 45px;
    }

    &--white {
      background-color: white;
      font-weight: 900;
      font-size: 1.8rem;
    }

    &--black {
      background-color: black;
      font-weight: 900;
      color: white;
      font-size: 1.8rem;
    }

    &--game {
      width: 100px;
      height: 40px;
      font-size: 16px;
      border-radius: 8px;
      color: black;
    }

    &--flip {
      font-size: 12px;
    }
  }
}
</style>