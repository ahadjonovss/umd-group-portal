import { AccountForm } from "@/components/forms/AccountForm";
import { FormPageLayout } from "@/components/FormPageLayout";
import { getPricing } from "@/lib/firestore/settings";
import { getUsdRate } from "@/lib/cbu";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Developer akkaunt ochish — UMD GROUP" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const [pricing, rate] = await Promise.all([getPricing(), getUsdRate()]);
  return (
    <FormPageLayout
      title="Developer akkaunt ochish"
      subtitle="Google Play yoki App Store uchun rasmiy developer akkaunt"
    >
      <AccountForm pricing={pricing} rate={rate} />
    </FormPageLayout>
  );
}
