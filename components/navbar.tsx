"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CoffeeLogo } from "@/components/coffee-logo";

const links = [
  { href: "/library", label: "Library" },
  { href: "/books/new", label: "New Book" },
  { href: "/about", label: "About" },
];

type NavItemProps = {
  href: string;
  label: string;
};

function NavItem({ href, label }: NavItemProps) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      key={label}
      href={href}
      className={`nav-link-base ${isActive ? "nav-link-active" : "nav-link-inactive"}`}
    >
      {label}
    </Link>
  );
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e4c6a5]/70 bg-[rgba(255,250,244,0.85)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <CoffeeLogo className="h-10 w-10" />
          <div>
            <p className="font-semibold text-[#4a2a1d]">BookFlix</p>
            <p className="text-sm text-[#7a4d33]">Coffee & stories</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <NavItem key={link.href} href={link.href} label={link.label} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="rounded-full border border-[#c99a6b] bg-white/70 px-4 py-2 text-sm font-medium text-[#6d3f2a] transition hover:bg-[#f7ebde]">
                Sign in
              </button>
            </SignInButton>
          </Show>

          <Show when="signed-in">
            <UserButton />
          </Show>

          <Link
            href="#discover"
            className="rounded-full border border-[#c99a6b] bg-white/70 px-4 py-2 text-sm font-medium text-[#6d3f2a] transition hover:bg-[#f7ebde]"
          >
            Discover
          </Link>
        </div>
      </div>
    </header>
  );
}
