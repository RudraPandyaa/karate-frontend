<template>
  <div class="relative min-h-screen w-full overflow-hidden bg-[#050914]">

    <!-- =====================================================
         FIXED BACKGROUND
         This NEVER changes size when athlete form becomes long
         ===================================================== -->
    <div
      class="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
      style="background-image: url('/images/auth-bg.jpeg')"
    />

    <!-- Dark overlay -->
    <div class="fixed inset-0 z-0 bg-black/20" />

    <!-- =====================================================
         SCROLLABLE CONTENT
         Background stays fixed while athlete form scrolls
         ===================================================== -->
    <main
      class="relative z-10 min-h-screen w-full overflow-y-auto"
    >
      <div
        class="flex min-h-screen w-full items-center justify-end px-4 py-8 sm:px-8 lg:px-16"
      >
        <div class="w-full max-w-[430px]">
          <slot />
        </div>
      </div>
    </main>

  </div>
</template>