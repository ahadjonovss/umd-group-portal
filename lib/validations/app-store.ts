import { z } from "zod";
import type { Dict } from "@/lib/i18n";

export const makeAppStoreStep1Schema = (t: Dict) =>
  z.object({
    fullName: z.string().min(2, t.validation.fullNameMin),
    phone: z.string().min(1, t.validation.phoneRequired),
    email: z.string().email(t.validation.emailInvalid),
    telegram: z.string().optional(),
  });

export const makeAppStoreStep2Schema = (t: Dict) =>
  z.object({
    appName: z
      .string()
      .min(1, t.validation.appNameRequired)
      .max(30, t.validation.appNameMax),
    subtitle: z
      .string()
      .min(1, t.validation.subtitleRequired)
      .max(30, t.validation.subtitleMax),
    fullDescription: z
      .string()
      .min(1, t.validation.fullDescRequired)
      .max(4000, t.validation.fullDescMax),
    privacyPolicyUrl: z
      .string()
      .url(t.validation.urlInvalid)
      .refine((url) => url.startsWith("https://"), t.validation.urlHttps),
    supportUrl: z
      .string()
      .url(t.validation.urlInvalid)
      .refine((url) => url.startsWith("https://"), t.validation.urlHttps),
  });

export const makeAppStoreStep3Schema = (t: Dict) =>
  z.object({
    githubRepoUrl: z.string().url(t.validation.githubUrlInvalid),
  });

export const appStoreStep5Schema = z.object({
  testLogin: z.string().optional(),
  testPassword: z.string().optional(),
  note: z.string().optional(),
});

export type AppStoreStep1 = z.infer<ReturnType<typeof makeAppStoreStep1Schema>>;
export type AppStoreStep2 = z.infer<ReturnType<typeof makeAppStoreStep2Schema>>;
export type AppStoreStep3 = z.infer<ReturnType<typeof makeAppStoreStep3Schema>>;
export type AppStoreStep5 = z.infer<typeof appStoreStep5Schema>;
