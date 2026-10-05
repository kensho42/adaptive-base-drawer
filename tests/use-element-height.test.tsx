import { StrictMode } from 'react';
import { act, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { heightDuration, readElementHeight, useElementHeight } from '../src/use-element-height';
import { installObserver, TestResizeObserver } from './resize-observer';

let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
function flush() { act(() => { const pending = [...frames.values()]; frames.clear(); pending.forEach(cb => cb(0)); }); }
function Harness({ height, view = 'a', enabled = true }: { height: number; view?: string; enabled?: boolean }) {
  const measurement = useElementHeight<HTMLDivElement>(view, enabled);
  return <><div ref={measurement.ref} style={{ height, boxSizing: 'border-box' }} data-testid="target" /><output data-testid="height">{measurement.height ?? 'unknown'}</output></>;
}
function resize(height: number) {
  screen.getByTestId('target').style.height = `${height}px`;
  act(() => TestResizeObserver.instances.at(-1)!.emit());
  flush();
}
beforeEach(() => {
  installObserver(); frames = new Map(); nextFrame = 0;
  vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => { frames.set(++nextFrame, cb); return nextFrame; }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => frames.delete(id)));
});
afterEach(() => vi.unstubAllGlobals());

describe('intrinsic height measurement', () => {
  it('measures initially before paint and retains fractional pixels', () => {
    render(<Harness height={280.25} />);
    expect(screen.getByTestId('height')).toHaveTextContent('280.25');
    expect(TestResizeObserver.instances[0].observe).toHaveBeenCalledWith(screen.getByTestId('target'), { box: 'border-box' });
  });
  it('grows on ResizeObserver updates without a React state change', () => { render(<Harness height={280} />); resize(430); expect(screen.getByTestId('height')).toHaveTextContent('430'); });
  it('shrinks on ResizeObserver updates', () => { render(<Harness height={430} />); resize(220); expect(screen.getByTestId('height')).toHaveTextContent('220'); });
  it('measures a keyed layout change synchronously', () => {
    const { rerender } = render(<Harness height={280} />);
    rerender(<Harness height={417} view="b" />);
    expect(screen.getByTestId('height')).toHaveTextContent('417');
  });
  it('ignores repeated tiny changes but accepts accumulated meaningful changes', () => {
    render(<Harness height={280.25} />);
    for (const height of [280.3,280.15,280.49,280.2,280.51,280.25]) resize(height);
    expect(screen.getByTestId('height')).toHaveTextContent('280.25');
    resize(281); expect(screen.getByTestId('height')).toHaveTextContent('281');
  });
  it('coalesces observer bursts to one outstanding frame', () => {
    render(<Harness height={200} />);
    act(() => { for (let i=0;i<10;i++) TestResizeObserver.instances[0].emit(); });
    expect(frames.size).toBe(1); flush();
  });
  it('disconnects, cancels frames, and rejects callbacks after unmount', () => {
    const { unmount } = render(<Harness height={200} />);
    const observer = TestResizeObserver.instances[0];
    act(() => observer.emit());
    const stale = [...frames.values()][0];
    unmount();
    expect(observer.disconnect).toHaveBeenCalledTimes(1); expect(frames.size).toBe(0);
    act(() => { observer.emit(); stale(0); });
    expect(frames.size).toBe(0);
  });
  it('survives Strict Mode and disconnects every created observer', () => {
    const { unmount } = render(<StrictMode><Harness height={285.5} /></StrictMode>);
    expect(screen.getByTestId('height')).toHaveTextContent('285.5');
    unmount(); TestResizeObserver.instances.forEach(observer => expect(observer.disconnect).toHaveBeenCalledTimes(1));
  });
  it('does not create an observer when disabled', () => { render(<Harness height={200} enabled={false} />); expect(TestResizeObserver.instances).toHaveLength(0); expect(screen.getByTestId('height')).toHaveTextContent('unknown'); });
  it('accepts zero height without leaving old space', () => { render(<Harness height={200} />); resize(0); expect(screen.getByTestId('height')).toHaveTextContent('0'); });
  it('supports missing ResizeObserver with initial/key measurements', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const { rerender } = render(<Harness height={200} />);
    rerender(<Harness height={300} view="b" />); expect(screen.getByTestId('height')).toHaveTextContent('300');
  });
  it('starts unmeasured before receiving an element', () => { const { result } = renderHook(() => useElementHeight()); expect(result.current.height).toBeNull(); });
  it('reads box size independently of visual transforms', () => {
    const element = document.createElement('div');
    element.style.cssText = 'height:280.25px;padding:10px;border:1px solid;box-sizing:content-box;transform:scale(.9)';
    document.body.append(element); expect(readElementHeight(element)).toBe(302.25); element.remove();
  });
});

it('clamps distance-based timing and skips the first measurement', () => {
  expect(heightDuration(null, 280)).toBe(0);
  expect(heightDuration(280, 281)).toBe(.15);
  expect(heightDuration(280, 380)).toBe(.2);
  expect(heightDuration(430, 220)).toBe(.28);
});
