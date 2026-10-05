import { test, expect, type Page } from '@playwright/test';

async function openDemo(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try the drawer' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.waitForTimeout(500);
}
async function sampleTransition(page: Page, action: string) {
  return page.evaluate(async (name) => {
    const wrapper = document.querySelector('[data-adaptive-height]') as HTMLElement;
    const heights: number[] = [];
    const intrinsic: number[] = [];
    const start = performance.now();
    const buttons = [...document.querySelectorAll('button')];
    buttons.find(button => button.textContent === name)!.click();
    await new Promise<void>(resolve => {
      const sample = () => {
        heights.push(wrapper.getBoundingClientRect().height);
        intrinsic.push((document.querySelector('[data-adaptive-intrinsic]') as HTMLElement).offsetHeight);
        if (performance.now() - start < 400) requestAnimationFrame(sample); else resolve();
      };
      requestAnimationFrame(sample);
    });
    return { heights, intrinsic };
  }, action);
}

test('growing and shrinking interpolate concurrently with popped panels', async ({ page }) => {
  await page.goto('/tests/fixtures/index.html');
  await page.getByRole('button', { name: 'Open fixture' }).click();
  await page.waitForTimeout(500);
  const start = await page.locator('[data-adaptive-height]').evaluate(el => el.getBoundingClientRect().height);
  const grow = await sampleTransition(page, 'Stable next');
  const end = grow.heights.at(-1)!;
  expect(end - start).toBeCloseTo(200.25, 0);
  expect(grow.heights.some(h => h > start + 10 && h < end - 10)).toBe(true);
  expect(Math.max(...grow.intrinsic) - Math.min(...grow.intrinsic)).toBeLessThan(1);
  await page.getByRole('button', { name: 'Stable next' }).click();
  await page.waitForTimeout(350);
  const shrink = await sampleTransition(page, 'Stable next');
  expect(shrink.heights.some(h => h > start + 20 && h < 540)).toBe(true);
  expect(shrink.heights.at(-1)).toBeCloseTo(start, 0);
});

test('outgoing is absolute, inert, aria-hidden, non-interactive; focus moves to stable stage', async ({ page }) => {
  await page.goto('/tests/fixtures/index.html');
  await page.getByRole('button', { name: 'Open fixture' }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Panel next' }).focus();
  // Snapshot the short-lived exit in one frame: serial browser round trips can
  // otherwise inspect an already detached node on a busy CI worker.
  const outgoing = await page.evaluate(async () => {
    (document.activeElement as HTMLButtonElement).click();
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    const element = document.querySelector('[data-panel-present="false"]')!;
    return {
      hidden: element.getAttribute('aria-hidden'), inert: element.hasAttribute('inert'),
      position: getComputedStyle(element).position, pointerEvents: getComputedStyle(element).pointerEvents,
    };
  });
  expect(outgoing).toEqual({ hidden: 'true', inert: true, position: 'absolute', pointerEvents: 'none' });
  await expect(page.locator('[data-adaptive-stage]')).toBeFocused();
  await expect(page.getByRole('button', { name: 'Panel next' })).toHaveCount(1);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Panel next' })).toBeFocused();
});

test('async and in-place content changes animate without changing the key', async ({ page }) => {
  await openDemo(page);
  const before = await page.locator('[data-adaptive-height]').evaluate(el => el.getBoundingClientRect().height);
  await page.getByRole('button', { name: /Load a help block/ }).click();
  await expect(page.getByRole('status')).toBeVisible();
  await page.waitForTimeout(350);
  const after = await page.locator('[data-adaptive-height]').evaluate(el => el.getBoundingClientRect().height);
  expect(after).toBeGreaterThan(before + 60);
  await page.getByRole('button', { name: /Remove help block/ }).click();
  await page.waitForTimeout(350);
  expect(await page.locator('[data-adaptive-height]').evaluate(el => el.getBoundingClientRect().height)).toBeCloseTo(before, 0);
  await expect(page.locator('[data-panel-present="false"]')).toHaveCount(0);
});

test('rapid key switching settles correctly and retains close/focus lifecycle', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await openDemo(page);
  await page.evaluate(async () => {
    for (let i=0; i<12; i++) {
      (document.querySelector('button[aria-label="Go to step '+((i % 3)+1)+'"]') as HTMLButtonElement).click();
      await new Promise(resolve => setTimeout(resolve, 25));
    }
  });
  await page.waitForTimeout(400);
  await expect(page.locator('[data-panel-present="true"]')).toHaveCount(1);
  await expect(page.locator('[data-panel-present="false"]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Room for the details' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Try the drawer' })).toBeFocused();
  expect(errors).toEqual([]);
});

test('viewport cap scrolls to the bottom and responds to width/text wrapping', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await openDemo(page);
  await page.getByRole('button', { name: 'Go to step 3' }).click();
  await page.waitForTimeout(350);
  await page.getByRole('checkbox', { name: 'Add extra content to test scrolling' }).check();
  await page.waitForTimeout(350);
  const sizes = await page.locator('[data-adaptive-scroll]').evaluate(el => ({ client: el.clientHeight, scroll: el.scrollHeight }));
  expect(sizes.scroll).toBeGreaterThan(sizes.client + 200);
  expect((await page.getByRole('dialog').boundingBox())!.height).toBeLessThanOrEqual(604);
  await page.getByRole('button', { name: 'Back to the start' }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: 'Back to the start' })).toBeInViewport();
  const before = await page.locator('[data-adaptive-height]').getAttribute('data-height');
  await page.setViewportSize({ width: 600, height: 760 });
  await expect.poll(() => page.locator('[data-adaptive-height]').getAttribute('data-height')).not.toBe(before);
  await page.getByRole('button', { name: 'Back to the start' }).click();
  await page.waitForTimeout(350);
  await expect(page.getByRole('heading', { name: 'A little introduction' })).toBeInViewport();
});

