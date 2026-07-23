<script setup lang="ts">
definePageMeta({
  layout: 'public',
})

</script>

<template>
  <div class="min-h-screen bg-canvas">

    <section class="max-w-7xl mx-auto px-6 py-20">

      <div class="max-w-3xl">
        <p class="text-blue-400 font-semibold mb-4">
          WKF TOURNAMENT MANAGEMENT PLATFORM
        </p>

        <h1 class="text-5xl font-bold text-foreground">
          Karate Tournament Management
          <span class="text-blue-500">Made Simple.</span>
        </h1>

        <p class="mt-6 text-lg text-muted">
          Follow live karate matches, tournament scores and athlete performances
          in real time.
        </p>

        <div class="flex gap-4 mt-8">
          <NuxtLink
            to="/live"
            class="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white"
          >
            Watch Live Matches
          </NuxtLink>

          <NuxtLink
            to="/matches"
            class="rounded-xl border border-line px-6 py-3 font-medium"
          >
            View Matches
          </NuxtLink>
        </div>
      </div>

    </section>

  </div>
</template>