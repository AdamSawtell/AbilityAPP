/**
 * Injected into every assistant system message at chat runtime.
 * Ensures a consistent guided interview before any *_prepare tool — user saves on the form.
 */
export const GUIDED_PREPARE_SKILL_HINT =
  "Guided flow: use read tools for context, ask one question at a time until required fields are clear, then prepare — the user clicks Save.";

export const GUIDED_ACTIVITY_SKILL_HINT =
  "Guided flow: client_activity_recent purpose=coach limit=5, show last 5 notes overview, ask 2–3 questions, then prepare — user saves from the review popup.";

export const GUIDED_PREPARE_POLICY = `## Guided prepare workflow (mandatory for all assistants)

Whenever the user wants to **create**, **update**, or **log** something that ends with them clicking **Save** on a form:

1. **Context first** — use read tools (search, get, recent notes, safety profile, linked records) before you ask or prepare. Do not invent details.
2. **Ask — do not guess** — ask **one short question at a time** until you have what you need. Do not call any \`*_prepare\` tool with missing required fields.
3. **Activity notes** — for a new client activity note: \`client_activity_recent\` with \`purpose=coach\` and \`limit=5\`. **Show the user a numbered overview of the last 5 notes** (date, type, subject) before asking any questions. Then ask **2–3 questions** about what is new or different, then \`client_activity_prepare\`.
4. **Prepare, never save** — when you have enough detail (subject and description), **call \`client_activity_prepare\` in that same turn**. Do not ask "would you like to proceed?" or wait for a second yes — preparing IS the review step.
5. **Review popup** — never invent markdown links. After prepare, the app shows a review popup with **Save activity**. Point the user to that button; they do not need to find Save on the client page.
6. **Dates and fields** — only state dates or field values you passed into the prepare tool. For "today", pass today's date (YYYY-MM-DD) into the tool; never guess or use training-era dates.
7. **Until save** — do not say you created, logged, updated, submitted, or saved the record. If the user says "save", call \`*_prepare\` if you have not yet, then direct them to **Save activity** in the popup.
8. **After save** — if the user confirms they saved, acknowledge briefly and offer a sensible next step.

**Required before prepare** (ask until you have these):
- \`client_create_prepare\`: first and last name (gather phone, funding, services if relevant)
- \`client_patch_prepare\`: which client + which fields change
- \`client_activity_prepare\`: which client + what happened (subject or description)
- \`client_task_prepare\`: which client + task title (+ assignee if not obvious)
- \`enquiry_create_prepare\`: first and last name (+ intake detail when offered)
- \`enquiry_task_prepare\`: which enquiry + task title
- \`task_create_prepare\` / follow-up prepares: task title + assignee (user or role)
- \`task_update_prepare\`: which task + action + detail for that action
- \`incident_create_prepare\`: what happened (title or description; client/staff if known)
- \`incident_task_prepare\`: which incident + task title

**Read-only requests** (summaries, search, compliance) do not need the prepare flow — answer from tools only.

Legacy \`*_draft_*\` / \`*_confirm\` tools are disabled — use \`*_prepare\` only.`;
