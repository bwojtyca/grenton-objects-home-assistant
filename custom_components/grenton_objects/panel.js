/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const U = globalThis, B = U.ShadowRoot && (U.ShadyCSS === void 0 || U.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, V = Symbol(), J = /* @__PURE__ */ new WeakMap();
let le = class {
  constructor(e, t, i) {
    if (this._$cssResult$ = !0, i !== V) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (B && e === void 0) {
      const i = t !== void 0 && t.length === 1;
      i && (e = J.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && J.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const _e = (s) => new le(typeof s == "string" ? s : s + "", void 0, V), me = (s, ...e) => {
  const t = s.length === 1 ? s[0] : e.reduce((i, n, r) => i + ((a) => {
    if (a._$cssResult$ === !0) return a.cssText;
    if (typeof a == "number") return a;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + a + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(n) + s[r + 1], s[0]);
  return new le(t, s, V);
}, ye = (s, e) => {
  if (B) s.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const i = document.createElement("style"), n = U.litNonce;
    n !== void 0 && i.setAttribute("nonce", n), i.textContent = t.cssText, s.appendChild(i);
  }
}, Z = B ? (s) => s : (s) => s instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const i of e.cssRules) t += i.cssText;
  return _e(t);
})(s) : s;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: $e, defineProperty: be, getOwnPropertyDescriptor: ge, getOwnPropertyNames: fe, getOwnPropertySymbols: ve, getPrototypeOf: we } = Object, D = globalThis, Q = D.trustedTypes, ke = Q ? Q.emptyScript : "", Ae = D.reactiveElementPolyfillSupport, E = (s, e) => s, N = { toAttribute(s, e) {
  switch (e) {
    case Boolean:
      s = s ? ke : null;
      break;
    case Object:
    case Array:
      s = s == null ? s : JSON.stringify(s);
  }
  return s;
}, fromAttribute(s, e) {
  let t = s;
  switch (e) {
    case Boolean:
      t = s !== null;
      break;
    case Number:
      t = s === null ? null : Number(s);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(s);
      } catch {
        t = null;
      }
  }
  return t;
} }, W = (s, e) => !$e(s, e), X = { attribute: !0, type: String, converter: N, reflect: !1, useDefault: !1, hasChanged: W };
Symbol.metadata ??= Symbol("metadata"), D.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let A = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = X) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const i = Symbol(), n = this.getPropertyDescriptor(e, i, t);
      n !== void 0 && be(this.prototype, e, n);
    }
  }
  static getPropertyDescriptor(e, t, i) {
    const { get: n, set: r } = ge(this.prototype, e) ?? { get() {
      return this[t];
    }, set(a) {
      this[t] = a;
    } };
    return { get: n, set(a) {
      const l = n?.call(this);
      r?.call(this, a), this.requestUpdate(e, l, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? X;
  }
  static _$Ei() {
    if (this.hasOwnProperty(E("elementProperties"))) return;
    const e = we(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(E("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(E("properties"))) {
      const t = this.properties, i = [...fe(t), ...ve(t)];
      for (const n of i) this.createProperty(n, t[n]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [i, n] of t) this.elementProperties.set(i, n);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, i] of this.elementProperties) {
      const n = this._$Eu(t, i);
      n !== void 0 && this._$Eh.set(n, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const i = new Set(e.flat(1 / 0).reverse());
      for (const n of i) t.unshift(Z(n));
    } else e !== void 0 && t.push(Z(e));
    return t;
  }
  static _$Eu(e, t) {
    const i = t.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof e == "string" ? e.toLowerCase() : void 0;
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
    for (const i of t.keys()) this.hasOwnProperty(i) && (e.set(i, this[i]), delete this[i]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return ye(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((e) => e.hostDisconnected?.());
  }
  attributeChangedCallback(e, t, i) {
    this._$AK(e, i);
  }
  _$ET(e, t) {
    const i = this.constructor.elementProperties.get(e), n = this.constructor._$Eu(e, i);
    if (n !== void 0 && i.reflect === !0) {
      const r = (i.converter?.toAttribute !== void 0 ? i.converter : N).toAttribute(t, i.type);
      this._$Em = e, r == null ? this.removeAttribute(n) : this.setAttribute(n, r), this._$Em = null;
    }
  }
  _$AK(e, t) {
    const i = this.constructor, n = i._$Eh.get(e);
    if (n !== void 0 && this._$Em !== n) {
      const r = i.getPropertyOptions(n), a = typeof r.converter == "function" ? { fromAttribute: r.converter } : r.converter?.fromAttribute !== void 0 ? r.converter : N;
      this._$Em = n;
      const l = a.fromAttribute(t, r.type);
      this[n] = l ?? this._$Ej?.get(n) ?? l, this._$Em = null;
    }
  }
  requestUpdate(e, t, i, n = !1, r) {
    if (e !== void 0) {
      const a = this.constructor;
      if (n === !1 && (r = this[e]), i ??= a.getPropertyOptions(e), !((i.hasChanged ?? W)(r, t) || i.useDefault && i.reflect && r === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, i)))) return;
      this.C(e, t, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: i, reflect: n, wrapped: r }, a) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, a ?? t ?? this[e]), r !== !0 || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || i || (t = void 0), this._$AL.set(e, t)), n === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
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
        for (const [n, r] of this._$Ep) this[n] = r;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [n, r] of i) {
        const { wrapped: a } = r, l = this[n];
        a !== !0 || this._$AL.has(n) || l === void 0 || this.C(n, void 0, r, l);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((i) => i.hostUpdate?.()), this.update(t)) : this._$EM();
    } catch (i) {
      throw e = !1, this._$EM(), i;
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
A.elementStyles = [], A.shadowRootOptions = { mode: "open" }, A[E("elementProperties")] = /* @__PURE__ */ new Map(), A[E("finalized")] = /* @__PURE__ */ new Map(), Ae?.({ ReactiveElement: A }), (D.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const F = globalThis, Y = (s) => s, I = F.trustedTypes, ee = I ? I.createPolicy("lit-html", { createHTML: (s) => s }) : void 0, ce = "$lit$", g = `lit$${Math.random().toFixed(9).slice(2)}$`, he = "?" + g, Se = `<${he}>`, w = document, x = () => w.createComment(""), O = (s) => s === null || typeof s != "object" && typeof s != "function", K = Array.isArray, je = (s) => K(s) || typeof s?.[Symbol.iterator] == "function", G = `[ 	
\f\r]`, z = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, te = /-->/g, se = />/g, f = RegExp(`>|${G}(?:([^\\s"'>=/]+)(${G}*=${G}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), ie = /'/g, ne = /"/g, ue = /^(?:script|style|textarea|title)$/i, ze = (s) => (e, ...t) => ({ _$litType$: s, strings: e, values: t }), c = ze(1), S = Symbol.for("lit-noChange"), h = Symbol.for("lit-nothing"), re = /* @__PURE__ */ new WeakMap(), v = w.createTreeWalker(w, 129);
function pe(s, e) {
  if (!K(s) || !s.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ee !== void 0 ? ee.createHTML(e) : e;
}
const Ee = (s, e) => {
  const t = s.length - 1, i = [];
  let n, r = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", a = z;
  for (let l = 0; l < t; l++) {
    const o = s[l];
    let p, m, u = -1, $ = 0;
    for (; $ < o.length && (a.lastIndex = $, m = a.exec(o), m !== null); ) $ = a.lastIndex, a === z ? m[1] === "!--" ? a = te : m[1] !== void 0 ? a = se : m[2] !== void 0 ? (ue.test(m[2]) && (n = RegExp("</" + m[2], "g")), a = f) : m[3] !== void 0 && (a = f) : a === f ? m[0] === ">" ? (a = n ?? z, u = -1) : m[1] === void 0 ? u = -2 : (u = a.lastIndex - m[2].length, p = m[1], a = m[3] === void 0 ? f : m[3] === '"' ? ne : ie) : a === ne || a === ie ? a = f : a === te || a === se ? a = z : (a = f, n = void 0);
    const b = a === f && s[l + 1].startsWith("/>") ? " " : "";
    r += a === z ? o + Se : u >= 0 ? (i.push(p), o.slice(0, u) + ce + o.slice(u) + g + b) : o + g + (u === -2 ? l : b);
  }
  return [pe(s, r + (s[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class P {
  constructor({ strings: e, _$litType$: t }, i) {
    let n;
    this.parts = [];
    let r = 0, a = 0;
    const l = e.length - 1, o = this.parts, [p, m] = Ee(e, t);
    if (this.el = P.createElement(p, i), v.currentNode = this.el.content, t === 2 || t === 3) {
      const u = this.el.content.firstChild;
      u.replaceWith(...u.childNodes);
    }
    for (; (n = v.nextNode()) !== null && o.length < l; ) {
      if (n.nodeType === 1) {
        if (n.hasAttributes()) for (const u of n.getAttributeNames()) if (u.endsWith(ce)) {
          const $ = m[a++], b = n.getAttribute(u).split(g), T = /([.?@])?(.*)/.exec($);
          o.push({ type: 1, index: r, name: T[2], strings: b, ctor: T[1] === "." ? xe : T[1] === "?" ? Oe : T[1] === "@" ? Pe : R }), n.removeAttribute(u);
        } else u.startsWith(g) && (o.push({ type: 6, index: r }), n.removeAttribute(u));
        if (ue.test(n.tagName)) {
          const u = n.textContent.split(g), $ = u.length - 1;
          if ($ > 0) {
            n.textContent = I ? I.emptyScript : "";
            for (let b = 0; b < $; b++) n.append(u[b], x()), v.nextNode(), o.push({ type: 2, index: ++r });
            n.append(u[$], x());
          }
        }
      } else if (n.nodeType === 8) if (n.data === he) o.push({ type: 2, index: r });
      else {
        let u = -1;
        for (; (u = n.data.indexOf(g, u + 1)) !== -1; ) o.push({ type: 7, index: r }), u += g.length - 1;
      }
      r++;
    }
  }
  static createElement(e, t) {
    const i = w.createElement("template");
    return i.innerHTML = e, i;
  }
}
function j(s, e, t = s, i) {
  if (e === S) return e;
  let n = i !== void 0 ? t._$Co?.[i] : t._$Cl;
  const r = O(e) ? void 0 : e._$litDirective$;
  return n?.constructor !== r && (n?._$AO?.(!1), r === void 0 ? n = void 0 : (n = new r(s), n._$AT(s, t, i)), i !== void 0 ? (t._$Co ??= [])[i] = n : t._$Cl = n), n !== void 0 && (e = j(s, n._$AS(s, e.values), n, i)), e;
}
class Ce {
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
    const { el: { content: t }, parts: i } = this._$AD, n = (e?.creationScope ?? w).importNode(t, !0);
    v.currentNode = n;
    let r = v.nextNode(), a = 0, l = 0, o = i[0];
    for (; o !== void 0; ) {
      if (a === o.index) {
        let p;
        o.type === 2 ? p = new H(r, r.nextSibling, this, e) : o.type === 1 ? p = new o.ctor(r, o.name, o.strings, this, e) : o.type === 6 && (p = new He(r, this, e)), this._$AV.push(p), o = i[++l];
      }
      a !== o?.index && (r = v.nextNode(), a++);
    }
    return v.currentNode = w, n;
  }
  p(e) {
    let t = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, t), t += i.strings.length - 2) : i._$AI(e[t])), t++;
  }
}
class H {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, t, i, n) {
    this.type = 2, this._$AH = h, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = i, this.options = n, this._$Cv = n?.isConnected ?? !0;
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
    e = j(this, e, t), O(e) ? e === h || e == null || e === "" ? (this._$AH !== h && this._$AR(), this._$AH = h) : e !== this._$AH && e !== S && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : je(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== h && O(this._$AH) ? this._$AA.nextSibling.data = e : this.T(w.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: t, _$litType$: i } = e, n = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = P.createElement(pe(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === n) this._$AH.p(t);
    else {
      const r = new Ce(n, this), a = r.u(this.options);
      r.p(t), this.T(a), this._$AH = r;
    }
  }
  _$AC(e) {
    let t = re.get(e.strings);
    return t === void 0 && re.set(e.strings, t = new P(e)), t;
  }
  k(e) {
    K(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let i, n = 0;
    for (const r of e) n === t.length ? t.push(i = new H(this.O(x()), this.O(x()), this, this.options)) : i = t[n], i._$AI(r), n++;
    n < t.length && (this._$AR(i && i._$AB.nextSibling, n), t.length = n);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    for (this._$AP?.(!1, !0, t); e !== this._$AB; ) {
      const i = Y(e).nextSibling;
      Y(e).remove(), e = i;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class R {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, i, n, r) {
    this.type = 1, this._$AH = h, this._$AN = void 0, this.element = e, this.name = t, this._$AM = n, this.options = r, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = h;
  }
  _$AI(e, t = this, i, n) {
    const r = this.strings;
    let a = !1;
    if (r === void 0) e = j(this, e, t, 0), a = !O(e) || e !== this._$AH && e !== S, a && (this._$AH = e);
    else {
      const l = e;
      let o, p;
      for (e = r[0], o = 0; o < r.length - 1; o++) p = j(this, l[i + o], t, o), p === S && (p = this._$AH[o]), a ||= !O(p) || p !== this._$AH[o], p === h ? e = h : e !== h && (e += (p ?? "") + r[o + 1]), this._$AH[o] = p;
    }
    a && !n && this.j(e);
  }
  j(e) {
    e === h ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class xe extends R {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === h ? void 0 : e;
  }
}
class Oe extends R {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== h);
  }
}
class Pe extends R {
  constructor(e, t, i, n, r) {
    super(e, t, i, n, r), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = j(this, e, t, 0) ?? h) === S) return;
    const i = this._$AH, n = e === h && i !== h || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, r = e !== h && (i === h || n);
    n && this.element.removeEventListener(this.name, this, i), r && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class He {
  constructor(e, t, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    j(this, e);
  }
}
const Me = F.litHtmlPolyfillSupport;
Me?.(P, H), (F.litHtmlVersions ??= []).push("3.3.3");
const Te = (s, e, t) => {
  const i = t?.renderBefore ?? e;
  let n = i._$litPart$;
  if (n === void 0) {
    const r = t?.renderBefore ?? null;
    i._$litPart$ = n = new H(e.insertBefore(x(), r), r, void 0, t ?? {});
  }
  return n._$AI(s), n;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const q = globalThis;
class C extends A {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Te(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return S;
  }
}
C._$litElement$ = !0, C.finalized = !0, q.litElementHydrateSupport?.({ LitElement: C });
const Ue = q.litElementPolyfillSupport;
Ue?.({ LitElement: C });
(q.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ne = (s) => (e, t) => {
  t !== void 0 ? t.addInitializer(() => {
    customElements.define(s, e);
  }) : customElements.define(s, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ie = { attribute: !0, type: String, converter: N, reflect: !1, hasChanged: W }, De = (s = Ie, e, t) => {
  const { kind: i, metadata: n } = t;
  let r = globalThis.litPropertyMetadata.get(n);
  if (r === void 0 && globalThis.litPropertyMetadata.set(n, r = /* @__PURE__ */ new Map()), i === "setter" && ((s = Object.create(s)).wrapped = !0), r.set(t.name, s), i === "accessor") {
    const { name: a } = t;
    return { set(l) {
      const o = e.get.call(this);
      e.set.call(this, l), this.requestUpdate(a, o, s, !0, l);
    }, init(l) {
      return l !== void 0 && this.C(a, void 0, s, l), l;
    } };
  }
  if (i === "setter") {
    const { name: a } = t;
    return function(l) {
      const o = this[a];
      e.call(this, l), this.requestUpdate(a, o, s, !0, l);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function M(s) {
  return (e, t) => typeof t == "object" ? De(s, e, t) : ((i, n, r) => {
    const a = n.hasOwnProperty(r);
    return n.constructor.createProperty(r, i), a ? Object.getOwnPropertyDescriptor(n, r) : void 0;
  })(s, e, t);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function y(s) {
  return M({ ...s, state: !0, attribute: !1 });
}
const L = "unavailable", Re = "unknown", Ge = "off", Le = /* @__PURE__ */ new Set([
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
]), Be = /* @__PURE__ */ new Set([
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
]), de = (s) => s.substring(0, s.indexOf(".")), Ve = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_+|_+$)/g, "") || "_", We = (s) => s.reduceRight(
  (e, t) => `var(${t}${e ? `, ${e}` : ""})`,
  void 0
);
function Fe(s, e) {
  const t = de(s.entity_id), i = s.state;
  if (Be.has(t))
    return i !== L;
  if (i === L || i === Re || i === Ge && t !== "alert")
    return !1;
  switch (t) {
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
function Ke(s, e, t, i) {
  const n = [], r = Ve(t), a = i ? "active" : "inactive";
  return e && n.push(`--state-${s}-${e}-${r}-color`), n.push(
    `--state-${s}-${r}-color`,
    `--state-${s}-${a}-color`,
    `--state-${a}-color`
  ), n;
}
function qe(s, e) {
  const t = s.state;
  if (t === L)
    return "var(--state-unavailable-color)";
  const i = de(s.entity_id);
  if (!Le.has(i))
    return;
  const n = Fe(s);
  return We(
    Ke(i, s.attributes.device_class, t, n)
  );
}
var Je = Object.defineProperty, Ze = Object.getOwnPropertyDescriptor, _ = (s, e, t, i) => {
  for (var n = i > 1 ? void 0 : i ? Ze(e, t) : e, r = s.length - 1, a; r >= 0; r--)
    (a = s[r]) && (n = (i ? a(e, t, n) : a(n)) || n);
  return i && n && Je(e, t, n), n;
};
const ae = "grenton_objects", Qe = "Analiza projektu Grenton", k = {
  error: "#db4437",
  warn: "#f9a825",
  missing: "#3d70b2",
  ok: "#43a047",
  muted: "#9e9e9e"
}, Xe = [
  { key: "push", label: "push" },
  { key: "polling", label: "polling" },
  { key: "brak", label: "brak" }
], Ye = [
  { key: "problem", label: "Problem" },
  { key: "ok", label: "OK" },
  { key: "missing", label: "Brak w HA" },
  { key: "unsupported", label: "Nieobsługiwany" }
];
function oe(s) {
  const e = s.flags;
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
const et = ["orphan", "push_wrong_object", "push_bad_service", "push_no_event", "poll_redundant", "not_in_ha"], tt = {
  light: "set_state / set_brightness / set_rgb / set_rgbw",
  switch: "set_state",
  binary_sensor: "set_state",
  cover: "set_cover",
  sensor: "set_value",
  climate: "set_therm_state / set_therm_target_temp"
};
function st(s) {
  const e = new Uint8Array(s), t = 32768;
  let i = "";
  for (let n = 0; n < e.length; n += t)
    i += String.fromCharCode.apply(null, Array.from(e.subarray(n, n + t)));
  return btoa(i);
}
let d = class extends C {
  constructor() {
    super(...arguments), this.narrow = !1, this._busy = !1, this._busyName = "", this._summaryOpen = !1, this._search = "", this._typeSel = /* @__PURE__ */ new Set(), this._updSel = /* @__PURE__ */ new Set(), this._statSel = /* @__PURE__ */ new Set(), this._entityIds = /* @__PURE__ */ new Set(), this._onColumnsChanged = (s) => {
      let e = s.detail?.columnOrder ? [...s.detail.columnOrder] : void 0;
      e && (e = e.filter((i) => i !== "actions"), e.push("actions")), this._columnOrder = e;
      const t = s.detail?.hiddenColumns;
      this._hiddenColumns = t && t.filter((i) => i !== "actions");
    }, this._resetFilters = () => {
      this._typeSel = this._defaultTypeSel(), this._updSel = /* @__PURE__ */ new Set(), this._statSel = /* @__PURE__ */ new Set();
    }, this._pickFile = () => {
      this.renderRoot.querySelector('input[type="file"]')?.click();
    }, this._onFileInput = (s) => {
      const e = s.target, t = e.files?.[0];
      e.value = "", this._analyze(t);
    };
  }
  shouldUpdate(s) {
    if (s.size === 1 && s.has("hass")) {
      const e = s.get("hass");
      if (e && this._entityIds.size) {
        for (const t of this._entityIds)
          if (e.states[t] !== this.hass.states[t]) return !0;
      }
      return !1;
    }
    return !0;
  }
  firstUpdated() {
    const s = window;
    !customElements.get("ha-data-table") && s.loadCardHelpers && s.loadCardHelpers().then((e) => e?.createCardElement?.({ type: "entities", entities: [] })).catch(() => {
    });
  }
  get _tabs() {
    return [{ name: Qe, path: this.route?.prefix ?? `/${ae}` }];
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
    return c`${s}${this._summaryDialog()}${this._issueDialog()}`;
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
        .columnOrder=${this._columnOrder}
        .hiddenColumns=${this._hiddenColumns}
        @columns-changed=${this._onColumnsChanged}
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
    const s = this._report, e = s.summary, t = s.orphans.length + s.push_object_mismatch.length + s.push_service_mismatch.length + s.push_no_event.length + s.push_orphan_targets.length + s.poll_with_push.length, i = s.verdict === "ok";
    return c`
      <button class="stat-bar" @click=${() => this._summaryOpen = !0} title="Pokaż pełne podsumowanie">
        <span class="verdict ${i ? "ok" : "issues"}">
          <ha-icon icon=${i ? "mdi:check-circle" : "mdi:alert"}></ha-icon>
          ${i ? "Spójne z projektem" : `Rozbieżności — ${t} do sprawdzenia`}
        </span>
        <span class="nums">
          ${e.ha_total}/${e.om_total} obiektów w HA · ${e.push} push / ${e.polling} polling
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
    const s = this._report, e = s.summary, t = s.verdict === "ok", i = [
      { label: "encje HA bez obiektu w projekcie", count: s.orphans.length, sev: "error" },
      { label: "push aktualizujący zły obiekt Grentona", count: s.push_object_mismatch.length, sev: "error" },
      { label: "push z niewłaściwą akcją dla typu encji", count: s.push_service_mismatch.length, sev: "error" },
      { label: "encje push bez zdarzenia w Grentonie", count: s.push_no_event.length, sev: "error" },
      { label: "zdarzenia push w nieistniejącą encję", count: s.push_orphan_targets.length, sev: "error" },
      { label: "polling z jednoczesnym push (redundancja)", count: s.poll_with_push.length, sev: "warn" },
      { label: "obiekty Grentona nieobecne w HA", count: s.not_in_ha.length, sev: "missing" }
    ].filter((n) => n.count > 0);
    return c`
      <div class="summary">
        <ha-alert alert-type=${t ? "success" : "warning"}>
          ${t ? "Integracja spójna z projektem" : "Wykryto rozbieżności"}
        </ha-alert>

        <h4>Statystyki</h4>
        <dl class="stats">
          <dt>Obiekty projektu</dt><dd><b>${e.om_total}</b></dd>
          <dt>Encje w HA</dt><dd><b>${e.ha_total}</b></dd>
          <dt>Zdarzenia push (Grenton→HA)</dt><dd><b>${e.push_events}</b></dd>
          <dt>Tryb aktualizacji</dt><dd>${e.push} push · ${e.polling} polling</dd>
        </dl>

        <h4>Wg domeny</h4>
        <ul>
          ${Object.keys(e.per_domain).sort((n, r) => e.per_domain[r].push + e.per_domain[r].polling - (e.per_domain[n].push + e.per_domain[n].polling)).map((n) => c`<li>${n}: ${e.per_domain[n].push} push / ${e.per_domain[n].polling} polling</li>`)}
        </ul>

        <h4>Problemy${i.length ? "" : " — brak"}</h4>
        ${i.length ? c`<ul class="problems">
              ${i.map((n) => {
      const r = n.sev === "error" || n.sev === "warn" ? "active-error" : "";
      return c`<li class=${r} style=${`color:${k[n.sev]}`}>${n.count} ${n.label}</li>`;
    })}
            </ul>` : h}
        ${s.not_in_ha.length ? c`<div style="color:${k.missing};margin-top:4px">
              ${s.not_in_ha.length} obiektów Grentona nieobecnych w HA
              (${s.not_in_ha_by_type.map(([n, r]) => `${r}× ${n}`).join(", ")})
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
        ${s.checks.map((e) => {
      let t = k.ok, i = "obecny";
      return e.present || (e.required ? (t = k.error, i = "BRAK (wymagane)") : (t = k.muted, i = "brak (opcjonalne)")), c`<li style=${`color:${t}`}>${e.name} — ${e.desc}: ${i}</li>`;
    })}
      </ul>
    `;
  }
  // ─── table data + columns ──────────────────────────────────────────────
  get _viewRows() {
    return (this._report?.merged ?? []).map((t, i) => {
      const n = oe(t), r = t.in_ha ? t.mode ?? "brak" : "brak", a = t.in_ha ? t.mode === "polling" ? `polling (${t.interval ?? "?"} s)` : "push" : "brak", l = t.clu || (t.grenton_id?.includes("->") ? t.grenton_id.split("->")[0] : "") || "—", o = t.flags.find((p) => et.includes(p)) ?? (t.is_unsupported ? "unsupported" : t.in_ha ? "ok" : "not_in_ha");
      return {
        id: t.grenton_id || t.entity_id || String(i),
        name: t.om_name || t.ha_name || "",
        grenton_id: t.grenton_id || "",
        clu: l,
        type: t.om_type || t.device_type || "—",
        entity_id: t.entity_id || "",
        entry_id: t.entry_id || "",
        domain: t.entity_id ? t.entity_id.split(".")[0] : "—",
        update: a,
        updateCat: r,
        status: n.label,
        sev: n.sev,
        statusCat: n.cat,
        flag: o
      };
    }).filter((t) => !(this._typeSel.size && !this._typeSel.has(t.type) || this._updSel.size && !this._updSel.has(t.updateCat) || this._statSel.size && !this._statSel.has(t.statusCat)));
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
        template: (s, e) => this._entityCell(e ?? s)
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
        template: (s, e) => this._statusCell(e ?? s)
      },
      actions: {
        title: "Akcje",
        width: "64px",
        moveable: !1,
        hideable: !1,
        template: (s, e) => this._actionsCell(e ?? s)
      }
    };
  }
  _entityCell(s) {
    if (!s.entity_id) return c`<span style="color:var(--secondary-text-color)">—</span>`;
    const e = this.hass?.states?.[s.entity_id], t = e ? qe(e) ?? "var(--secondary-text-color)" : "var(--secondary-text-color)", i = e ? this._formatState(e) : "niedostępna";
    return c`
      <span class="entity" @click=${() => this._moreInfo(s.entity_id)}>
        ${e ? c`<ha-state-icon .stateObj=${e} style=${`color:${t}`}></ha-state-icon>` : h}
        <span>${s.entity_id}<span style="color:var(--secondary-text-color)"> · ${i}</span></span>
      </span>
    `;
  }
  _statusCell(s) {
    const e = c`<ha-label dense .color=${k[s.sev]}>${s.status}</ha-label>`;
    return s.flag === "ok" ? e : c`<span
      class="status-cell"
      title="Kliknij po szczegóły i wskazówki"
      @click=${() => this._issue = s}
    >${e}</span>`;
  }
  // Context-tailored explanation for a row's status.
  _issueDetails(s) {
    const e = s.domain && s.domain !== "—" ? s.domain : s.type;
    switch (s.flag) {
      case "orphan":
        return { sections: [
          { h: "Co jest nie tak", body: `Encja ${s.entity_id} wskazuje grenton_id „${s.grenton_id}", którego nie ma w tym projekcie OM.` },
          { h: "Prawdopodobna przyczyna", body: "Obiekt został usunięty lub dostał nowy identyfikator w Object Managerze, albo encja w HA ma literówkę w grenton_id." },
          { h: "Jak poprawić", body: "Sprawdź obiekt w OM i popraw grenton_id encji (ikona koła zębatego → Konfiguruj), albo usuń nieaktualną encję." }
        ] };
      case "push_wrong_object":
        return { sections: [
          { h: "Co jest nie tak", body: `Zdarzenie push aktualizuje tę encję (${s.grenton_id}) stanem INNEGO obiektu Grentona.` },
          { h: "Czego oczekiwano", body: "Źródło w zdarzeniu powinno wskazywać ten sam obiekt, na który wskazuje encja." },
          { h: "Jak poprawić", body: "W OM otwórz zdarzenie OnChange obiektu i popraw drugi argument HA_Integration_Queue_Prepare (źródło stanu) na właściwy obiekt." }
        ] };
      case "push_bad_service":
        return { sections: [
          { h: "Co jest nie tak", body: `Push tej encji używa akcji, która nie pasuje do jej typu (${e}).` },
          { h: "Czego oczekiwano", body: `Dla typu „${e}" akcja powinna być: ${tt[e] || "właściwa dla typu encji"}.` },
          { h: "Jak poprawić", body: "W OM zmień akcję w wywołaniu HA_Integration_Queue_Prepare (w zdarzeniu OnChange obiektu) na właściwą." }
        ] };
      case "push_no_event":
        return { sections: [
          { h: "Co jest nie tak", body: "Encja jest w trybie push, ale w projekcie nie ma dla niej żadnego zdarzenia push (HA_Integration_Queue_Prepare)." },
          { h: "Jak poprawić", body: "Dodaj w OM zdarzenie OnChange z wywołaniem HA_Integration_Queue_Prepare dla tej encji, albo w HA włącz automatyczne odświeżanie (polling)." }
        ] };
      case "poll_redundant":
        return { sections: [
          { h: "Co jest nie tak", body: "Encja jest odpytywana (polling) i JEDNOCZEŚNIE ma zdarzenie push — aktualizuje się dwoma drogami." },
          { h: "Jak poprawić", body: "Wyłącz automatyczne odświeżanie (auto-update) dla tej encji — wystarczy push. Ewentualnie usuń zdarzenie push w OM." }
        ] };
      case "unsupported":
        return { sections: [
          { h: "Co jest nie tak", body: `Integracja nie potrafi wystawić obiektu typu „${s.type}" jako encji HA (np. DALI_MASTER, kontener Satel).` },
          { h: "Co zrobić", body: "Nic — ten obiekt po prostu nie ma odpowiednika w HA." }
        ] };
      default:
        return { sections: [
          { h: "Co jest nie tak", body: `Obiekt „${s.grenton_id}" (${s.type}) istnieje w projekcie Grentona, ale nie jest dodany do HA.` },
          { h: "Jak dodać", body: "Jeśli chcesz nim sterować/monitorować, dodaj go w integracji (Ustawienia → Urządzenia i usługi → Grenton Objects → Dodaj)." }
        ] };
    }
  }
  _issueDialog() {
    const s = this._issue;
    if (!s) return h;
    const e = this._issueDetails(s);
    return c`
      <ha-dialog open .heading=${s.status} @closed=${() => this._issue = void 0}>
        <div class="issue">
          ${e.sections.map((t) => c`<div class="issue-sec"><div class="issue-h">${t.h}</div><div>${t.body}</div></div>`)}
        </div>
        ${s.entry_id ? c`<ha-button slot="secondaryAction" @click=${() => {
      this._issue = void 0, this._openConfig(s.entry_id);
    }}>
              Konfiguruj encję
            </ha-button>` : h}
        <ha-button slot="primaryAction" dialogAction="close">Zamknij</ha-button>
      </ha-dialog>
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
    const e = s.attributes?.unit_of_measurement;
    return e ? `${s.state} ${e}` : s.state;
  }
  // ─── filter pane ───────────────────────────────────────────────────────
  _activeFilterCount() {
    return this._typeSel.size + this._updSel.size + this._statSel.size;
  }
  _filterGroups() {
    const s = this._report, e = (r) => {
      const a = {};
      for (const l of this._allViewRows()) a[l[r]] = (a[l[r]] || 0) + 1;
      return a;
    }, t = s.type_summary.map((r) => ({ key: r.type, label: `${r.type} (${r.count})${r.supported ? "" : " · nieobsł."}` })), i = e("updateCat"), n = e("statusCat");
    return c`
      ${this._filterGroup("Typ Grenton", t, this._typeSel, "type")}
      ${this._filterGroup("Aktualizacja", Xe.map((r) => ({ key: r.key, label: `${r.label} (${i[r.key] || 0})` })), this._updSel, "upd")}
      ${this._filterGroup("Status", Ye.map((r) => ({ key: r.key, label: `${r.label} (${n[r.key] || 0})` })), this._statSel, "stat")}
    `;
  }
  _allViewRows() {
    return (this._report?.merged ?? []).map((e) => {
      const t = oe(e);
      return {
        id: "",
        name: "",
        grenton_id: "",
        clu: "",
        type: e.om_type || e.device_type || "—",
        entity_id: "",
        entry_id: "",
        domain: "",
        update: "",
        updateCat: e.in_ha ? e.mode ?? "brak" : "brak",
        status: t.label,
        sev: t.sev,
        statusCat: t.cat,
        flag: ""
      };
    });
  }
  _filterGroup(s, e, t, i) {
    return c`
      <ha-expansion-panel slot="filter-pane" outlined .expanded=${t.size > 0}>
        <div slot="header" class="filter-header">
          <span>${s}</span>
          ${t.size ? c`<span class="badge">${t.size}</span>
                <ha-icon
                  class="filter-clear"
                  icon="mdi:filter-variant-remove"
                  @click=${(n) => {
      n.stopPropagation(), this._setSel(i, /* @__PURE__ */ new Set());
    }}
                ></ha-icon>` : h}
        </div>
        <ha-list multi @selected=${(n) => this._onListSelected(n, i, e)}>
          ${e.map(
      (n) => c`<ha-check-list-item .value=${n.key} .selected=${t.has(n.key)}>${n.label}</ha-check-list-item>`
    )}
        </ha-list>
      </ha-expansion-panel>
    `;
  }
  _onListSelected(s, e, t) {
    const i = s?.detail?.index, n = i instanceof Set ? Array.from(i) : typeof i == "number" ? [i] : [], r = /* @__PURE__ */ new Set();
    n.forEach((a) => {
      t[a] && r.add(t[a].key);
    }), this._setSel(e, r);
  }
  _setSel(s, e) {
    s === "type" ? this._typeSel = e : s === "upd" ? this._updSel = e : this._statSel = e;
  }
  _defaultTypeSel() {
    const s = this._report?.type_summary ?? [];
    return new Set(s.filter((e) => e.supported && e.type !== "DIN").map((e) => e.type));
  }
  async _analyze(s) {
    if (s) {
      this._error = void 0, this._busy = !0, this._busyName = s.name;
      try {
        const e = await s.arrayBuffer(), t = await this.hass.connection.sendMessagePromise({
          type: "grenton_objects/analyze",
          omp_base64: st(e)
        });
        this._report = t, this._entityIds = new Set(t.merged.map((i) => i.entity_id).filter((i) => !!i)), this._typeSel = this._defaultTypeSel(), this._updSel = /* @__PURE__ */ new Set(), this._statSel = /* @__PURE__ */ new Set();
      } catch (e) {
        this._error = e?.message || e?.code || "Nie udało się odczytać pliku .omp.";
      } finally {
        this._busy = !1;
      }
    }
  }
  _moreInfo(s) {
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: s }, bubbles: !0, composed: !0 }));
  }
  _openConfig(s) {
    const e = `/config/integrations/integration/${ae}#config_entry=${s}`;
    window.history.pushState(null, "", e), this.dispatchEvent(new CustomEvent("location-changed", { bubbles: !0, composed: !0 }));
  }
};
d.styles = me`
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
  `;
_([
  M({ attribute: !1 })
], d.prototype, "hass", 2);
_([
  M({ attribute: !1 })
], d.prototype, "narrow", 2);
_([
  M({ attribute: !1 })
], d.prototype, "route", 2);
_([
  M({ attribute: !1 })
], d.prototype, "panel", 2);
_([
  y()
], d.prototype, "_report", 2);
_([
  y()
], d.prototype, "_error", 2);
_([
  y()
], d.prototype, "_busy", 2);
_([
  y()
], d.prototype, "_busyName", 2);
_([
  y()
], d.prototype, "_summaryOpen", 2);
_([
  y()
], d.prototype, "_issue", 2);
_([
  y()
], d.prototype, "_columnOrder", 2);
_([
  y()
], d.prototype, "_hiddenColumns", 2);
_([
  y()
], d.prototype, "_search", 2);
_([
  y()
], d.prototype, "_typeSel", 2);
_([
  y()
], d.prototype, "_updSel", 2);
_([
  y()
], d.prototype, "_statSel", 2);
d = _([
  Ne("grenton-objects-panel")
], d);
export {
  d as GrentonObjectsPanel
};
