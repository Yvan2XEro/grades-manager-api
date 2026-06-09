# Tuition Payments Integration Plan

## 1. Goal

Add a multi-tenant finance module to TKAMS that allows each institution to:

- define tuition fees and installment schedules;
- assign charges to student enrollments;
- accept Mobile Money and optionally card payments;
- record bank or cash payments through an approval workflow;
- generate payment notices, receipts, and tuition clearance certificates;
- reconcile TKAMS transactions with provider settlements.

The implementation must remain provider-independent and auditable.

## 2. Document Types

These documents have different meanings:

1. **Payment notice**: generated before payment, with the amount, due date,
   unique reference, and available payment channels.
2. **Payment receipt**: generated only after a payment has been verified and
   settled.
3. **Tuition clearance certificate**: confirms that the student satisfies the
   institution's configured financial requirements.

The document commonly called a "quitus" should therefore be a clearance
certificate, not merely a payment slip.

## 3. Recommended Money Flow

TKAMS should orchestrate payments without holding institutional funds:

- each institution owns its merchant or connected account;
- the payment provider settles funds directly to that institution;
- TKAMS stores references, statuses, allocations, and audit evidence;
- merchant credentials are configured and encrypted per institution;
- legal and contractual validation is completed before production.

This reduces the risk of TKAMS being treated as an unlicensed payment service
provider under CEMAC regulations.

## 4. Existing Integration Points

The current architecture already provides useful foundations:

- `institutionId` provides tenant isolation;
- `enrollments` links the student, class, and academic year;
- `students.me` can expose only the authenticated student's account;
- `academic-documents` can generate notices, receipts, and clearance PDFs;
- `notifications` can send confirmations and reminders;
- batch jobs can generate charges, expire intents, and run reconciliation;
- Hono can expose dedicated REST endpoints for provider webhooks.

Before introducing finance, enforce the functional uniqueness of a student's
enrollment for an academic year to prevent duplicate charges.

## 5. Proposed Data Model

Every finance table must include `institutionId`.

### Configuration

- `fee_definitions`: code, label, category, amount, currency, mandatory flag,
  and target population.
- `fee_plans`: installments, deadlines, allocation rules, and eligibility
  thresholds.
- `payment_provider_configs`: provider, merchant account, enabled mode, and
  encrypted secret references.

### Student Ledger

- `student_financial_accounts`: student, enrollment, academic year, currency,
  and account status.
- `student_charges`: immutable debit entries materialized from applicable
  fees.
- `financial_adjustments`: scholarships, waivers, discounts, penalties,
  cancellations, and corrections.
- `payment_allocations`: distribution of settled payments across charges.

### Payments

- `payment_intents`: server-generated reference, provider, amount, expiry,
  idempotency key, and status.
- `payment_transactions`: successful, failed, reversed, or refunded provider
  transactions.
- `payment_webhook_events`: raw event, provider event ID, signature result,
  processing status, and error.
- `reconciliation_runs`: settlement reconciliation sessions and discrepancies.

### Documents

- `payment_documents`: document type, number, checksum, generation date,
  revocation status, and financial account.

The account balance must be derived from charges, adjustments, and settled
allocations. It must not be maintained as an independently editable value.

## 6. Security and Tenant Isolation

- Resolve the tenant from the server-side payment reference and merchant
  account, never from a browser-provided `institutionId`.
- Calculate the payable amount on the server.
- Require an idempotency key for each payment intent.
- Store webhook events before processing and deduplicate provider event IDs.
- Verify every provider notification against the provider's status API.
- Compare amount, currency, reference, merchant account, and tenant before
  crediting the student account.
- Keep settled ledger entries immutable; corrections create reversal entries.
- Require maker-checker approval for manual bank and cash payments.
- Record actor, tenant, timestamp, previous value, new value, and reason in the
  audit trail.

## 7. Main Workflows

### Institution Administration

1. Configure fees and installments for an academic year.
2. Scope them to an institution, program, cycle, class, or admission type.
3. Materialize charges when an enrollment is created or activated.
4. Apply scholarships or waivers through an approved adjustment.
5. Monitor billed, paid, outstanding, overdue, pending, and reconciled amounts.

### Student Payment

1. Open `/student/finance`.
2. View billed, paid, outstanding, and next-due amounts.
3. Download a payment notice or select an installment.
4. Choose a channel and confirm the payer phone number.
5. TKAMS creates a payment intent and initiates the provider request.
6. The UI displays a pending status without assuming success.
7. After server verification, TKAMS posts the payment and generates a receipt.
8. TKAMS reevaluates and generates the clearance certificate when eligible.

### Provider Webhook

1. Receive the raw body at `/api/payments/webhooks/:provider`.
2. Verify the signature and identify the merchant account.
3. Store the event idempotently.
4. query the provider's transaction-status API.
5. Validate amount, currency, reference, and tenant.
6. Post the transaction and allocations in one database transaction.
7. Generate the receipt and reevaluate financial clearance.
8. Notify the student and finance office.

## 8. Clearance and Financial Holds

