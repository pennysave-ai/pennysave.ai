import {
  useQueryClient,
  useMutation,
  useQuery,
  type QueryKey,
  type Query,
  type QueryClient,
} from "@tanstack/react-query";

export type CreateAccount = {
  name: string;
  currencyId: string;
};

const onSuccess = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({
    predicate: (query: Query<unknown, Error, unknown, QueryKey>) =>
      query.queryKey.includes("accounts") ||
      query.queryKey.includes("currencies") ||
      query.queryKey.includes("transactions"),
  });
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();
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
    onSuccess: () => onSuccess(queryClient),
  });
  return mutation;
};

export type AccountResponse = {
  id: string;
  name: string;
  plaidId?: string[];
  currency: {
    id: string;
    name: string;
    symbol: string;
  };
};

type Meta = {
  count: number;
};

export type Account = {
  id: string;
  name: string;
  currency: string;
  currencyId: string;
  currencySymbol: string;
  institution: {
    name: string | null;
    color: string | null;
    mask: string | null;
  };
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
      // Normalize the data for data Table
      const accounts = data.map((account: AccountResponse) => ({
        ...account,
        currency: account.currency.name,
        currencyId: account.currency.id,
        currencySymbol: account.currency.symbol,
      }));
      return { data: accounts, meta } as {
        data: Account[];
        meta: Meta;
      };
    },
  });
  return query;
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
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
    onSuccess: () => onSuccess(queryClient),
  });
  return mutation;
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (payload: {
      id: string | null;
      name: string;
      currencyId: string;
    }) => {
      const { id, name, currencyId } = payload;
      const response = await fetch("/api/accounts", {
        method: "PATCH",
        body: JSON.stringify({ id, name, currencyId }),
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
