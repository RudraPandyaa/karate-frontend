<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Match } from '~/types'
import { Calendar, MapPin, Trophy, Search, Download, Loader2, Plus } from 'lucide-vue-next'
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
import CollapsibleSection from '~/components/ui/CollapsibleSection.vue'
import PageLoader from '~/components/ui/PageLoader.vue'
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
const matchSearch = ref('')
const matchStatusFilter = ref('')
const matchCategoryFilter = ref('')

const filteredMatches = computed(() => {
  let list = matches.value

  // Status filter
  if (matchStatusFilter.value) {
    list = list.filter(m => m.status === matchStatusFilter.value)
  }

  // Category filter
  if (matchCategoryFilter.value) {
    list = list.filter(m => m.category?.id === matchCategoryFilter.value)
  }

  // Search (athlete name or category name)
  if (matchSearch.value.trim()) {
    const q = matchSearch.value.toLowerCase()
    list = list.filter(m => {
      const red = getAthleteName(m.redAthlete).toLowerCase()
      const blue = getAthleteName(m.blueAthlete).toLowerCase()
      const cat = (m.category?.name || '').toLowerCase()
      return red.includes(q) || blue.includes(q) || cat.includes(q)
    })
  }

  return list
})

function clearMatchFilters() {
  matchSearch.value = ''
  matchStatusFilter.value = ''
  matchCategoryFilter.value = ''
}
watch(activeTab, (tab) => {
  if (tab === 'badges') fetchBadges(badgeRole.value || undefined)
})

watch(badgeRole, (role) => {
  fetchBadges(role || undefined)
})

const participantSearch = ref('')
const participantCategoryFilter = ref('')
const participantGenderFilter = ref('')

const filteredParticipants = computed(() => {
  let list = participants.value

  // Category filter
  if (participantCategoryFilter.value) {
    list = list.filter(c => c.categoryId === participantCategoryFilter.value)
  }

  // Gender filter
  if (participantGenderFilter.value) {
    list = list.filter(c => c.gender === participantGenderFilter.value)
  }

  // Search by athlete name (and keep only categories that still have matching athletes)
  if (participantSearch.value.trim()) {
    const q = participantSearch.value.toLowerCase()
    list = list
      .map(cat => ({
        ...cat,
        athletes: cat.athletes.filter((a: any) => {
          const name = (a.fullName || [a.firstName, a.lastName].filter(Boolean).join(' ')).toLowerCase()
          return name.includes(q)
        }),
      }))
      .filter(cat => cat.athletes.length > 0)
  }

  return list
})

function clearParticipantFilters() {
  participantSearch.value = ''
  participantCategoryFilter.value = ''
  participantGenderFilter.value = ''
}

