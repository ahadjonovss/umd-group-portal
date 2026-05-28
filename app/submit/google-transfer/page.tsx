import { GoogleTransferForm } from "@/components/forms/GoogleTransferForm";
import { FormPageLayout } from "@/components/FormPageLayout";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Google Play Transfer — UMD GROUP" };

export default function GoogleTransferPage() {
  return (
    <FormPageLayout
      title="Google Play — App Transfer"
      subtitle="Ilovani developer akkauntdan bizning akkauntga o'tkazish"
    >
      <GoogleTransferForm />
    </FormPageLayout>
  );
}
