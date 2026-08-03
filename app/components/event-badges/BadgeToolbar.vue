<script setup lang="ts">
import { Plus, FileSpreadsheet, FileText, Loader2 } from 'lucide-vue-next'
import { ROLES, roleLabel } from '~/utils/badges'

const props = defineProps<{
  activeRole: string
  generating?: boolean
  exportingPdf?: boolean
  exportingExcel?: boolean
  canGenerate?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:activeRole', role: string): void
  (e: 'generate'): void
  (e: 'export-pdf'): void
  (e: 'export-excel'): void
}>()
</script>

<template>
  <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <!-- Role filter pills -->
    <div class="flex flex-wrap items-center gap-2">
      <button
        class="rounded-xl px-4 py-2 text-sm font-medium transition"
        :class="!activeRole
          ? 'bg-blue-600 text-white'
          : 'bg-surface text-muted hover:bg-surface-hover'"
        @click="emit('update:activeRole', '')"
      >
        All
      </button>
      <button
        v-for="role in ROLES"
        :key="role"
        class="rounded-xl px-4 py-2 text-sm font-medium transition"
        :class="activeRole === role
          ? 'bg-blue-600 text-white'
          : 'bg-surface text-muted hover:bg-surface-hover'"
        @click="emit('update:activeRole', role)"
      >
        {{ roleLabel(role) }}
      </button>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2">
      <button
        :disabled="exportingExcel"
        class="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm hover:bg-surface transition disabled:opacity-60"
        @click="emit('export-excel')"
      >
        <Loader2 v-if="exportingExcel" class="h-4 w-4 animate-spin" />
        <FileSpreadsheet v-else class="h-4 w-4" />
        Excel
      </button>
      <button
        :disabled="exportingPdf"
        class="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm hover:bg-surface transition disabled:opacity-60"
        @click="emit('export-pdf')"
      >
        <Loader2 v-if="exportingPdf" class="h-4 w-4 animate-spin" />
        <FileText v-else class="h-4 w-4" />
        PDF
      </button>
      <button
        v-if="canGenerate"
        :disabled="generating"
        class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 transition disabled:opacity-60"
        @click="emit('generate')"
      >
        <Loader2 v-if="generating" class="h-4 w-4 animate-spin" />
        <Plus v-else class="h-4 w-4" />
        Generate Badges
      </button>
    </div>
  </div>
</template>