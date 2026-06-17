/**
 * Generates supabase/seed-org-structure.sql from TypeScript org seed data.
 * Run: node scripts/generate-org-structure-seed.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const { initialOrgPositions, initialPositionAssignments, initialOrgReportingLines } = await import(
  pathToFileURL(join(root, "web", "src", "lib", "org-structure.ts")).href
);
const { withResolvedChartTier } = await import(
  pathToFileURL(join(root, "web", "src", "lib", "org-chart-tier-defaults.ts")).href
);

function sqlVal(v) {
  if (v == null) return "null";
  return `'${String(v).replace(/'/g, "''")}'`;
}

function sqlText(v) {
  if (v == null) return "''";
  return `'${String(v).replace(/'/g, "''")}'`;
}

const basePositions = initialOrgPositions
  .filter((p) => !p.id.startsWith("pos-team-") && !p.id.startsWith("pos-sw-"))
  .map((p) => withResolvedChartTier(p));

const positionRows = basePositions.map(
  (p) =>
    `  (${sqlVal(p.id)}, ${sqlText(p.title)}, ${p.securityRoleId ? sqlVal(p.securityRoleId) : "null"}, ${sqlText(p.department)}, ${sqlText(p.businessArea)}, ${p.locationId ? sqlVal(p.locationId) : "null"}, ${p.parentPositionId ? sqlVal(p.parentPositionId) : "null"}, ${p.sortOrder}, ${p.chartTier}, ${sqlVal(p.status)}, ${sqlText(p.site)}, ${sqlText(p.costCentre)}, ${p.primaryEmployeeId ? sqlVal(p.primaryEmployeeId) : "null"})`
);

const bulkAssignmentIds = new Set(
  initialPositionAssignments.filter((a) => a.positionId.startsWith("pos-sw-")).map((a) => a.id)
);
const baseAssignments = initialPositionAssignments.filter((a) => !bulkAssignmentIds.has(a.id));

const assignmentRows = baseAssignments.map(
  (a) =>
    `  (${sqlVal(a.id)}, ${sqlVal(a.positionId)}, ${sqlVal(a.employeeId)}, ${sqlVal(a.assignmentType)}, ${sqlVal(a.effectiveFrom)}, null, ${sqlVal(a.notes)})`
);

const reportingLineRows = initialOrgReportingLines.map(
  (line) =>
    `  (${sqlVal(line.id)}, ${sqlVal(line.positionId)}, ${sqlVal(line.reportsToPositionId)}, ${sqlVal(line.lineType)}, ${sqlText(line.label)}, ${line.sortOrder})`
);

const sql = `-- Organisation structure seed (generated)
-- Re-run: npx supabase db query --linked -f supabase/seed-org-structure.sql

delete from public.org_position_reporting_line where position_id like 'pos-%';
delete from public.position_assignment where position_id like 'pos-%';
delete from public.org_position where id like 'pos-%';

insert into public.org_position (
  id, title, security_role_id, department, business_area, location_id, parent_position_id, sort_order, chart_tier, status, site, cost_centre, primary_employee_id
) values
${positionRows.join(",\n")}
on conflict (id) do update set
  title = excluded.title,
  security_role_id = excluded.security_role_id,
  department = excluded.department,
  business_area = excluded.business_area,
  location_id = excluded.location_id,
  parent_position_id = excluded.parent_position_id,
  sort_order = excluded.sort_order,
  chart_tier = excluded.chart_tier,
  status = excluded.status,
  site = excluded.site,
  cost_centre = excluded.cost_centre,
  primary_employee_id = excluded.primary_employee_id,
  updated_at = now();

insert into public.position_assignment (
  id, position_id, employee_id, assignment_type, effective_from, effective_to, notes
) values
${assignmentRows.join(",\n")}
on conflict (id) do update set
  position_id = excluded.position_id,
  employee_id = excluded.employee_id,
  assignment_type = excluded.assignment_type,
  effective_from = excluded.effective_from,
  effective_to = excluded.effective_to,
  notes = excluded.notes,
  updated_at = now();

insert into public.org_position_reporting_line (
  id, position_id, reports_to_position_id, line_type, label, sort_order
) values
${reportingLineRows.join(",\n")}
on conflict (id) do update set
  position_id = excluded.position_id,
  reports_to_position_id = excluded.reports_to_position_id,
  line_type = excluded.line_type,
  label = excluded.label,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Bulk support workers: npx supabase db query --linked -f supabase/seed-org-structure-bulk.sql
`;

writeFileSync(join(root, "supabase", "seed-org-structure.sql"), sql, "utf8");
console.log(`Wrote supabase/seed-org-structure.sql (${basePositions.length} positions, ${baseAssignments.length} assignments)`);
