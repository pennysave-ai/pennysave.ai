import {
  useQueryClient,
  useMutation,
  useQuery,
  type QueryKey,
  type Query,
  type QueryClient,
} from "@tanstack/react-query";

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

export const useGetTransactions = ({
  sortBy,
  sortDirection,
  globalFilter,
  page,
  start,
  end,
  pageSize,
}: {
  sortBy: string;
  sortDirection: "ascending" | "descending";
  globalFilter: string;
  page: string;
  pageSize: string;
  start: string;
  end: string;
}) => {
  return useQuery({
    queryKey: [
      "transactions",
      {
        sortBy,
        sortDirection,
        globalFilter,
        page,
        start,
        end,
        pageSize,
      },
    ],
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnMount: false,
    queryFn: async ({ queryKey }) => {
      const [, queryParams] = queryKey;
      console.log("Query Params:", queryParams);
      const response = await fetch(
        `/api/transactions?${new URLSearchParams(queryParams)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }
      const { data, meta } = await response.json();
      return { data, meta } as { data: TransactionResponseItem[]; meta: Meta };
    },
  });
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
