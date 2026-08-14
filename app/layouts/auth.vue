<template>
  <div class="relative min-h-screen w-full overflow-x-hidden bg-[#050914]">
    <!-- Fixed background -->
    <div
      class="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
      style="background-image: url('/images/auth-bg.jpeg')"
    />
    <div class="fixed inset-0 z-0 bg-black/20" />

    <!-- Form area: right half, but not stuck to edge -->
    <main class="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-10">
      <div
        class="w-full max-w-[400px]
               lg:ml-[46%]
               xl:ml-[46%]"
      >
        <slot />
      </div>
    </main>
  </div>
</template>