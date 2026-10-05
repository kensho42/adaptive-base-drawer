"use client";

import { createContext, forwardRef, useContext, useRef, type ReactNode } from 'react';
import { Drawer } from '@base-ui/react/drawer';
import { AnimatePresence, motion, useIsPresent, useReducedMotion, type Transition } from 'motion/react';
import { heightDuration, useElementHeight, useIsomorphicLayoutEffect } from './use-element-height';
import styles from './adaptive-drawer.module.css';

const ease = [0.22, 1, 0.36, 1] as const;
const Context = createContext({ adaptive: true, snap: false, modal: true as Drawer.Root.Props['modal'], showSwipeHandle: true });

export interface AdaptiveDrawerProps extends Drawer.Root.Props {
  showSwipeHandle?: boolean;
}

/** Base UI owns state, semantics, focus, snapping, nesting, and gestures. */
export function AdaptiveDrawer({ swipeDirection = 'down', snapPoints, modal = true, showSwipeHandle = true, ...props }: AdaptiveDrawerProps) {
  const snap = Boolean(snapPoints?.length);
  const adaptive = !snap && (swipeDirection === 'down' || swipeDirection === 'up');
  return (
    <Context.Provider value={{ adaptive, snap, modal, showSwipeHandle }}>
      <Drawer.Root swipeDirection={swipeDirection} snapPoints={snapPoints} modal={modal} {...props} />
    </Context.Provider>
  );
}

export const AdaptiveDrawerTrigger = Drawer.Trigger;
export const AdaptiveDrawerClose = Drawer.Close;
// Keep Base UI's ref, render prop, state className, and label registration.
export const AdaptiveDrawerTitle = forwardRef<HTMLHeadingElement, Drawer.Title.Props>(function AdaptiveDrawerTitle({ className, ...props }, ref) {
  return <Drawer.Title {...props} ref={ref} data-slot="drawer-title" className={(state) => [styles.title, typeof className === 'function' ? className(state) : className].filter(Boolean).join(' ')} />;
});
export const AdaptiveDrawerDescription = forwardRef<HTMLParagraphElement, Drawer.Description.Props>(function AdaptiveDrawerDescription({ className, ...props }, ref) {
  return <Drawer.Description {...props} ref={ref} data-slot="drawer-description" className={(state) => [styles.description, typeof className === 'function' ? className(state) : className].filter(Boolean).join(' ')} />;
});

export interface AdaptiveHeightProps {
  children: ReactNode;
  /** Persistent slots, measured with the panel but never duplicated on exit. */
  header?: ReactNode;
  footer?: ReactNode;
  /** A stable identity for the current view; change it to transition panels. */
  contentKey: string | number;
  enabled?: boolean;
  /** Disable opacity cross-fading while retaining translation and blur. */
  crossFade?: boolean;
  heightTransition?: Transition;
  panelTransition?: Transition;
  className?: string;
}

