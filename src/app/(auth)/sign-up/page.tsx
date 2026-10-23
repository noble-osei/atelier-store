import type { Metadata } from "next";
import { Suspense } from "react";

import { FormSkeleton } from "@/components/auth/form-skeleton";
import { RedirectIfSignedIn } from "@/components/auth/redirect-if-signed-in";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false },
};

export default function SignUpPage() {
  return (
    <section className="section container-prose flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <p className="type-eyebrow">Account</p>
        <h1 className="type-editorial text-display">Create account</h1>
      </header>
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
      <Suspense fallback={<FormSkeleton fields={3} />}>
        <SignUpForm />
      </Suspense>
    </section>
  );
}
