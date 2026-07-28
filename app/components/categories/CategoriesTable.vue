<script setup lang="ts">
import { Pencil, Trash2, Users, Swords } from 'lucide-vue-next'

import GenderBadge from '~/components/categories/GenderBadge.vue'
import DisciplineBadge from '~/components/categories/DisciplineBadge.vue'

import type { Category } from '~/composables/useCategories'

defineProps<{
  rows: Category[]
}>()

const emit = defineEmits<{
  edit: [category: Category]
  delete: [category: Category]
}>()

function formatWeight(category: Category) {
  if (
    category.discipline === 'KATA' ||
    category.discipline === 'TEAM_KATA'
  ) {
    return '—'
  }

  if (category.weightMin == null && category.weightMax == null)
    return 'Open'

  if (category.weightMin == null)
    return `-${category.weightMax} kg`

  if (category.weightMax == null)
    return `+${category.weightMin} kg`

  return `${category.weightMin} – ${category.weightMax} kg`
}

</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-line bg-surface">
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">

        <thead>
          <tr class="border-b border-line text-xs uppercase tracking-wide text-muted">
            <th class="px-6 py-4 font-medium text-foreground">Name</th>
            <th class="px-6 py-4 font-medium text-foreground">Tournament</th>
            <th class="px-6 py-4 font-medium text-foreground">Age Group</th>
            <th class="px-6 py-4 font-medium text-foreground">Gender</th>
            <th class="px-6 py-4 font-medium text-foreground">Discipline</th>
            <th class="px-6 py-4 font-medium text-foreground">Weight</th>
            <th class="px-6 py-4 font-medium text-foreground">Athletes</th>
            <th class="px-6 py-4 font-medium text-foreground">Matches</th>
            <th class="px-6 py-4 font-medium text-right text-foreground">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="category in rows"
            :key="category.id"
            class="border-b border-line last:border-b-0 transition hover:bg-surface-hover"
          >
            <td class="px-6 py-4 font-medium text-foreground">
              {{ category.name }}
            </td>

            <td class="px-6 py-4 text-muted">
              {{ category.tournament?.name ?? '—' }}
            </td>

            <td class="px-6 py-4 text-muted">
              {{ category.ageGroup }}
            </td>

            <td class="px-6 py-4 text-foreground">
              <GenderBadge :gender="category.gender" />
            </td>

            <td class="px-6 py-4 text-foreground">
              <DisciplineBadge :discipline="category.discipline" />
            </td>

            <td class="px-6 py-4 text-muted">
              {{ formatWeight(category) }}
            </td>

            <td class="px-6 py-4 text-muted">
              <span class="inline-flex items-center gap-1.5">
                <Users class="h-3.5 w-3.5" />
                {{ category._count?.athletes ?? 0 }}
              </span>
            </td>

            <td class="px-6 py-4 text-muted">
              <span class="inline-flex items-center gap-1.5">
                <Swords class="h-3.5 w-3.5" />
                {{ category._count?.matches ?? 0 }}
              </span>
            </td>

            <td class="px-6 py-4 text-foreground">
              <div class="flex items-center justify-end gap-2">
                <button
                  class="rounded-lg p-2 text-muted transition hover:bg-surface-hover hover:text-foreground"
                  title="Edit category"
                  @click="emit('edit', category)"
                >
                  <Pencil class="h-4 w-4" />
                </button>

                <button
                  class="rounded-lg p-2 text-muted transition hover:bg-red-500/10 hover:text-red-400"
                  title="Delete category"
                  @click="emit('delete', category)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>

      </table>
    </div>
  </div>
</template>