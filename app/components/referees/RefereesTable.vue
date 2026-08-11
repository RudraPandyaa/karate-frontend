<script setup lang="ts">
import { computed } from 'vue'
import CountryFlag from 'vue-country-flag-next'
import { COUNTRY_CODE_MAP } from '~/utils/countries'
import type { Referee } from '~/composables/useReferees'
import PageLoader from '~/components/ui/PageLoader.vue'
const props = defineProps<{
  referees: Referee[]
  loading?: boolean
  search?: string
}>()

const emit = defineEmits<{
  (e: 'view', referee: Referee): void
  (e: 'edit', referee: Referee): void
  (e: 'delete', referee: Referee): void
}>()

// Only Admins can edit or delete referee records — everyone who can reach
// this page can still view them.
const { isAdmin } = useAuth()

function getDisplayName(r: Referee) {
  return [r.firstName, r.lastName].filter(Boolean).join(' ') || '—'
}

function statusClass(status?: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-emerald-500/10 text-emerald-400'
    case 'SUSPENDED': return 'bg-red-500/10 text-red-400'
    default: return 'bg-surface text-muted border border-line'
  }
}

const filtered = computed(() => {
  const q = (props.search || '').trim().toLowerCase()
  if (!q) return props.referees

  return props.referees.filter((r) => {
    const name = getDisplayName(r).toLowerCase()
    return (
      name.includes(q) ||
      r.license?.toLowerCase().includes(q) ||
      r.country?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q)
    )
  })
})
</script>

<template>
  <div class="bg-surface border border-line rounded-2xl overflow-hidden">
    <PageLoader v-if="loading" text="Loading your referees..." />

    <div v-else-if="filtered.length === 0" class="py-16 text-center text-muted">
      No referees found.
    </div>

    <table v-else class="w-full">
      <thead class="bg-canvas/60">
        <tr>
          <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">Referee</th>
          <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">Country</th>
          <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">License</th>
          <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">Rank</th>
          <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
          <th class="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted">Actions</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="referee in filtered"
          :key="referee.id"
          class="border-t border-line hover:bg-surface-hover transition"
        >
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl overflow-hidden bg-canvas border border-line shrink-0">
                <img
                  v-if="referee.photoUrl"
                  :src="referee.photoUrl"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-xs font-semibold text-muted">
                  {{ getDisplayName(referee).charAt(0).toUpperCase() }}
                </div>
              </div>
              <p class="font-medium text-foreground truncate">{{ getDisplayName(referee) }}</p>
            </div>
          </td>

          <td class="px-6 py-4">
            <div class="flex items-center gap-2">
              <CountryFlag
                v-if="COUNTRY_CODE_MAP[referee.country || '']"
                :country="COUNTRY_CODE_MAP[referee.country || '']"
                size="small"
              />
              <span class="text-sm text-muted">{{ referee.country || '—' }}</span>
            </div>
          </td>

          <td class="px-6 py-4 text-sm text-muted">{{ referee.license || '—' }}</td>
          <td class="px-6 py-4 text-sm text-muted">{{ referee.rank?.replaceAll('_', ' ') || '—' }}</td>

          <td class="px-6 py-4">
            <span class="rounded-lg px-2.5 py-1 text-xs font-medium" :class="statusClass(referee.status)">
              {{ referee.status || 'ACTIVE' }}
            </span>
          </td>

          <td class="px-6 py-4 text-right space-x-3">
            <button class="text-blue-400 hover:text-blue-300 text-sm" @click="emit('view', referee)">View</button>
            <template v-if="isAdmin">
              <button class="text-muted hover:text-foreground text-sm" @click="emit('edit', referee)">Edit</button>
              <button class="text-red-400 hover:text-red-300 text-sm" @click="emit('delete', referee)">Delete</button>
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>