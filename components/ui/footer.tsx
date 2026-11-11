export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/70 bg-background px-4 py-6 text-center sm:px-6">
      <p className="text-xs text-muted-foreground">
        © {currentYear} CertiGen PH. All rights reserved.
      </p>
    </footer>
  );
}
