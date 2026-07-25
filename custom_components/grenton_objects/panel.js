/*
 * Grenton Objects — OM project analysis panel.
 *
 * A custom Home Assistant sidebar panel. Uploads an Object Manager project
 * (.omp), sends it to the `grenton_objects/analyze` websocket command and
 * renders the reconciliation report using native HA frontend components
 * (ha-card, ha-alert, ha-expansion-panel, ha-data-table) so it matches the
 * HA look and behaves consistently in light/dark themes.
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
  verdictIssues: "Wykryto rozbieżności — zajrzyj do sekcji poniżej.",
};

// Human-readable status derived from a merged-row's flags.
const STATUS = {
  orphan: "Błąd: encja HA bez obiektu w projekcie",
  push_no_event: "Błąd: push bez zdarzenia w Grentonie",
  poll_redundant: "Uwaga: polling + jednoczesny push",
  not_in_ha: "Nie ma w HA",
};

function rowStatus(row) {
  for (const flag of ["orphan", "push_no_event", "poll_redundant", "not_in_ha"]) {
    if (row.flags.includes(flag)) return STATUS[flag];
  }
  if (row.in_ha) return "OK";
  return row.is_input ? "Wejście (poza HA)" : "—";
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

// Force HA to load its lazy element bundles (ha-data-table lives in a chunk
// that is not always loaded when a bare panel opens).
async function ensureHaComponents() {
  const wanted = ["ha-card", "ha-alert", "ha-expansion-panel", "ha-data-table", "ha-button"];
  if (wanted.every((tag) => customElements.get(tag))) return;
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
    new Promise((resolve) => setTimeout(resolve, 3000)),
  ]);
}

class GrentonObjectsPanel extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    if (!this._built) this._build();
  }
  set narrow(value) {
    this._narrow = value;
  }
  set route(value) {}
  set panel(value) {}

  _build() {
    this._built = true;
    ensureHaComponents();

    this.style.display = "block";
    this.style.padding = "16px";
    this.style.maxWidth = "1400px";
    this.style.margin = "0 auto";
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

    this._status = document.createElement("div");
    this._status.style.marginTop = "12px";
    this._status.style.color = "var(--secondary-text-color)";

    body.appendChild(button);
    body.appendChild(input);
    body.appendChild(this._status);
    card.appendChild(body);

    this._results = document.createElement("div");
    this._results.style.marginTop = "16px";

    this.appendChild(card);
    this.appendChild(this._results);
  }

  async _analyze(file) {
    this._results.innerHTML = "";
    this._status.textContent = `${T.analyzing} (${file.name})`;
    try {
      const buffer = await file.arrayBuffer();
      const report = await this._hass.connection.sendMessagePromise({
        type: "grenton_objects/analyze",
        omp_base64: toBase64(buffer),
      });
      this._status.textContent = "";
      await ensureHaComponents();
      this._renderReport(report);
    } catch (err) {
      this._status.textContent = "";
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
    const s = report.summary;

    const verdict = document.createElement("ha-alert");
    verdict.setAttribute("alert-type", report.verdict === "ok" ? "success" : "warning");
    verdict.setAttribute("title", report.verdict === "ok" ? T.verdictOk : "Rozbieżności");
    verdict.textContent =
      report.verdict === "ok" ? T.verdictOk : T.verdictIssues;
    this._results.appendChild(verdict);

    this._results.appendChild(this._summaryCard(report));

    this._section("Encje HA bez obiektu w projekcie", report.orphans, (r) =>
      `${r.entity_id} → ${r.grenton_id} (${r.device_type})`
    );
    this._section("Encje w trybie push bez zdarzenia push w Grentonie", report.push_no_event, (r) =>
      `${r.entity_id} → ${r.grenton_id} (${r.device_type})`
    );
    this._sectionText(
      "Zdarzenia push w Grentonie celujące w nieistniejącą encję",
      report.push_orphan_targets
    );
    this._section("Polling z jednoczesnym zdarzeniem push (redundancja)", report.poll_with_push, (r) =>
      `${r.entity_id} → ${r.grenton_id}`
    );
    this._notInHaSection(report);
    this._results.appendChild(this._allObjectsTable(report));
  }

  _summaryCard(report) {
    const s = report.summary;
    const card = document.createElement("ha-card");
    card.setAttribute("header", "Podsumowanie");
    const box = document.createElement("div");
    box.style.padding = "16px";

    const totals = document.createElement("div");
    totals.style.marginBottom = "12px";
    totals.innerHTML =
      `Encje HA: <b>${s.ha_total}</b> &nbsp; Obiekty projektu: <b>${s.om_total}</b> &nbsp; ` +
      `Zdarzenia push: <b>${s.push_events}</b><br>` +
      `Tryb aktualizacji: <b>${s.push}</b> push &nbsp; <b>${s.polling}</b> polling`;
    box.appendChild(totals);

    // per-domain table (native ha-data-table if available, else plain table)
    const domainRows = Object.keys(s.per_domain).map((domain) => ({
      id: domain,
      domain,
      push: s.per_domain[domain].push,
      polling: s.per_domain[domain].polling,
    }));
    domainRows.sort((a, b) => b.push + b.polling - (a.push + a.polling));
    box.appendChild(
      this._table(
        {
          domain: { title: "Domena", sortable: true, filterable: true },
          push: { title: "Push", sortable: true, type: "numeric" },
          polling: { title: "Polling", sortable: true, type: "numeric" },
        },
        domainRows,
        true
      )
    );
    card.appendChild(box);
    return card;
  }

  _section(title, rows, format) {
    const panel = document.createElement("ha-expansion-panel");
    panel.setAttribute("outlined", "");
    panel.style.display = "block";
    panel.style.marginTop = "12px";
    const header = document.createElement("span");
    header.setAttribute("slot", "header");
    header.textContent = `${title} (${rows.length})`;
    panel.appendChild(header);
    if (rows && rows.length) panel.setAttribute("expanded", "");

    const list = document.createElement("div");
    list.style.padding = "0 16px 12px";
    if (!rows || !rows.length) {
      list.innerHTML = `<span style="color:var(--secondary-text-color)">brak</span>`;
    } else {
      const ul = document.createElement("ul");
      ul.style.margin = "0";
      rows.forEach((r) => {
        const li = document.createElement("li");
        li.textContent = format(r);
        ul.appendChild(li);
      });
      list.appendChild(ul);
    }
    panel.appendChild(list);
    this._results.appendChild(panel);
  }

  _sectionText(title, values) {
    this._section(
      title,
      (values || []).map((v) => ({ v })),
      (r) => r.v
    );
  }

  _notInHaSection(report) {
    const panel = document.createElement("ha-expansion-panel");
    panel.setAttribute("outlined", "");
    panel.style.display = "block";
    panel.style.marginTop = "12px";
    const header = document.createElement("span");
    header.setAttribute("slot", "header");
    header.textContent = `Obiekty Grentona nieobecne w HA (${report.not_in_ha.length})`;
    panel.appendChild(header);

    const box = document.createElement("div");
    box.style.padding = "0 16px 12px";
    if (report.not_in_ha_by_type.length) {
      const byType = report.not_in_ha_by_type
        .map(([type, count]) => `${count}× ${type}`)
        .join(", ");
      box.innerHTML = `<p style="margin:8px 0;color:var(--secondary-text-color)">Wg typu: ${byType}</p>`;
      const ul = document.createElement("ul");
      ul.style.margin = "0";
      report.not_in_ha
        .slice()
        .sort((a, b) => (a.type || "").localeCompare(b.type || ""))
        .forEach((o) => {
          const li = document.createElement("li");
          li.textContent = `${o.grenton_id} [${o.type}] ${o.name || ""}`;
          ul.appendChild(li);
        });
      box.appendChild(ul);
    } else {
      box.innerHTML = `<span style="color:var(--secondary-text-color)">brak</span>`;
    }
    if (report.input_not_in_ha_count) {
      const note = document.createElement("p");
      note.style.cssText = "margin:8px 0 0;color:var(--secondary-text-color);font-size:0.9em";
      note.textContent = `Pominięto ${report.input_not_in_ha_count} wejść DIN/Satel (przyciski/wejścia alarmu) — zwykle nie są encjami HA.`;
      box.appendChild(note);
    }
    panel.appendChild(box);
    this._results.appendChild(panel);
  }

  _allObjectsTable(report) {
    const card = document.createElement("ha-card");
    card.setAttribute("header", `Wszystkie obiekty (${report.merged.length})`);
    const box = document.createElement("div");
    box.style.padding = "8px 16px 16px";

    const data = report.merged.map((r, i) => ({
      id: r.grenton_id || r.entity_id || String(i),
      grenton_id: r.grenton_id || "",
      name: r.ha_name || r.om_name || "",
      type: r.om_type || r.device_type || "",
      entity_id: r.entity_id || "",
      mode: r.mode || (r.is_input ? "wejście" : "—"),
      area: r.area || "",
      status: rowStatus(r),
    }));

    box.appendChild(
      this._table(
        {
          status: { title: "Status", sortable: true, filterable: true },
          grenton_id: { title: "Grenton ID", sortable: true, filterable: true },
          name: { title: "Nazwa", sortable: true, filterable: true, grows: true },
          type: { title: "Typ", sortable: true, filterable: true },
          entity_id: { title: "Encja HA", sortable: true, filterable: true },
          mode: { title: "Aktualizacja", sortable: true, filterable: true },
          area: { title: "Obszar", sortable: true, filterable: true },
        },
        data,
        false
      )
    );
    card.appendChild(box);
    return card;
  }

  // Native ha-data-table when available; otherwise a themed HTML table.
  _table(columns, data, compact) {
    if (customElements.get("ha-data-table")) {
      const table = document.createElement("ha-data-table");
      table.columns = columns;
      table.data = data;
      table.autoHeight = compact;
      table.clickable = false;
      if (!compact) table.filter = "";
      table.style.setProperty("--data-table-border-width", "0");
      return table;
    }
    return this._fallbackTable(columns, data);
  }

  _fallbackTable(columns, data) {
    const wrap = document.createElement("div");
    wrap.style.overflowX = "auto";
    const table = document.createElement("table");
    table.style.cssText = "width:100%;border-collapse:collapse;font-size:0.95em";
    const keys = Object.keys(columns);

    const thead = document.createElement("thead");
    const htr = document.createElement("tr");
    keys.forEach((k) => {
      const th = document.createElement("th");
      th.textContent = columns[k].title;
      th.style.cssText =
        "text-align:left;padding:8px;border-bottom:1px solid var(--divider-color);white-space:nowrap";
      htr.appendChild(th);
    });
    thead.appendChild(htr);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    data.forEach((row) => {
      const tr = document.createElement("tr");
      keys.forEach((k) => {
        const td = document.createElement("td");
        td.textContent = row[k] === undefined || row[k] === null ? "" : String(row[k]);
        td.style.cssText =
          "padding:6px 8px;border-bottom:1px solid var(--divider-color)";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    return wrap;
  }
}

customElements.define("grenton-objects-panel", GrentonObjectsPanel);
