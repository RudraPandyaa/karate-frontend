<template>
  <div class="min-h-screen bg-canvas text-foreground">
    <LayoutAthleteSidebar />

    <div class="flex min-h-screen flex-1 flex-col">
      <LayoutAthleteTopbar />

      <main class="flex-1 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>