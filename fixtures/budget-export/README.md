# Synthetic v3 export pair

These JSON/CSV files are independently derived with Python's standard `json`
and `csv` libraries from
[`../budget-backup/v3/valid/representation.json`](../budget-backup/v3/valid/representation.json).
They contain synthetic data only.

JSON preserves all amount strings and the complete catalog (stable IDs, labels,
array order, and used-ID history). CSV uses quoted `Type,Category ID,Category,Amount`
columns, one Income record, ten Spending records in catalog order, and one
Investment record. It has one UTF-8 BOM and CRLF record terminators. Tests compare
both files exactly against the application serializer. Custom IDs and labels that
could be spreadsheet formulas receive an apostrophe prefix in inspection CSV;
JSON retains their exact text. CSV is not a restore format.
