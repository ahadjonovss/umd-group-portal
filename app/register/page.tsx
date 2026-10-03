import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.auth.registerMeta };
}

export default async function RegisterPage() {
  const t = await getT();
  return (
    <AuthShell
      title={t.auth.registerTitle}
      subtitle={t.auth.registerSubtitle}
      footer={
        <>
          {t.auth.hasAccount}{" "}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
            {t.auth.loginLink}
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
