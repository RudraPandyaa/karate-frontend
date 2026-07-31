<script setup lang="ts">
import { Search, User, Users } from 'lucide-vue-next'
import type { Athlete } from '~/types'

const props = defineProps<{
  athletes: Athlete[]
}>()

const emit = defineEmits<{
  (e: 'view', athlete: Athlete): void
  (e: 'edit', athlete: Athlete): void
  (e: 'delete', athlete: Athlete): void
}>()

const search = ref('')

const filteredAthletes = computed(() => {
  if (!search.value) return props.athletes
  const q = search.value.toLowerCase()
  return props.athletes.filter((a) =>
    [a.name, a.state, a.country].filter(Boolean).join(' ').toLowerCase().includes(q)
  )
})

function calculateAge(dateOfBirth: string | null | undefined): number | string {
  if (!dateOfBirth) return '-'
  const dob = new Date(dateOfBirth)
  const diff = Date.now() - dob.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}
</script>

<template>
  <div class="space-y-6">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold">Athletes</h2>
        <p class="text-muted text-sm">
          {{ filteredAthletes.length }} Registered Athletes
        </p>
      </div>

      <div class="relative w-72">
        <Search
          class="absolute left-3 top-3 w-4 h-4 text-muted"
        />

        <input
          v-model="search"
          placeholder="Search athlete..."
          class="w-full rounded-xl border border-line bg-surface pl-10 pr-4 py-2 outline-none focus:border-blue-500"
        >
      </div>
    </div>

    <!-- Empty -->
    <div
      v-if="filteredAthletes.length === 0"
      class="rounded-3xl border border-dashed border-line py-20 text-center"
    >
      <Users class="mx-auto mb-4 h-12 w-12 text-muted" />
      <p class="text-muted">
        No athletes found
      </p>
    </div>

    <!-- Table -->
    <div
      v-else
      class="overflow-hidden rounded-3xl border border-line bg-surface"
    >
      <table class="w-full">
        <thead class="bg-slate-900">
          <tr class="text-left text-sm">
            <th class="px-6 py-4">Athlete</th>
            <th class="px-6 py-4">Club</th>
            <th class="px-6 py-4">State</th>
            <th class="px-6 py-4">Country</th>
            <th class="px-6 py-4">Gender</th>
            <th class="px-6 py-4">Age</th>
            <th class="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="athlete in filteredAthletes"
            :key="athlete.id"
            class="border-t border-line hover:bg-slate-900/30 transition"
          >
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center"
                >
                  <User class="w-5 h-5 text-blue-400" />
                </div>

                <div>
                  <div class="font-semibold">
                    {{ athlete.name }}
                  </div>

                  <div class="text-xs text-muted">
                    #{{ athlete.id }}
                  </div>
                </div>
              </div>
            </td>

            <td class="px-6 py-4">
              -
            </td>

            <td class="px-6 py-4">
              {{ athlete.state || '-' }}
            </td>

            <td class="px-6 py-4">
              {{ athlete.country || '-' }}
            </td>

            <td class="px-6 py-4">
              {{ athlete.gender }}
            </td>

            <td class="px-6 py-4">
              {{ athlete.age }}
            </td>

            <td class="px-6 py-4 text-right space-x-3">
              <button
                class="text-blue-400 hover:text-blue-300 text-sm"
                @click="emit('view', athlete)"
              >
                View
              </button>
              <button
                class="text-muted hover:text-foreground text-sm"
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
  </div>
</template>