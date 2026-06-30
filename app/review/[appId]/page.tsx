import { redirect } from "next/navigation";

// Deeplink: /review/<appId> -> panelda dialog ochiladi.
export default async function ReviewDeeplinkPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  redirect(`/panel?review=${encodeURIComponent(appId)}`);
}
