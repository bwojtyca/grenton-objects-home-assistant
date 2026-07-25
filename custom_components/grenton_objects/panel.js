/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const U = globalThis, B = U.ShadowRoot && (U.ShadyCSS === void 0 || U.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, W = Symbol(), J = /* @__PURE__ */ new WeakMap();
let le = class {
  constructor(e, s, i) {
    if (this._$cssResult$ = !0, i !== W) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = s;
  }
  get styleSheet() {
    let e = this.o;
    const s = this.t;
    if (B && e === void 0) {
      const i = s !== void 0 && s.length === 1;
      i && (e = J.get(s)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && J.set(s, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const _e = (t) => new le(typeof t == "string" ? t : t + "", void 0, W), me = (t, ...e) => {
  const s = t.length === 1 ? t[0] : e.reduce((i, n, a) => i + ((r) => {
    if (r._$cssResult$ === !0) return r.cssText;
    if (typeof r == "number") return r;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + r + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(n) + t[a + 1], t[0]);
  return new le(s, t, W);
}, ye = (t, e) => {
  if (B) t.adoptedStyleSheets = e.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
  else for (const s of e) {
    const i = document.createElement("style"), n = U.litNonce;
    n !== void 0 && i.setAttribute("nonce", n), i.textContent = s.cssText, t.appendChild(i);
  }
}, Z = B ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((e) => {
  let s = "";
  for (const i of e.cssRules) s += i.cssText;
  return _e(s);
})(t) : t;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: ge, defineProperty: $e, getOwnPropertyDescriptor: be, getOwnPropertyNames: fe, getOwnPropertySymbols: ve, getPrototypeOf: we } = Object, D = globalThis, Q = D.trustedTypes, ke = Q ? Q.emptyScript : "", Ae = D.reactiveElementPolyfillSupport, E = (t, e) => t, N = { toAttribute(t, e) {
  switch (e) {
    case Boolean:
      t = t ? ke : null;
      break;
    case Object:
    case Array:
      t = t == null ? t : JSON.stringify(t);
  }
  return t;
}, fromAttribute(t, e) {
  let s = t;
  switch (e) {
    case Boolean:
      s = t !== null;
      break;
    case Number:
      s = t === null ? null : Number(t);
      break;
    case Object:
    case Array:
      try {
        s = JSON.parse(t);
      } catch {
        s = null;
      }
  }
  return s;
} }, F = (t, e) => !ge(t, e), X = { attribute: !0, type: String, converter: N, reflect: !1, useDefault: !1, hasChanged: F };
Symbol.metadata ??= Symbol("metadata"), D.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let A = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, s = X) {
    if (s.state && (s.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((s = Object.create(s)).wrapped = !0), this.elementProperties.set(e, s), !s.noAccessor) {
      const i = Symbol(), n = this.getPropertyDescriptor(e, i, s);
      n !== void 0 && $e(this.prototype, e, n);
    }
  }
  static getPropertyDescriptor(e, s, i) {
    const { get: n, set: a } = be(this.prototype, e) ?? { get() {
      return this[s];
    }, set(r) {
      this[s] = r;
    } };
    return { get: n, set(r) {
      const l = n?.call(this);
      a?.call(this, r), this.requestUpdate(e, l, i);
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
      const s = this.properties, i = [...fe(s), ...ve(s)];
      for (const n of i) this.createProperty(n, s[n]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const s = litPropertyMetadata.get(e);
      if (s !== void 0) for (const [i, n] of s) this.elementProperties.set(i, n);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [s, i] of this.elementProperties) {
      const n = this._$Eu(s, i);
      n !== void 0 && this._$Eh.set(n, s);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const s = [];
    if (Array.isArray(e)) {
      const i = new Set(e.flat(1 / 0).reverse());
      for (const n of i) s.unshift(Z(n));
    } else e !== void 0 && s.push(Z(e));
    return s;
  }
  static _$Eu(e, s) {
    const i = s.attribute;
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
    const e = /* @__PURE__ */ new Map(), s = this.constructor.elementProperties;
    for (const i of s.keys()) this.hasOwnProperty(i) && (e.set(i, this[i]), delete this[i]);
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
  attributeChangedCallback(e, s, i) {
    this._$AK(e, i);
  }
  _$ET(e, s) {
    const i = this.constructor.elementProperties.get(e), n = this.constructor._$Eu(e, i);
    if (n !== void 0 && i.reflect === !0) {
      const a = (i.converter?.toAttribute !== void 0 ? i.converter : N).toAttribute(s, i.type);
      this._$Em = e, a == null ? this.removeAttribute(n) : this.setAttribute(n, a), this._$Em = null;
    }
  }
  _$AK(e, s) {
    const i = this.constructor, n = i._$Eh.get(e);
    if (n !== void 0 && this._$Em !== n) {
      const a = i.getPropertyOptions(n), r = typeof a.converter == "function" ? { fromAttribute: a.converter } : a.converter?.fromAttribute !== void 0 ? a.converter : N;
      this._$Em = n;
      const l = r.fromAttribute(s, a.type);
      this[n] = l ?? this._$Ej?.get(n) ?? l, this._$Em = null;
    }
  }
  requestUpdate(e, s, i, n = !1, a) {
    if (e !== void 0) {
      const r = this.constructor;
      if (n === !1 && (a = this[e]), i ??= r.getPropertyOptions(e), !((i.hasChanged ?? F)(a, s) || i.useDefault && i.reflect && a === this._$Ej?.get(e) && !this.hasAttribute(r._$Eu(e, i)))) return;
      this.C(e, s, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, s, { useDefault: i, reflect: n, wrapped: a }, r) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, r ?? s ?? this[e]), a !== !0 || r !== void 0) || (this._$AL.has(e) || (this.hasUpdated || i || (s = void 0), this._$AL.set(e, s)), n === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (s) {
      Promise.reject(s);
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
        for (const [n, a] of this._$Ep) this[n] = a;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [n, a] of i) {
        const { wrapped: r } = a, l = this[n];
        r !== !0 || this._$AL.has(n) || l === void 0 || this.C(n, void 0, a, l);
      }
    }
    let e = !1;
    const s = this._$AL;
    try {
      e = this.shouldUpdate(s), e ? (this.willUpdate(s), this._$EO?.forEach((i) => i.hostUpdate?.()), this.update(s)) : this._$EM();
    } catch (i) {
      throw e = !1, this._$EM(), i;
    }
    e && this._$AE(s);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    this._$EO?.forEach((s) => s.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
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
    this._$Eq &&= this._$Eq.forEach((s) => this._$ET(s, this[s])), this._$EM();
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
const V = globalThis, Y = (t) => t, I = V.trustedTypes, ee = I ? I.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, ce = "$lit$", b = `lit$${Math.random().toFixed(9).slice(2)}$`, he = "?" + b, Se = `<${he}>`, w = document, C = () => w.createComment(""), O = (t) => t === null || typeof t != "object" && typeof t != "function", K = Array.isArray, je = (t) => K(t) || typeof t?.[Symbol.iterator] == "function", G = `[ 	
\f\r]`, z = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, te = /-->/g, se = />/g, f = RegExp(`>|${G}(?:([^\\s"'>=/]+)(${G}*=${G}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), ie = /'/g, ne = /"/g, ue = /^(?:script|style|textarea|title)$/i, ze = (t) => (e, ...s) => ({ _$litType$: t, strings: e, values: s }), c = ze(1), S = Symbol.for("lit-noChange"), h = Symbol.for("lit-nothing"), ae = /* @__PURE__ */ new WeakMap(), v = w.createTreeWalker(w, 129);
function pe(t, e) {
  if (!K(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ee !== void 0 ? ee.createHTML(e) : e;
}
const Ee = (t, e) => {
  const s = t.length - 1, i = [];
  let n, a = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", r = z;
  for (let l = 0; l < s; l++) {
    const o = t[l];
    let p, m, u = -1, g = 0;
    for (; g < o.length && (r.lastIndex = g, m = r.exec(o), m !== null); ) g = r.lastIndex, r === z ? m[1] === "!--" ? r = te : m[1] !== void 0 ? r = se : m[2] !== void 0 ? (ue.test(m[2]) && (n = RegExp("</" + m[2], "g")), r = f) : m[3] !== void 0 && (r = f) : r === f ? m[0] === ">" ? (r = n ?? z, u = -1) : m[1] === void 0 ? u = -2 : (u = r.lastIndex - m[2].length, p = m[1], r = m[3] === void 0 ? f : m[3] === '"' ? ne : ie) : r === ne || r === ie ? r = f : r === te || r === se ? r = z : (r = f, n = void 0);
    const $ = r === f && t[l + 1].startsWith("/>") ? " " : "";
    a += r === z ? o + Se : u >= 0 ? (i.push(p), o.slice(0, u) + ce + o.slice(u) + b + $) : o + b + (u === -2 ? l : $);
  }
  return [pe(t, a + (t[s] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class P {
  constructor({ strings: e, _$litType$: s }, i) {
    let n;
    this.parts = [];
    let a = 0, r = 0;
    const l = e.length - 1, o = this.parts, [p, m] = Ee(e, s);
    if (this.el = P.createElement(p, i), v.currentNode = this.el.content, s === 2 || s === 3) {
      const u = this.el.content.firstChild;
      u.replaceWith(...u.childNodes);
    }
    for (; (n = v.nextNode()) !== null && o.length < l; ) {
      if (n.nodeType === 1) {
        if (n.hasAttributes()) for (const u of n.getAttributeNames()) if (u.endsWith(ce)) {
          const g = m[r++], $ = n.getAttribute(u).split(b), T = /([.?@])?(.*)/.exec(g);
          o.push({ type: 1, index: a, name: T[2], strings: $, ctor: T[1] === "." ? Ce : T[1] === "?" ? Oe : T[1] === "@" ? Pe : R }), n.removeAttribute(u);
        } else u.startsWith(b) && (o.push({ type: 6, index: a }), n.removeAttribute(u));
        if (ue.test(n.tagName)) {
          const u = n.textContent.split(b), g = u.length - 1;
          if (g > 0) {
            n.textContent = I ? I.emptyScript : "";
            for (let $ = 0; $ < g; $++) n.append(u[$], C()), v.nextNode(), o.push({ type: 2, index: ++a });
            n.append(u[g], C());
          }
        }
      } else if (n.nodeType === 8) if (n.data === he) o.push({ type: 2, index: a });
      else {
        let u = -1;
        for (; (u = n.data.indexOf(b, u + 1)) !== -1; ) o.push({ type: 7, index: a }), u += b.length - 1;
      }
      a++;
    }
  }
  static createElement(e, s) {
    const i = w.createElement("template");
    return i.innerHTML = e, i;
  }
}
function j(t, e, s = t, i) {
  if (e === S) return e;
  let n = i !== void 0 ? s._$Co?.[i] : s._$Cl;
  const a = O(e) ? void 0 : e._$litDirective$;
  return n?.constructor !== a && (n?._$AO?.(!1), a === void 0 ? n = void 0 : (n = new a(t), n._$AT(t, s, i)), i !== void 0 ? (s._$Co ??= [])[i] = n : s._$Cl = n), n !== void 0 && (e = j(t, n._$AS(t, e.values), n, i)), e;
}
class xe {
  constructor(e, s) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = s;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: s }, parts: i } = this._$AD, n = (e?.creationScope ?? w).importNode(s, !0);
    v.currentNode = n;
    let a = v.nextNode(), r = 0, l = 0, o = i[0];
    for (; o !== void 0; ) {
      if (r === o.index) {
        let p;
        o.type === 2 ? p = new H(a, a.nextSibling, this, e) : o.type === 1 ? p = new o.ctor(a, o.name, o.strings, this, e) : o.type === 6 && (p = new He(a, this, e)), this._$AV.push(p), o = i[++l];
      }
      r !== o?.index && (a = v.nextNode(), r++);
    }
    return v.currentNode = w, n;
  }
  p(e) {
    let s = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, s), s += i.strings.length - 2) : i._$AI(e[s])), s++;
  }
}
class H {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, s, i, n) {
    this.type = 2, this._$AH = h, this._$AN = void 0, this._$AA = e, this._$AB = s, this._$AM = i, this.options = n, this._$Cv = n?.isConnected ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const s = this._$AM;
    return s !== void 0 && e?.nodeType === 11 && (e = s.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, s = this) {
    e = j(this, e, s), O(e) ? e === h || e == null || e === "" ? (this._$AH !== h && this._$AR(), this._$AH = h) : e !== this._$AH && e !== S && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : je(e) ? this.k(e) : this._(e);
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
    const { values: s, _$litType$: i } = e, n = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = P.createElement(pe(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === n) this._$AH.p(s);
    else {
      const a = new xe(n, this), r = a.u(this.options);
      a.p(s), this.T(r), this._$AH = a;
    }
  }
  _$AC(e) {
    let s = ae.get(e.strings);
    return s === void 0 && ae.set(e.strings, s = new P(e)), s;
  }
  k(e) {
    K(this._$AH) || (this._$AH = [], this._$AR());
    const s = this._$AH;
    let i, n = 0;
    for (const a of e) n === s.length ? s.push(i = new H(this.O(C()), this.O(C()), this, this.options)) : i = s[n], i._$AI(a), n++;
    n < s.length && (this._$AR(i && i._$AB.nextSibling, n), s.length = n);
  }
  _$AR(e = this._$AA.nextSibling, s) {
    for (this._$AP?.(!1, !0, s); e !== this._$AB; ) {
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
  constructor(e, s, i, n, a) {
    this.type = 1, this._$AH = h, this._$AN = void 0, this.element = e, this.name = s, this._$AM = n, this.options = a, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = h;
  }
  _$AI(e, s = this, i, n) {
    const a = this.strings;
    let r = !1;
    if (a === void 0) e = j(this, e, s, 0), r = !O(e) || e !== this._$AH && e !== S, r && (this._$AH = e);
    else {
      const l = e;
      let o, p;
      for (e = a[0], o = 0; o < a.length - 1; o++) p = j(this, l[i + o], s, o), p === S && (p = this._$AH[o]), r ||= !O(p) || p !== this._$AH[o], p === h ? e = h : e !== h && (e += (p ?? "") + a[o + 1]), this._$AH[o] = p;
    }
    r && !n && this.j(e);
  }
  j(e) {
    e === h ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class Ce extends R {
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
  constructor(e, s, i, n, a) {
    super(e, s, i, n, a), this.type = 5;
  }
  _$AI(e, s = this) {
    if ((e = j(this, e, s, 0) ?? h) === S) return;
    const i = this._$AH, n = e === h && i !== h || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, a = e !== h && (i === h || n);
    n && this.element.removeEventListener(this.name, this, i), a && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class He {
  constructor(e, s, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = s, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    j(this, e);
  }
}
const Me = V.litHtmlPolyfillSupport;
Me?.(P, H), (V.litHtmlVersions ??= []).push("3.3.3");
const Te = (t, e, s) => {
  const i = s?.renderBefore ?? e;
  let n = i._$litPart$;
  if (n === void 0) {
    const a = s?.renderBefore ?? null;
    i._$litPart$ = n = new H(e.insertBefore(C(), a), a, void 0, s ?? {});
  }
  return n._$AI(t), n;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const q = globalThis;
class x extends A {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const s = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Te(s, this.renderRoot, this.renderOptions);
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
x._$litElement$ = !0, x.finalized = !0, q.litElementHydrateSupport?.({ LitElement: x });
const Ue = q.litElementPolyfillSupport;
Ue?.({ LitElement: x });
(q.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ne = (t) => (e, s) => {
  s !== void 0 ? s.addInitializer(() => {
    customElements.define(t, e);
  }) : customElements.define(t, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ie = { attribute: !0, type: String, converter: N, reflect: !1, hasChanged: F }, De = (t = Ie, e, s) => {
  const { kind: i, metadata: n } = s;
  let a = globalThis.litPropertyMetadata.get(n);
  if (a === void 0 && globalThis.litPropertyMetadata.set(n, a = /* @__PURE__ */ new Map()), i === "setter" && ((t = Object.create(t)).wrapped = !0), a.set(s.name, t), i === "accessor") {
    const { name: r } = s;
    return { set(l) {
      const o = e.get.call(this);
      e.set.call(this, l), this.requestUpdate(r, o, t, !0, l);
    }, init(l) {
      return l !== void 0 && this.C(r, void 0, t, l), l;
    } };
  }
  if (i === "setter") {
    const { name: r } = s;
    return function(l) {
      const o = this[r];
      e.call(this, l), this.requestUpdate(r, o, t, !0, l);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function M(t) {
  return (e, s) => typeof s == "object" ? De(t, e, s) : ((i, n, a) => {
    const r = n.hasOwnProperty(a);
    return n.constructor.createProperty(a, i), r ? Object.getOwnPropertyDescriptor(n, a) : void 0;
  })(t, e, s);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function y(t) {
  return M({ ...t, state: !0, attribute: !1 });
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
]), de = (t) => t.substring(0, t.indexOf(".")), We = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_+|_+$)/g, "") || "_", Fe = (t) => t.reduceRight(
  (e, s) => `var(${s}${e ? `, ${e}` : ""})`,
  void 0
);
function Ve(t, e) {
  const s = de(t.entity_id), i = t.state;
  if (Be.has(s))
    return i !== L;
  if (i === L || i === Re || i === Ge && s !== "alert")
    return !1;
  switch (s) {
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
function Ke(t, e, s, i) {
  const n = [], a = We(s), r = i ? "active" : "inactive";
  return e && n.push(`--state-${t}-${e}-${a}-color`), n.push(
    `--state-${t}-${a}-color`,
    `--state-${t}-${r}-color`,
    `--state-${r}-color`
  ), n;
}
function qe(t, e) {
  const s = t.state;
  if (s === L)
    return "var(--state-unavailable-color)";
  const i = de(t.entity_id);
  if (!Le.has(i))
    return;
  const n = Ve(t);
  return Fe(
    Ke(i, t.attributes.device_class, s, n)
  );
}
var Je = Object.defineProperty, Ze = Object.getOwnPropertyDescriptor, _ = (t, e, s, i) => {
  for (var n = i > 1 ? void 0 : i ? Ze(e, s) : e, a = t.length - 1, r; a >= 0; a--)
    (r = t[a]) && (n = (i ? r(e, s, n) : r(n)) || n);
  return i && n && Je(e, s, n), n;
};
const re = "grenton_objects", Qe = "Analiza projektu Grenton", k = {
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
function oe(t) {
  const e = t.flags;
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
  } : t.in_ha ? { label: "OK", sev: "ok", cat: "ok" } : t.is_unsupported ? {
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
function st(t) {
  const e = new Uint8Array(t), s = 32768;
  let i = "";
  for (let n = 0; n < e.length; n += s)
    i += String.fromCharCode.apply(null, Array.from(e.subarray(n, n + s)));
  return btoa(i);
}
let d = class extends x {
  constructor() {
    super(...arguments), this.narrow = !1, this._busy = !1, this._busyName = "", this._summaryOpen = !1, this._search = "", this._typeSel = /* @__PURE__ */ new Set(), this._updSel = /* @__PURE__ */ new Set(), this._statSel = /* @__PURE__ */ new Set(), this._entityIds = /* @__PURE__ */ new Set(), this._onColumnsChanged = (t) => {
      let e = t.detail?.columnOrder ? [...t.detail.columnOrder] : void 0;
      e && (e = e.filter((i) => i !== "actions"), e.push("actions")), this._columnOrder = e;
      const s = t.detail?.hiddenColumns;
      this._hiddenColumns = s && s.filter((i) => i !== "actions");
    }, this._resetFilters = () => {
      this._typeSel = this._defaultTypeSel(), this._updSel = /* @__PURE__ */ new Set(), this._statSel = /* @__PURE__ */ new Set();
    }, this._pickFile = () => {
      this.renderRoot.querySelector('input[type="file"]')?.click();
    }, this._onFileInput = (t) => {
      const e = t.target, s = e.files?.[0];
      e.value = "", this._analyze(s);
    };
  }
  shouldUpdate(t) {
    if (t.size === 1 && t.has("hass")) {
      const e = t.get("hass");
      if (e && this._entityIds.size) {
        for (const s of this._entityIds)
          if (e.states[s] !== this.hass.states[s]) return !0;
      }
      return !1;
    }
    return !0;
  }
  firstUpdated() {
    const t = window;
    !customElements.get("ha-data-table") && t.loadCardHelpers && t.loadCardHelpers().then((e) => e?.createCardElement?.({ type: "entities", entities: [] })).catch(() => {
    });
  }
  get _tabs() {
    return [{ name: Qe, path: this.route?.prefix ?? `/${re}` }];
  }
  render() {
    return this._report ? this._reportView() : this._startView();
  }
  // ─── start view (upload) ────────────────────────────────────────────
  _startView() {
    const t = c`
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
      >${t}</hass-tabs-subpage>` : t;
  }
  _uploadUI() {
    return customElements.get("ha-file-upload") ? c`<ha-file-upload
        .localize=${this.hass.localize}
        accept=".omp,.zip"
        .icon=${"mdi:folder-upload"}
        .label=${"Przeciągnij plik .omp lub kliknij, aby wybrać"}
        .supports=${"Plik projektu Object Managera (.omp / .zip)"}
        .uploading=${this._busy}
        @file-picked=${(t) => this._analyze(t.detail.files?.[0])}
      ></ha-file-upload>` : c`
      <ha-button raised @click=${this._pickFile}>Wybierz plik .omp</ha-button>
      <input type="file" accept=".omp,.zip" style="display:none" @change=${this._onFileInput} />
      ${this._busy ? c`<div style="margin-top:12px;color:var(--secondary-text-color)">Analizuję… (${this._busyName})</div>` : h}
    `;
  }
  // ─── report view (native subpage table) ─────────────────────────────
  _reportView() {
    const t = customElements.get("hass-tabs-subpage-data-table") ? this._subpage() : this._fallbackTable();
    return c`${t}${this._summaryDialog()}${this._issueDialog()}`;
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
        @search-changed=${(t) => this._search = t.detail.value}
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
    const t = this._report, e = t.summary, s = t.orphans.length + t.push_object_mismatch.length + t.push_service_mismatch.length + t.push_no_event.length + t.push_orphan_targets.length + t.poll_with_push.length, i = t.verdict === "ok";
    return c`
      <button class="stat-bar" @click=${() => this._summaryOpen = !0} title="Pokaż pełne podsumowanie">
        <span class="verdict ${i ? "ok" : "issues"}">
          <ha-icon icon=${i ? "mdi:check-circle" : "mdi:alert"}></ha-icon>
          ${i ? "Spójne z projektem" : `Rozbieżności — ${s} do sprawdzenia`}
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
        .headerTitle=${"Podsumowanie analizy"}
        @closed=${() => this._summaryOpen = !1}
      >
        ${this._summaryInner()}
        <div slot="footer" class="dialog-footer">
          <ha-button appearance="plain" data-dialog="close">Zamknij</ha-button>
        </div>
      </ha-dialog>
    ` : h;
  }
  _summaryInner() {
    const t = this._report, e = t.summary, s = t.verdict === "ok", i = [
      { label: "encje HA bez obiektu w projekcie", count: t.orphans.length, sev: "error" },
      { label: "push aktualizujący zły obiekt Grentona", count: t.push_object_mismatch.length, sev: "error" },
      { label: "push z niewłaściwą akcją dla typu encji", count: t.push_service_mismatch.length, sev: "error" },
      { label: "encje push bez zdarzenia w Grentonie", count: t.push_no_event.length, sev: "error" },
      { label: "zdarzenia push w nieistniejącą encję", count: t.push_orphan_targets.length, sev: "error" },
      { label: "polling z jednoczesnym push (redundancja)", count: t.poll_with_push.length, sev: "warn" },
      { label: "obiekty Grentona nieobecne w HA", count: t.not_in_ha.length, sev: "missing" }
    ].filter((n) => n.count > 0);
    return c`
      <div class="summary">
        <ha-alert alert-type=${s ? "success" : "warning"}>
          ${s ? "Integracja spójna z projektem" : "Wykryto rozbieżności"}
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
          ${Object.keys(e.per_domain).sort((n, a) => e.per_domain[a].push + e.per_domain[a].polling - (e.per_domain[n].push + e.per_domain[n].polling)).map((n) => c`<li>${n}: ${e.per_domain[n].push} push / ${e.per_domain[n].polling} polling</li>`)}
        </ul>

        <h4>Problemy${i.length ? "" : " — brak"}</h4>
        ${i.length ? c`<ul class="problems">
              ${i.map((n) => {
      const a = n.sev === "error" || n.sev === "warn" ? "active-error" : "";
      return c`<li class=${a} style=${`color:${k[n.sev]}`}>${n.count} ${n.label}</li>`;
    })}
            </ul>` : h}
        ${t.not_in_ha.length ? c`<div style="color:${k.missing};margin-top:4px">
              ${t.not_in_ha.length} obiektów Grentona nieobecnych w HA
              (${t.not_in_ha_by_type.map(([n, a]) => `${a}× ${n}`).join(", ")})
            </div>` : h}

        ${t.scaffolding ? this._scaffold(t.scaffolding) : h}
      </div>
    `;
  }
  _scaffold(t) {
    return c`
      <h4>Konfiguracja po stronie Grentona</h4>
      ${t.push_used ? h : c`<div style="color:var(--secondary-text-color);font-size:0.9em">Push nieużywany — obiekty kolejki nie są wymagane.</div>`}
      <ul>
        ${t.checks.map((e) => {
      let s = k.ok, i = "obecny";
      return e.present || (e.required ? (s = k.error, i = "BRAK (wymagane)") : (s = k.muted, i = "brak (opcjonalne)")), c`<li style=${`color:${s}`}>${e.name} — ${e.desc}: ${i}</li>`;
    })}
      </ul>
    `;
  }
  // ─── table data + columns ──────────────────────────────────────────────
  get _viewRows() {
    return (this._report?.merged ?? []).map((s, i) => {
      const n = oe(s), a = s.in_ha ? s.mode ?? "brak" : "brak", r = s.in_ha ? s.mode === "polling" ? `polling (${s.interval ?? "?"} s)` : "push" : "brak", l = s.clu || (s.grenton_id?.includes("->") ? s.grenton_id.split("->")[0] : "") || "—", o = s.flags.find((p) => et.includes(p)) ?? (s.is_unsupported ? "unsupported" : s.in_ha ? "ok" : "not_in_ha");
      return {
        id: s.grenton_id || s.entity_id || String(i),
        name: s.om_name || s.ha_name || "",
        grenton_id: s.grenton_id || "",
        clu: l,
        type: s.om_type || s.device_type || "—",
        entity_id: s.entity_id || "",
        entry_id: s.entry_id || "",
        domain: s.entity_id ? s.entity_id.split(".")[0] : "—",
        update: r,
        updateCat: a,
        status: n.label,
        sev: n.sev,
        statusCat: n.cat,
        flag: o
      };
    }).filter((s) => !(this._typeSel.size && !this._typeSel.has(s.type) || this._updSel.size && !this._updSel.has(s.updateCat) || this._statSel.size && !this._statSel.has(s.statusCat)));
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
        template: (t, e) => this._entityCell(e ?? t)
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
        template: (t, e) => this._statusCell(e ?? t)
      },
      actions: {
        title: "Akcje",
        width: "64px",
        moveable: !1,
        hideable: !1,
        template: (t, e) => this._actionsCell(e ?? t)
      }
    };
  }
  _entityCell(t) {
    if (!t.entity_id) return c`<span style="color:var(--secondary-text-color)">—</span>`;
    const e = this.hass?.states?.[t.entity_id], s = e ? qe(e) ?? "var(--secondary-text-color)" : "var(--secondary-text-color)", i = e ? this._formatState(e) : "niedostępna";
    return c`
      <span class="entity" @click=${() => this._moreInfo(t.entity_id)}>
        ${e ? c`<ha-state-icon .stateObj=${e} style=${`color:${s}`}></ha-state-icon>` : h}
        <span>${t.entity_id}<span style="color:var(--secondary-text-color)"> · ${i}</span></span>
      </span>
    `;
  }
  _statusCell(t) {
    const e = c`<ha-label dense .color=${k[t.sev]}>${t.status}</ha-label>`;
    return t.flag === "ok" ? e : c`<span
      class="status-cell"
      title="Kliknij po szczegóły i wskazówki"
      @click=${() => this._issue = t}
    >${e}</span>`;
  }
  // Context-tailored explanation for a row's status.
  _issueDetails(t) {
    const e = t.domain && t.domain !== "—" ? t.domain : t.type;
    switch (t.flag) {
      case "orphan":
        return { sections: [
          { h: "Co jest nie tak", body: `Encja ${t.entity_id} wskazuje grenton_id „${t.grenton_id}", którego nie ma w tym projekcie OM.` },
          { h: "Prawdopodobna przyczyna", body: "Obiekt został usunięty lub dostał nowy identyfikator w Object Managerze, albo encja w HA ma literówkę w grenton_id." },
          { h: "Jak poprawić", body: "Sprawdź obiekt w OM i popraw grenton_id encji (ikona koła zębatego → Konfiguruj), albo usuń nieaktualną encję." }
        ] };
      case "push_wrong_object":
        return { sections: [
          { h: "Co jest nie tak", body: `Zdarzenie push aktualizuje tę encję (${t.grenton_id}) stanem INNEGO obiektu Grentona.` },
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
          { h: "Co jest nie tak", body: `Integracja nie potrafi wystawić obiektu typu „${t.type}" jako encji HA (np. DALI_MASTER, kontener Satel).` },
          { h: "Co zrobić", body: "Nic — ten obiekt po prostu nie ma odpowiednika w HA." }
        ] };
      default:
        return { sections: [
          { h: "Co jest nie tak", body: `Obiekt „${t.grenton_id}" (${t.type}) istnieje w projekcie Grentona, ale nie jest dodany do HA.` },
          { h: "Jak dodać", body: "Jeśli chcesz nim sterować/monitorować, dodaj go w integracji (Ustawienia → Urządzenia i usługi → Grenton Objects → Dodaj)." }
        ] };
    }
  }
  _issueDialog() {
    const t = this._issue;
    if (!t) return h;
    const e = this._issueDetails(t);
    return c`
      <ha-dialog open .headerTitle=${t.status} @closed=${() => this._issue = void 0}>
        <div class="issue">
          ${e.sections.map((s) => c`<div class="issue-sec"><div class="issue-h">${s.h}</div><div>${s.body}</div></div>`)}
        </div>
        <div slot="footer" class="dialog-footer">
          ${t.entry_id ? c`<ha-button appearance="plain" @click=${() => {
      this._issue = void 0, this._openConfig(t.entry_id);
    }}>
                Konfiguruj encję
              </ha-button>` : h}
          ${t.flag === "poll_redundant" && t.entry_id ? c`<ha-button raised @click=${() => this._fixDisablePolling(t)}>Wyłącz polling</ha-button>` : h}
          <ha-button appearance="plain" data-dialog="close">Zamknij</ha-button>
        </div>
      </ha-dialog>
    `;
  }
  // ─── repair actions (HA-side) ──────────────────────────────────────────
  async _fixDisablePolling(t) {
    if (t.entry_id)
      try {
        await this.hass.connection.sendMessagePromise({
          type: "grenton_objects/set_auto_update",
          entry_id: t.entry_id,
          auto_update: !1
        }), this._patchMerged(t.entity_id, { mode: "push", dropFlag: "poll_redundant" }), this._toast(`Wyłączono polling dla ${t.entity_id} — aktualizacja tylko przez push.`);
      } catch (e) {
        this._toast(`Nie udało się: ${e?.message || e?.code || "błąd"}`);
      } finally {
        this._issue = void 0;
      }
  }
  _patchMerged(t, e) {
    if (!this._report) return;
    const s = this._report.merged.map((i) => {
      if (i.entity_id !== t) return i;
      const n = e.dropFlag ? i.flags.filter((a) => a !== e.dropFlag) : i.flags;
      return { ...i, ...e.mode !== void 0 ? { mode: e.mode } : {}, flags: n };
    });
    this._report = { ...this._report, merged: s };
  }
  _toast(t) {
    this.dispatchEvent(new CustomEvent("hass-notification", { detail: { message: t }, bubbles: !0, composed: !0 }));
  }
  _actionsCell(t) {
    return t.entry_id ? c`<ha-icon
      class="cog"
      icon="mdi:cog"
      title="Otwórz konfigurację obiektu w integracji"
      @click=${() => this._openConfig(t.entry_id)}
    ></ha-icon>` : h;
  }
  _formatState(t) {
    const e = t.attributes?.unit_of_measurement;
    return e ? `${t.state} ${e}` : t.state;
  }
  // ─── filter pane ───────────────────────────────────────────────────────
  _activeFilterCount() {
    return this._typeSel.size + this._updSel.size + this._statSel.size;
  }
  _filterGroups() {
    const t = this._report, e = (a) => {
      const r = {};
      for (const l of this._allViewRows()) r[l[a]] = (r[l[a]] || 0) + 1;
      return r;
    }, s = t.type_summary.map((a) => ({ key: a.type, label: `${a.type} (${a.count})${a.supported ? "" : " · nieobsł."}` })), i = e("updateCat"), n = e("statusCat");
    return c`
      ${this._filterGroup("Typ Grenton", s, this._typeSel, "type")}
      ${this._filterGroup("Aktualizacja", Xe.map((a) => ({ key: a.key, label: `${a.label} (${i[a.key] || 0})` })), this._updSel, "upd")}
      ${this._filterGroup("Status", Ye.map((a) => ({ key: a.key, label: `${a.label} (${n[a.key] || 0})` })), this._statSel, "stat")}
    `;
  }
  _allViewRows() {
    return (this._report?.merged ?? []).map((e) => {
      const s = oe(e);
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
        status: s.label,
        sev: s.sev,
        statusCat: s.cat,
        flag: ""
      };
    });
  }
  _filterGroup(t, e, s, i) {
    return c`
      <ha-expansion-panel slot="filter-pane" outlined .expanded=${s.size > 0}>
        <div slot="header" class="filter-header">
          <span>${t}</span>
          ${s.size ? c`<span class="badge">${s.size}</span>
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
      (n) => c`<ha-check-list-item .value=${n.key} .selected=${s.has(n.key)}>${n.label}</ha-check-list-item>`
    )}
        </ha-list>
      </ha-expansion-panel>
    `;
  }
  _onListSelected(t, e, s) {
    const i = t?.detail?.index, n = i instanceof Set ? Array.from(i) : typeof i == "number" ? [i] : [], a = /* @__PURE__ */ new Set();
    n.forEach((r) => {
      s[r] && a.add(s[r].key);
    }), this._setSel(e, a);
  }
  _setSel(t, e) {
    t === "type" ? this._typeSel = e : t === "upd" ? this._updSel = e : this._statSel = e;
  }
  _defaultTypeSel() {
    const t = this._report?.type_summary ?? [];
    return new Set(t.filter((e) => e.supported && e.type !== "DIN").map((e) => e.type));
  }
  async _analyze(t) {
    if (t) {
      this._error = void 0, this._busy = !0, this._busyName = t.name;
      try {
        const e = await t.arrayBuffer(), s = await this.hass.connection.sendMessagePromise({
          type: "grenton_objects/analyze",
          omp_base64: st(e)
        });
        this._report = s, this._entityIds = new Set(s.merged.map((i) => i.entity_id).filter((i) => !!i)), this._typeSel = this._defaultTypeSel(), this._updSel = /* @__PURE__ */ new Set(), this._statSel = /* @__PURE__ */ new Set();
      } catch (e) {
        this._error = e?.message || e?.code || "Nie udało się odczytać pliku .omp.";
      } finally {
        this._busy = !1;
      }
    }
  }
  _moreInfo(t) {
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: t }, bubbles: !0, composed: !0 }));
  }
  _openConfig(t) {
    const e = `/config/integrations/integration/${re}#config_entry=${t}`;
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
    .dialog-footer { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; padding: 8px 24px 16px; }
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
