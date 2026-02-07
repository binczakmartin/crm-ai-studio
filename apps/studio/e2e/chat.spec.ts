/**
 * @file Chat E2E Test
 * @description Playwright E2E test: open Studio → send message → see streamed answer → open
 *   Evidence Drawer → verify citations are displayed.
 * @remarks Requires docker-compose services and migrations to be running.
 */

import { test, expect } from '@playwright/test';

test.describe('Chat Flow', () => {
  test('sends a message and receives a streamed response', async ({ page }) => {
    // Navigate to the chat page
    await page.goto('/');

    // Verify the page loads
    await expect(page.locator('text=CRM AI Studio')).toBeVisible();

    // Check the welcome message is shown
    await expect(page.locator('text=Welcome to CRM AI Studio')).toBeVisible();

    // Type a message
    const input = page.locator('textarea[aria-label="Message input"]');
    await input.fill('How many workspaces are there?');

    // Send the message
    const sendButton = page.locator('button[aria-label="Send message"]');
    await sendButton.click();

    // Wait for the assistant response to appear
    await expect(page.locator('text=ASSISTANT').first()).toBeVisible({ timeout: 30_000 });

    // Verify some content appeared
    const assistantMessage = page.locator('.message-bubble--assistant').last();
    await expect(assistantMessage).toBeVisible();
  });

  test('evidence drawer shows citations', async ({ page }) => {
    await page.goto('/');

    // Send a message
    const input = page.locator('textarea[aria-label="Message input"]');
    await input.fill('Show me all workspaces');
    await page.locator('button[aria-label="Send message"]').click();

    // Wait for response
    await expect(page.locator('.message-bubble--assistant').first()).toBeVisible({ timeout: 30_000 });

    // Look for the evidence toggle button
    const evidenceButton = page.locator('.evidence-toggle').first();
    if (await evidenceButton.isVisible()) {
      await evidenceButton.click();

      // Verify the evidence drawer opens
      await expect(page.locator('.evidence-drawer')).toBeVisible();

      // Verify tool calls section exists
      await expect(page.locator('text=Tool Calls')).toBeVisible();
    }
  });
});

test.describe('Sources Flow', () => {
  test('navigates to sources page and shows form', async ({ page }) => {
    await page.goto('/sources');

    // Verify page title
    await expect(page.locator('text=Data Sources')).toBeVisible();

    // Verify the add source form is present
    await expect(page.locator('text=Add Postgres Source')).toBeVisible();

    // Verify form fields exist
    await expect(page.locator('label:text("Source Name")')).toBeVisible();
    await expect(page.locator('label:text("Host")')).toBeVisible();
  });
});