Each institution should configure its own rules, such as:

- full payment of all mandatory fees;
- first installment required to activate enrollment;
- minimum percentage required before examination access;
- full settlement before transcript or diploma issuance;
- explicitly non-blocking fee categories.

Academic modules should not implement these rules independently. Introduce a
central `financialEligibility` service returning:

- eligibility status;
- unsatisfied rules;
- missing amount;
- approved overrides;
- calculation timestamp.

A refund or reversal can revoke an existing clearance certificate. The
document remains in the audit history but fails public verification.

## 9. Provider Abstraction

```ts
interface PaymentProvider {
	createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
	getPaymentStatus(reference: string): Promise<PaymentStatusResult>;
	verifyWebhook(input: VerifyWebhookInput): Promise<boolean>;
	parseWebhook(input: ParseWebhookInput): Promise<PaymentEvent>;
}
```

Select the first provider only after confirming:

- Cameroon availability;
- MTN Mobile Money, Orange Money, and optional card support;
- one merchant or connected account per institution;
- KYC and settlement requirements;
- fees, currencies, and settlement delays;
- refunds and reversals;
- signed webhooks and transaction verification;
- sandbox availability;
- reconciliation report quality.

An aggregator with connected merchant accounts is the simplest multi-tenant
MVP. Direct MTN MoMo and Orange Money integrations provide more control but
require separate implementations and merchant onboarding.

## 10. Interfaces and Permissions

### Student Portal

- account summary;
- fees and installments;
- payment action and bounded status polling;
- transaction history;
- downloadable notices, receipts, and clearance certificates;
- clear explanation of financial holds.

### Finance Administration

- fee catalog and schedules;
- student ledgers;
- pending, settled, failed, and reversed payments;
- manual bank or cash entry;
- scholarships, discounts, and overrides;
- reconciliation and discrepancy handling;
- reports and exports;
- provider configuration.

Add dedicated permissions for finance managers, cashiers, approvers, auditors,
report viewers, fee configuration, and provider configuration.

## 11. Delivery Plan

### Phase 0: Discovery and Provider Selection

**Estimated duration: 1-2 weeks**

- workshops with finance, registry, and management teams;
- inventory of fees, installments, waivers, penalties, and holds;
- provider and money-flow selection;
- KYC, contractual, and regulatory validation;
- numbering and reconciliation policy.

### Phase 1: Ledger and Fee Configuration

**Estimated duration: 2-3 weeks**

- schema and multi-tenant constraints;
- fees, plans, accounts, charges, and adjustments;
- charge generation from enrollment;
- finance administration screens;
- audit trail and finance permissions.

### Phase 2: Online Payments

**Estimated duration: 2-3 weeks**

- provider abstraction and first adapter;
- idempotent payment intents;
- signed webhook and server-side verification;
- payment allocation;
- `/student/finance`;
- payment notice and receipt generation.

### Phase 3: Clearance and Eligibility

**Estimated duration: 1-2 weeks**

- configurable financial eligibility engine;
- clearance PDF with QR code or verification code;
- limited public verification endpoint;
- optional examination and academic-document holds;
- audited overrides.

### Phase 4: Reconciliation and Hardening

**Estimated duration: 2 weeks**

- provider settlement import or retrieval;
- automatic matching and discrepancy resolution;
- refunds and reversals;
- operational alerts and metrics;
- load, security, and failure-recovery tests.

## 12. MVP Acceptance Criteria

- Students can access only their account within their institution.
- Duplicate callbacks never credit an account twice.
- Browser redirects cannot confirm a payment.
- Amount or currency mismatches are quarantined.
- Receipts are generated only after server verification.
- Clearance rules are configurable per institution.
- Manual payments require independent approval.
- Payments, reversals, overrides, and documents remain fully auditable.
- Finance staff can reconcile transactions with provider settlements.

## 13. Critical Test Cases

- duplicate, delayed, and out-of-order webhooks;
- successful provider payment after the browser is closed;
- underpayment, overpayment, and currency mismatch;
- cross-tenant reference manipulation;
- expired intent followed by another attempt;
- provider timeout or outage;
- refund after clearance generation;
- partial payment allocated across several charges;
- duplicate enrollment or charge generation;
- maker-checker separation;
- duplicate bank-import rows;
- race between manual verification and webhook processing.

## 14. Official Sources

- [BEAC payment services regulation](https://www.beac.int/wp-content/uploads/2019/07/Reglement-N%C2%B004-CEMAC-UMAC-CM_du_21-decembre-2018_relatif-aux-services-de-paiement-dans-la-CEMAC.pdf)
- [Orange Money Web Payment](https://developer.orange.com/apis/om-webpay/)
- [MTN MoMo API](https://momoapi.mtn.com/)
- [CinetPay payment notifications](https://docs.cinetpay.com/api/1.0-en/checkout/notification)
- [Notch Pay payment API](https://developer.notchpay.co/docs/payments/accept-payments)
- [Notch Pay connected merchant accounts](https://developer.notchpay.co/docs/payments/sync)
- [CamPay](https://www.campay.net/en/)
