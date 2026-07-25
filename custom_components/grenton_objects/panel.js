/*
 * Grenton Objects — OM project analysis panel.
 *
 * A custom Home Assistant panel (opened via the /grenton_objects URL). Uploads
 * an Object Manager project (.omp), sends it to the `grenton_objects/analyze`
 * websocket command and renders a read-only reconciliation report, built from
 * native HA components:
 *   - a plain-text summary (problems + Grenton-side scaffolding highlighted),
 *   - a native ha-data-table with its built-in search, a state-badge entity
 *     column (opens the entity dialog), an ha-label status and an actions column
 *     that deep-links to the config entry, and
 *   - a right-hand filter pane (ha-expansion-panel groups) like the config
 *     subpages (Devices / Entities / Automations).
 *
 * Repository: https://github.com/bwojtyca/grenton-objects-home-assistant
 */

const DOMAIN = "grenton_objects";

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

// Concrete hex per severity — ha-label needs a hex `color` (it derives a
// contrasting text color from it), so CSS vars can't be used here.
const SEV_HEX = {
  error: "#db4437",
  warn: "#f9a825",
  missing: "#3d70b2",
  ok: "#43a047",
  muted: "#9e9e9e",
};

function statusInfo(row) {
  if (row.flags.includes("orphan"))
    return { label: "Błąd: brak w projekcie", sev: "error", cat: "problem",
      hint: "Encja HA wskazuje grenton_id, którego nie ma w projekcie OM. Obiekt usunięto/zmieniono w OM albo encja ma zły grenton_id — popraw jedno z nich." };
  if (row.flags.includes("push_wrong_object"))
    return { label: "Błąd: push ze złego obiektu", sev: "error", cat: "problem",
      hint: "Zdarzenie push aktualizuje tę encję stanem INNEGO obiektu Grentona niż jej grenton_id. Popraw źródło w zdarzeniu (OnChange) obiektu w OM." };
  if (row.flags.includes("push_bad_service"))
    return { label: "Błąd: zła akcja push", sev: "error", cat: "problem",
      hint: "Akcja push nie pasuje do typu encji. Użyj: light→set_state/set_brightness/set_rgb, switch/binary_sensor→set_state, cover→set_cover, sensor→set_value." };
  if (row.flags.includes("push_no_event"))
    return { label: "Błąd: push bez zdarzenia", sev: "error", cat: "problem",
      hint: "Encja jest w trybie push, ale w projekcie nie ma dla niej zdarzenia HA_Integration_Queue_Prepare. Dodaj zdarzenie OnChange w OM albo włącz polling (auto-update)." };
  if (row.flags.includes("poll_redundant"))
    return { label: "Uwaga: polling + push", sev: "warn", cat: "problem",
      hint: "Encja jest pollowana i jednocześnie ma zdarzenie push — podwójna aktualizacja. Wyłącz auto-update albo usuń zdarzenie push w OM." };
  if (row.in_ha) return { label: "OK", sev: "ok", cat: "ok" };
  if (row.is_unsupported)
    return { label: "Nieobsługiwany w integracji", sev: "muted", cat: "unsupported",
      hint: "Integracja nie potrafi wystawić tego typu obiektu Grentona (np. DALI_MASTER, kontener Satel)." };
  return { label: "Brak w HA", sev: "missing", cat: "missing",
    hint: "Obiekt istnieje w projekcie Grentona, ale nie jest dodany do HA. Dodaj go przez integrację, jeśli chcesz go używać." };
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
  const want = ["ha-card", "ha-alert", "ha-data-table", "ha-expansion-panel", "ha-label", "ha-state-icon", "ha-tooltip", "ha-textfield", "ha-icon", "ha-list", "ha-check-list-item"];
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
  set narrow(value) { this._narrow = value; }
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

  // ─── all-objects table + filter pane ───────────────────────────────────

  _objectsCard(report) {
    this._allRows = report.merged.map((r, i) => {
      const st = statusInfo(r);
      const updateCat = r.in_ha ? r.mode : "brak";
      let update = "brak";
      if (r.in_ha) update = r.mode === "polling" ? `polling (${r.interval == null ? "?" : r.interval} s)` : "push";
      return {
        id: r.grenton_id || r.entity_id || String(i),
        name: r.om_name || r.ha_name || "",
        grenton_id: r.grenton_id || "",
        type: r.om_type || r.device_type || "",
        entity_id: r.entity_id || "",
        entry_id: r.entry_id || "",
        updateCat,
        update,
        status: st.label,
        sev: st.sev,
        statusCat: st.cat,
        actions: "",
      };
    });

    this._search = "";
    this._typeSummary = report.type_summary;
    this._typeDefault = () => new Set(report.type_summary.filter((t) => t.supported && t.type !== "DIN").map((t) => t.type));
    // Native filter semantics: an empty set means "no filter" (show all). Only
    // Type is pre-filtered by default (hide DIN + unsupported); update/status
    // start empty (no constraint).
    this._typeEnabled = this._typeDefault();
    this._updEnabled = new Set();
    this._statEnabled = new Set();

    const card = document.createElement("ha-card");
    card.setAttribute("header", `Wszystkie obiekty (${this._allRows.length})`);
    const box = document.createElement("div");
    box.style.padding = "8px 16px 16px";

    // Toolbar: native search (wired to the data-table's built-in filter) + count.
    const toolbar = document.createElement("div");
    toolbar.style.cssText = "display:flex;gap:16px;align-items:center;margin-bottom:8px";
    toolbar.append(this._searchField(), this._countLine());
    box.appendChild(toolbar);

    // Content row: table (left) + filter pane (right), like the config subpages.
    const row = document.createElement("div");
    row.style.cssText = "display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap";
    this._tableHost = document.createElement("div");
    this._tableHost.style.cssText = "flex:1 1 520px;min-width:0";
    row.append(this._tableHost, this._filterPane());
    box.appendChild(row);

    card.appendChild(box);
    this._buildTable();
    this._applyFilter();
    return card;
  }

  _searchField() {
    const onInput = (value) => {
      this._search = (value || "").trim().toLowerCase();
      if (this._dataTable) this._dataTable.filter = this._search;
      else this._applyFilter();
    };
    if (customElements.get("ha-textfield")) {
      const tf = document.createElement("ha-textfield");
      tf.label = "Szukaj";
      tf.setAttribute("iconTrailing", "");
      tf.style.cssText = "flex:1 1 260px";
      tf.addEventListener("input", (e) => onInput(e.target.value));
      return tf;
    }
    const input = document.createElement("input");
    input.type = "search";
    input.placeholder = "Szukaj…";
    input.style.cssText =
      "flex:1 1 260px;padding:8px 10px;border:1px solid var(--divider-color);border-radius:8px;" +
      "background:var(--card-background-color);color:var(--primary-text-color)";
    input.addEventListener("input", (e) => onInput(e.target.value));
    return input;
  }

  _countLine() {
    this._count = document.createElement("span");
    this._count.style.cssText = "color:var(--secondary-text-color);white-space:nowrap";
    return this._count;
  }

  _filterPane() {
    const pane = document.createElement("div");
    pane.style.cssText = "flex:0 0 300px;max-width:100%;display:flex;flex-direction:column;gap:8px";

    const head = document.createElement("div");
    head.style.cssText = "display:flex;align-items:center;justify-content:space-between";
    const title = document.createElement("span");
    title.textContent = "Filtry";
    title.style.fontWeight = "600";
    const reset = document.createElement("button");
    reset.textContent = "Wyczyść";
    reset.style.cssText =
      "cursor:pointer;border:1px solid var(--divider-color);border-radius:6px;padding:2px 8px;" +
      "background:var(--secondary-background-color);color:var(--primary-text-color);font-size:0.85em";
    reset.addEventListener("click", () => {
      this._typeEnabled = this._typeDefault();
      this._updEnabled = new Set();
      this._statEnabled = new Set();
      const fresh = this._filterPane();
      pane.replaceWith(fresh);
      this._applyFilter();
    });
    head.append(title, reset);
    pane.appendChild(head);

    const typeItems = this._typeSummary.map((t) => ({
      key: t.type, label: `${t.type} (${t.count})${t.supported ? "" : " · nieobsł."}`,
    }));
    const updCounts = this._countBy("updateCat");
    const statCounts = this._countBy("statusCat");

    pane.append(
      this._filterGroup("Typ", typeItems, this._typeEnabled),
      this._filterGroup("Aktualizacja", UPDATE_CATS.map((c) => ({ key: c.key, label: `${c.label} (${updCounts[c.key] || 0})` })), this._updEnabled),
      this._filterGroup("Status", STATUS_CATS.map((c) => ({ key: c.key, label: `${c.label} (${statCounts[c.key] || 0})` })), this._statEnabled)
    );
    return pane;
  }

  _countBy(field) {
    const counts = {};
    (this._allRows || []).forEach((r) => { counts[r[field]] = (counts[r[field]] || 0) + 1; });
    return counts;
  }

  // One collapsible filter group modeled on ha-filter-states: an
  // ha-expansion-panel whose header shows the label + a count badge + a
  // clear-filter icon, and a native ha-list / ha-check-list-item checkbox list
  // (checkbox on the right). Native semantics: an empty set = no filter.
  // Falls back to plain checkboxes if ha-list isn't loaded.
  _filterGroup(labelText, items, enabledSet) {
    // Header with badge + clear icon.
    const header = document.createElement("div");
    header.setAttribute("slot", "header");
    header.style.cssText = "display:flex;align-items:center;gap:8px;width:100%";
    const title = document.createElement("span");
    title.textContent = labelText;
    header.appendChild(title);
    const badge = document.createElement("span");
    badge.style.cssText =
      "background:var(--primary-color);color:var(--text-primary-color, #fff);border-radius:10px;" +
      "min-width:18px;height:18px;padding:0 5px;font-size:0.75em;display:inline-flex;align-items:center;justify-content:center";
    const clear = document.createElement("span");
    clear.style.cssText = "margin-left:auto;cursor:pointer;color:var(--secondary-text-color);display:inline-flex";
    clear.title = "Wyczyść ten filtr";
    if (customElements.get("ha-icon")) {
      const ci = document.createElement("ha-icon");
      ci.setAttribute("icon", "mdi:filter-variant-remove");
      clear.appendChild(ci);
    } else {
      clear.textContent = "✕";
    }

    const options = [];
    const updateHeader = () => {
      const n = enabledSet.size;
      badge.textContent = String(n);
      badge.style.display = n ? "inline-flex" : "none";
      clear.style.display = n ? "inline-flex" : "none";
    };
    const applyToOptions = () => options.forEach((o, i) => { o.selected = enabledSet.has(items[i].key); });

    clear.addEventListener("click", (e) => {
      e.stopPropagation();
      enabledSet.clear();
      applyToOptions();
      updateHeader();
      this._applyFilter();
    });
    header.append(badge, clear);

    const content = document.createElement("div");
    content.style.cssText = "max-height:340px;overflow:auto";

    const useList = customElements.get("ha-list") && customElements.get("ha-check-list-item");
    if (useList) {
      const list = document.createElement("ha-list");
      list.setAttribute("multi", "");
      items.forEach((it) => {
        const li = document.createElement("ha-check-list-item");
        li.value = it.key;
        li.selected = enabledSet.has(it.key);
        li.textContent = it.label;
        options.push(li);
        list.appendChild(li);
      });
      list.addEventListener("selected", (ev) => {
        const idx = ev.detail && ev.detail.index;
        const indices = idx instanceof Set ? [...idx] : (typeof idx === "number" ? [idx] : null);
        if (indices == null) return;
        enabledSet.clear();
        indices.forEach((i) => { if (items[i]) enabledSet.add(items[i].key); });
        updateHeader();
        this._applyFilter();
      });
      content.appendChild(list);
    } else {
      content.style.cssText += ";padding:4px 8px 12px;display:flex;flex-direction:column;gap:4px";
      items.forEach((it) => {
        const label = document.createElement("label");
        label.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:pointer;padding:2px 4px";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = enabledSet.has(it.key);
        cb.addEventListener("change", () => {
          if (cb.checked) enabledSet.add(it.key); else enabledSet.delete(it.key);
          updateHeader(); this._applyFilter();
        });
        const span = document.createElement("span");
        span.textContent = it.label;
        label.append(span, cb);
        options.push({ set selected(v) { cb.checked = v; } });
        content.appendChild(label);
      });
    }

    updateHeader();
    if (customElements.get("ha-expansion-panel")) {
      const panel = document.createElement("ha-expansion-panel");
      panel.setAttribute("outlined", "");
      if (enabledSet.size) panel.setAttribute("expanded", "");
      panel.append(header, content);
      return panel;
    }
    const wrap = document.createElement("div");
    wrap.style.cssText = "border:1px solid var(--divider-color);border-radius:8px;padding:8px 12px";
    header.style.marginBottom = "4px";
    wrap.append(header, content);
    return wrap;
  }

  _columns() {
    return {
      name: { title: "Nazwa (Grenton)", sortable: true, filterable: true, grows: true },
      grenton_id: { title: "Grenton ID", sortable: true, filterable: true, width: "160px" },
      type: { title: "Typ", sortable: true, filterable: true, width: "130px" },
      entity_id: { title: "Encja HA", sortable: true, filterable: true, width: "280px", template: (a, b) => this._entityNode((a && typeof a === "object") ? a : b) },
      update: { title: "Aktualizacja", sortable: true, filterable: true, width: "140px" },
      status: { title: "Status", sortable: true, filterable: true, width: "220px", template: (a, b) => this._statusNode((a && typeof a === "object") ? a : b) },
      actions: { title: "Akcje", sortable: false, filterable: false, width: "70px", template: (a, b) => this._actionsNode((a && typeof a === "object") ? a : b) },
    };
  }

  _statusNode(row) {
    const sev = row ? row.sev : "muted";
    let node;
    if (customElements.get("ha-label")) {
      const label = document.createElement("ha-label");
      label.setAttribute("dense", "");
      label.color = SEV_HEX[sev]; // ha-label derives a contrasting text color
      label.textContent = row ? row.status : "";
      node = label;
    } else {
      const span = document.createElement("span");
      span.textContent = row ? row.status : "";
      span.style.cssText =
        `display:inline-block;padding:2px 10px;border-radius:12px;white-space:nowrap;` +
        `font-size:0.85em;color:${SEV_COLOR[sev]};border:1px solid ${SEV_COLOR[sev]}`;
      node = span;
    }
    const hint = row && row.hint;
    if (hint) {
      node.style.cursor = "help";
      if (customElements.get("ha-tooltip")) {
        const tip = document.createElement("ha-tooltip");
        tip.setAttribute("content", hint);
        tip.content = hint;
        tip.appendChild(node);
        return tip;
      }
      node.title = hint; // native fallback
    }
    return node;
  }

  _entityNode(row) {
    if (!row || !row.entity_id) {
      const dash = document.createElement("span");
      dash.textContent = "—";
      dash.style.color = SEV_COLOR.muted;
      return dash;
    }
    const wrap = document.createElement("span");
    wrap.style.cssText = "display:inline-flex;align-items:center;gap:8px;cursor:pointer";
    wrap.title = "Otwórz okno encji";
    const stateObj = this._hass && this._hass.states ? this._hass.states[row.entity_id] : null;
    // ha-state-icon only PICKS the icon (it doesn't colour); state-badge did not
    // apply colour reliably here. So we pick the icon with ha-state-icon and
    // apply the state colour ourselves, replicating stateColorCss's CSS-var
    // hierarchy — active states get the domain state colour, inactive stay grey.
    if (stateObj && customElements.get("ha-state-icon")) {
      const icon = document.createElement("ha-state-icon");
      icon.stateObj = stateObj;
      const color = this._stateColor(stateObj) || "var(--secondary-text-color)";
      icon.style.cssText = `flex:0 0 auto;--mdc-icon-size:22px;color:${color}`;
      wrap.appendChild(icon);
    }
    // Text is NOT colour-coded — only the state-badge icon carries state colour.
    const text = document.createElement("span");
    const stateStr = stateObj ? this._formatState(stateObj) : "niedostępna";
    text.innerHTML =
      `<span>${row.entity_id}</span>` +
      `<span style="color:var(--secondary-text-color)"> · ${stateStr}</span>`;
    wrap.appendChild(text);
    wrap.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("hass-more-info", {
        detail: { entityId: row.entity_id }, bubbles: true, composed: true,
      }));
    });
    return wrap;
  }

  _formatState(stateObj) {
    let s = stateObj.state;
    const unit = stateObj.attributes && stateObj.attributes.unit_of_measurement;
    if (unit) s = `${s} ${unit}`;
    return s;
  }

  // Reimplements HA's stateColorCss CSS-variable hierarchy (see
  // common/entity/state_color.ts): active states in "coloured" domains get the
  // domain state colour; inactive stay grey; non-coloured domains → null.
  _stateColor(stateObj) {
    const domain = stateObj.entity_id.split(".")[0];
    const raw = String(stateObj.state || "").toLowerCase();
    if (raw === "unavailable") return "var(--state-unavailable-color, var(--disabled-text-color))";
    const COLORED = new Set([
      "alarm_control_panel", "binary_sensor", "climate", "cover", "fan", "humidifier",
      "input_boolean", "light", "lock", "media_player", "person", "siren", "switch",
      "update", "vacuum", "valve", "water_heater", "automation", "script", "sun",
      "device_tracker", "group",
    ]);
    if (!COLORED.has(domain)) return null;
    const INACTIVE = new Set([
      "off", "closed", "unavailable", "unknown", "standby", "idle", "disarmed", "not_home", "auto",
    ]);
    const active = !INACTIVE.has(raw);
    const state = raw.replace(/[^a-z0-9_]/g, "");
    const dc = stateObj.attributes && stateObj.attributes.device_class;
    const vars = [];
    if (dc) vars.push(`--state-${domain}-${dc}-${state}-color`);
    vars.push(`--state-${domain}-${state}-color`);
    vars.push(`--state-${domain}-${active ? "active" : "inactive"}-color`);
    vars.push(`--state-${active ? "active" : "inactive"}-color`);
    const literal = active ? "#f9a825" : "var(--secondary-text-color, #9e9e9e)";
    return vars.reduceRight((acc, v) => `var(${v}, ${acc})`, literal);
  }

  _actionsNode(row) {
    const span = document.createElement("span");
    if (!row || !row.entry_id) return span;
    span.style.cssText = "cursor:pointer;color:var(--secondary-text-color)";
    span.title = "Otwórz konfigurację obiektu w integracji";
    if (customElements.get("ha-icon")) {
      const icon = document.createElement("ha-icon");
      icon.setAttribute("icon", "mdi:cog");
      span.appendChild(icon);
    } else {
      span.textContent = "konfiguruj";
      span.style.color = "var(--primary-color)";
    }
    span.addEventListener("click", () => this._openIntegration(row.entry_id));
    return span;
  }

  _openIntegration(entryId) {
    let path = `/config/integrations/integration/${DOMAIN}`;
    if (entryId) path += `#config_entry=${entryId}`;
    window.history.pushState(null, "", path);
    this.dispatchEvent(new CustomEvent("location-changed", { bubbles: true, composed: true }));
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
      ["Nazwa (Grenton)", "Grenton ID", "Typ", "Encja HA", "Aktualizacja", "Status", "Akcje"].forEach((c) => {
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
    // Native semantics: an empty filter set = no constraint (show all).
    const tOn = this._typeEnabled.size, uOn = this._updEnabled.size, sOn = this._statEnabled.size;
    return this._allRows.filter((r) => {
      if (tOn && !this._typeEnabled.has(r.type)) return false;
      if (uOn && !this._updEnabled.has(r.updateCat)) return false;
      if (sOn && !this._statEnabled.has(r.statusCat)) return false;
      // Text search: handled by ha-data-table.filter; only apply here for the fallback table.
      if (!this._dataTable && this._search) {
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
        const cell = (node) => {
          const td = document.createElement("td");
          td.style.cssText = "padding:6px 8px;border-bottom:1px solid var(--divider-color);vertical-align:top";
          td.appendChild(node);
          return td;
        };
        const txt = (val, mono) => {
          const s = document.createElement("span");
          s.textContent = val == null ? "" : String(val);
          if (mono) s.style.fontFamily = "var(--code-font-family, monospace)";
          return s;
        };
        tr.append(
          cell(txt(r.name)), cell(txt(r.grenton_id, true)), cell(txt(r.type)),
          cell(this._entityNode(r)), cell(txt(r.update)), cell(this._statusNode(r)), cell(this._actionsNode(r))
        );
        this._fallbackBody.appendChild(tr);
      });
    }
    if (this._count) {
      // rows = after the type/update/status filters; ha-data-table then applies
      // the text search on top, so this is the pre-search filtered count.
      this._count.textContent = `Po filtrach: ${rows.length} z ${this._allRows.length}`;
    }
  }
}

customElements.define("grenton-objects-panel", GrentonObjectsPanel);
