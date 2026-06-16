import type { Page } from '@playwright/test'

export async function fillMantineInput(page: Page, placeholder: string, value: string) {
  await page.evaluate(
    ({ placeholder, value }) => {
      const isTextarea = !!document.querySelector(
        `textarea[placeholder="${placeholder}"]`,
      )
      const input = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        isTextarea
          ? `textarea[placeholder="${placeholder}"]`
          : `input[placeholder="${placeholder}"]`,
      )
      if (!input) throw new Error(`Input with placeholder "${placeholder}" not found`)
      const proto = isTextarea
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
      setter?.call(input, value)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    },
    { placeholder, value },
  )
}
