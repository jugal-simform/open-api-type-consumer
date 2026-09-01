import { useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api/client'

export function useBlogs() {
  return api.useQuery('get', '/blogs')
}

export function useBlog(id: string) {
  return api.useQuery('get', '/blogs/{id}', { params: { path: { id } } })
}

export function useCreateBlog() {
  const queryClient = useQueryClient()
  return api.useMutation('post', '/blogs', {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['get', '/blogs'] })
    },
  })
}

export function useUpdateBlog() {
  const queryClient = useQueryClient()
  return api.useMutation('put', '/blogs/{id}', {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['get', '/blogs'] })
    },
  })
}

export function useDeleteBlog() {
  const queryClient = useQueryClient()
  return api.useMutation('delete', '/blogs/{id}', {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['get', '/blogs'] })
    },
  })
}
