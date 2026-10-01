# Competitive benchmark: Odoo (finance apps) and Revolut Business

Scope: finance capabilities a PayRus organisation customer would compare against. Sources: Odoo Accounting
feature pages and documentation, and Revolut Business plan/feature pages (public, checked Oct 2026).
Status: **Built** = shipped by migrations 0053/0054 + App/Console in this change, **Existing** = already in PayRus,
**Gap** = not built yet (see "Remaining gaps").

## Cross-cutting capabilities (benefit every profile, App and Console)

| Capability | Odoo | Revolut Business | PayRus |
|---|---|---|---|
| Customer invoices with tax lines, payment terms, credit notes | Yes | Invoicing (Grow+) | **Built** (invoice / credit_note, VAT per line, server-side totals) |
| Vendor bills + approval before payment | Yes (bill runs) | Yes, approval flows | **Built** (vendor_bill, four-eyes above threshold) |
| Multi-user approvals (maker-checker) | Approval rules, multi-level expense approval | Approval flows (Grow+), per-person limits | **Built**: second authorised person, queue in App, backlog + stuck view in Console. **0057**: N distinct approvers per amount band, per-approver amount limits, approval progress (x of n) |
| Customer follow-ups / dunning, ageing report | Follow-up levels and reminders, ageing | n/a | **Built (0057)**: ageing buckets, 3-level follow-up ladder (1 / 15 / 45 days), recorded history + notification. Automatic e-mail/SMS sending = Gap |
| Recurring invoices / scheduled payments | Recurring invoices | Scheduled payments | **Built** (`inst_set_recurrence`, catch-up generation) |
| Bulk payments / payroll | Batch payments, payroll | Bulk transfers up to 1,000 | **Existing** payouts batches + **Built** payroll runs from an employee register with approval |
| Accounting export / double-entry journal | Native GL | Xero, QuickBooks, NetSuite sync | **Built** balanced journal CSV (importable into Odoo/Xero/QuickBooks); direct connectors = Gap |
| Loan amortisation and portfolio-at-risk | Via add-ons | n/a | **Built** (level-payment schedule, PAR, auto overdue) |
| Pro-rata distributions (dividends, yield) | Manual | n/a | **Built** (exact to the cent, remainder to last holder) |
| Governance: resolutions, quorum, tally | n/a | n/a | **Built** (outcome decided by tally + quorum, not by hand) |
| Audit trail on every record change | Chatter / logs | Activity log | **Built** (audit trigger on `inst_records`) + **Existing** audit view in Console |
| Role-based access | Groups | Roles | **Existing** (org tree, scoped roles) + sub-profile module entitlement |
| Multi-currency accounts, FX | Multi-currency | 30+ currencies | **Existing** wallets, FX margin config |
| Public API | JSON-RPC | Business API (Scale+) | **Existing** api-hub |
| Webhooks (event notifications) | Automated actions / webhooks | Up to 10 webhooks, signed deliveries | **Built (0058)**: up to 10 per account, 5 record/bank/follow-up events, outbox written in the same transaction as the change, HMAC-SHA256 signed deliveries (`PayRus-Signature`), retry ladder (1 min, 5 min, 30 min, 2 h, 12 h) then dead-letter with manual retry, secret shown once + rotation, HTTPS/443 public-host URL rules, delivery log + test ping in the App, delivery health and failures in the Console |
| Bank reconciliation (match statement lines to invoices) | ML matching, OFX/CAMT import, batch-payment lines, OCR of PDF statements | Auto-match via integrations | **Built (0057)**: CSV statement import with de-duplication, ranked suggestions (exact amount/currency/direction + reference + counterparty), one-click and bulk match, settles the record without moving wallet money, Console counter for unreconciled lines. CAMT/OFX/PDF-OCR import = Gap |
| Budgets with alerts | Budgets with real-time tracking and alerts | Spend limits per team | **Built (0057)**: budgets per module / record type / period / currency, alert threshold, ok-warning-over, Console counters. Analytic accounts = Gap |
| Fixed assets / depreciation | Yes | n/a | **Gap** (out of payments scope) |
| Corporate cards with spend controls, expense capture (receipts) | Expenses app | Cards, receipt capture, limits | **Existing** corporate cards + expense reports; receipt OCR = Gap |
| Direct debit mandates (SEPA) | Yes | Yes | **Gap** |

