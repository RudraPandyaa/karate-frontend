<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Eye, CheckCircle2, Circle } from 'lucide-vue-next'
import { roleLabel, roleBadgeClass, formatPrintedAt } from '~/utils/badges'

const props = defineProps<{
  badges: any[]
  loading?: boolean
  /** Admin / organizer only — controls checkboxes + Mark Printed */
  canManage?: boolean
}>()

const emit = defineEmits<{
  (e: 'preview', badge: any): void
  (e: 'mark-printed', badgeIds: string[]): void
}>()

const selected = ref<Set<string>>(new Set())

watch(() => props.badges, () => {
  selected.value = new Set()
})

const allSelected = computed(() =>
  props.badges.length > 0 && props.badges.every(b => selected.value.has(b.id)),
)

function toggleAll() {
  if (allSelected.value) {
    selected.value = new Set()
  } else {
    selected.value = new Set(props.badges.map(b => b.id))
  }
}

function toggleOne(id: string) {
  const next = new Set(selected.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selected.value = next
}

function markSelectedPrinted() {
  if (selected.value.size === 0) return
  emit('mark-printed', [...selected.value])
  selected.value = new Set()
}
</script>

<template>
  <div class="bg-surface border border-line rounded-2xl overflow-hidden">
    <!-- Bulk action bar — staff only -->
    <div
      v-if="canManage && selected.size > 0"
      class="flex items-center justify-between border-b border-line bg-canvas/60 px-6 py-3"
    >
      <span class="text-sm text-muted">{{ selected.size }} selected</span>
      <button
        class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition"
        @click="markSelectedPrinted"
      >
        <CheckCircle2 class="h-4 w-4" />
        Mark Printed
      </button>
    </div>

    <div v-if="loading" class="py-16 text-center text-muted">Loading...</div>

    <div v-else-if="badges.length === 0" class="py-16 text-center text-muted">
      No badges found.
    </div>

    <table v-else class="w-full">
      <thead class="bg-canvas/60">
        <tr>
          <th v-if="canManage" class="w-10 px-6 py-4">
            <button @click="toggleAll">
              <CheckCircle2 v-if="allSelected" class="h-4 w-4 text-blue-500" />
              <Circle v-else class="h-4 w-4 text-muted" />
            </button>
          </th>
          <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">Badge No</th>
          <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">Role</th>
          <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">Name</th>
          <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">Dojo</th>
          <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">Coach</th>
          <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">Printed</th>
          <th class="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="badge in badges"
          :key="badge.id"
          class="border-t border-line hover:bg-surface-hover"
        >
          <td v-if="canManage" class="px-6 py-4">
            <button @click="toggleOne(badge.id)">
              <CheckCircle2 v-if="selected.has(badge.id)" class="h-4 w-4 text-blue-500" />
              <Circle v-else class="h-4 w-4 text-muted" />
            </button>
          </td>
          <td class="px-6 py-4 font-mono text-sm">{{ badge.badgeNumber }}</td>
          <td class="px-6 py-4">
            <span
              class="rounded-lg border px-2.5 py-1 text-xs font-medium"
              :class="roleBadgeClass(badge.role)"
            >
              {{ roleLabel(badge.role) }}
            </span>
          </td>
          <td class="px-6 py-4">{{ badge.name || '—' }}</td>
          <td class="px-6 py-4 text-sm text-muted">{{ badge.dojo || '—' }}</td>
          <td class="px-6 py-4 text-sm text-muted">{{ badge.coach || '—' }}</td>
          <td class="px-6 py-4">
            <span
              class="rounded-lg px-2.5 py-1 text-xs font-medium"
              :class="badge.printedAt
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-surface text-muted border border-line'"
              :title="badge.printedAt ? formatPrintedAt(badge.printedAt) : ''"
            >
              {{ badge.printedAt ? 'Printed' : 'Not Printed' }}
            </span>
          </td>
          <td class="px-6 py-4 text-right">
            <button
              class="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"
              @click="emit('preview', badge)"
            >
              <Eye class="h-4 w-4" />
              Preview
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>