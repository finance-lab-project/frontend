import { describe, expect, test } from 'vitest'
import {
  createCategory,
  createCategoryCatalog,
  removeCategory,
  renameCategory,
  reorderCategories,
} from './categoryCatalog'

const categoryIds = (source: ReturnType<typeof createCategoryCatalog>) =>
  source.categories.map(({ id }) => id)

describe('starter spending catalog', () => {
  test('has the ten agreed labels and stable IDs in display order', () => {
    const source = createCategoryCatalog()

    expect(source.categories).toEqual([
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
    ])
    expect(new Set(categoryIds(source)).size).toBe(10)
    expect(source.usedIds).toEqual(categoryIds(source))
    expect(createCategoryCatalog()).toEqual(source)
  })

  test('freezes definitions, display order and ID history at runtime', () => {
    const source = createCategoryCatalog()
    const created = createCategory(source, 'custom-01', 'Sample category')
    const renamed = renameCategory(created, 'custom-01', 'Renamed category')
    const reordered = reorderCategories(renamed, categoryIds(renamed).toReversed())
    const removed = removeCategory(reordered, 'custom-01')

    for (const result of [source, created, renamed, reordered, removed]) {
      expect(Object.isFrozen(result)).toBe(true)
      expect(Object.isFrozen(result.categories)).toBe(true)
      expect(Object.isFrozen(result.usedIds)).toBe(true)
      expect(result.categories.every(Object.isFrozen)).toBe(true)
    }
  })
})

describe('category operations', () => {
  test('appends a user category with a caller-supplied ID and trimmed label', () => {
    const source = createCategoryCatalog()
    const result = createCategory(source, 'custom-01', '  Sample category  ')

    expect(result.categories).toEqual([...source.categories, { id: 'custom-01', label: 'Sample category' }])
    expect(result.usedIds).toEqual([...source.usedIds, 'custom-01'])
    expect(createCategory(source, 'custom-01', '  Sample category  ')).toEqual(result)
    expect(source).toEqual(createCategoryCatalog())
  })

  test('renames a category without changing its ID, position or other definitions', () => {
    const source = createCategoryCatalog()
    const result = renameCategory(source, 'starter-02', '  Продукты  ')

    expect(result.categories).toEqual(source.categories.map(category =>
      category.id === 'starter-02' ? { id: 'starter-02', label: 'Продукты' } : category,
    ))
    expect(result.usedIds).toEqual(source.usedIds)
    expect(source).toEqual(createCategoryCatalog())
  })

  test('allows equal labels with distinct IDs on creation and rename', () => {
    const created = createCategory(createCategoryCatalog(), 'custom-01', 'Groceries')
    const renamed = renameCategory(created, 'starter-01', 'Groceries')

    expect(renamed.categories.filter(({ label }) => label === 'Groceries').map(({ id }) => id))
      .toEqual(['starter-01', 'starter-02', 'custom-01'])
  })

  test('reorders all definitions without changing their IDs or labels', () => {
    const source = createCategory(createCategoryCatalog(), 'custom-01', 'Sample category')
    const order = categoryIds(source).toReversed()
    const result = reorderCategories(source, order)

    expect(result.categories).toEqual(source.categories.toReversed())
    expect(result.usedIds).toEqual(source.usedIds)
    expect(categoryIds(source)).toEqual([...categoryIds(createCategoryCatalog()), 'custom-01'])
    expect(order).toEqual(categoryIds(source).toReversed())
    expect(reorderCategories(result, categoryIds(source))).toEqual(source)
  })

  test.each(['starter-02', 'custom-01'])('reserves removed ID %s through later edits', id => {
    const source = createCategory(createCategoryCatalog(), 'custom-01', 'Sample category')
    const removed = removeCategory(source, id)
    const renamed = renameCategory(removed, 'starter-01', 'Renamed category')
    const reordered = reorderCategories(renamed, categoryIds(renamed).toReversed())
    const created = createCategory(reordered, 'custom-02', 'New category')

    expect(removed.categories).toEqual(source.categories.filter(category => category.id !== id))
    expect(removed.usedIds).toEqual(source.usedIds)
    expect(() => createCategory(created, id, 'Replacement')).toThrow('already been used')
    expect(source.categories).toHaveLength(11)
    expect(source.categories.some(category => category.id === id)).toBe(true)
  })

  test('allows an empty catalog without forgetting IDs or preventing new categories', () => {
    const source = createCategoryCatalog()
    const empty = categoryIds(source).reduce((result, id) => removeCategory(result, id), source)

    expect(empty.categories).toEqual([])
    expect(empty.usedIds).toEqual(source.usedIds)
    expect(reorderCategories(empty, [])).toEqual(empty)
    expect(createCategory(empty, 'custom-01', 'Sample category').categories)
      .toEqual([{ id: 'custom-01', label: 'Sample category' }])
    expect(() => createCategory(empty, 'starter-01', 'Replacement')).toThrow('already been used')
  })
})

describe('invalid category input', () => {
  test.each(['', '  ', '\t\n', ' padded', 'padded '])('rejects invalid ID %j without normalizing it', id => {
    expect(() => createCategory(createCategoryCatalog(), id, 'Sample category')).toThrow('Category ID')
  })

  test.each(['', '  ', '\t\n'])('rejects blank label %j on creation and rename', label => {
    const source = createCategoryCatalog()

    expect(() => createCategory(source, 'custom-01', label)).toThrow('Category label')
    expect(() => renameCategory(source, 'starter-01', label)).toThrow('Category label')
    expect(source).toEqual(createCategoryCatalog())
  })

  test('rejects a duplicate active ID even when its label differs', () => {
    const source = createCategory(createCategoryCatalog(), 'custom-01', 'Sample category')

    expect(() => createCategory(source, 'starter-01', 'Different label')).toThrow('already been used')
    expect(() => createCategory(source, 'custom-01', 'Different label')).toThrow('already been used')
  })

  test.each(['unknown', 'starter-02'])('rejects unknown or removed ID %s for rename and removal', id => {
    const source = removeCategory(createCategoryCatalog(), 'starter-02')

    expect(() => renameCategory(source, id, 'Sample category')).toThrow('Unknown category ID')
    expect(() => removeCategory(source, id)).toThrow('Unknown category ID')
  })

  test.each(['missing', 'extra', 'duplicate', 'unknown', 'removed'])('rejects %s IDs in a requested order', scenario => {
    const source = removeCategory(createCategoryCatalog(), 'starter-02')
    const ids = categoryIds(source)
    const orders: Record<string, string[]> = {
      missing: ids.slice(1),
      extra: [...ids, 'custom-01'],
      duplicate: [ids[1], ...ids.slice(1)],
      unknown: ['unknown', ...ids.slice(1)],
      removed: ['starter-02', ...ids.slice(1)],
    }

    expect(() => reorderCategories(source, orders[scenario])).toThrow()
    expect(categoryIds(source)).toEqual(ids)
  })
})
