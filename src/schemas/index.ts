import { z } from "zod";

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
