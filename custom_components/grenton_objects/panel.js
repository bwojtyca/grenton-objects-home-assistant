/*
 * Grenton Objects — OM project analysis panel.
 *
 * A custom Home Assistant panel (opened via the /grenton_objects URL). Uploads
 * an Object Manager project (.omp), sends it to the `grenton_objects/analyze`
 * websocket command and renders a read-only reconciliation report:
 *   - a plain-text summary (problems + Grenton-side scaffolding highlighted), and
 *   - one native ha-data-table of every object (project ∪ HA), with a coloured
 *     status column and user-driven filters (by Grenton type, update mode and
 *     status). The report is not opinionated about what to hide — the user
 *     decides; only the defaults leave DIN and unsupported types unchecked.
 *
 * Repository: https://github.com/bwojtyca/grenton-objects-home-assistant
 */

const T = {
  title: "Analiza projektu Grenton",
  intro:
    "Wgraj plik projektu Object Managera (.omp). Zostanie porównany z aktualną " +
    "konfiguracją Home Assistant — nic nie jest zmieniane.",
  pick: "Wybierz plik .omp",
  analyzing: "Analizuję projekt…",
  errParse:
    "Nie udało się odczytać pliku .omp. Upewnij się, że to prawidłowy plik projektu z Object Managera.",
  verdictOk: "Integracja spójna z projektem",
  verdictIssues: "Wykryto rozbieżności",
};

const SEV_COLOR = {
  error: "var(--error-color, #db4437)",
  warn: "var(--warning-color, #ffa600)",
  missing: "var(--info-color, var(--primary-color, #3f51b5))",
  ok: "var(--success-color, #43a047)",
  muted: "var(--secondary-text-color, #888)",
};

// Status label + severity + coarse category (for the status filter). No DIN /
// non-DIN distinction: "not in HA" is a single status.
function statusInfo(row) {
  if (row.flags.includes("orphan")) return { label: "Błąd: brak w projekcie", sev: "error", cat: "problem" };
  if (row.flags.includes("push_wrong_object")) return { label: "Błąd: push ze złego obiektu", sev: "error", cat: "problem" };
  if (row.flags.includes("push_bad_service")) return { label: "Błąd: zła akcja push dla typu", sev: "error", cat: "problem" };
  if (row.flags.includes("push_no_event")) return { label: "Błąd: push bez zdarzenia", sev: "error", cat: "problem" };
  if (row.flags.includes("poll_redundant")) return { label: "Uwaga: polling + push", sev: "warn", cat: "problem" };
  if (row.in_ha) return { label: "OK", sev: "ok", cat: "ok" };
  if (row.is_unsupported) return { label: "Nieobsługiwany w integracji", sev: "muted", cat: "unsupported" };
  return { label: "Brak w HA", sev: "missing", cat: "missing" };
}

const STATUS_CATS = [
  { key: "problem", label: "Problem" },
  { key: "ok", label: "OK" },
  { key: "missing", label: "Brak w HA" },
  { key: "unsupported", label: "Nieobsługiwany" },
];
const UPDATE_CATS = [
  { key: "push", label: "push" },
  { key: "polling", label: "polling" },
  { key: "brak", label: "brak" },
];

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function ensureHaComponents() {
  const want = ["ha-card", "ha-alert", "ha-data-table"];
  if (want.every((tag) => customElements.get(tag))) return;
  try {
    if (window.loadCardHelpers) {
      const helpers = await window.loadCardHelpers();
      helpers?.createCardElement?.({ type: "entities", entities: [] });
    }
  } catch (err) {
    /* best effort */
  }
  await Promise.race([
    customElements.whenDefined("ha-data-table"),
    new Promise((resolve) => setTimeout(resolve, 4000)),
  ]);
}

