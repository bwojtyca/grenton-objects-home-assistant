/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const N = globalThis, G = N.ShadowRoot && (N.ShadyCSS === void 0 || N.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, W = Symbol(), Z = /* @__PURE__ */ new WeakMap();
let ae = class {
  constructor(e, t, s) {
    if (this._$cssResult$ = !0, s !== W) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (G && e === void 0) {
      const s = t !== void 0 && t.length === 1;
      s && (e = Z.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), s && Z.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const ue = (i) => new ae(typeof i == "string" ? i : i + "", void 0, W), _e = (i, ...e) => {
  const t = i.length === 1 ? i[0] : e.reduce((s, r, n) => s + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + i[n + 1], i[0]);
  return new ae(t, i, W);
}, fe = (i, e) => {
  if (G) i.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const s = document.createElement("style"), r = N.litNonce;
    r !== void 0 && s.setAttribute("nonce", r), s.textContent = t.cssText, i.appendChild(s);
  }
}, J = G ? (i) => i : (i) => i instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const s of e.cssRules) t += s.cssText;
  return ue(t);
})(i) : i;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: me, defineProperty: ye, getOwnPropertyDescriptor: $e, getOwnPropertyNames: be, getOwnPropertySymbols: ge, getPrototypeOf: ve } = Object, I = globalThis, Q = I.trustedTypes, Ae = Q ? Q.emptyScript : "", we = I.reactiveElementPolyfillSupport, j = (i, e) => i, M = { toAttribute(i, e) {
  switch (e) {
    case Boolean:
      i = i ? Ae : null;
      break;
    case Object:
    case Array:
      i = i == null ? i : JSON.stringify(i);
  }
  return i;
}, fromAttribute(i, e) {
  let t = i;
  switch (e) {
    case Boolean:
      t = i !== null;
      break;
    case Number:
      t = i === null ? null : Number(i);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(i);
      } catch {
        t = null;
      }
  }
  return t;
} }, q = (i, e) => !me(i, e), X = { attribute: !0, type: String, converter: M, reflect: !1, useDefault: !1, hasChanged: q };
Symbol.metadata ??= Symbol("metadata"), I.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let S = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = X) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const s = Symbol(), r = this.getPropertyDescriptor(e, s, t);
      r !== void 0 && ye(this.prototype, e, r);
    }
  }
  static getPropertyDescriptor(e, t, s) {
    const { get: r, set: n } = $e(this.prototype, e) ?? { get() {
      return this[t];
    }, set(o) {
      this[t] = o;
    } };
    return { get: r, set(o) {
      const a = r?.call(this);
      n?.call(this, o), this.requestUpdate(e, a, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? X;
  }
  static _$Ei() {
    if (this.hasOwnProperty(j("elementProperties"))) return;
    const e = ve(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(j("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(j("properties"))) {
      const t = this.properties, s = [...be(t), ...ge(t)];
      for (const r of s) this.createProperty(r, t[r]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [s, r] of t) this.elementProperties.set(s, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, s] of this.elementProperties) {
      const r = this._$Eu(t, s);
      r !== void 0 && this._$Eh.set(r, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const s = new Set(e.flat(1 / 0).reverse());
      for (const r of s) t.unshift(J(r));
    } else e !== void 0 && t.push(J(e));
    return t;
  }
  static _$Eu(e, t) {
    const s = t.attribute;
    return s === !1 ? void 0 : typeof s == "string" ? s : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
  }
  addController(e) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
  }
  removeController(e) {
    this._$EO?.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
    for (const s of t.keys()) this.hasOwnProperty(s) && (e.set(s, this[s]), delete this[s]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return fe(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((e) => e.hostDisconnected?.());
  }
  attributeChangedCallback(e, t, s) {
    this._$AK(e, s);
  }
  _$ET(e, t) {
    const s = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, s);
    if (r !== void 0 && s.reflect === !0) {
      const n = (s.converter?.toAttribute !== void 0 ? s.converter : M).toAttribute(t, s.type);
      this._$Em = e, n == null ? this.removeAttribute(r) : this.setAttribute(r, n), this._$Em = null;
    }
  }
  _$AK(e, t) {
    const s = this.constructor, r = s._$Eh.get(e);
    if (r !== void 0 && this._$Em !== r) {
      const n = s.getPropertyOptions(r), o = typeof n.converter == "function" ? { fromAttribute: n.converter } : n.converter?.fromAttribute !== void 0 ? n.converter : M;
      this._$Em = r;
      const a = o.fromAttribute(t, n.type);
      this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
    }
  }
  requestUpdate(e, t, s, r = !1, n) {
    if (e !== void 0) {
      const o = this.constructor;
      if (r === !1 && (n = this[e]), s ??= o.getPropertyOptions(e), !((s.hasChanged ?? q)(n, t) || s.useDefault && s.reflect && n === this._$Ej?.get(e) && !this.hasAttribute(o._$Eu(e, s)))) return;
      this.C(e, t, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: s, reflect: r, wrapped: n }, o) {
    s && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, o ?? t ?? this[e]), n !== !0 || o !== void 0) || (this._$AL.has(e) || (this.hasUpdated || s || (t = void 0), this._$AL.set(e, t)), r === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (t) {
      Promise.reject(t);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [r, n] of this._$Ep) this[r] = n;
        this._$Ep = void 0;
      }
      const s = this.constructor.elementProperties;
      if (s.size > 0) for (const [r, n] of s) {
        const { wrapped: o } = n, a = this[r];
        o !== !0 || this._$AL.has(r) || a === void 0 || this.C(r, void 0, n, a);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((s) => s.hostUpdate?.()), this.update(t)) : this._$EM();
    } catch (s) {
      throw e = !1, this._$EM(), s;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    this._$EO?.forEach((t) => t.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$Eq &&= this._$Eq.forEach((t) => this._$ET(t, this[t])), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
S.elementStyles = [], S.shadowRootOptions = { mode: "open" }, S[j("elementProperties")] = /* @__PURE__ */ new Map(), S[j("finalized")] = /* @__PURE__ */ new Map(), we?.({ ReactiveElement: S }), (I.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const V = globalThis, Y = (i) => i, R = V.trustedTypes, ee = R ? R.createPolicy("lit-html", { createHTML: (i) => i }) : void 0, le = "$lit$", $ = `lit$${Math.random().toFixed(9).slice(2)}$`, ce = "?" + $, Se = `<${ce}>`, w = document, C = () => w.createComment(""), P = (i) => i === null || typeof i != "object" && typeof i != "function", F = Array.isArray, ke = (i) => F(i) || typeof i?.[Symbol.iterator] == "function", B = `[ 	
\f\r]`, E = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, te = /-->/g, se = />/g, g = RegExp(`>|${B}(?:([^\\s"'>=/]+)(${B}*=${B}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), ie = /'/g, re = /"/g, he = /^(?:script|style|textarea|title)$/i, xe = (i) => (e, ...t) => ({ _$litType$: i, strings: e, values: t }), p = xe(1), k = Symbol.for("lit-noChange"), c = Symbol.for("lit-nothing"), ne = /* @__PURE__ */ new WeakMap(), A = w.createTreeWalker(w, 129);
function pe(i, e) {
  if (!F(i) || !i.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ee !== void 0 ? ee.createHTML(e) : e;
}
const Ee = (i, e) => {
  const t = i.length - 1, s = [];
  let r, n = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", o = E;
  for (let a = 0; a < t; a++) {
    const l = i[a];
    let d, u, h = -1, m = 0;
    for (; m < l.length && (o.lastIndex = m, u = o.exec(l), u !== null); ) m = o.lastIndex, o === E ? u[1] === "!--" ? o = te : u[1] !== void 0 ? o = se : u[2] !== void 0 ? (he.test(u[2]) && (r = RegExp("</" + u[2], "g")), o = g) : u[3] !== void 0 && (o = g) : o === g ? u[0] === ">" ? (o = r ?? E, h = -1) : u[1] === void 0 ? h = -2 : (h = o.lastIndex - u[2].length, d = u[1], o = u[3] === void 0 ? g : u[3] === '"' ? re : ie) : o === re || o === ie ? o = g : o === te || o === se ? o = E : (o = g, r = void 0);
    const y = o === g && i[a + 1].startsWith("/>") ? " " : "";
    n += o === E ? l + Se : h >= 0 ? (s.push(d), l.slice(0, h) + le + l.slice(h) + $ + y) : l + $ + (h === -2 ? a : y);
  }
  return [pe(i, n + (i[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), s];
};
class O {
  constructor({ strings: e, _$litType$: t }, s) {
    let r;
    this.parts = [];
    let n = 0, o = 0;
    const a = e.length - 1, l = this.parts, [d, u] = Ee(e, t);
    if (this.el = O.createElement(d, s), A.currentNode = this.el.content, t === 2 || t === 3) {
      const h = this.el.content.firstChild;
      h.replaceWith(...h.childNodes);
    }
    for (; (r = A.nextNode()) !== null && l.length < a; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const h of r.getAttributeNames()) if (h.endsWith(le)) {
          const m = u[o++], y = r.getAttribute(h).split($), H = /([.?@])?(.*)/.exec(m);
          l.push({ type: 1, index: n, name: H[2], strings: y, ctor: H[1] === "." ? ze : H[1] === "?" ? Ce : H[1] === "@" ? Pe : D }), r.removeAttribute(h);
        } else h.startsWith($) && (l.push({ type: 6, index: n }), r.removeAttribute(h));
        if (he.test(r.tagName)) {
          const h = r.textContent.split($), m = h.length - 1;
          if (m > 0) {
            r.textContent = R ? R.emptyScript : "";
            for (let y = 0; y < m; y++) r.append(h[y], C()), A.nextNode(), l.push({ type: 2, index: ++n });
            r.append(h[m], C());
          }
        }
      } else if (r.nodeType === 8) if (r.data === ce) l.push({ type: 2, index: n });
      else {
        let h = -1;
        for (; (h = r.data.indexOf($, h + 1)) !== -1; ) l.push({ type: 7, index: n }), h += $.length - 1;
      }
      n++;
    }
  }
  static createElement(e, t) {
    const s = w.createElement("template");
    return s.innerHTML = e, s;
  }
}
function x(i, e, t = i, s) {
  if (e === k) return e;
  let r = s !== void 0 ? t._$Co?.[s] : t._$Cl;
  const n = P(e) ? void 0 : e._$litDirective$;
  return r?.constructor !== n && (r?._$AO?.(!1), n === void 0 ? r = void 0 : (r = new n(i), r._$AT(i, t, s)), s !== void 0 ? (t._$Co ??= [])[s] = r : t._$Cl = r), r !== void 0 && (e = x(i, r._$AS(i, e.values), r, s)), e;
}
class je {
  constructor(e, t) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: t }, parts: s } = this._$AD, r = (e?.creationScope ?? w).importNode(t, !0);
    A.currentNode = r;
    let n = A.nextNode(), o = 0, a = 0, l = s[0];
    for (; l !== void 0; ) {
      if (o === l.index) {
        let d;
        l.type === 2 ? d = new T(n, n.nextSibling, this, e) : l.type === 1 ? d = new l.ctor(n, l.name, l.strings, this, e) : l.type === 6 && (d = new Oe(n, this, e)), this._$AV.push(d), l = s[++a];
      }
      o !== l?.index && (n = A.nextNode(), o++);
    }
    return A.currentNode = w, r;
  }
  p(e) {
    let t = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(e, s, t), t += s.strings.length - 2) : s._$AI(e[t])), t++;
  }
}
class T {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, t, s, r) {
    this.type = 2, this._$AH = c, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = s, this.options = r, this._$Cv = r?.isConnected ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const t = this._$AM;
    return t !== void 0 && e?.nodeType === 11 && (e = t.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, t = this) {
    e = x(this, e, t), P(e) ? e === c || e == null || e === "" ? (this._$AH !== c && this._$AR(), this._$AH = c) : e !== this._$AH && e !== k && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : ke(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== c && P(this._$AH) ? this._$AA.nextSibling.data = e : this.T(w.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: t, _$litType$: s } = e, r = typeof s == "number" ? this._$AC(e) : (s.el === void 0 && (s.el = O.createElement(pe(s.h, s.h[0]), this.options)), s);
    if (this._$AH?._$AD === r) this._$AH.p(t);
    else {
      const n = new je(r, this), o = n.u(this.options);
      n.p(t), this.T(o), this._$AH = n;
    }
  }
  _$AC(e) {
    let t = ne.get(e.strings);
    return t === void 0 && ne.set(e.strings, t = new O(e)), t;
  }
  k(e) {
    F(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let s, r = 0;
    for (const n of e) r === t.length ? t.push(s = new T(this.O(C()), this.O(C()), this, this.options)) : s = t[r], s._$AI(n), r++;
    r < t.length && (this._$AR(s && s._$AB.nextSibling, r), t.length = r);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    for (this._$AP?.(!1, !0, t); e !== this._$AB; ) {
      const s = Y(e).nextSibling;
      Y(e).remove(), e = s;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class D {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, s, r, n) {
    this.type = 1, this._$AH = c, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = n, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = c;
  }
  _$AI(e, t = this, s, r) {
    const n = this.strings;
    let o = !1;
    if (n === void 0) e = x(this, e, t, 0), o = !P(e) || e !== this._$AH && e !== k, o && (this._$AH = e);
    else {
      const a = e;
      let l, d;
      for (e = n[0], l = 0; l < n.length - 1; l++) d = x(this, a[s + l], t, l), d === k && (d = this._$AH[l]), o ||= !P(d) || d !== this._$AH[l], d === c ? e = c : e !== c && (e += (d ?? "") + n[l + 1]), this._$AH[l] = d;
    }
    o && !r && this.j(e);
  }
  j(e) {
    e === c ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class ze extends D {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === c ? void 0 : e;
  }
}
class Ce extends D {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== c);
  }
}
class Pe extends D {
  constructor(e, t, s, r, n) {
    super(e, t, s, r, n), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = x(this, e, t, 0) ?? c) === k) return;
    const s = this._$AH, r = e === c && s !== c || e.capture !== s.capture || e.once !== s.once || e.passive !== s.passive, n = e !== c && (s === c || r);
    r && this.element.removeEventListener(this.name, this, s), n && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class Oe {
  constructor(e, t, s) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    x(this, e);
  }
}
const Te = V.litHtmlPolyfillSupport;
Te?.(O, T), (V.litHtmlVersions ??= []).push("3.3.3");
const Ue = (i, e, t) => {
  const s = t?.renderBefore ?? e;
  let r = s._$litPart$;
  if (r === void 0) {
    const n = t?.renderBefore ?? null;
    s._$litPart$ = r = new T(e.insertBefore(C(), n), n, void 0, t ?? {});
  }
  return r._$AI(i), r;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const K = globalThis;
class z extends S {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Ue(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return k;
  }
}
z._$litElement$ = !0, z.finalized = !0, K.litElementHydrateSupport?.({ LitElement: z });
const He = K.litElementPolyfillSupport;
He?.({ LitElement: z });
(K.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ne = (i) => (e, t) => {
  t !== void 0 ? t.addInitializer(() => {
    customElements.define(i, e);
  }) : customElements.define(i, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Me = { attribute: !0, type: String, converter: M, reflect: !1, hasChanged: q }, Re = (i = Me, e, t) => {
  const { kind: s, metadata: r } = t;
  let n = globalThis.litPropertyMetadata.get(r);
  if (n === void 0 && globalThis.litPropertyMetadata.set(r, n = /* @__PURE__ */ new Map()), s === "setter" && ((i = Object.create(i)).wrapped = !0), n.set(t.name, i), s === "accessor") {
    const { name: o } = t;
    return { set(a) {
      const l = e.get.call(this);
      e.set.call(this, a), this.requestUpdate(o, l, i, !0, a);
    }, init(a) {
      return a !== void 0 && this.C(o, void 0, i, a), a;
    } };
  }
  if (s === "setter") {
    const { name: o } = t;
    return function(a) {
      const l = this[o];
      e.call(this, a), this.requestUpdate(o, l, i, !0, a);
    };
  }
  throw Error("Unsupported decorator location: " + s);
};
function U(i) {
  return (e, t) => typeof t == "object" ? Re(i, e, t) : ((s, r, n) => {
    const o = r.hasOwnProperty(n);
    return r.constructor.createProperty(n, s), o ? Object.getOwnPropertyDescriptor(r, n) : void 0;
  })(i, e, t);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function b(i) {
  return U({ ...i, state: !0, attribute: !1 });
}
const L = "unavailable", Ie = "unknown", De = "off", Be = /* @__PURE__ */ new Set([
  "alarm_control_panel",
  "alert",
  "automation",
  "binary_sensor",
  "calendar",
  "camera",
  "climate",
  "cover",
  "device_tracker",
  "fan",
  "group",
  "humidifier",
  "input_boolean",
  "lawn_mower",
  "light",
  "lock",
  "media_player",
  "person",
  "plant",
  "remote",
  "schedule",
  "script",
  "siren",
  "sun",
  "switch",
  "timer",
  "update",
  "vacuum",
  "valve",
  "water_heater",
  "weather"
]), Le = /* @__PURE__ */ new Set([
  "ai_task",
  "button",
  "conversation",
  "event",
  "image",
  "infrared",
  "input_button",
  "notify",
  "radio_frequency",
  "scene",
  "stt",
  "tag",
  "tts",
  "wake_word",
  "datetime"
]), de = (i) => i.substring(0, i.indexOf(".")), Ge = (i) => String(i).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_+|_+$)/g, "") || "_", We = (i) => i.reduceRight(
  (e, t) => `var(${t}${e ? `, ${e}` : ""})`,
  void 0
);
function qe(i, e) {
  const t = de(i.entity_id), s = i.state;
  if (Le.has(t))
    return s !== L;
  if (s === L || s === Ie || s === De && t !== "alert")
    return !1;
  switch (t) {
    case "alarm_control_panel":
      return s !== "disarmed";
    case "alert":
      return s !== "idle";
    case "cover":
      return s !== "closed";
    case "device_tracker":
    case "person":
      return s !== "not_home";
    case "lawn_mower":
      return !["docked", "paused"].includes(s);
    case "lock":
      return s !== "locked";
    case "media_player":
      return s !== "standby";
    case "vacuum":
      return !["idle", "docked", "paused"].includes(s);
    case "valve":
      return s !== "closed";
    case "plant":
      return s === "problem";
    case "group":
      return ["on", "home", "open", "locked", "problem"].includes(s);
    case "timer":
      return s === "active";
    case "camera":
      return s === "streaming";
    default:
      return !0;
  }
}
function Ve(i, e, t, s) {
  const r = [], n = Ge(t), o = s ? "active" : "inactive";
  return e && r.push(`--state-${i}-${e}-${n}-color`), r.push(
    `--state-${i}-${n}-color`,
    `--state-${i}-${o}-color`,
    `--state-${o}-color`
  ), r;
}
function Fe(i, e) {
  const t = i.state;
  if (t === L)
    return "var(--state-unavailable-color)";
  const s = de(i.entity_id);
  if (!Be.has(s))
    return;
  const r = qe(i);
  return We(
    Ve(s, i.attributes.device_class, t, r)
  );
}
var Ke = Object.defineProperty, Ze = Object.getOwnPropertyDescriptor, f = (i, e, t, s) => {
  for (var r = s > 1 ? void 0 : s ? Ze(e, t) : e, n = i.length - 1, o; n >= 0; n--)
    (o = i[n]) && (r = (s ? o(e, t, r) : o(r)) || r);
  return s && r && Ke(e, t, r), r;
};
const Je = "grenton_objects", v = {
  error: "#db4437",
  warn: "#f9a825",
  missing: "#3d70b2",
  ok: "#43a047",
  muted: "#9e9e9e"
}, Qe = [
  { key: "push", label: "push" },
  { key: "polling", label: "polling" },
  { key: "brak", label: "brak" }
], Xe = [
  { key: "problem", label: "Problem" },
  { key: "ok", label: "OK" },
  { key: "missing", label: "Brak w HA" },
  { key: "unsupported", label: "Nieobsługiwany" }
];
function oe(i) {
  const e = i.flags;
  return e.includes("orphan") ? {
    label: "Błąd: brak w projekcie",
    sev: "error",
    cat: "problem",
    hint: "Encja HA wskazuje grenton_id, którego nie ma w projekcie OM. Obiekt usunięto/zmieniono w OM albo encja ma zły grenton_id — popraw jedno z nich."
  } : e.includes("push_wrong_object") ? {
    label: "Błąd: push ze złego obiektu",
    sev: "error",
    cat: "problem",
    hint: "Zdarzenie push aktualizuje tę encję stanem INNEGO obiektu Grentona niż jej grenton_id. Popraw źródło w zdarzeniu (OnChange) obiektu w OM."
  } : e.includes("push_bad_service") ? {
    label: "Błąd: zła akcja push",
    sev: "error",
    cat: "problem",
    hint: "Akcja push nie pasuje do typu encji. Użyj: light→set_state/set_brightness/set_rgb, switch/binary_sensor→set_state, cover→set_cover, sensor→set_value."
  } : e.includes("push_no_event") ? {
    label: "Błąd: push bez zdarzenia",
    sev: "error",
    cat: "problem",
    hint: "Encja jest w trybie push, ale w projekcie nie ma dla niej zdarzenia HA_Integration_Queue_Prepare. Dodaj zdarzenie OnChange w OM albo włącz polling."
  } : e.includes("poll_redundant") ? {
    label: "Uwaga: polling + push",
    sev: "warn",
    cat: "problem",
    hint: "Encja jest pollowana i jednocześnie ma zdarzenie push — podwójna aktualizacja. Wyłącz auto-update albo usuń zdarzenie push w OM."
  } : i.in_ha ? { label: "OK", sev: "ok", cat: "ok" } : i.is_unsupported ? {
    label: "Nieobsługiwany w integracji",
    sev: "muted",
    cat: "unsupported",
    hint: "Integracja nie potrafi wystawić tego typu obiektu Grentona (np. DALI_MASTER, kontener Satel)."
  } : {
    label: "Brak w HA",
    sev: "missing",
    cat: "missing",
    hint: "Obiekt istnieje w projekcie Grentona, ale nie jest dodany do HA. Dodaj go przez integrację, jeśli chcesz go używać."
  };
}
function Ye(i) {
  const e = new Uint8Array(i), t = 32768;
  let s = "";
  for (let r = 0; r < e.length; r += t)
    s += String.fromCharCode.apply(null, Array.from(e.subarray(r, r + t)));
  return btoa(s);
}
let _ = class extends z {
  constructor() {
    super(...arguments), this.narrow = !1, this._busy = !1, this._busyName = "", this._search = "", this._typeSel = /* @__PURE__ */ new Set(), this._updSel = /* @__PURE__ */ new Set(), this._statSel = /* @__PURE__ */ new Set(), this._entityIds = /* @__PURE__ */ new Set(), this._resetFilters = () => {
      this._typeSel = this._defaultTypeSel(), this._updSel = /* @__PURE__ */ new Set(), this._statSel = /* @__PURE__ */ new Set();
    }, this._pickFile = () => {
      this.renderRoot.querySelector('input[type="file"]')?.click();
    }, this._onFile = async (i) => {
      const e = i.target, t = e.files?.[0];
      if (e.value = "", !!t) {
        this._error = void 0, this._busy = !0, this._busyName = t.name;
        try {
          const s = await t.arrayBuffer(), r = await this.hass.connection.sendMessagePromise({
            type: "grenton_objects/analyze",
            omp_base64: Ye(s)
          });
          this._report = r, this._entityIds = new Set(r.merged.map((n) => n.entity_id).filter((n) => !!n)), this._typeSel = this._defaultTypeSel(), this._updSel = /* @__PURE__ */ new Set(), this._statSel = /* @__PURE__ */ new Set();
        } catch (s) {
          this._error = s?.message || s?.code || "Nie udało się odczytać pliku .omp.";
        } finally {
          this._busy = !1;
        }
      }
    };
  }
  firstUpdated() {
    const i = window;
    !customElements.get("ha-data-table") && i.loadCardHelpers && i.loadCardHelpers().then((e) => e?.createCardElement?.({ type: "entities", entities: [] })).catch(() => {
    });
  }
  // Re-render on hass change only when one of our entities actually changed,
  // so unrelated system state changes don't churn the table.
  shouldUpdate(i) {
    if (i.size === 1 && i.has("hass")) {
      const e = i.get("hass");
      if (e && this._entityIds.size) {
        for (const t of this._entityIds)
          if (e.states[t] !== this.hass.states[t]) return !0;
        return !1;
      }
      return !1;
    }
    return !0;
  }
  render() {
    return p`
      ${this._uploadCard()}
      ${this._error ? this._errorAlert() : c}
      ${this._report ? this._verdictAlert() : c}
      ${this._report ? this._summaryCard() : c}
      ${this._report ? this._objectsCard() : c}
    `;
  }
  _uploadCard() {
    return p`
      <ha-card header="Analiza projektu Grenton">
        <div class="card-content">
          <p class="intro">
            Wgraj plik projektu Object Managera (.omp). Zostanie porównany z aktualną
            konfiguracją Home Assistant — nic nie jest zmieniane.
          </p>
          <ha-button raised @click=${this._pickFile}>Wybierz plik .omp</ha-button>
          <input type="file" accept=".omp,.zip" style="display:none" @change=${this._onFile} />
          ${this._busy ? p`<div class="muted" style="margin-top:12px">Analizuję projekt… (${this._busyName})</div>` : c}
        </div>
      </ha-card>
    `;
  }
  _errorAlert() {
    return p`<ha-alert alert-type="error" title="Błąd analizy">${this._error}</ha-alert>`;
  }
  _verdictAlert() {
    const i = this._report.verdict === "ok";
    return p`<ha-alert
      alert-type=${i ? "success" : "warning"}
      title=${i ? "Integracja spójna z projektem" : "Wykryto rozbieżności"}
    ></ha-alert>`;
  }
  _summaryCard() {
    const i = this._report, e = i.summary, t = Object.keys(e.per_domain).sort((o, a) => e.per_domain[a].push + e.per_domain[a].polling - (e.per_domain[o].push + e.per_domain[o].polling)).map((o) => `${o} (${e.per_domain[o].push} push / ${e.per_domain[o].polling} polling)`).join(" · "), s = i.not_in_ha_by_type.map(([o, a]) => `${a}× ${o}`).join(", "), r = [
      { label: "encje HA bez obiektu w projekcie", count: i.orphans.length, sev: "error" },
      { label: "push aktualizujący zły obiekt Grentona", count: i.push_object_mismatch.length, sev: "error" },
      { label: "push z niewłaściwą akcją dla typu encji", count: i.push_service_mismatch.length, sev: "error" },
      { label: "encje push bez zdarzenia w Grentonie", count: i.push_no_event.length, sev: "error" },
      { label: "zdarzenia push w nieistniejącą encję", count: i.push_orphan_targets.length, sev: "error" },
      { label: "polling z jednoczesnym push (redundancja)", count: i.poll_with_push.length, sev: "warn" },
      { label: `obiekty Grentona nieobecne w HA${s ? " (" + s + ")" : ""}`, count: i.not_in_ha.length, sev: "missing" }
    ], n = r.some((o) => o.count > 0 && (o.sev === "error" || o.sev === "warn"));
    return p`
      <ha-card header="Podsumowanie">
        <div class="card-content summary">
          <div>
            Obiekty projektu: <b>${e.om_total}</b> · Encje w HA: <b>${e.ha_total}</b> ·
            Zdarzenia push (Grenton→HA): <b>${e.push_events}</b><br />
            Tryb aktualizacji: <b>${e.push}</b> push · <b>${e.polling}</b> polling<br />
            <span class="muted">Wg domeny: ${t}</span>
          </div>
          <div class="problems" style="margin-top:12px">
            ${!n && i.not_in_ha.length === 0 ? p`<div style=${`color:${v.ok}`}>Brak problemów — wszystko spójne.</div>` : r.map((o) => {
      const a = o.count > 0, l = a ? v[o.sev] : v.muted, d = a && (o.sev === "error" || o.sev === "warn") ? "active-error" : "";
      return p`<div class=${d} style=${`color:${l}`}>${o.count} ${o.label}</div>`;
    })}
          </div>
          ${i.scaffolding ? this._scaffold(i.scaffolding) : c}
        </div>
      </ha-card>
    `;
  }
  _scaffold(i) {
    return p`
      <div class="scaffold">
        <div class="title">Konfiguracja po stronie Grentona (skrypty/obiekty)</div>
        ${i.push_used ? c : p`<div class="muted" style="font-size:0.9em;margin-bottom:4px">Push nieużywany — obiekty kolejki nie są wymagane.</div>`}
        ${i.checks.map((e) => {
      let t = v.muted, s = "obecny";
      return e.present ? t = v.ok : e.required ? (t = v.error, s = "BRAK (wymagane)") : s = "brak (opcjonalne)", p`<div style=${`color:${t}`}>${e.name} — ${e.desc}: ${s}</div>`;
    })}
      </div>
    `;
  }
  // ─── objects table + filters ───────────────────────────────────────────
  get _viewRows() {
    return (this._report?.merged ?? []).map((t, s) => {
      const r = oe(t), n = t.in_ha ? t.mode ?? "brak" : "brak", o = t.in_ha ? t.mode === "polling" ? `polling (${t.interval ?? "?"} s)` : "push" : "brak";
      return {
        id: t.grenton_id || t.entity_id || String(s),
        name: t.om_name || t.ha_name || "",
        grenton_id: t.grenton_id || "",
        type: t.om_type || t.device_type || "",
        entity_id: t.entity_id || "",
        entry_id: t.entry_id || "",
        update: o,
        updateCat: n,
        status: r.label,
        sev: r.sev,
        statusCat: r.cat,
        hint: r.hint
      };
    }).filter((t) => !(this._typeSel.size && !this._typeSel.has(t.type) || this._updSel.size && !this._updSel.has(t.updateCat) || this._statSel.size && !this._statSel.has(t.statusCat)));
  }
  _columns() {
    return {
      name: { title: "Nazwa (Grenton)", main: !0, sortable: !0, filterable: !0, flex: 2 },
      grenton_id: { title: "Grenton ID", sortable: !0, filterable: !0, width: "160px" },
      type: { title: "Typ", sortable: !0, filterable: !0, width: "130px" },
      entity_id: {
        title: "Encja HA",
        sortable: !0,
        filterable: !0,
        width: "280px",
        template: (i, e) => this._entityCell(e ?? i)
      },
      update: { title: "Aktualizacja", sortable: !0, filterable: !0, width: "150px" },
      status: {
        title: "Status",
        sortable: !0,
        filterable: !0,
        width: "220px",
        template: (i, e) => this._statusCell(e ?? i)
      },
      actions: {
        title: "Akcje",
        sortable: !1,
        filterable: !1,
        width: "70px",
        template: (i, e) => this._actionsCell(e ?? i)
      }
    };
  }
  _entityCell(i) {
    if (!i.entity_id) return p`<span class="muted">—</span>`;
    const e = this.hass?.states?.[i.entity_id], t = e ? Fe(e) ?? "var(--secondary-text-color)" : "var(--secondary-text-color)", s = e ? this._formatState(e) : "niedostępna";
    return p`
      <span class="entity" @click=${() => this._moreInfo(i.entity_id)}>
        ${e ? p`<ha-state-icon .stateObj=${e} style=${`color:${t}`}></ha-state-icon>` : c}
        <span>${i.entity_id}<span class="muted"> · ${s}</span></span>
      </span>
    `;
  }
  _statusCell(i) {
    const e = p`<ha-label dense .color=${v[i.sev]}>${i.status}</ha-label>`;
    return i.hint ? p`<ha-tooltip content=${i.hint}>${e}</ha-tooltip>` : e;
  }
  _actionsCell(i) {
    return i.entry_id ? p`<ha-icon
      class="cog"
      icon="mdi:cog"
      title="Otwórz konfigurację obiektu w integracji"
      @click=${() => this._openConfig(i.entry_id)}
    ></ha-icon>` : c;
  }
  _formatState(i) {
    const e = i.attributes?.unit_of_measurement;
    return e ? `${i.state} ${e}` : i.state;
  }
  _objectsCard() {
    const i = this._report.merged.length, e = this._viewRows.length;
    return p`
      <ha-card header=${`Wszystkie obiekty (${i})`}>
        <div class="card-content">
          <div class="legend">
            Kliknij encję, aby otworzyć jej okno; ikona w kolumnie Akcje otwiera konfigurację obiektu.
            Wyszukiwarka i filtry po prawej; kolor ikony encji zależy od stanu.
          </div>
          <div class="toolbar">
            <ha-textfield
              label="Szukaj"
              .value=${this._search}
              @input=${(t) => this._search = t.target.value}
            ></ha-textfield>
            <span class="muted">Po filtrach: ${e} z ${i}</span>
          </div>
          <div class="content">
            <div class="table-host">
              <ha-data-table
                .hass=${this.hass}
                .columns=${this._columns()}
                .data=${this._viewRows}
                .filter=${this._search}
                .autoHeight=${!0}
                .clickable=${!1}
              ></ha-data-table>
            </div>
            ${this._filtersPane()}
          </div>
        </div>
      </ha-card>
    `;
  }
  _filtersPane() {
    const i = this._report, e = (n) => {
      const o = {};
      for (const a of this._viewRowsAll()) o[a[n]] = (o[a[n]] || 0) + 1;
      return o;
    }, t = i.type_summary.map((n) => ({ key: n.type, label: `${n.type} (${n.count})${n.supported ? "" : " · nieobsł."}` })), s = e("updateCat"), r = e("statusCat");
    return p`
      <div class="filters">
        <div class="filters-head">
          <span>Filtry</span>
          <button class="reset-btn" @click=${this._resetFilters}>Wyczyść</button>
        </div>
        ${this._filterGroup("Typ", t, this._typeSel, "type")}
        ${this._filterGroup("Aktualizacja", Qe.map((n) => ({ key: n.key, label: `${n.label} (${s[n.key] || 0})` })), this._updSel, "upd")}
        ${this._filterGroup("Status", Xe.map((n) => ({ key: n.key, label: `${n.label} (${r[n.key] || 0})` })), this._statSel, "stat")}
      </div>
    `;
  }
  // Rows before type/upd/status filtering (for the per-value counts).
  _viewRowsAll() {
    return (this._report?.merged ?? []).map((e, t) => {
      const s = oe(e), r = e.in_ha ? e.mode ?? "brak" : "brak";
      return {
        id: "",
        name: "",
        grenton_id: "",
        type: e.om_type || e.device_type || "",
        entity_id: "",
        entry_id: "",
        update: "",
        updateCat: r,
        status: s.label,
        sev: s.sev,
        statusCat: s.cat
      };
    });
  }
  _filterGroup(i, e, t, s) {
    return p`
      <ha-expansion-panel outlined .expanded=${t.size > 0}>
        <div slot="header" class="filter-header">
          <span>${i}</span>
          ${t.size ? p`<span class="badge">${t.size}</span>
                <ha-icon
                  class="filter-clear"
                  icon="mdi:filter-variant-remove"
                  @click=${(r) => {
      r.stopPropagation(), this._setSel(s, /* @__PURE__ */ new Set());
    }}
                ></ha-icon>` : c}
        </div>
        <ha-list multi @selected=${(r) => this._onListSelected(r, s, e)}>
          ${e.map(
      (r) => p`<ha-check-list-item .value=${r.key} .selected=${t.has(r.key)}>${r.label}</ha-check-list-item>`
    )}
        </ha-list>
      </ha-expansion-panel>
    `;
  }
  _onListSelected(i, e, t) {
    const s = i?.detail?.index, r = s instanceof Set ? Array.from(s) : typeof s == "number" ? [s] : [], n = /* @__PURE__ */ new Set();
    r.forEach((o) => {
      t[o] && n.add(t[o].key);
    }), this._setSel(e, n);
  }
  _setSel(i, e) {
    i === "type" ? this._typeSel = e : i === "upd" ? this._updSel = e : this._statSel = e;
  }
  _defaultTypeSel() {
    const i = this._report?.type_summary ?? [];
    return new Set(i.filter((e) => e.supported && e.type !== "DIN").map((e) => e.type));
  }
  _moreInfo(i) {
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: i }, bubbles: !0, composed: !0 }));
  }
  _openConfig(i) {
    const e = `/config/integrations/integration/${Je}#config_entry=${i}`;
    window.history.pushState(null, "", e), this.dispatchEvent(new CustomEvent("location-changed", { bubbles: !0, composed: !0 }));
  }
};
_.styles = _e`
    :host { display: block; padding: 16px; box-sizing: border-box; }
    ha-card { display: block; margin-bottom: 16px; }
    .card-content { padding: 16px; }
    p.intro { margin-top: 0; color: var(--secondary-text-color); }
    .summary { line-height: 1.7; }
    .muted { color: var(--secondary-text-color); }
    .problems div { font-weight: 400; }
    .problems div.active-error { font-weight: 600; }
    .scaffold { margin-top: 16px; }
    .scaffold .title { font-weight: 600; margin-bottom: 4px; }
    .legend { color: var(--secondary-text-color); font-size: 0.9em; margin-bottom: 8px; }
    .toolbar { display: flex; gap: 16px; align-items: center; margin-bottom: 8px; }
    .toolbar ha-textfield { flex: 1 1 260px; }
    .content { display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap; }
    .table-host { flex: 1 1 520px; min-width: 0; }
    .filters { flex: 0 0 300px; max-width: 100%; display: flex; flex-direction: column; gap: 8px; }
    .filters-head { display: flex; align-items: center; justify-content: space-between; font-weight: 600; }
    ha-expansion-panel { --expansion-panel-content-padding: 0; }
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
    .reset-btn, .selall-btn {
      cursor: pointer; border: 1px solid var(--divider-color); border-radius: 6px; padding: 2px 8px;
      background: var(--secondary-background-color); color: var(--primary-text-color); font-size: 0.85em;
    }
  `;
f([
  U({ attribute: !1 })
], _.prototype, "hass", 2);
f([
  U({ attribute: !1 })
], _.prototype, "narrow", 2);
f([
  U({ attribute: !1 })
], _.prototype, "route", 2);
f([
  U({ attribute: !1 })
], _.prototype, "panel", 2);
f([
  b()
], _.prototype, "_report", 2);
f([
  b()
], _.prototype, "_error", 2);
f([
  b()
], _.prototype, "_busy", 2);
f([
  b()
], _.prototype, "_busyName", 2);
f([
  b()
], _.prototype, "_search", 2);
f([
  b()
], _.prototype, "_typeSel", 2);
f([
  b()
], _.prototype, "_updSel", 2);
f([
  b()
], _.prototype, "_statSel", 2);
_ = f([
  Ne("grenton-objects-panel")
], _);
export {
  _ as GrentonObjectsPanel
};
