<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Match } from '~/types'
import { Calendar, MapPin, Trophy } from 'lucide-vue-next'
import StatusBadge from '~/components/tournaments/StatusBadge.vue'
import TournamentStaffDashboard from '~/components/tournaments/TournamentStaffDashboard.vue'
import TournamentOverview from '~/components/TournamentOverview.vue'
import CreateMatchModal from '~/components/matches/CreateMatchModal.vue'
import AssignOfficialsModal from '~/components/matches/AssignOfficialsModal.vue'
import BadgeToolbar from '~/components/event-badges/BadgeToolbar.vue'
import EventBadgeTable from '~/components/event-badges/EventBadgeTable.vue'
import GenerateBadgeModal from '~/components/event-badges/GenerateBadgeModal.vue'
import BadgePreviewModal from '~/components/event-badges/BadgePreviewModal.vue'
import AthleteModal from '~/components/athletes/AthleteModal.vue'
import DeleteAthleteModal from '~/components/athletes/DeleteAthleteModal.vue'
import { useAthletes } from '~/composables/useAthletes'
import AthletesTable from '~/components/athletes/AthletesTable.vue'
const route = useRoute()
const id = route.params.id as string
const activeTab = ref<
  'overview' | 'matches' | 'participants' | 'badges' | 'athletes' | 'categories' | 'dashboard'
>('overview')

// --- Badges tab state ---
const badgeRole = ref('')
const showGenerateModal = ref(false)
const showBadgePreview = ref(false)
const selectedBadge = ref<any | null>(null)

const { badges, loading: badgesLoading, generating, exportingPdf, exportingExcel, fetchBadges, generateBadges, markPrinted, exportPdf, exportExcel } = useEventBadges(id)

watch(activeTab, (tab) => {
  if (tab === 'badges') fetchBadges(badgeRole.value || undefined)
})

watch(badgeRole, (role) => {
  fetchBadges(role || undefined)
})

function openBadgePreview(badge: any) {
  selectedBadge.value = badge
  showBadgePreview.value = true
}

async function handleGenerateBadges(payload: { role: string; referenceIds: string[] }) {
  try {
    await generateBadges(payload.role, payload.referenceIds)
    showGenerateModal.value = false
  } catch (err: any) {
    alert(err?.data?.message || 'Failed to generate badges')
  }
}

async function handleBulkMarkPrinted(badgeIds: string[]) {
  await markPrinted(badgeIds, badgeRole.value || undefined)
}

async function handlePreviewMarkPrinted(badgeId: string) {
  await markPrinted([badgeId], badgeRole.value || undefined)
  showBadgePreview.value = false
}
// --- end badges tab state ---

const { isStaff, isAdmin } = useAuth()

// Fetch tournament data
const {
  tournament,
  matches,
  athletes,
  categories,
  loading,
  refresh,
} = useTournamentDetail(id)

// Prevent opening modal until data is ready
const canCreateMatch = computed(() => !loading.value && athletes.value.length > 0)

const openCreateMatch = () => {
  if (!canCreateMatch.value) {
    alert("Athletes are still loading. Please wait a moment.")
    return
  }
  showCreateMatch.value = true
}

// Modals
const showCreateMatch = ref(false)
const showAssignOfficials = ref(false)

// Selected Match
const selectedMatch = ref<Match | null>(null)

// Assign Officials
function handleAssignOfficials(match: Match) {
  selectedMatch.value = match
  showAssignOfficials.value = true
}

const participants = ref<any[]>([])
const loadingParticipants = ref(false)

async function fetchParticipants() {
  loadingParticipants.value = true
  try {
    const { api } = useApi()
    participants.value = await api(`/tournaments/${id}/participants`)
  } catch (err) {
    console.error(err)
  } finally {
    loadingParticipants.value = false
  }
}

watch(activeTab, (tab) => {
  if (tab === 'participants' && participants.value.length === 0) {
    fetchParticipants()
  }
})

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'matches', label: 'Matches' },
  { id: 'participants', label: 'Participants' },
  { id: 'badges', label: 'Badges' },
  { id: 'athletes', label: 'Athletes' },
  { id: 'categories', label: 'Categories' },
]

