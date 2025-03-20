import {
  useQueryClient,
  useMutation,
  useQuery,
  type QueryKey,
  type Query,
  type QueryClient,
} from "@tanstack/react-query";
import { addToast } from "@heroui/toast";

const onSuccess = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({
    predicate: (query: Query<unknown, Error, unknown, QueryKey>) =>
      query.queryKey.includes("accounts"),
  });
};

export const useGetStripeToken = () => {
  const query = useQuery({
    enabled: false,
    queryKey: ["stripe", "createFcSession"],
    queryFn: async () => {
      const response = await fetch("api/stripe/create-fc-session");
      if (!response.ok) {
        throw new Error("Failed to create financial connection session");
      }
      return await response.json();
    },
  });
  return query;
};

export const useDeleteStripeAccounts = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (institutionName: string) => {
      const response = await fetch("/api/stripe/account", {
        method: "DELETE",
        body: JSON.stringify({ institutionName }),
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

export const useCreateCheckoutSession = () => {
  const mutation = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
      });
      console.log("response->", response);
      if (!response.ok) {
        addToast({
          timeout: 10000,
          title: "Ooops!",
          description:
            "Something went wrong, and we could not create a checkout session, Please try again",
          color: "danger",
        });
      }
      return await response.json();
    },
  });
  return mutation;
};
