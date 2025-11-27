import { z } from "zod";

// 🧱 Step 1: Define common password rules
const passwordRules = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[@$!%*?&]/, "Password must contain at least one special character (@, $, !, %, *, ?, &)");

// 🧱 Step 2: Register schema
const registerSchema = z.object({
  userName: z.string().min(3, "Name must be at least 3 characters long"),
  userEmail: z.email("Invalid email"),
  userPassword: passwordRules,
  userRole: z.enum(["buyer", "store-admin", "factory-admin"]).default("buyer").optional(),
  phoneNumber: z
    .string()
    .regex(/^(\+92|0)?3[0-9]{9}$/, "Invalid Pakistani phone number format"),
  userAddress: z.string().min(10, "Address must be at least 10 characters long").optional(),
});

// 🧱 Step 3: Login schema
const loginSchema = z.object({
  userEmail: z.string().email("Invalid email"),
  userPassword: z.string().min(8, "Password must be at least 8 characters long"),
});

// 🧱 Step 4: Reset password schema (same rules as registration)
const resetPasswordSchema = z.object({
  userPassword: passwordRules,
});

export { registerSchema, loginSchema, resetPasswordSchema };
