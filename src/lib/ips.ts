export type IpsLinkStatus = "none" | "active" | "expired" | "unlinked" | "deactivated" | "unavailable";

export interface IpsLinkState {
  status: IpsLinkStatus;
  ips: { name: string; slug: string } | null;
  linked_at: string | null;
  status_changed_at: string | null;
}

export interface IpsPatient {
  patientId: number;
  name: string | null;
  sex: string | null;
  birthDate: string | null;
  city: string | null;
  eps: string | null;
  primarySite: { id: number | null; name: string; address: string; city: string } | null;
}

export interface IpsAppointment {
  id: string;
  type: "general" | "priority" | null;
  startsAt: string;
  endsAt: string | null;
  status: "requested" | "confirmed" | "cancelled" | "completed" | "no_show";
  reason: string | null;
  doctorName: string | null;
  site: { name: string; address: string; city: string } | null;
}
