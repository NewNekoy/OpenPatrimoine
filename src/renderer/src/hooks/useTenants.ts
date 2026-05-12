import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tenantsService } from '../services/tenants.service'
import type { CreateTenant, UpdateTenant } from '../types/entities'

const KEY = ['tenants']

export function useTenants() {
  return useQuery({ queryKey: KEY, queryFn: tenantsService.getAll })
}

export function useTenant(id: string) {
  return useQuery({ queryKey: [...KEY, id], queryFn: () => tenantsService.getById(id) })
}

export function useCreateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTenant) => tenantsService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  })
}

export function useUpdateTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTenant }) =>
      tenantsService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  })
}

export function useDeleteTenant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tenantsService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  })
}