function exportParticipantsCsv() {
  const rows: any[] = []

  filteredParticipants.value.forEach(cat => {
    cat.athletes.forEach((a: any) => {
      rows.push({
        Category: cat.categoryName,
        'Age Group': cat.ageGroup,
        Gender: cat.gender,
        Discipline: cat.discipline,
        'Athlete Name': a.fullName || [a.firstName, a.lastName].filter(Boolean).join(' '),
        Country: a.country || '',
        Seed: a.seed || '',
      })
    })
  })

  if (rows.length === 0) return

  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `participants-${id}-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function openBadgePreview(badge: any) {
  selectedBadge.value = badge
  showBadgePreview.value = true
}

 async function handleGenerateBadges(payload: { role: string; referenceIds: string[] }) {
  if (!isAdmin.value) {
    alert('Only admins can generate badges.')
    return
}
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

const categorySearch = ref('')

const filteredCategories = computed(() => {
  if (!categorySearch.value.trim()) return categories.value

  const q = categorySearch.value.toLowerCase()
  return categories.value.filter(c =>
    c.name.toLowerCase().includes(q) ||
    (c.ageGroup || '').toLowerCase().includes(q) ||
    (c.discipline || '').toLowerCase().includes(q)
  )
})


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
  if (!isAdmin.value) return
  selectedAthleteForEdit.value = athlete
  showAthleteModal.value = true
}

function openDeleteAthleteModal(athlete: any) {
  if (!isAdmin.value) return
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
  <div class="space-y-8 pb-12 relative min-h-[70vh]">
    <!-- Single full-page loader -->
    <PageLoader
      v-if="loading"
      text="Loading tournament..."
    />

    <!-- Everything else only appears after data is loaded -->
    <div v-else class="space-y-8">
      <!-- Tournament Header -->
      <div class="rounded-3xl bg-gradient-to-br from-slate-900 to-zinc-950 p-8 text-white border border-line">
        <div class="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <h1 class="text-4xl font-bold">{{ tournament?.name }}</h1>
            <p class="mt-2 text-lg text-slate-300">{{ tournament?.subtitle }}</p>
            <div class="flex flex-wrap gap-x-6 gap-y-2 mt-5 text-sm">
              <div class="flex items-center gap-2">
                <MapPin class="w-5 h-5 text-slate-400" />
                {{ tournament?.location || '—' }}
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
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-foreground'
                  : 'text-muted hover:text-foreground'
              ]"
              class="pb-4 text-sm font-medium transition"
            >
              {{ tab.label }}
            </button>

            <button
              v-if="isStaff"
              @click="activeTab = 'dashboard'"
              :class="[
                activeTab === 'dashboard'
                  ? 'border-b-2 border-emerald-500 text-emerald-400'
                  : 'text-emerald-400 hover:text-emerald-300'
              ]"
              class="pb-4 text-sm font-medium transition flex items-center gap-1"
            >
              <Trophy class="w-4 h-4" />
              Staff Dashboard
            </button>
          </nav>

          <div v-if="isStaff" class="flex gap-3">
            <button
              @click="openCreateMatch"
              class="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              New Match
            </button>
          </div>
        </div>
      </div>

      <!-- Tab Content -->
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
          <!-- Header + Filters -->
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-xl font-semibold text-foreground">Matches</h2>
              <p class="text-sm text-muted mt-1">
                {{ filteredMatches.length }} match{{ filteredMatches.length !== 1 ? 'es' : '' }}
                <span v-if="filteredMatches.length !== matches.length">
                  (of {{ matches.length }})
                </span>
              </p>
            </div>
          </div>

          <!-- Filter bar -->
          <div class="flex flex-wrap items-center gap-3">
            <!-- Search -->
            <div class="relative flex-1 min-w-[220px] max-w-sm">
              <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                v-model="matchSearch"
                type="text"
                placeholder="Search athlete or category..."
                class="w-full rounded-full border border-line bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 text-foreground"
              />
            </div>

            <!-- Status filter -->
            <select
              v-model="matchStatusFilter"
              class="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PAUSED">Paused</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <!-- Category filter -->
            <select
              v-model="matchCategoryFilter"
              class="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:border-blue-500 min-w-[180px]"
            >
              <option value="">All Categories</option>
              <option
                v-for="cat in categories"
                :key="cat.id"
                :value="cat.id"
              >
                {{ cat.name }}
              </option>
            </select>

            <!-- Clear filters -->
            <button
              v-if="matchSearch || matchStatusFilter || matchCategoryFilter"
              class="text-sm text-muted hover:text-foreground underline"
              @click="clearMatchFilters"
            >
              Clear filters
            </button>
          </div>

          <!-- Empty state -->
          <div
            v-if="filteredMatches.length === 0"
            class="rounded-2xl border border-line bg-surface py-16 text-center text-muted"
          >
            {{ matches.length === 0 ? 'No matches scheduled yet.' : 'No matches match your filters.' }}
          </div>

          <!-- Table -->
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
                  v-for="match in filteredMatches"
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

        <!-- Participants -->
        <div v-else-if="activeTab === 'participants'" class="space-y-6">
          <!-- Header -->
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-xl font-semibold text-foreground">Participants by Category</h2>
              <p class="text-sm text-muted mt-1">
                All registered athletes grouped by category
              </p>
            </div>

            <div class="flex items-center gap-3">
              <button
                class="rounded-xl border border-line px-4 py-2 text-sm hover:bg-surface transition"
                @click="fetchParticipants"
              >
                Refresh
              </button>

              <button
                class="flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm hover:bg-surface transition"
                @click="exportParticipantsCsv"
                :disabled="filteredParticipants.length === 0"
              >
                <Download class="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>

          <!-- Filters -->
          <div class="flex flex-wrap items-center gap-3">
            <!-- Search -->
            <div class="relative flex-1 min-w-[220px] max-w-sm">
              <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                v-model="participantSearch"
                type="text"
                placeholder="Search athlete name..."
                class="w-full rounded-full border border-line bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 text-foreground"
              />
            </div>

            <!-- Category filter -->
            <select
              v-model="participantCategoryFilter"
              class="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:border-blue-500 min-w-[180px]"
            >
              <option value="">All Categories</option>
              <option
                v-for="cat in participants"
                :key="cat.categoryId"
                :value="cat.categoryId"
              >
                {{ cat.categoryName }}
              </option>
            </select>

            <!-- Gender filter -->
            <select
              v-model="participantGenderFilter"
              class="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:border-blue-500"
            >
              <option value="">All Genders</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>

            <button
              v-if="participantSearch || participantCategoryFilter || participantGenderFilter"
              class="text-sm text-muted hover:text-foreground underline"
              @click="clearParticipantFilters"
            >
              Clear filters
            </button>
          </div>

          <!-- Loader -->
          <div v-if="loadingParticipants" class="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 class="h-8 w-8 animate-spin text-blue-500" />
            <p class="text-sm text-muted">Loading participants...</p>
          </div>

          <!-- Empty state -->
          <div
            v-else-if="filteredParticipants.length === 0"
            class="rounded-2xl border border-line bg-surface py-16 text-center text-muted"
          >
            {{ participants.length === 0
              ? 'No participants found for this tournament.'
              : 'No participants match your filters.' }}
          </div>

          <!-- Categories list -->
          <div v-else class="space-y-4">
            <CollapsibleSection
              v-for="(cat, index) in filteredParticipants"
              :key="cat.categoryId"
              :default-open="index === 0"
            >
              <template #header>
                <div class="flex items-center justify-between w-full pr-4">
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
                  <span class="rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium px-3 py-1">
                    {{ cat.athletes.length }} athlete{{ cat.athletes.length !== 1 ? 's' : '' }}
                  </span>
                </div>
              </template>

              <!-- Athletes -->
              <div v-if="cat.athletes.length === 0" class="px-6 py-8 text-center text-muted text-sm">
                No athletes in this category
              </div>

              <div v-else class="divide-y divide-line">
                <div
                  v-for="athlete in cat.athletes"
                  :key="athlete.id"
                  class="px-6 py-3 flex items-center justify-between hover:bg-surface-hover transition cursor-pointer"
                  @click="navigateTo(`/athletes/${athlete.id}`)"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl overflow-hidden bg-canvas border border-line shrink-0">
                      <img
                        v-if="athlete.photoUrl"
                        :src="athlete.photoUrl"
                        class="w-full h-full object-cover"
                      />
                      <div
                        v-else
                        class="w-full h-full flex items-center justify-center text-sm font-semibold text-muted"
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

                  <span class="text-sm text-blue-400">View →</span>
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </div>

        <!-- Badges -->
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
            :can-generate="isAdmin"
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
            :can-manage="isAdmin"
            @view="viewAthleteFromTournament"
            @edit="openEditAthleteModal"
            @delete="openDeleteAthleteModal"
          />
        </div>

        <!-- Categories -->
        <div v-else-if="activeTab === 'categories'" class="space-y-6">
          <!-- Header -->
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-xl font-semibold text-foreground">Categories</h2>
              <p class="text-sm text-muted mt-1">
                {{ filteredCategories.length }} categor{{ filteredCategories.length !== 1 ? 'ies' : 'y' }} in this tournament
              </p>
            </div>

            <button
              v-if="isAdmin"
              class="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition"
              @click="navigateTo('/categories')"
            >
              <Plus class="h-4 w-4" />
              Manage Categories
            </button>
          </div>

          <!-- Search -->
          <div class="relative max-w-sm">
            <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              v-model="categorySearch"
              type="text"
              placeholder="Search categories..."
              class="w-full rounded-full border border-line bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 text-foreground"
            />
          </div>

          <!-- Empty state -->
          <div
            v-if="filteredCategories.length === 0"
            class="rounded-2xl border border-line bg-surface py-16 text-center text-muted"
          >
            {{ categories.length === 0
              ? 'No categories found for this tournament.'
              : 'No categories match your search.' }}
          </div>

          <!-- Table -->
          <div v-else class="rounded-2xl border border-line bg-surface overflow-hidden">
            <table class="w-full">
              <thead class="bg-canvas/60">
                <tr>
                  <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-muted">Category</th>
                  <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-muted">Age Group</th>
                  <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-muted">Gender</th>
                  <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-muted">Discipline</th>
                  <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-muted">Weight</th>
                  <th class="px-5 py-3 text-right text-xs font-semibold uppercase text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="cat in filteredCategories"
                  :key="cat.id"
                  class="border-t border-line hover:bg-surface-hover transition"
                >
                  <td class="px-5 py-4">
                    <p class="font-medium text-foreground">{{ cat.name }}</p>
                  </td>
                  <td class="px-5 py-4 text-sm text-muted">{{ cat.ageGroup || '—' }}</td>
                  <td class="px-5 py-4 text-sm text-muted">{{ cat.gender || '—' }}</td>
                  <td class="px-5 py-4 text-sm text-muted">{{ cat.discipline || '—' }}</td>
                  <td class="px-5 py-4 text-sm text-muted">
                    <span v-if="cat.weightMin || cat.weightMax">
                      {{ cat.weightMin || 0 }} – {{ cat.weightMax || '∞' }} kg
                    </span>
                    <span v-else>—</span>
                  </td>
                  <td class="px-5 py-4 text-right">
                    <button
                      class="text-sm text-blue-400 hover:text-blue-300"
                      @click="navigateTo(`/categories/${cat.id}`)"
                    >
                      View
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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

    <!-- Modals (keep them outside the loading block) -->
    <ClientOnly>
      <Teleport to="body">
        <div
          v-if="showCreateMatch"
          class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
          @click.self="showCreateMatch = false"
        >
          <div
            class="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
            @click.stop
          >
            <CreateMatchModal
              :categories="categories"
              :athletes="athletes"
              :tatamis="tournament?.tatamis || []"
              @close="showCreateMatch = false"
              @created="() => { showCreateMatch = false; refresh() }"
            />
          </div>
        </div>
      </Teleport>
    </ClientOnly>

    <AssignOfficialsModal
      v-if="showAssignOfficials"
      :match="selectedMatch"
      @close="showAssignOfficials = false"
      @saved="() => { showAssignOfficials = false; refresh() }"
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
  </div>
</template>