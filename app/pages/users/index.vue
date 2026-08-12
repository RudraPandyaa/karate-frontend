<script setup lang="ts">
import type { Role } from '~/types'
import { useUsers } from '~/composables/useUsers'
import { Search, Shield, ClipboardList } from 'lucide-vue-next'

definePageMeta({
  middleware: ['admin'], // only ADMIN / SUPER_ADMIN
})

const {
  users,
  pending,
  saving,
  error,
  fetchUsers,
  updateRole,
} = useUsers()

const search = ref('')
const roleFilter = ref<Role | ''>('')
const assigningId = ref<string | null>(null)

const assignableRoles: { label: string; value: Role }[] = [
  { label: 'Guest', value: 'GUEST' },
  { label: 'Scorekeeper', value: 'SCOREKEEPER' },
  { label: 'Referee', value: 'REFEREE' },
  { label: 'Organizer', value: 'ORGANIZER' },
]

async function load() {
  await fetchUsers({
    search: search.value.trim() || undefined,
    role: roleFilter.value || undefined,
  })
}

onMounted(load)

let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch([search, roleFilter], () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(load, 300)
})

async function handleAssign(userId: string, role: Role) {
  if (!confirm(`Change this user's role to ${role}?`)) return

  assigningId.value = userId
  try {
    await updateRole(userId, role)
  } catch {
    // error already set in composable
  } finally {
    assigningId.value = null
  }
}

function roleBadgeClass(role: Role) {
  switch (role) {
    case 'REFEREE':
      return 'bg-purple-500/15 text-purple-400'
    case 'SCOREKEEPER':
      return 'bg-amber-500/15 text-amber-400'
    case 'ORGANIZER':
      return 'bg-blue-500/15 text-blue-400'
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return 'bg-red-500/15 text-red-400'
    case 'ATHLETE':
      return 'bg-green-500/15 text-green-400'
    default:
      return 'bg-zinc-500/15 text-zinc-300'
  }
}
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6 p-6">
    <div>
      <h1 class="text-3xl font-bold text-foreground">Users</h1>
      <p class="mt-1 text-sm text-muted">
        Search users and assign them as Referee or Scorekeeper
      </p>
    </div>

    <!-- Filters -->
    <div class="flex flex-col gap-3 sm:flex-row">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          v-model="search"
          type="text"
          placeholder="Search by name or email..."
          class="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-4 text-foreground"
        />
      </div>

      <select
        v-model="roleFilter"
        class="rounded-xl border border-line bg-surface px-4 py-2.5 text-foreground"
      >
        <option value="">All roles</option>
        <option value="GUEST">Guest</option>
        <option value="REFEREE">Referee</option>
        <option value="SCOREKEEPER">Scorekeeper</option>
        <option value="ORGANIZER">Organizer</option>
        <option value="ATHLETE">Athlete</option>
        <option value="ADMIN">Admin</option>
      </select>
    </div>

    <p v-if="error" class="text-sm text-red-400">
      {{ error }}
    </p>

    <!-- Loading -->
    <div
      v-if="pending"
      class="rounded-2xl border border-line bg-surface py-16 text-center text-muted"
    >
      Loading users...
    </div>

    <!-- Empty -->
    <div
      v-else-if="users.length === 0"
      class="rounded-2xl border border-line bg-surface py-16 text-center text-muted"
    >
      No users found
    </div>

    <!-- Table -->
    <div
      v-else
      class="overflow-hidden rounded-2xl border border-line bg-surface"
    >
      <table class="w-full text-sm">
        <thead class="border-b border-line bg-canvas/40 text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            <th class="px-5 py-3 font-medium">User</th>
            <th class="px-5 py-3 font-medium">Role</th>
            <th class="px-5 py-3 font-medium">Assign as</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="u in users"
            :key="u.id"
            class="border-t border-line"
          >
            <td class="px-5 py-4">
              <p class="font-medium text-foreground">{{ u.name }}</p>
              <p class="text-xs text-muted">{{ u.email }}</p>
            </td>

            <td class="px-5 py-4">
              <span
                class="rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="roleBadgeClass(u.role)"
              >
                {{ u.role }}
              </span>
            </td>

            <td class="px-5 py-4">
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="r in assignableRoles"
                  :key="r.value"
                  class="rounded-lg border border-line px-3 py-1.5 text-xs font-medium transition hover:bg-surface-hover disabled:opacity-50"
                  :class="u.role === r.value
                    ? 'border-blue-500/40 bg-blue-600/10 text-blue-400'
                    : 'text-muted'"
                  :disabled="saving && assigningId === u.id || u.role === r.value || u.role === 'SUPER_ADMIN'"
                  @click="handleAssign(u.id, r.value)"
                >
                  <span v-if="r.value === 'REFEREE'" class="inline-flex items-center gap-1">
                    <Shield class="h-3 w-3" />
                    Referee
                  </span>
                  <span v-else-if="r.value === 'SCOREKEEPER'" class="inline-flex items-center gap-1">
                    <ClipboardList class="h-3 w-3" />
                    Scorekeeper
                  </span>
                  <span v-else>
                    {{ r.label }}
                  </span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>