## Profile-specific modules (prototype parity and beyond)

| Prototype profile -> sub-profile (parent role) | Features promised in the prototype | PayRus now |
|---|---|---|
| Individual (personal) | wallet, mobile money, remittance | Existing, unchanged |
| Business / SME (merchant) | multi-user, invoicing, payroll, bulk payments | Invoicing + payroll **Built**; multi-user = org tree **Existing** |
| Corporate (treasury) | treasury, API, multi-currency, dedicated manager | Existing + invoicing/payroll **Built**; relationship manager flag in `sub_profiles` |
| NGO / Association (ngo) | donor collection, grant tracking, reduced fees, NGO reporting | **Built**: donations, grants, tranches, expenses vs budget, utilisation KPI, CSV |
| Pension Fund (treasury) | pension accounts, contributors, annuities, actuarial reports | **Built**: contributors, contributions, annuities with amortised payment, valuation with funding ratio |
| Microfinance (group) | microloans, group savings, agent network, MFI reporting | **Built**: clients, loans + schedule, repayments auto-closing loans, PAR, group savings, agents |
| Cooperative / SACCO (group) | member accounts, savings and loans, dividends, governance | **Built**: members, shares, savings, loans, dividends, resolutions |
| Insurance (treasury) | premiums, claims, policies, reinsurance | **Built**: policies, premiums, claims (four-eyes), reinsurance treaties, loss ratio, ceded premium |
| Investment Fund (treasury) | portfolio, fund transfers, yield distribution, investor reporting | **Built**: portfolios, holdings, NAV and NAV/unit, investors, yield distribution |
| Development Bank (public_institution) | project financing, sovereign loans, interbank, development reporting | **Built**: projects, sovereign loans + schedule, tranche disbursements, interbank, result indicators |
| Government (public_institution) | sovereign account, tax and revenue, interbank, audit trail | **Built**: assessments with auto-overdue, collection rate, treasury remittances; audit **Existing** |
| State-Owned Entity (public_institution) | public payroll, procurement, treasury, compliance | **Built**: payroll, purchase orders, supplier payments with approval |
| System Administrator (admin) | everything | All modules visible to the admin role |

Financial-institution sub-profiles carry `enhanced_kyc` and `relationship_mgr` flags (shown in the App; wiring them to an
actual KYC/AML/FATF workflow and manager assignment is the next step, see gaps).

## Remaining gaps (not built; ordered by competitive impact)

1. Direct connectors to Xero / QuickBooks / Odoo (today: journal CSV).
3. CAMT.053 / OFX / PDF-OCR statement import (today: CSV).
4. SEPA direct-debit mandates for recurring collection.
5. Receipt capture/OCR for expenses; supplier-bill OCR.
6. Analytic accounts; fixed assets and depreciation.
7. FX forward contracts, limit/stop orders and price alerts (Revolut treasury); needs a liquidity partner.
8. Per-card spend controls (category, country, per-transaction limits) on the corporate cards.
7. Real KYC/AML/FATF workflow and relationship-manager assignment for the financial-institution sub-profiles.
8. Regulatory report templates (BEAC/COBAC, actuarial, IFRS 17) beyond the KPI tiles and CSV.

## Sources

- Odoo 18 Accounting: https://www.odoo.com/documentation/18.0/applications/finance/accounting.html and https://www.odoo.com/app/accounting-features
- Odoo vendor bills, digitization and expenses: https://www.odoo.com/documentation/19.0/applications/finance/accounting/vendor_bills.html and https://www.odoo.com/documentation/19.0/applications/finance/expenses/log_expenses.html
- Revolut Business expense management: https://www.revolut.com/en-US/business/expense-management/
- Revolut Business API and webhooks: https://developer.revolut.com/docs/business/business-api and https://developer.revolut.com/docs/guides/manage-accounts/webhooks/manage-webhooks
