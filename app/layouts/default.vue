<template>
  <div class="min-h-screen flex bg-canvas text-foreground">
    <LayoutAppSidebar />

    <div class="flex min-w-0 flex-1 flex-col">
      <LayoutAppTopbar />

      <main class="min-w-0 flex-1 overflow-y-auto px-4 py-6 lg:px-6">
        <slot />
      </main>
    </div>
  </div>
</template>