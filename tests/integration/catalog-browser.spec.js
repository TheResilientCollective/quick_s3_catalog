import { test, expect } from '@playwright/test';

test.describe('S3 Catalog Browser UI', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the index.html page before each test
    await page.goto('/index.html');
  });

  test('should load and display mock datasets correctly', async ({ page }) => {
    // Check for the main title
    await expect(page.getByRole('heading', { name: 'S3 Dataset Catalog Browser' })).toBeVisible();

    // Check that the 'data' section is rendered
    await expect(page.getByText('data (2)')).toBeVisible();
    // Check for a dataset title in the 'data' section
    await expect(page.getByRole('heading', { name: 'Awesome Dataset' })).toBeVisible();

    // Check that the 'health' section is rendered
    await expect(page.getByText('health (1)')).toBeVisible();
    // Check for the invalid dataset
    await expect(page.getByRole('heading', { name: 'Invalid Metadata File' })).toBeVisible();
    await expect(page.locator('.dataset-container.invalid')).toHaveCount(1);
  });

  test('should filter datasets when using the search box', async ({ page }) => {
    // Wait for the initial render
    await expect(page.getByRole('heading', { name: 'Awesome Dataset' })).toBeVisible();

    // Type into the search box
    const searchInput = page.getByPlaceholder('Search datasets...');
    await searchInput.fill('Climate');

    // Assert that the non-matching dataset is gone
    await expect(page.getByRole('heading', { name: 'Awesome Dataset' })).not.toBeVisible();
    // Assert that the matching dataset is still visible
    await expect(page.getByRole('heading', { name: 'Climate Change Data' })).toBeVisible();
    // Assert that the section count has updated
    await expect(page.getByText('data (1)')).toBeVisible();

    // Clear the search
    await searchInput.fill('');
    // Assert that the original dataset is back
    await expect(page.getByRole('heading', { name: 'Awesome Dataset' })).toBeVisible();
    await expect(page.getByText('data (2)')).toBeVisible();
  });

  test('should show no results message for a query with no matches', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search datasets...');
    await searchInput.fill('nonexistent-query');

    await expect(page.getByText('No datasets found.')).toBeVisible();
  });
});