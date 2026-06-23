/**
 * Generates supabase/seed-tasks.sql — 100 realistic tasks linked to seed entities.
 * Run: node scripts/generate-task-seed.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function sqlString(value) {
  if (value === null || value === undefined) return "''";
  return `'${String(value).replace(/'/g, "''")}'`;
}

const TASK_TYPES = [
  { id: "tt-review", legacy: "Review" },
  { id: "tt-approve", legacy: "Approve" },
  { id: "tt-check", legacy: "Check" },
  { id: "tt-develop", legacy: "Develop" },
  { id: "tt-other", legacy: "Other" },
];

const ENTITIES = [
  { type: "enquiry", id: "1000025", label: "ENQ-1000025 — Samuel Ryan" },
  { type: "enquiry", id: "1000011", label: "ENQ-1000011 — Jim Bo" },
  { type: "enquiry", id: "1000012", label: "ENQ-1000012 — Bryan Jackson" },
  { type: "enquiry", id: "1000013", label: "ENQ-1000013 — Janice Williams" },
  { type: "enquiry", id: "1000014", label: "ENQ-1000014 — Gerald Anderson" },
  { type: "enquiry", id: "1000015", label: "ENQ-1000015 — Jacob Turner" },
  { type: "enquiry", id: "1000024", label: "ENQ-1000024 — Ava Brown" },
  { type: "client", id: "bp-bern", label: "Bern — Bernadette Rose" },
  { type: "employee", id: "emp-isla", label: "EMP-1001 — Isla Robinson" },
  { type: "employee", id: "emp-gabriela", label: "EMP-1002 — Gabriela Wilson" },
  { type: "employee", id: "emp-michael", label: "EMP-1003 — Michael Smith" },
  { type: "employee", id: "emp-oliver", label: "EMP-1004 — Oliver Williams" },
  { type: "employee", id: "emp-rose", label: "Rose Dash" },
  { type: "employee", id: "emp-jessica", label: "Jessica Hancock" },
  { type: "service-agreement", id: "sa-rose-ni", label: "SA-ROSE-NI — Bernadette Rose NDIS" },
  { type: "contract", id: "ctr-1000001", label: "CTR-1000001 — Rover Road tenancy" },
  { type: "contract", id: "ctr-1000002", label: "CTR-1000002 — Bern NDIS agreement" },
  { type: "product", id: "prod-sil-wd", label: "SIL Weekday" },
  { type: "product", id: "prod-cp", label: "Community Participation" },
  { type: "product", id: "prod-transport", label: "Transport per km" },
  { type: "price-list", id: "pl-ndis-2024", label: "NDIS Price List 2024-25" },
  ...Array.from({ length: 10 }, (_, i) => ({
    type: "incident",
    id: `inc-100000${i + 1}`,
    label: `INC-100000${i + 1}`,
  })),
];

const USERS = [
  { id: "user-superuser", name: "Super User" },
  { id: "user-isla", name: "Isla Robinson" },
  { id: "user-gabriela", name: "Gabriela Wilson" },
];

const ROLES = [
  { id: "role-admin", name: "AbilityVua Admin" },
  { id: "role-coordinator", name: "Support Coordinator" },
  { id: "role-intake", name: "Intake Coordinator" },
];

const TITLES = {
  enquiry: [
    "Triage new enquiry",
    "Follow up enquiry phone call",
    "Send intake information pack",
    "Review enquiry conversion readiness",
    "Schedule initial assessment",
  ],
  client: [
    "Complete intake paperwork",
    "Review consent records",
    "Update support plan goals",
    "Annual plan review preparation",
    "Verify emergency contacts",
    "PACE transition check-in",
  ],
  employee: [
    "Renew WWCC credential",
    "Complete annual performance review",
    "Update emergency contact details",
    "Schedule supervision session",
    "Review training compliance",
  ],
  incident: [
    "Review incident report",
    "Complete manager sign-off",
    "Follow up corrective actions",
    "Update investigation summary",
    "Verify NDIS notification reference",
  ],
  "service-agreement": [
    "Review service agreement lines",
    "Confirm price list alignment",
    "Prepare agreement for approval",
    "Check budget utilisation",
  ],
  contract: [
    "Review contract renewal terms",
    "Verify execution dates",
    "Upload signed contract copy",
  ],
  product: [
    "Validate NDIS support item code",
    "Review product pricing",
    "Confirm product active for rostering",
  ],
  "price-list": [
    "Annual price list review",
    "Compare list vs standard prices",
    "Publish updated price list",
  ],
};

const STATUSES = ["Open", "In progress", "Completed", "Cancelled"];
const PRIORITIES = ["Low", "Normal", "High"];

function pick(arr, i) {
  return arr[i % arr.length];
}

function addDays(isoDate, days) {
  const d = new Date(isoDate + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function addDaysIso(iso, days) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

const tasks = [];

for (let n = 1; n <= 100; n++) {
  const seq = 2000 + n;
  const entity = ENTITIES[(n - 1) % ENTITIES.length];
  const taskType = pick(TASK_TYPES, n);
  const status = pick(STATUSES, n);
  const priority = pick(PRIORITIES, n + 2);
  const assignToRole = n % 3 === 0;
  const user = pick(USERS, n);
  const role = pick(ROLES, n + 1);
  const createdDay = addDays("2025-12-01", n * 2);
  const dueDate = addDays(createdDay, (n % 14) + 1);
  const titlePool = TITLES[entity.type] ?? ["Complete linked record task"];
  const title = `${pick(titlePool, n)} — ${entity.label.split("—").pop()?.trim() ?? entity.label}`;
  const description = `Work item ${seq} linked to ${entity.type} ${entity.label}. Generated test data for task hub, role queues, and record navigation.`;
  const completed = status === "Completed" || status === "Cancelled";
  const createdAt = addDaysIso(`${createdDay}T09:00:00.000Z`, 0);
  const completedAt = completed ? addDaysIso(`${dueDate}T16:00:00.000Z`, 0) : null;

  const updates = [
    {
      id: `tu-seed-task-${seq}-0`,
      at: createdAt,
      byUserId: user.id,
      byName: user.name,
      action: "created",
      summary: assignToRole
        ? `Created and assigned to role ${role.name}`
        : `Created and assigned to user ${user.name}`,
      detail: `Linked to ${entity.label}.`,
    },
  ];

  if (status === "In progress") {
    updates.push({
      id: `tu-seed-task-${seq}-1`,
      at: addDaysIso(createdAt, 1),
      byUserId: user.id,
      byName: user.name,
      action: "status_changed",
      summary: "Status changed from Open to In progress",
      detail: "Started work on this item.",
    });
  }

  if (completed) {
    updates.push({
      id: `tu-seed-task-${seq}-1`,
      at: completedAt,
      byUserId: user.id,
      byName: user.name,
      action: status === "Cancelled" ? "closed" : "closed",
      summary: status === "Cancelled" ? "Task cancelled" : "Task completed",
      detail: status === "Cancelled" ? "No longer required." : "Resolved and documented.",
    });
  }

  tasks.push({
    id: `task-seed-${seq}`,
    documentNo: `REQ-${seq}`,
    title,
    description,
    status,
    actionType: taskType.legacy,
    taskTypeId: taskType.id,
    priority,
    dueDate,
    assignmentType: assignToRole ? "role" : "user",
    assigneeUserId: assignToRole ? null : user.id,
    assigneeRoleId: assignToRole ? role.id : null,
    entityType: entity.type,
    entityId: entity.id,
    entityLabel: entity.label,
    createdByUserId: "user-superuser",
    createdBy: "Super User",
    updatedBy: user.name,
    completedBy: completed ? user.name : "",
    completedAt,
    resolutionNotes: completed && status === "Completed" ? "Completed during seed data review." : "",
    updates,
  });
}

const lines = [
  "-- 100 realistic test tasks linked to seed entities",
  "-- Re-run: npx supabase db query --linked -f supabase/seed-tasks.sql",
  "-- Generate: node scripts/generate-task-seed.mjs",
  "",
  "delete from public.app_task where id like 'task-seed-%';",
  "",
  "insert into public.app_task (",
  "  id, document_no, title, description, status, action_type, task_type_id, priority, due_date,",
  "  assignment_type, assignee_user_id, assignee_role_id, entity_type, entity_id, entity_label,",
  "  created_by_user_id, created_by, updated_by, completed_by, completed_at, resolution_notes, updates",
  ") values",
];

lines.push(
  tasks
    .map((t, i) => {
      const suffix = i === tasks.length - 1 ? "" : ",";
      return `  (${sqlString(t.id)}, ${sqlString(t.documentNo)}, ${sqlString(t.title)}, ${sqlString(t.description)}, ${sqlString(t.status)}, ${sqlString(t.actionType)}, ${sqlString(t.taskTypeId)}, ${sqlString(t.priority)}, ${sqlString(t.dueDate)}, ${sqlString(t.assignmentType)}, ${t.assigneeUserId ? sqlString(t.assigneeUserId) : "null"}, ${t.assigneeRoleId ? sqlString(t.assigneeRoleId) : "null"}, ${sqlString(t.entityType)}, ${sqlString(t.entityId)}, ${sqlString(t.entityLabel)}, ${sqlString(t.createdByUserId)}, ${sqlString(t.createdBy)}, ${sqlString(t.updatedBy)}, ${sqlString(t.completedBy)}, ${t.completedAt ? sqlString(t.completedAt) : "null"}, ${sqlString(t.resolutionNotes)}, ${sqlString(JSON.stringify(t.updates))}::jsonb)${suffix}`;
    })
    .join("\n")
);

lines.push("on conflict (id) do update set");
lines.push("  document_no = excluded.document_no,");
lines.push("  title = excluded.title,");
lines.push("  description = excluded.description,");
lines.push("  status = excluded.status,");
lines.push("  action_type = excluded.action_type,");
lines.push("  task_type_id = excluded.task_type_id,");
lines.push("  priority = excluded.priority,");
lines.push("  due_date = excluded.due_date,");
lines.push("  assignment_type = excluded.assignment_type,");
lines.push("  assignee_user_id = excluded.assignee_user_id,");
lines.push("  assignee_role_id = excluded.assignee_role_id,");
lines.push("  entity_type = excluded.entity_type,");
lines.push("  entity_id = excluded.entity_id,");
lines.push("  entity_label = excluded.entity_label,");
lines.push("  created_by_user_id = excluded.created_by_user_id,");
lines.push("  created_by = excluded.created_by,");
lines.push("  updated_by = excluded.updated_by,");
lines.push("  completed_by = excluded.completed_by,");
lines.push("  completed_at = excluded.completed_at,");
lines.push("  resolution_notes = excluded.resolution_notes,");
lines.push("  updates = excluded.updates;");

const out = join(root, "supabase", "seed-tasks.sql");
writeFileSync(out, lines.join("\n") + "\n", "utf8");
console.log(`Wrote ${tasks.length} tasks to ${out}`);
