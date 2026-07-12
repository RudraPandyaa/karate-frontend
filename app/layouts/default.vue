<template>
  <div class="flex h-screen overflow-hidden bg-canvas">
    <LayoutAppSidebar />

    <div class="flex flex-1 flex-col min-w-0">
      <LayoutAppTopbar />

      <main class="flex-1 overflow-y-auto px-4 py-6 lg:px-6">
        <slot />
      </main>
    </div>
  </div>
</template>
