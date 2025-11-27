import { z } from "zod";
const passwordRules = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[@$!%*?&]/, "Password must contain at least one special character (@, $, !, %, *, ?, &)");
// ----------------- Register Admin Schema -----------------
export const registerAdminSchema = z.object({
  adminName: z.string().min(3, "Name must be at least 3 characters"),
  adminEmail: z.string().email("Invalid email address"),
  adminPassword: passwordRules,
  adminRole: z.enum(["super-admin", "admin-analyst", "admin-factory", "admin-store", "admin-buyer"]).optional().default("super-admin"),
  phoneNumber: z.string().optional(),
  adminAddress: z.string().optional()
});

// ----------------- Login Admin Schema -----------------
export const loginAdminSchema = z.object({
  adminEmail: z.string().email("Invalid email address"),
  adminPassword: z.string().min(6, "Password must be at least 6 characters")
});


// ----------------- Reset Password Schema -----------------
export const resetPasswordSchema = z.object({
  adminPassword: passwordRules
});
