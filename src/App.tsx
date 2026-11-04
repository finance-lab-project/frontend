import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { currentMonthKey, loadBudget, loadCategoryCatalog, saveBudget } from './budgetStorage'
import { BudgetExportError, serializeBudget, type BudgetExportFormat } from './budgetExport'
import { downloadFile } from './downloadFile'
import { BudgetBackupPreview } from './BudgetBackupPreview'
import { localBudgetMonth } from './budgetRestore'
import { budgetTotals, emptyBudget, isAmount, type MonthlyBudget } from './budgetModel'

import { createCategoryCatalog, type CategoryCatalog } from './categoryCatalog'

function readMonth(month: Date) {
  try {
    const catalog = loadCategoryCatalog()
    return { month, catalog, data: loadBudget(currentMonthKey(month), catalog), loadError: null, edited: false }
  } catch {
    return { month, catalog: createCategoryCatalog(), data: emptyBudget(), edited: false,
      loadError: 'Could not load this v3 budget or its category catalog. Editing and export are blocked to preserve stored amounts. Recover the catalog if needed, or use Settings to explicitly restore a valid backup for this month. No stored data was reset.' }
  }
}

const formatAmount = (value: number) =>
  value.toLocaleString(undefined, { maximumFractionDigits: 2 })

function App() {
  const [budget, setBudget] = useState(() => readMonth(new Date()))
  const { month, data, catalog, loadError } = budget
  const [saveError, setSaveError] = useState<string | null>(null)
  const monthKey = currentMonthKey(month)
  const [exportError, setExportError] = useState<string | null>(null)
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const restoredBudget = useRef<typeof budget | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const settingsButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Restoration has already persisted this exact state. Ordinary edits create
    // a new budget object and must still save, including the first restored edit.
    if (!budget.edited || loadError || budget === restoredBudget.current) return
    setSaveError(saveBudget(data, monthKey, catalog))
  }, [budget, monthKey, data, catalog, loadError])

  useLayoutEffect(() => {
    if (restoreNotice) heading.current?.focus()
  }, [restoreNotice, budget])

  useLayoutEffect(() => {
    if (settingsOpen) heading.current?.focus()
  }, [settingsOpen])

  const showRestoredBudget = (restored: { month: Date; data: MonthlyBudget; catalog: CategoryCatalog }, backupMonth: string) => {
    const nextBudget = { ...restored, loadError: null, edited: false }
    restoredBudget.current = nextBudget
    setBudget(nextBudget)
    setSaveError(null)
    setExportError(null)
    setRestoreNotice(`Restored budget for ${backupMonth}`)
    setSettingsOpen(false)
  }
  const totals = budgetTotals(data, catalog)

  const changeMonth = (offset: number) => {
    const nextMonth = localBudgetMonth(month.getFullYear(), month.getMonth() + offset)
    setBudget(readMonth(nextMonth))
    setSaveError(null)
    setExportError(null)
    setRestoreNotice(null)
  }

  const exportBudget = (format: BudgetExportFormat) => {
    try {
      const { month: selectedMonth, data: selectedData } = budget
      const year = String(selectedMonth.getFullYear()).padStart(4, '0')
      const monthNumber = String(selectedMonth.getMonth() + 1).padStart(2, '0')
      downloadFile(serializeBudget(`${year}-${monthNumber}`, selectedData, format, catalog))
      setExportError(null)
    } catch (error) {
      setExportError(error instanceof BudgetExportError
        ? error.message
        : 'Could not prepare the download. Please try exporting again.')
    }
  }

  const updateAmount = (field: 'income' | 'investments' | 'spending', value: string, categoryId?: string) => {
    setExportError(null)
    setRestoreNotice(null)
    setBudget((current) => ({
      ...current,
      edited: true,
      data: field === 'income' || field === 'investments'
        ? { ...current.data, [field]: value }
        : { ...current.data, spending: { ...current.data.spending, [categoryId!]: value } },
    }))
  }

  return (
    <main className="budget">
      <header className="page-header">
        <h1 ref={heading} tabIndex={-1}>{settingsOpen ? 'Settings' : 'Monthly budget'}</h1>
        <button ref={settingsButton} type="button" onClick={() => {
          setSettingsOpen(!settingsOpen)
          settingsButton.current?.focus()
        }}>
          {settingsOpen ? 'Back to budget' : 'Settings'}
        </button>
      </header>

      <aside className="upgrade-warning" aria-label="Experimental data upgrade warning">
        <strong>Export before upgrading.</strong> This experimental version starts a new category data model.
        {' '}Export every previous budget in the previous app before upgrading. Existing v2 data is kept
        in separate browser storage but is not shown or migrated here. JSON v1/v2 backups cannot be
        restored in this version. Keep the previous app and its exports for recovery; clearing site data
        can permanently erase both versions.
      </aside>
      {loadError && <p role="alert">{loadError}</p>}
      {saveError && <p role="alert">{saveError}</p>}

      <div hidden={settingsOpen}>
        {restoreNotice && <p role="status">{restoreNotice}</p>}

        <div className="month-navigation">
          <button type="button" onClick={() => changeMonth(-1)}>Previous month</button>
          <span aria-live="polite">
            {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button type="button" onClick={() => changeMonth(1)}>Next month</button>
        </div>

        {!loadError && <>
        <section aria-labelledby="summary-heading">
          <h2 id="summary-heading">Summary</h2>
          <dl className="totals">
            {([
              ['income', 'Income'],
              ['spending', 'Planned Spending'],
              ['investments', 'Planned Investments'],
              ['remaining', 'Remaining'],
            ] as const).map(([field, label]) => (
              <div key={field}>
                <dt>{label}</dt>
                <dd><output aria-label={label}>{formatAmount(totals[field])}</output></dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="budget-section" aria-labelledby="income-heading">
          <h2 id="income-heading">Monthly income</h2>
          <AmountInput id="income" label="Monthly income" value={data.income} onChange={(value) => updateAmount('income', value)} />
        </section>

        <section className="budget-section" aria-labelledby="spending-heading">
          <h2 id="spending-heading">Spending</h2>
          {catalog.categories.map(({ id, label }, index) => (
            <AmountInput key={id} id={`spending-${index}`} label={label} value={data.spending[id]} onChange={(value) => updateAmount('spending', value, id)} />
          ))}
        </section>

        <section className="budget-section" aria-labelledby="investments-heading">
          <h2 id="investments-heading">Investments</h2>
          <AmountInput id="investments" label="Investments" value={data.investments} onChange={(value) => updateAmount('investments', value)} />
        </section>
        </>}
      </div>

      <section hidden={!settingsOpen} aria-labelledby="data-backup-heading">
        <h2 id="data-backup-heading">Data &amp; Backup</h2>
        <p>
          Your financial data is stored in this browser's localStorage. It is not synced
          or automatically backed up. Clearing this browser's site data can erase your budgets.
          Keep downloaded JSON backups separately.
        </p>
        <div className="budget-export">
          <p>Selected budget: {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.</p>
          <div className="export-actions">
            <button type="button" disabled={!!loadError} aria-describedby="export-help" onClick={() => exportBudget('csv')}>
              Export CSV
            </button>
            <button type="button" disabled={!!loadError} aria-describedby="export-help" onClick={() => exportBudget('json')}>
              Export JSON backup
            </button>
          </div>
          <p id="export-help">
            CSV is for inspection. JSON v3 is a lossless backup of this month and its category catalog.
          </p>
          {exportError && <p role="alert">{exportError}</p>}
        </div>

        <BudgetBackupPreview
          budgetContext={budget}
          onRestored={showRestoredBudget}
          onRestoreActivity={() => setRestoreNotice(null)}
        />
      </section>
    </main>
  )
}

function AmountInput({ id, label, value, onChange }: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const invalid = !isAmount(value)
  return (
    <div className="amount-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} inputMode="decimal" value={value}
        aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)} />
      {invalid && <p id={`${id}-error`} className="amount-error" role="alert">
        Enter a nonnegative number or leave empty. This edit is not saved yet.
      </p>}
    </div>
  )
}

export default App
