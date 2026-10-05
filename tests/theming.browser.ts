import { expect, test, type Page } from '@playwright/test';

async function tokenColor(page: Page, token: string) {
  return page.evaluate((name) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${name})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, token);
}

async function openFixture(page: Page) {
  await page.goto('/tests/fixtures/index.html');
  await page.getByRole('button', { name: 'Open fixture' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

test('standard shadcn tokens theme the portal and update with the root dark class', async ({ page }) => {
  await openFixture(page);
  await page.addStyleTag({ content: `
    :root {
      --background: #fafafa; --foreground: #141414;
      --popover: oklch(0.98 0.01 250); --popover-foreground: #223344;
      --muted: #e6e9f0; --muted-foreground: #556677;
      --border: #8899aa; --ring: #663399; --radius: 1rem;
    }
    :root.dark {
      --popover: #182838; --popover-foreground: #ddeeff;
      --muted: #344454; --muted-foreground: #aabbcc;
      --border: #667788; --ring: #cc99ff; --radius: 1.25rem;
    }
  ` });
  const popup = page.getByRole('dialog');
  const description = page.locator('[data-slot="drawer-description"]');
  const handle = page.locator('[data-swipe-handle]');
  const control = page.getByRole('button', { name: 'Stable next' });
  for (const dark of [false, true]) {
    await page.evaluate(isDark => document.documentElement.classList.toggle('dark', isDark), dark);
    await expect(popup).toHaveCSS('background-color', await tokenColor(page, '--popover'));
    await expect(popup).toHaveCSS('color', await tokenColor(page, '--popover-foreground'));
    await expect(popup).toHaveCSS('border-top-color', await tokenColor(page, '--border'));
    await expect(description).toHaveCSS('color', await tokenColor(page, '--muted-foreground'));
    await expect(handle).toHaveCSS('background-color', await tokenColor(page, '--muted'));
    await expect(popup).toHaveCSS('border-top-left-radius', dark ? '24px' : '20px');
    await page.keyboard.press('Tab');
    await control.focus();
    await expect(control).toHaveCSS('outline-color', await tokenColor(page, '--ring'));
    await expect(control).toHaveCSS('outline-style', 'solid');
  }
  // Standard colors still work when only background/foreground are provided.
  await page.evaluate(() => {
    const root = document.documentElement;
    root.style.setProperty('--popover', 'var(--background)');
    root.style.setProperty('--popover-foreground', 'var(--foreground)');
  });
  await expect(popup).toHaveCSS('background-color', await tokenColor(page, '--background'));
  await expect(popup).toHaveCSS('color', await tokenColor(page, '--foreground'));
});

test('drawer-specific overrides win without changing the host token values', async ({ page }) => {
  await openFixture(page);
  await page.addStyleTag({ content: `:root {
    --popover: #ffffff; --popover-foreground: #111111; --border: #eeeeee;
    --muted: #dddddd; --muted-foreground: #666666; --ring: #aaaaaa; --radius: 1rem;
    --adaptive-drawer-background: #102030; --adaptive-drawer-foreground: #f1f2f3;
    --adaptive-drawer-border: #405060; --adaptive-drawer-muted: #708090;
    --adaptive-drawer-muted-foreground: #abcdef; --adaptive-drawer-ring: #ffbb00;
    --adaptive-drawer-radius: 12px;
  }` });
  const popup = page.getByRole('dialog');
  await expect(popup).toHaveCSS('background-color', 'rgb(16, 32, 48)');
  await expect(popup).toHaveCSS('color', 'rgb(241, 242, 243)');
  await expect(popup).toHaveCSS('border-top-color', 'rgb(64, 80, 96)');
  await expect(popup).toHaveCSS('border-top-left-radius', '12px');
  await expect(page.locator('[data-swipe-handle]')).toHaveCSS('background-color', 'rgb(112, 128, 144)');
  await expect(page.locator('[data-slot="drawer-description"]')).toHaveCSS('color', 'rgb(171, 205, 239)');
  const control = page.getByRole('button', { name: 'Stable next' });
  await page.keyboard.press('Tab');
  await control.focus();
  await expect(control).toHaveCSS('outline-color', 'rgb(255, 187, 0)');
  expect(await tokenColor(page, '--popover')).toBe('rgb(255, 255, 255)');
});

test('standalone fallback honors explicit light mode on a dark system', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await openFixture(page);
  const popup = page.getByRole('dialog');
  await expect(popup).toHaveCSS('background-color', 'rgb(24, 24, 27)');
  await page.evaluate(() => document.documentElement.classList.add('light'));
  await expect(popup).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(popup).toHaveCSS('color', 'rgb(24, 24, 27)');
  await page.evaluate(() => { document.documentElement.classList.remove('light'); document.documentElement.classList.add('dark'); });
  await expect(popup).toHaveCSS('background-color', 'rgb(24, 24, 27)');
  await page.addStyleTag({ content: ':root { --background: #334455; --foreground: #aabbcc; }' });
  await expect(popup).toHaveCSS('background-color', 'rgb(51, 68, 85)');
  await expect(popup).toHaveCSS('color', 'rgb(170, 187, 204)');
});

test('demo uses semantic colors, input borders, focus rings, radius, and .dark', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Try the drawer' });
  await expect(trigger).toHaveCSS('background-color', await tokenColor(page, '--primary'));
  await expect(trigger).toHaveCSS('color', await tokenColor(page, '--primary-foreground'));
  await page.evaluate(() => document.documentElement.style.setProperty('--card-foreground', '#884422'));
  const preview = page.getByRole('button', { name: /^Small / });
  await expect(preview).toHaveCSS('color', await tokenColor(page, '--card-foreground'));
  await expect(preview).toHaveCSS('background-color', await tokenColor(page, '--card'));
  await preview.hover();
  await expect(preview).toHaveCSS('color', await tokenColor(page, '--accent-foreground'));
  await expect(preview).toHaveCSS('background-color', await tokenColor(page, '--accent'));
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveClass('dark');
  await expect(trigger).toHaveCSS('background-color', await tokenColor(page, '--primary'));
  await expect(trigger).toHaveCSS('color', await tokenColor(page, '--primary-foreground'));
  await trigger.click();
  await page.getByRole('button', { name: 'Go to step 2' }).click();
  const input = page.getByRole('textbox', { name: 'Your name' });
  await expect(input).toHaveCSS('border-top-color', await tokenColor(page, '--input'));
  await input.focus();
  await expect(input).toHaveCSS('outline-color', await tokenColor(page, '--ring'));
  await page.evaluate(() => {
    document.documentElement.style.setProperty('--radius', '1rem');
    document.documentElement.style.setProperty('--primary', 'oklch(0.8 0.12 300)');
    document.documentElement.style.setProperty('--primary-foreground', '#111111');
  });
  await expect(input).toHaveCSS('border-top-left-radius', '12px');
  await expect(page.getByRole('dialog')).toHaveCSS('border-top-left-radius', '20px');
  await expect(page.getByRole('button', { name: 'Next step' })).toHaveCSS('background-color', await tokenColor(page, '--primary'));
  await expect(page.getByRole('button', { name: 'Next step' })).toHaveCSS('color', 'rgb(17, 17, 17)');
  await input.evaluate(el => el.setAttribute('aria-invalid', 'true'));
  await expect(input).toHaveCSS('border-top-color', await tokenColor(page, '--destructive'));
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(page.locator('html')).toHaveClass('light');
});
