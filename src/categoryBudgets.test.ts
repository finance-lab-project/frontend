import { afterEach, expect, test, vi } from 'vitest'
import customFixture from '../fixtures/budget-backup/v3/valid/custom.json?raw'
import { createCategory, createCategoryCatalog, removeCategory, renameCategory, reorderCategories } from './categoryCatalog'
import { budgetTotals, emptyBudget } from './budgetModel'
import { parseBudgetBackup, validateMonthlyBudget } from './budgetBackup'
import { serializeBudget } from './budgetExport'
import { CATALOG_KEY, loadBudget, loadCategoryCatalog, persistBudget, saveBudget } from './budgetStorage'

const monthA = 'finance-lab:v3:budget:2027-02'
const monthB = 'finance-lab:v3:budget:2027-03'
afterEach(() => { vi.restoreAllMocks(); localStorage.clear() })

test('uses one custom catalog across months and preserves IDs, history, labels, order, strings and totals', () => {
  const document = parseBudgetBackup(customFixture)
  const { catalog, income, spending, investments } = document
  const data = { income, spending, investments }
  persistBudget(data, monthA, catalog)
  expect(loadCategoryCatalog()).toEqual(catalog)
  expect(loadBudget(monthB)).toEqual(emptyBudget(catalog))
  const next = { ...emptyBudget(catalog), income: '75' }
  persistBudget(next, monthB, catalog)
  expect(loadBudget(monthA)).toEqual(data)
  expect(loadBudget(monthB)).toEqual(next)
  expect(budgetTotals(loadBudget(monthA), catalog)).toEqual({ income: 100, spending: 19.5, investments: 5, remaining: 75.5 })
  expect(parseBudgetBackup(serializeBudget(document.month, loadBudget(monthA), 'json', loadCategoryCatalog()).content))
    .toEqual(document)
  expect(() => createCategory(loadCategoryCatalog(), 'retired-01', 'New label')).toThrow(/already been used/)
  const renamed = renameCategory(catalog, 'custom-bike', 'Bicycle maintenance')
  const reordered = reorderCategories(renamed, ['income', 'custom-bike'])
  expect(budgetTotals(data, reordered)).toEqual(budgetTotals(data, catalog))
  expect(parseBudgetBackup(serializeBudget(document.month, data, 'json', reordered).content).spending).toEqual(spending)
})

test('rejects missing and orphaned amounts instead of changing totals or writing a reset', () => {
  const { catalog, income, spending, investments } = parseBudgetBackup(customFixture)
  const data = { income, spending, investments }
  persistBudget(data, monthA, catalog)
  const before = { ...localStorage }
  const removed = removeCategory(catalog, 'custom-bike')
  expect(() => validateMonthlyBudget(data, removed)).toThrow(/missing or unknown amounts/)
  expect(() => budgetTotals(data, removed)).toThrow(/no amounts were discarded/)
  expect(() => persistBudget(data, monthA, removed)).toThrow()
  const missing = { ...data, spending: { income: '7' } }
  expect(() => validateMonthlyBudget(missing, catalog)).toThrow(/missing or unknown amounts/)
  expect(() => budgetTotals(missing, catalog)).toThrow()
  expect(() => persistBudget(missing, monthA, catalog)).toThrow()
  expect({ ...localStorage }).toEqual(before)
})

test('blocks catalog replacement even for a new destination month without changing saved months', () => {
  persistBudget({ ...emptyBudget(), income: '150' }, monthA, createCategoryCatalog())
  const before = { ...localStorage }
  const { catalog, income, spending, investments } = parseBudgetBackup(customFixture)
  expect(() => persistBudget({ income, spending, investments }, monthB, catalog)).toThrow(/different app-wide/)
  expect({ ...localStorage }).toEqual(before)
})

test('missing or corrupt app-wide catalogs block loading and saving without guessing starter IDs', () => {
  for (const raw of [null, '{bad', '{"categories":[],"usedIds":[]}']) {
    localStorage.clear()
    localStorage.setItem(monthA, JSON.stringify({ ...emptyBudget(), income: '200' }))
    if (raw !== null) localStorage.setItem(CATALOG_KEY, raw)
    const before = { ...localStorage }
    expect(() => loadBudget(monthA)).toThrow()
    expect(saveBudget(emptyBudget(), monthA)).toMatch(/Could not save/)
    expect({ ...localStorage }).toEqual(before)
  }
})

test('does not initialize a catalog or a month on load and refuses writes to v2 keys', () => {
  const oldKey = 'finance-lab:budget:2027-02'
  localStorage.setItem(oldKey, '{"synthetic":"keep"}')
  expect(loadBudget(monthA)).toEqual(emptyBudget())
  expect(Object.keys(localStorage)).toEqual([oldKey])
  expect(() => persistBudget(emptyBudget(), oldKey, createCategoryCatalog())).toThrow(/Only v3/)
  expect(localStorage.getItem(oldKey)).toBe('{"synthetic":"keep"}')
})

test('a failed first month write rolls back catalog initialization and retains v2 data', () => {
  localStorage.setItem('finance-lab:budget:2027-02', 'synthetic legacy data')
  const before = { ...localStorage }
  const nativeSet = Storage.prototype.setItem
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
    if (key === monthA) throw new DOMException('Synthetic quota failure', 'QuotaExceededError')
    nativeSet.call(this, key, value)
  })
  expect(() => persistBudget(emptyBudget(), monthA, createCategoryCatalog())).toThrow(/quota/)
  expect({ ...localStorage }).toEqual(before)
})

test('CSV quotes custom text and neutralizes spreadsheet formulas, while JSON stays lossless', () => {
  const { catalog, income, spending, investments, month } = parseBudgetBackup(customFixture)
  const data = { income, spending, investments }
  const csv = serializeBudget(month, data, 'csv', catalog).content
  expect(csv).toContain('"Spending","custom-bike","Bicycle, ""repairs""","12.50"')
  const formulas = createCategory({ categories: [], usedIds: [] }, '=1+1', '@SUM(1,2)')
  const formulaBudget = { ...emptyBudget(formulas), spending: { '=1+1': '3' } }
  expect(serializeBudget(month, formulaBudget, 'csv', formulas).content).toContain('"\'=1+1","\'@SUM(1,2)","3"')
  const parsed = parseBudgetBackup(serializeBudget(month, formulaBudget, 'json', formulas).content)
  expect(parsed.catalog).toEqual(formulas)
  expect(parsed.spending).toEqual(formulaBudget.spending)
})
