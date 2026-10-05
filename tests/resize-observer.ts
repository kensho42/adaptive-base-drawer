import { vi } from 'vitest';
export class TestResizeObserver {
  static instances: TestResizeObserver[] = [];
  callback: ResizeObserverCallback;
  target: Element | null = null;
  observe = vi.fn((target: Element) => { this.target = target; });
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(callback: ResizeObserverCallback) { this.callback = callback; TestResizeObserver.instances.push(this); }
  emit() { this.callback([], this as unknown as ResizeObserver); }
}
export function installObserver() {
  TestResizeObserver.instances = [];
  vi.stubGlobal('ResizeObserver', TestResizeObserver);
}
