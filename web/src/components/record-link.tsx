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

export function EmployeeRecordLink({
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
  const { openEmployee } = useWorkspace();

  return (
    <Link
      href={`/employees/${id}`}
      className={className}
      onClick={() => openEmployee(id, searchKey, name)}
    >
      {children ?? searchKey}
    </Link>
  );
}

export function UserAdminLink({
  userId,
  label,
  className,
  children,
}: {
  userId: string;
  label: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Link href={`/admin/users?user=${userId}`} className={className}>
      {children ?? label}
    </Link>
  );
}
