import { z } from "zod";

// Feature requests sent from the public landing page (no account needed)
export const featureRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(10, "Please tell us a little more")
    .max(2000, "Message cannot exceed 2000 characters")
    .transform((val) => val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")),
  email: z
    .union([z.literal(""), z.string().trim().email().max(254)])
    .optional()
    .transform((val) => val || undefined),
  lang: z.string().max(5).optional(),
  // Honeypot: hidden from people, so anything here likely came from a bot.
  // Checked in the route rather than rejected here, so bots get no signal.
  trap: z.string().max(500).optional(),
});
