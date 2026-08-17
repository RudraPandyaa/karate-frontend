<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const id = route.params.id as string

await navigateTo(`/live-scoring/${id}${route.fullPath.includes('tv=1') ? '?tv=1' : ''}`, {
  redirectCode: 301,
})
</script>

<template>
  <div />
</template>