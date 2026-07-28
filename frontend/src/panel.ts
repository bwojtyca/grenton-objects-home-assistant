/*
 * Grenton Objects — OM project analysis panel (Home Assistant custom panel).
 *
 * Upload an Object Manager project (.omp); the backend `grenton_objects/analyze`
 * websocket command reconciles it against the live HA configuration and returns
 * a report. Rendered with Lit on top of HA's native layouts/components
 * (hass-tabs-subpage-data-table, ha-file-upload, ha-dialog, ha-tooltip…) — the
 * same look & feel as Settings → Entities, minus row selection.
 *
 * Repository: https://github.com/bwojtyca/grenton-objects-home-assistant
 */
import { LitElement, html, css, nothing, type PropertyValues, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { stateColorCss } from "./state-color";
import type { HomeAssistant, MergedRow, PushFix, Report, TypeSummaryEntry } from "./report-types";

// A push-binding fix staged for the .omp download (accumulated, then applied in
// one corrected file). `title`/`detail` are the human description shown in the
// pending list; new_service/new_entity are the actual edit sent to the backend.
interface PendingFix {
  target_entity: string;
  kind: "service" | "retarget" | "inject";
  title: string;
  detail: string;
  new_service?: string;
  new_entity?: string;
  inject?: {
    obj_id: string;
    om_name: string;
    clu_ref: string;
    entity: string;
    device_type: string | null;
    grenton_type: string | null;
    om_type: string | null;
  };
}

// OM types we can auto-inject a push event for (verified single-source, plus
// roller). RGB/RGB+W are excluded — no verified template (source goes into
// string_value). Mirrors rewrite.py::_PUSH_EVENT_BY_OM_TYPE / push_recipe.
const PUSH_INJECTABLE = new Set([
  "DALI_GEAR", "DALI_GEAR_DT8", "ROLLER_SHUTTER", "DIN", "SatelInput",
  "SatelOutput", "SatelZone", "DOUT", "LED_CHANNEL", "ONEW_SENSOR",
  "ANALOG_OUT", "ANALOG_IN",
]);

function pushInjectable(omType: string | null): boolean {
  const t = omType || "";
  return PUSH_INJECTABLE.has(t) || (t.startsWith("DALI") && !t.includes("MASTER"));
}

const DOMAIN = "grenton_objects";
const PAGE_TITLE = "Analiza projektu Grenton";

const SEV_HEX: Record<string, string> = {
  error: "#db4437",
  warn: "#f9a825",
  missing: "#3d70b2",
  ok: "#43a047",
  muted: "#9e9e9e",
};

const UPDATE_CATS = [
  { key: "push", label: "push" },
  { key: "polling", label: "polling" },
  { key: "brak", label: "brak" },
];
const STATUS_CATS = [
  { key: "problem", label: "Problem" },
  { key: "ok", label: "OK" },
  { key: "missing", label: "Brak w HA" },
  { key: "unsupported", label: "Nieobsługiwany" },
];

const slug = (s: string) => s.replace(/[^a-zA-Z0-9]+/g, "_");

const DEVICE_TYPE_LABELS: Record<string, string> = {
  light: "Światło (light)",
  switch: "Przełącznik (switch)",
  cover: "Roleta / napęd (cover)",
  climate: "Termostat (climate)",
  sensor: "Czujnik (sensor)",
  binary_sensor: "Czujnik binarny (binary_sensor)",
};

// Fallback for unknown OM types — offer everything, guess switch first.
const ALL_DEVICE_TYPES = ["switch", "light", "cover", "climate", "sensor", "binary_sensor"];

// Which HA entity types make sense for a given Grenton object type. First entry
// is the default. A DIN input can only be a binary_sensor — never a climate.
const DEVICE_TYPES_BY_OM: Record<string, string[]> = {
  DOUT: ["switch", "light"], // relay: could drive a load or a lamp
  DIN: ["binary_sensor"],
  ROLLER_SHUTTER: ["cover"],
  ONEW_SENSOR: ["sensor"],
  Thermostat: ["climate"],
  LED_CHANNEL: ["light"],
  LEDRGB: ["light"],
  SatelInput: ["binary_sensor"],
  SatelOutput: ["switch"],
  SatelZone: ["switch"],
};

function allowedDeviceTypes(omType: string): string[] {
  const t = omType || "";
  if (DEVICE_TYPES_BY_OM[t]) return DEVICE_TYPES_BY_OM[t];
  if (t.startsWith("DALI") || t.startsWith("LED")) return ["light"];
  return ALL_DEVICE_TYPES;
}

// Labels for the add/confirm ha-form (same widget mechanism as the config flow).
const ADD_FIELD_LABELS: Record<string, string> = {
  name: "Nazwa encji",
  device_type: "Typ encji w HA",
  grenton_type: "Typ Grenton",
  api_endpoint: "Adres bramki (API)",
  grenton_id: "Grenton ID",
  device_class: "Klasa urządzenia",
  reversed: "Odwróć kierunek",
  auto_update: "Automatyczne odświeżanie (polling)",
  update_interval: "Częstotliwość odświeżania (s)",
};

const COVER_CLASSES = ["shutter", "blind", "curtain", "awning", "garage", "gate", "window", "door", "damper", "shade"];

// Grenton object type options per HA device type (mirrors const.py's
// *_GRENTON_TYPE_OPTIONS). cover/climate have no grenton_type.
const GRENTON_TYPE_OPTIONS: Record<string, string[]> = {
  light: ["DOUT", "DALI", "DIMMER", "LED", "RGB", "RGB+W", "LED_R", "LED_G", "LED_B", "LED_W", "LED_CHANNEL"],
  switch: ["DOUT", "SATEL_OUTPUT", "SATEL_ZONE"],
  binary_sensor: ["DIN", "SATEL_INPUT"],
  sensor: [
    "DEFAULT_SENSOR", "MODBUS_RTU", "MODBUS_VALUE", "MODBUS", "MODBUS_CLIENT",
    "MODBUS_SERVER", "MODBUS_SLAVE_RTU", "RELAY_POWER", "ANALOG_SCALED_VALUE_OR_VALUE_%",
  ],
};

// Best-effort Grenton object type for a new entity (mirrors report.py
// _infer_grenton_type) — e.g. a DALI_GEAR object → DALI, not a plain DOUT.
function inferGrentonType(deviceType: string, omType: string): string {
  const t = omType || "";
  if (deviceType === "binary_sensor") return t === "SatelInput" ? "SATEL_INPUT" : "DIN";
  if (deviceType === "switch") {
    if (t === "SatelZone") return "SATEL_ZONE";
    if (t === "SatelOutput") return "SATEL_OUTPUT";
    return "DOUT";
  }
  if (deviceType === "light") {
    if (t.startsWith("DALI")) return "DALI";
    if (t === "LEDRGB") return "RGB";
    if (t === "LED_CHANNEL") return "LED_CHANNEL";
    if (t.startsWith("LED")) return "LED";
    if (t.toUpperCase().includes("DIM")) return "DIMMER";
    return "DOUT";
  }
  if (deviceType === "sensor") return "DEFAULT_SENSOR";
  return ""; // cover / climate: no grenton_type
}

interface StatusInfo {
  label: string;
  sev: keyof typeof SEV_HEX;
  cat: string;
  hint?: string;
}

function statusInfo(row: MergedRow): StatusInfo {
  const f = row.flags;
  if (f.includes("orphan"))
    return { label: "Błąd: brak w projekcie", sev: "error", cat: "problem",
      hint: "Encja HA wskazuje grenton_id, którego nie ma w projekcie OM. Obiekt usunięto/zmieniono w OM albo encja ma zły grenton_id — popraw jedno z nich." };
  if (f.includes("push_wrong_object"))
    return { label: "Błąd: push ze złego obiektu", sev: "error", cat: "problem",
      hint: "Zdarzenie push aktualizuje tę encję stanem INNEGO obiektu Grentona niż jej grenton_id. Popraw źródło w zdarzeniu (OnChange) obiektu w OM." };
  if (f.includes("push_bad_service"))
    return { label: "Błąd: zła akcja push", sev: "error", cat: "problem",
      hint: "Akcja push nie pasuje do typu encji. Użyj: light→set_state/set_brightness/set_rgb, switch/binary_sensor→set_state, cover→set_cover, sensor→set_value." };
  if (f.includes("push_no_event"))
    return { label: "Błąd: push bez zdarzenia", sev: "error", cat: "problem",
      hint: "Encja jest w trybie push, ale w projekcie nie ma dla niej zdarzenia HA_Integration_Queue_Prepare. Dodaj zdarzenie OnChange w OM albo włącz polling." };
  if (f.includes("poll_redundant"))
    return { label: "Uwaga: polling + push", sev: "warn", cat: "problem",
      hint: "Encja jest pollowana i jednocześnie ma zdarzenie push — podwójna aktualizacja. Wyłącz auto-update albo usuń zdarzenie push w OM." };
  if (row.in_ha) return { label: "OK", sev: "ok", cat: "ok" };
  if (row.is_unsupported)
    return { label: "Nieobsługiwany w integracji", sev: "muted", cat: "unsupported",
      hint: "Integracja nie potrafi wystawić tego typu obiektu Grentona (np. DALI_MASTER, kontener Satel)." };
  return { label: "Brak w HA", sev: "missing", cat: "missing",
    hint: "Obiekt istnieje w projekcie Grentona, ale nie jest dodany do HA. Dodaj go przez integrację, jeśli chcesz go używać." };
}

interface ViewRow {
  id: string;
  name: string;
  om_name: string;
  grenton_type: string;
  grenton_id: string;
  clu: string;
  module: string;
  type: string;
  entity_id: string;
  entry_id: string;
  domain: string;
  update: string;
  updateCat: string;
  status: string;
  sev: keyof typeof SEV_HEX;
  statusCat: string;
  flag: string;
}

const PROBLEM_FLAGS = ["orphan", "push_wrong_object", "push_bad_service", "push_no_event", "poll_redundant", "not_in_ha"];

const DOMAIN_SERVICES: Record<string, string> = {
  light: "set_state / set_brightness / set_rgb / set_rgbw",
  switch: "set_state",
  binary_sensor: "set_state",
  cover: "set_cover",
  sensor: "set_value",
  climate: "set_therm_state / set_therm_target_temp",
};

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(binary);
}

