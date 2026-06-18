import React from "react";
import { Logo } from "./logo";
import { Globe, Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200 pt-12 pb-8 mt-auto">
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-center items-center gap-4">
          <p className="text-slate-400 text-xs">
            © {currentYear} CertiGen PH. All rights reserved.
          </p>
        </div>
    </footer>
  );
}