/** Reusable inside an existing shadcn Base DrawerContent (see README). */
export function AdaptiveHeight({
  children, header, footer, contentKey, enabled = true, crossFade = true,
  heightTransition, panelTransition, className,
}: AdaptiveHeightProps) {
  const { ref, height, previousHeight } = useElementHeight<HTMLDivElement>(contentKey, enabled);
  const reduced = useReducedMotion();
  const duration = heightDuration(previousHeight, height);
  const firstMeasurement = previousHeight === null;
  const resolvedHeightTransition: Transition = !enabled || reduced || firstMeasurement
    ? { duration: 0 }
    : { duration, ease, ...heightTransition };
  const resolvedPanelTransition: Transition = reduced ? { duration: 0 }
    : { duration: 0.2, ease, ...panelTransition };
  const stage = useRef<HTMLDivElement>(null);
  const focusWasInPanel = useRef(false);

  // A stable stage receives focus only if the outgoing view owned it. Base UI
  // still owns the focus trap and all open/close focus handling.
  useIsomorphicLayoutEffect(() => {
    const element = stage.current;
    const exitingOwnsFocus = element?.querySelector('[data-panel-present="false"]')?.contains(document.activeElement);
    if (element && (exitingOwnsFocus || (focusWasInPanel.current && !element.contains(document.activeElement)))) {
      element.focus({ preventScroll: true });
    }
    focusWasInPanel.current = false;
    return () => {
      focusWasInPanel.current = Boolean(element?.querySelector('[data-panel-present="true"]')?.contains(document.activeElement));
    };
  }, [contentKey]);

  return (
    <motion.div
      className={[styles.height, className].filter(Boolean).join(' ')}
      data-adaptive-height={enabled ? '' : undefined}
      data-height={enabled ? height ?? undefined : undefined}
      data-height-duration={enabled ? resolvedHeightTransition.duration : undefined}
      initial={false}
      animate={{ height: enabled ? height ?? 'auto' : 'auto' }}
      transition={resolvedHeightTransition}
    >
      <div className={styles.scroll} data-adaptive-scroll="">
        <div ref={ref} className={styles.intrinsic} data-adaptive-intrinsic="">
          {header}
          <div ref={stage} tabIndex={-1} className={styles.stage} data-adaptive-stage="">
            <AnimatePresence mode="popLayout" initial={false}>
              <Panel key={contentKey} reduced={Boolean(reduced)} crossFade={crossFade} transition={resolvedPanelTransition}>
                {children}
              </Panel>
            </AnimatePresence>
          </div>
          {footer}
        </div>
      </div>
    </motion.div>
  );
}

interface PanelProps {
  children: ReactNode;
  reduced: boolean;
  crossFade: boolean;
  transition: Transition;
}

// popLayout must receive the actual DOM ref through its immediate child.
const Panel = forwardRef<HTMLDivElement, PanelProps>(function Panel({ children, reduced, crossFade, transition }, ref) {
  const present = useIsPresent();
  return (
    <motion.div
      ref={ref}
      className={styles.panel}
      data-panel-present={present}
      aria-hidden={present ? undefined : true}
      inert={present ? undefined : true}
      initial={reduced ? false : { opacity: crossFade ? 0 : 1, y: 8, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={reduced ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: crossFade ? 0 : 1, y: -5, filter: 'blur(3px)' }}
      transition={transition}
    >
      {children}
    </motion.div>
  );
});

export interface AdaptiveDrawerContentProps extends Omit<Drawer.Popup.Props, 'children'> {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  contentKey: string | number;
  crossFade?: boolean;
  heightTransition?: Transition;
  panelTransition?: Transition;
}

export const AdaptiveDrawerContent = forwardRef<HTMLDivElement, AdaptiveDrawerContentProps>(function AdaptiveDrawerContent({
  children, header, footer, contentKey, crossFade, heightTransition, panelTransition, className, ...props
}, ref) {
  const { adaptive, snap, modal, showSwipeHandle } = useContext(Context);
  return (
    <Drawer.Portal>
      {modal === true && <Drawer.Backdrop className={styles.backdrop} data-snap-points={snap ? '' : undefined} />}
      <Drawer.Viewport className={styles.viewport} data-modal={modal}>
        <Drawer.Popup
          {...props}
          ref={ref}
          data-slot="drawer-popup"
          data-snap-points={snap ? '' : undefined}
          className={(state) => [styles.popup, typeof className === 'function' ? className(state) : className].filter(Boolean).join(' ')}
        >
          {showSwipeHandle && <div className={styles.handle} aria-hidden="true" data-swipe-handle="" />}
          <Drawer.Content className={styles.content}>
            <AdaptiveHeight header={header} footer={footer} contentKey={contentKey} enabled={adaptive} crossFade={crossFade} heightTransition={heightTransition} panelTransition={panelTransition}>
              {children}
            </AdaptiveHeight>
          </Drawer.Content>
        </Drawer.Popup>
      </Drawer.Viewport>
    </Drawer.Portal>
  );
});
