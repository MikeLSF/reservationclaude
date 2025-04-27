export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-500 text-sm">
              &copy; {currentYear} Location d&apos;Appartement. Tous droits réservés.
            </p>
          </div>
          <div className="flex space-x-6">
            <a
              href="#"
              className="text-gray-500 hover:text-gray-700"
              aria-label="Privacy Policy"
            >
              Politique de Confidentialité
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-gray-700"
              aria-label="Terms of Service"
            >
              Conditions d&apos;Utilisation
            </a>
            <a
              href="#"
              className="text-gray-500 hover:text-gray-700"
              aria-label="Contact Us"
            >
              Nous Contacter
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
