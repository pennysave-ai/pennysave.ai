import { Prisma } from "@prisma/client";

// Return the same fields for GET/POST/PUT requests
export const categorySelect = {
  id: true,
  name: true,
  description: true,
  icon: true,
  archivedAt: true,
  owner: {
    select: { id: true, name: true, image: true, email: true },
  },
} satisfies Prisma.CategorySelect;

