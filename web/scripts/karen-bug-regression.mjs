/**
 * Regression checks for the Karen browser QA bugs.
 * Run: npm run test:karen  (uses tsx to import the real source modules)
 *
 * Covers:
 *  - KAREN-BUG-0001: default availability weekday rows map Monday-Friday.
 *  - KAREN-BUG-0003: assistant client name extraction + match grounding.
 *  - KAREN-BUG-0004: claimed/assigned shifts visible in My shifts "All".
 */
import { dayLabels, DEFAULT_AVAILABILITY_WEEKDAYS } from "../src/lib/my-workplace/types.ts";
import {
  clientNameFromActivityMessage,
  isActivityCoachIntent,
} from "../src/lib/ai/activity-coach-display.ts";
import { pickBestMatch, scoreClientMatch } from "../src/lib/ai/tools/client-resolve.ts";
import { shiftsAssignedToWorker } from "../src/lib/roster-shift-checkin.ts";
import { filterMyShiftsView } from "../src/lib/my-shifts-grouping.ts";
import {
  classifyShiftAvailability,
  sortOpenShiftsByAvailability,
} from "../src/lib/roster-open-shifts.ts";
import { SAVE_TOAST_MESSAGES, SAVE_SUCCESS_TOAST_ID, showSuccessToast } from "../src/lib/toast.ts";
import { Skeleton, SkeletonTable, SkeletonText } from "../src/components/ui/skeleton.tsx";
import {
  SettingsFormSkeleton,
  TableRowsSkeleton,
  InlineListSkeleton,
  PortalGuardSkeleton,
  routePageSkeleton,
} from "../src/components/ui/page-skeletons.tsx";

let failures = 0;

function check(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures += 1;
    console.error(`FAIL ${name}\n  expected: ${e}\n  actual:   ${a}`);
  } else {
    console.log(`PASS ${name}`);
  }
}

function checkTruthy(name, actual) {
  if (!actual) {
    failures += 1;
    console.error(`FAIL ${name}\n  expected truthy, got: ${JSON.stringify(actual)}`);
  } else {
    console.log(`PASS ${name}`);
  }
}

// ---- KAREN-BUG-0001 -------------------------------------------------------
const labels = dayLabels();
check(
  "BUG-0001 default availability maps Monday-Friday",
  DEFAULT_AVAILABILITY_WEEKDAYS.map((d) => labels[d]),
  ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
);
check("BUG-0001 first default day is Monday (index 0)", DEFAULT_AVAILABILITY_WEEKDAYS[0], 0);
check("BUG-0001 default rows never include Saturday/Sunday", DEFAULT_AVAILABILITY_WEEKDAYS.includes(5) || DEFAULT_AVAILABILITY_WEEKDAYS.includes(6), false);

// ---- KAREN-BUG-0003 (name extraction) -------------------------------------
check(
  "BUG-0003 extracts explicit client name",
  clientNameFromActivityMessage("Save an activity for Bernadette Rose. Phone call at 1400hrs."),
  "Bernadette Rose"
);
check(
  "BUG-0003 extracts name before a dash separator",
  clientNameFromActivityMessage("log activity note for Bernadette Rose - phone call from today at 1400hrs"),
  "Bernadette Rose"
);
check(
  "BUG-0003 rejects pronoun/time phrase as a name",
  clientNameFromActivityMessage("log an activity note - she is away for her visit tomorrow"),
  null
);
check(
  "BUG-0003 rejects 'for the visit'",
  clientNameFromActivityMessage("add a note for the visit today"),
  null
);

// ---- Activity coach intent (add/record activity must start the coach) ------
check("INTENT 'add an activity' starts coach", isActivityCoachIntent("add an activity for Karen"), true);
check("INTENT 'add activities' starts coach", isActivityCoachIntent("I want to add activities"), true);
check("INTENT 'record activity' starts coach", isActivityCoachIntent("record activity for Bernadette Rose"), true);
check("INTENT 'log an activity' still starts coach", isActivityCoachIntent("log an activity for Karen"), true);
check("INTENT 'create activity note' still starts coach", isActivityCoachIntent("create an activity note"), true);
check("INTENT plain question does not start coach", isActivityCoachIntent("what activities does Karen have?"), false);

// ---- KAREN-BUG-0003 (match grounding) -------------------------------------
const bernadette = {
  id: "client-bern",
  name: "Bernadette Rose",
  search_key: "ROSEBE",
  first_name: "Bernadette",
  last_name: "Rose",
  preferred_name: "Bernie",
};
const henry = {
  id: "client-henry",
  name: "Henry Robinson",
  search_key: "ROBIHE",
  first_name: "Henry",
  last_name: "Robinson",
  preferred_name: "",
};

const best = pickBestMatch([henry, bernadette], "Bernadette Rose");
check("BUG-0003 picks the requested client, not first row", best?.id, "client-bern");

check(
  "BUG-0003 typo-tolerant match still grounds on Bernadette ('Bernedette Rose')",
  pickBestMatch([henry, bernadette], "Bernedette Rose")?.id,
  "client-bern"
);

