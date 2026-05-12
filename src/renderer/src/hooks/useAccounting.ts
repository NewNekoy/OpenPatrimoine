import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accountingService } from '../services/accounting.service'
import type { CreateAccountingEntry, UpdateAccountingEntry } from '../types/entities'

const KEY = ['accounting']

export function useAccounting() {
  return useQuery({ queryKey: KEY, queryFn: accountingService.getAll })
}

export function useCreateAccountingEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateAccountingEntry) => accountingService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  })
}

export function useUpdateAccountingEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAccountingEntry }) =>
      accountingService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  })
}

export function useDeleteAccountingEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => accountingService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  })
}
