"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";

interface ApartmentInfo {
  id: string;
  title: string;
  description: string;
  rules: string;
  amenities: string;
  createdAt: string;
  updatedAt: string;
}

export default function ApartmentInfoPage() {
  const { showToast } = useToast();
  const [apartmentInfo, setApartmentInfo] = useState<ApartmentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [amenities, setAmenities] = useState("");

  useEffect(() => {
    fetchApartmentInfo();
  }, []);

  const fetchApartmentInfo = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/apartment-info");
      if (!response.ok) {
        throw new Error("Failed to fetch apartment info");
      }

      const data = await response.json();
      setApartmentInfo(data);
      
      // Initialize form state
      setTitle(data.title);
      setDescription(data.description);
      setRules(data.rules);
      setAmenities(data.amenities);
    } catch (error) {
      console.error("Error fetching apartment info:", error);
      setError("Failed to load apartment info. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/apartment-info", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          rules,
          amenities,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update apartment info");
      }

      const updatedData = await response.json();
      setApartmentInfo(updatedData);
      setSuccessMessage("Informations mises à jour avec succès");
      showToast("Informations mises à jour avec succès", "success");
    } catch (error: unknown) {
      console.error("Error updating apartment info:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update apartment info. Please try again.";
      setError(errorMessage);
      showToast("Erreur lors de la mise à jour", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Informations sur l&apos;Appartement</h1>
          <Link href="/admin">
            <Button variant="outline">Retour au Tableau de Bord</Button>
          </Link>
        </div>
        <p className="text-gray-600">
          Personnalisez les informations affichées sur la page d&apos;accueil
        </p>
      </div>

      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-md p-3">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-md p-3">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Chargement des informations...</p>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Titre de la section"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: À propos de notre appartement"
              required
            />

            <Textarea
              label="Description de l'appartement"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre appartement..."
              rows={5}
              required
            />

            <Textarea
              label="Règles de réservation"
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="Listez les règles de réservation..."
              rows={5}
              required
            />

            <Textarea
              label="Équipements"
              value={amenities}
              onChange={(e) => setAmenities(e.target.value)}
              placeholder="Listez les équipements disponibles (un par ligne)..."
              rows={8}
              required
            />

            <div className="flex space-x-4 pt-4">
              <Button type="submit" isLoading={isSubmitting}>
                Enregistrer les modifications
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (apartmentInfo) {
                    setTitle(apartmentInfo.title);
                    setDescription(apartmentInfo.description);
                    setRules(apartmentInfo.rules);
                    setAmenities(apartmentInfo.amenities);
                  }
                }}
              >
                Annuler
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-lg font-medium text-blue-800 mb-2">Conseils de mise en forme</h3>
        <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
          <li>
            Pour la section <strong>Équipements</strong>, écrivez un équipement par ligne pour qu&apos;ils s&apos;affichent correctement dans la liste à puces.
          </li>
          <li>
            Pour la section <strong>Règles de réservation</strong>, vous pouvez utiliser des tirets (-) au début des lignes pour créer une liste à puces.
          </li>
          <li>
            Les modifications seront immédiatement visibles sur la page d&apos;accueil après l&apos;enregistrement.
          </li>
        </ul>
      </div>
    </div>
  );
}
