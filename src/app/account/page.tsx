import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { DetailList, DetailListSkeleton } from "@/components/account/detail-list";
import { ArrowRightIcon } from "@/components/icons";
import { isAdmin, requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false },
};

// Static shell; the session read streams in behind Suspense. Every page under
// /account must call requireUser itself.
export default function AccountPage() {
  return (
    <Suspense fallback={<DetailListSkeleton rows={2} />}>
      <AccountOverview />
    </Suspense>
  );
}

async function AccountOverview() {
  const { user } = await requireUser("/account");

  return (
    <div className="flex flex-col gap-8">
      <h2 className="type-editorial text-heading">Welcome, {user.name.split(" ")[0]}</h2>
      <DetailList
        items={[
          { label: "Name", value: user.name },
          { label: "Email", value: user.email },
        ]}
      />
      <ul className="flex flex-col">
        <li>
          <AccountLink href="/account/orders" label="Order history" />
        </li>
        <li>
          <AccountLink href="/account/details" label="Personal details" />
        </li>
        {isAdmin(user) ? (
          <li>
            <AccountLink href="/admin" label="Admin area" />
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function AccountLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-14 items-center justify-between border-b border-line text-body-lg"
    >
      {label}
      <ArrowRightIcon />
    </Link>
  );
}
