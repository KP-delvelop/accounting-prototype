# Accounting Prototype

Meeting-ready prototype for a Lao accounting workflow app.

## What It Shows

- Dashboard for May closing status
- Journal review workflow
- Chart of accounts seeded from the Excel workbook
- Trial balance summary
- Report readiness before and after closing
- Quick journal entry validation
- Lao/English report language toggle placeholder

## Local Run

```bash
npm install
npm run build
npm run preview
```

## Source Data

The seed extraction script reads the local workbook:

```text
D:\Download\ACC  Exprogram Test Apr20.xlsx
```

Run extraction again with:

```bash
npm run extract:data
```
