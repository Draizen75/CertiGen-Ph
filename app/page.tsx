import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileSpreadsheet, FileText, ShieldCheck, Sparkles, Download, CheckCircle2 } from "lucide-react";

const benefits = [
  { icon: FileText, label: "Keep your Word design", detail: "Use your existing DOCX certificate template." },
  { icon: FileSpreadsheet, label: "Add recipients in bulk", detail: "Import Excel, CSV, or paste names manually." },
  { icon: ShieldCheck, label: "Private by design", detail: "Your files are processed locally in your browser." },
];

const steps = [
  { number: "01", icon: FileText, title: "Upload your template", detail: "Start with the Word certificate you already designed. Add placeholders for the details that change." },
  { number: "02", icon: FileSpreadsheet, title: "Add recipient data", detail: "Bring in an Excel or CSV spreadsheet, or paste your recipient list and review the information." },
  { number: "03", icon: Download, title: "Generate and download", detail: "Match your template fields, review the values, then download editable Word certificates." },
];

const faqs = [
  { question: "What files can I upload?", answer: "Upload a DOCX Word template and recipient data from an XLSX or CSV file. You can also paste names manually." },
  { question: "Are my files uploaded to a server?", answer: "The current generation workflow runs in your browser. Your template and recipient data are processed locally for this session." },
  { question: "Can I create separate certificates?", answer: "Yes. Choose one combined Word document or a ZIP archive containing an individual DOCX file for each recipient." },
  { question: "Can I edit the certificates afterward?", answer: "Yes. Generated files are editable Word documents that you can adjust in Microsoft Word or a compatible editor." },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(ellipse_at_top,hsl(215_90%_92%/0.8),transparent_68%)] dark:bg-[radial-gradient(ellipse_at_top,hsl(221_45%_22%/0.55),transparent_68%)]" />
      <div className="mx-auto max-w-6xl">
        <header className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" aria-label="CertiGen PH home" className="flex items-center gap-2.5">
            <Logo className="size-9 rounded-xl" />
            <span className="text-base font-bold tracking-tight">CertiGen <span className="text-primary">PH</span></span>
          </Link>
          <Link href="/generator" className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
            Open generator <ArrowRight className="ml-1 inline size-4" />
          </Link>
        </header>

        <section className="mx-auto max-w-4xl pb-16 pt-16 text-center sm:pb-20 sm:pt-24">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm backdrop-blur">
            <Sparkles className="size-3.5 text-primary" />
            Simple, private bulk certificate creation
          </div>
          <div className="mb-6 flex justify-center">
            <Logo className="size-16 rounded-2xl shadow-lg shadow-primary/10 sm:size-20" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Create certificates in bulk.
            <span className="mt-1 block text-primary">Keep every detail personal.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            Turn one Word template into a complete set of personalized certificates. Add your recipient list, review the details, and download your documents in minutes.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-xl px-7 text-sm font-semibold shadow-lg shadow-primary/15">
              <Link href="/generator">Start Creating Certificates <ArrowRight className="ml-2 size-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-xl px-7">
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Free to use · No account required · Files stay on your device</p>

          <div className="mx-auto mt-14 grid max-w-4xl gap-4 text-left sm:grid-cols-3">
            {benefits.map(({ icon: Icon, label, detail }) => (
              <article key={label} className="flex gap-3 rounded-2xl border bg-card/85 p-4 shadow-sm backdrop-blur">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>
                <span><span className="block text-sm font-semibold">{label}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{detail}</span></span>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-5xl scroll-mt-10 py-14 sm:py-20" aria-labelledby="how-title">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-primary">A simpler workflow</p>
            <h2 id="how-title" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">From one template to every recipient</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">No repetitive copy and paste. Set up your certificate once and let CertiGen fill in the recipient details.</p>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {steps.map(({ number, icon: Icon, title, detail }) => (
              <article key={number} className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-widest text-primary">{number}</span>
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>
                </div>
                <h3 className="mt-5 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild size="lg" className="rounded-xl px-6">
              <Link href="/generator">Start your first batch <ArrowRight className="ml-2 size-4" /></Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-4xl py-12 sm:py-16" aria-labelledby="privacy-title">
          <div className="grid items-center gap-6 rounded-3xl border bg-card p-6 sm:grid-cols-[auto_1fr] sm:p-9">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck className="size-7" /></div>
            <div>
              <h2 id="privacy-title" className="text-xl font-bold tracking-tight">Your documents stay in your browser</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">The current certificate-generation workflow processes your template and recipient data locally for this session. Nothing needs to be uploaded to create your documents.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl py-12 sm:py-16" aria-labelledby="faq-title">
          <div className="text-center">
            <p className="text-sm font-semibold text-primary">Need to know more?</p>
            <h2 id="faq-title" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Frequently asked questions</h2>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {faqs.map((item) => (
              <article key={item.question} className="rounded-xl border bg-card p-5">
                <h3 className="text-sm font-semibold">{item.question}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-8 max-w-4xl rounded-3xl bg-primary px-6 py-10 text-center text-primary-foreground sm:px-10">
          <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-white/15"><CheckCircle2 className="size-6" /></div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight">Ready to make your certificates?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-primary-foreground/80">Bring your Word template and recipient list. CertiGen takes care of the repetitive work.</p>
          <Button asChild size="lg" variant="secondary" className="mt-6 h-11 rounded-xl px-6 font-semibold">
            <Link href="/generator">Start Creating Certificates <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        </section>

        <footer className="mx-auto mt-12 flex max-w-4xl flex-col items-center justify-between gap-2 border-t pt-6 text-center text-xs text-muted-foreground sm:flex-row">
          <span>CertiGen PH · Bulk certificates, without the repetitive work.</span>
          <span>Simple, private, and made for your workflow.</span>
        </footer>
      </div>
      <Toaster />
    </main>
  );
}
