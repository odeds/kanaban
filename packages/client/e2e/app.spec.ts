import { test, expect } from '@playwright/test';

test('loads the kanban board', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Kanban Board' })).toBeVisible();
});

test('shows all three columns', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('To Do')).toBeVisible();
  await expect(page.getByText('In Progress')).toBeVisible();
  await expect(page.getByText('Done')).toBeVisible();
});
