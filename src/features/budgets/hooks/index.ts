import {
  useQueryClient,
  useMutation,
  useQuery,
  type QueryKey,
  type Query,
  type QueryClient,
} from "@tanstack/react-query";
import { addToast } from "@heroui/toast";

import { Budget } from "@/data/budgets";

const onSuccess = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({
    predicate: (query: Query<unknown, Error, unknown, QueryKey>) =>
      query.queryKey.includes("budgets"),
  });
};

export const useGetBudgets = ({
  start = null,
  end = null,
}: {
  start?: string | null;
  end?: string | null;
}) => {
  const queryParams = new URLSearchParams();

  if (start) queryParams.append("start", start);
  if (end) queryParams.append("end", end);
  const query = useQuery({
    queryKey: ["budgets", { start, end }],
    queryFn: async () => {
      const response = await fetch(`/api/budgets?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }
      const { data } = await response.json();
      return data;
    },
  });
  return query;
};

export const useCreateBudget = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (account: Budget) => {
      const response = await fetch("/api/budgets", {
        method: "POST",
        body: JSON.stringify(account),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        addToast({
          title: "Ooops!",
          description: "We have failed to create budget, please try again",
          color: "danger",
        });
        return;
      }
      return await response.json();
    },
    onSuccess: () => onSuccess(queryClient),
  });
  return mutation;
};

export const useUpdateBudget = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (budget: Budget) => {
      const response = await fetch("/api/budgets", {
        method: "PATCH",
        body: JSON.stringify(budget),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        addToast({
          title: "Ooops!",
          description: "We have failed to update budget, please try again",
          color: "danger",
        });
        return;
      }
      return await response.json();
    },
    onSuccess: () => onSuccess(queryClient),
  });
  return mutation;
};

export const useDeleteBudget = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch("/api/budgets", {
        method: "DELETE",
        body: JSON.stringify({ id }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        addToast({
          title: "Ooops!",
          description: "We have failed to delete budgets, please try again",
          color: "danger",
        });
        return;
      }
      return await response.json();
    },
    onSuccess: () => onSuccess(queryClient),
  });
  return mutation;
};

export const useToggleBudgetNotifications = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (budget: { id: string; enable: boolean }) => {
      const response = await fetch("/api/budgets/enable-notifications", {
        method: "PATCH",
        body: JSON.stringify(budget),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        addToast({
          title: "Ooops!",
          description:
            "We have failed to update budget notifications, please try again",
          color: "danger",
        });
        return;
      }
      return await response.json();
    },
    onSuccess: () => onSuccess(queryClient),
  });
  return mutation;
};
