# AbilityERP users, roles, and access (review notes)

How AbilityERP handles security compared to AbilityAPP.

## What we saw in AbilityERP

From live captures (`discovery/support-plan-capture.json`, `discovery/service-catalog-capture.json`):

- Header shows **`SuperUser@AbilityERP.*/AbilityERP Admin`** — username plus **active role**.
- Menu includes **Change Role** and **Log Out** (same session, different role context).
- Sidebar **windows** are role-dependent (e.g. Product, Support Receiver (BP), Service Booking, System Configurator).
- Users are separate from **Business Partners**; employees will be BP records linked to users later.

## AbilityERP model (simplified)

```
User ──many──► Role ──many──► Window / Function (menu access)
                  │
                  └──many──► Process (workflow permissions)
```

| Concept | AbilityERP | AbilityAPP |
|---------|------------|------------|
| User | Login identity | `app_user` |
| Role | e.g. AbilityERP Admin | `app_role` |
| User ↔ Role | Many-to-many | `app_user_role` |
| Window | Menu / function | `app_role_window` + `web/src/lib/access/catalog.ts` |
| Process | Workflow action | `app_role_process` + `docs/processes/` |
| Employee link | BP (employee) on user | `app_user.employee_bp_id` (future) |

## AbilityAPP implementation

- **Sign in:** `/login` — pick user, then role (like Change Role at login).
- **Change role:** Footer user chip → switch role without signing out.
- **Admin → Users:** Core user fields, assign one or many roles.
- **Admin → Roles:** Assign windows and processes; controls sidebar and action buttons.
- **Visibility:** Sidebar links and process buttons use `canWindow()` / `canProcess()`.

## Seed accounts (dev)

| User | Roles |
|------|-------|
| SuperUser | AbilityERP Admin (everything) |
| Isla Robinson | Intake Coordinator + Support Coordinator |
| Gabriela Wilson | Intake Coordinator only |

Try signing in as **GabrielaWilson** with **Intake Coordinator**: you should see Enquiries and **Convert to client**, but not Admin or Products.

## Future work

1. **Supabase Auth** — passwords, SSO, session tokens (replace prototype login picker).
2. **Employee BP** — set `employee_bp_id` when employee module exists.
3. **Org / client scope** — row-level security per organisation.
4. **Window registry** — add keys to `catalog.ts` + migration when new modules ship.

See [DATABASE-CHANGES.md](./DATABASE-CHANGES.md) when extending the schema.
