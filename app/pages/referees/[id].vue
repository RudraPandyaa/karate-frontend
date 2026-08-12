<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft, Pencil, Trash2, Loader2 } from 'lucide-vue-next'
import CountryFlag from 'vue-country-flag-next'
import { COUNTRY_CODE_MAP } from '~/utils/countries'
import { useReferees, type Referee } from '~/composables/useReferees'
import { useMatches } from '~/composables/useMatches'
import RefereeModal from '~/components/referees/RefereeModal.vue'
import DeleteRefereeModal from '~/components/referees/DeleteRefereeModal.vue'

// Referees are staff by role (see useAuth's STAFF_ROLES), and match data
// is otherwise only exposed to staff — same guard as /admin/matches.
definePageMeta({
  layout: 'default',
  middleware: 'admin',   // or 'staff' if you want SCOREKEEPER to also see it later
})
const route = useRoute()
const id = route.params.id as string

const { isAdmin, user } = useAuth()

const { getReferee, updateReferee, deleteReferee, uploadPhoto } = useReferees()
const { matches, pending: matchesPending, fetchAll: fetchAllMatches } = useMatches()

const referee = ref<Referee | null>(null)
const loading = ref(true)
const loadError = ref<string | null>(null)

const showEditModal = ref(false)
const showDeleteModal = ref(false)
const modalLoading = ref(false)
const deleteLoading = ref(false)

