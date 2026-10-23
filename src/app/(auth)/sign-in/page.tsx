import type { Metadata } from "next";
import { Suspense } from "react";

import { FormSkeleton } from "@/components/auth/form-skeleton";
import { RedirectIfSignedIn } from "@/components/auth/redirect-if-signed-in";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

// Static shell; the form reads the `next` search param and the redirect reads
// the session, so both stream in behind Suspense.
export default function SignInPage() {
  return (
    <section className="section container-prose flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <p className="type-eyebrow">Account</p>
        <h1 className="type-editorial text-display">Sign in</h1>
      </header>
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
      <Suspense fallback={<FormSkeleton fields={2} />}>
        <SignInForm />
      </Suspense>
    </section>
  );
}
