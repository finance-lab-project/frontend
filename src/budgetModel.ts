import { createCategoryCatalog, type CategoryCatalog } from './categoryCatalog'

// The reviewed starter catalog; custom budgets use their app-wide catalog.
export const spendingCategories = createCategoryCatalog().categories

export type MonthlyBudget = {
  income: string
  spending: Record<string, string>
  investments: string
}

export const emptyBudget = (catalog: CategoryCatalog = createCategoryCatalog()): MonthlyBudget => ({
  income: '',
  spending: Object.fromEntries(catalog.categories.map(({ id }) => [id, ''])) as MonthlyBudget['spending'],
  investments: '',
})

const amountPattern = /^(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/
export const isAmount = (value: string) => value === '' || (
  amountPattern.exec(value)?.[0] === value && Number.isFinite(Number(value))
)

export const budgetTotals = (budget: MonthlyBudget, catalog: CategoryCatalog = createCategoryCatalog()) => {
  if (Object.keys(budget.spending).length !== catalog.categories.length ||
      catalog.categories.some(({ id }) => !Object.hasOwn(budget.spending, id))) {
    throw new Error('Spending must contain exactly the catalog category IDs; no amounts were discarded.')
  }
  const amount = (value: string) => isAmount(value) ? Number(value) : 0
  const income = amount(budget.income)
  const spending = catalog.categories.reduce((sum, { id }) => sum + amount(budget.spending[id]), 0)
  const investments = amount(budget.investments)
  return { income, spending, investments, remaining: income - spending - investments }
}
