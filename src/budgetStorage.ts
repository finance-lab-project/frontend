import { emptyBudget, type MonthlyBudget } from './budgetModel'
import { validateMonthlyBudget } from './budgetBackup'
import { createCategoryCatalog, validateCategoryCatalog, type CategoryCatalog } from './categoryCatalog'

export class BudgetStorageError extends Error {}

export const CATALOG_KEY = 'finance-lab:v3:catalog'
const MONTH_PREFIX = 'finance-lab:v3:budget:'

export const currentMonthKey = (date = new Date()) => {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${MONTH_PREFIX}${date.getFullYear()}-${month}`
}

// The caller supplies a validated YYYY-MM backup month.
export const backupMonthKey = (month: string) =>
  `${MONTH_PREFIX}${Number(month.slice(0, 4))}-${month.slice(5)}`

const hasSavedMonths = () => Object.keys(localStorage).some(key => key.startsWith(MONTH_PREFIX))

export function loadCategoryCatalog(): CategoryCatalog {
  const raw = localStorage.getItem(CATALOG_KEY)
  if (raw !== null) return validateCategoryCatalog(JSON.parse(raw))
  if (hasSavedMonths()) throw new BudgetStorageError('The catalog for saved v3 budgets is missing.')
  return createCategoryCatalog()
}

/** A monthly restore must not replace the catalog used by other months. */
export function checkStoredCatalog(catalog: CategoryCatalog): string | null {
  const validated = validateCategoryCatalog(catalog)
  const raw = localStorage.getItem(CATALOG_KEY)
  if (raw !== null) {
    const stored = validateCategoryCatalog(JSON.parse(raw))
    if (JSON.stringify(stored) !== JSON.stringify(validated)) {
      throw new BudgetStorageError('This backup uses a different app-wide category catalog. Restore it in a separate browser profile with no v3 budgets. Existing categories and amounts were not changed.')
    }
  } else if (hasSavedMonths()) {
    throw new BudgetStorageError('The catalog for saved v3 budgets is missing. Recover that catalog before restoring; no amounts were changed.')
  }
  return raw
}

export const getBudgetPresence = (month: string): 'existing' | 'absent' | 'unknown' => {
  try {
    return localStorage.getItem(backupMonthKey(month)) === null ? 'absent' : 'existing'
  } catch {
    return 'unknown'
  }
}

export const loadBudget = (key = currentMonthKey(), catalog = loadCategoryCatalog()): MonthlyBudget => {
  const saved = localStorage.getItem(key)
  // Corruption or mismatched IDs must never turn into an automatically saved reset.
  return saved === null ? emptyBudget(catalog) : validateMonthlyBudget(JSON.parse(saved), catalog)
}

export function persistBudget(budget: MonthlyBudget, key: string, catalog: CategoryCatalog) {
  if (!key.startsWith(MONTH_PREFIX)) throw new Error('Only v3 budget keys may be written.')
  validateMonthlyBudget(budget, catalog)
  const serialized = JSON.stringify(budget)
  const rawCatalog = checkStoredCatalog(catalog)
  if (rawCatalog === null) localStorage.setItem(CATALOG_KEY, JSON.stringify(catalog))
  try {
    localStorage.setItem(key, serialized)
  } catch (error) {
    // Only a fresh profile can initialize the catalog. No saved month depends on it.
    if (rawCatalog === null) localStorage.removeItem(CATALOG_KEY)
    throw error
  }
}

export const saveBudget = (budget: MonthlyBudget, key = currentMonthKey(), catalog = createCategoryCatalog()): string | null => {
  try {
    // Incomplete amount edits stay in the UI; only valid source data is saved.
    validateMonthlyBudget(budget, catalog)
  } catch {
    return null
  }
  try {
    persistBudget(budget, key, catalog)
    return null
  } catch {
    return 'Could not save this budget. Keep a JSON backup and resolve browser storage or catalog errors before reloading.'
  }
}
