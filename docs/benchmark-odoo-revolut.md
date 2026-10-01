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
| Multi-user approvals (maker-checker) | Approval rules | Approval flows (Grow+) | **Built**: second authorised person, queue in App ("Waiting for your approval"), backlog + stuck view in Console |
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
| Bank reconciliation (match statement lines to invoices) | ML matching, OFX/CAMT import | Auto-match via integrations | **Gap** |
| Budgets and analytic accounts | Yes | Spend limits per team | **Partial**: grant budget vs spend; general budgets = Gap |
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

1. Bank-statement import and auto-reconciliation (CAMT.053/OFX/CSV) against invoices, bills and loan repayments.
2. Direct connectors to Xero / QuickBooks / Odoo (today: journal CSV).
3. Multi-approver chains (e.g. two of three) and per-user spend limits; today it is one second approver at a threshold.
4. SEPA direct-debit mandates for recurring collection.
5. Receipt capture/OCR for expenses; supplier-bill OCR.
6. General budgets and analytic accounts; fixed assets.
7. Real KYC/AML/FATF workflow and relationship-manager assignment for the financial-institution sub-profiles.
8. Regulatory report templates (BEAC/COBAC, actuarial, IFRS 17) beyond the KPI tiles and CSV.
