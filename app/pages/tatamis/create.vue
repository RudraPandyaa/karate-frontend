<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const tournamentId = route.query.tournamentId as string

const form = ref({
  tournamentId: tournamentId || '',
  number: 1,
  name: ''
})

const { createTatami } = useTatami()

const onSubmit = async () => {
  if (!form.value.tournamentId) {
    alert("Tournament ID is required")
    return
  }

  try {
    await createTatami(form.value)
    alert("Tatami created successfully!")
    router.push('/tatami')
  } catch (err) {
    alert("Failed to create tatami")
  }
}
</script>

<template>
  <div class="max-w-md mx-auto p-8">
    <h1 class="text-2xl font-bold mb-6">Create New Tatami</h1>

    <form @submit.prevent="onSubmit" class="space-y-6">
      <div>
        <label class="block text-sm mb-2">Tournament ID</label>
        <input
          v-model="form.tournamentId"
          type="text"
          class="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3"
          required
        />
      </div>

      <div>
        <label class="block text-sm mb-2">Tatami Number</label>
        <input
          v-model="form.number"
          type="number"
          class="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3"
          required
        />
      </div>

      <div>
        <label class="block text-sm mb-2">Tatami Name (Optional)</label>
        <input
          v-model="form.name"
          type="text"
          placeholder="Main Tatami"
          class="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3"
        />
      </div>

      <button
        type="submit"
        class="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-semibold"
      >
        Create Tatami
      </button>
    </form>
  </div>
</template>