<script setup lang="ts">
import AppLogo from '@/components/layout/AppLogo.vue'
import MainNav from '@/components/layout/MainNav.vue'
</script>

<template>
  <div class="page-layout">
    <header class="page-layout__header">
      <AppLogo />
      <MainNav />
    </header>
    <main class="page-layout__main">
      <div class="page-layout__content">
        <slot />
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.page-layout {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex: 1;
  width: 100%;
  min-height: 0;
}

.page-layout__header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.5rem;
  flex-shrink: 0;
  width: 100%;
  box-sizing: border-box;
}

.page-layout__main {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  flex: 1;
  width: 100%;
  min-height: 0;
  overflow: auto;
}

.page-layout__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 1.5rem;
  padding: 1.5rem;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

@media (min-width: $breakpoint) {
  .page-layout {
    flex-direction: row;
    align-items: flex-start;
  }

  .page-layout__header {
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    width: auto;
    min-width: auto;
    padding: 1.5rem;
  }

  .page-layout__main {
    flex: 1;
    align-items: stretch;
    justify-content: flex-start;
  }

  .page-layout__content {
    flex-direction: row;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 2rem;
    flex: 1;
  }
}
</style>
