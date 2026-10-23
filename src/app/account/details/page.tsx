import type { Metadata } from "next";
import { Suspense } from "react";

import { DetailList, DetailListSkeleton } from "@/components/account/detail-list";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Personal details",
  robots: { index: false },
};

const memberSince = new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "UTC" });

export default function AccountDetailsPage() {
  return (
    <div className="flex flex-col gap-8">
      <h2 className="type-editorial text-heading">Personal details</h2>
      <Suspense fallback={<DetailListSkeleton rows={3} />}>
        <Details />
      </Suspense>
    </div>
  );
}

async function Details() {
  const { user } = await requireUser("/account/details");

  return (
    <DetailList
      items={[
        { label: "Name", value: user.name },
        { label: "Email", value: user.email },
        { label: "Member since", value: memberSince.format(user.createdAt) },
      ]}
    />
  );
}
