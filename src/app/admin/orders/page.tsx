import type { Metadata } from "next";

import { AdminComingSoon, AdminPageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Orders" };

// Blocking on purpose: see the admin layout.
export const instant = false;

export default async function AdminOrdersPage() {
  await requireAdmin("/admin/orders");

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader title="Orders" description="View customer orders." />
      <AdminComingSoon />
    </div>
  );
}
