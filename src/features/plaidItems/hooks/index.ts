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
      query.queryKey.includes("plaidItems") ||
      query.queryKey.includes("accounts"),
  });
};
export const useDeletePlaidItem = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch("/api/plaid", {
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

export const useUpdatePlaidItem = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (publicToken: string) => {
      const response = await fetch("/api/plaid", {
        method: "PATCH",
        body: JSON.stringify({ publicToken }),
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

export const useGetPlaidItems = () => {
  const query = useQuery({
    queryKey: ["plaidItems"],
    queryFn: async () => {
      const response = await fetch("/api/plaid");
      if (!response.ok) {
        throw new Error("Failed to fetch plaid items");
      }
      return await response.json();
    },
  });
  return query;
};

export const useGetLinkTokens = () => {
  const query = useQuery({
    enabled: false,
    queryKey: ["linkTokens"],
    queryFn: async () => {
      const response = await fetch("/api/plaid/link-tokens");
      if (!response.ok) {
        throw new Error("Failed to fetch link tokens");
      }
      return await response.json();
    },
  });
  return query;
};
