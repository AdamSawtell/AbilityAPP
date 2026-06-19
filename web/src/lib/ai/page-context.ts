/** Short context string for the AI system prompt from the current route. */
export function buildPageContext(pathname: string): string {
  const path = pathname.split("?")[0] ?? pathname;
  const segments = path.split("/").filter(Boolean);
  if (!segments.length) return "The user is on Home.";

  const [module, id, ...rest] = segments;
  const tail = rest.length ? ` / ${rest.join(" / ")}` : "";

  if (module === "clients" && id === "new") return "The user is on the new client form (/clients/new).";
  if (module === "clients" && id) return `The user is viewing client ${id}${tail}.`;
  if (module === "enquiries" && id === "new") return "The user is on the new enquiry form (/enquiries/new).";
  if (module === "enquiries" && id) return `The user is viewing enquiry ${id}${tail}.`;
  if (module === "tasks" && id === "new") return "The user is on the new task form (/tasks/new).";
  if (module === "tasks" && id) return `The user is viewing task ${id}${tail}.`;
  if (module === "incidents" && id === "new") return "The user is on the new incident report form (/incidents/new).";
  if (module === "incidents" && id) return `The user is viewing incident ${id}${tail}.`;

  return `The user is on /${segments.join("/")}.`;
}
