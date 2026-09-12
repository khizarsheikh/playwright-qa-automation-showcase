import { expect, type Page } from '@playwright/test';

export class TaskBoard {
  constructor(readonly page: Page) {}

  row(title: string) {
    return this.page.getByTestId('task-row').filter({ has: this.page.getByText(title, { exact: true }) });
  }

  async open() {
    await this.page.goto('/');
    await expect(this.page.getByRole('heading', { name: 'Make room for progress.' })).toBeVisible();
  }

  async add(title: string) {
    await this.page.getByRole('textbox', { name: 'New task' }).fill(title);
    await this.page.getByRole('button', { name: 'Add task', exact: true }).click();
    await expect(this.row(title.trim())).toBeVisible();
  }

  async filter(value: 'All' | 'Active' | 'Completed') {
    await this.page.getByLabel('Show', { exact: true }).selectOption(value);
  }

  async rename(title: string, replacement: string) {
    await this.row(title).getByRole('button', { name: 'Edit', exact: true }).click();
    await this.page.getByRole('dialog').getByLabel('Task title').fill(replacement);
    await this.page.getByRole('button', { name: 'Save changes' }).click();
    await expect(this.row(replacement)).toBeVisible();
  }
}
