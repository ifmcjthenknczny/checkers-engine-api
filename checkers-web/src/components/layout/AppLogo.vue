<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Cookie&family=Fleur+De+Leah&display=swap');

.game-title {
    font-family: 'Fleur De Leah', cursive;
    align-self: center;
    font-size: 3.5rem;
}

.logo-section {
    display: flex;
    flex-flow: column;
    justify-content: center;
    width: auto;
    flex-shrink: 0;
}

.logo-section__link {
    text-decoration: none;
    color: inherit;
}
</style>

<template>
    <NuxtLink to="/" class="logo-section__link">
        <div class="logo-section">
            <section class="game-title">
                Warcaby
            </section>
        </div>
    </NuxtLink>
</template>
