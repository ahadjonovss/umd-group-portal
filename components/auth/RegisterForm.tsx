"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { registerWithEmail, authErrorMessage } from "@/lib/auth/client";

// Telegram username: 5–32 belgi, harf/raqam/pastki chiziq (@ ixtiyoriy)
const TG_RE = /^@?[A-Za-z0-9_]{5,32}$/;

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/panel";

  const [fullName, setFullName] = useState("");
  const [telegram, setTelegram] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (fullName.trim().length < 2) return setError("To'liq ismni kiriting");
    if (!TG_RE.test(telegram.trim())) return setError("Telegram username: @ bilan, 5–32 belgi (harf, raqam, _)");
    if (password.length < 6) return setError("Parol kamida 6 belgi bo'lishi kerak");

    // @ belgisisiz, toza username saqlaymiz
    const tgUsername = telegram.trim().replace(/^@/, "");

    setLoading(true);
    try {
      await registerWithEmail({
        fullName: fullName.trim(),
        telegram: tgUsername,
        email: email.trim(),
        password,
      });
      router.push(next);
      router.refresh();
    } catch (err) {
      if (err instanceof FirebaseError) setError(authErrorMessage(err.code));
      else setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input
        label="To'liq ism"
        required
        autoComplete="name"
        placeholder="Sardor Abdullayev"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <Input
        label="Telegram username"
        required
        autoComplete="off"
        placeholder="@username"
        value={telegram}
        onChange={(e) => setTelegram(e.target.value)}
      />
      <Input
        label="Email"
        type="email"
        required
        autoComplete="email"
        placeholder="email@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <PasswordInput
        label="Parol"
        required
        autoComplete="new-password"
        placeholder="Kamida 6 belgi"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">❌ {error}</p>}
      <Button type="submit" size="lg" loading={loading} className="w-full">
        Ro&apos;yxatdan o&apos;tish
      </Button>
    </form>
  );
}
