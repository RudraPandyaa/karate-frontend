<script setup lang="ts">
import { computed } from 'vue'
import type { Coach } from '~/composables/useCoaches'

const props = defineProps<{
  coaches: Coach[]
  loading?: boolean
  search?: string
}>()

const emit = defineEmits<{
  (e: 'view', coach: Coach): void
  (e: 'edit', coach: Coach): void
  (e: 'delete', coach: Coach): void
}>()

function getDisplayName(coach: Coach) {
  return [coach.firstName, coach.lastName].filter(Boolean).join(' ') || '—'
}

const filtered = computed(() => {
  const q = (props.search || '').trim().toLowerCase()
  if (!q) return props.coaches

  return props.coaches.filter((c) => {
    const name = getDisplayName(c).toLowerCase()
    return (
      name.includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.dojo?.name?.toLowerCase().includes(q)
    )
  })
})
</script>

<template>
  <div class="bg-surface border border-line rounded-2xl overflow-hidden">
    <div v-if="loading" class="py-16 text-center text-muted">
      Loading coaches...
    </div>

    <div v-else-if="filtered.length === 0" class="py-16 text-center text-muted">
      No coaches found.
    </div>

    <table v-else class="w-full">
      <thead class="bg-canvas/60">
        <tr>
          <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">Coach</th>
          <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">Contact</th>
          <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">Dojo</th>
          <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">Athletes</th>
          <th class="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="coach in filtered"
          :key="coach.id"
          class="border-t border-line hover:bg-surface-hover transition"
        >
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl overflow-hidden bg-canvas border border-line shrink-0 flex items-center justify-center text-xs font-semibold text-muted">
                {{ getDisplayName(coach).charAt(0).toUpperCase() }}
              </div>
              <p class="font-medium text-foreground truncate">{{ getDisplayName(coach) }}</p>
            </div>
          </td>

          <td class="px-6 py-4 text-sm text-muted">
            <p v-if="coach.email">{{ coach.email }}</p>
            <p v-if="coach.phone">{{ coach.phone }}</p>
            <span v-if="!coach.email && !coach.phone">—</span>
          </td>

          <td class="px-6 py-4 text-sm text-muted">{{ coach.dojo?.name || '—' }}</td>

          <td class="px-6 py-4 text-sm text-muted">
            {{ coach._count?.athletes ?? 0 }} athlete{{ (coach._count?.athletes ?? 0) !== 1 ? 's' : '' }}
          </td>

          <td class="px-6 py-4 text-right space-x-3">
            <button class="text-blue-400 hover:text-blue-300 text-sm" @click="emit('view', coach)">View</button>
            <button class="text-muted hover:text-foreground text-sm" @click="emit('edit', coach)">Edit</button>
            <button class="text-red-400 hover:text-red-300 text-sm" @click="emit('delete', coach)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>