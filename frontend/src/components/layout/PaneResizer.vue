<template>
  <div
    class="h-2 sm:h-1.5 flex items-center justify-center cursor-row-resize group shrink-0 select-none touch-none border-y border-fc-border hover:border-fc-accent/40 transition-colors bg-fc-bg-secondary"
    @pointerdown="$emit('pointerdown', $event)"
  >
    <div class="w-10 h-0.5 rounded-full bg-fc-text-muted group-hover:bg-fc-accent transition-colors" />
  </div>
</template>
