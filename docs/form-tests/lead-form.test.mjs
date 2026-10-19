import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const script = readFileSync(new URL("../../assets/site.js", import.meta.url), "utf8");
const formScript = script.slice(script.indexOf("/* ---------- audit form ---------- */"));
const html = readFileSync(new URL("../../contact/index.html", import.meta.url), "utf8");
const key = "3f2b1c9e-8a4d-4e6f-9b1a-2c3d4e5f6a7b";

function element(value = "") {
  return {
    value,
    textContent: "",
    disabled: false,
    hidden: false,
    removed: false,
    attributes: {},
    listeners: {},
    classList: {
      classes: new Set(),
      add(name) { this.classes.add(name); },
      remove(name) { this.classes.delete(name); },
      contains(name) { return this.classes.has(name); },
      toggle(name, on) { if (on) this.add(name); else this.remove(name); }
    },
    addEventListener(name, listener) { this.listeners[name] = listener; },
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; },
    appendChild(child) { this.textContent += child.textContent; },
    replaceChildren() { this.textContent = ""; },
    remove() { this.removed = true; },
    focus() { this.focused = true; }
  };
}

function harness({ receipt = { success: true }, status = 200, fetchImpl, analyticsThrows = false, configured = true } = {}) {
  const fields = [
    ["name", "QA Tester", true, 120],
    ["email", "qa@example.com", true, 254],
    ["business", "Example Co", false, 160],
    ["monthly_spend", "Under $5,000", true, 100],
    ["detail", "A&B <C> QA request", false, 2000]
  ].map(([name, value, required, max]) => {
    const input = element(value);
    const field = element();
    field.querySelector = () => ({ id: name + "-error" });
    input.name = name;
    input.required = required;
    input.max = max;
    input.closest = () => field;
    input.checkValidity = () => input.value.length <= max &&
      (!required || input.value.length > 0) &&
      (name !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value));
    return { input, field };
  });
  const byName = Object.fromEntries(fields.map(({ input }) => [input.name, input]));
  const submit = element();
  submit.disabled = true;
  submit.textContent = "Send my audit request";
  const fallback = element();
  const statusNode = element();
  statusNode.hidden = true;
  statusNode.replaceChildren = function () {
    this.wasVisibleWhenCleared = !this.hidden;
    this.textContent = "";
  };
  const trap = element();
  const accessKey = element(configured ? key : "REPLACE_WITH_FORM_ACCESS_KEY");
  const form = element();
  form.dataset = { endpoint: "https://api.web3forms.com/submit" };
  form.querySelector = (selector) => selector.includes("access_key") ? accessKey : trap;
  form.querySelectorAll = (selector) => selector === ".field" ? fields.map(x => x.field) : fields.map(x => x.input);
  const doc = {
    getElementById(id) {
      return { "audit-form": form, "audit-status": statusNode, "audit-submit": submit, "audit-fallback": fallback }[id];
    },
    createElement() { return element(); },
    createTextNode(text) { const node = element(); node.textContent = text; return node; }
  };
  const dataLayer = [];
  const window = {
    dataLayer,
    va() { if (analyticsThrows) throw Error("analytics down"); }
  };
  let calls = 0;
  let submitted;
  let onTimeout;
  class TestFormData {
    constructor() {
      this.map = new Map(fields.map(({ input }) => [input.name, input.value]));
      this.map.set("access_key", accessKey.value);
      this.map.set("botcheck", trap.value);
    }
    get(name) { return this.map.get(name); }
    set(name, value) { this.map.set(name, value); }
  }
  const fetch = async (_url, options) => {
    calls++;
    submitted = options.body;
    if (fetchImpl) return fetchImpl(options);
    return { ok: status >= 200 && status < 300, status, json: async () => receipt };
  };
  vm.runInNewContext(formScript, {
    document: doc, window, FormData: TestFormData, fetch, AbortController,
    setTimeout(callback) { onTimeout = callback; return 1; },
    clearTimeout() {},
  });
  return {
    fields: byName, submit, fallback, status: statusNode, trap, dataLayer,
    calls: () => calls, submitted: () => submitted, timeout: () => onTimeout(),
    send() { return form.listeners.submit({ preventDefault() {} }); }
  };
}

test("static form stays disabled with a visible manual email route when JS is absent", () => {
  assert.match(html, /id="audit-submit" disabled/);
  assert.match(html, /id="audit-fallback"/);
  assert.match(html, /mailto:justin@justblakemedia\.com/);
  assert.doesNotMatch(html, /<form[^>]+action=/);
});

test("missing key keeps form unavailable", async () => {
  const h = harness({ configured: false });
  assert.equal(h.submit.disabled, true);
  assert.equal(h.fallback.removed, false);
  await h.send();
  assert.equal(h.calls(), 0);
});