async function load() {
  loading.value = true
  loadError.value = null
  try {
    const [refereeData] = await Promise.all([
      getReferee(id),
      fetchAllMatches(),
    ])
    referee.value = refereeData
  } catch (err: any) {
    console.error(err)
    loadError.value = err?.data?.message || err?.message || 'Failed to load referee'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function getDisplayName(r?: Referee | null) {
  if (!r) return '—'
  return [r.firstName, r.lastName].filter(Boolean).join(' ') || '—'
}

// Whether the logged-in user is looking at their own linked profile.
const isOwnProfile = computed(() =>
  !!referee.value?.userId && referee.value.userId === user.value?.id
)

// Contact details are private — only visible to Admins or to the referee
// viewing their own profile.
const canSeeContact = computed(() => isAdmin.value || isOwnProfile.value)

// Matches this referee has officiated, matched via the linked user
// account (Referee.userId === Match.refereeId). If there's no linked
// account, we can't determine this from match data at all.
const officiatedMatches = computed(() => {
  if (!referee.value?.id) return []
  return matches.value
    .filter((m: any) => m.refereeId === referee.value!.id)
    .sort(
      (a: any, b: any) =>
        new Date(b.completedAt || b.createdAt || 0).getTime() -
        new Date(a.completedAt || a.createdAt || 0).getTime(),
    )
})

function matchAthleteName(a: any): string {
  if (!a) return 'TBD'
  if (a.fullName) return a.fullName
  if (a.name) return a.name
  const parts = [a.firstName, a.lastName].filter(Boolean)
  return parts.length ? parts.join(' ') : 'TBD'
}

function humanize(value?: string | null) {
  if (!value) return '—'
  return value.replaceAll('_', ' ')
}

function formatDate(date?: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function statusClass(status?: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-emerald-500/10 text-emerald-400'
    case 'SUSPENDED': return 'bg-red-500/10 text-red-400'
    default: return 'bg-surface text-muted border border-line'
  }
}

async function saveReferee(payload: { referee: any; photoFile?: File }) {
  if (!referee.value) return
  modalLoading.value = true
  try {
    const { referee: form, photoFile } = payload

    const dto: any = {
      firstName: form.firstName,
      lastName: form.lastName,
      country: form.country || 'IND',
      license: form.license || undefined,
      rank: form.rank || undefined,
      certification: form.certification || undefined,
      status: form.status || 'ACTIVE',
      phone: form.phone || undefined,
      email: form.email || undefined,
    }

    await updateReferee(referee.value.id, dto)

    if (photoFile) {
      await uploadPhoto(referee.value.id, photoFile)
    }

    showEditModal.value = false
    await load()
  } catch (err: any) {
    console.error(err)
    alert(err?.data?.message || err?.message || 'Failed to save referee')
  } finally {
    modalLoading.value = false
  }
}

async function confirmDelete() {
  if (!referee.value) return
  deleteLoading.value = true
  try {
    await deleteReferee(referee.value.id)
    await navigateTo('/referees')
  } catch (err: any) {
    console.error(err)
    alert(err?.data?.message || err?.message || 'Failed to delete referee')
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6 pb-12">
    <NuxtLink to="/referees" class="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground">
      <ArrowLeft class="w-4 h-4" /> Back to Referees
    </NuxtLink>

    <div v-if="loading" class="py-20 text-center text-muted">Loading referee...</div>

    <div v-else-if="loadError" class="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
      {{ loadError }}
    </div>

    <template v-else-if="referee">
      <!-- Profile header -->
      <div class="rounded-3xl border border-line bg-panel p-6">
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-20 h-20 rounded-2xl overflow-hidden border border-line bg-surface shrink-0">
              <img
                v-if="referee.photoUrl"
                :src="referee.photoUrl"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-xl font-semibold text-muted">
                {{ getDisplayName(referee).charAt(0).toUpperCase() }}
              </div>
            </div>

            <div>
              <h1 class="text-2xl font-bold text-foreground">{{ getDisplayName(referee) }}</h1>
              <div class="mt-1 flex items-center gap-2 text-sm text-muted">
                <CountryFlag
                  v-if="COUNTRY_CODE_MAP[referee.country || '']"
                  :country="COUNTRY_CODE_MAP[referee.country || '']"
                  size="small"
                />
                {{ referee.country || '—' }}
              </div>
              <span
                class="mt-2 inline-block rounded-lg px-2.5 py-1 text-xs font-medium"
                :class="statusClass(referee.status)"
              >
                {{ referee.status || 'ACTIVE' }}
              </span>
            </div>
          </div>

          <div v-if="isAdmin" class="flex gap-2 shrink-0">
            <button
              class="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm hover:bg-surface transition"
              @click="showEditModal = true"
            >
              <Pencil class="w-4 h-4" /> Edit
            </button>
            <button
              class="inline-flex items-center gap-2 rounded-xl border border-red-800/40 text-red-400 px-4 py-2 text-sm hover:bg-red-500/10 transition"
              @click="showDeleteModal = true"
            >
              <Trash2 class="w-4 h-4" /> Delete
            </button>
          </div>
        </div>

        <!-- Officiating details -->
        <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-line pt-4">
          <div>
            <p class="text-xs text-muted uppercase tracking-wider">License</p>
            <p class="mt-1 text-foreground">{{ referee.license || '—' }}</p>
          </div>
          <div>
            <p class="text-xs text-muted uppercase tracking-wider">Rank</p>
            <p class="mt-1 text-foreground">{{ humanize(referee.rank) }}</p>
          </div>
          <div>
            <p class="text-xs text-muted uppercase tracking-wider">Certification</p>
            <p class="mt-1 text-foreground">{{ referee.certification || '—' }}</p>
          </div>
          <div>
            <p class="text-xs text-muted uppercase tracking-wider">Matches Officiated</p>
            <p class="mt-1 text-foreground">{{ officiatedMatches.length }}</p>
          </div>
        </div>

        <!-- Contact (private) -->
        <div v-if="canSeeContact" class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-line pt-4">
          <div>
            <p class="text-xs text-muted uppercase tracking-wider">Phone</p>
            <p class="mt-1 text-foreground">{{ referee.phone || '—' }}</p>
          </div>
          <div>
            <p class="text-xs text-muted uppercase tracking-wider">Email</p>
            <p class="mt-1 text-foreground">{{ referee.email || '—' }}</p>
          </div>
        </div>
      </div>

      <!-- Career: matches officiated -->
      <div class="rounded-3xl border border-line bg-panel p-6">
        <h2 class="text-lg font-semibold text-foreground mb-1">Career</h2>
        <p class="text-sm text-muted mb-4">Matches this referee has officiated</p>

        <div v-if="!referee.userId" class="rounded-xl border border-dashed border-line py-10 text-center text-muted text-sm">
          This referee profile isn't linked to a login account yet, so officiating history can't be looked up.
        </div>

        <div v-else-if="matchesPending" class="py-10 text-center text-muted">Loading matches...</div>

        <div v-else-if="officiatedMatches.length === 0" class="py-10 text-center text-muted text-sm">
          No matches officiated yet.
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="m in officiatedMatches"
            :key="m.id"
            class="flex items-center justify-between rounded-xl border border-line bg-surface px-5 py-3"
          >
            <div>
              <p class="font-medium text-foreground">
                {{ matchAthleteName(m.redAthlete) }} vs {{ matchAthleteName(m.blueAthlete) }}
              </p>
              <p class="text-xs text-muted mt-0.5">
                {{ m.category?.name || 'Uncategorized' }} • {{ humanize(m.round) }} • {{ humanize(m.status) }}
              </p>
            </div>
            <p class="text-sm text-muted">{{ formatDate(m.completedAt || m.createdAt) }}</p>
          </div>
        </div>
      </div>
    </template>

    <!-- Edit modal (admin only) -->
    <RefereeModal
      :open="showEditModal"
      :loading="modalLoading"
      :referee="referee"
      @close="showEditModal = false"
      @save="saveReferee"
    />

    <DeleteRefereeModal
      :open="showDeleteModal"
      :loading="deleteLoading"
      :referee-name="getDisplayName(referee)"
      @close="showDeleteModal = false"
      @delete="confirmDelete"
    />
  </div>
</template>