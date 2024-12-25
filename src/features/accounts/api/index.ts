import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";

export type CreateAccount = {
  name: string;
};

export const useCreateAccount = () => {
  const queryClinet = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (account: CreateAccount) => {
      const response = await fetch("/api/accounts", {
        method: "POST",
        body: JSON.stringify(account),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClinet.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
  return mutation;
};

export type Account = {
  id: string;
  name: string;
  plaidId: string[];
};

type Meta = {
  count: number;
};

export const useGetAccounts = () => {
  const query = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const response = await fetch("/api/accounts");
      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }
      const { data, meta } = await response.json();
      return { data, meta } as { data: Account[]; meta: Meta };
    },
  });
  return query;
};

export const useDeleteAccount = () => {
  const queryClinet = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch("/api/accounts", {
        method: "DELETE",
        body: JSON.stringify({ ids }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClinet.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
  return mutation;
};

export const useUpdateAccount = () => {
  const queryClinet = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (payload: { id: string | null; name: string }) => {
      const { id, name } = payload;
      const response = await fetch("/api/accounts", {
        method: "PATCH",
        body: JSON.stringify({ id, name }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClinet.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
  return mutation;
};
