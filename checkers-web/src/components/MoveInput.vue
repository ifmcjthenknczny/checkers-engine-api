<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '@/stores/gameStore'

const gameStore = useGameStore()
const { currentPlayer } = storeToRefs(gameStore)


const label = computed(() => (currentPlayer.value === 'white' ? 'White to move' : 'Black to move'))
</script>

<template>
    <div class="game-info game-info__who-to-move">
      <button
        class="toggle-button"
        :class="{ 'is-black': currentPlayer === 'black' }"
        @click="gameStore.switchPlayer"
        type="button"
      >
        <span :class="currentPlayer">{{ label }}</span>
        <div class="toggle-track">
          <div class="toggle-thumb"></div>
        </div>
      </button>
    </div>
</template>

<style lang="scss" scoped>
.game-info {
  min-width: 160px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  text-transform: uppercase;
  font-weight: 550;
  width: 100%;
  font-size: 1rem;
  align-items: center;

  &__who-to-move {
    display: flex;
    align-items: center;
    gap: 12px;

    span {
      font-weight: 700;
      color: black;
      transition: color 0.3s ease, text-shadow 0.3s ease;
      display: inline-block;
      min-width: 5.5em;
      text-align: left;

      &.white {
        color: white;
        text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
        -webkit-text-stroke: 0.6px black;
      }
    }
  }
}

.toggle-button {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0;
  outline: none;

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  .toggle-track {
    width: 44px;
    height: 22px;
    background-color: #eee;
    border: 2px solid black;
    border-radius: 11px;
    position: relative;
    transition: background-color 0.3s ease;
    margin-left: 8px;
  }

  .toggle-thumb {
    width: 14px;
    height: 14px;
    background-color: white;
    border: 1px solid black;
    border-radius: 50%;
    position: absolute;
    top: 2px;
    left: 2px;
    transition:
      transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      background-color 0.3s;
  }

  &.is-black {
    .toggle-track {
      background-color: #333;
    }
    .toggle-thumb {
      transform: translateX(22px);
      background-color: black;
      border-color: white;
    }
  }
}

@media (max-width: $breakpoint) {
  .game-info {
    font-size: 1rem;
  }
}
</style>
