/*
 * Grenton Objects — OM project analysis panel.
 *
 * A custom Home Assistant panel (opened via the /grenton_objects URL). Uploads
 * an Object Manager project (.omp), sends it to the `grenton_objects/analyze`
 * websocket command and renders a read-only reconciliation report against the
 * live Home Assistant configuration:
 *   - a plain-text summary (problems highlighted), and
 *   - one table of every object (project ∪ HA), using the native ha-data-table
 *     (sorting, search, alignment) with a coloured status column and quick
 *     filters. DIN/Satel inputs are hidden by default (toggle to include them).
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

function statusInfo(row) {
  if (row.flags.includes("orphan")) return { label: "Błąd: brak w projekcie", sev: "error", cat: "problem" };
  if (row.flags.includes("push_no_event")) return { label: "Błąd: push bez zdarzenia", sev: "error", cat: "problem" };
  if (row.flags.includes("poll_redundant")) return { label: "Uwaga: polling + push", sev: "warn", cat: "problem" };
  if (row.flags.includes("not_in_ha")) return { label: "Nie ma w HA", sev: "missing", cat: "missing" };
  if (row.in_ha) return { label: "OK", sev: "ok", cat: "normal" };
  if (row.is_input) return { label: "Wejście (poza HA)", sev: "muted", cat: "normal" };
  return { label: "—", sev: "muted", cat: "normal" };
}

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

// Nudge HA to load its lazy element bundle so ha-card / ha-alert / ha-data-table
// are defined when we use them.
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

    const problems = [
      { label: "encje HA bez obiektu w projekcie", count: report.orphans.length, sev: "error" },
      { label: "encje push bez zdarzenia w Grentonie", count: report.push_no_event.length, sev: "error" },
      { label: "zdarzenia push w nieistniejącą encję", count: report.push_orphan_targets.length, sev: "error" },
      { label: "polling z jednoczesnym push (redundancja)", count: report.poll_with_push.length, sev: "warn" },
      { label: "obiekty Grentona nieobecne w HA", count: report.not_in_ha.length, sev: "missing" },
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

    if (report.input_not_in_ha_count) {
      const note = document.createElement("div");
      note.style.cssText = "margin-top:8px;color:var(--secondary-text-color);font-size:0.9em";
      note.textContent =
        `Wejścia DIN/Satel (${report.input_not_in_ha_count}, np. przyciski ścienne / wejścia alarmu) ` +
        `są domyślnie ukryte w tabeli poniżej — zaznacz „Pokaż wejścia (DIN/Satel)", aby je uwzględnić.`;
      box.appendChild(note);
    }

    card.appendChild(box);
    return card;
  }

  // ─── all-objects table ────────────────────────────────────────────────

  _objectsCard(report) {
    this._allRows = report.merged.map((r, i) => {
      const st = statusInfo(r);
      return {
        id: r.grenton_id || r.entity_id || String(i),
        name: r.om_name || r.ha_name || "",
        grenton_id: r.grenton_id || "",
        type: r.om_type || r.device_type || "",
        entity_id: r.entity_id || "",
        update: r.in_ha ? r.mode || "" : "",
        status: st.label,
        sev: st.sev,
        cat: st.cat,
        is_missing: r.flags.includes("not_in_ha"),
        is_input: !!r.is_input,
      };
    });
    this._search = "";
    this._fProblems = false;
    this._fMissing = false;
    this._fInputs = false;

    const card = document.createElement("ha-card");
    card.setAttribute("header", `Wszystkie obiekty (${this._allRows.length})`);
    const box = document.createElement("div");
    box.style.padding = "8px 16px 16px";

    const legend = document.createElement("div");
    legend.style.cssText = "color:var(--secondary-text-color);font-size:0.9em;margin-bottom:8px";
    legend.textContent =
      "Aktualizacja = sposób pobierania stanu do HA (polling = odpytywanie, push = zdarzenie z Grentona); puste, gdy obiekt nie jest w HA.";
    box.appendChild(legend);

    box.appendChild(this._toolbar());

    this._tableHost = document.createElement("div");
    this._tableHost.style.marginTop = "8px";
    box.appendChild(this._tableHost);

    card.appendChild(box);
    this._buildTable();
    this._applyFilter();
    return card;
  }

  _toolbar() {
    const bar = document.createElement("div");
    bar.style.cssText = "display:flex;flex-wrap:wrap;gap:16px;align-items:center;margin-bottom:8px";

    const search = document.createElement("input");
    search.type = "search";
    search.placeholder = "Filtruj (nazwa, ID, typ, encja, status)…";
    search.style.cssText =
      "flex:1 1 260px;min-width:200px;padding:8px 10px;border:1px solid var(--divider-color);" +
      "border-radius:8px;background:var(--card-background-color);color:var(--primary-text-color)";
    search.addEventListener("input", () => {
      this._search = search.value.trim().toLowerCase();
      this._applyFilter();
    });

    const mkCheck = (labelText, onToggle) => {
      const label = document.createElement("label");
      label.style.cssText = "display:inline-flex;align-items:center;gap:6px;cursor:pointer";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.addEventListener("change", () => onToggle(cb.checked));
      label.append(cb, document.createTextNode(labelText));
      return label;
    };

    bar.append(
      search,
      mkCheck("Tylko problemy", (v) => { this._fProblems = v; this._applyFilter(); }),
      mkCheck("Tylko brakujące w HA", (v) => { this._fMissing = v; this._applyFilter(); }),
      mkCheck("Pokaż wejścia (DIN/Satel)", (v) => { this._fInputs = v; this._applyFilter(); })
    );

    this._count = document.createElement("span");
    this._count.style.cssText = "color:var(--secondary-text-color);margin-left:auto";
    bar.appendChild(this._count);
    return bar;
  }

  _columns() {
    const statusTemplate = (a, b) => this._statusNode((a && typeof a === "object") ? a : b);
    return {
      name: { title: "Nazwa (Grenton)", sortable: true, filterable: true, grows: true },
      grenton_id: { title: "Grenton ID", sortable: true, filterable: true, width: "180px" },
      type: { title: "Typ", sortable: true, filterable: true, width: "150px" },
      entity_id: { title: "Encja HA", sortable: true, filterable: true, width: "230px" },
      update: { title: "Aktualizacja", sortable: true, filterable: true, width: "130px" },
      status: { title: "Status", sortable: true, filterable: true, width: "220px", template: statusTemplate },
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
      // Fallback: themed HTML table (no native sort/resize).
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
    let rows = this._allRows;
    if (!this._fInputs) rows = rows.filter((r) => !r.is_input);
    if (this._fProblems || this._fMissing) {
      rows = rows.filter(
        (r) => (this._fProblems && r.cat === "problem") || (this._fMissing && r.is_missing)
      );
    }
    if (this._search) {
      rows = rows.filter((r) =>
        `${r.name} ${r.grenton_id} ${r.type} ${r.entity_id} ${r.status}`.toLowerCase().includes(this._search)
      );
    }
    return rows;
  }

  _applyFilter() {
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
