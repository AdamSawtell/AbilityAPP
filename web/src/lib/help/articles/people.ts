import type { HelpArticle } from "@/lib/help/types";

export const employeesArticle: HelpArticle = {
  id: "article-employees",
  slug: "employees",
  title: "Employees",
  summary: "HR records, credentials, documents, and compliance for staff.",
  category: "People",
  keywords: [
    "employee",
    "business partner",
    "credential",
    "document",
    "compliance",
    "work rights",
    "payroll",
  ],
  relatedRoutes: ["/employees", "/employees/new"],
  windowKeys: ["employees"],
  lastUpdated: "2025-06-15",
  sections: [
    {
      id: "employee-list",
      title: "Employees list",
      body: "The Employees list shows every staff member. Open a row to view or edit their file.",
      relatedRoutes: ["/employees"],
    },
    {
      id: "create-employee",
      title: "Create an employee",
      steps: [
        "Open People → Employees.",
        "Click New employee.",
        "Complete Overview, Contact, and Employment tabs.",
        "Save the record.",
        "Add credentials and documents on the Compliance and HR file tabs.",
      ],
      relatedRoutes: ["/employees/new"],
    },
    {
      id: "tab-groups",
      title: "Employee tab groups",
      bullets: [
        "Employee: Overview, Contact, Address, Emergency contacts, Employment, Work rights, Payroll, Leave",
        "Compliance: Credentials Assigned, Alerts",
        "HR file: Documents, Activity, Skills and languages",
        "Organisation: System access",
      ],
    },
    {
      id: "credentials",
      title: "Credentials Assigned",
      body: "Track certifications, checks, and licences with issue and expiry dates. Expiry dates appear on your Home calendar when the employee record is linked to your user account.",
      windowKeys: ["employee-credentials-assigned"],
    },
    {
      id: "documents",
      title: "Documents",
      body: "Store HR documents with type, reference, and expiry. Document expiry also feeds the Home personal calendar for your own employee record.",
      windowKeys: ["employee-documents"],
    },
    {
      id: "system-access",
      title: "System access",
      body: "Link the employee to an AbilityAPP user account. Administrators manage access under System → Admin → Roles and Employee → System access.",
      relatedRoutes: ["/system/admin/roles"],
      windowKeys: ["employee-system-access", "admin-roles"],
    },
  ],
};
