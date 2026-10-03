"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { loginWithEmail, authErrorMessage } from "@/lib/auth/client";
import { useT } from "@/components/i18n/LanguageProvider";

export function LoginForm() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/panel";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginWithEmail(email.trim(), password);
      router.push(next);
      router.refresh();
    } catch (err) {
      if (err instanceof FirebaseError) setError(authErrorMessage(err.code, t));
      else setError(err instanceof Error ? err.message : t.auth.errors.generic);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input
        label={t.auth.email}
        type="email"
        required
        autoComplete="email"
        placeholder="email@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <PasswordInput
        label={t.auth.password}
        required
        autoComplete="current-password"
        placeholder={t.auth.passwordPlaceholder}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">❌ {error}</p>}
      <Button type="submit" size="lg" loading={loading} className="w-full">
        {t.auth.submitLogin}
      </Button>
    </form>
  );
}
