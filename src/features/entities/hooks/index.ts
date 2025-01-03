import { useQuery } from "@tanstack/react-query";

export const useGetEntities = () => {
  const query = useQuery({
    queryKey: ["categories", "accounts", "transactions"],
    queryFn: async () => {
      const response = await fetch("/api/entities");
      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }
      const data = await response.json();
      return data;
    },
  });
  return query;
};
