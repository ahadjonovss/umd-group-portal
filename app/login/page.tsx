import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Kirish — UMD GROUP" };

export default function LoginPage() {
  return (
    <AuthShell
      title="Xush kelibsiz"
      subtitle="Hisobingizga kiring"
      footer={
        <>
          Hisobingiz yo&apos;qmi?{" "}
          <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700">
            Ro&apos;yxatdan o&apos;tish
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
