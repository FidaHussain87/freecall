<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import FcDropdown from '@/components/common/FcDropdown.vue'
import type { DropdownOption } from '@/components/common/FcDropdown.vue'

const { currentTheme, setTheme, themes } = useTheme()

const options: DropdownOption[] = themes.map(t => ({
  value: t.value,
  label: t.label,
}))
</script>

<template>
  <FcDropdown
    :model-value="currentTheme"
    :options="options"
    @update:model-value="setTheme($event as any)"
  />
</template>
