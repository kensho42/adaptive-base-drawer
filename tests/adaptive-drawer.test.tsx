import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useReducedMotion } from 'motion/react';
import { AdaptiveDrawer, AdaptiveDrawerContent, AdaptiveDrawerTitle, AdaptiveDrawerDescription, AdaptiveHeight } from '../src';
import { installObserver } from './resize-observer';
vi.mock('motion/react', async (importOriginal) => ({ ...await importOriginal<typeof import('motion/react')>(), useReducedMotion: vi.fn(() => false) }));
beforeEach(() => { installObserver(); vi.mocked(useReducedMotion).mockReturnValue(false); });

it('starts at intrinsic size, with no 0px opening animation', () => {
  const { container } = render(<AdaptiveHeight contentKey="a"><div style={{ height: 280 }}>First</div></AdaptiveHeight>);
  expect(container.querySelector('[data-adaptive-height]')).toHaveAttribute('data-height-duration', '0');
});
it('removes the old panel from interaction and accessibility immediately', () => {
  const { rerender, container } = render(<AdaptiveHeight contentKey="a"><button>Old</button></AdaptiveHeight>);
  rerender(<AdaptiveHeight contentKey="b"><button>New</button></AdaptiveHeight>);
  const outgoing = container.querySelector('[data-panel-present="false"]');
  expect(outgoing).toHaveAttribute('aria-hidden', 'true'); expect(outgoing).toHaveAttribute('inert');
  expect(screen.getAllByRole('button')).toHaveLength(1);
  expect(screen.getByRole('button')).toHaveTextContent('New');
});
it('keeps persistent title slots unique across panel changes', () => {
  const header = <h2>Stable title</h2>;
  const { rerender } = render(<AdaptiveHeight contentKey="a" header={header}>First</AdaptiveHeight>);
  rerender(<AdaptiveHeight contentKey="b" header={header}>Second</AdaptiveHeight>);
  expect(screen.getAllByText('Stable title')).toHaveLength(1);
});
it('reduced motion sets zero height duration and no translate or blur', () => {
  vi.mocked(useReducedMotion).mockReturnValue(true);
  const { container, rerender } = render(<AdaptiveHeight contentKey="a">First</AdaptiveHeight>);
  rerender(<AdaptiveHeight contentKey="b">Second</AdaptiveHeight>);
  expect(container.querySelector('[data-adaptive-height]')).toHaveAttribute('data-height-duration', '0');
  const incoming = container.querySelector('[data-panel-present="true"]') as HTMLElement;
  expect(incoming.style.transform).not.toContain('translate');
  expect(incoming.style.filter).toBe('blur(0px)');
});
it('crossFade=false keeps an incoming panel opaque', () => {
  const { rerender, container } = render(<AdaptiveHeight crossFade={false} contentKey="a">First</AdaptiveHeight>);
  rerender(<AdaptiveHeight crossFade={false} contentKey="b">Second</AdaptiveHeight>);
  expect((container.querySelector('[data-panel-present="true"]') as HTMLElement).style.opacity).toBe('1');
});
it.each([['snap', { snapPoints: [0.5,1] }], ['horizontal', { swipeDirection: 'right' as const }]])('%s mode bypasses adaptive sizing', (_, rootProps) => {
  const { baseElement } = render(<AdaptiveDrawer defaultOpen {...rootProps}><AdaptiveDrawerContent contentKey="a" header={<AdaptiveDrawerTitle>Test drawer</AdaptiveDrawerTitle>}>Content</AdaptiveDrawerContent></AdaptiveDrawer>);
  expect(baseElement.querySelector('[data-adaptive-height]')).toBeNull();
  const wrapper = baseElement.querySelector('[data-adaptive-scroll]')!.parentElement!;
  expect(wrapper.style.height).not.toMatch(/^\d+(\.\d+)?px$/);
});

it('themed label wrappers preserve render, refs, state class names, and Base UI labeling', () => {
  const titleRef = createRef<HTMLHeadingElement>();
  const descriptionRef = createRef<HTMLParagraphElement>();
  render(<AdaptiveDrawer defaultOpen><AdaptiveDrawerContent contentKey="a" header={<>
    <AdaptiveDrawerTitle ref={titleRef} render={<h3 data-testid="custom-title" />} className={() => 'consumer-title'}>Themed title</AdaptiveDrawerTitle>
    <AdaptiveDrawerDescription ref={descriptionRef} className={() => 'consumer-description'}>Themed description</AdaptiveDrawerDescription>
  </>}>Content</AdaptiveDrawerContent></AdaptiveDrawer>);
  expect(titleRef.current).toBe(screen.getByTestId('custom-title'));
  expect(titleRef.current).toHaveClass('consumer-title');
  expect(descriptionRef.current).toHaveClass('consumer-description');
  expect(screen.getByRole('dialog')).toHaveAccessibleName('Themed title');
  expect(screen.getByRole('dialog')).toHaveAccessibleDescription('Themed description');
});
