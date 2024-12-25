import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";

export type CreateCategory = {
  name: string;
  description: string;
};

export const useCreateCategory = () => {
  const queryClinet = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (category: CreateCategory) => {
      const response = await fetch("/api/categories", {
        method: "POST",
        body: JSON.stringify(category),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClinet.invalidateQueries({ queryKey: ["categories"] });
    },
  });
  return mutation;
};

export type Category = {
  id: string;
  name: string;
  description: string;
  plaidId: string[];
};

type Meta = {
  count: number;
};

export const useGetCategories = () => {
  const query = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }
      const { data, meta } = await response.json();
      return { data, meta } as { data: Category[]; meta: Meta };
    },
  });
  return query;
};

export const useDeleteCategory = () => {
  const queryClinet = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch("/api/categories", {
        method: "DELETE",
        body: JSON.stringify({ ids }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClinet.invalidateQueries({ queryKey: ["categories"] });
    },
  });
  return mutation;
};

export const useUpdateCategory = () => {
  const queryClinet = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (payload: {
      id: string | null;
      name: string;
      description: string;
    }) => {
      const { id, name, description } = payload;
      const response = await fetch("/api/categories", {
        method: "PATCH",
        body: JSON.stringify({ id, name, description }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClinet.invalidateQueries({ queryKey: ["categories"] });
    },
  });
  return mutation;
};
