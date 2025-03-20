import {
  useQueryClient,
  useMutation,
  useQuery,
  type QueryKey,
  type Query,
  type QueryClient,
} from "@tanstack/react-query";

import { useSearchParams } from "next/navigation";

const onSuccess = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({
    predicate: (query: Query<unknown, Error, unknown, QueryKey>) =>
      query.queryKey.includes("transactions") ||
      query.queryKey.includes("summary"),
  });
};

export type CreateTransaction = {
  amount: number;
  payee?: string;
  notes?: string;
  accountId: string;
  categoryId?: string | null;
  createdAt: string;
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (transaction: CreateTransaction) => {
      const response = await fetch("/api/transactions", {
        method: "POST",
        body: JSON.stringify(transaction),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return await response.json();
    },
    onSuccess: () => onSuccess(queryClient),
  });
  return mutation;
};

// TODO: Add onError handler to all mutations and queries
// TODO: Add toast notifications to all mutations and queries
// when the componet will be ready
export const useBulkCreateTransactions = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (transactions: CreateTransaction[]) => {
      const response = await fetch("/api/transactions/bulk-create", {
        method: "POST",
        body: JSON.stringify(transactions),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return await response.json();
    },
    onSuccess: () => onSuccess(queryClient),
  });
  return mutation;
};

export type TransactionResponseItem = {
  id: string;
  amount: number;
  payee: string;
  notes?: string;
  createdAt: string;
  account: {
    id: string;
    name: string;
    currency: {
      symbol: string;
      name: string;
    };
    institution: {
      name: string | null;
    };
    last4: string | null;
  };
  category: {
    id: string | null;
    name: string;
  };
};

type Meta = {
  count: number;
};

export const useGetTransactions = () => {
  const params = useSearchParams();
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const accountId = params.get("accountId") || "";
  const queryParams = new URLSearchParams();

  if (from) queryParams.append("from", from);
  if (to) queryParams.append("to", to);
  if (accountId) queryParams.append("accountId", accountId);

  const url =
    queryParams.size > 0
      ? `/api/transactions?${queryParams.toString()}`
      : "/api/transactions";
  const query = useQuery({
    queryKey: ["transactions", { from, to, accountId }],
    queryFn: async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }
      const { data, meta } = await response.json();
      return { data, meta } as { data: TransactionResponseItem[]; meta: Meta };
    },
  });
  return query;
};

export const useGetTransaction = (id: string) => {
  const query = useQuery({
    queryKey: ["transaction", { id }],
    queryFn: async () => {
      const response = await fetch(`/api/transactions/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch transaction");
      }
      return await response.json();
    },
  });
  return query;
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch("/api/transactions", {
        method: "DELETE",
        body: JSON.stringify({ ids }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return await response.json();
    },
    onSuccess: () => onSuccess(queryClient),
  });
  return mutation;
};

export type UpdateTransaction = {
  id: string;
  amount: number;
  payee: string;
  notes?: string;
  accountId: string;
  categoryId: string | null;
  createdAt: string;
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (payload: UpdateTransaction) => {
      const response = await fetch("/api/transactions", {
        method: "PATCH",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return await response.json();
    },
    onSuccess: () => onSuccess(queryClient),
  });
  return mutation;
};
