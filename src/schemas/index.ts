import { z } from "zod";
import { parseISO, isValid } from "date-fns";
import { BudgetFrequency } from "@prisma/client";

// Define a schema for the user's sign-in data
export const signInSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email cannot be empty" })
    .email("This is not a valid email."),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(16, { message: "Password cannot be longer than 16 characters" })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, {
      message: "Password must contain at least one special character",
    }),
});

// Define a schema for the user's sign-up data extending the sign-in schema
export const signUpSchema = signInSchema
  .extend({
    username: z.string().min(1, { message: "Name cannot be empty" }),
    password2: z.string(),
  })
  .refine((data) => data.password === data.password2, {
    message: "Passwords do not match",
    path: ["password2"],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email cannot be empty" })
    .email("This is not a valid email."),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(16, { message: "Password cannot be longer than 16 characters" })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, {
      message: "Password must contain at least one special character",
    }),
  password2: z.string(),
});

export const accountSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(3, { message: "The name must be longer than 3 symbols" }),
  currencyId: z.string().min(1, { message: "Currency cannot be empty" }),
});

export const categorySchema = z.object({
  name: z.string().min(1, { message: "Name cannot be empty" }),
  description: z
    .string()
    .max(160, {
      message: "Description cannot be longer than 160 characters",
    })
    .optional(),
});

export const getTransactionsSchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-(0?[1-9]|1[0-2])-(0?[1-9]|[12]\d|3[01])$/, {
      message: "From date must be in yyyy-mm-dd format",
    })
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-(0?[1-9]|1[0-2])-(0?[1-9]|[12]\d|3[01])$/, {
      message: "To date must be in yyyy-mm-dd format",
    })
    .optional(),
  accountId: z.string().uuid().optional(),
});

export const updateTransactionSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  categoryId: z.string().uuid().nullable().optional(),
  createdAt: z
    .string()
    .min(1, { message: "Date cannot be empty" })
    .refine(
      (val) => {
        const date = parseISO(val);
        return isValid(date) && date.getFullYear() >= 1900;
      },
      {
        message: "Invalid date, date must be after year 1900",
      }
    ),
  payee: z.string().optional(),
  amount: z.number(),
  notes: z.string().optional(),
});

export const createTransactionSchema = z.object({
  id: z.string(),
  accountId: z
    .string()
    .uuid()
    .min(1, { message: "Account cannot be empty" })
    .describe("an account id from UserAccount table"),
  categoryId: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .describe("category id from Category table"),
  createdAt: z
    .string()
    .min(1, { message: "Date cannot be empty" })
    .refine(
      (val) => {
        const date = parseISO(val);
        return isValid(date) && date.getFullYear() >= 1900;
      },
      {
        message: "Invalid date, date must be after year 1900",
      }
    ),
  payee: z.string().optional().describe("payee name"),
  amount: z
    .number()
    .refine((val) => val !== 0, {
      message: "Amount must be a non-zero number",
    })
    .describe("transaction amount positive for income or negative for expense"),
  notes: z.string().optional().describe("transaction notes"),
});

export const createTransactionsSchema = createTransactionSchema.omit({
  id: true,
});

export const bulkCreateTransactionsSchema = createTransactionsSchema.omit({
  categoryId: true,
});

export const createBudgetSchema = z.object({
  name: z.string().min(1, { message: "Budget name cannot be empty" }),
  totalAmount: z
    .number()
    .min(0, { message: "Total amount must be a positive number" }),
  currencyId: z.string().min(1, { message: "Currency cannot be empty" }),
  frequency: z.nativeEnum(BudgetFrequency),
  accounts: z.array(z.string().uuid()),
  budgetAllocations: z.array(
    z.object({ categoryId: z.string().uuid(), allocatedAmount: z.number() })
  ),
});
