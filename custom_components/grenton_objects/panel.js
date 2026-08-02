/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const N = globalThis, B = N.ShadowRoot && (N.ShadyCSS === void 0 || N.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, W = Symbol(), J = /* @__PURE__ */ new WeakMap();
let he = class {
  constructor(e, i, s) {
    if (this._$cssResult$ = !0, s !== W) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = i;
  }
  get styleSheet() {
    let e = this.o;
    const i = this.t;
    if (B && e === void 0) {
      const s = i !== void 0 && i.length === 1;
      s && (e = J.get(i)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), s && J.set(i, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const be = (t) => new he(typeof t == "string" ? t : t + "", void 0, W), $e = (t, ...e) => {
  const i = t.length === 1 ? t[0] : e.reduce((s, n, a) => s + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(n) + t[a + 1], t[0]);
  return new he(i, t, W);
}, fe = (t, e) => {
  if (B) t.adoptedStyleSheets = e.map((i) => i instanceof CSSStyleSheet ? i : i.styleSheet);
  else for (const i of e) {
    const s = document.createElement("style"), n = N.litNonce;
    n !== void 0 && s.setAttribute("nonce", n), s.textContent = i.cssText, t.appendChild(s);
  }
}, Y = B ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((e) => {
  let i = "";
  for (const s of e.cssRules) i += s.cssText;
  return be(i);
})(t) : t;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: ve, defineProperty: we, getOwnPropertyDescriptor: ke, getOwnPropertyNames: Ae, getOwnPropertySymbols: ze, getPrototypeOf: je } = Object, I = globalThis, Q = I.trustedTypes, Se = Q ? Q.emptyScript : "", Ee = I.reactiveElementPolyfillSupport, E = (t, e) => t, U = { toAttribute(t, e) {
  switch (e) {
    case Boolean:
      t = t ? Se : null;
      break;
    case Object:
    case Array:
      t = t == null ? t : JSON.stringify(t);
  }
  return t;
}, fromAttribute(t, e) {
  let i = t;
  switch (e) {
    case Boolean:
      i = t !== null;
      break;
    case Number:
      i = t === null ? null : Number(t);
      break;
    case Object:
    case Array:
      try {
        i = JSON.parse(t);
      } catch {
        i = null;
      }
  }
  return i;
} }, V = (t, e) => !ve(t, e), X = { attribute: !0, type: String, converter: U, reflect: !1, useDefault: !1, hasChanged: V };
Symbol.metadata ??= Symbol("metadata"), I.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let A = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, i = X) {
    if (i.state && (i.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((i = Object.create(i)).wrapped = !0), this.elementProperties.set(e, i), !i.noAccessor) {
      const s = Symbol(), n = this.getPropertyDescriptor(e, s, i);
      n !== void 0 && we(this.prototype, e, n);
    }
  }
  static getPropertyDescriptor(e, i, s) {
    const { get: n, set: a } = ke(this.prototype, e) ?? { get() {
      return this[i];
    }, set(o) {
      this[i] = o;
    } };
    return { get: n, set(o) {
      const d = n?.call(this);
      a?.call(this, o), this.requestUpdate(e, d, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? X;
  }
  static _$Ei() {
    if (this.hasOwnProperty(E("elementProperties"))) return;
    const e = je(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(E("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(E("properties"))) {
      const i = this.properties, s = [...Ae(i), ...ze(i)];
      for (const n of s) this.createProperty(n, i[n]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const i = litPropertyMetadata.get(e);
      if (i !== void 0) for (const [s, n] of i) this.elementProperties.set(s, n);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [i, s] of this.elementProperties) {
      const n = this._$Eu(i, s);
      n !== void 0 && this._$Eh.set(n, i);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const i = [];
    if (Array.isArray(e)) {
      const s = new Set(e.flat(1 / 0).reverse());
      for (const n of s) i.unshift(Y(n));
    } else e !== void 0 && i.push(Y(e));
    return i;
  }
  static _$Eu(e, i) {
    const s = i.attribute;
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
    const e = /* @__PURE__ */ new Map(), i = this.constructor.elementProperties;
    for (const s of i.keys()) this.hasOwnProperty(s) && (e.set(s, this[s]), delete this[s]);
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
  attributeChangedCallback(e, i, s) {
    this._$AK(e, s);
  }
  _$ET(e, i) {
    const s = this.constructor.elementProperties.get(e), n = this.constructor._$Eu(e, s);
    if (n !== void 0 && s.reflect === !0) {
      const a = (s.converter?.toAttribute !== void 0 ? s.converter : U).toAttribute(i, s.type);
      this._$Em = e, a == null ? this.removeAttribute(n) : this.setAttribute(n, a), this._$Em = null;
    }
  }
  _$AK(e, i) {
    const s = this.constructor, n = s._$Eh.get(e);
    if (n !== void 0 && this._$Em !== n) {
      const a = s.getPropertyOptions(n), o = typeof a.converter == "function" ? { fromAttribute: a.converter } : a.converter?.fromAttribute !== void 0 ? a.converter : U;
      this._$Em = n;
      const d = o.fromAttribute(i, a.type);
      this[n] = d ?? this._$Ej?.get(n) ?? d, this._$Em = null;
    }
  }
  requestUpdate(e, i, s, n = !1, a) {
    if (e !== void 0) {
      const o = this.constructor;
      if (n === !1 && (a = this[e]), s ??= o.getPropertyOptions(e), !((s.hasChanged ?? V)(a, i) || s.useDefault && s.reflect && a === this._$Ej?.get(e) && !this.hasAttribute(o._$Eu(e, s)))) return;
      this.C(e, i, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, i, { useDefault: s, reflect: n, wrapped: a }, o) {
    s && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, o ?? i ?? this[e]), a !== !0 || o !== void 0) || (this._$AL.has(e) || (this.hasUpdated || s || (i = void 0), this._$AL.set(e, i)), n === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (i) {
      Promise.reject(i);
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
      const s = this.constructor.elementProperties;
      if (s.size > 0) for (const [n, a] of s) {
        const { wrapped: o } = a, d = this[n];
        o !== !0 || this._$AL.has(n) || d === void 0 || this.C(n, void 0, a, d);
      }
    }
    let e = !1;
    const i = this._$AL;
    try {
      e = this.shouldUpdate(i), e ? (this.willUpdate(i), this._$EO?.forEach((s) => s.hostUpdate?.()), this.update(i)) : this._$EM();
    } catch (s) {
      throw e = !1, this._$EM(), s;
    }
    e && this._$AE(i);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    this._$EO?.forEach((i) => i.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
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
    this._$Eq &&= this._$Eq.forEach((i) => this._$ET(i, this[i])), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
A.elementStyles = [], A.shadowRootOptions = { mode: "open" }, A[E("elementProperties")] = /* @__PURE__ */ new Map(), A[E("finalized")] = /* @__PURE__ */ new Map(), Ee?.({ ReactiveElement: A }), (I.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Z = globalThis, ee = (t) => t, L = Z.trustedTypes, te = L ? L.createPolicy("lit-html", { createHTML: (t) => t }) : void 0, ue = "$lit$", $ = `lit$${Math.random().toFixed(9).slice(2)}$`, _e = "?" + $, xe = `<${_e}>`, w = document, O = () => w.createComment(""), C = (t) => t === null || typeof t != "object" && typeof t != "function", q = Array.isArray, Oe = (t) => q(t) || typeof t?.[Symbol.iterator] == "function", H = `[ 	
\f\r]`, S = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, ie = /-->/g, se = />/g, f = RegExp(`>|${H}(?:([^\\s"'>=/]+)(${H}*=${H}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), ne = /'/g, ae = /"/g, me = /^(?:script|style|textarea|title)$/i, Ce = (t) => (e, ...i) => ({ _$litType$: t, strings: e, values: i }), r = Ce(1), z = Symbol.for("lit-noChange"), c = Symbol.for("lit-nothing"), oe = /* @__PURE__ */ new WeakMap(), v = w.createTreeWalker(w, 129);
function ye(t, e) {
  if (!q(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return te !== void 0 ? te.createHTML(e) : e;
}
const De = (t, e) => {
  const i = t.length - 1, s = [];
  let n, a = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", o = S;
  for (let d = 0; d < i; d++) {
    const l = t[d];
    let _, y, p = -1, g = 0;
    for (; g < l.length && (o.lastIndex = g, y = o.exec(l), y !== null); ) g = o.lastIndex, o === S ? y[1] === "!--" ? o = ie : y[1] !== void 0 ? o = se : y[2] !== void 0 ? (me.test(y[2]) && (n = RegExp("</" + y[2], "g")), o = f) : y[3] !== void 0 && (o = f) : o === f ? y[0] === ">" ? (o = n ?? S, p = -1) : y[1] === void 0 ? p = -2 : (p = o.lastIndex - y[2].length, _ = y[1], o = y[3] === void 0 ? f : y[3] === '"' ? ae : ne) : o === ae || o === ne ? o = f : o === ie || o === se ? o = S : (o = f, n = void 0);
    const b = o === f && t[d + 1].startsWith("/>") ? " " : "";
    a += o === S ? l + xe : p >= 0 ? (s.push(_), l.slice(0, p) + ue + l.slice(p) + $ + b) : l + $ + (p === -2 ? d : b);
  }
  return [ye(t, a + (t[i] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), s];
};
class D {
  constructor({ strings: e, _$litType$: i }, s) {
    let n;
    this.parts = [];
    let a = 0, o = 0;
    const d = e.length - 1, l = this.parts, [_, y] = De(e, i);
    if (this.el = D.createElement(_, s), v.currentNode = this.el.content, i === 2 || i === 3) {
      const p = this.el.content.firstChild;
      p.replaceWith(...p.childNodes);
    }
    for (; (n = v.nextNode()) !== null && l.length < d; ) {
      if (n.nodeType === 1) {
        if (n.hasAttributes()) for (const p of n.getAttributeNames()) if (p.endsWith(ue)) {
          const g = y[o++], b = n.getAttribute(p).split($), R = /([.?@])?(.*)/.exec(g);
          l.push({ type: 1, index: a, name: R[2], strings: b, ctor: R[1] === "." ? Te : R[1] === "?" ? Re : R[1] === "@" ? Ne : M }), n.removeAttribute(p);
        } else p.startsWith($) && (l.push({ type: 6, index: a }), n.removeAttribute(p));
        if (me.test(n.tagName)) {
          const p = n.textContent.split($), g = p.length - 1;
          if (g > 0) {
            n.textContent = L ? L.emptyScript : "";
            for (let b = 0; b < g; b++) n.append(p[b], O()), v.nextNode(), l.push({ type: 2, index: ++a });
            n.append(p[g], O());
          }
        }
      } else if (n.nodeType === 8) if (n.data === _e) l.push({ type: 2, index: a });
      else {
        let p = -1;
        for (; (p = n.data.indexOf($, p + 1)) !== -1; ) l.push({ type: 7, index: a }), p += $.length - 1;
      }
      a++;
    }
  }
  static createElement(e, i) {
    const s = w.createElement("template");
    return s.innerHTML = e, s;
  }
}
function j(t, e, i = t, s) {
  if (e === z) return e;
  let n = s !== void 0 ? i._$Co?.[s] : i._$Cl;
  const a = C(e) ? void 0 : e._$litDirective$;
  return n?.constructor !== a && (n?._$AO?.(!1), a === void 0 ? n = void 0 : (n = new a(t), n._$AT(t, i, s)), s !== void 0 ? (i._$Co ??= [])[s] = n : i._$Cl = n), n !== void 0 && (e = j(t, n._$AS(t, e.values), n, s)), e;
}
class Pe {
  constructor(e, i) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = i;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: i }, parts: s } = this._$AD, n = (e?.creationScope ?? w).importNode(i, !0);
    v.currentNode = n;
    let a = v.nextNode(), o = 0, d = 0, l = s[0];
    for (; l !== void 0; ) {
      if (o === l.index) {
        let _;
        l.type === 2 ? _ = new P(a, a.nextSibling, this, e) : l.type === 1 ? _ = new l.ctor(a, l.name, l.strings, this, e) : l.type === 6 && (_ = new Ue(a, this, e)), this._$AV.push(_), l = s[++d];
      }
      o !== l?.index && (a = v.nextNode(), o++);
    }
    return v.currentNode = w, n;
  }
  p(e) {
    let i = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(e, s, i), i += s.strings.length - 2) : s._$AI(e[i])), i++;
  }
}
class P {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, i, s, n) {
    this.type = 2, this._$AH = c, this._$AN = void 0, this._$AA = e, this._$AB = i, this._$AM = s, this.options = n, this._$Cv = n?.isConnected ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const i = this._$AM;
    return i !== void 0 && e?.nodeType === 11 && (e = i.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, i = this) {
    e = j(this, e, i), C(e) ? e === c || e == null || e === "" ? (this._$AH !== c && this._$AR(), this._$AH = c) : e !== this._$AH && e !== z && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Oe(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== c && C(this._$AH) ? this._$AA.nextSibling.data = e : this.T(w.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: i, _$litType$: s } = e, n = typeof s == "number" ? this._$AC(e) : (s.el === void 0 && (s.el = D.createElement(ye(s.h, s.h[0]), this.options)), s);
    if (this._$AH?._$AD === n) this._$AH.p(i);
    else {
      const a = new Pe(n, this), o = a.u(this.options);
      a.p(i), this.T(o), this._$AH = a;
    }
  }
  _$AC(e) {
    let i = oe.get(e.strings);
    return i === void 0 && oe.set(e.strings, i = new D(e)), i;
  }
  k(e) {
    q(this._$AH) || (this._$AH = [], this._$AR());
    const i = this._$AH;
    let s, n = 0;
    for (const a of e) n === i.length ? i.push(s = new P(this.O(O()), this.O(O()), this, this.options)) : s = i[n], s._$AI(a), n++;
    n < i.length && (this._$AR(s && s._$AB.nextSibling, n), i.length = n);
  }
  _$AR(e = this._$AA.nextSibling, i) {
    for (this._$AP?.(!1, !0, i); e !== this._$AB; ) {
      const s = ee(e).nextSibling;
      ee(e).remove(), e = s;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class M {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, i, s, n, a) {
    this.type = 1, this._$AH = c, this._$AN = void 0, this.element = e, this.name = i, this._$AM = n, this.options = a, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = c;
  }
  _$AI(e, i = this, s, n) {
    const a = this.strings;
    let o = !1;
    if (a === void 0) e = j(this, e, i, 0), o = !C(e) || e !== this._$AH && e !== z, o && (this._$AH = e);
    else {
      const d = e;
      let l, _;
      for (e = a[0], l = 0; l < a.length - 1; l++) _ = j(this, d[s + l], i, l), _ === z && (_ = this._$AH[l]), o ||= !C(_) || _ !== this._$AH[l], _ === c ? e = c : e !== c && (e += (_ ?? "") + a[l + 1]), this._$AH[l] = _;
    }
    o && !n && this.j(e);
  }
  j(e) {
    e === c ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class Te extends M {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === c ? void 0 : e;
  }
}
class Re extends M {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== c);
  }
}
class Ne extends M {
  constructor(e, i, s, n, a) {
    super(e, i, s, n, a), this.type = 5;
  }
  _$AI(e, i = this) {
    if ((e = j(this, e, i, 0) ?? c) === z) return;
    const s = this._$AH, n = e === c && s !== c || e.capture !== s.capture || e.once !== s.once || e.passive !== s.passive, a = e !== c && (s === c || n);
    n && this.element.removeEventListener(this.name, this, s), a && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class Ue {
  constructor(e, i, s) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = i, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    j(this, e);
  }
}
const Le = Z.litHtmlPolyfillSupport;
Le?.(D, P), (Z.litHtmlVersions ??= []).push("3.3.3");
const Ie = (t, e, i) => {
  const s = i?.renderBefore ?? e;
  let n = s._$litPart$;
  if (n === void 0) {
    const a = i?.renderBefore ?? null;
    s._$litPart$ = n = new P(e.insertBefore(O(), a), a, void 0, i ?? {});
  }
  return n._$AI(t), n;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const K = globalThis;
class x extends A {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const i = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Ie(i, this.renderRoot, this.renderOptions);
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
x._$litElement$ = !0, x.finalized = !0, K.litElementHydrateSupport?.({ LitElement: x });
const Me = K.litElementPolyfillSupport;
Me?.({ LitElement: x });
(K.litElementVersions ??= []).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const He = (t) => (e, i) => {
  i !== void 0 ? i.addInitializer(() => {
    customElements.define(t, e);
  }) : customElements.define(t, e);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Fe = { attribute: !0, type: String, converter: U, reflect: !1, hasChanged: V }, Ge = (t = Fe, e, i) => {
  const { kind: s, metadata: n } = i;
  let a = globalThis.litPropertyMetadata.get(n);
  if (a === void 0 && globalThis.litPropertyMetadata.set(n, a = /* @__PURE__ */ new Map()), s === "setter" && ((t = Object.create(t)).wrapped = !0), a.set(i.name, t), s === "accessor") {
    const { name: o } = i;
    return { set(d) {
      const l = e.get.call(this);
      e.set.call(this, d), this.requestUpdate(o, l, t, !0, d);
    }, init(d) {
      return d !== void 0 && this.C(o, void 0, t, d), d;
    } };
  }
  if (s === "setter") {
    const { name: o } = i;
    return function(d) {
      const l = this[o];
      e.call(this, d), this.requestUpdate(o, l, t, !0, d);
    };
  }
  throw Error("Unsupported decorator location: " + s);
};
function T(t) {
  return (e, i) => typeof i == "object" ? Ge(t, e, i) : ((s, n, a) => {
    const o = n.hasOwnProperty(a);
    return n.constructor.createProperty(a, s), o ? Object.getOwnPropertyDescriptor(n, a) : void 0;
  })(t, e, i);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function m(t) {
  return T({ ...t, state: !0, attribute: !1 });
}
const G = "unavailable", Be = "unknown", We = "off", Ve = /* @__PURE__ */ new Set([
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
]), Ze = /* @__PURE__ */ new Set([
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
]), ge = (t) => t.substring(0, t.indexOf(".")), qe = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_+|_+$)/g, "") || "_", Ke = (t) => t.reduceRight(
  (e, i) => `var(${i}${e ? `, ${e}` : ""})`,
  void 0
);
function Je(t, e) {
  const i = ge(t.entity_id), s = t.state;
  if (Ze.has(i))
    return s !== G;
  if (s === G || s === Be || s === We && i !== "alert")
    return !1;
  switch (i) {
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
function Ye(t, e, i, s) {
  const n = [], a = qe(i), o = s ? "active" : "inactive";
  return e && n.push(`--state-${t}-${e}-${a}-color`), n.push(
    `--state-${t}-${a}-color`,
    `--state-${t}-${o}-color`,
    `--state-${o}-color`
  ), n;
}
function Qe(t, e) {
  const i = t.state;
  if (i === G)
    return "var(--state-unavailable-color)";
  const s = ge(t.entity_id);
  if (!Ve.has(s))
    return;
  const n = Je(t);
  return Ke(
    Ye(s, t.attributes.device_class, i, n)
  );
}
var Xe = Object.defineProperty, et = Object.getOwnPropertyDescriptor, u = (t, e, i, s) => {
  for (var n = s > 1 ? void 0 : s ? et(e, i) : e, a = t.length - 1, o; a >= 0; a--)
    (o = t[a]) && (n = (s ? o(e, i, n) : o(n)) || n);
  return s && n && Xe(e, i, n), n;
};
const tt = /* @__PURE__ */ new Set([
  "DALI_GEAR",
  "DALI_GEAR_DT8",
  "ROLLER_SHUTTER",
  "DIN",
  "SatelInput",
  "SatelOutput",
  "SatelZone",
  "DOUT",
  "LED_CHANNEL",
  "ONEW_SENSOR",
  "ANALOG_OUT",
  "ANALOG_IN"
]);
function it(t) {
  const e = t || "";
  return tt.has(e) || e.startsWith("DALI") && !e.includes("MASTER");
}
const re = "grenton_objects", st = "Analiza projektu Grenton", k = {
  error: "#db4437",
  warn: "#f9a825",
  missing: "#3d70b2",
  ok: "#43a047",
  muted: "#9e9e9e"
}, nt = [
  { key: "push", label: "push" },
  { key: "polling", label: "polling" },
  { key: "brak", label: "brak" }
], at = [
  { key: "problem", label: "Problem" },
  { key: "ok", label: "OK" },
  { key: "missing", label: "Brak w HA" },
  { key: "unsupported", label: "Nieobsługiwany" }
], ot = {
  light: "Światło (light)",
  switch: "Przełącznik (switch)",
  cover: "Roleta / napęd (cover)",
  climate: "Termostat (climate)",
  sensor: "Czujnik (sensor)",
  binary_sensor: "Czujnik binarny (binary_sensor)"
}, rt = [
  "switch",
  "light",
  "cover",
  "climate",
  "sensor",
  "binary_sensor"
], le = {
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
function F(t) {
  const e = t || "";
  return le[e] ? le[e] : e.startsWith("DALI") || e.startsWith("LED") ? ["light"] : rt;
}
const lt = {
  name: "Nazwa encji",
  device_type: "Typ encji w HA",
  grenton_type: "Typ Grenton",
  api_endpoint: "Adres bramki (API)",
  grenton_id: "Grenton ID",
  device_class: "Klasa urządzenia",
  reversed: "Odwróć kierunek",
  auto_update: "Automatyczne odświeżanie (polling)",
  update_interval: "Częstotliwość odświeżania (s)"
}, ct = [
  "shutter",
  "blind",
  "curtain",
  "awning",
  "garage",
  "gate",
  "window",
  "door",
  "damper",
  "shade"
], ce = {
  light: [
    "DOUT",
    "DALI",
    "DIMMER",
    "LED",
    "RGB",
    "RGB+W",
    "LED_R",
    "LED_G",
    "LED_B",
    "LED_W",
    "LED_CHANNEL"
  ],
  switch: ["DOUT", "SATEL_OUTPUT", "SATEL_ZONE"],
  binary_sensor: ["DIN", "SATEL_INPUT"],
  sensor: [
    "DEFAULT_SENSOR",
    "MODBUS_RTU",
    "MODBUS_VALUE",
    "MODBUS",
    "MODBUS_CLIENT",
    "MODBUS_SERVER",
    "MODBUS_SLAVE_RTU",
    "RELAY_POWER",
    "ANALOG_SCALED_VALUE_OR_VALUE_%"
  ]
};
function de(t, e) {
  const i = e || "";
  return t === "binary_sensor" ? i === "SatelInput" ? "SATEL_INPUT" : "DIN" : t === "switch" ? i === "SatelZone" ? "SATEL_ZONE" : i === "SatelOutput" ? "SATEL_OUTPUT" : "DOUT" : t === "light" ? i.startsWith("DALI") ? "DALI" : i === "LEDRGB" ? "RGB" : i === "LED_CHANNEL" ? "LED_CHANNEL" : i.startsWith("LED") ? "LED" : i.toUpperCase().includes("DIM") ? "DIMMER" : "DOUT" : t === "sensor" ? "DEFAULT_SENSOR" : "";
}
function pe(t) {
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
const dt = [
  "orphan",
  "push_wrong_object",
  "push_bad_service",
  "push_no_event",
  "poll_redundant",
  "not_in_ha"
], pt = {
  light: "set_state / set_brightness / set_rgb / set_rgbw",
  switch: "set_state",
  binary_sensor: "set_state",
  cover: "set_cover",
  sensor: "set_value",
  climate: "set_therm_state / set_therm_target_temp"
};
function ht(t) {
  const e = new Uint8Array(t), i = 32768;
  let s = "";
  for (let n = 0; n < e.length; n += i)
    s += String.fromCharCode.apply(
      null,
      Array.from(e.subarray(n, n + i))
    );
  return btoa(s);
}
let h = class extends x {
  constructor() {
    super(...arguments), this.narrow = !1, this._busy = !1, this._busyName = "", this._summaryOpen = !1, this._addData = {}, this._svcChoice = "", this._pendingFixes = [], this._pendingOpen = !1, this._search = "", this._typeSel = /* @__PURE__ */ new Set(), this._updSel = /* @__PURE__ */ new Set(), this._statSel = /* @__PURE__ */ new Set(), this._entityIds = /* @__PURE__ */ new Set(), this._onColumnsChanged = (t) => {
      let e = t.detail?.columnOrder ? [...t.detail.columnOrder] : void 0;
      e && (e = e.filter((s) => s !== "actions"), e.push("actions")), this._columnOrder = e;
      const i = t.detail?.hiddenColumns;
      this._hiddenColumns = i && i.filter((s) => s !== "actions");
    }, this._discardPending = () => {
      this._pendingFixes = [], this._pendingOpen = !1;
    }, this._downloadRewrite = async () => {
      if (!(!this._lastOmp || !this._pendingFixes.length))
        try {
          const t = this._pendingFixes.filter((n) => n.kind === "service" || n.kind === "retarget").map((n) => ({
            target_entity: n.target_entity,
            ...n.new_service ? { new_service: n.new_service } : {},
            ...n.new_entity ? { new_entity: n.new_entity } : {}
          })), e = this._pendingFixes.filter((n) => n.kind === "inject" && n.inject).map((n) => n.inject), i = await this.hass.connection.sendMessagePromise({
            type: "grenton_objects/rewrite_omp",
            omp_base64: this._lastOmp,
            fixes: t,
            injections: e
          });
          this._download(i.omp_base64, "ha_integration_poprawiony.omp");
          const s = i.skipped?.length ? ` (pominięto ${i.skipped.length})` : "";
          this._toast(
            `Pobrano poprawiony .omp — ${i.applied.length} zmian${s}. Zweryfikuj w Object Managerze.`
          );
        } catch (t) {
          this._toast(
            `Nie udało się przygotować pliku: ${t?.message || t?.code || "błąd"}`
          );
        }
    }, this._addComputeLabel = (t) => lt[t.name] ?? t.name, this._onAddFormChanged = (t) => {
      const e = this._addData, i = { ...t.detail.value };
      i.device_type !== e.device_type && (i.grenton_type = de(
        i.device_type,
        this._addRow?.type || ""
      ), i.device_type === "cover" && !i.device_class && (i.device_class = "shutter")), this._addData = i;
    }, this._resetFilters = () => {
      this._typeSel = this._defaultTypeSel(), this._updSel = /* @__PURE__ */ new Set(), this._statSel = /* @__PURE__ */ new Set();
    }, this._pickFile = () => {
      this.renderRoot.querySelector('input[type="file"]')?.click();
    }, this._onFileInput = (t) => {
      const e = t.target, i = e.files?.[0];
      e.value = "", this._analyze(i);
    };
  }
  shouldUpdate(t) {
    if (t.size === 1 && t.has("hass")) {
      const e = t.get("hass");
      if (e && this._entityIds.size) {
        for (const i of this._entityIds)
          if (e.states[i] !== this.hass.states[i]) return !0;
      }
      return !1;
    }
    return !0;
  }
  firstUpdated() {
    const t = window;
    !customElements.get("ha-data-table") && t.loadCardHelpers && t.loadCardHelpers().then(
      (e) => e?.createCardElement?.({ type: "entities", entities: [] })
    ).catch(() => {
    });
  }
  get _tabs() {
    return [{ name: st, path: this.route?.prefix ?? `/${re}` }];
  }
  render() {
    return this._report ? this._reportView() : this._startView();
  }
  // ─── start view (upload) ────────────────────────────────────────────
  _startView() {
    const t = r`
      <div class="pad">
        <p class="intro">
          Wgraj plik projektu Object Managera (.omp). Zostanie porównany z
          aktualną konfiguracją Home Assistant — nic nie jest zmieniane.
        </p>
        ${this._uploadUI()}
        ${this._error ? r`<ha-alert
              alert-type="error"
              title="Błąd analizy"
              style="margin-top:16px"
              >${this._error}</ha-alert
            >` : c}
      </div>
    `;
    return customElements.get("hass-tabs-subpage") ? r`<hass-tabs-subpage
        .hass=${this.hass}
        .narrow=${this.narrow}
        ?main-page=${!0}
        .route=${this.route ?? { prefix: "", path: "" }}
        .tabs=${this._tabs}
        >${t}</hass-tabs-subpage
      >` : t;
  }
  _uploadUI() {
    return customElements.get("ha-file-upload") ? r`<ha-file-upload
        .localize=${this.hass.localize}
        accept=".omp,.zip"
        .icon=${"mdi:folder-upload"}
        .label=${"Przeciągnij plik .omp lub kliknij, aby wybrać"}
        .supports=${"Plik projektu Object Managera (.omp / .zip)"}
        .uploading=${this._busy}
        @file-picked=${(t) => this._analyze(t.detail.files?.[0])}
      ></ha-file-upload>` : r`
      <ha-button raised @click=${this._pickFile}>Wybierz plik .omp</ha-button>
      <input
        type="file"
        accept=".omp,.zip"
        style="display:none"
        @change=${this._onFileInput}
      />
      ${this._busy ? r`<div style="margin-top:12px;color:var(--secondary-text-color)">
            Analizuję… (${this._busyName})
          </div>` : c}
    `;
  }
  // ─── report view (native subpage table) ─────────────────────────────
  _reportView() {
    const t = customElements.get("hass-tabs-subpage-data-table") ? this._subpage() : this._fallbackTable();
    return r`${t}${this._summaryDialog()}${this._issueDialog()}${this._addDialog()}${this._pendingDialog()}`;
  }
  _subpage() {
    return r`
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
        <ha-icon-button
          slot="toolbar-icon"
          .label=${"Wgraj inny plik .omp"}
          @click=${this._pickFile}
        >
          <ha-icon icon="mdi:upload"></ha-icon>
        </ha-icon-button>
        <input
          type="file"
          accept=".omp,.zip"
          style="display:none"
          @change=${this._onFileInput}
        />
        <div slot="top-header">${this._statStrip()}${this._pendingBar()}</div>
        ${this._filterGroups()}
      </hass-tabs-subpage-data-table>
    `;
  }
  _fallbackTable() {
    return r`
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
    const t = this._report, e = t.summary, i = t.orphans.length + t.push_object_mismatch.length + t.push_service_mismatch.length + t.push_no_event.length + t.push_orphan_targets.length + t.poll_with_push.length, s = t.verdict === "ok";
    return r`
      <button
        class="stat-bar"
        @click=${() => this._summaryOpen = !0}
        title="Pokaż pełne podsumowanie"
      >
        <span class="verdict ${s ? "ok" : "issues"}">
          <ha-icon icon=${s ? "mdi:check-circle" : "mdi:alert"}></ha-icon>
          ${s ? "Spójne z projektem" : `Rozbieżności — ${i} do sprawdzenia`}
        </span>
        <span class="nums">
          ${e.ha_total}/${e.om_total} obiektów w HA · ${e.push} push /
          ${e.polling} polling
        </span>
        <span class="more">Szczegóły →</span>
      </button>
    `;
  }
  _summaryDialog() {
    return this._summaryOpen ? r`
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
    ` : c;
  }
  _summaryInner() {
    const t = this._report, e = t.summary, i = t.verdict === "ok", s = [
      {
        label: "encje HA bez obiektu w projekcie",
        count: t.orphans.length,
        sev: "error"
      },
      {
        label: "push aktualizujący zły obiekt Grentona",
        count: t.push_object_mismatch.length,
        sev: "error"
      },
      {
        label: "push z niewłaściwą akcją dla typu encji",
        count: t.push_service_mismatch.length,
        sev: "error"
      },
      {
        label: "encje push bez zdarzenia w Grentonie",
        count: t.push_no_event.length,
        sev: "error"
      },
      {
        label: "zdarzenia push w nieistniejącą encję",
        count: t.push_orphan_targets.length,
        sev: "error"
      },
      {
        label: "polling z jednoczesnym push (redundancja)",
        count: t.poll_with_push.length,
        sev: "warn"
      },
      {
        label: "obiekty Grentona nieobecne w HA",
        count: t.not_in_ha.length,
        sev: "missing"
      }
    ].filter((n) => n.count > 0);
    return r`
      <div class="summary">
        <ha-alert alert-type=${i ? "success" : "warning"}>
          ${i ? "Integracja spójna z projektem" : "Wykryto rozbieżności"}
        </ha-alert>

        <h4>Statystyki</h4>
        <dl class="stats">
          <dt>Obiekty projektu</dt>
          <dd><b>${e.om_total}</b></dd>
          <dt>Encje w HA</dt>
          <dd><b>${e.ha_total}</b></dd>
          <dt>Zdarzenia push (Grenton→HA)</dt>
          <dd><b>${e.push_events}</b></dd>
          <dt>Tryb aktualizacji</dt>
          <dd>${e.push} push · ${e.polling} polling</dd>
        </dl>

        <h4>Wg domeny</h4>
        <ul>
          ${Object.keys(e.per_domain).sort(
      (n, a) => e.per_domain[a].push + e.per_domain[a].polling - (e.per_domain[n].push + e.per_domain[n].polling)
    ).map(
      (n) => r`<li>
                  ${n}: ${e.per_domain[n].push} push /
                  ${e.per_domain[n].polling} polling
                </li>`
    )}
        </ul>

        <h4>Problemy${s.length ? "" : " — brak"}</h4>
        ${s.length ? r`<ul class="problems">
              ${s.map((n) => {
      const a = n.sev === "error" || n.sev === "warn" ? "active-error" : "";
      return r`<li class=${a} style=${`color:${k[n.sev]}`}>
                  ${n.count} ${n.label}
                </li>`;
    })}
            </ul>` : c}
        ${t.not_in_ha.length ? r`<div style="color:${k.missing};margin-top:4px">
              ${t.not_in_ha.length} obiektów Grentona nieobecnych w HA
              (${t.not_in_ha_by_type.map(([n, a]) => `${a}× ${n}`).join(", ")})
            </div>` : c}
        ${t.scaffolding ? this._scaffold(t.scaffolding) : c}
      </div>
    `;
  }
  _scaffold(t) {
    return r`
      <h4>Konfiguracja po stronie Grentona</h4>
      ${t.push_used ? c : r`<div style="color:var(--secondary-text-color);font-size:0.9em">
            Push nieużywany — obiekty kolejki nie są wymagane.
          </div>`}
      <ul>
        ${t.checks.map((e) => {
      let i = k.ok, s = "obecny";
      return e.present || (e.required ? (i = k.error, s = "BRAK (wymagane)") : (i = k.muted, s = "brak (opcjonalne)")), r`<li style=${`color:${i}`}>
            ${e.name} — ${e.desc}: ${s}
          </li>`;
    })}
      </ul>
    `;
  }
  // ─── table data + columns ──────────────────────────────────────────────
  get _viewRows() {
    return (this._report?.merged ?? []).map((i, s) => {
      const n = pe(i), a = i.in_ha ? i.mode ?? "brak" : "brak", o = i.in_ha ? i.mode === "polling" ? `polling (${i.interval ?? "?"} s)` : "push" : "brak", d = i.clu || (i.grenton_id?.includes("->") ? i.grenton_id.split("->")[0] : "") || "—", l = i.flags.find((_) => dt.includes(_)) ?? (i.is_unsupported ? "unsupported" : i.in_ha ? "ok" : "not_in_ha");
      return {
        id: i.grenton_id || i.entity_id || String(s),
        name: i.om_name || i.ha_name || "",
        om_name: i.om_name || "",
        grenton_type: i.grenton_type || "",
        grenton_id: i.grenton_id || "",
        clu: d,
        module: i.module || "—",
        type: i.om_type || i.device_type || "—",
        entity_id: i.entity_id || "",
        entry_id: i.entry_id || "",
        domain: i.entity_id ? i.entity_id.split(".")[0] : "—",
        update: o,
        updateCat: a,
        status: n.label,
        sev: n.sev,
        statusCat: n.cat,
        flag: l
      };
    }).filter((i) => !(this._typeSel.size && !this._typeSel.has(i.type) || this._updSel.size && !this._updSel.has(i.updateCat) || this._statSel.size && !this._statSel.has(i.statusCat)));
  }
  _columns() {
    return {
      name: {
        title: "Nazwa (Grenton)",
        main: !0,
        sortable: !0,
        filterable: !0,
        flex: 2
      },
      grenton_id: {
        title: "Grenton ID",
        sortable: !0,
        filterable: !0,
        hideable: !0,
        width: "160px"
      },
      clu: {
        title: "CLU",
        sortable: !0,
        filterable: !0,
        groupable: !0,
        hideable: !0,
        defaultHidden: !0
      },
      module: {
        title: "Moduł",
        sortable: !0,
        filterable: !0,
        groupable: !0,
        hideable: !0,
        defaultHidden: !0
      },
      type: {
        title: "Typ Grenton",
        sortable: !0,
        filterable: !0,
        groupable: !0,
        hideable: !0,
        width: "140px"
      },
      entity_id: {
        title: "Encja HA",
        sortable: !0,
        filterable: !0,
        hideable: !0,
        width: "260px",
        template: (t, e) => this._entityCell(e ?? t)
      },
      domain: {
        title: "Domena HA",
        filterable: !0,
        groupable: !0,
        hideable: !0,
        defaultHidden: !0
      },
      update: {
        title: "Aktualizacja",
        sortable: !0,
        filterable: !0,
        hideable: !0,
        width: "150px"
      },
      updateCat: {
        title: "Tryb aktualizacji",
        filterable: !0,
        groupable: !0,
        hideable: !0,
        defaultHidden: !0
      },
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
    if (!t.entity_id)
      return r`<span style="color:var(--secondary-text-color)">—</span>`;
    const e = this.hass?.states?.[t.entity_id], i = e ? Qe(e) ?? "var(--secondary-text-color)" : "var(--secondary-text-color)", s = e ? this._formatState(e) : "niedostępna";
    return r`
      <span class="entity" @click=${() => this._moreInfo(t.entity_id)}>
        ${e ? r`<ha-state-icon
              .stateObj=${e}
              style=${`color:${i}`}
            ></ha-state-icon>` : c}
        <span
          >${t.entity_id}<span style="color:var(--secondary-text-color)">
            · ${s}</span
          ></span
        >
      </span>
    `;
  }
  _statusCell(t) {
    const e = r`<ha-label dense .color=${k[t.sev]}
      >${t.status}</ha-label
    >`;
    return t.flag === "ok" ? e : r`<span
      class="status-cell"
      title="Kliknij po szczegóły i wskazówki"
      @click=${() => this._openIssue(t)}
      >${e}</span
    >`;
  }
  // Context-tailored explanation for a row's status.
  _issueDetails(t) {
    const e = t.domain && t.domain !== "—" ? t.domain : t.type;
    switch (t.flag) {
      case "orphan":
        return {
          sections: [
            {
              h: "Co jest nie tak",
              body: `Encja ${t.entity_id} wskazuje grenton_id „${t.grenton_id}", którego nie ma w tym projekcie OM.`
            },
            {
              h: "Prawdopodobna przyczyna",
              body: "Obiekt został usunięty lub dostał nowy identyfikator w Object Managerze, albo encja w HA ma literówkę w grenton_id."
            },
            {
              h: "Jak poprawić",
              body: "Sprawdź obiekt w OM i popraw grenton_id encji (ikona koła zębatego → Konfiguruj), albo usuń nieaktualną encję."
            }
          ]
        };
      case "push_wrong_object":
        return {
          sections: [
            {
              h: "Co jest nie tak",
              body: `Zdarzenie push aktualizuje tę encję (${t.grenton_id}) stanem INNEGO obiektu Grentona.`
            },
            {
              h: "Czego oczekiwano",
              body: "Źródło w zdarzeniu powinno wskazywać ten sam obiekt, na który wskazuje encja."
            },
            {
              h: "Jak poprawić",
              body: "W OM otwórz zdarzenie OnChange obiektu i popraw drugi argument HA_Integration_Queue_Prepare (źródło stanu) na właściwy obiekt."
            }
          ]
        };
      case "push_bad_service":
        return {
          sections: [
            {
              h: "Co jest nie tak",
              body: `Push tej encji używa akcji, która nie pasuje do jej typu (${e}).`
            },
            {
              h: "Czego oczekiwano",
              body: `Dla typu „${e}" akcja powinna być: ${pt[e] || "właściwa dla typu encji"}.`
            },
            {
              h: "Jak poprawić",
              body: "W OM zmień akcję w wywołaniu HA_Integration_Queue_Prepare (w zdarzeniu OnChange obiektu) na właściwą."
            }
          ]
        };
      case "push_no_event":
        return {
          sections: [
            {
              h: "Co jest nie tak",
              body: "Encja jest w trybie push, ale w projekcie nie ma dla niej żadnego zdarzenia push (HA_Integration_Queue_Prepare)."
            },
            {
              h: "Jak poprawić",
              body: "Wygeneruj zdarzenie push do .omp poniżej (do zweryfikowania w OM) albo w HA włącz automatyczne odświeżanie (polling)."
            }
          ]
        };
      case "poll_redundant":
        return {
          sections: [
            {
              h: "Co jest nie tak",
              body: "Encja jest odpytywana (polling) i JEDNOCZEŚNIE ma zdarzenie push — aktualizuje się dwoma drogami."
            },
            {
              h: "Jak poprawić",
              body: "Wyłącz automatyczne odświeżanie (auto-update) dla tej encji — wystarczy push. Ewentualnie usuń zdarzenie push w OM."
            }
          ]
        };
      case "unsupported":
        return {
          sections: [
            {
              h: "Co jest nie tak",
              body: `Integracja nie potrafi wystawić obiektu typu „${t.type}" jako encji HA (np. DALI_MASTER, kontener Satel).`
            },
            {
              h: "Co zrobić",
              body: "Nic — ten obiekt po prostu nie ma odpowiednika w HA."
            }
          ]
        };
      default:
        return {
          sections: [
            {
              h: "Co jest nie tak",
              body: `Obiekt „${t.grenton_id}" (${t.type}) istnieje w projekcie Grentona, ale nie jest dodany do HA.`
            },
            {
              h: "Jak dodać",
              body: `Wybierz typ encji i kliknij „Dodaj do HA" — encja powstanie z pollingiem (adres bramki jak w pozostałych obiektach). Domyślny typ to podpowiedź dla „${t.type}"; DOUT bywa światłem lub przełącznikiem — zmień, jeśli trzeba. Aktualizację przez push skonfigurujesz później w OM.`
            }
          ]
        };
    }
  }
  _issueDialog() {
    const t = this._issue;
    if (!t) return c;
    const e = this._issueDetails(t);
    return r`
      <ha-dialog
        open
        .headerTitle=${t.status}
        @closed=${() => this._issue = void 0}
      >
        <div class="issue">
          ${e.sections.map(
      (i) => r`<div class="issue-sec">
                <div class="issue-h">${i.h}</div>
                <div>${i.body}</div>
              </div>`
    )}
          ${t.flag === "poll_redundant" && t.entry_id ? r`<div class="issue-action">
                <ha-button
                  appearance="accent"
                  size="small"
                  @click=${() => this._fixDisablePolling(t)}
                >
                  Napraw: wyłącz polling
                </ha-button>
              </div>` : c}
          ${t.flag === "not_in_ha" && t.grenton_id ? r`<div class="issue-action">
                <ha-button
                  appearance="accent"
                  size="small"
                  @click=${() => this._openAdd(t)}
                >
                  Dodaj do HA…
                </ha-button>
              </div>` : c}
          ${(t.flag === "push_bad_service" || t.flag === "push_wrong_object") && this._pushFixFor(t) ? this._pushFixAction(t, this._pushFixFor(t)) : c}
          ${t.flag === "push_no_event" && t.entity_id ? this._orphanRetargetFor(t) ? this._orphanRetargetAction(t, this._orphanRetargetFor(t)) : this._injectAction(t) : c}
        </div>
        <div slot="footer" class="dialog-footer">
          ${t.entry_id ? r`<ha-button
                appearance="plain"
                @click=${() => {
      this._issue = void 0, this._openConfig(t.entry_id);
    }}
              >
                Konfiguruj encję
              </ha-button>` : c}
          <ha-button appearance="plain" data-dialog="close">Zamknij</ha-button>
        </div>
      </ha-dialog>
    `;
  }
  _openIssue(t) {
    const e = this._pushFixFor(t);
    this._svcChoice = e?.kind === "service" ? e.suggested_service ?? "" : "", this._issue = t;
  }
  // ─── push-binding fixes (Grenton-side, staged into a .omp download) ─────
  _pushFixFor(t) {
    if (t.entity_id)
      return this._report?.push_fixes?.find(
        (e) => e.target_entity === t.entity_id
      );
  }
  // Orphan retarget: an existing push points at an entity that doesn't exist
  // in HA anymore, but its source object IS this row's entity — fixing the
  // stale push is preferable to injecting a duplicate one.
  _orphanRetargetFor(t) {
    if (t.entity_id)
      return this._report?.push_fixes?.find(
        (e) => e.kind === "retarget" && e.orphan && e.new_entity === t.entity_id
      );
  }
  _pushFixAction(t, e) {
    if (e.kind === "service") {
      const i = e.valid_services ?? [], s = this._svcChoice || e.suggested_service || i[0] || "";
      return r`
        <div class="issue-action add-action">
          <ha-select
            label="Poprawna usługa"
            .value=${s}
            naturalMenuWidth
            fixedMenuPosition
            @selected=${(n) => this._svcChoice = n.target.value}
            @closed=${(n) => n.stopPropagation()}
          >
            ${i.map(
        (n) => r`<ha-list-item .value=${n}>${n}</ha-list-item>`
      )}
          </ha-select>
          <ha-button
            appearance="accent"
            size="small"
            @click=${() => this._stageServiceFix(t, e)}
          >
            Dodaj poprawkę do .omp
          </ha-button>
        </div>
      `;
    }
    return r`
      <div class="issue-action">
        <div class="issue-h">Proponowana poprawka w .omp</div>
        <div>
          Cel push zostanie przekierowany na encję pasującą do źródła:
          <b>${e.new_entity}</b>.
        </div>
        <ha-button
          appearance="accent"
          size="small"
          @click=${() => this._stageRetargetFix(t, e)}
          style="margin-top:6px"
        >
          Dodaj poprawkę do .omp
        </ha-button>
      </div>
    `;
  }
  _stageServiceFix(t, e) {
    const i = this._svcChoice || e.suggested_service || "";
    this._stageFix({
      target_entity: e.target_entity,
      kind: "service",
      title: `Usługa push — ${t.entity_id}`,
      detail: `„${e.current_service}" → „${i}"`,
      new_service: i
    });
  }
  _stageRetargetFix(t, e) {
    this._stageFix({
      target_entity: e.target_entity,
      kind: "retarget",
      title: `Cel push — ${t.entity_id}`,
      detail: `push → ${e.new_entity} (encja pasująca do źródła ${e.source_grenton_id})`,
      new_entity: e.new_entity
    });
  }
  _orphanRetargetAction(t, e) {
    return r`
      <div class="issue-action">
        <div class="issue-h">Proponowana poprawka w .omp</div>
        <div>
          W projekcie istnieje już zdarzenie push dla tego obiektu, kierujące na
          nieistniejącą encję
          <b>${e.target_entity}</b>. Zamiast dodawać nowe zdarzenie,
          przekieruj istniejące na <b>${t.entity_id}</b>.
        </div>
        <ha-button
          appearance="accent"
          size="small"
          @click=${() => this._stageOrphanRetarget(t, e)}
          style="margin-top:6px"
        >
          Napraw entity_id w istniejącym zdarzeniu push
        </ha-button>
      </div>
    `;
  }
  _stageOrphanRetarget(t, e) {
    this._stageFix({
      target_entity: e.target_entity,
      kind: "retarget",
      title: `Cel push — ${t.entity_id}`,
      detail: `push „${e.target_entity}" → „${e.new_entity}"`,
      new_entity: e.new_entity
    });
  }
  _injectAction(t) {
    return it(t.type) ? r`
      <div class="issue-action">
        <div class="issue-h">Proponowana poprawka w .omp</div>
        <div>
          Wygeneruje zdarzenie push (Grenton→HA) w obiekcie
          <b>${t.grenton_id}</b>, kierujące stan na <b>${t.entity_id}</b>.
        </div>
        <ha-button
          appearance="accent"
          size="small"
          @click=${() => this._stageInject(t)}
          style="margin-top:6px"
        >
          Dodaj zdarzenie push do .omp
        </ha-button>
      </div>
    ` : r`
        <div class="issue-action">
          Automatyczne wygenerowanie zdarzenia push dla typu „${t.type}" nie
          jest jeszcze wspierane — skonfiguruj push w OM ręcznie.
        </div>
      `;
  }
  _stageInject(t) {
    const e = t.grenton_id.includes("->") ? t.grenton_id.split("->")[1] : t.grenton_id, i = t.clu && t.clu !== "—" ? t.clu : t.grenton_id.split("->")[0];
    this._stageFix({
      target_entity: t.entity_id,
      kind: "inject",
      title: `Zdarzenie push — ${t.entity_id}`,
      detail: `nowe zdarzenie w obiekcie ${t.grenton_id} → push do ${t.entity_id}`,
      inject: {
        obj_id: e,
        om_name: t.om_name,
        clu_ref: `${i}_clu`,
        entity: t.entity_id,
        device_type: t.domain !== "—" ? t.domain : null,
        grenton_type: t.grenton_type || null,
        om_type: t.type
      }
    });
  }
  _stageFix(t) {
    const e = this._pendingFixes.filter(
      (i) => !(i.target_entity === t.target_entity && i.kind === t.kind)
    );
    this._pendingFixes = [...e, t], this._issue = void 0, this._toast("Dodano poprawkę do puli — pobierz .omp z paska nad tabelą.");
  }
  _pendingBar() {
    const t = this._pendingFixes.length;
    return t ? r`
      <div class="pending-bar">
        <ha-icon icon="mdi:file-document-edit-outline"></ha-icon>
        <button class="pending-info" @click=${() => this._pendingOpen = !0}>
          ${t} ${t === 1 ? "poprawka" : "poprawek"} do pliku .omp — kliknij, aby
          przejrzeć
        </button>
        <ha-button
          appearance="accent"
          size="small"
          @click=${this._downloadRewrite}
          >Pobierz poprawiony .omp</ha-button
        >
        <ha-button
          appearance="plain"
          size="small"
          @click=${this._discardPending}
          >Odrzuć</ha-button
        >
      </div>
    ` : c;
  }
  _pendingDialog() {
    return this._pendingOpen ? r`
      <ha-dialog
        open
        .headerTitle=${"Poprawki do pliku .omp"}
        @closed=${() => this._pendingOpen = !1}
      >
        <div class="pending">
          <ha-alert alert-type="warning">
            Zmiany dotyczą pliku projektu Grentona. Pobierz kopię i
            <b>zweryfikuj w Object Managerze</b>
            przed wgraniem do CLU — Twój oryginalny plik nie jest modyfikowany.
          </ha-alert>
          <ha-list>
            ${this._pendingFixes.map(
      (t) => r`<ha-list-item twoline hasMeta>
                  <span>${t.title}</span>
                  <span slot="secondary">${t.detail}</span>
                  <ha-icon-button
                    slot="meta"
                    .label=${"Usuń poprawkę"}
                    @click=${() => this._removePending(t)}
                  >
                    <ha-icon icon="mdi:close"></ha-icon>
                  </ha-icon-button>
                </ha-list-item>`
    )}
          </ha-list>
        </div>
        <div slot="footer" class="dialog-footer">
          <ha-button appearance="plain" @click=${this._discardPending}
            >Odrzuć wszystkie</ha-button
          >
          <ha-button appearance="accent" @click=${this._downloadRewrite}
            >Pobierz poprawiony .omp</ha-button
          >
        </div>
      </ha-dialog>
    ` : c;
  }
  _removePending(t) {
    this._pendingFixes = this._pendingFixes.filter(
      (e) => !(e.target_entity === t.target_entity && e.kind === t.kind)
    ), this._pendingFixes.length || (this._pendingOpen = !1);
  }
  _download(t, e) {
    const i = Uint8Array.from(atob(t), (a) => a.charCodeAt(0)), s = URL.createObjectURL(
      new Blob([i], { type: "application/octet-stream" })
    ), n = document.createElement("a");
    n.href = s, n.download = e, n.click(), URL.revokeObjectURL(s);
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
        }), await this._reanalyze(), this._toast(
          `Wyłączono polling dla ${t.entity_id} — aktualizacja tylko przez push.`
        );
      } catch (e) {
        this._toast(`Nie udało się: ${e?.message || e?.code || "błąd"}`);
      }
    }
  }
  _defaultEndpoint() {
    return this._report?.summary.endpoints?.[0]?.[0] ?? "";
  }
  // Open the add/confirm dialog for a Grenton object missing in HA. Fields are
  // prefilled from the OM object and existing HA config, and stay editable.
  _openAdd(t) {
    const i = F(t.type)[0];
    this._addData = {
      name: t.name || t.grenton_id,
      device_type: i,
      grenton_type: de(i, t.type),
      api_endpoint: this._defaultEndpoint(),
      grenton_id: t.grenton_id,
      push_support: !1,
      auto_update: !0,
      update_interval: 30,
      reversed: !1,
      device_class: i === "cover" ? "shutter" : void 0
    }, this._addRow = t, this._issue = void 0;
  }
  // ha-form schema mirroring the config flow's fields for the chosen device
  // type. Recomputed on every render, so type-specific fields appear/disappear
  // as the user changes the type.
  _addSchema(t, e) {
    const i = F(e), s = [
      { name: "name", required: !0, selector: { text: {} } },
      {
        name: "device_type",
        required: !0,
        selector: {
          select: {
            mode: "dropdown",
            options: i.map((n) => ({
              value: n,
              label: ot[n]
            }))
          }
        }
      },
      ...ce[t] ? [
        {
          name: "grenton_type",
          required: !0,
          selector: {
            select: {
              mode: "dropdown",
              options: ce[t].map((n) => ({
                value: n,
                label: n
              }))
            }
          }
        }
      ] : [],
      { name: "api_endpoint", required: !0, selector: { text: {} } },
      { name: "grenton_id", required: !0, selector: { text: {} } }
    ];
    return t === "cover" && s.push({
      name: "device_class",
      selector: {
        select: {
          mode: "dropdown",
          options: ct.map((n) => ({ value: n, label: n }))
        }
      }
    }), (t === "switch" || t === "cover") && s.push({ name: "reversed", selector: { boolean: {} } }), t !== "climate" && s.push({ name: "auto_update", selector: { boolean: {} } }), s.push({
      name: "update_interval",
      selector: {
        number: { min: 1, max: 3600, mode: "box", unit_of_measurement: "s" }
      }
    }), s;
  }
  _addDialog() {
    const t = this._addRow;
    if (!t) return c;
    const e = this._addData.device_type || F(t.type)[0];
    return r`
      <ha-dialog
        open
        .headerTitle=${"Dodaj obiekt do HA"}
        @closed=${() => this._addRow = void 0}
      >
        <div class="add-dialog">
          <p class="add-hint">
            Obiekt „${t.grenton_id}" (${t.type}) zostanie dodany jako encja
            HA. Sprawdź i w razie potrzeby popraw poniższe pola.
          </p>
          <ha-form
            .hass=${this.hass}
            .data=${this._addData}
            .schema=${this._addSchema(e, t.type)}
            .computeLabel=${this._addComputeLabel}
            @value-changed=${this._onAddFormChanged}
          ></ha-form>
          <p class="add-hint">
            Aktualizację przez push (Grenton→HA) skonfigurujesz później w OM.
          </p>
        </div>
        <div slot="footer" class="dialog-footer">
          <ha-button appearance="plain" data-dialog="close">Anuluj</ha-button>
          <ha-button
            appearance="accent"
            @click=${() => this._confirmAddObject(t)}
            >Dodaj do HA</ha-button
          >
        </div>
      </ha-dialog>
    `;
  }
  async _confirmAddObject(t) {
    const e = this._addData, i = (e.grenton_id || "").trim();
    if (!i || !e.device_type) {
      this._toast("Uzupełnij Grenton ID i typ encji.");
      return;
    }
    this._addRow = void 0;
    try {
      await this.hass.connection.sendMessagePromise({
        type: "grenton_objects/add_object",
        grenton_id: i,
        device_type: e.device_type,
        om_type: t.type,
        name: e.name || i,
        api_endpoint: e.api_endpoint || void 0,
        auto_update: e.auto_update !== !1,
        update_interval: Number(e.update_interval) || 30,
        ...e.grenton_type ? { grenton_type: e.grenton_type } : {},
        ...e.device_class ? { device_class: e.device_class } : {},
        ...e.device_type === "switch" || e.device_type === "cover" ? { reversed: !!e.reversed } : {}
      }), await this._reanalyze(), this._toast(
        `Dodano „${e.name || i}" do HA jako ${e.device_type}.`
      );
    } catch (s) {
      this._toast(`Nie udało się dodać: ${s?.message || s?.code || "błąd"}`);
    }
  }
  _toast(t) {
    this.dispatchEvent(
      new CustomEvent("hass-notification", {
        detail: { message: t },
        bubbles: !0,
        composed: !0
      })
    );
  }
  _actionsCell(t) {
    return t.entry_id ? r`<ha-icon
      class="cog"
      icon="mdi:cog"
      title="Otwórz konfigurację obiektu w integracji"
      @click=${() => this._openConfig(t.entry_id)}
    ></ha-icon>` : c;
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
      const o = {};
      for (const d of this._allViewRows())
        o[d[a]] = (o[d[a]] || 0) + 1;
      return o;
    }, i = t.type_summary.map((a) => ({
      key: a.type,
      label: `${a.type} (${a.count})${a.supported ? "" : " · nieobsł."}`
    })), s = e("updateCat"), n = e("statusCat");
    return r`
      ${this._filterGroup("Typ Grenton", i, this._typeSel, "type")}
      ${this._filterGroup(
      "Aktualizacja",
      nt.map((a) => ({
        key: a.key,
        label: `${a.label} (${s[a.key] || 0})`
      })),
      this._updSel,
      "upd"
    )}
      ${this._filterGroup(
      "Status",
      at.map((a) => ({
        key: a.key,
        label: `${a.label} (${n[a.key] || 0})`
      })),
      this._statSel,
      "stat"
    )}
    `;
  }
  _allViewRows() {
    return (this._report?.merged ?? []).map((e) => {
      const i = pe(e);
      return {
        id: "",
        name: "",
        om_name: "",
        grenton_type: "",
        grenton_id: "",
        clu: "",
        module: "",
        type: e.om_type || e.device_type || "—",
        entity_id: "",
        entry_id: "",
        domain: "",
        update: "",
        updateCat: e.in_ha ? e.mode ?? "brak" : "brak",
        status: i.label,
        sev: i.sev,
        statusCat: i.cat,
        flag: ""
      };
    });
  }
  _filterGroup(t, e, i, s) {
    return r`
      <ha-expansion-panel slot="filter-pane" outlined .expanded=${i.size > 0}>
        <div slot="header" class="filter-header">
          <span>${t}</span>
          ${i.size ? r`<span class="badge">${i.size}</span>
                <ha-icon
                  class="filter-clear"
                  icon="mdi:filter-variant-remove"
                  @click=${(n) => {
      n.stopPropagation(), this._setSel(s, /* @__PURE__ */ new Set());
    }}
                ></ha-icon>` : c}
        </div>
        <ha-list
          multi
          @selected=${(n) => this._onListSelected(n, s, e)}
        >
          ${e.map(
      (n) => r`<ha-check-list-item
                .value=${n.key}
                .selected=${i.has(n.key)}
                >${n.label}</ha-check-list-item
              >`
    )}
        </ha-list>
      </ha-expansion-panel>
    `;
  }
  _onListSelected(t, e, i) {
    const s = t?.detail?.index, n = s instanceof Set ? Array.from(s) : typeof s == "number" ? [s] : [], a = /* @__PURE__ */ new Set();
    n.forEach((o) => {
      i[o] && a.add(i[o].key);
    }), this._setSel(e, a);
  }
  _setSel(t, e) {
    t === "type" ? this._typeSel = e : t === "upd" ? this._updSel = e : this._statSel = e;
  }
  _defaultTypeSel() {
    const t = this._report?.type_summary ?? [];
    return new Set(
      t.filter((e) => e.supported && e.type !== "DIN").map((e) => e.type)
    );
  }
  async _analyze(t) {
    if (!t) return;
    this._busyName = t.name;
    const e = await t.arrayBuffer();
    this._lastOmp = ht(e), await this._doAnalyze(!0);
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
        this._report = e, this._entityIds = new Set(
          e.merged.map((i) => i.entity_id).filter((i) => !!i)
        ), t && (this._typeSel = this._defaultTypeSel(), this._updSel = /* @__PURE__ */ new Set(), this._statSel = /* @__PURE__ */ new Set());
      } catch (e) {
        this._error = e?.message || e?.code || "Nie udało się odczytać pliku .omp.";
      } finally {
        this._busy = !1;
      }
    }
  }
  _moreInfo(t) {
    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        detail: { entityId: t },
        bubbles: !0,
        composed: !0
      })
    );
  }
  _openConfig(t) {
    const e = `/config/integrations/integration/${re}#config_entry=${t}`;
    window.history.pushState(null, "", e), this.dispatchEvent(
      new CustomEvent("location-changed", { bubbles: !0, composed: !0 })
    );
  }
};
h.styles = $e`
    :host {
      display: block;
      height: 100%;
    }
    .pad {
      padding: 24px;
      box-sizing: border-box;
      max-width: 720px;
      margin: 0 auto;
    }
    ha-file-upload {
      display: block;
    }
    .intro {
      color: var(--secondary-text-color);
      margin: 0 0 16px;
    }
    /* compact clickable stat strip in the page header area */
    .stat-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      box-sizing: border-box;
      padding: 8px 16px;
      cursor: pointer;
      border: none;
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
      font: inherit;
      text-align: left;
      border-bottom: 1px solid var(--divider-color);
    }
    .stat-bar .verdict {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
    }
    .stat-bar .verdict.issues {
      color: var(--warning-color);
    }
    .stat-bar .verdict.ok {
      color: var(--success-color);
    }
    .stat-bar .nums {
      color: var(--secondary-text-color);
    }
    .stat-bar .more {
      margin-left: auto;
      color: var(--primary-color);
    }
    /* summary dialog */
    .summary h4 {
      margin: 16px 0 4px;
    }
    .summary ul {
      margin: 0;
      padding-left: 18px;
    }
    .summary dl.stats {
      display: grid;
      grid-template-columns: auto auto;
      gap: 2px 16px;
      margin: 0;
    }
    .summary dl.stats dt {
      color: var(--secondary-text-color);
    }
    .summary .problems li.active-error {
      font-weight: 600;
    }
    /* table cells */
    .filter-header {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
    }
    .badge {
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
      border-radius: 10px;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      font-size: 0.75em;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .filter-clear {
      margin-left: auto;
      color: var(--secondary-text-color);
      cursor: pointer;
    }
    .entity {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }
    .entity ha-state-icon {
      flex: 0 0 auto;
      --mdc-icon-size: 22px;
    }
    .status-cell {
      display: inline-block;
      cursor: pointer;
    }
    .cog {
      cursor: pointer;
      color: var(--secondary-text-color);
    }
    .issue {
      line-height: 1.5;
      max-width: 460px;
    }
    .issue-sec {
      margin-bottom: 12px;
    }
    .issue-h {
      font-weight: 600;
      margin-bottom: 2px;
    }
    .issue-action {
      margin-top: 6px;
    }
    .add-action {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .add-dialog {
      min-width: min(460px, 82vw);
    }
    .add-dialog ha-form {
      display: block;
    }
    .add-hint {
      color: var(--secondary-text-color);
      margin: 4px 0 12px;
    }
    /* pending .omp changes bar (above the table) */
    .pending-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      box-sizing: border-box;
      padding: 8px 16px;
      color: var(--primary-text-color);
      background: color-mix(
        in srgb,
        var(--warning-color) 16%,
        var(--card-background-color)
      );
      border-bottom: 1px solid var(--warning-color);
    }
    .pending-bar > ha-icon {
      color: var(--warning-color);
      flex: 0 0 auto;
    }
    .pending-info {
      flex: 1;
      text-align: left;
      background: none;
      border: none;
      padding: 0;
      color: inherit;
      font: inherit;
      cursor: pointer;
      text-decoration: underline dotted;
    }
    .pending ha-list {
      display: block;
      margin-top: 8px;
    }
    .dialog-footer {
      display: flex;
      gap: var(--ha-space-3, 12px);
      justify-content: flex-end;
      align-items: center;
      flex-wrap: wrap;
      padding: 8px 24px 16px;
    }
  `;
u([
  T({ attribute: !1 })
], h.prototype, "hass", 2);
u([
  T({ attribute: !1 })
], h.prototype, "narrow", 2);
u([
  T({ attribute: !1 })
], h.prototype, "route", 2);
u([
  T({ attribute: !1 })
], h.prototype, "panel", 2);
u([
  m()
], h.prototype, "_report", 2);
u([
  m()
], h.prototype, "_error", 2);
u([
  m()
], h.prototype, "_busy", 2);
u([
  m()
], h.prototype, "_busyName", 2);
u([
  m()
], h.prototype, "_summaryOpen", 2);
u([
  m()
], h.prototype, "_issue", 2);
u([
  m()
], h.prototype, "_addRow", 2);
u([
  m()
], h.prototype, "_addData", 2);
u([
  m()
], h.prototype, "_svcChoice", 2);
u([
  m()
], h.prototype, "_pendingFixes", 2);
u([
  m()
], h.prototype, "_pendingOpen", 2);
u([
  m()
], h.prototype, "_columnOrder", 2);
u([
  m()
], h.prototype, "_hiddenColumns", 2);
u([
  m()
], h.prototype, "_search", 2);
u([
  m()
], h.prototype, "_typeSel", 2);
u([
  m()
], h.prototype, "_updSel", 2);
u([
  m()
], h.prototype, "_statSel", 2);
h = u([
  He("grenton-objects-panel")
], h);
export {
  h as GrentonObjectsPanel
};
