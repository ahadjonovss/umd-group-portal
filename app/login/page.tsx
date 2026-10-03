import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { MiniAppAutoLogin } from "@/components/auth/MiniAppAutoLogin";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.auth.loginMeta };
}

export default async function LoginPage() {
  const t = await getT();
  return (
    <AuthShell
      title={t.auth.loginTitle}
      subtitle={t.auth.loginSubtitle}
      footer={
        <>
          {t.auth.noAccount}{" "}
          <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700">
            {t.auth.registerLink}
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <MiniAppAutoLogin />
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
