export function useSelectedTournament() {
  const selectedTournamentId = useState<string | null>(
    'selectedTournamentId',
    () => null,
  )
  const selectedTournamentName = useState<string | null>(
    'selectedTournamentName',
    () => null,
  )

  function selectTournament(id: string, name?: string) {
    selectedTournamentId.value = id
    selectedTournamentName.value = name ?? null
  }

  function clearTournament() {
    selectedTournamentId.value = null
    selectedTournamentName.value = null
  }

  return {
    selectedTournamentId,
    selectedTournamentName,
    selectTournament,
    clearTournament,
  }
}