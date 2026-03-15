<template>
    <div class="legal-move" />
</template>
<style lang="scss" scoped>
@use 'sass:color';

.legal-move {
    width: calc($pieceSize / 2);
    height: calc($pieceSize / 2);
    border-radius: 50%;
    background-color: color.mix(aqua, violet);
    border: 1.2px solid black;
}

@media (min-width: $breakpoint) {
    .legal-move {
        border-width: 1.5px;
    }
}
</style>
