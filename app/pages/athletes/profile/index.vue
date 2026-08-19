<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAthleteDashboard } from '~/composables/useAthleteDashboard'
import PageLoader from '~/components/ui/PageLoader.vue'
import { getFlagUrl, getCountry,   COUNTRIES,
 } from '~/utils/countries'

definePageMeta({
  layout: 'athlete',
  middleware: ['athlete'],
})

const { user, logout } = useAuth()

const {
  dashboard,
  pending,
  error,
  fetchDashboard,
} = useAthleteDashboard()

onMounted(async () => {
  await fetchDashboard()
})

function displayValue(value?: string | number | null) {
  if (value === 0) return '0'

  return value !== undefined &&
    value !== null &&
    String(value).trim()
    ? String(value)
    : '—'
}

const athlete = computed(
  () => dashboard.value?.athlete ?? null,
)

const countryCode = computed(() => {
  return athlete.value?.country || null
})

const countryValue = computed(() => {
  const a: any = athlete.value

  return (
    a?.country ||
    a?.countryCode ||
    a?.nationality ||
    a?.country_code ||
    null
  )
})

const flagUrl = computed(() => {
  const value = countryValue.value

  if (!value) return ''

  return getFlagUrl(String(value))
})

const countryName = computed(() => {
  const value = countryValue.value

  if (!value) return null

  // If API returns IND / JPN / USA etc.
  const country = getCountry(String(value).toUpperCase())

  if (country) {
    return country.name
  }

  // If API returns India / Japan / United States etc.
  const byName = COUNTRIES.find(
    c => c.name.toLowerCase() === String(value).toLowerCase(),
  )

  return byName?.name || String(value)
})

/* =========================================================
   AGE
========================================================= */

const age = computed(() => {
  const dob =
    (athlete.value as any)?.dateOfBirth ||
    (athlete.value as any)?.dob ||
    null

  if (!dob) {
    return null
  }

  const birth = new Date(dob)

  if (Number.isNaN(birth.getTime())) {
    return null
  }

  const today = new Date()

  let years =
    today.getFullYear() -
    birth.getFullYear()

  const month =
    today.getMonth() -
    birth.getMonth()

  if (
    month < 0 ||
    (month === 0 &&
      today.getDate() < birth.getDate())
  ) {
    years -= 1
  }

  return years >= 0 ? years : null
})
</script>

