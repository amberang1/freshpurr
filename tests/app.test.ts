import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';

test('care flows survive remounts; zero stock and failed readings remain honest', async () => {
  const dom = new JSDOM('<div id="app"></div>', { url: 'http://localhost' });
  const w = dom.window as any;
  for (const key of ['window', 'document', 'localStorage', 'HTMLElement', 'Element', 'Node', 'MutationObserver', 'getComputedStyle']) Object.defineProperty(globalThis, key, { value: w[key], configurable: true });
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: w.navigator.userAgent, geolocation: { getCurrentPosition: (_ok: unknown, fail: Function) => fail({ code: 1 }) } }, configurable: true });
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  (globalThis as any).requestAnimationFrame = (fn: Function) => setTimeout(fn, 0);
  (globalThis as any).cancelAnimationFrame = clearTimeout;
  (globalThis as any).confirm = () => true;
  (globalThis as any).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  (globalThis as any).alert = (message: string) => { throw new Error(message); };
  const { createRoot } = await import('react-dom/client');
  const { default: App } = await import('../src/App');
  const host = document.getElementById('app')!;
  let root = createRoot(host);
  const flush = () => act(async () => { await new Promise(r => setTimeout(r, 30)); });
  const click = async (text: string) => {
    const el = [...host.querySelectorAll('button')].find(b => b.textContent?.trim() === text || b.getAttribute('aria-label') === text);
    assert.ok(el, `Button ${text} exists`); await act(async () => (el as HTMLButtonElement).click()); await flush();
  };
  const input = async (el: HTMLInputElement, value: string) => {
    assert.ok(el); await act(async () => {
      Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value')!.set!.call(el, value);
      el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true }));
    });
  };
  try {
    await act(async () => root.render(React.createElement(App))); await flush();
    await click('Profile');
    await input(host.querySelector('form input')!, 'Kits');
    await act(async () => host.querySelector('form')!.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })));
    assert.equal(JSON.parse(localStorage.getItem('breeze_care_v1')!).profile.name, 'Kits');
    await click('Meds'); await click('Add medication');
    await input(host.querySelector('input[placeholder="e.g. Flovent, Prednisolone"]')!, 'Flovent');
    await input(host.querySelector('input[placeholder="e.g. 1 puff, 5mg"]')!, '1 puff');
    await input(host.querySelector('input[aria-label="Current Stock"]')!, '1');
    await input(host.querySelector('input[aria-label="Reminder times"]')!, '');
    await click('Save Medication'); await click('Record dose');
    assert.equal(JSON.parse(localStorage.getItem('breeze_care_v1')!).meds[0].stock, 0);
    assert.ok((([...host.querySelectorAll('button')].find(b => b.textContent === 'Record dose')) as HTMLButtonElement).disabled);
    await click('Home'); await click('Log Symptom'); await click('Dust'); await click('Save Log');
    assert.equal(JSON.parse(localStorage.getItem('breeze_care_v1')!).history.length, 1);
    await act(async () => root.unmount()); root = createRoot(host);
    await act(async () => root.render(React.createElement(App))); await flush();
    await click('Profile'); assert.match(host.textContent!, /Kits/);
    await click('Meds'); assert.match(host.textContent!, /0 \/ 1 left/);
    await click('Edit / refill');
    await input(host.querySelector('input[aria-label="Current Stock"]')!, '4');
    await input(host.querySelector('input[aria-label="Reminder times"]')!, '25:00');
    assert.ok((([...host.querySelectorAll('button')].find(b => b.textContent === 'Save Medication')) as HTMLButtonElement).disabled);
    await input(host.querySelector('input[aria-label="Reminder times"]')!, '');
    await click('Save Medication'); await click('Record dose');
    assert.equal(JSON.parse(localStorage.getItem('breeze_care_v1')!).meds[0].stock, 3);
    await click('Undo'); assert.equal(JSON.parse(localStorage.getItem('breeze_care_v1')!).meds[0].stock, 4);
    await click('Delete'); assert.equal(JSON.parse(localStorage.getItem('breeze_care_v1')!).meds.length, 0);
    await click('Env'); assert.match(host.textContent!, /Environmental Data Error/); assert.doesNotMatch(host.textContent!, /Low Risk/);
    assert.match(host.textContent!, /Dust was the most frequently recorded/);
    await act(async () => root.unmount()); localStorage.setItem('breeze_care_v1', '{broken'); root = createRoot(host);
    await act(async () => root.render(React.createElement(App))); await flush();
    assert.equal(localStorage.getItem('breeze_care_v1'), '{broken');
    assert.match(host.textContent!, /Saved data could not be opened/);
  } finally { await act(async () => root.unmount()); dom.window.close(); }
});
