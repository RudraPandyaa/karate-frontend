<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, Loader2, Search, CheckCircle2, Circle } from 'lucide-vue-next'
import { ROLES, roleLabel, type BadgeRoleType } from '~/utils/badges'

/**
 * Each list is whatever the parent page already fetches:
 * - athletes: from useAthletes()
 * - coaches: from your coaches composable
 * - officials / referees: users filtered by role, e.g. from a useUsers() composable
 *
 * Every entry just needs an `id` and a displayable name field
 * (firstName/lastName, fullName, or name — displayName() below handles all of them).
 */
const props = defineProps<{
  open: boolean
  loading?: boolean
  athletes?: any[]
  coaches?: any[]
  officials?: any[]
  referees?: any[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'generate', payload: { role: BadgeRoleType; referenceIds: string[] }): void
}>()

const selectedRole = ref<BadgeRoleType | ''>('')
const selectedIds = ref<Set<string>>(new Set())
const search = ref('')

watch(() => props.open, (value) => {
  if (!value) return
  selectedRole.value = ''
  selectedIds.value = new Set()
  search.value = ''
})

watch(selectedRole, () => {
  selectedIds.value = new Set()
  search.value = ''
})

function displayName(entry: any): string {
  return entry.fullName
    || [entry.firstName, entry.lastName].filter(Boolean).join(' ')
    || entry.name
    || '—'
}

function subLabel(entry: any): string {
  return entry.dojo?.name || entry.dojoName || ''
}

const sourceList = computed(() => {
  switch (selectedRole.value) {
    case 'ATHLETE': return props.athletes ?? []
    case 'COACH': return props.coaches ?? []
    case 'OFFICIAL': return props.officials ?? []
    case 'REFEREE': return props.referees ?? []
    default: return []
  }
})

const filteredList = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return sourceList.value
  return sourceList.value.filter((entry) =>
    displayName(entry).toLowerCase().includes(q),
  )
})

const allSelected = computed(() =>
  filteredList.value.length > 0 && filteredList.value.every(e => selectedIds.value.has(e.id)),
)

function toggleAll() {
  const next = new Set(selectedIds.value)
  if (allSelected.value) {
    filteredList.value.forEach(e => next.delete(e.id))
  } else {
    filteredList.value.forEach(e => next.add(e.id))
  }
  selectedIds.value = next
}

function toggleOne(id: string) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

const canSubmit = computed(() => !!selectedRole.value && selectedIds.value.size > 0)

function submit() {
  if (!canSubmit.value) return
  emit('generate', {
    role: selectedRole.value as BadgeRoleType,
    referenceIds: [...selectedIds.value],
  })
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200"
      leave-active-class="transition duration-150"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <div class="w-full max-w-xl rounded-3xl border border-line bg-panel shadow-2xl flex flex-col max-h-[85vh]">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-line px-6 py-5">
            <div>
              <h2 class="text-xl font-bold text-foreground">Generate Badges</h2>
              <p class="mt-1 text-sm text-muted">Pick a role, then select who needs a badge</p>
            </div>
            <button @click="emit('close')" class="rounded-lg p-2 hover:bg-surface transition">
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-4 overflow-y-auto">
            <!-- Role select -->
            <div>
              <label class="mb-1.5 block text-sm font-medium">Role *</label>
              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="role in ROLES"
                  :key="role"
                  class="rounded-xl border px-3 py-2 text-sm font-medium transition"
                  :class="selectedRole === role
                    ? 'border-blue-600 bg-blue-600/10 text-blue-400'
                    : 'border-line bg-surface text-muted hover:bg-surface-hover'"
                  @click="selectedRole = role"
                >
                  {{ roleLabel(role) }}
                </button>
              </div>
            </div>

            <!-- Search + list -->
            <div v-if="selectedRole">
              <div class="relative mb-3">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  v-model="search"
                  type="text"
                  placeholder="Search..."
                  class="input pl-9"
                />
              </div>

              <div class="rounded-xl border border-line overflow-hidden">
                <button
                  class="flex w-full items-center gap-2 border-b border-line bg-canvas/60 px-4 py-2.5 text-sm text-muted hover:bg-surface-hover transition"
                  @click="toggleAll"
                >
                  <CheckCircle2 v-if="allSelected" class="h-4 w-4 text-blue-500" />
                  <Circle v-else class="h-4 w-4" />
                  Select all ({{ filteredList.length }})
                </button>

                <div class="max-h-64 overflow-y-auto divide-y divide-line">
                  <div v-if="filteredList.length === 0" class="px-4 py-6 text-center text-sm text-muted">
                    No matches.
                  </div>
                  <button
                    v-for="entry in filteredList"
                    :key="entry.id"
                    class="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-hover transition"
                    @click="toggleOne(entry.id)"
                  >
                    <CheckCircle2 v-if="selectedIds.has(entry.id)" class="h-4 w-4 shrink-0 text-blue-500" />
                    <Circle v-else class="h-4 w-4 shrink-0 text-muted" />
                    <span class="flex-1 truncate">{{ displayName(entry) }}</span>
                    <span v-if="subLabel(entry)" class="text-xs text-muted truncate">{{ subLabel(entry) }}</span>
                  </button>
                </div>
              </div>

              <p class="mt-2 text-sm text-muted">{{ selectedIds.size }} selected</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-3 border-t border-line px-6 py-5">
            <button
              class="rounded-xl border border-line px-5 py-2.5 hover:bg-surface transition"
              @click="emit('close')"
            >
              Cancel
            </button>
            <button
              :disabled="!canSubmit || loading"
              class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60"
              @click="submit"
            >
              <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
              Generate {{ selectedIds.size > 0 ? `(${selectedIds.size})` : '' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.input {
  @apply w-full rounded-xl border border-line bg-surface px-4 py-2.5 outline-none focus:border-blue-600 text-foreground;
}
</style>