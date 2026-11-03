import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { demo, getJson } from './api'

export type ModelPayer = 'included' | 'own' | 'both'
export type ModelSettings = { payer: ModelPayer; ownConnected: boolean }
const example: ModelSettings = { payer: 'included', ownConnected: false }
export function useModelSettings() {
  return useQuery({
    queryKey: ['model-settings'],
    queryFn: () =>
      demo
        ? Promise.resolve(example)
        : getJson<ModelSettings>('/api/model-settings'),
  })
}
export function usePreviewModelSettings() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (payer: ModelPayer) => {
      if (!demo)
        throw new Error(
          'Model settings are not connected. Try again after the service is connected.'
        )
      const current = client.getQueryData<ModelSettings>(['model-settings'])
      if (!current)
        throw new Error('Model settings did not load. Reload and try again.')
      const next = { ...current, payer }
      client.setQueryData(['model-settings'], next)
      return next
    },
  })
}