check(
  "BUG-0003 returns null when nothing matches (no arbitrary fallback)",
  pickBestMatch([henry], "her visit tomorrow"),
  null
);

check(
  "BUG-0003 never grounds on unrelated client when requested name absent",
  pickBestMatch([henry], "Bernadette Rose"),
  null
);

checkTruthy(
  "BUG-0003 exact name outscores unrelated client",
  scoreClientMatch(bernadette, "Bernadette Rose") > scoreClientMatch(henry, "Bernadette Rose")
);

// ---- KAREN-BUG-0004 -------------------------------------------------------
const today = "2025-10-01";
const shift = (id, date, employeeId, status) => ({
  id,
  shiftDate: date,
  startTime: "09:00",
  endTime: "17:00",
  employeeId,
  status,
});
const rosterShifts = [
  shift("s-today", "2025-10-01", "emp1", "Published"),
  shift("s-far-future", "2025-11-15", "emp1", "Published"), // beyond +14d window
  shift("s-cancelled", "2025-10-10", "emp1", "Cancelled"),
  shift("s-other", "2025-10-08", "emp2", "Published"),
];

const assigned = shiftsAssignedToWorker(rosterShifts, "emp1");
check(
  "BUG-0004 assigned set includes far-future claimed shift",
  assigned.map((s) => s.id),
  ["s-today", "s-far-future"]
);
check(
  "BUG-0004 assigned set excludes cancelled and other workers",
  assigned.some((s) => s.id === "s-cancelled" || s.id === "s-other"),
  false
);
check(
  "BUG-0004 All view returns every assigned shift",
  filterMyShiftsView(assigned, "all", "emp1", today).map((s) => s.id),
  ["s-today", "s-far-future"]
);

// ---- KAREN-BUG-0004 (availability-aware open-shift claim) ------------------
// 2025-10-06 is a Monday; availability stores Monday as dayOfWeek 0.
const mondayAvailability = [
  { id: "a1", lineNo: 1, dayOfWeek: 0, startTime: "08:00", endTime: "17:00", availability: "Available", notes: "" },
];
const inHours = { shiftDate: "2025-10-06", startTime: "09:00", endTime: "17:00" };
const overnight = { shiftDate: "2025-10-06", startTime: "22:00", endTime: "06:00" };
const saturday = { shiftDate: "2025-10-04", startTime: "09:00", endTime: "13:00" };

check(
  "BUG-0004 shift inside saved hours matches availability",
  classifyShiftAvailability(inHours, mondayAvailability).matchesAvailability,
  true
);
check(
  "BUG-0004 overnight 22:00-06:00 shift is outside availability and needs confirm",
  classifyShiftAvailability(overnight, mondayAvailability).needsConfirm,
  true
);
check(
  "BUG-0004 day with no saved hours is outside availability",
  classifyShiftAvailability(saturday, mondayAvailability).status,
  "outside"
);
check(
  "BUG-0004 no availability configured does not block claiming",
  classifyShiftAvailability(inHours, []).needsConfirm,
  false
);
check(
  "BUG-0004 matching shift sorts ahead of outside-availability shift",
  sortOpenShiftsByAvailability(
    [
      { id: "ot", shiftDate: "2025-10-06", startTime: "22:00", endTime: "06:00" },
      { id: "ok", shiftDate: "2025-10-06", startTime: "09:00", endTime: "17:00" },
    ],
    mondayAvailability
  ).map((s) => s.id),
  ["ok", "ot"]
);

checkTruthy("AB-0038 showSuccessToast is exported", typeof showSuccessToast === "function");
check("AB-0038 save toast id is stable", SAVE_SUCCESS_TOAST_ID, "save-success");
checkTruthy("AB-0038 availability toast message", SAVE_TOAST_MESSAGES.availability.includes("✓"));
checkTruthy("AB-0038 client toast message", SAVE_TOAST_MESSAGES.client.includes("✓"));

checkTruthy("AB-0036 Skeleton export", typeof Skeleton === "function");
checkTruthy("AB-0036 SkeletonText export", typeof SkeletonText === "function");
checkTruthy("AB-0036 SkeletonTable export", typeof SkeletonTable === "function");
checkTruthy("AB-0036 Phase 2 SettingsFormSkeleton export", typeof SettingsFormSkeleton === "function");
checkTruthy("AB-0036 Phase 2 TableRowsSkeleton export", typeof TableRowsSkeleton === "function");
checkTruthy("AB-0036 Phase 2 InlineListSkeleton export", typeof InlineListSkeleton === "function");
checkTruthy("AB-0036 Phase 2 PortalGuardSkeleton export", typeof PortalGuardSkeleton === "function");
checkTruthy("AB-0036 routePageSkeleton employees list", routePageSkeleton("/employees") != null);
checkTruthy("AB-0036 routePageSkeleton incidents detail", routePageSkeleton("/incidents/inc-1") != null);

if (failures > 0) {
  console.error(`\n${failures} regression check(s) failed.`);
  process.exit(1);
}
console.log("\nAll Karen regression checks passed.");
