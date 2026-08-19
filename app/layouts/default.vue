<template>
  <div class="flex h-screen overflow-hidden bg-canvas text-foreground">
    <LayoutAppSidebar />

    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <LayoutAppTopbar class="shrink-0" />

      <main class="min-h-0 flex-1 overflow-y-auto px-4 py-6 lg:px-6">
        <slot />
      </main>
    </div>
  </div>
</template>