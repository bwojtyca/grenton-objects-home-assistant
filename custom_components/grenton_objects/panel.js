/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const N = globalThis, W = N.ShadowRoot && (N.ShadyCSS === void 0 || N.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, V = Symbol(), J = /* @__PURE__ */ new WeakMap();
let de = class {
  constructor(e, s, i) {
    if (this._$cssResult$ = !0, i !== V) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = s;
  }
  get styleSheet() {
    let e = this.o;
    const s = this.t;
    if (W && e === void 0) {
      const i = s !== void 0 && s.length === 1;
      i && (e = J.get(s)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && J.set(s, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const be = (t) => new de(typeof t == "string" ? t : t + "", void 0, V), ge = (t, ...e) => {
  const s = t.length === 1 ? t[0] : e.reduce((i, a, n) => i + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(a) + t[n + 1], t[0]);
  return new de(s, t, V);
}, $e = (t, e) => {
  if (W) t.adoptedStyleSheets = e.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
  else for (const s of e) {
    const i = document.createElement("style"), a = N.litNonce;
    a !== void 0 && i.setAttribute("nonce", a), i.textContent = s.cssText, t.appendChild(i);
  }
}, Q = W ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((e) => {
  let s = "";
  for (const i of e.cssRules) s += i.cssText;
  return be(s);
})(t) : t;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: fe, defineProperty: ve, getOwnPropertyDescriptor: we, getOwnPropertyNames: ke, getOwnPropertySymbols: Ae, getPrototypeOf: ze } = Object, I = globalThis, Y = I.trustedTypes, je = Y ? Y.emptyScript : "", Se = I.reactiveElementPolyfillSupport, E = (t, e) => t, D = { toAttribute(t, e) {
  switch (e) {
    case Boolean:
      t = t ? je : null;
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
} }, F = (t, e) => !fe(t, e), X = { attribute: !0, type: String, converter: D, reflect: !1, useDefault: !1, hasChanged: F };
Symbol.metadata ??= Symbol("metadata"), I.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let A = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, s = X) {
    if (s.state && (s.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((s = Object.create(s)).wrapped = !0), this.elementProperties.set(e, s), !s.noAccessor) {
      const i = Symbol(), a = this.getPropertyDescriptor(e, i, s);
      a !== void 0 && ve(this.prototype, e, a);
    }
  }
  static getPropertyDescriptor(e, s, i) {
    const { get: a, set: n } = we(this.prototype, e) ?? { get() {
      return this[s];
    }, set(o) {
      this[s] = o;
    } };
    return { get: a, set(o) {
      const c = a?.call(this);
      n?.call(this, o), this.requestUpdate(e, c, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? X;
  }
  static _$Ei() {
    if (this.hasOwnProperty(E("elementProperties"))) return;
    const e = ze(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(E("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(E("properties"))) {
      const s = this.properties, i = [...ke(s), ...Ae(s)];
      for (const a of i) this.createProperty(a, s[a]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const s = litPropertyMetadata.get(e);
      if (s !== void 0) for (const [i, a] of s) this.elementProperties.set(i, a);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [s, i] of this.elementProperties) {
      const a = this._$Eu(s, i);
      a !== void 0 && this._$Eh.set(a, s);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const s = [];
    if (Array.isArray(e)) {
      const i = new Set(e.flat(1 / 0).reverse());
      for (const a of i) s.unshift(Q(a));
    } else e !== void 0 && s.push(Q(e));
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
    return $e(e, this.constructor.elementStyles), e;
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
    const i = this.constructor.elementProperties.get(e), a = this.constructor._$Eu(e, i);
    if (a !== void 0 && i.reflect === !0) {
      const n = (i.converter?.toAttribute !== void 0 ? i.converter : D).toAttribute(s, i.type);
      this._$Em = e, n == null ? this.removeAttribute(a) : this.setAttribute(a, n), this._$Em = null;
    }
  }
  _$AK(e, s) {
    const i = this.constructor, a = i._$Eh.get(e);
    if (a !== void 0 && this._$Em !== a) {
      const n = i.getPropertyOptions(a), o = typeof n.converter == "function" ? { fromAttribute: n.converter } : n.converter?.fromAttribute !== void 0 ? n.converter : D;
      this._$Em = a;
      const c = o.fromAttribute(s, n.type);
      this[a] = c ?? this._$Ej?.get(a) ?? c, this._$Em = null;
    }
  }
  requestUpdate(e, s, i, a = !1, n) {
    if (e !== void 0) {
      const o = this.constructor;
      if (a === !1 && (n = this[e]), i ??= o.getPropertyOptions(e), !((i.hasChanged ?? F)(n, s) || i.useDefault && i.reflect && n === this._$Ej?.get(e) && !this.hasAttribute(o._$Eu(e, i)))) return;
      this.C(e, s, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, s, { useDefault: i, reflect: a, wrapped: n }, o) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, o ?? s ?? this[e]), n !== !0 || o !== void 0) || (this._$AL.has(e) || (this.hasUpdated || i || (s = void 0), this._$AL.set(e, s)), a === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
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
        for (const [a, n] of this._$Ep) this[a] = n;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [a, n] of i) {
        const { wrapped: o } = n, c = this[a];
        o !== !0 || this._$AL.has(a) || c === void 0 || this.C(a, void 0, n, c);
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
A.elementStyles = [], A.shadowRootOptions = { mode: "open" }, A[E("elementProperties")] = /* @__PURE__ */ new Map(), A[E("finalized")] = /* @__PURE__ */ new Map(), Se?.({ ReactiveElement: A }), (I.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const K = globalThis, ee = (t) => t, U = K.trustedTypes, te = U ? U.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, ue = "$lit$", $ = `lit$${Math.random().toFixed(9).slice(2)}$`, pe = "?" + $, Ee = `<${pe}>`, w = document, C = () => w.createComment(""), O = (t) => t === null || typeof t != "object" && typeof t != "function", q = Array.isArray, xe = (t) => q(t) || typeof t?.[Symbol.iterator] == "function", L = `[ 	
\f\r]`, S = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, se = /-->/g, ie = />/g, f = RegExp(`>|${L}(?:([^\\s"'>=/]+)(${L}*=${L}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), ae = /'/g, ne = /"/g, _e = /^(?:script|style|textarea|title)$/i, Ce = (t) => (e, ...s) => ({ _$litType$: t, strings: e, values: s }), l = Ce(1), z = Symbol.for("lit-noChange"), h = Symbol.for("lit-nothing"), oe = /* @__PURE__ */ new WeakMap(), v = w.createTreeWalker(w, 129);
function ye(t, e) {
  if (!q(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return te !== void 0 ? te.createHTML(e) : e;
}
const Oe = (t, e) => {
  const s = t.length - 1, i = [];
  let a, n = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", o = S;
  for (let c = 0; c < s; c++) {
    const r = t[c];
    let p, y, d = -1, b = 0;
    for (; b < r.length && (o.lastIndex = b, y = o.exec(r), y !== null); ) b = o.lastIndex, o === S ? y[1] === "!--" ? o = se : y[1] !== void 0 ? o = ie : y[2] !== void 0 ? (_e.test(y[2]) && (a = RegExp("</" + y[2], "g")), o = f) : y[3] !== void 0 && (o = f) : o === f ? y[0] === ">" ? (o = a ?? S, d = -1) : y[1] === void 0 ? d = -2 : (d = o.lastIndex - y[2].length, p = y[1], o = y[3] === void 0 ? f : y[3] === '"' ? ne : ae) : o === ne || o === ae ? o = f : o === se || o === ie ? o = S : (o = f, a = void 0);
    const g = o === f && t[c + 1].startsWith("/>") ? " " : "";
    n += o === S ? r + Ee : d >= 0 ? (i.push(p), r.slice(0, d) + ue + r.slice(d) + $ + g) : r + $ + (d === -2 ? c : g);
  }
  return [ye(t, n + (t[s] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class P {
  constructor({ strings: e, _$litType$: s }, i) {
    let a;
    this.parts = [];
    let n = 0, o = 0;
    const c = e.length - 1, r = this.parts, [p, y] = Oe(e, s);
    if (this.el = P.createElement(p, i), v.currentNode = this.el.content, s === 2 || s === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (a = v.nextNode()) !== null && r.length < c; ) {
      if (a.nodeType === 1) {
        if (a.hasAttributes()) for (const d of a.getAttributeNames()) if (d.endsWith(ue)) {
          const b = y[o++], g = a.getAttribute(d).split($), M = /([.?@])?(.*)/.exec(b);
          r.push({ type: 1, index: n, name: M[2], strings: g, ctor: M[1] === "." ? Te : M[1] === "?" ? He : M[1] === "@" ? Me : R }), a.removeAttribute(d);
        } else d.startsWith($) && (r.push({ type: 6, index: n }), a.removeAttribute(d));
        if (_e.test(a.tagName)) {
          const d = a.textContent.split($), b = d.length - 1;
          if (b > 0) {
            a.textContent = U ? U.emptyScript : "";
            for (let g = 0; g < b; g++) a.append(d[g], C()), v.nextNode(), r.push({ type: 2, index: ++n });
            a.append(d[b], C());
          }
        }
      } else if (a.nodeType === 8) if (a.data === pe) r.push({ type: 2, index: n });
      else {
        let d = -1;
        for (; (d = a.data.indexOf($, d + 1)) !== -1; ) r.push({ type: 7, index: n }), d += $.length - 1;
      }
      n++;
    }
  }
  static createElement(e, s) {
    const i = w.createElement("template");
    return i.innerHTML = e, i;
  }
}
function j(t, e, s = t, i) {
  if (e === z) return e;
  let a = i !== void 0 ? s._$Co?.[i] : s._$Cl;
  const n = O(e) ? void 0 : e._$litDirective$;
  return a?.constructor !== n && (a?._$AO?.(!1), n === void 0 ? a = void 0 : (a = new n(t), a._$AT(t, s, i)), i !== void 0 ? (s._$Co ??= [])[i] = a : s._$Cl = a), a !== void 0 && (e = j(t, a._$AS(t, e.values), a, i)), e;
}
class Pe {
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
    const { el: { content: s }, parts: i } = this._$AD, a = (e?.creationScope ?? w).importNode(s, !0);
    v.currentNode = a;
    let n = v.nextNode(), o = 0, c = 0, r = i[0];
    for (; r !== void 0; ) {
      if (o === r.index) {
        let p;
        r.type === 2 ? p = new T(n, n.nextSibling, this, e) : r.type === 1 ? p = new r.ctor(n, r.name, r.strings, this, e) : r.type === 6 && (p = new Ne(n, this, e)), this._$AV.push(p), r = i[++c];
      }
      o !== r?.index && (n = v.nextNode(), o++);
    }
    return v.currentNode = w, a;
  }
  p(e) {
    let s = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, s), s += i.strings.length - 2) : i._$AI(e[s])), s++;
  }
}
class T {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, s, i, a) {
    this.type = 2, this._$AH = h, this._$AN = void 0, this._$AA = e, this._$AB = s, this._$AM = i, this.options = a, this._$Cv = a?.isConnected ?? !0;
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
    e = j(this, e, s), O(e) ? e === h || e == null || e === "" ? (this._$AH !== h && this._$AR(), this._$AH = h) : e !== this._$AH && e !== z && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : xe(e) ? this.k(e) : this._(e);
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
    const { values: s, _$litType$: i } = e, a = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = P.createElement(ye(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === a) this._$AH.p(s);
    else {
      const n = new Pe(a, this), o = n.u(this.options);
      n.p(s), this.T(o), this._$AH = n;
    }
  }
  _$AC(e) {
    let s = oe.get(e.strings);
    return s === void 0 && oe.set(e.strings, s = new P(e)), s;
  }
  k(e) {
    q(this._$AH) || (this._$AH = [], this._$AR());
    const s = this._$AH;
    let i, a = 0;
    for (const n of e) a === s.length ? s.push(i = new T(this.O(C()), this.O(C()), this, this.options)) : i = s[a], i._$AI(n), a++;
    a < s.length && (this._$AR(i && i._$AB.nextSibling, a), s.length = a);
  }
  _$AR(e = this._$AA.nextSibling, s) {
    for (this._$AP?.(!1, !0, s); e !== this._$AB; ) {
      const i = ee(e).nextSibling;
      ee(e).remove(), e = i;
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
  constructor(e, s, i, a, n) {
    this.type = 1, this._$AH = h, this._$AN = void 0, this.element = e, this.name = s, this._$AM = a, this.options = n, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = h;
  }
  _$AI(e, s = this, i, a) {
    const n = this.strings;
    let o = !1;
    if (n === void 0) e = j(this, e, s, 0), o = !O(e) || e !== this._$AH && e !== z, o && (this._$AH = e);
    else {
      const c = e;
      let r, p;
      for (e = n[0], r = 0; r < n.length - 1; r++) p = j(this, c[i + r], s, r), p === z && (p = this._$AH[r]), o ||= !O(p) || p !== this._$AH[r], p === h ? e = h : e !== h && (e += (p ?? "") + n[r + 1]), this._$AH[r] = p;
    }
    o && !a && this.j(e);
  }
  j(e) {
    e === h ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class Te extends R {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === h ? void 0 : e;
  }
}
class He extends R {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== h);
  }
}
class Me extends R {
  constructor(e, s, i, a, n) {
    super(e, s, i, a, n), this.type = 5;
  }
  _$AI(e, s = this) {
    if ((e = j(this, e, s, 0) ?? h) === z) return;
    const i = this._$AH, a = e === h && i !== h || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, n = e !== h && (i === h || a);
    a && this.element.removeEventListener(this.name, this, i), n && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class Ne {
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
const De = K.litHtmlPolyfillSupport;
De?.(P, T), (K.litHtmlVersions ??= []).push("3.3.3");
const Ue = (t, e, s) => {
  const i = s?.renderBefore ?? e;
  let a = i._$litPart$;
  if (a === void 0) {
    const n = s?.renderBefore ?? null;
    i._$litPart$ = a = new T(e.insertBefore(C(), n), n, void 0, s ?? {});
  }
  return a._$AI(t), a;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Z = globalThis;
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
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Ue(s, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return z;
  }
}
x._$litElement$ = !0, x.finalized = !0, Z.litElementHydrateSupport?.({ LitElement: x });
const Ie = Z.litElementPolyfillSupport;
Ie?.({ LitElement: x });
(Z.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Re = (t) => (e, s) => {
  s !== void 0 ? s.addInitializer(() => {
    customElements.define(t, e);
  }) : customElements.define(t, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Le = { attribute: !0, type: String, converter: D, reflect: !1, hasChanged: F }, Ge = (t = Le, e, s) => {
  const { kind: i, metadata: a } = s;
  let n = globalThis.litPropertyMetadata.get(a);
  if (n === void 0 && globalThis.litPropertyMetadata.set(a, n = /* @__PURE__ */ new Map()), i === "setter" && ((t = Object.create(t)).wrapped = !0), n.set(s.name, t), i === "accessor") {
    const { name: o } = s;
    return { set(c) {
      const r = e.get.call(this);
      e.set.call(this, c), this.requestUpdate(o, r, t, !0, c);
    }, init(c) {
      return c !== void 0 && this.C(o, void 0, t, c), c;
    } };
  }
  if (i === "setter") {
    const { name: o } = s;
    return function(c) {
      const r = this[o];
      e.call(this, c), this.requestUpdate(o, r, t, !0, c);
    };
  }
  throw Error("Unsupported decorator location: " + i);
};
function H(t) {
  return (e, s) => typeof s == "object" ? Ge(t, e, s) : ((i, a, n) => {
    const o = a.hasOwnProperty(n);
    return a.constructor.createProperty(n, i), o ? Object.getOwnPropertyDescriptor(a, n) : void 0;
  })(t, e, s);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function m(t) {
  return H({ ...t, state: !0, attribute: !1 });
}
const B = "unavailable", Be = "unknown", We = "off", Ve = /* @__PURE__ */ new Set([
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
]), Fe = /* @__PURE__ */ new Set([
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
]), me = (t) => t.substring(0, t.indexOf(".")), Ke = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_+|_+$)/g, "") || "_", qe = (t) => t.reduceRight(
  (e, s) => `var(${s}${e ? `, ${e}` : ""})`,
  void 0
);
function Ze(t, e) {
  const s = me(t.entity_id), i = t.state;
  if (Fe.has(s))
    return i !== B;
  if (i === B || i === Be || i === We && s !== "alert")
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
function Je(t, e, s, i) {
  const a = [], n = Ke(s), o = i ? "active" : "inactive";
  return e && a.push(`--state-${t}-${e}-${n}-color`), a.push(
    `--state-${t}-${n}-color`,
    `--state-${t}-${o}-color`,
    `--state-${o}-color`
  ), a;
}
function Qe(t, e) {
  const s = t.state;
  if (s === B)
    return "var(--state-unavailable-color)";
  const i = me(t.entity_id);
  if (!Ve.has(i))
    return;
  const a = Ze(t);
  return qe(
    Je(i, t.attributes.device_class, s, a)
  );
}
var Ye = Object.defineProperty, Xe = Object.getOwnPropertyDescriptor, _ = (t, e, s, i) => {
  for (var a = i > 1 ? void 0 : i ? Xe(e, s) : e, n = t.length - 1, o; n >= 0; n--)
    (o = t[n]) && (a = (i ? o(e, s, a) : o(a)) || a);
  return i && a && Ye(e, s, a), a;
};
const re = "grenton_objects", et = "Analiza projektu Grenton", k = {
  error: "#db4437",
  warn: "#f9a825",
  missing: "#3d70b2",
  ok: "#43a047",
  muted: "#9e9e9e"
}, tt = [
  { key: "push", label: "push" },
  { key: "polling", label: "polling" },
  { key: "brak", label: "brak" }
], st = [
  { key: "problem", label: "Problem" },
  { key: "ok", label: "OK" },
  { key: "missing", label: "Brak w HA" },
  { key: "unsupported", label: "Nieobsługiwany" }
], le = {
  light: "Światło (light)",
  switch: "Przełącznik (switch)",
  cover: "Roleta / napęd (cover)",
  climate: "Termostat (climate)",
  sensor: "Czujnik (sensor)",
  binary_sensor: "Czujnik binarny (binary_sensor)"
}, it = ["switch", "light", "cover", "climate", "sensor", "binary_sensor"], ce = {
  DOUT: ["switch", "light"],
  // relay: could drive a load or a lamp
  DIN: ["binary_sensor"],
  ROLLER_SHUTTER: ["cover"],
  ONEW_SENSOR: ["sensor"],
  Thermostat: ["climate"],
  LED_CHANNEL: ["light"],
  LEDRGB: ["light"],
  SatelInput: ["binary_sensor"],
  SatelOutput: ["switch"],
  SatelZone: ["switch"]
};
function G(t) {
  const e = t || "";
  return ce[e] ? ce[e] : e.startsWith("DALI") || e.startsWith("LED") ? ["light"] : it;
}
function he(t) {
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
const at = ["orphan", "push_wrong_object", "push_bad_service", "push_no_event", "poll_redundant", "not_in_ha"], nt = {
  light: "set_state / set_brightness / set_rgb / set_rgbw",
  switch: "set_state",
  binary_sensor: "set_state",
  cover: "set_cover",
  sensor: "set_value",
  climate: "set_therm_state / set_therm_target_temp"
};
function ot(t) {
  const e = new Uint8Array(t), s = 32768;
  let i = "";
  for (let a = 0; a < e.length; a += s)
    i += String.fromCharCode.apply(null, Array.from(e.subarray(a, a + s)));
  return btoa(i);
}
let u = class extends x {
  constructor() {
    super(...arguments), this.narrow = !1, this._busy = !1, this._busyName = "", this._summaryOpen = !1, this._addType = "", this._search = "", this._typeSel = /* @__PURE__ */ new Set(), this._updSel = /* @__PURE__ */ new Set(), this._statSel = /* @__PURE__ */ new Set(), this._entityIds = /* @__PURE__ */ new Set(), this._onColumnsChanged = (t) => {
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
    return [{ name: et, path: this.route?.prefix ?? `/${re}` }];
  }
  render() {
    return this._report ? this._reportView() : this._startView();
  }
  // ─── start view (upload) ────────────────────────────────────────────
  _startView() {
    const t = l`
      <div class="pad">
        <p class="intro">
          Wgraj plik projektu Object Managera (.omp). Zostanie porównany z aktualną
          konfiguracją Home Assistant — nic nie jest zmieniane.
        </p>
        ${this._uploadUI()}
        ${this._error ? l`<ha-alert alert-type="error" title="Błąd analizy" style="margin-top:16px">${this._error}</ha-alert>` : h}
      </div>
    `;
    return customElements.get("hass-tabs-subpage") ? l`<hass-tabs-subpage
        .hass=${this.hass}
        .narrow=${this.narrow}
        ?main-page=${!0}
        .route=${this.route ?? { prefix: "", path: "" }}
        .tabs=${this._tabs}
      >${t}</hass-tabs-subpage>` : t;
  }
  _uploadUI() {
    return customElements.get("ha-file-upload") ? l`<ha-file-upload
        .localize=${this.hass.localize}
        accept=".omp,.zip"
        .icon=${"mdi:folder-upload"}
        .label=${"Przeciągnij plik .omp lub kliknij, aby wybrać"}
        .supports=${"Plik projektu Object Managera (.omp / .zip)"}
        .uploading=${this._busy}
        @file-picked=${(t) => this._analyze(t.detail.files?.[0])}
      ></ha-file-upload>` : l`
      <ha-button raised @click=${this._pickFile}>Wybierz plik .omp</ha-button>
      <input type="file" accept=".omp,.zip" style="display:none" @change=${this._onFileInput} />
      ${this._busy ? l`<div style="margin-top:12px;color:var(--secondary-text-color)">Analizuję… (${this._busyName})</div>` : h}
    `;
  }
  // ─── report view (native subpage table) ─────────────────────────────
  _reportView() {
    const t = customElements.get("hass-tabs-subpage-data-table") ? this._subpage() : this._fallbackTable();
    return l`${t}${this._summaryDialog()}${this._issueDialog()}${this._addDialog()}`;
  }
  _subpage() {
    return l`
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
    return l`
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
    return l`
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
    return this._summaryOpen ? l`
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
    ].filter((a) => a.count > 0);
    return l`
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
          ${Object.keys(e.per_domain).sort((a, n) => e.per_domain[n].push + e.per_domain[n].polling - (e.per_domain[a].push + e.per_domain[a].polling)).map((a) => l`<li>${a}: ${e.per_domain[a].push} push / ${e.per_domain[a].polling} polling</li>`)}
        </ul>

        <h4>Problemy${i.length ? "" : " — brak"}</h4>
        ${i.length ? l`<ul class="problems">
              ${i.map((a) => {
      const n = a.sev === "error" || a.sev === "warn" ? "active-error" : "";
      return l`<li class=${n} style=${`color:${k[a.sev]}`}>${a.count} ${a.label}</li>`;
    })}
            </ul>` : h}
        ${t.not_in_ha.length ? l`<div style="color:${k.missing};margin-top:4px">
              ${t.not_in_ha.length} obiektów Grentona nieobecnych w HA
              (${t.not_in_ha_by_type.map(([a, n]) => `${n}× ${a}`).join(", ")})
            </div>` : h}

        ${t.scaffolding ? this._scaffold(t.scaffolding) : h}
      </div>
    `;
  }
  _scaffold(t) {
    return l`
      <h4>Konfiguracja po stronie Grentona</h4>
      ${t.push_used ? h : l`<div style="color:var(--secondary-text-color);font-size:0.9em">Push nieużywany — obiekty kolejki nie są wymagane.</div>`}
      <ul>
        ${t.checks.map((e) => {
      let s = k.ok, i = "obecny";
      return e.present || (e.required ? (s = k.error, i = "BRAK (wymagane)") : (s = k.muted, i = "brak (opcjonalne)")), l`<li style=${`color:${s}`}>${e.name} — ${e.desc}: ${i}</li>`;
    })}
      </ul>
    `;
  }
  // ─── table data + columns ──────────────────────────────────────────────
  get _viewRows() {
    return (this._report?.merged ?? []).map((s, i) => {
      const a = he(s), n = s.in_ha ? s.mode ?? "brak" : "brak", o = s.in_ha ? s.mode === "polling" ? `polling (${s.interval ?? "?"} s)` : "push" : "brak", c = s.clu || (s.grenton_id?.includes("->") ? s.grenton_id.split("->")[0] : "") || "—", r = s.flags.find((p) => at.includes(p)) ?? (s.is_unsupported ? "unsupported" : s.in_ha ? "ok" : "not_in_ha");
      return {
        id: s.grenton_id || s.entity_id || String(i),
        name: s.om_name || s.ha_name || "",
        grenton_id: s.grenton_id || "",
        clu: c,
        module: s.module || "—",
        type: s.om_type || s.device_type || "—",
        entity_id: s.entity_id || "",
        entry_id: s.entry_id || "",
        domain: s.entity_id ? s.entity_id.split(".")[0] : "—",
        update: o,
        updateCat: n,
        status: a.label,
        sev: a.sev,
        statusCat: a.cat,
        flag: r
      };
    }).filter((s) => !(this._typeSel.size && !this._typeSel.has(s.type) || this._updSel.size && !this._updSel.has(s.updateCat) || this._statSel.size && !this._statSel.has(s.statusCat)));
  }
  _columns() {
    return {
      name: { title: "Nazwa (Grenton)", main: !0, sortable: !0, filterable: !0, flex: 2 },
      grenton_id: { title: "Grenton ID", sortable: !0, filterable: !0, hideable: !0, width: "160px" },
      clu: { title: "CLU", sortable: !0, filterable: !0, groupable: !0, hideable: !0, defaultHidden: !0 },
      module: { title: "Moduł", sortable: !0, filterable: !0, groupable: !0, hideable: !0, defaultHidden: !0 },
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
    if (!t.entity_id) return l`<span style="color:var(--secondary-text-color)">—</span>`;
    const e = this.hass?.states?.[t.entity_id], s = e ? Qe(e) ?? "var(--secondary-text-color)" : "var(--secondary-text-color)", i = e ? this._formatState(e) : "niedostępna";
    return l`
      <span class="entity" @click=${() => this._moreInfo(t.entity_id)}>
        ${e ? l`<ha-state-icon .stateObj=${e} style=${`color:${s}`}></ha-state-icon>` : h}
        <span>${t.entity_id}<span style="color:var(--secondary-text-color)"> · ${i}</span></span>
      </span>
    `;
  }
  _statusCell(t) {
    const e = l`<ha-label dense .color=${k[t.sev]}>${t.status}</ha-label>`;
    return t.flag === "ok" ? e : l`<span
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
          { h: "Czego oczekiwano", body: `Dla typu „${e}" akcja powinna być: ${nt[e] || "właściwa dla typu encji"}.` },
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
          { h: "Jak dodać", body: `Wybierz typ encji i kliknij „Dodaj do HA" — encja powstanie z pollingiem (adres bramki jak w pozostałych obiektach). Domyślny typ to podpowiedź dla „${t.type}"; DOUT bywa światłem lub przełącznikiem — zmień, jeśli trzeba. Aktualizację przez push skonfigurujesz później w OM.` }
        ] };
    }
  }
  _issueDialog() {
    const t = this._issue;
    if (!t) return h;
    const e = this._issueDetails(t);
    return l`
      <ha-dialog open .headerTitle=${t.status} @closed=${() => this._issue = void 0}>
        <div class="issue">
          ${e.sections.map((s) => l`<div class="issue-sec"><div class="issue-h">${s.h}</div><div>${s.body}</div></div>`)}
          ${t.flag === "poll_redundant" && t.entry_id ? l`<div class="issue-action">
                <ha-button appearance="accent" size="small" @click=${() => this._fixDisablePolling(t)}>
                  Napraw: wyłącz polling
                </ha-button>
              </div>` : h}
          ${t.flag === "not_in_ha" && t.grenton_id ? l`<div class="issue-action">
                <ha-button appearance="accent" size="small" @click=${() => this._openAdd(t)}>
                  Dodaj do HA…
                </ha-button>
              </div>` : h}
        </div>
        <div slot="footer" class="dialog-footer">
          ${t.entry_id ? l`<ha-button appearance="plain" @click=${() => {
      this._issue = void 0, this._openConfig(t.entry_id);
    }}>
                Konfiguruj encję
              </ha-button>` : h}
          <ha-button appearance="plain" data-dialog="close">Zamknij</ha-button>
        </div>
      </ha-dialog>
    `;
  }
  // ─── repair actions (HA-side) ──────────────────────────────────────────
  async _fixDisablePolling(t) {
    if (t.entry_id) {
      this._issue = void 0;
      try {
        await this.hass.connection.sendMessagePromise({
          type: "grenton_objects/set_auto_update",
          entry_id: t.entry_id,
          auto_update: !1
        }), await this._reanalyze(), this._toast(`Wyłączono polling dla ${t.entity_id} — aktualizacja tylko przez push.`);
      } catch (e) {
        this._toast(`Nie udało się: ${e?.message || e?.code || "błąd"}`);
      }
    }
  }
  // Open the add/confirm dialog for a Grenton object missing in HA. The device
  // type is preselected to the first type valid for its OM type.
  _openAdd(t) {
    this._addType = G(t.type)[0], this._addRow = t, this._issue = void 0;
  }
  _addSummary(t, e) {
    return [
      { label: "Nowa encja w HA", value: le[e] ?? e },
      { label: "Obiekt Grenton", value: `${t.grenton_id} · typ ${t.type}` },
      { label: "Nazwa", value: t.name || t.grenton_id },
      { label: "Adres bramki", value: "jak w pozostałych obiektach Grenton" },
      { label: "Aktualizacja", value: "polling co 30 s (push ustawisz później w OM)" }
    ];
  }
  _addDialog() {
    const t = this._addRow;
    if (!t) return h;
    const e = G(t.type), s = this._addType || e[0];
    return l`
      <ha-dialog open .headerTitle=${"Dodaj obiekt do HA"} @closed=${() => this._addRow = void 0}>
        <div class="add-dialog">
          ${e.length > 1 ? l`
                <ha-select
                  label="Typ encji w HA"
                  .value=${s}
                  naturalMenuWidth
                  fixedMenuPosition
                  @selected=${(i) => this._addType = i.target.value}
                  @closed=${(i) => i.stopPropagation()}
                >
                  ${e.map((i) => l`<ha-list-item .value=${i}>${le[i]}</ha-list-item>`)}
                </ha-select>
                <p class="add-hint">Typ „${t.type}" można wystawić na kilka sposobów — wybierz właściwy.</p>
              ` : h}
          <p class="add-hint">Po potwierdzeniu zostanie wykonane:</p>
          <ha-list>
            ${this._addSummary(t, s).map(
      (i) => l`<ha-list-item twoline noninteractive>
                <span>${i.value}</span>
                <span slot="secondary">${i.label}</span>
              </ha-list-item>`
    )}
          </ha-list>
        </div>
        <div slot="footer" class="dialog-footer">
          <ha-button appearance="plain" data-dialog="close">Anuluj</ha-button>
          <ha-button appearance="accent" @click=${() => this._confirmAddObject(t)}>Dodaj do HA</ha-button>
        </div>
      </ha-dialog>
    `;
  }
  async _confirmAddObject(t) {
    if (!t.grenton_id) return;
    const e = this._addType || G(t.type)[0];
    this._addRow = void 0;
    try {
      await this.hass.connection.sendMessagePromise({
        type: "grenton_objects/add_object",
        grenton_id: t.grenton_id,
        device_type: e,
        om_type: t.type,
        name: t.name
      }), await this._reanalyze(), this._toast(`Dodano „${t.name || t.grenton_id}" do HA jako ${e}.`);
    } catch (s) {
      this._toast(`Nie udało się dodać: ${s?.message || s?.code || "błąd"}`);
    }
  }
  _toast(t) {
    this.dispatchEvent(new CustomEvent("hass-notification", { detail: { message: t }, bubbles: !0, composed: !0 }));
  }
  _actionsCell(t) {
    return t.entry_id ? l`<ha-icon
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
    const t = this._report, e = (n) => {
      const o = {};
      for (const c of this._allViewRows()) o[c[n]] = (o[c[n]] || 0) + 1;
      return o;
    }, s = t.type_summary.map((n) => ({ key: n.type, label: `${n.type} (${n.count})${n.supported ? "" : " · nieobsł."}` })), i = e("updateCat"), a = e("statusCat");
    return l`
      ${this._filterGroup("Typ Grenton", s, this._typeSel, "type")}
      ${this._filterGroup("Aktualizacja", tt.map((n) => ({ key: n.key, label: `${n.label} (${i[n.key] || 0})` })), this._updSel, "upd")}
      ${this._filterGroup("Status", st.map((n) => ({ key: n.key, label: `${n.label} (${a[n.key] || 0})` })), this._statSel, "stat")}
    `;
  }
  _allViewRows() {
    return (this._report?.merged ?? []).map((e) => {
      const s = he(e);
      return {
        id: "",
        name: "",
        grenton_id: "",
        clu: "",
        module: "",
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
    return l`
      <ha-expansion-panel slot="filter-pane" outlined .expanded=${s.size > 0}>
        <div slot="header" class="filter-header">
          <span>${t}</span>
          ${s.size ? l`<span class="badge">${s.size}</span>
                <ha-icon
                  class="filter-clear"
                  icon="mdi:filter-variant-remove"
                  @click=${(a) => {
      a.stopPropagation(), this._setSel(i, /* @__PURE__ */ new Set());
    }}
                ></ha-icon>` : h}
        </div>
        <ha-list multi @selected=${(a) => this._onListSelected(a, i, e)}>
          ${e.map(
      (a) => l`<ha-check-list-item .value=${a.key} .selected=${s.has(a.key)}>${a.label}</ha-check-list-item>`
    )}
        </ha-list>
      </ha-expansion-panel>
    `;
  }
  _onListSelected(t, e, s) {
    const i = t?.detail?.index, a = i instanceof Set ? Array.from(i) : typeof i == "number" ? [i] : [], n = /* @__PURE__ */ new Set();
    a.forEach((o) => {
      s[o] && n.add(s[o].key);
    }), this._setSel(e, n);
  }
  _setSel(t, e) {
    t === "type" ? this._typeSel = e : t === "upd" ? this._updSel = e : this._statSel = e;
  }
  _defaultTypeSel() {
    const t = this._report?.type_summary ?? [];
    return new Set(t.filter((e) => e.supported && e.type !== "DIN").map((e) => e.type));
  }
  async _analyze(t) {
    if (!t) return;
    this._busyName = t.name;
    const e = await t.arrayBuffer();
    this._lastOmp = ot(e), await this._doAnalyze(!0);
  }
  // Re-run the analysis on the last uploaded .omp. Used after a repair action so
  // the summary AND the table reflect the changed HA config (the backend reads
  // the live config on every analyze) — resolved issues disappear.
  async _reanalyze() {
    this._lastOmp && await this._doAnalyze(!1);
  }
  async _doAnalyze(t) {
    if (this._lastOmp) {
      this._error = void 0, this._busy = !0;
      try {
        const e = await this.hass.connection.sendMessagePromise({
          type: "grenton_objects/analyze",
          omp_base64: this._lastOmp
        });
        this._report = e, this._entityIds = new Set(e.merged.map((s) => s.entity_id).filter((s) => !!s)), t && (this._typeSel = this._defaultTypeSel(), this._updSel = /* @__PURE__ */ new Set(), this._statSel = /* @__PURE__ */ new Set());
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
u.styles = ge`
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
    .add-dialog ha-select { width: 100%; }
    .add-hint { color: var(--secondary-text-color); margin: 12px 0 4px; }
    .dialog-footer { display: flex; gap: var(--ha-space-3, 12px); justify-content: flex-end; align-items: center; flex-wrap: wrap; padding: 8px 24px 16px; }
  `;
_([
  H({ attribute: !1 })
], u.prototype, "hass", 2);
_([
  H({ attribute: !1 })
], u.prototype, "narrow", 2);
_([
  H({ attribute: !1 })
], u.prototype, "route", 2);
_([
  H({ attribute: !1 })
], u.prototype, "panel", 2);
_([
  m()
], u.prototype, "_report", 2);
_([
  m()
], u.prototype, "_error", 2);
_([
  m()
], u.prototype, "_busy", 2);
_([
  m()
], u.prototype, "_busyName", 2);
_([
  m()
], u.prototype, "_summaryOpen", 2);
_([
  m()
], u.prototype, "_issue", 2);
_([
  m()
], u.prototype, "_addRow", 2);
_([
  m()
], u.prototype, "_addType", 2);
_([
  m()
], u.prototype, "_columnOrder", 2);
_([
  m()
], u.prototype, "_hiddenColumns", 2);
_([
  m()
], u.prototype, "_search", 2);
_([
  m()
], u.prototype, "_typeSel", 2);
_([
  m()
], u.prototype, "_updSel", 2);
_([
  m()
], u.prototype, "_statSel", 2);
u = _([
  Re("grenton-objects-panel")
], u);
export {
  u as GrentonObjectsPanel
};
