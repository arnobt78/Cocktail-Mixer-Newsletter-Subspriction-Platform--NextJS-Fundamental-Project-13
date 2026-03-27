import { Copyright } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/30 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-9xl items-center justify-center px-4 py-4 text-sm text-slate-300 sm:px-8">
        <span className="inline-flex items-center gap-2">
          <Copyright className="h-4 w-4" />
          {new Date().getFullYear()}. All rights reserved.
        </span>
      </div>
    </footer>
  );
}
