import type { Metadata } from "next";

import { AdminComingSoon, AdminPageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Categories" };

// Blocking on purpose: see the admin layout.
export const instant = false;

export default async function AdminCategoriesPage() {
  await requireAdmin("/admin/categories");

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader title="Categories" description="Manage the product categories." />
      <AdminComingSoon />
    </div>
  );
}
