import { PlayMarketForm } from "@/components/forms/PlayMarketForm";
import { FormPageLayout } from "@/components/FormPageLayout";
import { getPricing } from "@/lib/firestore/settings";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Play Market Joylashtirish — UMD GROUP" };
export const dynamic = "force-dynamic";

export default async function PlayMarketPage() {
  const pricing = await getPricing();
  return (
    <FormPageLayout
      title="Play Market — Ilova Joylashtirish"
      subtitle="Android ilovangizni Google Play Market-ga chiqarish"
    >
      <PlayMarketForm pricing={pricing} />
    </FormPageLayout>
  );
}
