"use client";

import Link from "next/link";
import { useWorkspace } from "@/lib/workspace-store";

export function ClientRecordLink({
  id,
  searchKey,
  name,
  className,
  children,
}: {
  id: string;
  searchKey: string;
  name: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const { openClient } = useWorkspace();

  return (
    <Link
      href={`/clients/${id}`}
      className={className}
      onClick={() => openClient(id, searchKey, name)}
    >
      {children ?? searchKey}
    </Link>
  );
}

export function EnquiryRecordLink({
  id,
  documentNo,
  name,
  className,
  children,
}: {
  id: string;
  documentNo: string;
  name?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const { openEnquiry } = useWorkspace();

  return (
    <Link
      href={`/enquiries/${id}`}
      className={className}
      onClick={() => openEnquiry(id, documentNo, name)}
    >
      {children ?? documentNo}
    </Link>
  );
}
