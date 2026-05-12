import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { propertiesService } from '../services/properties.service'
import type { CreateProperty, UpdateProperty } from '../types/entities'

const KEY = ['properties']

export function useProperties() {
  return useQuery({ queryKey: KEY, queryFn: propertiesService.getAll })
}

export function useProperty(id: string) {
  return useQuery({ queryKey: [...KEY, id], queryFn: () => propertiesService.getById(id) })
}

export function useCreateProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateProperty) => propertiesService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  })
}

export function useUpdateProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProperty }) =>
      propertiesService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  })
}

export function useDeleteProperty() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => propertiesService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY })
  })
}
