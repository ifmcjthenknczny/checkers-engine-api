<script lang="ts" setup>
defineProps<{
  colorVariant?: 'white' | 'black'
  buttonType?: 'color' | 'game'
  sizeVariant?: 'small'
  selected?: boolean
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
      sizeVariant && `button--${sizeVariant}`,
      selected && 'button--selected',
    ].filter(Boolean)"
    @click="emit('click')"
  >
    <slot />
  </button>
</template>
<style lang="scss" scoped>
// TODO: Use mobile first approach
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
    width: 30vw;
    height: 45px;

    &.button--small {
      width: 42vw;
      height: 46px;
      font-size: 1rem;
    }
  }

  &--white {
    &:hover,
    &:active {
      background-color: white;
      font-weight: 900;
      box-shadow: 0 0 40px 9px #808080;
      font-size: 1.8rem;
    }

    &.button--selected {
      background-color: white;
      font-weight: 900;
      font-size: 1.8rem;
      box-shadow: 0 0 28px 6px #808080;
    }
  }

  &--black {
    &:hover,
    &:active {
      background-color: black;
      font-weight: 900;
      color: white;
      box-shadow: 0 0 40px 9px #606060;
      font-size: 1.8rem;
    }

    &.button--selected {
      background-color: black;
      font-weight: 900;
      font-size: 1.8rem;
      color: white;
      box-shadow: 0 0 28px 6px #606060;
    }
  }
}

@media (min-width: $breakpoint) {
  .button {
    &--color {
      width: 200px;
      height: 75px;

      &.button--small {
        font-size: 1.35rem;
        width: 135px;
        height: 52px;
      }
    }
  }
}
    
@media (max-width: $breakpoint) {
  .button {
    &--white {
      background-color: white;
      font-weight: 900;
      font-size: 1.8rem;

      &.button--small {
        font-size: 1rem;
      }
    }

    &--black {
      background-color: black;
      font-weight: 900;
      color: white;
      font-size: 1.8rem;

      &.button--small {
        font-size: 1rem;
      }
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
