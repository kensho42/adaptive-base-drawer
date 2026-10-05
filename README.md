# Adaptive Base Drawer

[![Checks](https://github.com/kensho42/adaptive-base-drawer/actions/workflows/ci.yml/badge.svg)](https://github.com/kensho42/adaptive-base-drawer/actions/workflows/ci.yml) · [MIT](LICENSE)

A shadcn-style **Base UI** drawer that smoothly follows its content. React, TypeScript, `@base-ui/react`, `motion/react`, and CSS Modules. No Vaul or Tailwind dependency.

| Component | When content changes height |
| --- | --- |
| shadcn Base Drawer | Content height changes correctly, but can jump |
| Adaptive Base Drawer | Content height changes and smoothly interpolates between measured heights |

Smooth growth **and** shrinkage, asynchronous/in-place resizing, optional cross-fading, reduced-motion support, and current shadcn theme tokens. Base UI keeps ownership of focus, accessibility, open/close lifecycle, swipe dismissal, and nested drawers.

**Start here:** [Installation](#installation) · [Quickstart](#quickstart) · [Common recipes](#common-recipes) · [API](#api) · [Theming](#shadcn-theming) · [Existing shadcn Drawer](#using-your-existing-shadcn-base-drawer) · [Demo](#run-the-demo)

## Installation

### Requirements

- React and React DOM **19+**.
- `@base-ui/react` **1.8+ within v1** and Motion **14.x** (the tested versions are locked in this repository).
- A React bundler with CSS Modules support, such as Vite or Next.js.
- A modern browser with `ResizeObserver` and `inert` support.

This repository has not been published to npm. Choose source installation or build a local package; `npm install adaptive-base-drawer` is not an available installation method.

### Option 1: copy the source (recommended for shadcn projects)

Install the dependencies **in your application**:

```sh
npm install @base-ui/react@^1.8.0 motion@^14.0.0
```

Clone this repository, then copy the four runtime files from [`src/`](src/) into your application's `src/components/adaptive-base-drawer/`:

```text
src/components/adaptive-base-drawer/
├── adaptive-drawer.tsx
├── adaptive-drawer.module.css
├── use-element-height.ts
└── index.ts
```

Import from that directory's `index.ts`. The component imports its CSS Module automatically. Do not copy the demo stylesheet into your application: it defines the demo's global theme. Your existing shadcn tokens will theme the library.

No Tailwind dependency or configuration is required. If your project already uses Tailwind, the component works alongside it.

### Option 2: build and install a local package

From a clone of this repository:

```sh
npm ci
npm run build
npm pack
```

Install the generated tarball in your application (adjust the path):

```sh
npm install /path/to/adaptive-base-drawer/adaptive-base-drawer-0.1.0.tgz
```

For this installation method, import both the library and its compiled CSS:

```tsx
import {
  AdaptiveDrawer,
  AdaptiveDrawerTrigger,
  AdaptiveDrawerContent,
} from 'adaptive-base-drawer';
import 'adaptive-base-drawer/style.css';
```

The source-copy method and package method expose the same API. The package build is ESM, includes TypeScript declarations, keeps React/Base UI/Motion external, and preserves `"use client"`.

## Quickstart

This complete example assumes source installation and lives in `src/example.tsx`. For a package installation, change the component import to `adaptive-base-drawer` and include its stylesheet as shown above.

```tsx
"use client";

import { useState } from 'react';
import {
  AdaptiveDrawer,
  AdaptiveDrawerTrigger,
  AdaptiveDrawerContent,
  AdaptiveDrawerTitle,
  AdaptiveDrawerDescription,
  AdaptiveDrawerClose,
} from './components/adaptive-base-drawer';
import styles from './example.module.css';

export function Example() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  return (
    <AdaptiveDrawer>
      <AdaptiveDrawerTrigger className={styles.action}>
        Set up your profile
      </AdaptiveDrawerTrigger>
      <AdaptiveDrawerContent
        contentKey={step}
        header={
          <header className={styles.header}>
            <AdaptiveDrawerTitle>Profile setup</AdaptiveDrawerTitle>
            <AdaptiveDrawerDescription>
              Step {step + 1} of 3
            </AdaptiveDrawerDescription>
          </header>
        }
        footer={
          <footer className={styles.footer}>
            <AdaptiveDrawerClose className={styles.secondary}>
              Close
            </AdaptiveDrawerClose>
            <button
              type="button"
              className={styles.action}
              onClick={() => setStep((current) => (current + 1) % 3)}
            >
              {step === 2 ? 'Back to the start' : 'Next'}
            </button>
          </footer>
        }
      >
        <section className={styles.body}>
          {step === 0 && <p>Welcome. Let's make this profile yours.</p>}
          {step === 1 && (
            <>
              <label className={styles.field}>
                Your name
                <input
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => setShowHelp((current) => !current)}
              >
                {showHelp ? 'Hide help' : 'Show help'}
              </button>
              {showHelp && (
                <p className={styles.help} role="status">
                  Use the name you want others to see. Adding this block
                  resizes the drawer without changing the panel key.
                </p>
              )}
            </>
          )}
          {step === 2 && (
            <>
              <h3>Review your profile</h3>
              <p>Name: {name || 'Not supplied yet'}</p>
              <p>Return to the form to make changes, or close the drawer.</p>
            </>
          )}
        </section>
      </AdaptiveDrawerContent>
    </AdaptiveDrawer>
  );
}
```

Create `src/example.module.css`:

```css
.header, .body, .footer { padding: 24px; }
.header, .body { display: grid; gap: 12px; }
.header { padding-bottom: 0; }
.body p, .body h3 { margin: 0; }
.footer { display: flex; justify-content: space-between; gap: 12px; }
.field { display: grid; gap: 8px; }
.field input {
  box-sizing: border-box;
  width: 100%;
  padding: 10px 12px;
  font: inherit;
  color: var(--foreground, #18181b);
  background: var(--background, #fff);
  border: 1px solid var(--input, #e4e4e7);
  border-radius: var(--radius, 0.625rem);
}
.action, .secondary {
  padding: 10px 16px;
  font: inherit;
  border: 1px solid var(--border, #e4e4e7);
  border-radius: var(--radius, 0.625rem);
  cursor: pointer;
}
.action {
  background: var(--primary, #18181b);
  color: var(--primary-foreground, #fafafa);
}
.secondary {
  background: var(--secondary, #f4f4f5);
  color: var(--secondary-foreground, #18181b);
}
.help {
  padding: 12px;
  background: var(--muted, #f4f4f5);
  color: var(--muted-foreground, #71717a);
  border-radius: var(--radius, 0.625rem);
}
.action:focus-visible, .secondary:focus-visible, .field input:focus-visible {
  outline: 2px solid var(--ring, #a1a1aa);
  outline-offset: 2px;
}
```

### How to use the panel key

Change `contentKey` when switching to a **different view**. The outgoing view leaves layout while its visual exit runs; the incoming view immediately sets the intrinsic height.

Keep `contentKey` **unchanged** for validation messages, network responses, loaded images, conditional fields, text wrapping, and accordions inside the current view. ResizeObserver detects those changes. No manual measurement or special callback is required.

Keyed views remount. Hoist form data or other state that must survive navigation into the parent, as the example does with `name`.

### Persistent header and footer

Put `AdaptiveDrawerTitle` and `AdaptiveDrawerDescription` in the persistent `header` slot. They stay registered with Base UI and are never duplicated during exit. Use ordinary headings inside the keyed body.

A persistent `footer` keeps navigation controls and focus stable. Both slots are included in height measurement and scroll with the body; they are not sticky. The default height cap matches shadcn Base Drawer: `calc(100dvh - 6rem)`. When content reaches that cap, the inner scroll area keeps the complete active panel and footer reachable.

## Common recipes

### Turn off cross-fading

```tsx
<AdaptiveDrawerContent contentKey={step} crossFade={false}>
  <section>Current step: {step + 1}</section>
</AdaptiveDrawerContent>
```

`crossFade={false}` keeps both panels opaque. Height, subtle translation, and blur still animate. Reduced-motion preference disables all panel effects and updates height immediately.

### Customize timing

```tsx
<AdaptiveDrawerContent
  contentKey={step}
  heightTransition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
  panelTransition={{ duration: 0.18 }}
>
  <section>Current step: {step + 1}</section>
</AdaptiveDrawerContent>
```

Without overrides, height duration scales with the size change (0.15–0.28s). The first measurement and reduced-motion updates always use zero height duration.

### Use your shadcn Button

```tsx
import { Button } from '@/components/ui/button';

<AdaptiveDrawer>
  <AdaptiveDrawerTrigger render={<Button variant="outline" />}>
    Open
  </AdaptiveDrawerTrigger>
  <AdaptiveDrawerContent
    contentKey={step}
    header={<AdaptiveDrawerTitle>Profile setup</AdaptiveDrawerTitle>}
    footer={
      <AdaptiveDrawerClose render={<Button variant="secondary" />}>
        Cancel
      </AdaptiveDrawerClose>
    }
  >
    <section>Current step: {step + 1}</section>
  </AdaptiveDrawerContent>
</AdaptiveDrawer>
```

Use Base UI's `render` prop to compose the button. It renders one button rather than nesting buttons; this API does not use Vaul/Radix `asChild`.

### Control open state

Inside your React component:

```tsx
const [open, setOpen] = useState(false);

<AdaptiveDrawer open={open} onOpenChange={setOpen}>
  {/* Trigger and content */}
</AdaptiveDrawer>
```

Use `onOpenChangeComplete` when work must wait for Base UI's opening/closing animation. Popup props such as `initialFocus` and `finalFocus` go on `AdaptiveDrawerContent`.

### Use snap points

```tsx
<AdaptiveDrawer snapPoints={['240px', 1]}>
  <AdaptiveDrawerTrigger>Open snap drawer</AdaptiveDrawerTrigger>
  <AdaptiveDrawerContent
    contentKey={step}
    header={<AdaptiveDrawerTitle>Snap-point drawer</AdaptiveDrawerTitle>}
  >
    <section>Current step: {step + 1}</section>
  </AdaptiveDrawerContent>
</AdaptiveDrawer>
```

A nonempty `snapPoints` array disables adaptive numeric height sizing. Base UI owns the snap height/offset; panel transitions can still run. Horizontal (`left`/`right`) drawers also bypass adaptive height. Ordinary vertical (`down`/`up`) drawers adapt automatically. If changing snap configuration after initialization, use Base UI's controlled snap-point API.

## API

### `AdaptiveDrawer`

Accepts Base UI `Drawer.Root.Props`: controlled/uncontrolled `open`, lifecycle callbacks with original event details, `modal`, `swipeDirection`, snap-point props, action/handle props, and children. Base UI receives them directly.

| Extra prop | Default | Behavior |
| --- | --- | --- |
| `showSwipeHandle` | `true` | Show the decorative grab handle |

`AdaptiveDrawerTrigger` and `AdaptiveDrawerClose` are direct aliases of their Base UI primitives. `AdaptiveDrawerTitle` and `AdaptiveDrawerDescription` are thin styled wrappers with default typography and muted description color. All preserve Base UI’s `render`, refs, state-dependent `className`, and accessibility behavior.

### `AdaptiveDrawerContent`

Accepts Base UI `Drawer.Popup.Props` (including refs, `initialFocus`, `finalFocus`, `className`, and `style`) and:

| Prop | Default | Behavior |
| --- | --- | --- |
| `contentKey` | Required | String/number identity of the active panel |
| `children` | Required | Intrinsically sized panel content |
| `header`, `footer` | — | Persistent, measured content outside the keyed panel |
| `crossFade` | `true` | Set `false` to keep incoming/outgoing panels opaque; subtle translation and blur remain |
| `heightTransition` | Distance-based tween | Motion transition override, e.g. `{ duration: 0.22 }` |
| `panelTransition` | 0.2s tween | Motion transition override |

Good defaults use 0.15–0.28s height durations, scaled by the size difference, and `[0.22, 1, 0.36, 1]` easing. Enter: opacity 0 → 1, translate 8px → 0, blur 4px → 0. Exit: opacity 1 → 0, translate 0 → −5px, blur 0 → 3px. Height and panel transitions run concurrently. Overrides cannot turn the first measurement or reduced-motion update into a height animation.

### `AdaptiveHeight`

The reusable inner primitive accepts the same adaptive props plus `enabled` (default `true`) and a wrapper `className`. It can be placed inside your existing shadcn Base `DrawerContent`. It does not create a drawer, portal, or focus trap.

### `useElementHeight(layoutKey?, enabled?)`

Returns `{ ref, height, previousHeight }`. Attach the callback ref to an intrinsically sized block. Initial and key-change measurements run before paint. ResizeObserver notifications coalesce into one animation frame; cleanup disconnects the observer, cancels frames, and rejects stale callbacks. Measurements retain fractional pixels and ignore differences under 0.5px. Reading computed layout size avoids scaling measurements when an ancestor drawer is transformed.

## shadcn theming

The component reads the **current shadcn semantic CSS variables** directly. No Tailwind dependency or separate theme provider is needed. Define your theme on `:root` and switch the usual root `.dark`/`.light` classes (including with `next-themes`). The Base UI portal inherits those variables from the document. If your theme exists only on a subtree, propagate it to the portal destination as you would for other portaled shadcn components.

| Part | Standard token | Optional component override |
| --- | --- | --- |
| Popup surface | `--popover`, falling back to `--background` | `--adaptive-drawer-background` |
| Popup/title text | `--popover-foreground`, falling back to `--foreground` | `--adaptive-drawer-foreground` |
| Border | `--border` | `--adaptive-drawer-border` |
| Swipe handle | `--muted` | `--adaptive-drawer-muted` |
| Description | `--muted-foreground` | `--adaptive-drawer-muted-foreground` |
| Keyboard focus outline | `--ring` | `--adaptive-drawer-ring` |
| Exposed popup corners | `calc(var(--radius) + 4px)` (shadcn radius-xl) | `--adaptive-drawer-radius` (exact radius) |

Colors are complete CSS color values: OKLCH, `hsl(...)`, RGB, or hex. This matches current shadcn themes. Older themes containing bare HSL channel triplets need a complete-color bridge in the host stylesheet. The library never overwrites your public tokens; neutral standalone fallbacks are private to the popup. Explicit `.light` wins over OS dark preference. Without an explicit root mode or theme tokens, the standalone popup follows `prefers-color-scheme`.

```css
:root {
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --border: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --radius: 0.625rem;
}
.dark {
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --border: oklch(1 0 0 / 10%);
  --ring: oklch(0.556 0 0);
}
```

Component defaults live in `@layer components` so shadcn/Tailwind utility classes and unlayered consumer CSS can override them. Trigger/close button appearance remains yours to style with your existing shadcn Button via Base UI’s `render` prop. Controls inside the popup receive a token-based `:focus-visible` outline that can also be overridden.

The demo uses standard `--background`/`--foreground`, `--card`/`--card-foreground`, `--popover`/`--popover-foreground`, `--primary`/`--primary-foreground`, `--secondary`/`--secondary-foreground`, `--muted`/`--muted-foreground`, `--accent`/`--accent-foreground`, `--border`, `--input`, `--ring`, `--destructive`, and `--radius`. Its color definitions are confined to the demo stylesheet; they are not in the library build. Buttons use primary foreground, forms use input borders, invalid fields use destructive color, and corners derive from the shadcn radius scale. Circular handles/indicators remain circular.

## Using your existing shadcn Base Drawer

The full component uses the same Base UI primitives and documented swipe/stack variables as the current shadcn Base Drawer. It is a small CSS Modules equivalent of the popup shell plus the adaptive layer; it is not a Vaul drop-in replacement.

If you keep your generated shadcn shell, ensure its ordinary popup follows the inner animation. The current generated shell defaults to `height: var(--drawer-height, auto)`. Base UI writes `--drawer-height` from the popup's own observed height: fixing the ordinary popup to that variable can lock sizing and prevent the adaptive wrapper from changing it. Override ordinary popup height to `auto`, retaining the nested-stack rule:

```css
/* In a CSS Module; className must reach the Base UI Popup. */
.followContent:not([data-nested-drawer-open]) {
  height: auto;
}
```

```tsx
<Drawer>
  <DrawerTrigger>Open</DrawerTrigger>
  <DrawerContent className={styles.followContent}>
    <AdaptiveHeight
      contentKey={step}
      header={<DrawerTitle>Setup</DrawerTitle>}
    >
      {renderStep(step)}
    </AdaptiveHeight>
  </DrawerContent>
</Drawer>
```

Use that override only for ordinary vertical drawers. For a snap-point or horizontal drawer, pass `enabled={false}` and keep the original popup sizing rules. `AdaptiveDrawer` detects those cases automatically; standalone `AdaptiveHeight` has no access to your shadcn root's private context.

## Architecture

```text
Base UI Root → Portal → Backdrop + Viewport
└── Base UI Popup                 ← Base UI owns swipe/stack transforms
    ├── decorative swipe handle
    └── Base UI Content            ← selection and swipe semantics
        └── Motion height wrapper  ← explicit measured px, overflow hidden
            └── scroll area        ← constrained by popup's maximum height
                └── intrinsic block (ResizeObserver target)
                    ├── persistent header
                    ├── positioned transition stage
                    │   └── AnimatePresence mode="popLayout" initial={false}
                    │       ├── outgoing panel (absolute, inert, aria-hidden)
                    │       └── incoming panel (normal flow)
                    └── persistent footer
```

CSS `height: auto → auto` has no two numeric endpoints to interpolate for arbitrary intrinsic DOM changes. Even `interpolate-size` does not supply those changing numeric endpoints for two `auto` values. Here the intrinsic stage can reflow freely while the outer wrapper animates, for example, `286px → 417px`.

`popLayout` removes exiting content from layout immediately while retaining it for a visual exit. The incoming panel immediately sets the target intrinsic height, so the observer never measures the sum of both panels. `mode="wait"` would serialize panel transitions and delay measurement. The stage is positioned and the immediate custom panel forwards Motion's ref to its DOM element.

The wrapper keeps a numeric height once measured; it never switches back to `auto` at animation completion. Initial mount uses intrinsic layout and a zero-duration first measurement, avoiding an animation from 0px. The inner scroll area keeps all active content reachable at the viewport cap. A stable scrollbar gutter avoids scrollbar-induced wrapping loops.

Base UI continues to own open/close state, portal mounting, modal behavior, focus trapping/restoration, swipe dismissal, snap points, and nested drawers. Its popup has no Motion transform. When a focused panel exits, focus moves to the stable stage; Tab proceeds into the incoming panel. Outgoing controls are inert and hidden from assistive technology during their visual exit.

## Snap points, nesting, and motion preferences

- **Ordinary vertical drawers:** adaptive intrinsic height is enabled for `down` and `up` directions.
- **Snap-point drawers:** any nonempty `snapPoints` disables numeric adaptive sizing. Base UI chooses the height/offset. Panel transitions remain available. The popup reserves the snap offset below the scroll region so its controls remain reachable.
- **Horizontal drawers:** adaptive height is disabled; the original full vertical sizing model remains.
- **Nested drawers:** Base UI preserves the parent height while a child is open. Parent content is hidden and the shell follows the frontmost height/stack variables; adaptive measurement resumes visibly after the child closes. Keep nested roots in persistent slots if they must remain open while changing panels.
- **Reduced motion:** Motion's `useReducedMotion` disables blur/translation/fading and gives height updates zero duration. CSS also disables the popup/backdrop lifecycle animation. Semantics and dismissal remain intact. The demo uses `MotionConfig reducedMotion="user"`.
- **Mobile keyboards:** Base UI's optional `Drawer.VirtualKeyboardProvider` and `Drawer.Provider` can wrap the component as usual. Keyboard-aware footer placement and safe-area styling remain application decisions.

Content must have intrinsic size. Avoid `height: 100%` or absolute-only layouts for the measured panel; those have no independent intrinsic height. Consumer popup padding/borders count toward the viewport cap. Use slots for interior padding. Modern ResizeObserver is required for ongoing in-place updates; without it, initial/keyed measurements still work.

## Run the demo

Use Node **22.12+** (tested with Node 24):

```sh
git clone https://github.com/kensho42/adaptive-base-drawer.git
cd adaptive-base-drawer
npm ci
npm run dev
```

Open the Vite URL printed in the terminal. The demo runs in React Strict Mode and shows:

- Three panels: a small introduction, a medium form, and larger details.
- Growth, shrinkage, and concurrent panel transitions.
- A delayed help block that resizes the current panel without changing its key.
- Accordion expansion, viewport resizing, and oversized-content scrolling.
- Optional cross-fading, shadcn light/dark tokens, and reduced motion.

`npm run build` outputs the demo to `demo-dist/` and the ESM library/declarations to `dist/`. No hosted demo is configured by this repository; `npm run dev` runs it locally.

## Repository layout

| Path | Purpose |
| --- | --- |
| [`src/adaptive-drawer.tsx`](src/adaptive-drawer.tsx) | Drawer parts and reusable `AdaptiveHeight` |
| [`src/use-element-height.ts`](src/use-element-height.ts) | ResizeObserver measurement and distance-based timing |
| [`src/adaptive-drawer.module.css`](src/adaptive-drawer.module.css) | Adaptive layout, theme tokens, and Base UI shell styling |
| [`src/index.ts`](src/index.ts) | Public exports |
| [`demo/app.tsx`](demo/app.tsx) | Interactive demo |
| [`tests/`](tests/) | Measurement, accessibility, browser behavior, and theming checks |

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run test:browser
npm run build
```

Unit tests cover initial/growing/shrinking/zero/fractional height, ResizeObserver changes, jitter, coalescing, stale callbacks, Strict Mode, cleanup, disabled sizing, reduced motion, optional cross-fading, and outgoing accessibility.

Real Chromium tests sample intermediate animation frames, check `popLayout` absolute positioning, focus transfer, rapid switching, mid-entry resize, asynchronous blocks, viewport reflow/scrolling, snap/horizontal bypass, nested stacking, reduced motion, first-open sizing, mouse/touch swipe dismissal, and live shadcn token theming/overrides across light/dark modes. The integration fixture stays outside the production build.

The browser config uses `/usr/bin/chromium` by default. For another executable:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/path/to/chromium npm run test:browser
```

For Playwright's bundled Chromium, run `npx playwright install chromium`, then set the variable to that installed executable. Browser validation here covers Chromium desktop/mobile emulation; Safari and Firefox have not been exercised.

## Upstream inspected before implementation

Inspected on 2026-10-05; installed/tested with Base UI **1.8.0**, Motion **14.0.0**, React **19.3.0**. Versions are locked in `package-lock.json`.

- [shadcn Base Drawer docs](https://ui.shadcn.com/docs/components/base/drawer) and [current drawer.tsx](https://github.com/shadcn-ui/ui/blob/0e3abd65a97707f4a9cc3ed07bf5006e1cb67b13/apps/v4/registry/bases/base/ui/drawer.tsx): popup/content separation, variables, transforms, height cap, nesting, and selection behavior.
- [Base UI Drawer API](https://base-ui.com/react/components/drawer), installed root/popup/viewport/content source, and [upstream demos](https://github.com/mui/base-ui/tree/33a72a48394096c4c91c5dc8cd5c0888701edb3b/docs/src/app/%28docs%29/react/components/drawer/demos): ResizeObserver popup reporting, swipe, snap sizing, scroll padding, nested stacks, and keyboard provider.
- [Motion AnimatePresence](https://motion.dev/docs/react-animate-presence) and [popLayout source](https://github.com/motiondivision/motion/blob/55eb6bbd5f861785592992b6b8bed2cf81fe9103/packages/framer-motion/src/components/AnimatePresence/PopChild.tsx): pre-update size snapshot, absolute exit placement, positioned parent, and forwarded ref. The implementation/API was verified against upstream and installed sources.
- [EricTsai83/ericts-ui Adaptive Drawer](https://github.com/EricTsai83/ericts-ui/blob/daeccb322408919e361f05db3184c226bba3407a/registry/base/ui/adaptive-drawer.tsx): conceptual reference for measuring changing content and distance-based timing. Its Vaul shell and implementation were not copied.

The CSS shell adapts shadcn/Base UI's MIT-licensed variable-driven styling; attribution is preserved in `LICENSE`.

## License

[MIT](LICENSE). Attribution for the adapted shadcn/Base UI drawer-shell styling is preserved in the license file.