<template>
  <div
    class="mx-auto max-w-5xl space-y-6 px-4 py-6 lg:px-8 lg:py-8"
  >
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold text-foreground">
        My Profile
      </h1>

      <p class="mt-1 text-sm text-muted">
        Your athlete account details
      </p>
    </div>

    <!-- Loader -->
    <PageLoader
      v-if="pending"
      text="Loading your profile..."
    />

    <!-- Error -->
    <div
      v-else-if="error"
      class="rounded-3xl border border-red-500/40 bg-red-500/10 p-5 text-red-300"
    >
      {{ error }}
    </div>

    <template v-else>

      <!-- =================================================
           PROFILE HEADER
      ================================================== -->

      <section
        class="rounded-3xl border border-line bg-surface p-6"
      >
        <div
          class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"
        >

          <!-- Athlete -->
          <div class="flex items-center gap-4">

            <!-- Avatar -->
            <div
              class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-blue-600 text-2xl font-bold text-white"
            >
              <img
                v-if="dashboard?.athlete?.photoUrl"
                :src="dashboard.athlete.photoUrl"
                alt="Athlete photo"
                class="h-full w-full object-cover"
              />

              <span v-else>
                {{
                  (
                    dashboard?.athlete?.fullName ||
                    user?.name ||
                    'A'
                  )
                    .charAt(0)
                    .toUpperCase()
                }}
              </span>
            </div>

            <!-- Details -->
            <div>
              <h2
                class="text-xl font-bold text-foreground"
              >
                {{
                  dashboard?.athlete?.fullName ||
                  user?.name ||
                  'Athlete'
                }}
              </h2>

              <p class="mt-1 text-sm text-muted">
                {{
                  displayValue(
                    dashboard?.athlete?.email ||
                    user?.email
                  )
                }}
              </p>

              <p
                class="mt-1 font-mono text-xs text-blue-400"
              >
                ID:
                {{
                  dashboard?.athlete?.id
                    ?.slice(0, 10)
                    ?.toUpperCase() || '—'
                }}
              </p>
            </div>
          </div>
          <NuxtLink
              to="/athletes/profile/edit"
              class="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              Edit profile
          </NuxtLink>
          <!-- Logout -->
          <button
            class="rounded-xl border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
            @click="logout"
          >
            Logout
          </button>

        </div>
      </section>

      <!-- =================================================
           INFORMATION
      ================================================== -->

      <section
        class="grid gap-6 lg:grid-cols-2"
      >

        <!-- Personal Information -->
        <div
          class="rounded-3xl border border-line bg-surface p-6"
        >
          <h3
            class="mb-4 text-sm font-semibold uppercase tracking-wide text-muted"
          >
            Personal Information
          </h3>

          <div class="space-y-4 text-sm">

            <!-- Full Name -->
            <div
              class="flex items-center justify-between gap-4"
            >
              <span class="text-muted">
                Full Name
              </span>

              <span
                class="text-right font-medium text-foreground"
              >
                {{
                  displayValue(
                    dashboard?.athlete?.fullName
                  )
                }}
              </span>
            </div>

            <!-- Country -->
            <div class="flex items-center justify-between gap-4">
              <span class="text-muted">Country</span>

              <span class="flex items-center gap-2">
                <img
                  v-if="flagUrl"
                  :src="flagUrl"
                  :alt="countryName || 'Country'"
                  :title="countryName || 'Country'"
                  class="h-[18px] w-6 rounded-sm object-cover"
                />

                <span
                  v-else
                  class="text-sm font-medium text-muted"
                >
                  —
                </span>
              </span>
            </div>

            <!-- Age -->
            <div
              class="flex items-center justify-between gap-4"
            >
              <span class="text-muted">
                Age
              </span>

              <span
                class="text-right font-medium text-foreground"
              >
                {{
                  age !== null
                    ? `${age} yrs`
                    : '—'
                }}
              </span>
            </div>

            <!-- State -->
            <div
              class="flex items-center justify-between gap-4"
            >
              <span class="text-muted">
                State
              </span>

              <span
                class="text-right font-medium text-foreground"
              >
                {{
                  displayValue(
                    dashboard?.athlete?.state
                  )
                }}
              </span>
            </div>

            <!-- City -->
            <div
              class="flex items-center justify-between gap-4"
            >
              <span class="text-muted">
                City
              </span>

              <span
                class="text-right font-medium text-foreground"
              >
                {{
                  displayValue(
                    dashboard?.athlete?.city
                  )
                }}
              </span>
            </div>

          </div>
        </div>

        <!-- Karate Information -->
        <div
          class="rounded-3xl border border-line bg-surface p-6"
        >
          <h3
            class="mb-4 text-sm font-semibold uppercase tracking-wide text-muted"
          >
            Karate Information
          </h3>

          <div class="space-y-4 text-sm">

            <!-- Rank -->
            <div
              class="flex items-center justify-between gap-4"
            >
              <span class="text-muted">
                Current Rank
              </span>

              <span
                class="text-right font-medium text-foreground"
              >
                {{
                  displayValue(
                    dashboard?.athlete?.currentRank
                  )
                }}
              </span>
            </div>

            <!-- Style -->
            <div
              class="flex items-center justify-between gap-4"
            >
              <span class="text-muted">
                Style
              </span>

              <span
                class="text-right font-medium text-foreground"
              >
                {{
                  displayValue(
                    dashboard?.athlete?.style
                  )
                }}
              </span>
            </div>

            <!-- Dojo -->
            <div
              class="flex items-center justify-between gap-4"
            >
              <span class="text-muted">
                Dojo
              </span>

              <span
                class="text-right font-medium text-foreground"
              >
                {{
                  displayValue(
                    dashboard?.athlete?.dojo?.name
                  )
                }}
              </span>
            </div>

            <!-- Coach -->
            <div
              class="flex items-center justify-between gap-4"
            >
              <span class="text-muted">
                Coach
              </span>

              <span
                class="text-right font-medium text-foreground"
              >
                {{
                  dashboard?.athlete?.coach
                    ? [
                        dashboard.athlete.coach.firstName,
                        dashboard.athlete.coach.lastName,
                      ]
                        .filter(Boolean)
                        .join(' ')
                    : '—'
                }}
              </span>
            </div>

          </div>
        </div>

      </section>

      <!-- =================================================
           COMPETITION SUMMARY
      ================================================== -->

      <section
        class="rounded-3xl border border-line bg-surface p-6"
      >
        <h3
          class="mb-4 text-sm font-semibold uppercase tracking-wide text-muted"
        >
          Competition Summary
        </h3>

        <div
          class="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >

          <!-- Matches -->
          <div
            class="rounded-2xl bg-canvas px-4 py-3"
          >
            <p class="text-xs text-muted">
              Matches
            </p>

            <p
              class="mt-1 text-xl font-bold text-foreground"
            >
              {{
                dashboard?.stats?.matches ?? 0
              }}
            </p>
          </div>

          <!-- Wins -->
          <div
            class="rounded-2xl bg-canvas px-4 py-3"
          >
            <p class="text-xs text-muted">
              Wins
            </p>

            <p
              class="mt-1 text-xl font-bold text-green-400"
            >
              {{
                dashboard?.stats?.wins ?? 0
              }}
            </p>
          </div>

          <!-- Losses -->
          <div
            class="rounded-2xl bg-canvas px-4 py-3"
          >
            <p class="text-xs text-muted">
              Losses
            </p>

            <p
              class="mt-1 text-xl font-bold text-red-400"
            >
              {{
                dashboard?.stats?.losses ?? 0
              }}
            </p>
          </div>

          <!-- Win Rate -->
          <div
            class="rounded-2xl bg-canvas px-4 py-3"
          >
            <p class="text-xs text-muted">
              Win Rate
            </p>

            <p
              class="mt-1 text-xl font-bold text-foreground"
            >
              {{
                dashboard?.stats?.winRate ?? 0
              }}%
            </p>
          </div>

        </div>
      </section>

    </template>
  </div>
</template>