test('crossFade=false leaves panels opaque during transition', async ({ page }) => {
  await page.goto('/tests/fixtures/index.html?fade=off');
  await page.getByRole('button', { name: 'Open fixture' }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Stable next' }).click();
  const opacity = await page.locator('[data-panel-present="true"]').evaluate(el => Number(getComputedStyle(el).opacity));
  expect(opacity).toBe(1);
  expect(await page.locator('[data-panel-present="false"]').evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
});

test('reduced motion updates immediately without blur or translation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openDemo(page);
  await page.getByRole('button', { name: 'Go to step 2' }).click();
  await expect(page.locator('[data-adaptive-height]')).toHaveAttribute('data-height-duration', '0');
  await expect(page.locator('[data-panel-present="false"]')).toHaveCount(0);
  expect(await page.locator('[data-panel-present="true"]').evaluate(el => getComputedStyle(el).filter)).toBe('blur(0px)');
  expect(await page.locator('[data-panel-present="true"]').evaluate(el => getComputedStyle(el).transform)).toBe('none');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Try the drawer' })).toBeFocused();
});

test('snap-point and horizontal drawers bypass adaptive size', async ({ page }) => {
  for (const mode of ['snap','horizontal']) {
    await page.goto('/tests/fixtures/index.html?mode='+mode);
    await page.getByRole('button', { name: 'Open fixture' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('[data-adaptive-height]')).toHaveCount(0);
    const initial = await page.getByRole('dialog').evaluate(el => el.getBoundingClientRect().height);
    await page.getByRole('button', { name: 'Stable next' }).evaluate((el: HTMLButtonElement) => el.click());
    await page.waitForTimeout(350);
    expect(await page.getByRole('dialog').evaluate(el => el.getBoundingClientRect().height)).toBeCloseTo(initial, 0);
  }
});

test('swipe-to-dismiss uses Base UI transforms and restores trigger focus', async ({ page }) => {
  await openDemo(page);
  const handle = await page.locator('[data-swipe-handle]').boundingBox();
  const x = handle!.x + handle!.width/2;
  const y = handle!.y + handle!.height/2;
  await page.mouse.move(x,y);
  await page.mouse.down();
  await page.mouse.move(x,y+200, { steps: 12 });
  await page.mouse.up();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Try the drawer' })).toBeFocused();
});

test('initial open has a measured nonzero height and no faded first panel', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try the drawer' }).click();
  const initial = await page.locator('[data-adaptive-height]').evaluate(el => ({ height: el.clientHeight, target: el.getAttribute('data-height'), duration: el.getAttribute('data-height-duration') }));
  expect(initial.height).toBeGreaterThan(200);
  expect(Number(initial.target)).toBeGreaterThan(200);
  expect(initial.duration).toBe('0');
  expect(await page.locator('[data-panel-present="true"]').evaluate(el => getComputedStyle(el).opacity)).toBe('1');
});

test('height changes during panel entry retarget without a layout jump', async ({ page }) => {
  await page.goto('/tests/fixtures/index.html');
  await page.getByRole('button', { name: 'Open fixture' }).click();
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const button = (name: string) => [...document.querySelectorAll('button')].find(el => el.textContent === name)!;
    button('Stable next').click();
    setTimeout(() => button('Toggle extra').click(), 50);
  });
  await page.waitForTimeout(450);
  const target = Number(await page.locator('[data-adaptive-height]').getAttribute('data-height'));
  const actual = await page.locator('[data-adaptive-height]').evaluate(el => el.getBoundingClientRect().height);
  expect(actual).toBeCloseTo(target, 0);
  await expect(page.locator('[data-panel-present="true"]')).toHaveCount(1);
  await expect(page.locator('[data-panel-present="false"]')).toHaveCount(0);
  expect(target).toBeGreaterThan(477);
});

