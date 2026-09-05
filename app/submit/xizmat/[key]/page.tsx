import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormPageLayout } from "@/components/FormPageLayout";
import { CustomServiceForm } from "@/components/forms/CustomServiceForm";
import { getCatalogByKey } from "@/lib/firestore/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }): Promise<Metadata> {
  const { key } = await params;
  const svc = await getCatalogByKey(key);
  return { title: svc ? `${svc.name} — UMD GROUP` : "Xizmat — UMD GROUP" };
}

export default async function CustomServicePage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const svc = await getCatalogByKey(key);
  // Faqat faol va "ochiq" xizmatlarga ariza yuborsa bo'ladi
  if (!svc || !svc.active || svc.scope !== "public") notFound();

  return (
    <FormPageLayout title={svc.name} subtitle={svc.description || "Ariza yuborish"}>
      <CustomServiceForm service={svc} />
    </FormPageLayout>
  );
}
