import { PlayMarketForm } from "@/components/forms/PlayMarketForm";
import { FormPageLayout } from "@/components/FormPageLayout";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Play Market Joylashtirish — UMD GROUP" };

export default function PlayMarketPage() {
  return (
    <FormPageLayout
      title="Play Market — Ilova Joylashtirish"
      subtitle="Android ilovangizni Google Play Market-ga chiqarish"
    >
      <PlayMarketForm />
    </FormPageLayout>
  );
}
