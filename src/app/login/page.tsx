"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError("Email ou mot de passe invalide");
        setIsLoading(false);
        return;
      }

      router.push("/admin");
    } catch (error) {
      console.error("Login error:", error);
      setError("Une erreur s&apos;est produite lors de la connexion. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Connexion Administrateur</h1>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-md p-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Entrez votre email"
            required
          />

          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Entrez votre mot de passe"
            required
          />

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full"
          >
            Se Connecter
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Cette connexion est réservée aux administrateurs. Si vous souhaitez faire une
            réservation, veuillez vous rendre sur la{" "}
            <Link href="/" className="text-blue-600 hover:underline">
              page d&apos;accueil
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