test('nested drawer keeps Base UI stack behavior and restores parent focus', async ({ page }) => {
  await page.goto('/tests/fixtures/index.html?mode=nested');
  await page.getByRole('button', { name: 'Open fixture' }).click();
  await page.waitForTimeout(500);
  const parent = page.locator('[data-slot="drawer-popup"]').first();
  await page.getByRole('button', { name: 'Open nested' }).click();
  await expect(parent).toHaveAttribute('data-nested-drawer-open');
  await page.waitForTimeout(500);
  expect(await parent.evaluate(el => getComputedStyle(el).transform)).not.toBe('none');
  await page.getByRole('button', { name: 'Close nested' }).click();
  await expect(parent).not.toHaveAttribute('data-nested-drawer-open');
  await expect(page.getByRole('button', { name: 'Open nested' })).toBeFocused();
  await page.getByRole('button', { name: 'Stable next' }).click();
  await page.waitForTimeout(350);
  await expect(page.getByText('Panel 2', { exact: true })).toBeVisible();
});

test('touch swipe dismissal works on mobile', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:5173');
  await page.getByRole('button', { name: 'Try the drawer' }).tap();
  await page.waitForTimeout(500);
  const handle = (await page.locator('[data-swipe-handle]').boundingBox())!;
  const client = await context.newCDPSession(page);
  const x = handle.x + handle.width / 2;
  const y = handle.y + handle.height / 2;
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i=1; i<=10; i++) {
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + i * 20 }] });
    await page.waitForTimeout(10);
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await context.close();
});

test('turning snap points on clears an existing numeric adaptive height', async ({ page }) => {
  await page.goto('/tests/fixtures/index.html');
  await page.getByRole('button', { name: 'Open fixture' }).click();
  await page.waitForTimeout(500);
  const wrapper = page.locator('[data-adaptive-scroll]').locator('..');
  await expect(page.locator('[data-adaptive-height]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Toggle snapping' }).click();
  await expect(page.locator('[data-adaptive-height]')).toHaveCount(0);
  await expect.poll(() => wrapper.evaluate((el: HTMLElement) => el.style.height)).toBe('auto');
  await page.getByRole('button', { name: 'Toggle snapping' }).evaluate((el: HTMLButtonElement) => el.click());
  await expect(page.locator('[data-adaptive-height]')).toHaveCount(1);
});
