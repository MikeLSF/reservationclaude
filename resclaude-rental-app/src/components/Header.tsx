"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "./ui/Button";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isAdmin = pathname.startsWith("/admin");
  const isLoggedIn = !!session;

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                Location d&apos;Appartement
              </Link>
            </div>
            <nav className="ml-6 flex space-x-8">
              <Link
                href="/"
                className={cn(
                  "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                  pathname === "/"
                    ? "border-blue-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                )}
              >
                Accueil
              </Link>
              {isLoggedIn && (
                <Link
                  href="/admin"
                  className={cn(
                    "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                    isAdmin
                      ? "border-blue-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  )}
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center">
            {isLoggedIn ? (
              <Button
                variant="outline"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Déconnexion
              </Button>
            ) : (
              <Link href="/login">
                <Button variant="outline">Connexion Admin</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