function getAthleteName(athlete: any) {
  if (!athlete) return 'TBD'
  return athlete.fullName || [athlete.firstName, athlete.lastName].filter(Boolean).join(' ') || 'Unknown'
}

function statusClass(status: string) {
  const s = (status || '').toUpperCase()
  if (s.includes('PROGRESS') || s.includes('LIVE')) return 'bg-blue-500/10 text-blue-400 border-blue-500/30'
  if (s.includes('COMPLETE') || s.includes('FINISH')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  if (s.includes('CANCEL')) return 'bg-red-500/10 text-red-400 border-red-500/30'
  return 'bg-surface text-muted border-line' // SCHEDULED / PENDING / default
}

function humanize(value?: string | null) {
  if (!value) return '—'
  return value.replaceAll('_', ' ')
}

const formatDate = (date?: string) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// --- Athletes tab: view/edit/delete wiring ---
// Separate useAthletes() instance for CRUD actions triggered from this tab
// (the `athletes` list itself still comes from useTournamentDetail)
const {
  createAthlete,
  updateAthlete,
  deleteAthlete: deleteAthleteApi,
  uploadPhoto,
  enrollAthlete,
  unenrollAthlete,
} = useAthletes()

const showAthleteModal = ref(false)
const showDeleteAthleteModal = ref(false)
const athleteModalLoading = ref(false)
const athleteDeleteLoading = ref(false)
const selectedAthleteForEdit = ref<any>(null)

function openEditAthleteModal(athlete: any) {
  selectedAthleteForEdit.value = athlete
  showAthleteModal.value = true
}

function openDeleteAthleteModal(athlete: any) {
  selectedAthleteForEdit.value = athlete
  showDeleteAthleteModal.value = true
}

function viewAthleteFromTournament(athlete: any) {
  navigateTo(`/athletes/${athlete.id}`)
}

function closeAthleteModal() {
  showAthleteModal.value = false
  selectedAthleteForEdit.value = null
}

function closeDeleteAthleteModal() {
  showDeleteAthleteModal.value = false
  selectedAthleteForEdit.value = null
}

async function syncAthleteCategoryEnrollments(athleteId: string, selectedIds: string[]) {
  const existingIds: string[] = Array.isArray(selectedAthleteForEdit.value?.categories)
    ? selectedAthleteForEdit.value.categories.map((c: any) => c.id)
    : []

  const toEnroll = selectedIds.filter((id) => !existingIds.includes(id))
  const toUnenroll = existingIds.filter((id) => !selectedIds.includes(id))

  for (const categoryId of toEnroll) {
    try { await enrollAthlete(athleteId, { categoryId }) }
    catch (e: any) { console.warn('Enrollment:', e?.data?.message || e.message) }
  }
  for (const categoryId of toUnenroll) {
    try { await unenrollAthlete(athleteId, categoryId) }
    catch (e: any) { console.warn('Unenrollment:', e?.data?.message || e.message) }
  }
}

async function saveAthleteFromTournament(payload: { athlete: any; photoFile?: File }) {
  athleteModalLoading.value = true
  try {
    const { athlete, photoFile } = payload

    const dto: any = {
      firstName: athlete.firstName,
      middleName: athlete.middleName || undefined,
      lastName: athlete.lastName,
      gender: athlete.gender,
      dateOfBirth: athlete.dateOfBirth,
      bloodGroup: athlete.bloodGroup || undefined,
      disability: athlete.disability || undefined,
      phone: athlete.phone || undefined,
      email: athlete.email || undefined,
      address: athlete.address || undefined,
      city: athlete.city || undefined,
      state: athlete.state,
      postalCode: athlete.postalCode || undefined,
      country: athlete.country || 'IND',
      guardianName: athlete.guardianName || undefined,
      emergencyContact: athlete.emergencyContact || undefined,
      emergencyPhone: athlete.emergencyPhone || undefined,
      style: athlete.style || undefined,
      currentRank: athlete.currentRank || undefined,
      federationId: athlete.federationId || undefined,
      dojoId: athlete.dojoId || undefined,
      coachId: athlete.coachId || undefined,
    }

    let saved: any
    if (selectedAthleteForEdit.value?.id) {
      saved = await updateAthlete(selectedAthleteForEdit.value.id, dto)
    } else {
      saved = await createAthlete(dto)
    }

    if (photoFile && saved?.id) {
      await uploadPhoto(saved.id, photoFile)
    }

    const athleteId = saved?.id || selectedAthleteForEdit.value?.id
    if (athleteId && Array.isArray(athlete.categoryIds)) {
      await syncAthleteCategoryEnrollments(athleteId, athlete.categoryIds)
    }

    await refresh()
    closeAthleteModal()
  } catch (err: any) {
    console.error(err)
    alert(err?.data?.message || err?.message || 'Failed to save athlete')
  } finally {
    athleteModalLoading.value = false
  }
}

async function removeAthleteFromTournament() {
  if (!selectedAthleteForEdit.value) return
  athleteDeleteLoading.value = true
  try {
    await deleteAthleteApi(selectedAthleteForEdit.value.id)
    await refresh()
    closeDeleteAthleteModal()
  } catch (err) {
    console.error(err)
  } finally {
    athleteDeleteLoading.value = false
  }
}
// --- end athletes tab wiring ---
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Loading -->
    <div v-if="loading" class="text-center py-20 text-muted">
      Loading tournament...
    </div>

    <!-- Tournament Header -->
    <div v-else class="rounded-3xl bg-gradient-to-br from-slate-900 to-zinc-950 p-8 text-white border border-line">
      <div class="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h1 class="text-4xl font-bold">{{ tournament?.name }}</h1>
          <p class="mt-2 text-lg text-slate-300">{{ tournament?.subtitle }}</p>
          <div class="flex flex-wrap gap-x-6 gap-y-2 mt-5 text-sm">
            <div class="flex items-center gap-2">
              <MapPin class="w-5 h-5 text-slate-400" />
              {{ tournament?.location }}
            </div>
            <div class="flex items-center gap-2">
              <Calendar class="w-5 h-5 text-slate-400" />
              {{ formatDate(tournament?.startDate) }} — {{ formatDate(tournament?.endDate) }}
            </div>
          </div>
        </div>
        <div class="text-right">
          <StatusBadge :status="tournament?.displayStatus" size="lg" />
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="border-b border-line">
      <div class="flex items-center justify-between">
        <nav class="flex gap-8">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              activeTab === tab.id ? 'border-b-2 border-blue-500 text-foreground' : 'text-muted hover:text-foreground'
            ]"
            class="pb-4 text-sm font-medium transition"
          >
            {{ tab.label }}
          </button>

          <!-- Staff Only -->
          <button
            v-if="isStaff"
            @click="activeTab = 'dashboard'"
            :class="[
              activeTab === 'dashboard' ? 'border-b-2 border-emerald-500 text-emerald-400' : 'text-emerald-400 hover:text-emerald-300'
            ]"
            class="pb-4 text-sm font-medium transition flex items-center gap-1"
          >
            <Trophy class="w-4 h-4" />
            Staff Dashboard
          </button>
        </nav>

        <!-- Quick Staff Actions -->
        <div v-if="isStaff" class="flex gap-3">
          <button
            @click="showCreateMatch = true"
            class="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            New Match
          </button>
        </div>
      </div>
    </div>

    <div class="min-h-[400px]">
      <!-- Overview -->
      <div v-if="activeTab === 'overview'">
        <TournamentOverview
          :tournament="tournament"
          :athletes-count="athletes.length"
        />
      </div>

      <!-- Matches -->
      <div v-else-if="activeTab === 'matches'" class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-semibold text-foreground">Matches</h2>
            <p class="text-sm text-muted mt-1">{{ matches.length }} match{{ matches.length !== 1 ? 'es' : '' }} in this tournament</p>
          </div>
        </div>

        <div v-if="matches.length === 0" class="rounded-2xl border border-line bg-surface py-16 text-center text-muted">
          No matches scheduled yet.
        </div>

        <div v-else class="rounded-2xl border border-line bg-surface overflow-hidden">
          <table class="w-full">
            <thead class="bg-canvas/60">
              <tr>
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-muted">Round</th>
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-muted">Category</th>
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-muted">Tatami</th>
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-muted">Athletes</th>
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-muted">Score</th>
                <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-muted">Status</th>
                <th class="px-5 py-3 text-right text-xs font-semibold uppercase text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="match in matches"
                :key="match.id"
                class="border-t border-line hover:bg-surface-hover"
              >
                <td class="px-5 py-3 text-sm">{{ humanize(match.round) }}</td>

                <td class="px-5 py-3 text-sm">
                  {{ match.category?.name || '—' }}
                  <span v-if="match.category" class="block text-xs text-muted">
                    {{ match.category.ageGroup }} · {{ match.category.gender }} · {{ match.category.discipline }}
                  </span>
                </td>

                <td class="px-5 py-3 text-sm text-muted">{{ match.tatami?.name || '—' }}</td>

                <td class="px-5 py-3 text-sm">
                  <span :class="match.winnerId === match.redAthleteId ? 'font-semibold text-red-400' : ''">
                    {{ getAthleteName(match.redAthlete) }}
                  </span>
                  <span class="text-muted mx-1">vs</span>
                  <span :class="match.winnerId === match.blueAthleteId ? 'font-semibold text-blue-400' : ''">
                    {{ getAthleteName(match.blueAthlete) }}
                  </span>
                </td>

                <td class="px-5 py-3 text-sm font-mono">
                  {{ match.redScore }} – {{ match.blueScore }}
                </td>

                <td class="px-5 py-3">
                  <span
                    class="rounded-lg border px-2.5 py-1 text-xs font-medium"
                    :class="statusClass(match.status)"
                  >
                    {{ humanize(match.status) }}
                  </span>
                </td>

                <td class="px-5 py-3 text-right">
                  <button
                    v-if="isStaff"
                    class="text-sm text-blue-400 hover:text-blue-300"
                    @click="handleAssignOfficials(match)"
                  >
                    Assign Officials
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

          <!-- Participants (Category-wise) -->
      <div v-else-if="activeTab === 'participants'" class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-semibold text-foreground">Participants by Category</h2>
            <p class="text-sm text-muted mt-1">
              All registered athletes grouped by category
            </p>
          </div>
          <button
            class="rounded-xl border border-line px-4 py-2 text-sm hover:bg-surface"
            @click="fetchParticipants"
          >
            Refresh
          </button>
        </div>

        <div v-if="loadingParticipants" class="py-16 text-center text-muted">
          Loading participants...
        </div>

        <div v-else-if="participants.length === 0" class="py-16 text-center text-muted">
          No participants found for this tournament.
        </div>

        <div v-else class="space-y-6">
          <div
            v-for="cat in participants"
            :key="cat.categoryId"
            class="rounded-2xl border border-line bg-surface overflow-hidden"
          >
            <!-- Category header -->
            <div class="bg-canvas/60 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 class="font-semibold text-foreground">
                  {{ cat.categoryName }}
                </h3>
                <p class="text-sm text-muted mt-0.5">
                  {{ cat.ageGroup }} · {{ cat.gender }} · {{ cat.discipline }}
                  <span v-if="cat.weightMin || cat.weightMax">
                    · {{ cat.weightMin || 0 }}–{{ cat.weightMax || '∞' }} kg
                  </span>
                </p>
              </div>
              <span class="text-sm font-medium text-muted">
                {{ cat.totalAthletes }} athlete{{ cat.totalAthletes !== 1 ? 's' : '' }}
              </span>
            </div>

            <!-- Athletes list -->
            <div v-if="cat.athletes.length === 0" class="px-6 py-8 text-center text-muted text-sm">
              No athletes enrolled in this category
            </div>

            <div v-else class="divide-y divide-line">
              <div
                v-for="athlete in cat.athletes"
                :key="athlete.id"
                class="px-6 py-3 flex items-center justify-between hover:bg-surface-hover transition"
              >
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl overflow-hidden bg-canvas border border-line shrink-0">
                    <img
                      v-if="athlete.photoUrl"
                      :src="athlete.photoUrl"
                      class="w-full h-full object-cover"
                    />
                    <div
                      v-else
                      class="w-full h-full flex items-center justify-center text-xs font-semibold text-muted"
                    >
                      {{ (athlete.fullName || athlete.firstName || '?').charAt(0) }}
                    </div>
                  </div>

                  <div>
                    <p class="font-medium text-foreground">
                      {{ athlete.fullName || [athlete.firstName, athlete.lastName].filter(Boolean).join(' ') }}
                    </p>
                    <p class="text-xs text-muted">
                      {{ athlete.country }}
                      <span v-if="athlete.seed"> · Seed #{{ athlete.seed }}</span>
                    </p>
                  </div>
                </div>

                <NuxtLink
                  :to="`/athletes/${athlete.id}`"
                  class="text-sm text-blue-400 hover:text-blue-300"
                >
                  View
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Badges Tab -->
      <div v-else-if="activeTab === 'badges'" class="space-y-6">
        <div>
          <h2 class="text-xl font-semibold">Event Badges / IDs</h2>
          <p class="text-sm text-muted mt-1">
            Generate and manage IDs for athletes, coaches, officials and referees
          </p>
        </div>
        <BadgeToolbar
          v-model:active-role="badgeRole"
          :generating="generating"
          :exporting-pdf="exportingPdf"
          :exporting-excel="exportingExcel"
          @generate="showGenerateModal = true"
          @export-pdf="exportPdf(badgeRole || undefined)"
          @export-excel="exportExcel(badgeRole || undefined)"
        />

        <EventBadgeTable
          :badges="badges"
          :loading="badgesLoading"
          @preview="openBadgePreview"
          @mark-printed="handleBulkMarkPrinted"
        />
      </div>

      <!-- Athletes -->
      <div v-else-if="activeTab === 'athletes'">
          <AthletesTable
            :athletes="athletes"
            :categories="categories"
            @view="viewAthleteFromTournament"
            @edit="openEditAthleteModal"
            @delete="openDeleteAthleteModal"
          />
      </div>

      <!-- Categories -->
      <div v-else-if="activeTab === 'categories'" class="rounded-xl border border-line p-6">
        <h2 class="text-xl font-semibold">Categories</h2>
        <ul class="mt-4 space-y-2">
          <li
            v-for="category in categories"
            :key="category.id"
          >
            {{ category.name }}
          </li>
        </ul>
      </div>

      <!-- Staff Dashboard -->
      <div v-else-if="activeTab === 'dashboard' && isStaff">
        <TournamentStaffDashboard
          :tournament="tournament"
          :matches="matches"
          :is-admin="isAdmin"
          @assign-officials="handleAssignOfficials"
        />
      </div>
    </div>
  </div>

  <!-- Modals -->
  <CreateMatchModal
    v-if="showCreateMatch"
    :categories="categories"
    :athletes="athletes"
    :tatamis="tournament?.tatamis || []"
    @close="showCreateMatch = false"
    @created="() => {
      showCreateMatch = false
      refresh()
    }"
  />

  <AssignOfficialsModal
    v-if="showAssignOfficials"
    :match="selectedMatch"
    @close="showAssignOfficials = false"
    @saved="
      () => {
        showAssignOfficials = false
        refresh()
      }
    "
  />

  <AthleteModal
    :open="showAthleteModal"
    :loading="athleteModalLoading"
    :athlete="selectedAthleteForEdit"
    :categories="categories"
    @close="closeAthleteModal"
    @save="saveAthleteFromTournament"
  />

  <DeleteAthleteModal
    :open="showDeleteAthleteModal"
    :loading="athleteDeleteLoading"
    :athlete-name="`${selectedAthleteForEdit?.firstName || ''} ${selectedAthleteForEdit?.lastName || ''}`.trim()"
    @close="closeDeleteAthleteModal"
    @delete="removeAthleteFromTournament"
  />

  <GenerateBadgeModal
  :open="showGenerateModal"
  :loading="generating"
  :athletes="athletes"
  @close="showGenerateModal = false"
  @generate="handleGenerateBadges"
/>

<BadgePreviewModal
  :open="showBadgePreview"
  :badge="selectedBadge"
  :loading="generating"
  @close="showBadgePreview = false"
  @mark-printed="handlePreviewMarkPrinted"
/>
</template>