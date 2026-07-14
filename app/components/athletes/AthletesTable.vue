<script setup lang="ts">
import { computed } from 'vue'
import type { Athlete } from '~/composables/useAthletes'

const props = defineProps<{
  athletes: Athlete[]
  loading?: boolean
  search?: string
}>()

const emit = defineEmits<{
  (e: 'view', athlete: Athlete): void
  (e: 'edit', athlete: Athlete): void
  (e: 'delete', athlete: Athlete): void
}>()

const filtered = computed(() => {
  const q = (props.search || '').trim().toLowerCase()
  if (!q) return props.athletes
  return props.athletes.filter((a) =>
    a.name.toLowerCase().includes(q) ||
    a.state?.toLowerCase().includes(q) ||
    a.country?.toLowerCase().includes(q),
  )
})
</script>

<template>
  <div class="bg-surface border border-line rounded-2xl overflow-hidden">
    <div
      v-if="loading"
      class="py-16 text-center text-muted"
    >
      Loading...
    </div>

    <div
      v-else-if="filtered.length === 0"
      class="py-16 text-center text-muted"
    >
      No athletes found.
    </div>

    <table
      v-else
      class="w-full"
    >
      <thead class="bg-canvas/60">
        <tr>
          <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">Athlete</th>
          <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">Country</th>
          <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">Categories</th>
          <th class="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="athlete in filtered"
          :key="athlete.id"
          class="border-t border-line hover:bg-surface-hover"
        >
          <td class="px-6 py-4 font-medium">{{ athlete.name }}</td>
          <td class="px-6 py-4">{{ athlete.country }}</td>
          <td class="px-6 py-4 text-sm text-muted">
            {{ athlete.enrollments?.length ?? 0 }} enrolled
          </td>
          <td class="px-6 py-4 text-right space-x-3">
            <button
              class="text-blue-400 hover:text-blue-300 text-sm"
              @click="emit('view', athlete)"
            >
              View Profile
            </button>
            <button
              class="text-muted hover:text-white text-sm"
              @click="emit('edit', athlete)"
            >
              Edit
            </button>
            <button
              class="text-red-400 hover:text-red-300 text-sm"
              @click="emit('delete', athlete)"
            >
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>