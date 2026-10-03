import { GoogleTransferForm } from "@/components/forms/GoogleTransferForm";
import { FormPageLayout } from "@/components/FormPageLayout";
import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.submitPage.googleTransfer.meta };
}

export default async function GoogleTransferPage() {
  const t = await getT();
  return (
    <FormPageLayout
      title={t.submitPage.googleTransfer.title}
      subtitle={t.submitPage.googleTransfer.subtitle}
    >
      <GoogleTransferForm />
    </FormPageLayout>
  );
}
