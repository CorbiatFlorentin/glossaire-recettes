import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { Recipe, RecipeFilters, PaginatedResponse, CreateRecipeDto } from '@/types';

// Keys
export const recipeKeys = {
  all: ['recipes'] as const,
  lists: () => [...recipeKeys.all, 'list'] as const,
  list: (filters: RecipeFilters) => [...recipeKeys.lists(), filters] as const,
  detail: (id: string) => [...recipeKeys.all, 'detail', id] as const,
};

// Fetch list
export const useRecipes = (filters: RecipeFilters) =>
  useQuery({
    queryKey: recipeKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.append(k, String(v));
      });
      const { data } = await api.get<PaginatedResponse<Recipe>>(`/recipes?${params}`);
      return data;
    },
  });

// Fetch one
export const useRecipe = (id: string) =>
  useQuery({
    queryKey: recipeKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Recipe>(`/recipes/${id}`);
      return data;
    },
    enabled: !!id,
  });

// Create
export const useCreateRecipe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateRecipeDto) => {
      const { data } = await api.post<Recipe>('/recipes', dto);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recipeKeys.lists() });
      toast.success('Recette créée !');
    },
    onError: () => toast.error('Erreur lors de la création'),
  });
};

// Update
export const useUpdateRecipe = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: Partial<CreateRecipeDto>) => {
      const { data } = await api.put<Recipe>(`/recipes/${id}`, dto);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recipeKeys.lists() });
      qc.invalidateQueries({ queryKey: recipeKeys.detail(id) });
      toast.success('Recette mise à jour !');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });
};

// Delete
export const useDeleteRecipe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/recipes/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recipeKeys.lists() });
      toast.success('Recette supprimée');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });
};

// Toggle favorite
export const useToggleFavorite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch<{ id: string; favorite: boolean }>(`/recipes/${id}/favorite`);
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: recipeKeys.lists() });
      qc.invalidateQueries({ queryKey: recipeKeys.detail(data.id) });
    },
  });
};

// Upload photo
export const useUploadPhoto = (recipeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('photo', file);
      const { data } = await api.post(`/upload/${recipeId}/photos`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recipeKeys.detail(recipeId) });
      toast.success('Photo ajoutée !');
    },
    onError: () => toast.error('Erreur lors du téléversement'),
  });
};

// Delete photo
export const useDeletePhoto = (recipeId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photoId: string) => {
      await api.delete(`/upload/${recipeId}/photos/${photoId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recipeKeys.detail(recipeId) });
      toast.success('Photo supprimée');
    },
  });
};