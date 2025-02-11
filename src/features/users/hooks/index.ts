import { useMutation } from "@tanstack/react-query";

export const useUpdateNotifiactionPreferences = () => {
  const mutation = useMutation({
    mutationFn: async (notifications: { monthlyReports: boolean }) => {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        body: JSON.stringify(notifications),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return await response.json();
    },
  });
  return mutation;
};
