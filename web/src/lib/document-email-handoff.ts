"use client";

export type EmailWithPdfResult = "shared" | "mailto" | "download-only";

/** Open native share (with PDF) or download PDF + mailto draft. */
export async function launchEmailWithPdfAttachment(input: {
  pdfBase64: string;
  fileName: string;
  mailtoUrl: string | null;
  subject: string;
  body: string;
}): Promise<EmailWithPdfResult> {
  const bytes = Uint8Array.from(atob(input.pdfBase64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: "application/pdf" });
  const file = new File([blob], input.fileName, { type: "application/pdf" });

  const shareData: ShareData = {
    files: [file],
    title: input.subject,
    text: input.body,
  };

  if (typeof navigator !== "undefined" && navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData);
      return "shared";
    } catch {
      /* cancelled or failed — fall through */
    }
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = input.fileName.endsWith(".pdf") ? input.fileName : `${input.fileName}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);

  if (input.mailtoUrl) {
    window.location.href = input.mailtoUrl;
    return "mailto";
  }
  return "download-only";
}

export function emailHandoffMessage(result: EmailWithPdfResult): string {
  switch (result) {
    case "shared":
      return "PDF attached via your device share sheet. Choose your email app to send.";
    case "mailto":
      return "PDF downloaded — attach it to the email draft that opened.";
    default:
      return "PDF downloaded. Add recipient email on the record to open a mail draft.";
  }
}
