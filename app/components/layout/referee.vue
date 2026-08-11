<template>
  <div class="flex min-h-screen bg-canvas">
    <AppSideBar />

    <div class="flex min-w-0 flex-1 flex-col">
      <AppHeader />

      <main class="min-w-0 flex-1 overflow-auto">
        <slot />
      </main>
    </div>
  </div>
</template>