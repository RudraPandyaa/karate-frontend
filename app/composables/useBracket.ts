import { useApi } from '~/composables/useApi'
import type { Category } from '~/composables/useCategories'

export interface BracketAthlete {
  id: string
  name: string
  state: string
  country?: string
}

export interface BracketMatch {
  id: string
  round: string
  bracketSlot: number | null
  pool: number | null
  status: string
  redScore: number
  blueScore: number
  winnerId: string | null

  redAthlete?: BracketAthlete | null
  blueAthlete?: BracketAthlete | null

  tatami?: { id: string; number: number; name?: string } | null
}

export interface CategoryBracketResponse {
  category: Category
  matches: BracketMatch[]
}

export const useBracket = () => {
  const { api } = useApi()

  const category = ref<Category | null>(null)
  const matches = ref<BracketMatch[]>([])

  const pending = ref(false)
  const generating = ref(false)
  const error = ref<string | null>(null)

  async function fetchCategoryBracket(categoryId: string) {
    pending.value = true
    error.value = null

    try {
      const res = await api<CategoryBracketResponse>(`/bracket/category/${categoryId}`)
      category.value = res.category
      matches.value = res.matches
    } catch (err: any) {
      error.value = err?.data?.message || err.message || 'Unable to load bracket'
    } finally {
      pending.value = false
    }
  }

  async function generateBracket(categoryId: string) {
    generating.value = true
    error.value = null

    try {
      await api('/bracket/generate', {
        method: 'POST',
        body: { categoryId },
      })
      await fetchCategoryBracket(categoryId)
    } catch (err: any) {
      error.value = err?.data?.message || err.message || 'Unable to generate bracket'
      throw err
    } finally {
      generating.value = false
    }
  }

  return {
    category,
    matches,
    pending,
    generating,
    error,
    fetchCategoryBracket,
    generateBracket,
  }
}