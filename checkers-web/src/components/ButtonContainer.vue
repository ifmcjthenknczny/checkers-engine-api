<template>
    <section :class="`button-container button-container--${type}`">
        <slot />
    </section>
</template>

<script setup lang="ts">
defineProps<{
    type: 'question' | 'game'
}>()
</script>

<style lang="scss" scoped>
  .button-container {
    display: flex;
    flex-flow: row;

    &--question {
      font-family: $secondaryFont;
      justify-content: space-between;
    }

    &--game {
      width: $boardSizeHorizontal;
      justify-content: space-around;
    }
  }

  @media (max-width: $breakpoint) {
    .button-container--game {
      width: $boardSizeVertical;
    }
  }
</style>