class GrentonObjectsPanel extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    if (this._dataTable) this._dataTable.hass = hass;
    if (!this._built) this._build();
  }
  set narrow(value) {}
  set route(value) {}
  set panel(value) {}

  _build() {
    this._built = true;
    ensureHaComponents();

    this.style.display = "block";
    this.style.padding = "16px";
    this.style.boxSizing = "border-box";

    const card = document.createElement("ha-card");
    card.setAttribute("header", T.title);
    const body = document.createElement("div");
    body.style.padding = "16px";
    body.innerHTML = `<p style="margin-top:0;color:var(--secondary-text-color)">${T.intro}</p>`;

    const button = document.createElement("ha-button");
    button.setAttribute("raised", "");
    button.textContent = T.pick;
    button.addEventListener("click", () => input.click());

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".omp,.zip";
    input.style.display = "none";
    input.addEventListener("change", () => {
      if (input.files && input.files[0]) this._analyze(input.files[0]);
      input.value = "";
    });

    this._statusLine = document.createElement("div");
    this._statusLine.style.cssText = "margin-top:12px;color:var(--secondary-text-color)";

    body.append(button, input, this._statusLine);
    card.appendChild(body);

    this._results = document.createElement("div");
    this._results.style.marginTop = "16px";

    this.append(card, this._results);
  }

  async _analyze(file) {
    this._results.innerHTML = "";
    this._dataTable = null;
    this._statusLine.textContent = `${T.analyzing} (${file.name})`;
    try {
      const buffer = await file.arrayBuffer();
      const report = await this._hass.connection.sendMessagePromise({
        type: "grenton_objects/analyze",
        omp_base64: toBase64(buffer),
      });
      this._statusLine.textContent = "";
      await ensureHaComponents();
      this._renderReport(report);
    } catch (err) {
      this._statusLine.textContent = "";
      this._renderError(err);
    }
  }

  _renderError(err) {
    const alert = document.createElement("ha-alert");
    alert.setAttribute("alert-type", "error");
    alert.setAttribute("title", "Błąd analizy");
    alert.textContent = (err && (err.message || err.code)) || T.errParse;
    this._results.appendChild(alert);
  }

  // ─── report rendering ────────────────────────────────────────────────

  _renderReport(report) {
    const verdict = document.createElement("ha-alert");
    verdict.setAttribute("alert-type", report.verdict === "ok" ? "success" : "warning");
    verdict.setAttribute("title", report.verdict === "ok" ? T.verdictOk : T.verdictIssues);
    this._results.appendChild(verdict);

    this._results.appendChild(this._summaryCard(report));
    this._results.appendChild(this._objectsCard(report));
  }

  _summaryCard(report) {
    const s = report.summary;
    const card = document.createElement("ha-card");
    card.setAttribute("header", "Podsumowanie");
    const box = document.createElement("div");
    box.style.cssText = "padding:16px;line-height:1.7";

    const domains = Object.keys(s.per_domain)
      .sort((a, b) => s.per_domain[b].push + s.per_domain[b].polling - (s.per_domain[a].push + s.per_domain[a].polling))
      .map((d) => `${d} (${s.per_domain[d].push} push / ${s.per_domain[d].polling} polling)`)
      .join(" · ");

    const totals = document.createElement("div");
    totals.innerHTML =
      `Obiekty projektu: <b>${s.om_total}</b> · Encje w HA: <b>${s.ha_total}</b> · ` +
      `Zdarzenia push (Grenton→HA): <b>${s.push_events}</b><br>` +
      `Tryb aktualizacji: <b>${s.push}</b> push · <b>${s.polling}</b> polling<br>` +
      `<span style="color:var(--secondary-text-color)">Wg domeny: ${domains}</span>`;
    box.appendChild(totals);

    const missingByType = report.not_in_ha_by_type.map(([t, c]) => `${c}× ${t}`).join(", ");
    const problems = [
      { label: "encje HA bez obiektu w projekcie", count: report.orphans.length, sev: "error" },
      { label: "push aktualizujący zły obiekt Grentona", count: report.push_object_mismatch.length, sev: "error" },
      { label: "push z niewłaściwą akcją dla typu encji", count: report.push_service_mismatch.length, sev: "error" },
      { label: "encje push bez zdarzenia w Grentonie", count: report.push_no_event.length, sev: "error" },
      { label: "zdarzenia push w nieistniejącą encję", count: report.push_orphan_targets.length, sev: "error" },
      { label: "polling z jednoczesnym push (redundancja)", count: report.poll_with_push.length, sev: "warn" },
      { label: `obiekty Grentona nieobecne w HA${missingByType ? " (" + missingByType + ")" : ""}`, count: report.not_in_ha.length, sev: "missing" },
    ];
    const hasProblem = problems.some((p) => p.count > 0 && (p.sev === "error" || p.sev === "warn"));

    const block = document.createElement("div");
    block.style.marginTop = "12px";
    if (!hasProblem && report.not_in_ha.length === 0) {
      block.innerHTML = `<span style="color:${SEV_COLOR.ok}">Brak problemów — wszystko spójne.</span>`;
    } else {
      problems.forEach((p) => {
        const line = document.createElement("div");
        const active = p.count > 0;
        const color = active ? SEV_COLOR[p.sev] : SEV_COLOR.muted;
        const weight = active && (p.sev === "error" || p.sev === "warn") ? "600" : "400";
        line.style.cssText = `color:${color};font-weight:${weight}`;
        line.textContent = `${p.count} ${p.label}`;
        block.appendChild(line);
      });
    }
    box.appendChild(block);

    if (report.scaffolding) box.appendChild(this._scaffoldingBlock(report.scaffolding));

    card.appendChild(box);
    return card;
  }

  _scaffoldingBlock(scaffolding) {
    const wrap = document.createElement("div");
    wrap.style.marginTop = "16px";
    const heading = document.createElement("div");
    heading.style.cssText = "font-weight:600;margin-bottom:4px";
    heading.textContent = "Konfiguracja po stronie Grentona (skrypty/obiekty)";
    wrap.appendChild(heading);

    if (!scaffolding.push_used) {
      const info = document.createElement("div");
      info.style.cssText = "color:var(--secondary-text-color);font-size:0.9em;margin-bottom:4px";
      info.textContent = "Push nieużywany — obiekty kolejki nie są wymagane.";
      wrap.appendChild(info);
    }

    scaffolding.checks.forEach((c) => {
      const line = document.createElement("div");
      let color = SEV_COLOR.muted;
      let mark = "obecny";
      if (!c.present) {
        if (c.required) { color = SEV_COLOR.error; mark = "BRAK (wymagane)"; }
        else { mark = "brak (opcjonalne)"; }
      } else {
        color = SEV_COLOR.ok;
      }
      line.style.cssText = `color:${color}`;
      line.textContent = `${c.name} — ${c.desc}: ${mark}`;
      wrap.appendChild(line);
    });
    return wrap;
  }

  // ─── all-objects table ────────────────────────────────────────────────

  _objectsCard(report) {
    this._allRows = report.merged.map((r, i) => {
      const st = statusInfo(r);
      const updateCat = r.in_ha ? r.mode : "brak"; // r.mode is "push" | "polling"
      let update = "brak";
      if (r.in_ha) update = r.mode === "polling" ? `polling (${r.interval == null ? "?" : r.interval} s)` : "push";
      return {
        id: r.grenton_id || r.entity_id || String(i),
        name: r.om_name || r.ha_name || "",
        grenton_id: r.grenton_id || "",
        type: r.om_type || r.device_type || "",
        entity_id: r.entity_id || "",
        updateCat,
        update,
        status: st.label,
        sev: st.sev,
        statusCat: st.cat,
      };
    });

    // Filter state.
    this._search = "";
    this._typeEnabled = new Set(
      report.type_summary.filter((t) => t.supported && t.type !== "DIN").map((t) => t.type)
    );
    this._updEnabled = new Set(UPDATE_CATS.map((c) => c.key));
    this._statEnabled = new Set(STATUS_CATS.map((c) => c.key));

    const card = document.createElement("ha-card");
    card.setAttribute("header", `Wszystkie obiekty (${this._allRows.length})`);
    const box = document.createElement("div");
    box.style.padding = "8px 16px 16px";

    const legend = document.createElement("div");
    legend.style.cssText = "color:var(--secondary-text-color);font-size:0.9em;margin-bottom:8px";
    legend.textContent =
      "Aktualizacja = sposób pobierania stanu do HA (polling z interwałem lub push); „brak”, gdy obiekt nie jest w HA. Domyślnie ukryte: DIN i typy nieobsługiwane — włącz je w filtrze Typ.";
    box.appendChild(legend);

    box.append(
      this._searchBox(),
      this._typeGroup(report.type_summary),
      this._catGroup("Aktualizacja", UPDATE_CATS, this._updEnabled, "updateCat"),
      this._catGroup("Status", STATUS_CATS, this._statEnabled, "statusCat"),
      this._countLine()
    );

    this._tableHost = document.createElement("div");
    this._tableHost.style.marginTop = "8px";
    box.appendChild(this._tableHost);

    card.appendChild(box);
    this._buildTable();
    this._applyFilter();
    return card;
  }

  _searchBox() {
    const search = document.createElement("input");
    search.type = "search";
    search.placeholder = "Filtruj tekstowo (nazwa, ID, typ, encja, status)…";
    search.style.cssText =
      "width:100%;box-sizing:border-box;padding:8px 10px;margin-bottom:10px;border:1px solid var(--divider-color);" +
      "border-radius:8px;background:var(--card-background-color);color:var(--primary-text-color)";
    search.addEventListener("input", () => {
      this._search = search.value.trim().toLowerCase();
      this._applyFilter();
    });
    return search;
  }

  _row(labelText) {
    const row = document.createElement("div");
    row.style.cssText = "display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;margin-bottom:8px";
    const lbl = document.createElement("span");
    lbl.textContent = labelText;
    lbl.style.cssText = "font-weight:600;min-width:110px";
    row.appendChild(lbl);
    return row;
  }

  _mkCheck(labelText, checked, onToggle) {
    const label = document.createElement("label");
    label.style.cssText = "display:inline-flex;align-items:center;gap:5px;cursor:pointer;white-space:nowrap";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = checked;
    cb.addEventListener("change", () => onToggle(cb.checked));
    label.append(cb, document.createTextNode(labelText));
    return label;
  }

  _typeGroup(typeSummary) {
    const row = this._row("Typ:");
    typeSummary.forEach((t) => {
      const label = `${t.type} (${t.count})${t.supported ? "" : " · nieobsł."}`;
      row.appendChild(
        this._mkCheck(label, this._typeEnabled.has(t.type), (v) => {
          if (v) this._typeEnabled.add(t.type);
          else this._typeEnabled.delete(t.type);
          this._applyFilter();
        })
      );
    });
    const setAll = (on) => {
      this._typeEnabled = on ? new Set(typeSummary.map((t) => t.type)) : new Set();
      // rebuild the row's checkboxes to reflect the new state
      const parent = row.parentElement;
      const fresh = this._typeGroup(typeSummary);
      if (parent) parent.replaceChild(fresh, row);
      this._applyFilter();
    };
    const mkBtn = (text, on) => {
      const b = document.createElement("button");
      b.textContent = text;
      b.style.cssText =
        "cursor:pointer;border:1px solid var(--divider-color);border-radius:6px;padding:2px 8px;" +
        "background:var(--secondary-background-color);color:var(--primary-text-color);font-size:0.85em";
      b.addEventListener("click", () => setAll(on));
      return b;
    };
    row.append(mkBtn("wszystkie", true), mkBtn("żadne", false));
    return row;
  }

  _catGroup(labelText, cats, enabledSet, field) {
    const row = this._row(labelText + ":");
    const counts = {};
    (this._allRows || []).forEach((r) => { counts[r[field]] = (counts[r[field]] || 0) + 1; });
    cats.forEach((c) => {
      row.appendChild(
        this._mkCheck(`${c.label} (${counts[c.key] || 0})`, enabledSet.has(c.key), (v) => {
          if (v) enabledSet.add(c.key);
          else enabledSet.delete(c.key);
          this._applyFilter();
        })
      );
    });
    return row;
  }

  _countLine() {
    this._count = document.createElement("div");
    this._count.style.cssText = "color:var(--secondary-text-color);margin:4px 0";
    return this._count;
  }

  _columns() {
    const statusTemplate = (a, b) => this._statusNode((a && typeof a === "object") ? a : b);
    return {
      name: { title: "Nazwa (Grenton)", sortable: true, filterable: true, grows: true },
      grenton_id: { title: "Grenton ID", sortable: true, filterable: true, width: "180px" },
      type: { title: "Typ", sortable: true, filterable: true, width: "150px" },
      entity_id: { title: "Encja HA", sortable: true, filterable: true, width: "230px" },
      update: { title: "Aktualizacja", sortable: true, filterable: true, width: "150px" },
      status: { title: "Status", sortable: true, filterable: true, width: "230px", template: statusTemplate },
    };
  }

  _statusNode(row) {
    const span = document.createElement("span");
    span.textContent = row ? row.status : "";
    const sev = row ? row.sev : "muted";
    span.style.cssText =
      `display:inline-block;padding:2px 10px;border-radius:12px;white-space:nowrap;` +
      `font-size:0.85em;color:${SEV_COLOR[sev]};border:1px solid ${SEV_COLOR[sev]}`;
    return span;
  }

  _buildTable() {
    if (customElements.get("ha-data-table")) {
      const table = document.createElement("ha-data-table");
      table.hass = this._hass;
      table.columns = this._columns();
      table.autoHeight = true;
      table.setAttribute("auto-height", "");
      table.clickable = false;
      this._dataTable = table;
      this._tableHost.appendChild(table);
    } else {
      this._dataTable = null;
      const scroll = document.createElement("div");
      scroll.style.overflowX = "auto";
      const table = document.createElement("table");
      table.style.cssText = "width:100%;border-collapse:collapse;font-size:0.95em";
      const thead = document.createElement("thead");
      const tr = document.createElement("tr");
      ["Nazwa (Grenton)", "Grenton ID", "Typ", "Encja HA", "Aktualizacja", "Status"].forEach((c) => {
        const th = document.createElement("th");
        th.textContent = c;
        th.style.cssText =
          "text-align:left;padding:8px;border-bottom:2px solid var(--divider-color);white-space:nowrap;" +
          "position:sticky;top:0;background:var(--card-background-color);z-index:1";
        tr.appendChild(th);
      });
      thead.appendChild(tr);
      this._fallbackBody = document.createElement("tbody");
      table.append(thead, this._fallbackBody);
      scroll.appendChild(table);
      this._tableHost.appendChild(scroll);
    }
  }

  _filteredRows() {
    return this._allRows.filter((r) => {
      if (!this._typeEnabled.has(r.type)) return false;
      if (!this._updEnabled.has(r.updateCat)) return false;
      if (!this._statEnabled.has(r.statusCat)) return false;
      if (this._search) {
        const hay = `${r.name} ${r.grenton_id} ${r.type} ${r.entity_id} ${r.status}`.toLowerCase();
        if (!hay.includes(this._search)) return false;
      }
      return true;
    });
  }

  _applyFilter() {
    if (!this._allRows) return;
    const rows = this._filteredRows();
    if (this._dataTable) {
      this._dataTable.data = rows;
    } else if (this._fallbackBody) {
      this._fallbackBody.replaceChildren();
      rows.forEach((r) => {
        const tr = document.createElement("tr");
        [r.name, r.grenton_id, r.type, r.entity_id, r.update].forEach((val, idx) => {
          const td = document.createElement("td");
          td.textContent = val == null ? "" : String(val);
          td.style.cssText = "padding:6px 8px;border-bottom:1px solid var(--divider-color);vertical-align:top";
          if (idx === 1 || idx === 3) td.style.fontFamily = "var(--code-font-family, monospace)";
          tr.appendChild(td);
        });
        const tdStatus = document.createElement("td");
        tdStatus.style.cssText = "padding:6px 8px;border-bottom:1px solid var(--divider-color)";
        tdStatus.appendChild(this._statusNode(r));
        tr.appendChild(tdStatus);
        this._fallbackBody.appendChild(tr);
      });
    }
    if (this._count) this._count.textContent = `Pokazano ${rows.length} z ${this._allRows.length}`;
  }
}

customElements.define("grenton-objects-panel", GrentonObjectsPanel);
