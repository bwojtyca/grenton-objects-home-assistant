/*
 * Grenton Objects — OM project analysis panel (Home Assistant custom panel).
 *
 * Upload an Object Manager project (.omp); the backend `grenton_objects/analyze`
 * websocket command reconciles it against the live HA configuration and returns
 * a report. Rendered with Lit on top of HA's native hass-tabs-subpage-data-table
 * (search, grouping, sorting, column config, a filter pane) — the same layout as
 * Settings → Entities — minus row selection.
 *
 * Repository: https://github.com/bwojtyca/grenton-objects-home-assistant
 */
import { LitElement, html, css, nothing, type PropertyValues, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { stateColorCss } from "./state-color";
import type { HomeAssistant, MergedRow, Report, TypeSummaryEntry } from "./report-types";

const DOMAIN = "grenton_objects";

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
  grenton_id: string;
  clu: string;
  type: string;
  entity_id: string;
  entry_id: string;
  domain: string;
  update: string;
  updateCat: string;
  status: string;
  sev: keyof typeof SEV_HEX;
  statusCat: string;
  hint?: string;
}

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
  @state() private _search = "";
  @state() private _typeSel = new Set<string>();
  @state() private _updSel = new Set<string>();
  @state() private _statSel = new Set<string>();

  private _entityIds = new Set<string>();

  static styles = css`
    :host { display: block; height: 100%; }
    .pad { padding: 16px; box-sizing: border-box; }
    ha-card { display: block; max-width: 720px; margin: 24px auto; }
    .card-content { padding: 16px; }
    p.intro { margin-top: 0; color: var(--secondary-text-color); }
    .banner { padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; }
    .summary { line-height: 1.6; }
    .muted { color: var(--secondary-text-color); }
    .problems div.active-error { font-weight: 600; }
    .scaffold { margin-top: 8px; }
    .scaffold .title { font-weight: 600; margin-bottom: 4px; }
    .filter-header { display: flex; align-items: center; gap: 8px; width: 100%; }
    .badge {
      background: var(--primary-color); color: var(--text-primary-color, #fff);
      border-radius: 10px; min-width: 18px; height: 18px; padding: 0 5px; font-size: 0.75em;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .filter-clear { margin-left: auto; color: var(--secondary-text-color); cursor: pointer; }
    .entity { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
    .entity ha-state-icon { flex: 0 0 auto; --mdc-icon-size: 22px; }
    .cog { cursor: pointer; color: var(--secondary-text-color); }
    ha-label { cursor: help; }
    ha-tooltip { --ha-tooltip-max-width: 320px; }
  `;

  // Re-render on hass change only when one of our entities actually changed.
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

  render() {
    if (!this._report) {
      return html`<div class="pad">${this._uploadCard()}${this._error ? this._errorAlert() : nothing}</div>`;
    }
    if (customElements.get("hass-tabs-subpage-data-table")) {
      return this._subpage();
    }
    // Fallback if the native layout chunk isn't loaded: plain table, no menus.
    return html`
      <div class="pad">
        ${this._verdictAlert()}
        <ha-card><div class="banner">${this._summaryInner()}</div></ha-card>
        <ha-card header="Wszystkie obiekty">
          <div class="card-content">
            <ha-data-table
              .hass=${this.hass}
              .columns=${this._columns()}
              .data=${this._viewRows}
              .filter=${this._search}
              .autoHeight=${true}
            ></ha-data-table>
          </div>
        </ha-card>
      </div>
    `;
  }

  private _subpage() {
    return html`
      <hass-tabs-subpage-data-table
        .hass=${this.hass}
        .localizeFunc=${this.hass.localize}
        .narrow=${this.narrow}
        ?main-page=${true}
        .route=${this.route ?? { prefix: "", path: "" }}
        .tabs=${[]}
        .columns=${this._columns()}
        .data=${this._viewRows}
        .initialGroupColumn=${"clu"}
        .filter=${this._search}
        @search-changed=${(e: any) => (this._search = e.detail.value)}
        .searchLabel=${"Szukaj obiektów"}
        ?has-filters=${true}
        .filters=${this._activeFilterCount()}
        @clear-filter=${this._resetFilters}
        .noDataText=${"Brak obiektów dla wybranych filtrów"}
      >
        <ha-icon-button
          slot="toolbar-icon"
          .label=${"Wgraj inny plik .omp"}
          @click=${this._pickFile}
        >
          <ha-icon icon="mdi:upload"></ha-icon>
        </ha-icon-button>

        <div slot="top-header" class="banner">
          ${this._verdictAlert()}
          ${this._summaryInner()}
          <input type="file" accept=".omp,.zip" style="display:none" @change=${this._onFile} />
        </div>

        ${this._filterGroups()}
      </hass-tabs-subpage-data-table>
    `;
  }

  private _uploadCard() {
    return html`
      <ha-card header="Analiza projektu Grenton">
        <div class="card-content">
          <p class="intro">
            Wgraj plik projektu Object Managera (.omp). Zostanie porównany z aktualną
            konfiguracją Home Assistant — nic nie jest zmieniane.
          </p>
          <ha-button raised @click=${this._pickFile}>Wybierz plik .omp</ha-button>
          <input type="file" accept=".omp,.zip" style="display:none" @change=${this._onFile} />
          ${this._busy
            ? html`<div class="muted" style="margin-top:12px">Analizuję projekt… (${this._busyName})</div>`
            : nothing}
        </div>
      </ha-card>
    `;
  }

  private _errorAlert() {
    return html`<ha-alert alert-type="error" title="Błąd analizy">${this._error}</ha-alert>`;
  }

  private _verdictAlert() {
    const ok = this._report!.verdict === "ok";
    return html`<ha-alert
      alert-type=${ok ? "success" : "warning"}
      title=${ok ? "Integracja spójna z projektem" : "Wykryto rozbieżności"}
    ></ha-alert>`;
  }

  private _summaryInner() {
    const r = this._report!;
    const s = r.summary;
    const domains = Object.keys(s.per_domain)
      .sort((a, b) => s.per_domain[b].push + s.per_domain[b].polling - (s.per_domain[a].push + s.per_domain[a].polling))
      .map((d) => `${d} (${s.per_domain[d].push} push / ${s.per_domain[d].polling} polling)`)
      .join(" · ");
    const missingByType = r.not_in_ha_by_type.map(([t, c]) => `${c}× ${t}`).join(", ");
    const problems = [
      { label: "encje HA bez obiektu w projekcie", count: r.orphans.length, sev: "error" },
      { label: "push aktualizujący zły obiekt Grentona", count: r.push_object_mismatch.length, sev: "error" },
      { label: "push z niewłaściwą akcją dla typu encji", count: r.push_service_mismatch.length, sev: "error" },
      { label: "encje push bez zdarzenia w Grentonie", count: r.push_no_event.length, sev: "error" },
      { label: "zdarzenia push w nieistniejącą encję", count: r.push_orphan_targets.length, sev: "error" },
      { label: "polling z jednoczesnym push (redundancja)", count: r.poll_with_push.length, sev: "warn" },
      { label: `obiekty Grentona nieobecne w HA${missingByType ? " (" + missingByType + ")" : ""}`, count: r.not_in_ha.length, sev: "missing" },
    ];
    const hasProblem = problems.some((p) => p.count > 0 && (p.sev === "error" || p.sev === "warn"));
    return html`
      <div class="summary">
        <div>
          Obiekty projektu: <b>${s.om_total}</b> · Encje w HA: <b>${s.ha_total}</b> ·
          Zdarzenia push (Grenton→HA): <b>${s.push_events}</b> ·
          Tryb: <b>${s.push}</b> push / <b>${s.polling}</b> polling<br />
          <span class="muted">Wg domeny: ${domains}</span>
        </div>
        <div class="problems" style="margin-top:8px">
          ${!hasProblem && r.not_in_ha.length === 0
            ? html`<div style=${`color:${SEV_HEX.ok}`}>Brak problemów — wszystko spójne.</div>`
            : problems.map((p) => {
                const active = p.count > 0;
                const color = active ? SEV_HEX[p.sev] : SEV_HEX.muted;
                const cls = active && (p.sev === "error" || p.sev === "warn") ? "active-error" : "";
                return html`<div class=${cls} style=${`color:${color}`}>${p.count} ${p.label}</div>`;
              })}
        </div>
        ${r.scaffolding ? this._scaffold(r.scaffolding) : nothing}
      </div>
    `;
  }

  private _scaffold(sc: NonNullable<Report["scaffolding"]>) {
    return html`
      <div class="scaffold">
        <div class="title">Konfiguracja po stronie Grentona (skrypty/obiekty)</div>
        ${!sc.push_used
          ? html`<div class="muted" style="font-size:0.9em;margin-bottom:4px">Push nieużywany — obiekty kolejki nie są wymagane.</div>`
          : nothing}
        ${sc.checks.map((c) => {
          let color = SEV_HEX.muted;
          let mark = "obecny";
          if (!c.present) {
            if (c.required) { color = SEV_HEX.error; mark = "BRAK (wymagane)"; }
            else { mark = "brak (opcjonalne)"; }
          } else { color = SEV_HEX.ok; }
          return html`<div style=${`color:${color}`}>${c.name} — ${c.desc}: ${mark}</div>`;
        })}
      </div>
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
      return {
        id: r.grenton_id || r.entity_id || String(i),
        name: r.om_name || r.ha_name || "",
        grenton_id: r.grenton_id || "",
        clu,
        type: r.om_type || r.device_type || "—",
        entity_id: r.entity_id || "",
        entry_id: r.entry_id || "",
        domain: r.entity_id ? r.entity_id.split(".")[0] : "—",
        update,
        updateCat,
        status: st.label,
        sev: st.sev,
        statusCat: st.cat,
        hint: st.hint,
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
      type: { title: "Typ Grenton", sortable: true, filterable: true, groupable: true, hideable: true, width: "140px" },
      entity_id: { title: "Encja HA", sortable: true, filterable: true, hideable: true, width: "260px",
        template: (a: any, b: any) => this._entityCell(b ?? a) },
      domain: { title: "Domena HA", filterable: true, groupable: true, hideable: true, defaultHidden: true },
      update: { title: "Aktualizacja", sortable: true, filterable: true, hideable: true, width: "150px" },
      updateCat: { title: "Tryb aktualizacji", filterable: true, groupable: true, hideable: true, defaultHidden: true },
      status: { title: "Status", sortable: true, filterable: true, groupable: true, hideable: true, width: "220px",
        template: (a: any, b: any) => this._statusCell(b ?? a) },
      actions: { title: "Akcje", width: "64px", template: (a: any, b: any) => this._actionsCell(b ?? a) },
    };
  }

  private _entityCell(row: ViewRow): TemplateResult {
    if (!row.entity_id) return html`<span class="muted">—</span>`;
    const st = this.hass?.states?.[row.entity_id];
    const color = st ? stateColorCss(st as any) ?? "var(--secondary-text-color)" : "var(--secondary-text-color)";
    const stateStr = st ? this._formatState(st) : "niedostępna";
    return html`
      <span class="entity" @click=${() => this._moreInfo(row.entity_id)}>
        ${st ? html`<ha-state-icon .stateObj=${st} style=${`color:${color}`}></ha-state-icon>` : nothing}
        <span>${row.entity_id}<span class="muted"> · ${stateStr}</span></span>
      </span>
    `;
  }

  private _statusCell(row: ViewRow): TemplateResult {
    const label = html`<ha-label dense .color=${SEV_HEX[row.sev]}>${row.status}</ha-label>`;
    return row.hint ? html`<ha-tooltip content=${row.hint}>${label}</ha-tooltip>` : label;
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

  // All rows (pre-filter) for filter-pane counts.
  private _allViewRows(): ViewRow[] {
    const merged = this._report?.merged ?? [];
    return merged.map((r): ViewRow => {
      const st = statusInfo(r);
      return {
        id: "", name: "", grenton_id: "", clu: "", type: r.om_type || r.device_type || "—",
        entity_id: "", entry_id: "", domain: "", update: "",
        updateCat: r.in_ha ? (r.mode ?? "brak") : "brak",
        status: st.label, sev: st.sev, statusCat: st.cat,
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

  private _onFile = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    this._error = undefined;
    this._busy = true;
    this._busyName = file.name;
    try {
      const buffer = await file.arrayBuffer();
      const report = await this.hass.connection.sendMessagePromise<Report>({
        type: "grenton_objects/analyze",
        omp_base64: toBase64(buffer),
      });
      this._report = report;
      this._entityIds = new Set(report.merged.map((r) => r.entity_id).filter((x): x is string => !!x));
      this._typeSel = this._defaultTypeSel();
      this._updSel = new Set();
      this._statSel = new Set();
    } catch (err: any) {
      this._error = err?.message || err?.code || "Nie udało się odczytać pliku .omp.";
    } finally {
      this._busy = false;
    }
  };

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
