import { Toaster } from "@/components/ui/sonner";
import { CertificateGenerator } from "@/components/certificate-generator";
import { Logo } from "@/components/ui/logo";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 text-center flex flex-col items-center">
          <Logo className="h-16 w-16 mb-4 shadow-sm" />
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-4">
            CertiGen <span className="text-blue-600">PH</span>
          </h1>
          <h2 className="text-xl font-medium text-slate-700 mb-2">Free Bulk Certificate Generator</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Generate 100% accurate certificates in bulk from your Word templates and Excel/CSV data. 
            No more manual editing—just upload, map, and download.
          </p>
        </header>

        <CertificateGenerator />
      </div>
      <Toaster />
    </main>
  );
}
