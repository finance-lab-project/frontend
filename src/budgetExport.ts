import { createCategoryCatalog, type CategoryCatalog } from './categoryCatalog'
import { BudgetBackupError, validateBudgetData } from './budgetBackup'

export type BudgetExportFormat = 'csv' | 'json'

export class BudgetExportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BudgetExportError'
  }
}

export function validateBudgetSource(month: unknown, budget: unknown, catalog: CategoryCatalog = createCategoryCatalog()) {
  try {
    return validateBudgetData(month, budget, catalog)
  } catch (error) {
    if (error instanceof BudgetBackupError) throw new BudgetExportError(error.message)
    throw error
  }
}

const quoteCsvField = (value: string) => `"${value.replaceAll('"', '""')}"`

export function serializeBudget(month: string, data: unknown, format: BudgetExportFormat, catalog: CategoryCatalog = createCategoryCatalog()) {
  const { month: selectedMonth, budget } = validateBudgetSource(month, data, catalog)
  const filename = `finance-lab-budget-${selectedMonth}.${format}`
  const spending = Object.fromEntries(catalog.categories.map(({ id }) => [id, budget.spending[id]]))

  if (format === 'json') {
    const document = {
      formatVersion: 3, month: selectedMonth, catalog,
      income: budget.income, spending, investments: budget.investments,
    }
    return { content: `${JSON.stringify(document, null, 2)}\n`, mimeType: 'application/json', filename }
  }

  // Custom IDs/labels are untrusted spreadsheet text. CSV is inspection-only;
  // prefix formula-like text, while JSON preserves the exact original strings.
  const safeText = (value: string) => /^[\s]*[=+\-@]/.test(value) || /^[\t\r\n]/.test(value) ? `'${value}` : value
  const records = [
    ['Type', 'Category ID', 'Category', 'Amount'],
    ['Income', '', 'Income', budget.income],
    ...catalog.categories.map(({ id, label }) => ['Spending', safeText(id), safeText(label), budget.spending[id]]),
    ['Investment', '', 'Investments', budget.investments],
  ].map((record) => record.map(quoteCsvField).join(','))
  return {
    content: `\uFEFF${records.join('\r\n')}\r\n`,
    mimeType: 'text/csv;charset=utf-8', filename,
  }
}
