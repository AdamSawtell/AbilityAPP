"use client";

import { Toaster } from "sonner";

export function SuccessToaster() {
  return (
    <Toaster
      position="top-right"
      closeButton={false}
      visibleToasts={1}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg animate-in slide-in-from-right fade-in",
          icon: "text-white shrink-0",
        },
      }}
    />
  );
}
