import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsService } from '../services/settings.service'
import type { AppSettings } from '../types/entities'

const KEY = ['settings']

export function useSettings() {
  return useQuery({ queryKey: KEY, queryFn: settingsService.get })
}

export function useSaveSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AppSettings) => settingsService.set(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  })
}
