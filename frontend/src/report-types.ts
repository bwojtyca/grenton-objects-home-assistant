/* Types for the payload returned by the `grenton_objects/analyze` websocket
 * command (see custom_components/grenton_objects/report.py build_report). */

export interface MergedRow {
  grenton_id: string | null;
  clu: string | null;
  module: string | null;
  om_name: string | null;
  om_type: string | null;
  is_din: boolean;
  is_unsupported: boolean;
  in_om: boolean;
  in_ha: boolean;
  entity_id: string | null;
  entry_id: string | null;
  ha_name: string | null;
  device_type: string | null;
  grenton_type: string | null;
  mode: "polling" | "push" | null;
  interval: number | null;
  area: string | null;
  flags: string[];
}

export interface TypeSummaryEntry {
  type: string;
  count: number;
  supported: boolean;
}

export interface PushFix {
  kind: "service" | "retarget";
  target_entity: string;
  device_type?: string;
  current_service?: string;
  suggested_service?: string;
  valid_services?: string[];
  new_entity?: string;
  source_grenton_id?: string;
  entity_grenton_id?: string;
}

export interface ScaffoldingCheck {
  name: string;
  desc: string;
  present: boolean;
  required: boolean;
}

export interface Report {
  verdict: "ok" | "issues";
  summary: {
    ha_total: number;
    om_total: number;
    push_events: number;
    polling: number;
    push: number;
    per_domain: Record<string, { polling: number; push: number }>;
    endpoints: [string, number][];
  };
  orphans: unknown[];
  push_no_event: unknown[];
  push_service_mismatch: unknown[];
  push_object_mismatch: unknown[];
  poll_with_push: unknown[];
  push_orphan_targets: string[];
  push_fixes: PushFix[];
  not_in_ha: unknown[];
  not_in_ha_by_type: [string, number][];
  unsupported_count: number;
  scaffolding: { checks: ScaffoldingCheck[]; missing: ScaffoldingCheck[]; push_used: boolean } | null;
  type_summary: TypeSummaryEntry[];
  merged: MergedRow[];
}

/** Minimal shape of the `hass` object we use. */
export interface HomeAssistant {
  states: Record<string, { entity_id: string; state: string; attributes: Record<string, any> }>;
  connection: { sendMessagePromise: <T>(msg: Record<string, unknown>) => Promise<T> };
  [key: string]: any;
}
