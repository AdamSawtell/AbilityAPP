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

export function LocationRecordLink({
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
  const { openLocation } = useWorkspace();

  return (
    <Link
      href={`/locations/${id}`}
      className={className}
      onClick={() => openLocation(id, searchKey, name)}
    >
      {children ?? searchKey}
    </Link>
  );
}

export function ProductRecordLink({
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
  return (
    <Link href={`/products/${id}`} className={className}>
      {children ?? searchKey}
    </Link>
  );
}

export function EmployeeSystemAccessLink({
  employeeId,
  label,
  className,
  children,
}: {
  employeeId: string;
  label: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Link href={`/employees/${employeeId}?tab=System%20access`} className={className}>
      {children ?? label}
    </Link>
  );
}

/** @deprecated Use EmployeeSystemAccessLink — kept for older call sites. */
export function UserAdminLink({
  label,
  className,
  children,
}: {
  userId?: string;
  label: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span className={className} title="Open the employee record → System access tab">
      {children ?? label}
    </span>
  );
}
