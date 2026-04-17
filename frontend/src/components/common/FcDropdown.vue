<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

export interface DropdownOption {
  value: string
  label: string
  color?: string
  icon?: string
}

const props = withDefaults(defineProps<{
  modelValue: string
  options: DropdownOption[]
  searchable?: boolean
  variant?: 'default' | 'method'
  placeholder?: string
}>(), {
  searchable: false,
  variant: 'default',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)
const search = ref('')
const highlightedIndex = ref(0)
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const searchRef = ref<HTMLInputElement | null>(null)

// Reactive panel position
const panelStyle = ref<Record<string, string>>({})

const selectedOption = computed(() => props.options.find(o => o.value === props.modelValue))

const filtered = computed(() => {
  if (!search.value) return props.options
  const q = search.value.toLowerCase()
  return props.options.filter(o => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
})

function updatePosition() {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  panelStyle.value = {
    position: 'fixed',
    top: rect.bottom + 4 + 'px',
    left: rect.left + 'px',
    minWidth: rect.width + 'px',
    zIndex: '100',
  }
}

function toggle() {
  open.value = !open.value
  if (open.value) {
    search.value = ''
    highlightedIndex.value = Math.max(0, filtered.value.findIndex(o => o.value === props.modelValue))
    updatePosition()
    nextTick(() => searchRef.value?.focus())
  }
}

function select(opt: DropdownOption) {
  emit('update:modelValue', opt.value)
  open.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (!open.value) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      toggle()
    }
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    highlightedIndex.value = Math.min(highlightedIndex.value + 1, filtered.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (filtered.value[highlightedIndex.value]) select(filtered.value[highlightedIndex.value])
  } else if (e.key === 'Escape') {
    e.preventDefault()
    open.value = false
    triggerRef.value?.focus()
  }
}

function onClickOutside(e: MouseEvent) {
  const target = e.target as Node
  if (triggerRef.value?.contains(target)) return
  if (panelRef.value?.contains(target)) return
  open.value = false
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<template>
  <div class="relative" @keydown="onKeydown">
    <button
      ref="triggerRef"
      type="button"
      :class="[
        'flex items-center gap-2 text-sm transition-all duration-150 rounded-lg select-none',
        variant === 'method'
          ? 'px-3 py-2 font-mono font-semibold glass-input min-w-[100px]'
          : 'px-3 py-2 glass-input w-full',
        open ? 'border-fc-border-active ring-2 ring-fc-accent/20' : ''
      ]"
      @click="toggle"
    >
      <span
        v-if="variant === 'method' && selectedOption?.color"
        class="font-mono font-bold text-sm"
        :style="{ color: selectedOption.color }"
      >{{ selectedOption?.label || placeholder || 'Select' }}</span>
      <span v-else class="flex-1 text-left truncate text-fc-text-primary">
        {{ selectedOption?.label || placeholder || 'Select' }}
      </span>
      <svg class="w-4 h-4 text-fc-text-muted transition-transform" :class="{ 'rotate-180': open }" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
      </svg>
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        ref="panelRef"
        class="min-w-[160px] py-1 glass-panel-strong shadow-lg overflow-hidden rounded-lg"
        :style="panelStyle"
      >
        <div v-if="searchable" class="px-2 pb-1">
          <input
            ref="searchRef"
            v-model="search"
            type="text"
            class="w-full px-2 py-1.5 text-xs glass-input text-fc-text-primary placeholder:text-fc-text-muted"
            placeholder="Search..."
            @input="highlightedIndex = 0"
          />
        </div>
        <div class="max-h-[240px] overflow-y-auto">
          <button
            v-for="(opt, i) in filtered"
            :key="opt.value"
            type="button"
            :class="[
              'w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors duration-100',
              i === highlightedIndex ? 'bg-fc-bg-hover' : '',
              opt.value === modelValue ? 'text-fc-accent' : 'text-fc-text-primary hover:bg-fc-bg-hover',
            ]"
            @click="select(opt)"
            @mouseenter="highlightedIndex = i"
          >
            <span
              v-if="variant === 'method' && opt.color"
              class="font-mono font-bold text-xs min-w-[52px]"
              :style="{ color: opt.color }"
            >{{ opt.label }}</span>
            <span v-else>{{ opt.label }}</span>
          </button>
          <div v-if="filtered.length === 0" class="px-3 py-2 text-xs text-fc-text-muted">No results</div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
