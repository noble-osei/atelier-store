"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.replace("/");
          router.refresh();
        },
      },
    });
    setPending(false);
  }

  return (
    <button type="button" onClick={onClick} disabled={pending} className="btn btn-secondary">
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
