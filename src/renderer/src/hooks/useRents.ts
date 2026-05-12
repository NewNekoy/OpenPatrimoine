import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rentsService } from '../services/rents.service'
import type { CreateRentPayment, UpdateRentPayment } from '../types/entities'

const KEY = ['rents']

export function useRents() {
  return useQuery({ queryKey: KEY, queryFn: rentsService.getAll })
}

export function useCreateRent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateRentPayment) => rentsService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  })
}

export function useUpdateRent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRentPayment }) =>
      rentsService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  })
}

export function useDeleteRent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => rentsService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  })
}
