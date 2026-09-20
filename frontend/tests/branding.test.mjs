import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('uses the Cookie AI brand in the browser title and sidebar', async () => {
  const [index, sidebar, home] = await Promise.all([
    readFile('index.html', 'utf8'),
    readFile('src/layout/VSidebar.tsx', 'utf8'),
    readFile('src/pages/HomePage.tsx', 'utf8'),
  ])

  assert.match(index, /<title>曲奇 Cookie · AI 竞品分析 Agent 协作系统<\/title>/)
  assert.match(sidebar, /Cookie 科技/)
  assert.match(sidebar, /曲奇 Cookie/)
  assert.match(sidebar, /import\s*{[\s\S]*\bCookie\b[\s\S]*}\s*from 'lucide-react'/)
  assert.doesNotMatch(sidebar, /\bSprout\b/)
  assert.match(home, /\bCookie\b/)
  assert.doesNotMatch(home, /\bSprout\b/)
})
