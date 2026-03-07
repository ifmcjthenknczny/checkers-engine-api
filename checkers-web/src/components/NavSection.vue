<script setup lang="ts">
const navItems = [
  { name: 'play', path: '/play', label: 'Play' },
  { name: 'analysis', path: '/analysis', label: 'Analyse' },
] as const
</script>

<template>
  <nav class="nav-section" aria-label="Main navigation">
    <NuxtLink
      v-for="item in navItems"
      :key="item.name"
      :to="item.path"
      class="nav-section__link"
      active-class="nav-section__link--active"
      exact-active-class="nav-section__link--exact"
    >
      {{ item.label }}
    </NuxtLink>
  </nav>
</template>

<style lang="scss" scoped>
.nav-section {
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-end;
    align-items: center;
    gap: 1rem 1.5rem;
    width: auto;
    font-family: $secondaryFont;
    font-size: 1rem;
}

@media (min-width: $breakpoint) {
    .nav-section {
        justify-content: flex-start;
    }
}

.nav-section__link {
    padding: 0.35rem 0.75rem;
    color: inherit;
    text-decoration: none;
    border-radius: 4px;
    transition: background-color $colorTransitionTime, color $colorTransitionTime;

    &:hover {
        background-color: rgba(0, 0, 0, 0.06);
    }

    &--active {
        font-weight: 600;
    }

    &--exact {
        background-color: rgba(0, 0, 0, 0.08);
        text-decoration: underline;
    }
}
</style>
