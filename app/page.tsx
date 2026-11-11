import { Toaster } from "@/components/ui/sonner";
import { CertificateGenerator } from "@/components/certificate-generator";
import { Logo } from "@/components/ui/logo";
import { FileSpreadsheet, FileText, ShieldCheck, Sparkles } from "lucide-react";

const benefits = [
  { icon: FileText, label: "Word templates", detail: "Keep your existing DOCX design" },
  { icon: FileSpreadsheet, label: "Bulk data", detail: "Import Excel, CSV, or paste names" },
  { icon: ShieldCheck, label: "Private by design", detail: "Files are processed in your browser" },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem] bg-[radial-gradient(ellipse_at_top,hsl(215_90%_92%/0.8),transparent_68%)] dark:bg-[radial-gradient(ellipse_at_top,hsl(221_45%_22%/0.55),transparent_68%)]" />
      <div className="mx-auto max-w-6xl">
        <header className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm backdrop-blur">
            <Sparkles className="size-3.5 text-primary" />
            Simple, private bulk document creation
          </div>
          <div className="mb-4 flex justify-center">
            <Logo className="size-14 rounded-2xl shadow-lg shadow-primary/10 sm:size-16" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            CertiGen <span className="text-primary">PH</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Turn one Word template into a complete set of personalized certificates.
            Upload your design, add recipient data, and download your documents in minutes.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-3">
            {benefits.map(({ icon: Icon, label, detail }) => (
              <div key={label} className="flex items-center gap-2 text-left">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/8 text-primary">
                  <Icon className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">{label}</span>
                  <span className="block text-xs text-muted-foreground">{detail}</span>
                </span>
              </div>
            ))}
          </div>
        </header>

        <section aria-label="Certificate generator" className="rounded-2xl border bg-card/95 p-3 shadow-xl shadow-slate-900/[0.04] backdrop-blur sm:rounded-3xl sm:p-6 lg:p-8">
          <CertificateGenerator />
        </section>

        <section className="mx-auto mt-14 max-w-4xl" aria-labelledby="how-it-works">
          <div className="text-center">
            <p className="text-sm font-semibold text-primary">A simpler certificate workflow</p>
            <h2 id="how-it-works" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">From Word template to finished certificates</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Keep your existing certificate design. CertiGen fills its merge fields with recipient information from a spreadsheet or a pasted list.</p>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {[
              { number: "01", title: "Upload a DOCX", detail: "Choose a Word certificate with placeholders such as {{NAME}}." },
              { number: "02", title: "Add recipient data", detail: "Import Excel or CSV, or paste names and review the rows." },
              { number: "03", title: "Generate and download", detail: "Map each field, confirm the values, and download DOCX files." },
            ].map((item) => (
              <article key={item.number} className="rounded-2xl border bg-card p-5">
                <span className="text-xs font-bold tracking-widest text-primary">{item.number}</span>
                <h3 className="mt-3 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-4xl" aria-labelledby="faq-title">
          <div className="text-center">
            <h2 id="faq-title" className="text-2xl font-bold tracking-tight">Frequently asked questions</h2>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              { question: "What files can I upload?", answer: "Use a DOCX Word template and recipient data from an XLSX or CSV file. You can also paste names manually." },
              { question: "Are my files uploaded to a server?", answer: "The current generation workflow runs in your browser. Your template and recipient data are processed locally for this session." },
              { question: "Can I create separate certificates?", answer: "Yes. Download one combined Word document or a ZIP archive containing an individual DOCX file for each recipient." },
              { question: "Can I edit the certificates afterward?", answer: "Yes. Generated files are editable Word documents, so you can make final adjustments in Microsoft Word or a compatible editor." },
            ].map((item) => (
              <article key={item.question} className="rounded-xl border bg-card p-4">
                <h3 className="text-sm font-semibold">{item.question}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className="mx-auto mt-8 flex max-w-3xl flex-col items-center gap-2 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>CertiGen PH · Bulk certificates, without the repetitive work.</span>
          <span>Your files stay on your device during generation.</span>
        </footer>
      </div>
      <Toaster />
    </main>
  );
}