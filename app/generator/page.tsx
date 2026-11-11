import Link from "next/link";
import { CertificateGenerator } from "@/components/certificate-generator";
import { Logo } from "@/components/ui/logo";
import { Toaster } from "@/components/ui/sonner";
import { ArrowLeft } from "lucide-react";

export default function GeneratorPage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-3 py-5 sm:px-6 sm:py-12 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[24rem] bg-[radial-gradient(ellipse_at_top,hsl(215_90%_92%/0.7),transparent_68%)] dark:bg-[radial-gradient(ellipse_at_top,hsl(221_45%_22%/0.5),transparent_68%)]" />
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:mb-8">
          <Link href="/" aria-label="Back to CertiGen PH home" className="flex items-center gap-2.5">
            <Logo className="size-9 rounded-xl" />
            <span className="text-base font-bold tracking-tight">CertiGen <span className="text-primary">PH</span></span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to home
          </Link>
        </header>
        <div className="mb-7 text-center">
          <p className="text-sm font-semibold text-primary">Certificate generator</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Create your certificates</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Follow the steps below to upload your template, add recipients, and generate your documents.</p>
        </div>
        <section aria-label="Certificate generation workflow" className="min-w-0 rounded-2xl border bg-card/95 p-2.5 shadow-xl shadow-slate-900/[0.04] backdrop-blur sm:rounded-3xl sm:p-6 lg:p-8">
          <CertificateGenerator />
        </section>
        <p className="mt-6 text-center text-xs text-muted-foreground">Your files stay on your device during generation.</p>
      </div>
      <Toaster />
    </main>
  );
}
