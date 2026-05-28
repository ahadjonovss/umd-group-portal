import { AppleTransferForm } from "@/components/forms/AppleTransferForm";
import { FormPageLayout } from "@/components/FormPageLayout";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Apple App Store Transfer — UMD GROUP" };

export default function AppleTransferPage() {
  return (
    <FormPageLayout
      title="Apple App Store — App Transfer"
      subtitle="Ilovani App Store Connect akkauntdan bizning akkauntga o'tkazish"
    >
      <AppleTransferForm />
    </FormPageLayout>
  );
}
