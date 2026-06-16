import type { LocationRecord } from "@/lib/location";
import { strDate, toDate } from "@/lib/supabase/mappers";

export type SupportLocationRow = {
  id: string;
  search_key: string;
  name: string;
  description: string;
  location_type: string;
  status: string;
  address1: string;
  address2: string;
  address3: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
  mobile: string;
  email: string;
  access_notes: string;
  picture_url: string;
  capacity: number | null;
  valid_from: string | null;
  valid_to: string | null;
  created_by: string;
  updated_by: string;
};

export type SupportLocationAlertRowDb = {
  id: string;
  location_id: string;
  line_no: number;
  alert_type: string;
  show_as_alert: string;
  name: string;
  description: string;
  valid_from: string | null;
  valid_to: string | null;
};

export type SupportLocationClientRowDb = {
  id: string;
  location_id: string;
  line_no: number;
  client_id: string;
  assignment_role: string;
  primary_assignment: string;
  valid_from: string | null;
  valid_to: string | null;
  notes: string;
};

export type SupportLocationEmployeeRowDb = {
  id: string;
  location_id: string;
  line_no: number;
  employee_id: string;
  assignment_role: string;
  primary_assignment: string;
  valid_from: string | null;
  valid_to: string | null;
  notes: string;
};

export type SupportLocationProductRowDb = {
  id: string;
  location_id: string;
  line_no: number;
  product_id: string;
  active: string;
  valid_from: string | null;
  valid_to: string | null;
  notes: string;
};

export type SupportLocationActivityRowDb = {
  id: string;
  location_id: string;
  line_no: number;
  activity_date: string | null;
  activity_type: string;
  subject: string;
  description: string;
  created_by: string;
};

export function locationFromRow(
  row: SupportLocationRow,
  children: {
    alerts: SupportLocationAlertRowDb[];
    clientLinks: SupportLocationClientRowDb[];
    employeeLinks: SupportLocationEmployeeRowDb[];
    productLinks: SupportLocationProductRowDb[];
    activities: SupportLocationActivityRowDb[];
  }
): LocationRecord {
  return {
    id: row.id,
    searchKey: row.search_key,
    name: row.name,
    description: row.description,
    locationType: row.location_type,
    status: row.status,
    address1: row.address1,
    address2: row.address2,
    address3: row.address3,
    city: row.city,
    state: row.state,
    postcode: row.postcode,
    country: row.country,
    phone: row.phone,
    mobile: row.mobile,
    email: row.email,
    accessNotes: row.access_notes,
    pictureUrl: row.picture_url,
    capacity: row.capacity != null ? String(row.capacity) : "",
    validFrom: strDate(row.valid_from),
    validTo: strDate(row.valid_to),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    alerts: children.alerts.map((a) => ({
      id: a.id,
      lineNo: a.line_no,
      alertType: a.alert_type,
      showAsAlert: a.show_as_alert,
      name: a.name,
      description: a.description,
      validFrom: strDate(a.valid_from),
      validTo: strDate(a.valid_to),
    })),
    clientLinks: children.clientLinks.map((l) => ({
      id: l.id,
      lineNo: l.line_no,
      clientId: l.client_id,
      assignmentRole: l.assignment_role,
      primaryAssignment: l.primary_assignment,
      validFrom: strDate(l.valid_from),
      validTo: strDate(l.valid_to),
      notes: l.notes,
    })),
    employeeLinks: children.employeeLinks.map((l) => ({
      id: l.id,
      lineNo: l.line_no,
      employeeId: l.employee_id,
      assignmentRole: l.assignment_role,
      primaryAssignment: l.primary_assignment,
      validFrom: strDate(l.valid_from),
      validTo: strDate(l.valid_to),
      notes: l.notes,
    })),
    productLinks: children.productLinks.map((l) => ({
      id: l.id,
      lineNo: l.line_no,
      productId: l.product_id,
      active: l.active,
      validFrom: strDate(l.valid_from),
      validTo: strDate(l.valid_to),
      notes: l.notes,
    })),
    activities: children.activities.map((a) => ({
      id: a.id,
      lineNo: a.line_no,
      date: strDate(a.activity_date),
      activityType: a.activity_type,
      subject: a.subject,
      description: a.description,
      createdBy: a.created_by,
    })),
  };
}

export function locationToRow(record: LocationRecord): SupportLocationRow {
  return {
    id: record.id,
    search_key: record.searchKey,
    name: record.name,
    description: record.description,
    location_type: record.locationType,
    status: record.status,
    address1: record.address1,
    address2: record.address2,
    address3: record.address3,
    city: record.city,
    state: record.state,
    postcode: record.postcode,
    country: record.country,
    phone: record.phone,
    mobile: record.mobile,
    email: record.email,
    access_notes: record.accessNotes,
    picture_url: record.pictureUrl,
    capacity: record.capacity?.trim() ? Number(record.capacity) : null,
    valid_from: toDate(record.validFrom),
    valid_to: toDate(record.validTo),
    created_by: record.createdBy,
    updated_by: record.updatedBy,
  };
}
