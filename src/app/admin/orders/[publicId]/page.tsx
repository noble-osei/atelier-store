import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminComingSoon, AdminPageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Order" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Blocking on purpose: see the admin layout.
export const instant = false;

export default async function AdminOrderPage({
  params,
}: PageProps<"/admin/orders/[publicId]">) {
  // Role check first, then the URL (see the product edit page).
  const { publicId } = await params;
  await requireAdmin(`/admin/orders/${publicId}`);
  if (!UUID.test(publicId)) notFound();

  return (
    <div className="flex flex-col gap-8">
      <Link href="/admin/orders" className="link-quiet self-start text-body-sm">
        All orders
      </Link>
      <AdminPageHeader title="Order" />
      <AdminComingSoon />
    </div>
  );
}
