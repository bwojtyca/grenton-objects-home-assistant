/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const M = globalThis, G = M.ShadowRoot && (M.ShadyCSS === void 0 || M.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, V = Symbol(), Z = /* @__PURE__ */ new WeakMap();
let lt = class {
  constructor(t, e, i) {
    if (this._$cssResult$ = !0, i !== V) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (G && t === void 0) {
      const i = e !== void 0 && e.length === 1;
      i && (t = Z.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && Z.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const _t = (s) => new lt(typeof s == "string" ? s : s + "", void 0, V), mt = (s, ...t) => {
  const e = s.length === 1 ? s[0] : t.reduce((i, r, n) => i + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + s[n + 1], s[0]);
  return new lt(e, s, V);
}, $t = (s, t) => {
  if (G) s.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const i = document.createElement("style"), r = M.litNonce;
    r !== void 0 && i.setAttribute("nonce", r), i.textContent = e.cssText, s.appendChild(i);
  }
}, J = G ? (s) => s : (s) => s instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const i of t.cssRules) e += i.cssText;
  return _t(e);
})(s) : s;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: yt, defineProperty: ft, getOwnPropertyDescriptor: bt, getOwnPropertyNames: gt, getOwnPropertySymbols: vt, getPrototypeOf: wt } = Object, I = globalThis, Q = I.trustedTypes, At = Q ? Q.emptyScript : "", St = I.reactiveElementPolyfillSupport, z = (s, t) => s, N = { toAttribute(s, t) {
  switch (t) {
    case Boolean:
      s = s ? At : null;
      break;
    case Object:
    case Array:
      s = s == null ? s : JSON.stringify(s);
  }
  return s;
}, fromAttribute(s, t) {
  let e = s;
  switch (t) {
    case Boolean:
      e = s !== null;
      break;
    case Number:
      e = s === null ? null : Number(s);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(s);
      } catch {
        e = null;
      }
  }
  return e;
} }, W = (s, t) => !yt(s, t), X = { attribute: !0, type: String, converter: N, reflect: !1, useDefault: !1, hasChanged: W };
Symbol.metadata ??= Symbol("metadata"), I.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let S = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = X) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const i = Symbol(), r = this.getPropertyDescriptor(t, i, e);
      r !== void 0 && ft(this.prototype, t, r);
    }
  }
  static getPropertyDescriptor(t, e, i) {
    const { get: r, set: n } = bt(this.prototype, t) ?? { get() {
      return this[e];
    }, set(a) {
      this[e] = a;
    } };
    return { get: r, set(a) {
      const l = r?.call(this);
      n?.call(this, a), this.requestUpdate(t, l, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? X;
  }
  static _$Ei() {
    if (this.hasOwnProperty(z("elementProperties"))) return;
    const t = wt(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(z("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(z("properties"))) {
      const e = this.properties, i = [...gt(e), ...vt(e)];
      for (const r of i) this.createProperty(r, e[r]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [i, r] of e) this.elementProperties.set(i, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, i] of this.elementProperties) {
      const r = this._$Eu(e, i);
      r !== void 0 && this._$Eh.set(r, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const i = new Set(t.flat(1 / 0).reverse());
      for (const r of i) e.unshift(J(r));
    } else t !== void 0 && e.push(J(t));
    return e;
  }
  static _$Eu(t, e) {
    const i = e.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t) => t(this));
  }
  addController(t) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t), this.renderRoot !== void 0 && this.isConnected && t.hostConnected?.();
  }
  removeController(t) {
    this._$EO?.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), e = this.constructor.elementProperties;
    for (const i of e.keys()) this.hasOwnProperty(i) && (t.set(i, this[i]), delete this[i]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return $t(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((t) => t.hostConnected?.());
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t) => t.hostDisconnected?.());
  }
  attributeChangedCallback(t, e, i) {
    this._$AK(t, i);
  }
  _$ET(t, e) {
    const i = this.constructor.elementProperties.get(t), r = this.constructor._$Eu(t, i);
    if (r !== void 0 && i.reflect === !0) {
      const n = (i.converter?.toAttribute !== void 0 ? i.converter : N).toAttribute(e, i.type);
      this._$Em = t, n == null ? this.removeAttribute(r) : this.setAttribute(r, n), this._$Em = null;
    }
  }
  _$AK(t, e) {
    const i = this.constructor, r = i._$Eh.get(t);
    if (r !== void 0 && this._$Em !== r) {
      const n = i.getPropertyOptions(r), a = typeof n.converter == "function" ? { fromAttribute: n.converter } : n.converter?.fromAttribute !== void 0 ? n.converter : N;
      this._$Em = r;
      const l = a.fromAttribute(e, n.type);
      this[r] = l ?? this._$Ej?.get(r) ?? l, this._$Em = null;
    }
  }
  requestUpdate(t, e, i, r = !1, n) {
    if (t !== void 0) {
      const a = this.constructor;
      if (r === !1 && (n = this[t]), i ??= a.getPropertyOptions(t), !((i.hasChanged ?? W)(n, e) || i.useDefault && i.reflect && n === this._$Ej?.get(t) && !this.hasAttribute(a._$Eu(t, i)))) return;
      this.C(t, e, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: i, reflect: r, wrapped: n }, a) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, a ?? e ?? this[t]), n !== !0 || a !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (e = void 0), this._$AL.set(t, e)), r === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (e) {
      Promise.reject(e);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
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
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [r, n] of i) {
        const { wrapped: a } = n, l = this[r];
        a !== !0 || this._$AL.has(r) || l === void 0 || this.C(r, void 0, n, l);
      }
    }
    let t = !1;
    const e = this._$AL;
    try {
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), this._$EO?.forEach((i) => i.hostUpdate?.()), this.update(e)) : this._$EM();
    } catch (i) {
      throw t = !1, this._$EM(), i;
    }
    t && this._$AE(e);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
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
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
S.elementStyles = [], S.shadowRootOptions = { mode: "open" }, S[z("elementProperties")] = /* @__PURE__ */ new Map(), S[z("finalized")] = /* @__PURE__ */ new Map(), St?.({ ReactiveElement: S }), (I.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const F = globalThis, Y = (s) => s, R = F.trustedTypes, tt = R ? R.createPolicy("lit-html", { createHTML: (s) => s }) : void 0, ct = "$lit$", b = `lit$${Math.random().toFixed(9).slice(2)}$`, ht = "?" + b, kt = `<${ht}>`, w = document, C = () => w.createComment(""), P = (s) => s === null || typeof s != "object" && typeof s != "function", q = Array.isArray, Et = (s) => q(s) || typeof s?.[Symbol.iterator] == "function", L = `[ 	
\f\r]`, x = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, et = /-->/g, st = />/g, g = RegExp(`>|${L}(?:([^\\s"'>=/]+)(${L}*=${L}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), it = /'/g, rt = /"/g, pt = /^(?:script|style|textarea|title)$/i, xt = (s) => (t, ...e) => ({ _$litType$: s, strings: t, values: e }), c = xt(1), k = Symbol.for("lit-noChange"), h = Symbol.for("lit-nothing"), nt = /* @__PURE__ */ new WeakMap(), v = w.createTreeWalker(w, 129);
function ut(s, t) {
  if (!q(s) || !s.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return tt !== void 0 ? tt.createHTML(t) : t;
}
const zt = (s, t) => {
  const e = s.length - 1, i = [];
  let r, n = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", a = x;
  for (let l = 0; l < e; l++) {
    const o = s[l];
    let u, d, p = -1, $ = 0;
    for (; $ < o.length && (a.lastIndex = $, d = a.exec(o), d !== null); ) $ = a.lastIndex, a === x ? d[1] === "!--" ? a = et : d[1] !== void 0 ? a = st : d[2] !== void 0 ? (pt.test(d[2]) && (r = RegExp("</" + d[2], "g")), a = g) : d[3] !== void 0 && (a = g) : a === g ? d[0] === ">" ? (a = r ?? x, p = -1) : d[1] === void 0 ? p = -2 : (p = a.lastIndex - d[2].length, u = d[1], a = d[3] === void 0 ? g : d[3] === '"' ? rt : it) : a === rt || a === it ? a = g : a === et || a === st ? a = x : (a = g, r = void 0);
    const f = a === g && s[l + 1].startsWith("/>") ? " " : "";
    n += a === x ? o + kt : p >= 0 ? (i.push(u), o.slice(0, p) + ct + o.slice(p) + b + f) : o + b + (p === -2 ? l : f);
  }
  return [ut(s, n + (s[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class O {
  constructor({ strings: t, _$litType$: e }, i) {
    let r;
    this.parts = [];
    let n = 0, a = 0;
    const l = t.length - 1, o = this.parts, [u, d] = zt(t, e);
    if (this.el = O.createElement(u, i), v.currentNode = this.el.content, e === 2 || e === 3) {
      const p = this.el.content.firstChild;
      p.replaceWith(...p.childNodes);
    }
    for (; (r = v.nextNode()) !== null && o.length < l; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const p of r.getAttributeNames()) if (p.endsWith(ct)) {
          const $ = d[a++], f = r.getAttribute(p).split(b), U = /([.?@])?(.*)/.exec($);
          o.push({ type: 1, index: n, name: U[2], strings: f, ctor: U[1] === "." ? Ct : U[1] === "?" ? Pt : U[1] === "@" ? Ot : D }), r.removeAttribute(p);
        } else p.startsWith(b) && (o.push({ type: 6, index: n }), r.removeAttribute(p));
        if (pt.test(r.tagName)) {
          const p = r.textContent.split(b), $ = p.length - 1;
          if ($ > 0) {
            r.textContent = R ? R.emptyScript : "";
            for (let f = 0; f < $; f++) r.append(p[f], C()), v.nextNode(), o.push({ type: 2, index: ++n });
            r.append(p[$], C());
          }
        }
      } else if (r.nodeType === 8) if (r.data === ht) o.push({ type: 2, index: n });
      else {
        let p = -1;
        for (; (p = r.data.indexOf(b, p + 1)) !== -1; ) o.push({ type: 7, index: n }), p += b.length - 1;
      }
      n++;
    }
  }
  static createElement(t, e) {
    const i = w.createElement("template");
    return i.innerHTML = t, i;
  }
}
function E(s, t, e = s, i) {
  if (t === k) return t;
  let r = i !== void 0 ? e._$Co?.[i] : e._$Cl;
  const n = P(t) ? void 0 : t._$litDirective$;
  return r?.constructor !== n && (r?._$AO?.(!1), n === void 0 ? r = void 0 : (r = new n(s), r._$AT(s, e, i)), i !== void 0 ? (e._$Co ??= [])[i] = r : e._$Cl = r), r !== void 0 && (t = E(s, r._$AS(s, t.values), r, i)), t;
}
class jt {
  constructor(t, e) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = e;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: e }, parts: i } = this._$AD, r = (t?.creationScope ?? w).importNode(e, !0);
    v.currentNode = r;
    let n = v.nextNode(), a = 0, l = 0, o = i[0];
    for (; o !== void 0; ) {
      if (a === o.index) {
        let u;
        o.type === 2 ? u = new T(n, n.nextSibling, this, t) : o.type === 1 ? u = new o.ctor(n, o.name, o.strings, this, t) : o.type === 6 && (u = new Tt(n, this, t)), this._$AV.push(u), o = i[++l];
      }
      a !== o?.index && (n = v.nextNode(), a++);
    }
    return v.currentNode = w, r;
  }
  p(t) {
    let e = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, e), e += i.strings.length - 2) : i._$AI(t[e])), e++;
  }
}
class T {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, e, i, r) {
    this.type = 2, this._$AH = h, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = i, this.options = r, this._$Cv = r?.isConnected ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const e = this._$AM;
    return e !== void 0 && t?.nodeType === 11 && (t = e.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, e = this) {
    t = E(this, t, e), P(t) ? t === h || t == null || t === "" ? (this._$AH !== h && this._$AR(), this._$AH = h) : t !== this._$AH && t !== k && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Et(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== h && P(this._$AH) ? this._$AA.nextSibling.data = t : this.T(w.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: e, _$litType$: i } = t, r = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = O.createElement(ut(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === r) this._$AH.p(e);
    else {
      const n = new jt(r, this), a = n.u(this.options);
      n.p(e), this.T(a), this._$AH = n;
    }
  }
  _$AC(t) {
    let e = nt.get(t.strings);
    return e === void 0 && nt.set(t.strings, e = new O(t)), e;
  }
  k(t) {
    q(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let i, r = 0;
    for (const n of t) r === e.length ? e.push(i = new T(this.O(C()), this.O(C()), this, this.options)) : i = e[r], i._$AI(n), r++;
    r < e.length && (this._$AR(i && i._$AB.nextSibling, r), e.length = r);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    for (this._$AP?.(!1, !0, e); t !== this._$AB; ) {
      const i = Y(t).nextSibling;
      Y(t).remove(), t = i;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}
class D {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, i, r, n) {
    this.type = 1, this._$AH = h, this._$AN = void 0, this.element = t, this.name = e, this._$AM = r, this.options = n, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = h;
  }
  _$AI(t, e = this, i, r) {
    const n = this.strings;
    let a = !1;
    if (n === void 0) t = E(this, t, e, 0), a = !P(t) || t !== this._$AH && t !== k, a && (this._$AH = t);
    else {
      const l = t;
      let o, u;
      for (t = n[0], o = 0; o < n.length - 1; o++) u = E(this, l[i + o], e, o), u === k && (u = this._$AH[o]), a ||= !P(u) || u !== this._$AH[o], u === h ? t = h : t !== h && (t += (u ?? "") + n[o + 1]), this._$AH[o] = u;
    }
    a && !r && this.j(t);
  }
  j(t) {
    t === h ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Ct extends D {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === h ? void 0 : t;
  }
}
class Pt extends D {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== h);
  }
}
class Ot extends D {
  constructor(t, e, i, r, n) {
    super(t, e, i, r, n), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = E(this, t, e, 0) ?? h) === k) return;
    const i = this._$AH, r = t === h && i !== h || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, n = t !== h && (i === h || r);
    r && this.element.removeEventListener(this.name, this, i), n && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Tt {
  constructor(t, e, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    E(this, t);
  }
}
const Ht = F.litHtmlPolyfillSupport;
Ht?.(O, T), (F.litHtmlVersions ??= []).push("3.3.3");
const Ut = (s, t, e) => {
  const i = e?.renderBefore ?? t;
  let r = i._$litPart$;
  if (r === void 0) {
    const n = e?.renderBefore ?? null;
    i._$litPart$ = r = new T(t.insertBefore(C(), n), n, void 0, e ?? {});
  }
  return r._$AI(s), r;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const K = globalThis;
class j extends S {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Ut(e, this.renderRoot, this.renderOptions);
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
j._$litElement$ = !0, j.finalized = !0, K.litElementHydrateSupport?.({ LitElement: j });
const Mt = K.litElementPolyfillSupport;
Mt?.({ LitElement: j });
(K.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Nt = (s) => (t, e) => {
  e !== void 0 ? e.addInitializer(() => {
    customElements.define(s, t);
  }) : customElements.define(s, t);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Rt = { attribute: !0, type: String, converter: N, reflect: !1, hasChanged: W }, It = (s = Rt, t, e) => {
  const { kind: i, metadata: r } = e;
  let n = globalThis.litPropertyMetadata.get(r);
  if (n === void 0 && globalThis.litPropertyMetadata.set(r, n = /* @__PURE__ */ new Map()), i === "setter" && ((s = Object.create(s)).wrapped = !0), n.set(e.name, s), i === "accessor") {
    const { name: a } = e;
    return { set(l) {
      const o = t.get.call(this);
      t.set.call(this, l), this.requestUpdate(a, o, s, !0, l);
    }, init(l) {
      return l !== void 0 && this.C(a, void 0, s, l), l;
    } };
  }
  if (i === "setter") {
    const { name: a } = e;
    return function(l) {
      const o = this[a];
      t.call(this, l), this.requestUpdate(a, o, s, !0, l);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function H(s) {
  return (t, e) => typeof e == "object" ? It(s, t, e) : ((i, r, n) => {
    const a = r.hasOwnProperty(n);
    return r.constructor.createProperty(n, i), a ? Object.getOwnPropertyDescriptor(r, n) : void 0;
  })(s, t, e);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function y(s) {
  return H({ ...s, state: !0, attribute: !1 });
}
const B = "unavailable", Dt = "unknown", Lt = "off", Bt = /* @__PURE__ */ new Set([
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
]), Gt = /* @__PURE__ */ new Set([
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
]), dt = (s) => s.substring(0, s.indexOf(".")), Vt = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_+|_+$)/g, "") || "_", Wt = (s) => s.reduceRight(
  (t, e) => `var(${e}${t ? `, ${t}` : ""})`,
  void 0
);
function Ft(s, t) {
  const e = dt(s.entity_id), i = s.state;
  if (Gt.has(e))
    return i !== B;
  if (i === B || i === Dt || i === Lt && e !== "alert")
    return !1;
  switch (e) {
    case "alarm_control_panel":
      return i !== "disarmed";
    case "alert":
      return i !== "idle";
    case "cover":
      return i !== "closed";
    case "device_tracker":
    case "person":
      return i !== "not_home";
    case "lawn_mower":
      return !["docked", "paused"].includes(i);
    case "lock":
      return i !== "locked";
    case "media_player":
      return i !== "standby";
    case "vacuum":
      return !["idle", "docked", "paused"].includes(i);
    case "valve":
      return i !== "closed";
    case "plant":
      return i === "problem";
    case "group":
      return ["on", "home", "open", "locked", "problem"].includes(i);
    case "timer":
      return i === "active";
    case "camera":
      return i === "streaming";
    default:
      return !0;
  }
}
function qt(s, t, e, i) {
  const r = [], n = Vt(e), a = i ? "active" : "inactive";
  return t && r.push(`--state-${s}-${t}-${n}-color`), r.push(
    `--state-${s}-${n}-color`,
    `--state-${s}-${a}-color`,
    `--state-${a}-color`
  ), r;
}
function Kt(s, t) {
  const e = s.state;
  if (e === B)
    return "var(--state-unavailable-color)";
  const i = dt(s.entity_id);
  if (!Bt.has(i))
    return;
  const r = Ft(s);
  return Wt(
    qt(i, s.attributes.device_class, e, r)
  );
}
var Zt = Object.defineProperty, Jt = Object.getOwnPropertyDescriptor, m = (s, t, e, i) => {
  for (var r = i > 1 ? void 0 : i ? Jt(t, e) : t, n = s.length - 1, a; n >= 0; n--)
    (a = s[n]) && (r = (i ? a(t, e, r) : a(r)) || r);
  return i && r && Zt(t, e, r), r;
};
const at = "grenton_objects", Qt = "Analiza projektu Grenton", A = {
  error: "#db4437",
  warn: "#f9a825",
  missing: "#3d70b2",
  ok: "#43a047",
  muted: "#9e9e9e"
}, Xt = [
  { key: "push", label: "push" },
  { key: "polling", label: "polling" },
  { key: "brak", label: "brak" }
], Yt = [
  { key: "problem", label: "Problem" },
  { key: "ok", label: "OK" },
  { key: "missing", label: "Brak w HA" },
  { key: "unsupported", label: "Nieobsługiwany" }
], te = (s) => s.replace(/[^a-zA-Z0-9]+/g, "_");
function ot(s) {
  const t = s.flags;
  return t.includes("orphan") ? {
    label: "Błąd: brak w projekcie",
    sev: "error",
    cat: "problem",
    hint: "Encja HA wskazuje grenton_id, którego nie ma w projekcie OM. Obiekt usunięto/zmieniono w OM albo encja ma zły grenton_id — popraw jedno z nich."
  } : t.includes("push_wrong_object") ? {
    label: "Błąd: push ze złego obiektu",
    sev: "error",
    cat: "problem",
    hint: "Zdarzenie push aktualizuje tę encję stanem INNEGO obiektu Grentona niż jej grenton_id. Popraw źródło w zdarzeniu (OnChange) obiektu w OM."
  } : t.includes("push_bad_service") ? {
    label: "Błąd: zła akcja push",
    sev: "error",
    cat: "problem",
    hint: "Akcja push nie pasuje do typu encji. Użyj: light→set_state/set_brightness/set_rgb, switch/binary_sensor→set_state, cover→set_cover, sensor→set_value."
  } : t.includes("push_no_event") ? {
    label: "Błąd: push bez zdarzenia",
    sev: "error",
    cat: "problem",
    hint: "Encja jest w trybie push, ale w projekcie nie ma dla niej zdarzenia HA_Integration_Queue_Prepare. Dodaj zdarzenie OnChange w OM albo włącz polling."
  } : t.includes("poll_redundant") ? {
    label: "Uwaga: polling + push",
    sev: "warn",
    cat: "problem",
    hint: "Encja jest pollowana i jednocześnie ma zdarzenie push — podwójna aktualizacja. Wyłącz auto-update albo usuń zdarzenie push w OM."
  } : s.in_ha ? { label: "OK", sev: "ok", cat: "ok" } : s.is_unsupported ? {
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
function ee(s) {
  const t = new Uint8Array(s), e = 32768;
  let i = "";
  for (let r = 0; r < t.length; r += e)
    i += String.fromCharCode.apply(null, Array.from(t.subarray(r, r + e)));
  return btoa(i);
}
let _ = class extends j {
  constructor() {
    super(...arguments), this.narrow = !1, this._busy = !1, this._busyName = "", this._summaryOpen = !1, this._search = "", this._typeSel = /* @__PURE__ */ new Set(), this._updSel = /* @__PURE__ */ new Set(), this._statSel = /* @__PURE__ */ new Set(), this._entityIds = /* @__PURE__ */ new Set(), this._resetFilters = () => {
      this._typeSel = this._defaultTypeSel(), this._updSel = /* @__PURE__ */ new Set(), this._statSel = /* @__PURE__ */ new Set();
    }, this._pickFile = () => {
      this.renderRoot.querySelector('input[type="file"]')?.click();
    }, this._onFileInput = (s) => {
      const t = s.target, e = t.files?.[0];
      t.value = "", this._analyze(e);
    };
  }
  shouldUpdate(s) {
    if (s.size === 1 && s.has("hass")) {
      const t = s.get("hass");
      if (t && this._entityIds.size) {
        for (const e of this._entityIds)
          if (t.states[e] !== this.hass.states[e]) return !0;
      }
      return !1;
    }
    return !0;
  }
  firstUpdated() {
    const s = window;
    !customElements.get("ha-data-table") && s.loadCardHelpers && s.loadCardHelpers().then((t) => t?.createCardElement?.({ type: "entities", entities: [] })).catch(() => {
    });
  }
  get _tabs() {
    return [{ name: Qt, path: this.route?.prefix ?? `/${at}` }];
  }
  render() {
    return this._report ? this._reportView() : this._startView();
  }
  // ─── start view (upload) ────────────────────────────────────────────
  _startView() {
    const s = c`
      <div class="pad">
        <p class="intro">
          Wgraj plik projektu Object Managera (.omp). Zostanie porównany z aktualną
          konfiguracją Home Assistant — nic nie jest zmieniane.
        </p>
        ${this._uploadUI()}
        ${this._error ? c`<ha-alert alert-type="error" title="Błąd analizy" style="margin-top:16px">${this._error}</ha-alert>` : h}
      </div>
    `;
    return customElements.get("hass-tabs-subpage") ? c`<hass-tabs-subpage
        .hass=${this.hass}
        .narrow=${this.narrow}
        ?main-page=${!0}
        .route=${this.route ?? { prefix: "", path: "" }}
        .tabs=${this._tabs}
      >${s}</hass-tabs-subpage>` : s;
  }
  _uploadUI() {
    return customElements.get("ha-file-upload") ? c`<ha-file-upload
        .localize=${this.hass.localize}
        accept=".omp,.zip"
        .icon=${"mdi:folder-upload"}
        .label=${"Przeciągnij plik .omp lub kliknij, aby wybrać"}
        .supports=${"Plik projektu Object Managera (.omp / .zip)"}
        .uploading=${this._busy}
        @file-picked=${(s) => this._analyze(s.detail.files?.[0])}
      ></ha-file-upload>` : c`
      <ha-button raised @click=${this._pickFile}>Wybierz plik .omp</ha-button>
      <input type="file" accept=".omp,.zip" style="display:none" @change=${this._onFileInput} />
      ${this._busy ? c`<div style="margin-top:12px;color:var(--secondary-text-color)">Analizuję… (${this._busyName})</div>` : h}
    `;
  }
  // ─── report view (native subpage table) ─────────────────────────────
  _reportView() {
    const s = customElements.get("hass-tabs-subpage-data-table") ? this._subpage() : this._fallbackTable();
    return c`${s}${this._summaryDialog()}`;
  }
  _subpage() {
    return c`
      <hass-tabs-subpage-data-table
        .hass=${this.hass}
        .localizeFunc=${this.hass.localize}
        .narrow=${this.narrow}
        ?main-page=${!0}
        .route=${this.route ?? { prefix: "", path: "" }}
        .tabs=${this._tabs}
        .columns=${this._columns()}
        .data=${this._viewRows}
        .initialGroupColumn=${"clu"}
        .filter=${this._search}
        @search-changed=${(s) => this._search = s.detail.value}
        .searchLabel=${"Szukaj obiektów"}
        ?has-filters=${!0}
        .filters=${this._activeFilterCount()}
        @clear-filter=${this._resetFilters}
        .noDataText=${"Brak obiektów dla wybranych filtrów"}
      >
        <ha-icon-button slot="toolbar-icon" .label=${"Wgraj inny plik .omp"} @click=${this._pickFile}>
          <ha-icon icon="mdi:upload"></ha-icon>
        </ha-icon-button>
        <input type="file" accept=".omp,.zip" style="display:none" @change=${this._onFileInput} />
        <div slot="top-header">${this._statStrip()}</div>
        ${this._filterGroups()}
      </hass-tabs-subpage-data-table>
    `;
  }
  _fallbackTable() {
    return c`
      <div class="pad" style="max-width:none">
        ${this._statStrip()}
        <ha-data-table
          .hass=${this.hass}
          .columns=${this._columns()}
          .data=${this._viewRows}
          .filter=${this._search}
          .autoHeight=${!0}
        ></ha-data-table>
      </div>
    `;
  }
  _statStrip() {
    const s = this._report, t = s.summary, e = s.orphans.length + s.push_object_mismatch.length + s.push_service_mismatch.length + s.push_no_event.length + s.push_orphan_targets.length + s.poll_with_push.length, i = s.verdict === "ok";
    return c`
      <button class="stat-bar" @click=${() => this._summaryOpen = !0} title="Pokaż pełne podsumowanie">
        <span class="verdict ${i ? "ok" : "issues"}">
          <ha-icon icon=${i ? "mdi:check-circle" : "mdi:alert"}></ha-icon>
          ${i ? "Spójne z projektem" : `Rozbieżności — ${e} do sprawdzenia`}
        </span>
        <span class="nums">
          ${t.ha_total}/${t.om_total} obiektów w HA · ${t.push} push / ${t.polling} polling
        </span>
        <span class="more">Szczegóły →</span>
      </button>
    `;
  }
  _summaryDialog() {
    return this._summaryOpen ? c`
      <ha-dialog
        open
        hideActions
        .heading=${"Podsumowanie analizy"}
        @closed=${() => this._summaryOpen = !1}
      >
        ${this._summaryInner()}
      </ha-dialog>
    ` : h;
  }
  _summaryInner() {
    const s = this._report, t = s.summary, e = s.verdict === "ok", i = [
      { label: "encje HA bez obiektu w projekcie", count: s.orphans.length, sev: "error" },
      { label: "push aktualizujący zły obiekt Grentona", count: s.push_object_mismatch.length, sev: "error" },
      { label: "push z niewłaściwą akcją dla typu encji", count: s.push_service_mismatch.length, sev: "error" },
      { label: "encje push bez zdarzenia w Grentonie", count: s.push_no_event.length, sev: "error" },
      { label: "zdarzenia push w nieistniejącą encję", count: s.push_orphan_targets.length, sev: "error" },
      { label: "polling z jednoczesnym push (redundancja)", count: s.poll_with_push.length, sev: "warn" },
      { label: "obiekty Grentona nieobecne w HA", count: s.not_in_ha.length, sev: "missing" }
    ].filter((r) => r.count > 0);
    return c`
      <div class="summary">
        <ha-alert alert-type=${e ? "success" : "warning"}>
          ${e ? "Integracja spójna z projektem" : "Wykryto rozbieżności"}
        </ha-alert>

        <h4>Statystyki</h4>
        <dl class="stats">
          <dt>Obiekty projektu</dt><dd><b>${t.om_total}</b></dd>
          <dt>Encje w HA</dt><dd><b>${t.ha_total}</b></dd>
          <dt>Zdarzenia push (Grenton→HA)</dt><dd><b>${t.push_events}</b></dd>
          <dt>Tryb aktualizacji</dt><dd>${t.push} push · ${t.polling} polling</dd>
        </dl>

        <h4>Wg domeny</h4>
        <ul>
          ${Object.keys(t.per_domain).sort((r, n) => t.per_domain[n].push + t.per_domain[n].polling - (t.per_domain[r].push + t.per_domain[r].polling)).map((r) => c`<li>${r}: ${t.per_domain[r].push} push / ${t.per_domain[r].polling} polling</li>`)}
        </ul>

        <h4>Problemy${i.length ? "" : " — brak"}</h4>
        ${i.length ? c`<ul class="problems">
              ${i.map((r) => {
      const n = r.sev === "error" || r.sev === "warn" ? "active-error" : "";
      return c`<li class=${n} style=${`color:${A[r.sev]}`}>${r.count} ${r.label}</li>`;
    })}
            </ul>` : h}
        ${s.not_in_ha.length ? c`<div style="color:${A.missing};margin-top:4px">
              ${s.not_in_ha.length} obiektów Grentona nieobecnych w HA
              (${s.not_in_ha_by_type.map(([r, n]) => `${n}× ${r}`).join(", ")})
            </div>` : h}

        ${s.scaffolding ? this._scaffold(s.scaffolding) : h}
      </div>
    `;
  }
  _scaffold(s) {
    return c`
      <h4>Konfiguracja po stronie Grentona</h4>
      ${s.push_used ? h : c`<div style="color:var(--secondary-text-color);font-size:0.9em">Push nieużywany — obiekty kolejki nie są wymagane.</div>`}
      <ul>
        ${s.checks.map((t) => {
      let e = A.ok, i = "obecny";
      return t.present || (t.required ? (e = A.error, i = "BRAK (wymagane)") : (e = A.muted, i = "brak (opcjonalne)")), c`<li style=${`color:${e}`}>${t.name} — ${t.desc}: ${i}</li>`;
    })}
      </ul>
    `;
  }
  // ─── table data + columns ──────────────────────────────────────────────
  get _viewRows() {
    return (this._report?.merged ?? []).map((e, i) => {
      const r = ot(e), n = e.in_ha ? e.mode ?? "brak" : "brak", a = e.in_ha ? e.mode === "polling" ? `polling (${e.interval ?? "?"} s)` : "push" : "brak", l = e.clu || (e.grenton_id?.includes("->") ? e.grenton_id.split("->")[0] : "") || "—";
      return {
        id: e.grenton_id || e.entity_id || String(i),
        name: e.om_name || e.ha_name || "",
        grenton_id: e.grenton_id || "",
        clu: l,
        type: e.om_type || e.device_type || "—",
        entity_id: e.entity_id || "",
        entry_id: e.entry_id || "",
        domain: e.entity_id ? e.entity_id.split(".")[0] : "—",
        update: a,
        updateCat: n,
        status: r.label,
        sev: r.sev,
        statusCat: r.cat,
        hint: r.hint
      };
    }).filter((e) => !(this._typeSel.size && !this._typeSel.has(e.type) || this._updSel.size && !this._updSel.has(e.updateCat) || this._statSel.size && !this._statSel.has(e.statusCat)));
  }
  _columns() {
    return {
      name: { title: "Nazwa (Grenton)", main: !0, sortable: !0, filterable: !0, flex: 2 },
      grenton_id: { title: "Grenton ID", sortable: !0, filterable: !0, hideable: !0, width: "160px" },
      clu: { title: "CLU", sortable: !0, filterable: !0, groupable: !0, hideable: !0, defaultHidden: !0 },
      type: { title: "Typ Grenton", sortable: !0, filterable: !0, groupable: !0, hideable: !0, width: "140px" },
      entity_id: {
        title: "Encja HA",
        sortable: !0,
        filterable: !0,
        hideable: !0,
        width: "260px",
        template: (s, t) => this._entityCell(t ?? s)
      },
      domain: { title: "Domena HA", filterable: !0, groupable: !0, hideable: !0, defaultHidden: !0 },
      update: { title: "Aktualizacja", sortable: !0, filterable: !0, hideable: !0, width: "150px" },
      updateCat: { title: "Tryb aktualizacji", filterable: !0, groupable: !0, hideable: !0, defaultHidden: !0 },
      status: {
        title: "Status",
        sortable: !0,
        filterable: !0,
        groupable: !0,
        hideable: !0,
        width: "220px",
        template: (s, t) => this._statusCell(t ?? s)
      },
      actions: { title: "Akcje", width: "64px", template: (s, t) => this._actionsCell(t ?? s) }
    };
  }
  _entityCell(s) {
    if (!s.entity_id) return c`<span style="color:var(--secondary-text-color)">—</span>`;
    const t = this.hass?.states?.[s.entity_id], e = t ? Kt(t) ?? "var(--secondary-text-color)" : "var(--secondary-text-color)", i = t ? this._formatState(t) : "niedostępna";
    return c`
      <span class="entity" @click=${() => this._moreInfo(s.entity_id)}>
        ${t ? c`<ha-state-icon .stateObj=${t} style=${`color:${e}`}></ha-state-icon>` : h}
        <span>${s.entity_id}<span style="color:var(--secondary-text-color)"> · ${i}</span></span>
      </span>
    `;
  }
  _statusCell(s) {
    const t = c`<ha-label dense .color=${A[s.sev]}>${s.status}</ha-label>`;
    if (!s.hint) return t;
    const e = "st_" + te(s.id);
    return c`
      <span class="status-cell">
        <span id=${e}>${t}</span>
        <ha-tooltip .for=${e} placement="left">${s.hint}</ha-tooltip>
      </span>
    `;
  }
  _actionsCell(s) {
    return s.entry_id ? c`<ha-icon
      class="cog"
      icon="mdi:cog"
      title="Otwórz konfigurację obiektu w integracji"
      @click=${() => this._openConfig(s.entry_id)}
    ></ha-icon>` : h;
  }
  _formatState(s) {
    const t = s.attributes?.unit_of_measurement;
    return t ? `${s.state} ${t}` : s.state;
  }
  // ─── filter pane ───────────────────────────────────────────────────────
  _activeFilterCount() {
    return this._typeSel.size + this._updSel.size + this._statSel.size;
  }
  _filterGroups() {
    const s = this._report, t = (n) => {
      const a = {};
      for (const l of this._allViewRows()) a[l[n]] = (a[l[n]] || 0) + 1;
      return a;
    }, e = s.type_summary.map((n) => ({ key: n.type, label: `${n.type} (${n.count})${n.supported ? "" : " · nieobsł."}` })), i = t("updateCat"), r = t("statusCat");
    return c`
      ${this._filterGroup("Typ Grenton", e, this._typeSel, "type")}
      ${this._filterGroup("Aktualizacja", Xt.map((n) => ({ key: n.key, label: `${n.label} (${i[n.key] || 0})` })), this._updSel, "upd")}
      ${this._filterGroup("Status", Yt.map((n) => ({ key: n.key, label: `${n.label} (${r[n.key] || 0})` })), this._statSel, "stat")}
    `;
  }
  _allViewRows() {
    return (this._report?.merged ?? []).map((t) => {
      const e = ot(t);
      return {
        id: "",
        name: "",
        grenton_id: "",
        clu: "",
        type: t.om_type || t.device_type || "—",
        entity_id: "",
        entry_id: "",
        domain: "",
        update: "",
        updateCat: t.in_ha ? t.mode ?? "brak" : "brak",
        status: e.label,
        sev: e.sev,
        statusCat: e.cat
      };
    });
  }
  _filterGroup(s, t, e, i) {
    return c`
      <ha-expansion-panel slot="filter-pane" outlined .expanded=${e.size > 0}>
        <div slot="header" class="filter-header">
          <span>${s}</span>
          ${e.size ? c`<span class="badge">${e.size}</span>
                <ha-icon
                  class="filter-clear"
                  icon="mdi:filter-variant-remove"
                  @click=${(r) => {
      r.stopPropagation(), this._setSel(i, /* @__PURE__ */ new Set());
    }}
                ></ha-icon>` : h}
        </div>
        <ha-list multi @selected=${(r) => this._onListSelected(r, i, t)}>
          ${t.map(
      (r) => c`<ha-check-list-item .value=${r.key} .selected=${e.has(r.key)}>${r.label}</ha-check-list-item>`
    )}
        </ha-list>
      </ha-expansion-panel>
    `;
  }
  _onListSelected(s, t, e) {
    const i = s?.detail?.index, r = i instanceof Set ? Array.from(i) : typeof i == "number" ? [i] : [], n = /* @__PURE__ */ new Set();
    r.forEach((a) => {
      e[a] && n.add(e[a].key);
    }), this._setSel(t, n);
  }
  _setSel(s, t) {
    s === "type" ? this._typeSel = t : s === "upd" ? this._updSel = t : this._statSel = t;
  }
  _defaultTypeSel() {
    const s = this._report?.type_summary ?? [];
    return new Set(s.filter((t) => t.supported && t.type !== "DIN").map((t) => t.type));
  }
  async _analyze(s) {
    if (s) {
      this._error = void 0, this._busy = !0, this._busyName = s.name;
      try {
        const t = await s.arrayBuffer(), e = await this.hass.connection.sendMessagePromise({
          type: "grenton_objects/analyze",
          omp_base64: ee(t)
        });
        this._report = e, this._entityIds = new Set(e.merged.map((i) => i.entity_id).filter((i) => !!i)), this._typeSel = this._defaultTypeSel(), this._updSel = /* @__PURE__ */ new Set(), this._statSel = /* @__PURE__ */ new Set();
      } catch (t) {
        this._error = t?.message || t?.code || "Nie udało się odczytać pliku .omp.";
      } finally {
        this._busy = !1;
      }
    }
  }
  _moreInfo(s) {
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: s }, bubbles: !0, composed: !0 }));
  }
  _openConfig(s) {
    const t = `/config/integrations/integration/${at}#config_entry=${s}`;
    window.history.pushState(null, "", t), this.dispatchEvent(new CustomEvent("location-changed", { bubbles: !0, composed: !0 }));
  }
};
_.styles = mt`
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
    .status-cell { position: relative; display: inline-block; }
    .cog { cursor: pointer; color: var(--secondary-text-color); }
    ha-tooltip { --ha-tooltip-max-width: 340px; }
  `;
m([
  H({ attribute: !1 })
], _.prototype, "hass", 2);
m([
  H({ attribute: !1 })
], _.prototype, "narrow", 2);
m([
  H({ attribute: !1 })
], _.prototype, "route", 2);
m([
  H({ attribute: !1 })
], _.prototype, "panel", 2);
m([
  y()
], _.prototype, "_report", 2);
m([
  y()
], _.prototype, "_error", 2);
m([
  y()
], _.prototype, "_busy", 2);
m([
  y()
], _.prototype, "_busyName", 2);
m([
  y()
], _.prototype, "_summaryOpen", 2);
m([
  y()
], _.prototype, "_search", 2);
m([
  y()
], _.prototype, "_typeSel", 2);
m([
  y()
], _.prototype, "_updSel", 2);
m([
  y()
], _.prototype, "_statSel", 2);
_ = m([
  Nt("grenton-objects-panel")
], _);
export {
  _ as GrentonObjectsPanel
};