@customElement("grenton-objects-panel")
export class GrentonObjectsPanel extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) public narrow = false;
  @property({ attribute: false }) public route?: any;
  @property({ attribute: false }) public panel?: unknown;

  @state() private _report?: Report;
  @state() private _error?: string;
  @state() private _busy = false;
  @state() private _busyName = "";
  @state() private _summaryOpen = false;
  @state() private _issue?: ViewRow;
  @state() private _addRow?: ViewRow; // row being added to HA (opens the add/confirm dialog)
  @state() private _addData: Record<string, any> = {}; // editable ha-form values for that dialog
  @state() private _svcChoice = ""; // chosen service in the push-service issue dialog
  @state() private _pendingFixes: PendingFix[] = []; // staged .omp push fixes
  @state() private _pendingOpen = false; // pending-changes dialog open
  @state() private _columnOrder?: string[];
  @state() private _hiddenColumns?: string[];
  @state() private _search = "";
  @state() private _typeSel = new Set<string>();
  @state() private _updSel = new Set<string>();
  @state() private _statSel = new Set<string>();

  private _entityIds = new Set<string>();
  private _lastOmp?: string; // base64 of the uploaded .omp, kept to re-run analysis after a repair

  static styles = css`
    :host { display: block; height: 100%; }
    .pad { padding: 24px; box-sizing: border-box; max-width: 720px; margin: 0 auto; }
    ha-file-upload { display: block; }
    .intro { color: var(--secondary-text-color); margin: 0 0 16px; }
    /* compact clickable stat strip in the page header area */
    .stat-bar {
      display: flex; align-items: center; gap: 12px; width: 100%; box-sizing: border-box;
      padding: 8px 16px; cursor: pointer; border: none; background: var(--secondary-background-color);
      color: var(--primary-text-color); font: inherit; text-align: left;
      border-bottom: 1px solid var(--divider-color);
    }
    .stat-bar .verdict { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; }
    .stat-bar .verdict.issues { color: var(--warning-color); }
    .stat-bar .verdict.ok { color: var(--success-color); }
    .stat-bar .nums { color: var(--secondary-text-color); }
    .stat-bar .more { margin-left: auto; color: var(--primary-color); }
    /* summary dialog */
    .summary h4 { margin: 16px 0 4px; }
    .summary ul { margin: 0; padding-left: 18px; }
    .summary dl.stats { display: grid; grid-template-columns: auto auto; gap: 2px 16px; margin: 0; }
    .summary dl.stats dt { color: var(--secondary-text-color); }
    .summary .problems li.active-error { font-weight: 600; }
    /* table cells */
    .filter-header { display: flex; align-items: center; gap: 8px; width: 100%; }
    .badge {
      background: var(--primary-color); color: var(--text-primary-color, #fff);
      border-radius: 10px; min-width: 18px; height: 18px; padding: 0 5px; font-size: 0.75em;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .filter-clear { margin-left: auto; color: var(--secondary-text-color); cursor: pointer; }
    .entity { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
    .entity ha-state-icon { flex: 0 0 auto; --mdc-icon-size: 22px; }
    .status-cell { display: inline-block; cursor: pointer; }
    .cog { cursor: pointer; color: var(--secondary-text-color); }
    .issue { line-height: 1.5; max-width: 460px; }
    .issue-sec { margin-bottom: 12px; }
    .issue-h { font-weight: 600; margin-bottom: 2px; }
    .issue-action { margin-top: 6px; }
    .add-action { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .add-dialog { min-width: min(460px, 82vw); }
    .add-dialog ha-form { display: block; }
    .add-hint { color: var(--secondary-text-color); margin: 4px 0 12px; }
    /* pending .omp changes bar (above the table) */
    .pending-bar {
      display: flex; align-items: center; gap: 12px; width: 100%; box-sizing: border-box;
      padding: 8px 16px; color: var(--primary-text-color);
      background: color-mix(in srgb, var(--warning-color) 16%, var(--card-background-color));
      border-bottom: 1px solid var(--warning-color);
    }
    .pending-bar > ha-icon { color: var(--warning-color); flex: 0 0 auto; }
    .pending-info {
      flex: 1; text-align: left; background: none; border: none; padding: 0;
      color: inherit; font: inherit; cursor: pointer; text-decoration: underline dotted;
    }
    .pending ha-list { display: block; margin-top: 8px; }
    .dialog-footer { display: flex; gap: var(--ha-space-3, 12px); justify-content: flex-end; align-items: center; flex-wrap: wrap; padding: 8px 24px 16px; }
  `;

  protected shouldUpdate(changed: PropertyValues): boolean {
    if (changed.size === 1 && changed.has("hass")) {
      const prev = changed.get("hass") as HomeAssistant | undefined;
      if (prev && this._entityIds.size) {
        for (const id of this._entityIds) {
          if (prev.states[id] !== this.hass.states[id]) return true;
        }
      }
      return false;
    }
    return true;
  }

  protected firstUpdated(): void {
    const w = window as any;
    if (!customElements.get("ha-data-table") && w.loadCardHelpers) {
      w.loadCardHelpers()
        .then((h: any) => h?.createCardElement?.({ type: "entities", entities: [] }))
        .catch(() => {});
    }
  }

  private get _tabs() {
    return [{ name: PAGE_TITLE, path: this.route?.prefix ?? `/${DOMAIN}` }];
  }

  render() {
    return this._report ? this._reportView() : this._startView();
  }

  // ─── start view (upload) ────────────────────────────────────────────

  private _startView() {
    const content = html`
      <div class="pad">
        <p class="intro">
          Wgraj plik projektu Object Managera (.omp). Zostanie porównany z aktualną
          konfiguracją Home Assistant — nic nie jest zmieniane.
        </p>
        ${this._uploadUI()}
        ${this._error ? html`<ha-alert alert-type="error" title="Błąd analizy" style="margin-top:16px">${this._error}</ha-alert>` : nothing}
      </div>
    `;
    if (customElements.get("hass-tabs-subpage")) {
      return html`<hass-tabs-subpage
        .hass=${this.hass}
        .narrow=${this.narrow}
        ?main-page=${true}
        .route=${this.route ?? { prefix: "", path: "" }}
        .tabs=${this._tabs}
      >${content}</hass-tabs-subpage>`;
    }
    return content;
  }

  private _uploadUI() {
    if (customElements.get("ha-file-upload")) {
      return html`<ha-file-upload
        .localize=${this.hass.localize}
        accept=".omp,.zip"
        .icon=${"mdi:folder-upload"}
        .label=${"Przeciągnij plik .omp lub kliknij, aby wybrać"}
        .supports=${"Plik projektu Object Managera (.omp / .zip)"}
        .uploading=${this._busy}
        @file-picked=${(e: any) => this._analyze(e.detail.files?.[0])}
      ></ha-file-upload>`;
    }
    return html`
      <ha-button raised @click=${this._pickFile}>Wybierz plik .omp</ha-button>
      <input type="file" accept=".omp,.zip" style="display:none" @change=${this._onFileInput} />
      ${this._busy ? html`<div style="margin-top:12px;color:var(--secondary-text-color)">Analizuję… (${this._busyName})</div>` : nothing}
    `;
  }

  // ─── report view (native subpage table) ─────────────────────────────

  private _reportView() {
    const table = customElements.get("hass-tabs-subpage-data-table")
      ? this._subpage()
      : this._fallbackTable();
    return html`${table}${this._summaryDialog()}${this._issueDialog()}${this._addDialog()}${this._pendingDialog()}`;
  }

  private _subpage() {
    return html`
      <hass-tabs-subpage-data-table
        .hass=${this.hass}
        .localizeFunc=${this.hass.localize}
        .narrow=${this.narrow}
        ?main-page=${true}
        .route=${this.route ?? { prefix: "", path: "" }}
        .tabs=${this._tabs}
        .columns=${this._columns()}
        .data=${this._viewRows}
        .initialGroupColumn=${"clu"}
        .columnOrder=${this._columnOrder}
        .hiddenColumns=${this._hiddenColumns}
        @columns-changed=${this._onColumnsChanged}
        .filter=${this._search}
        @search-changed=${(e: any) => (this._search = e.detail.value)}
        .searchLabel=${"Szukaj obiektów"}
        ?has-filters=${true}
        .filters=${this._activeFilterCount()}
        @clear-filter=${this._resetFilters}
        .noDataText=${"Brak obiektów dla wybranych filtrów"}
      >
        <ha-icon-button slot="toolbar-icon" .label=${"Wgraj inny plik .omp"} @click=${this._pickFile}>
          <ha-icon icon="mdi:upload"></ha-icon>
        </ha-icon-button>
        <input type="file" accept=".omp,.zip" style="display:none" @change=${this._onFileInput} />
        <div slot="top-header">${this._statStrip()}${this._pendingBar()}</div>
        ${this._filterGroups()}
      </hass-tabs-subpage-data-table>
    `;
  }

  private _fallbackTable() {
    return html`
      <div class="pad" style="max-width:none">
        ${this._statStrip()}
        <ha-data-table
          .hass=${this.hass}
          .columns=${this._columns()}
          .data=${this._viewRows}
          .filter=${this._search}
          .autoHeight=${true}
        ></ha-data-table>
      </div>
    `;
  }

  private _statStrip() {
    const r = this._report!;
    const s = r.summary;
    const problemCount =
      r.orphans.length + r.push_object_mismatch.length + r.push_service_mismatch.length +
      r.push_no_event.length + r.push_orphan_targets.length + r.poll_with_push.length;
    const ok = r.verdict === "ok";
    return html`
      <button class="stat-bar" @click=${() => (this._summaryOpen = true)} title="Pokaż pełne podsumowanie">
        <span class="verdict ${ok ? "ok" : "issues"}">
          <ha-icon icon=${ok ? "mdi:check-circle" : "mdi:alert"}></ha-icon>
          ${ok ? "Spójne z projektem" : `Rozbieżności — ${problemCount} do sprawdzenia`}
        </span>
        <span class="nums">
          ${s.ha_total}/${s.om_total} obiektów w HA · ${s.push} push / ${s.polling} polling
        </span>
        <span class="more">Szczegóły →</span>
      </button>
    `;
  }

  private _summaryDialog() {
    if (!this._summaryOpen) return nothing;
    return html`
      <ha-dialog
        open
        .headerTitle=${"Podsumowanie analizy"}
        @closed=${() => (this._summaryOpen = false)}
      >
        ${this._summaryInner()}
        <div slot="footer" class="dialog-footer">
          <ha-button appearance="plain" data-dialog="close">Zamknij</ha-button>
        </div>
      </ha-dialog>
    `;
  }

  private _summaryInner() {
    const r = this._report!;
    const s = r.summary;
    const ok = r.verdict === "ok";
    const problems = [
      { label: "encje HA bez obiektu w projekcie", count: r.orphans.length, sev: "error" },
      { label: "push aktualizujący zły obiekt Grentona", count: r.push_object_mismatch.length, sev: "error" },
      { label: "push z niewłaściwą akcją dla typu encji", count: r.push_service_mismatch.length, sev: "error" },
      { label: "encje push bez zdarzenia w Grentonie", count: r.push_no_event.length, sev: "error" },
      { label: "zdarzenia push w nieistniejącą encję", count: r.push_orphan_targets.length, sev: "error" },
      { label: "polling z jednoczesnym push (redundancja)", count: r.poll_with_push.length, sev: "warn" },
      { label: "obiekty Grentona nieobecne w HA", count: r.not_in_ha.length, sev: "missing" },
    ].filter((p) => p.count > 0);
    return html`
      <div class="summary">
        <ha-alert alert-type=${ok ? "success" : "warning"}>
          ${ok ? "Integracja spójna z projektem" : "Wykryto rozbieżności"}
        </ha-alert>

        <h4>Statystyki</h4>
        <dl class="stats">
          <dt>Obiekty projektu</dt><dd><b>${s.om_total}</b></dd>
          <dt>Encje w HA</dt><dd><b>${s.ha_total}</b></dd>
          <dt>Zdarzenia push (Grenton→HA)</dt><dd><b>${s.push_events}</b></dd>
          <dt>Tryb aktualizacji</dt><dd>${s.push} push · ${s.polling} polling</dd>
        </dl>

        <h4>Wg domeny</h4>
        <ul>
          ${Object.keys(s.per_domain)
            .sort((a, b) => s.per_domain[b].push + s.per_domain[b].polling - (s.per_domain[a].push + s.per_domain[a].polling))
            .map((d) => html`<li>${d}: ${s.per_domain[d].push} push / ${s.per_domain[d].polling} polling</li>`)}
        </ul>

        <h4>Problemy${problems.length ? "" : " — brak"}</h4>
        ${problems.length
          ? html`<ul class="problems">
              ${problems.map((p) => {
                const cls = p.sev === "error" || p.sev === "warn" ? "active-error" : "";
                return html`<li class=${cls} style=${`color:${SEV_HEX[p.sev]}`}>${p.count} ${p.label}</li>`;
              })}
            </ul>`
          : nothing}
        ${r.not_in_ha.length
          ? html`<div style="color:${SEV_HEX.missing};margin-top:4px">
              ${r.not_in_ha.length} obiektów Grentona nieobecnych w HA
              (${r.not_in_ha_by_type.map(([t, c]) => `${c}× ${t}`).join(", ")})
            </div>`
          : nothing}

        ${r.scaffolding ? this._scaffold(r.scaffolding) : nothing}
      </div>
    `;
  }

  private _scaffold(sc: NonNullable<Report["scaffolding"]>) {
    return html`
      <h4>Konfiguracja po stronie Grentona</h4>
      ${!sc.push_used
        ? html`<div style="color:var(--secondary-text-color);font-size:0.9em">Push nieużywany — obiekty kolejki nie są wymagane.</div>`
        : nothing}
      <ul>
        ${sc.checks.map((c) => {
          let color = SEV_HEX.ok;
          let mark = "obecny";
          if (!c.present) {
            if (c.required) { color = SEV_HEX.error; mark = "BRAK (wymagane)"; }
            else { color = SEV_HEX.muted; mark = "brak (opcjonalne)"; }
          }
          return html`<li style=${`color:${color}`}>${c.name} — ${c.desc}: ${mark}</li>`;
        })}
      </ul>
    `;
  }

  // ─── table data + columns ──────────────────────────────────────────────

  private get _viewRows(): ViewRow[] {
    const merged = this._report?.merged ?? [];
    const rows = merged.map((r, i): ViewRow => {
      const st = statusInfo(r);
      const updateCat = r.in_ha ? (r.mode ?? "brak") : "brak";
      const update = !r.in_ha ? "brak" : r.mode === "polling" ? `polling (${r.interval ?? "?"} s)` : "push";
      const clu = r.clu || (r.grenton_id?.includes("->") ? r.grenton_id.split("->")[0] : "") || "—";
      const flag = r.flags.find((f) => PROBLEM_FLAGS.includes(f)) ?? (r.is_unsupported ? "unsupported" : r.in_ha ? "ok" : "not_in_ha");
      return {
        id: r.grenton_id || r.entity_id || String(i),
        name: r.om_name || r.ha_name || "",
        om_name: r.om_name || "",
        grenton_type: r.grenton_type || "",
        grenton_id: r.grenton_id || "",
        clu,
        module: r.module || "—",
        type: r.om_type || r.device_type || "—",
        entity_id: r.entity_id || "",
        entry_id: r.entry_id || "",
        domain: r.entity_id ? r.entity_id.split(".")[0] : "—",
        update,
        updateCat,
        status: st.label,
        sev: st.sev,
        statusCat: st.cat,
        flag,
      };
    });
    return rows.filter((r) => {
      if (this._typeSel.size && !this._typeSel.has(r.type)) return false;
      if (this._updSel.size && !this._updSel.has(r.updateCat)) return false;
      if (this._statSel.size && !this._statSel.has(r.statusCat)) return false;
      return true;
    });
  }

  private _columns() {
    return {
      name: { title: "Nazwa (Grenton)", main: true, sortable: true, filterable: true, flex: 2 },
      grenton_id: { title: "Grenton ID", sortable: true, filterable: true, hideable: true, width: "160px" },
      clu: { title: "CLU", sortable: true, filterable: true, groupable: true, hideable: true, defaultHidden: true },
      module: { title: "Moduł", sortable: true, filterable: true, groupable: true, hideable: true, defaultHidden: true },
      type: { title: "Typ Grenton", sortable: true, filterable: true, groupable: true, hideable: true, width: "140px" },
      entity_id: { title: "Encja HA", sortable: true, filterable: true, hideable: true, width: "260px",
        template: (a: any, b: any) => this._entityCell(b ?? a) },
      domain: { title: "Domena HA", filterable: true, groupable: true, hideable: true, defaultHidden: true },
      update: { title: "Aktualizacja", sortable: true, filterable: true, hideable: true, width: "150px" },
      updateCat: { title: "Tryb aktualizacji", filterable: true, groupable: true, hideable: true, defaultHidden: true },
      status: { title: "Status", sortable: true, filterable: true, groupable: true, hideable: true, width: "220px",
        template: (a: any, b: any) => this._statusCell(b ?? a) },
      actions: { title: "Akcje", width: "64px", moveable: false, hideable: false,
        template: (a: any, b: any) => this._actionsCell(b ?? a) },
    };
  }

  // Keep the "actions" column pinned last regardless of the column-config dialog
  // (HA's moveable:false would pin it left, so we re-pin it to the end).
  private _onColumnsChanged = (e: any) => {
    let order: string[] | undefined = e.detail?.columnOrder ? [...e.detail.columnOrder] : undefined;
    if (order) {
      order = order.filter((c) => c !== "actions");
      order.push("actions");
    }
    this._columnOrder = order;
    const hidden: string[] | undefined = e.detail?.hiddenColumns;
    this._hiddenColumns = hidden ? hidden.filter((c) => c !== "actions") : hidden;
  };

  private _entityCell(row: ViewRow): TemplateResult {
    if (!row.entity_id) return html`<span style="color:var(--secondary-text-color)">—</span>`;
    const st = this.hass?.states?.[row.entity_id];
    const color = st ? stateColorCss(st as any) ?? "var(--secondary-text-color)" : "var(--secondary-text-color)";
    const stateStr = st ? this._formatState(st) : "niedostępna";
    return html`
      <span class="entity" @click=${() => this._moreInfo(row.entity_id)}>
        ${st ? html`<ha-state-icon .stateObj=${st} style=${`color:${color}`}></ha-state-icon>` : nothing}
        <span>${row.entity_id}<span style="color:var(--secondary-text-color)"> · ${stateStr}</span></span>
      </span>
    `;
  }

  private _statusCell(row: ViewRow): TemplateResult {
    const label = html`<ha-label dense .color=${SEV_HEX[row.sev]}>${row.status}</ha-label>`;
    if (row.flag === "ok") return label; // nothing to explain
    return html`<span
      class="status-cell"
      title="Kliknij po szczegóły i wskazówki"
      @click=${() => this._openIssue(row)}
    >${label}</span>`;
  }

  // Context-tailored explanation for a row's status.
  private _issueDetails(row: ViewRow): { sections: { h: string; body: string }[] } {
    const dom = row.domain && row.domain !== "—" ? row.domain : row.type;
    switch (row.flag) {
      case "orphan":
        return { sections: [
          { h: "Co jest nie tak", body: `Encja ${row.entity_id} wskazuje grenton_id „${row.grenton_id}", którego nie ma w tym projekcie OM.` },
          { h: "Prawdopodobna przyczyna", body: "Obiekt został usunięty lub dostał nowy identyfikator w Object Managerze, albo encja w HA ma literówkę w grenton_id." },
          { h: "Jak poprawić", body: "Sprawdź obiekt w OM i popraw grenton_id encji (ikona koła zębatego → Konfiguruj), albo usuń nieaktualną encję." },
        ] };
      case "push_wrong_object":
        return { sections: [
          { h: "Co jest nie tak", body: `Zdarzenie push aktualizuje tę encję (${row.grenton_id}) stanem INNEGO obiektu Grentona.` },
          { h: "Czego oczekiwano", body: "Źródło w zdarzeniu powinno wskazywać ten sam obiekt, na który wskazuje encja." },
          { h: "Jak poprawić", body: "W OM otwórz zdarzenie OnChange obiektu i popraw drugi argument HA_Integration_Queue_Prepare (źródło stanu) na właściwy obiekt." },
        ] };
      case "push_bad_service":
        return { sections: [
          { h: "Co jest nie tak", body: `Push tej encji używa akcji, która nie pasuje do jej typu (${dom}).` },
          { h: "Czego oczekiwano", body: `Dla typu „${dom}" akcja powinna być: ${DOMAIN_SERVICES[dom] || "właściwa dla typu encji"}.` },
          { h: "Jak poprawić", body: "W OM zmień akcję w wywołaniu HA_Integration_Queue_Prepare (w zdarzeniu OnChange obiektu) na właściwą." },
        ] };
      case "push_no_event":
        return { sections: [
          { h: "Co jest nie tak", body: "Encja jest w trybie push, ale w projekcie nie ma dla niej żadnego zdarzenia push (HA_Integration_Queue_Prepare)." },
          { h: "Jak poprawić", body: "Wygeneruj zdarzenie push do .omp poniżej (do zweryfikowania w OM) albo w HA włącz automatyczne odświeżanie (polling)." },
        ] };
      case "poll_redundant":
        return { sections: [
          { h: "Co jest nie tak", body: "Encja jest odpytywana (polling) i JEDNOCZEŚNIE ma zdarzenie push — aktualizuje się dwoma drogami." },
          { h: "Jak poprawić", body: "Wyłącz automatyczne odświeżanie (auto-update) dla tej encji — wystarczy push. Ewentualnie usuń zdarzenie push w OM." },
        ] };
      case "unsupported":
        return { sections: [
          { h: "Co jest nie tak", body: `Integracja nie potrafi wystawić obiektu typu „${row.type}" jako encji HA (np. DALI_MASTER, kontener Satel).` },
          { h: "Co zrobić", body: "Nic — ten obiekt po prostu nie ma odpowiednika w HA." },
        ] };
      default: // not_in_ha
        return { sections: [
          { h: "Co jest nie tak", body: `Obiekt „${row.grenton_id}" (${row.type}) istnieje w projekcie Grentona, ale nie jest dodany do HA.` },
          { h: "Jak dodać", body: `Wybierz typ encji i kliknij „Dodaj do HA" — encja powstanie z pollingiem (adres bramki jak w pozostałych obiektach). Domyślny typ to podpowiedź dla „${row.type}"; DOUT bywa światłem lub przełącznikiem — zmień, jeśli trzeba. Aktualizację przez push skonfigurujesz później w OM.` },
        ] };
    }
  }

  private _issueDialog() {
    const row = this._issue;
    if (!row) return nothing;
    const d = this._issueDetails(row);
    return html`
      <ha-dialog open .headerTitle=${row.status} @closed=${() => (this._issue = undefined)}>
        <div class="issue">
          ${d.sections.map((s) => html`<div class="issue-sec"><div class="issue-h">${s.h}</div><div>${s.body}</div></div>`)}
          ${row.flag === "poll_redundant" && row.entry_id
            ? html`<div class="issue-action">
                <ha-button appearance="accent" size="small" @click=${() => this._fixDisablePolling(row)}>
                  Napraw: wyłącz polling
                </ha-button>
              </div>`
            : nothing}
          ${row.flag === "not_in_ha" && row.grenton_id
            ? html`<div class="issue-action">
                <ha-button appearance="accent" size="small" @click=${() => this._openAdd(row)}>
                  Dodaj do HA…
                </ha-button>
              </div>`
            : nothing}
          ${(row.flag === "push_bad_service" || row.flag === "push_wrong_object") && this._pushFixFor(row)
            ? this._pushFixAction(row, this._pushFixFor(row)!)
            : nothing}
          ${row.flag === "push_no_event" && row.entity_id
            ? this._injectAction(row)
            : nothing}
        </div>
        <div slot="footer" class="dialog-footer">
          ${row.entry_id
            ? html`<ha-button appearance="plain" @click=${() => { this._issue = undefined; this._openConfig(row.entry_id); }}>
                Konfiguruj encję
              </ha-button>`
            : nothing}
          <ha-button appearance="plain" data-dialog="close">Zamknij</ha-button>
        </div>
      </ha-dialog>
    `;
  }

  private _openIssue(row: ViewRow) {
    const fix = this._pushFixFor(row);
    this._svcChoice = fix?.kind === "service" ? fix.suggested_service ?? "" : "";
    this._issue = row;
  }

  // ─── push-binding fixes (Grenton-side, staged into a .omp download) ─────

  private _pushFixFor(row: ViewRow): PushFix | undefined {
    if (!row.entity_id) return undefined;
    return this._report?.push_fixes?.find((f) => f.target_entity === row.entity_id);
  }

  private _pushFixAction(row: ViewRow, fix: PushFix): TemplateResult {
    if (fix.kind === "service") {
      const services = fix.valid_services ?? [];
      const chosen = this._svcChoice || fix.suggested_service || services[0] || "";
      return html`
        <div class="issue-action add-action">
          <ha-select
            label="Poprawna usługa"
            .value=${chosen}
            naturalMenuWidth
            fixedMenuPosition
            @selected=${(e: any) => (this._svcChoice = e.target.value)}
            @closed=${(e: Event) => e.stopPropagation()}
          >
            ${services.map((s) => html`<ha-list-item .value=${s}>${s}</ha-list-item>`)}
          </ha-select>
          <ha-button appearance="accent" size="small" @click=${() => this._stageServiceFix(row, fix)}>
            Dodaj poprawkę do .omp
          </ha-button>
        </div>
      `;
    }
    return html`
      <div class="issue-action">
        <div class="issue-h">Proponowana poprawka w .omp</div>
        <div>Cel push zostanie przekierowany na encję pasującą do źródła: <b>${fix.new_entity}</b>.</div>
        <ha-button appearance="accent" size="small" @click=${() => this._stageRetargetFix(row, fix)} style="margin-top:6px">
          Dodaj poprawkę do .omp
        </ha-button>
      </div>
    `;
  }

  private _stageServiceFix(row: ViewRow, fix: PushFix) {
    const svc = this._svcChoice || fix.suggested_service || "";
    this._stageFix({
      target_entity: fix.target_entity,
      kind: "service",
      title: `Usługa push — ${row.entity_id}`,
      detail: `„${fix.current_service}" → „${svc}"`,
      new_service: svc,
    });
  }

  private _stageRetargetFix(row: ViewRow, fix: PushFix) {
    this._stageFix({
      target_entity: fix.target_entity,
      kind: "retarget",
      title: `Cel push — ${row.entity_id}`,
      detail: `push → ${fix.new_entity} (encja pasująca do źródła ${fix.source_grenton_id})`,
      new_entity: fix.new_entity,
    });
  }

  private _injectAction(row: ViewRow): TemplateResult {
    if (!pushInjectable(row.type)) {
      return html`
        <div class="issue-action">
          Automatyczne wygenerowanie zdarzenia push dla typu „${row.type}" nie jest jeszcze wspierane —
          skonfiguruj push w OM ręcznie.
        </div>
      `;
    }
    return html`
      <div class="issue-action">
        <div class="issue-h">Proponowana poprawka w .omp</div>
        <div>Wygeneruje zdarzenie push (Grenton→HA) w obiekcie <b>${row.grenton_id}</b>, kierujące stan na <b>${row.entity_id}</b>.</div>
        <ha-button appearance="accent" size="small" @click=${() => this._stageInject(row)} style="margin-top:6px">
          Dodaj zdarzenie push do .omp
        </ha-button>
      </div>
    `;
  }

  private _stageInject(row: ViewRow) {
    const objId = row.grenton_id.includes("->") ? row.grenton_id.split("->")[1] : row.grenton_id;
    const cluSerial = row.clu && row.clu !== "—" ? row.clu : row.grenton_id.split("->")[0];
    this._stageFix({
      target_entity: row.entity_id,
      kind: "inject",
      title: `Zdarzenie push — ${row.entity_id}`,
      detail: `nowe zdarzenie w obiekcie ${row.grenton_id} → push do ${row.entity_id}`,
      inject: {
        obj_id: objId,
        om_name: row.om_name,
        clu_ref: `${cluSerial}_clu`,
        entity: row.entity_id,
        device_type: row.domain !== "—" ? row.domain : null,
        grenton_type: row.grenton_type || null,
        om_type: row.type,
      },
    });
  }

  private _stageFix(fix: PendingFix) {
    const rest = this._pendingFixes.filter(
      (x) => !(x.target_entity === fix.target_entity && x.kind === fix.kind)
    );
    this._pendingFixes = [...rest, fix];
    this._issue = undefined;
    this._toast("Dodano poprawkę do puli — pobierz .omp z paska nad tabelą.");
  }

  private _pendingBar() {
    const n = this._pendingFixes.length;
    if (!n) return nothing;
    return html`
      <div class="pending-bar">
        <ha-icon icon="mdi:file-document-edit-outline"></ha-icon>
        <button class="pending-info" @click=${() => (this._pendingOpen = true)}>
          ${n} ${n === 1 ? "poprawka" : "poprawek"} do pliku .omp — kliknij, aby przejrzeć
        </button>
        <ha-button appearance="accent" size="small" @click=${this._downloadRewrite}>Pobierz poprawiony .omp</ha-button>
        <ha-button appearance="plain" size="small" @click=${this._discardPending}>Odrzuć</ha-button>
      </div>
    `;
  }

  private _pendingDialog() {
    if (!this._pendingOpen) return nothing;
    return html`
      <ha-dialog open .headerTitle=${"Poprawki do pliku .omp"} @closed=${() => (this._pendingOpen = false)}>
        <div class="pending">
          <ha-alert alert-type="warning">
            Zmiany dotyczą pliku projektu Grentona. Pobierz kopię i <b>zweryfikuj w Object Managerze</b>
            przed wgraniem do CLU — Twój oryginalny plik nie jest modyfikowany.
          </ha-alert>
          <ha-list>
            ${this._pendingFixes.map(
              (f) => html`<ha-list-item twoline hasMeta>
                <span>${f.title}</span>
                <span slot="secondary">${f.detail}</span>
                <ha-icon-button slot="meta" .label=${"Usuń poprawkę"} @click=${() => this._removePending(f)}>
                  <ha-icon icon="mdi:close"></ha-icon>
                </ha-icon-button>
              </ha-list-item>`
            )}
          </ha-list>
        </div>
        <div slot="footer" class="dialog-footer">
          <ha-button appearance="plain" @click=${this._discardPending}>Odrzuć wszystkie</ha-button>
          <ha-button appearance="accent" @click=${this._downloadRewrite}>Pobierz poprawiony .omp</ha-button>
        </div>
      </ha-dialog>
    `;
  }

  private _removePending(fix: PendingFix) {
    this._pendingFixes = this._pendingFixes.filter(
      (x) => !(x.target_entity === fix.target_entity && x.kind === fix.kind)
    );
    if (!this._pendingFixes.length) this._pendingOpen = false;
  }

  private _discardPending = () => {
    this._pendingFixes = [];
    this._pendingOpen = false;
  };

  private _downloadRewrite = async () => {
    if (!this._lastOmp || !this._pendingFixes.length) return;
    try {
      const fixes = this._pendingFixes
        .filter((f) => f.kind === "service" || f.kind === "retarget")
        .map((f) => ({
          target_entity: f.target_entity,
          ...(f.new_service ? { new_service: f.new_service } : {}),
          ...(f.new_entity ? { new_entity: f.new_entity } : {}),
        }));
      const injections = this._pendingFixes
        .filter((f) => f.kind === "inject" && f.inject)
        .map((f) => f.inject!);
      const res = await this.hass.connection.sendMessagePromise<{
        omp_base64: string;
        applied: unknown[];
        skipped: unknown[];
      }>({
        type: "grenton_objects/rewrite_omp",
        omp_base64: this._lastOmp,
        fixes,
        injections,
      });
      this._download(res.omp_base64, "ha_integration_poprawiony.omp");
      const skipped = res.skipped?.length ? ` (pominięto ${res.skipped.length})` : "";
      this._toast(`Pobrano poprawiony .omp — ${res.applied.length} zmian${skipped}. Zweryfikuj w Object Managerze.`);
    } catch (e: any) {
      this._toast(`Nie udało się przygotować pliku: ${e?.message || e?.code || "błąd"}`);
    }
  };

  private _download(base64: string, filename: string) {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/octet-stream" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ─── repair actions (HA-side) ──────────────────────────────────────────

  private async _fixDisablePolling(row: ViewRow) {
    if (!row.entry_id) return;
    this._issue = undefined;
    try {
      await this.hass.connection.sendMessagePromise({
        type: "grenton_objects/set_auto_update",
        entry_id: row.entry_id,
        auto_update: false,
      });
      await this._reanalyze(); // recompute report → redundancy disappears from summary + table
      this._toast(`Wyłączono polling dla ${row.entity_id} — aktualizacja tylko przez push.`);
    } catch (e: any) {
      this._toast(`Nie udało się: ${e?.message || e?.code || "błąd"}`);
    }
  }

  private _defaultEndpoint(): string {
    return this._report?.summary.endpoints?.[0]?.[0] ?? "";
  }

  // Open the add/confirm dialog for a Grenton object missing in HA. Fields are
  // prefilled from the OM object and existing HA config, and stay editable.
  private _openAdd(row: ViewRow) {
    const allowed = allowedDeviceTypes(row.type);
    const deviceType = allowed[0];
    this._addData = {
      name: row.name || row.grenton_id,
      device_type: deviceType,
      grenton_type: inferGrentonType(deviceType, row.type),
      api_endpoint: this._defaultEndpoint(),
      grenton_id: row.grenton_id,
      push_support: false,
      auto_update: true,
      update_interval: 30,
      reversed: false,
      device_class: deviceType === "cover" ? "shutter" : undefined,
    };
    this._addRow = row;
    this._issue = undefined;
  }

  // ha-form schema mirroring the config flow's fields for the chosen device
  // type. Recomputed on every render, so type-specific fields appear/disappear
  // as the user changes the type.
  private _addSchema(deviceType: string, omType: string) {
    const allowed = allowedDeviceTypes(omType);
    const schema: any[] = [
      { name: "name", required: true, selector: { text: {} } },
      { name: "device_type", required: true,
        selector: { select: { mode: "dropdown", options: allowed.map((d) => ({ value: d, label: DEVICE_TYPE_LABELS[d] })) } } },
      ...(GRENTON_TYPE_OPTIONS[deviceType]
        ? [{ name: "grenton_type", required: true,
            selector: { select: { mode: "dropdown", options: GRENTON_TYPE_OPTIONS[deviceType].map((g) => ({ value: g, label: g })) } } }]
        : []),
      { name: "api_endpoint", required: true, selector: { text: {} } },
      { name: "grenton_id", required: true, selector: { text: {} } },
    ];
    if (deviceType === "cover") {
      schema.push({ name: "device_class",
        selector: { select: { mode: "dropdown", options: COVER_CLASSES.map((c) => ({ value: c, label: c })) } } });
    }
    if (deviceType === "switch" || deviceType === "cover") {
      schema.push({ name: "reversed", selector: { boolean: {} } });
    }
    if (deviceType !== "climate") {
      schema.push({ name: "auto_update", selector: { boolean: {} } });
    }
    schema.push({ name: "update_interval",
      selector: { number: { min: 1, max: 3600, mode: "box", unit_of_measurement: "s" } } });
    return schema;
  }

  private _addComputeLabel = (s: { name: string }) => ADD_FIELD_LABELS[s.name] ?? s.name;

  private _addDialog() {
    const row = this._addRow;
    if (!row) return nothing;
    const deviceType = this._addData.device_type || allowedDeviceTypes(row.type)[0];
    return html`
      <ha-dialog open .headerTitle=${"Dodaj obiekt do HA"} @closed=${() => (this._addRow = undefined)}>
        <div class="add-dialog">
          <p class="add-hint">
            Obiekt „${row.grenton_id}" (${row.type}) zostanie dodany jako encja HA.
            Sprawdź i w razie potrzeby popraw poniższe pola.
          </p>
          <ha-form
            .hass=${this.hass}
            .data=${this._addData}
            .schema=${this._addSchema(deviceType, row.type)}
            .computeLabel=${this._addComputeLabel}
            @value-changed=${this._onAddFormChanged}
          ></ha-form>
          <p class="add-hint">Aktualizację przez push (Grenton→HA) skonfigurujesz później w OM.</p>
        </div>
        <div slot="footer" class="dialog-footer">
          <ha-button appearance="plain" data-dialog="close">Anuluj</ha-button>
          <ha-button appearance="accent" @click=${() => this._confirmAddObject(row)}>Dodaj do HA</ha-button>
        </div>
      </ha-dialog>
    `;
  }

  private _onAddFormChanged = (e: any) => {
    const prev = this._addData;
    const v = { ...e.detail.value };
    // When the entity type changes, re-derive the type-specific defaults so the
    // proposal stays sensible (e.g. grenton_type valid for the new type).
    if (v.device_type !== prev.device_type) {
      v.grenton_type = inferGrentonType(v.device_type, this._addRow?.type || "");
      if (v.device_type === "cover" && !v.device_class) v.device_class = "shutter";
    }
    this._addData = v;
  };

  private async _confirmAddObject(row: ViewRow) {
    const d = this._addData;
    const grentonId = (d.grenton_id || "").trim();
    if (!grentonId || !d.device_type) {
      this._toast("Uzupełnij Grenton ID i typ encji.");
      return;
    }
    this._addRow = undefined;
    try {
      await this.hass.connection.sendMessagePromise({
        type: "grenton_objects/add_object",
        grenton_id: grentonId,
        device_type: d.device_type,
        om_type: row.type,
        name: d.name || grentonId,
        api_endpoint: d.api_endpoint || undefined,
        auto_update: d.auto_update !== false,
        update_interval: Number(d.update_interval) || 30,
        ...(d.grenton_type ? { grenton_type: d.grenton_type } : {}),
        ...(d.device_class ? { device_class: d.device_class } : {}),
        ...(d.device_type === "switch" || d.device_type === "cover" ? { reversed: !!d.reversed } : {}),
      });
      await this._reanalyze(); // recompute report → object now shows as present in HA
      this._toast(`Dodano „${d.name || grentonId}" do HA jako ${d.device_type}.`);
    } catch (e: any) {
      this._toast(`Nie udało się dodać: ${e?.message || e?.code || "błąd"}`);
    }
  }

  private _toast(message: string) {
    this.dispatchEvent(new CustomEvent("hass-notification", { detail: { message }, bubbles: true, composed: true }));
  }

  private _actionsCell(row: ViewRow): TemplateResult | typeof nothing {
    if (!row.entry_id) return nothing;
    return html`<ha-icon
      class="cog"
      icon="mdi:cog"
      title="Otwórz konfigurację obiektu w integracji"
      @click=${() => this._openConfig(row.entry_id)}
    ></ha-icon>`;
  }

  private _formatState(st: { state: string; attributes: Record<string, any> }): string {
    const unit = st.attributes?.unit_of_measurement;
    return unit ? `${st.state} ${unit}` : st.state;
  }

  // ─── filter pane ───────────────────────────────────────────────────────

  private _activeFilterCount(): number {
    return this._typeSel.size + this._updSel.size + this._statSel.size;
  }

  private _filterGroups() {
    const r = this._report!;
    const counts = (field: keyof ViewRow) => {
      const c: Record<string, number> = {};
      for (const row of this._allViewRows()) c[row[field] as string] = (c[row[field] as string] || 0) + 1;
      return c;
    };
    const typeItems = r.type_summary.map((t) => ({ key: t.type, label: `${t.type} (${t.count})${t.supported ? "" : " · nieobsł."}` }));
    const uc = counts("updateCat");
    const sc = counts("statusCat");
    return html`
      ${this._filterGroup("Typ Grenton", typeItems, this._typeSel, "type")}
      ${this._filterGroup("Aktualizacja", UPDATE_CATS.map((c) => ({ key: c.key, label: `${c.label} (${uc[c.key] || 0})` })), this._updSel, "upd")}
      ${this._filterGroup("Status", STATUS_CATS.map((c) => ({ key: c.key, label: `${c.label} (${sc[c.key] || 0})` })), this._statSel, "stat")}
    `;
  }

  private _allViewRows(): ViewRow[] {
    const merged = this._report?.merged ?? [];
    return merged.map((r): ViewRow => {
      const st = statusInfo(r);
      return {
        id: "", name: "", om_name: "", grenton_type: "", grenton_id: "", clu: "", module: "", type: r.om_type || r.device_type || "—",
        entity_id: "", entry_id: "", domain: "", update: "",
        updateCat: r.in_ha ? (r.mode ?? "brak") : "brak",
        status: st.label, sev: st.sev, statusCat: st.cat, flag: "",
      };
    });
  }

  private _filterGroup(
    label: string,
    items: { key: string; label: string }[],
    sel: Set<string>,
    which: "type" | "upd" | "stat"
  ) {
    return html`
      <ha-expansion-panel slot="filter-pane" outlined .expanded=${sel.size > 0}>
        <div slot="header" class="filter-header">
          <span>${label}</span>
          ${sel.size
            ? html`<span class="badge">${sel.size}</span>
                <ha-icon
                  class="filter-clear"
                  icon="mdi:filter-variant-remove"
                  @click=${(e: Event) => { e.stopPropagation(); this._setSel(which, new Set()); }}
                ></ha-icon>`
            : nothing}
        </div>
        <ha-list multi @selected=${(e: any) => this._onListSelected(e, which, items)}>
          ${items.map(
            (it) => html`<ha-check-list-item .value=${it.key} .selected=${sel.has(it.key)}>${it.label}</ha-check-list-item>`
          )}
        </ha-list>
      </ha-expansion-panel>
    `;
  }

  private _onListSelected(e: any, which: "type" | "upd" | "stat", items: { key: string }[]) {
    const idx = e?.detail?.index;
    const indices: number[] = idx instanceof Set ? Array.from(idx) : typeof idx === "number" ? [idx] : [];
    const next = new Set<string>();
    indices.forEach((i) => { if (items[i]) next.add(items[i].key); });
    this._setSel(which, next);
  }

  private _setSel(which: "type" | "upd" | "stat", next: Set<string>) {
    if (which === "type") this._typeSel = next;
    else if (which === "upd") this._updSel = next;
    else this._statSel = next;
  }

  private _resetFilters = () => {
    this._typeSel = this._defaultTypeSel();
    this._updSel = new Set();
    this._statSel = new Set();
  };

  private _defaultTypeSel(): Set<string> {
    const ts = this._report?.type_summary ?? [];
    return new Set(ts.filter((t: TypeSummaryEntry) => t.supported && t.type !== "DIN").map((t) => t.type));
  }

  // ─── actions ─────────────────────────────────────────────────────────

  private _pickFile = () => {
    this.renderRoot.querySelector<HTMLInputElement>('input[type="file"]')?.click();
  };

  private _onFileInput = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    this._analyze(file);
  };

  private async _analyze(file?: File) {
    if (!file) return;
    this._busyName = file.name;
    const buffer = await file.arrayBuffer();
    this._lastOmp = toBase64(buffer);
    await this._doAnalyze(true);
  }

  // Re-run the analysis on the last uploaded .omp. Used after a repair action so
  // the summary AND the table reflect the changed HA config (the backend reads
  // the live config on every analyze) — resolved issues disappear.
  private async _reanalyze() {
    if (this._lastOmp) await this._doAnalyze(false);
  }

  private async _doAnalyze(resetFilters: boolean) {
    if (!this._lastOmp) return;
    this._error = undefined;
    this._busy = true;
    try {
      const report = await this.hass.connection.sendMessagePromise<Report>({
        type: "grenton_objects/analyze",
        omp_base64: this._lastOmp,
      });
      this._report = report;
      this._entityIds = new Set(report.merged.map((r) => r.entity_id).filter((x): x is string => !!x));
      if (resetFilters) {
        this._typeSel = this._defaultTypeSel();
        this._updSel = new Set();
        this._statSel = new Set();
      }
    } catch (err: any) {
      this._error = err?.message || err?.code || "Nie udało się odczytać pliku .omp.";
    } finally {
      this._busy = false;
    }
  }

  private _moreInfo(entityId: string) {
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
  }

  private _openConfig(entryId: string) {
    const path = `/config/integrations/integration/${DOMAIN}#config_entry=${entryId}`;
    window.history.pushState(null, "", path);
    this.dispatchEvent(new CustomEvent("location-changed", { bubbles: true, composed: true }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "grenton-objects-panel": GrentonObjectsPanel;
  }
}