test("confirmed success removes fields and emits only a non-PII event", async () => {
  const h = harness();
  assert.equal(h.fallback.removed, true);
  await h.send();
  assert.equal(h.calls(), 1);
  assert.match(h.status.textContent, /Request received/);
  assert.equal(h.status.wasVisibleWhenCleared, true);
  assert.equal(h.fields.name.closest().removed, true);
  assert.equal(h.submitted().get("detail"), "A&B <C> QA request");
  assert.equal(h.submitted().get("email"), "qa@example.com");
  assert.deepEqual(JSON.parse(JSON.stringify(h.dataLayer)), [{ event: "audit_request_submit" }]);
});

test("blank name, bad email, and excess length block submission", async () => {
  const h = harness();
  h.fields.name.value = "  ";
  await h.send();
  assert.equal(h.calls(), 0);
  assert.equal(h.fields.name.focused, true);
  h.fields.name.value = "QA Tester";
  h.fields.email.value = "invalid";
  await h.send();
  assert.equal(h.calls(), 0);
  h.fields.email.value = "qa@example.com";
  h.fields.business.value = "x".repeat(161);
  await h.send();
  assert.equal(h.calls(), 0);
});

test("honeypot stops delivery", async () => {
  const h = harness();
  h.trap.value = "bot";
  await h.send();
  assert.equal(h.calls(), 0);
});

test("rapid submissions share one in-flight request", async () => {
  let resolve;
  const h = harness({ fetchImpl: () => new Promise(done => { resolve = done; }) });
  const first = h.send();
  const second = h.send();
  await second;
  assert.equal(h.calls(), 1);
  assert.equal(h.submit.disabled, true);
  resolve({ ok: true, json: async () => ({ success: true }) });
  await first;
  await h.send();
  assert.equal(h.calls(), 1);
});

for (const scenario of [
  { name: "HTTP 200 success:false", options: { receipt: { success: false } } },
  { name: "rate limit", options: { status: 429 } }
]) {
  test(scenario.name + " preserves answers without success event", async () => {
    const h = harness(scenario.options);
    await h.send();
    assert.equal(h.submit.disabled, false);
    assert.equal(h.fields.name.value, "QA Tester");
    assert.equal(h.fields.name.closest().removed, false);
    assert.equal(h.dataLayer.length, 0);
    assert.match(h.status.textContent, /That did not send/);
  });
}

test("provider server error keeps an uncertain request from being repeated", async () => {
  const h = harness({ status: 500 });
  await h.send();
  assert.equal(h.submit.disabled, true);
  assert.equal(h.fields.name.value, "QA Tester");
  assert.match(h.status.textContent, /may have arrived/);
  assert.equal(h.dataLayer.length, 0);
});

for (const receipt of [{}, null, [], { success: "true" }]) {
  test("ambiguous JSON receipt stays locked with answers intact: " + JSON.stringify(receipt), async () => {
    const h = harness({ receipt });
    await h.send();
    assert.equal(h.calls(), 1);
    assert.equal(h.submit.disabled, true);
    assert.equal(h.fields.name.value, "QA Tester");
    assert.equal(h.fields.name.closest().removed, false);
    assert.equal(h.dataLayer.length, 0);
    assert.match(h.status.textContent, /may have arrived/);
    assert.equal(h.status.wasVisibleWhenCleared, true);
    await h.send();
    assert.equal(h.calls(), 1);
  });
}

for (const scenario of [
  { name: "invalid JSON", fetchImpl: () => ({ ok: true, json: async () => { throw Error("bad JSON"); } }) },
  { name: "offline", fetchImpl: () => { throw Error("offline"); } },
  { name: "timeout while reading receipt", fetchImpl: (options) => ({
    ok: true,
    json: () => new Promise((_resolve, reject) =>
      options.signal.addEventListener("abort", () => reject(Error("aborted"))))
  }) }
]) {
  test(scenario.name + " leaves an uncertain send and retained answers", async () => {
    const h = harness({ fetchImpl: scenario.fetchImpl });
    const pending = h.send();
    if (scenario.name.startsWith("timeout")) {
      for (let i = 0; i < 10; i++) await Promise.resolve();
      h.timeout();
    }
    await pending;
    assert.equal(h.calls(), 1);
    assert.equal(h.submit.disabled, true);
    assert.equal(h.fields.detail.value, "A&B <C> QA request");
    assert.equal(h.dataLayer.length, 0);
    assert.match(h.status.textContent, /may have arrived/);
  });
}

test("analytics failure does not undo confirmed delivery", async () => {
  const h = harness({ analyticsThrows: true });
  await h.send();
  assert.match(h.status.textContent, /Request received/);
  assert.equal(h.fields.name.closest().removed, true);
});
