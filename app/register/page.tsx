import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Ro'yxatdan o'tish — UMD GROUP" };

export default function RegisterPage() {
  return (
    <AuthShell
      title="Ro'yxatdan o'tish"
      subtitle="Yangi hisob yarating"
      footer={
        <>
          Hisobingiz bormi?{" "}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
            Kirish
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
