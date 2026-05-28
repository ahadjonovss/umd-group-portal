import { z } from "zod";

export const appStoreStep1Schema = z.object({
  fullName: z.string().min(2, "To'liq ism kamida 2 belgi bo'lishi kerak"),
  phone: z.string().min(1, "Telefon raqami majburiy"),
  email: z.string().email("Noto'g'ri email format"),
});

export const appStoreStep2Schema = z.object({
  appName: z
    .string()
    .min(1, "Ilova nomi majburiy")
    .max(30, "Ilova nomi max 30 belgi"),
  subtitle: z
    .string()
    .min(1, "Subtitle majburiy")
    .max(30, "Subtitle max 30 belgi"),
  fullDescription: z
    .string()
    .min(1, "To'liq tavsif majburiy")
    .max(4000, "To'liq tavsif max 4000 belgi"),
  privacyPolicyUrl: z
    .string()
    .url("To'g'ri URL kiriting")
    .refine((url) => url.startsWith("https://"), "URL HTTPS bo'lishi shart"),
});

export const appStoreStep3Schema = z.object({
  githubRepoUrl: z.string().url("To'g'ri GitHub URL kiriting"),
  githubUsername: z.string().min(1, "GitHub username majburiy"),
  certificatePassword: z.string().min(1, "Sertifikat paroli majburiy"),
  bundleId: z
    .string()
    .regex(
      /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)+$/,
      "Format: com.company.appname"
    ),
});

export const appStoreStep5Schema = z.object({
  testLogin: z.string().optional(),
  testPassword: z.string().optional(),
  note: z.string().optional(),
});

export type AppStoreStep1 = z.infer<typeof appStoreStep1Schema>;
export type AppStoreStep2 = z.infer<typeof appStoreStep2Schema>;
export type AppStoreStep3 = z.infer<typeof appStoreStep3Schema>;
export type AppStoreStep5 = z.infer<typeof appStoreStep5Schema>;
