import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const source = new URL('../public/og-image.svg', import.meta.url)
const destination = new URL('../public/og-image.png', import.meta.url)
const svg = await readFile(source, 'utf8')
const browser = await chromium.launch({ headless: true })

try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
  await page.setContent(`<style>html,body{margin:0;width:1200px;height:630px}</style>${svg}`)
  await page.screenshot({ path: destination.pathname, type: 'png' })
  console.log('Imagine socială generată: public/og-image.png (1200×630)')
} finally {
  await browser.close()
}
