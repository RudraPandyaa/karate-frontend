<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Match } from '~/types'
import { Calendar, MapPin, Trophy } from 'lucide-vue-next'
import StatusBadge from '~/components/tournaments/StatusBadge.vue'
import TournamentStaffDashboard from '~/components/tournaments/TournamentStaffDashboard.vue'
import CreateMatchModal from '~/components/matches/CreateMatchModal.vue'
import AssignOfficialsModal from '~/components/matches/AssignOfficialsModal.vue'
import BadgeToolbar from '~/components/event-badges/BadgeToolbar.vue'
import EventBadgeTable from '~/components/event-badges/EventBadgeTable.vue'
import GenerateBadgeModal from '~/components/event-badges/GenerateBadgeModal.vue'
import BadgePreviewModal from '~/components/event-badges/BadgePreviewModal.vue'

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

const {
  badges,
  loading: badgesLoading,
  generating,
  exporting,
  fetchBadges,
  generateBadges,
  markPrinted,
  exportPdf,
  exportExcel,
} = useEventBadges(id)

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

const formatDate = (date?: string) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
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
      <div v-else-if="activeTab === 'matches'" class="rounded-xl border border-line p-6">
        <h2 class="text-xl font-semibold">Matches</h2>
        <p class="mt-2">Total Matches: {{ matches.length }}</p>
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
          :exporting="exporting"
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
        <AthletesTable :athletes="athletes" />
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