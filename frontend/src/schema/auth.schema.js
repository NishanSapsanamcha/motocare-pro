import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string()
  .min(2, "Full name must be at least 2 characters")
  .max(36, "Full name must not exceed 36 characters"),
  email: z.string().email("Please enter valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(64, "Password too long"),
  confirmPassword: z.string().min(8, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Please enter valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
