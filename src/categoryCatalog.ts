/**
 * App-wide spending catalog, shared across all months. Array order is
 * display order. Investments remain separate and are not a starter category.
 *
 * IDs are opaque, caller-supplied stable keys, never derived from labels or
 * translations. Carry usedIds forward with the catalog, including removed IDs;
 * do not rebuild it from active categories. Labels are trimmed, nonempty text;
 * duplicate labels are allowed because identity is determined only by ID.
 *
 * Removal here affects definitions only, never recorded amounts. Before future
 * integration removes a category, it must check references across ALL months.
 * If amounts exist, block removal until the user explicitly chooses what to do
 * with them (reassign or delete). Never silently drop amounts or change totals.
 * That decision flow and any data migration belong to separate integration work.
 */
export type CategoryDefinition = {
  readonly id: string
  readonly label: string
}

export type CategoryCatalog = {
  readonly categories: readonly CategoryDefinition[]
  readonly usedIds: readonly string[]
}

function catalog(categories: readonly CategoryDefinition[], usedIds: readonly string[]): CategoryCatalog {
  return Object.freeze({
    categories: Object.freeze(categories.map(({ id, label }) => Object.freeze({ id, label }))),
    usedIds: Object.freeze([...usedIds]),
  })
}

export function createCategoryCatalog(): CategoryCatalog {
  // Explicit IDs must stay fixed even if labels or the starter order change.
  const categories = [
    { id: 'starter-01', label: 'Housing & utilities' },
    { id: 'starter-02', label: 'Groceries' },
    { id: 'starter-03', label: 'Restaurants & food delivery' },
    { id: 'starter-04', label: 'Transport' },
    { id: 'starter-05', label: 'Healthcare & personal care' },
    { id: 'starter-06', label: 'Clothing & household' },
    { id: 'starter-07', label: 'Subscriptions & communications' },
    { id: 'starter-08', label: 'Education & hobbies' },
    { id: 'starter-09', label: 'Loans, insurance & taxes' },
    { id: 'starter-10', label: 'Other & irregular expenses' },
  ]
  return catalog(categories, categories.map(({ id }) => id))
}

function validateId(id: string) {
  if (typeof id !== 'string' || id.trim() === '' || id !== id.trim()) {
    throw new Error('Category ID must be nonempty text without surrounding whitespace.')
  }
}

function normalizeLabel(label: string): string {
  if (typeof label !== 'string' || label.trim() === '') {
    throw new Error('Category label must be nonempty text.')
  }
  return label.trim()
}

function findCategory(source: CategoryCatalog, id: string): CategoryDefinition {
  validateId(id)
  const category = source.categories.find(category => category.id === id)
  if (!category) throw new Error('Unknown category ID.')
  return category
}

/** Append a user-defined category; supply a fresh ID, not its display label. */
export function createCategory(source: CategoryCatalog, id: string, label: string): CategoryCatalog {
  validateId(id)
  if (source.usedIds.includes(id)) throw new Error('Category ID has already been used.')
  return catalog(
    [...source.categories, { id, label: normalizeLabel(label) }],
    [...source.usedIds, id],
  )
}

export function renameCategory(source: CategoryCatalog, id: string, label: string): CategoryCatalog {
  findCategory(source, id)
  const normalizedLabel = normalizeLabel(label)
  return catalog(
    source.categories.map(category => category.id === id ? { id, label: normalizedLabel } : category),
    source.usedIds,
  )
}

/** The requested order must contain every active ID exactly once. */
export function reorderCategories(source: CategoryCatalog, ids: readonly string[]): CategoryCatalog {
  if (!Array.isArray(ids) || ids.length !== source.categories.length || new Set(ids).size !== ids.length) {
    throw new Error('Category order must contain every active ID exactly once.')
  }
  return catalog(ids.map(id => findCategory(source, id)), source.usedIds)
}

/** Remove only the definition; retain its ID forever. See the amount policy above. */
export function removeCategory(source: CategoryCatalog, id: string): CategoryCatalog {
  findCategory(source, id)
  return catalog(source.categories.filter(category => category.id !== id), source.usedIds)
}

/** Validate persisted definitions without normalizing or guessing identities. */
export function validateCategoryCatalog(value: unknown): CategoryCatalog {
  const object = (item: unknown): item is Record<string, unknown> =>
    typeof item === 'object' && item !== null && !Array.isArray(item)
  if (!object(value) || Object.keys(value).length !== 2 ||
      !Array.isArray(value.categories) || !Array.isArray(value.usedIds)) {
    throw new Error('The category catalog must contain categories and usedIds arrays.')
  }
  const ids = new Set<string>()
  for (const entry of value.categories) {
    if (!object(entry) || Object.keys(entry).length !== 2 ||
        typeof entry.id !== 'string' || typeof entry.label !== 'string') {
      throw new Error('Each category must contain an ID and label.')
    }
    validateId(entry.id)
    if (normalizeLabel(entry.label) !== entry.label) throw new Error('Category labels must be trimmed.')
    if (ids.has(entry.id)) throw new Error('Category IDs must be unique.')
    ids.add(entry.id)
  }
  const usedIds = value.usedIds
  for (const id of usedIds) validateId(id)
  if (new Set(usedIds).size !== usedIds.length ||
      [...ids].some(id => !usedIds.includes(id))) {
    throw new Error('Used IDs must be unique and include every active category ID.')
  }
  return catalog(value.categories as CategoryDefinition[], value.usedIds as string[])
}
