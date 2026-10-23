import { SignOutButton } from "@/components/auth/sign-out-button";
import { AccountNav } from "@/components/account/account-nav";

// Static shell shared by every /account page. It reads no session: each page
// calls requireUser itself, because layouts are not re-run on every navigation.
export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <section className="section container-narrow flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <p className="type-eyebrow">Account</p>
        <h1 className="type-editorial text-display">My account</h1>
      </header>
      <div className="flex flex-col gap-8 md:grid md:grid-cols-[12rem_minmax(0,1fr)] md:gap-x-12">
        <AccountNav />
        <div className="flex min-w-0 flex-col gap-10">
          {children}
          <div>
            <SignOutButton />
          </div>
        </div>
      </div>
    </section>
  );
}
