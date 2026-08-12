<template>
  <div
    class="auth-layout relative min-h-screen overflow-hidden bg-[#020617]"
  >
    <!-- Three.js background -->
    <ClientOnly>
      <KarateBackground />
    </ClientOnly>

    <!-- Page -->
    <main class="relative z-10 min-h-screen">
      <slot />
    </main>
  </div>
</template>