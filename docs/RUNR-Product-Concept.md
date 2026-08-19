# Restaurant-Based Delivery Marketplace

## Overview

A food delivery platform that operates similarly to traditional delivery apps, but with a fundamentally different driver model.

Restaurants continue to receive customer orders through the platform.

Customers order food normally.

Restaurants prepare the orders normally.

The difference is how delivery drivers connect to restaurants.

Instead of drivers constantly searching for individual delivery orders, drivers can choose a specific restaurant and select their own available working time.

Drivers are still paid **per completed delivery**, based on delivery compensation, distance, and customer tips.

The platform dynamically manages restaurant driver coverage based on each restaurant's staffing requirements.

---

## Core Concept

The platform connects:

**Customers → Restaurants → Drivers**

But drivers do not simply claim random orders.

Drivers can choose:

> "I want to deliver for this restaurant during this time."

Once the driver's selected time is accepted, the driver becomes available for deliveries originating from that specific restaurant during that period.

The driver is NOT paid hourly.

They are paid for each completed delivery.

---

## Driver Model

Drivers have complete control over when and where they want to work.

A driver can:

- Select any participating restaurant
- Select their own start time
- Select their own end time
- Work for a restaurant for any available period
- See current staffing levels
- See staffing gaps
- See restaurant demand
- See busy periods
- See how many drivers the restaurant wants
- Leave the restaurant assignment when their selected period ends

There are no mandatory preset shifts.

---

## Example

A driver opens:

### Tony's Pizza

Driver sees:

**Today's Coverage**

| Time | Drivers Needed | Drivers Covered | Status |
|---|---:|---:|---|
| 10 AM–12 PM | 1 | 1 | Full |
| 12 PM–3 PM | 2 | 1 | 1 Needed |
| 3 PM–5 PM | 3 | 2 | 1 Needed |
| 5 PM–7 PM | 6 | 4 | 2 Needed |
| 7 PM–9 PM | 4 | 4 | Full |
| 9 PM–11 PM | 2 | 1 | 1 Needed |

The driver decides:

**Start:** 5:30 PM  
**End:** 8:15 PM

If coverage is available, the driver can claim that period.

The system then factors the driver's availability into the restaurant's live coverage.

---

## Restaurant Staffing Controls

Restaurants control how many drivers they want available during different periods.

Restaurants can create a staffing schedule such as:

### Monday

- 10 AM–12 PM → Maximum 1 driver
- 12 PM–3 PM → Maximum 2 drivers
- 3 PM–5 PM → Maximum 3 drivers
- 5 PM–7 PM → Maximum 6 drivers
- 7 PM–9 PM → Maximum 4 drivers
- 9 PM–11 PM → Maximum 2 drivers

Restaurants can modify these requirements at any time.

---

## Dynamic Coverage System

The system continuously compares:

**Drivers Needed**

against

**Drivers Currently Scheduled**

The system identifies:

- Fully covered periods
- Low-driver periods
- Driver gaps
- Over-capacity periods
- High-demand periods

---

## Coverage Status

### 🟢 Fully Covered

The restaurant has enough drivers for the current requirement.

Example:

**4 Needed**  
**4 Scheduled**

Status:

> FULL

New drivers may not be able to reserve that period unless the restaurant increases capacity.

---

### 🟠 Low Coverage

The restaurant has drivers, but not enough to reach its desired coverage.

Example:

**4 Needed**  
**3 Scheduled**

Status:

> 1 DRIVER NEEDED

The system promotes the available opening to drivers.

---

### 🔴 Driver Gap

The restaurant is significantly under its desired coverage.

Example:

**6 Needed**  
**3 Scheduled**

Status:

> 3 DRIVERS NEEDED

The restaurant can be prominently displayed to drivers looking for work.

---

### 🔵 Over Capacity

The restaurant has more scheduled drivers than currently requested.

Example:

**4 Maximum**  
**4 Scheduled**

The restaurant becomes unavailable for additional driver reservations during that period.

---

## Driver Availability Selection

Drivers should not be restricted to predefined shifts.

The driver can select:

**Restaurant:** Tony's Pizza

**Start:** 5:37 PM

**End:** 8:12 PM

The system checks the requested period against restaurant coverage.

If available:

> COVERAGE AVAILABLE

Driver confirms.

---

## Dynamic Time Matching

Driver schedules can overlap.

Example:

Restaurant needs:

**6 drivers from 5 PM–7 PM**

Current coverage:

| Period | Coverage |
|---|---|
| 5 PM–5:30 PM | 4/6 |
| 5:30 PM–6 PM | 6/6 |
| 6 PM–7 PM | 5/6 |

The platform identifies:

- 2-driver gap from 5–5:30
- Full coverage from 5:30–6
- 1-driver gap from 6–7

Drivers can select available portions of the restaurant's coverage window.

---

## Driver Store Discovery

Drivers can browse participating restaurants.

Example:

### Restaurants Near You

#### Tony's Pizza

🔥 High Demand

**5 PM–7 PM**

6 needed  
4 covered

**2 drivers needed**

Estimated delivery activity: High

[Work Here]

---

#### Burger House

🟢 Covered

2 needed  
2 covered

**Fully staffed**

[View Store]

---

#### Wing Stop

🟠 Driver Needed

4 needed  
2 covered

**2 drivers needed**

6 PM–10 PM

[Work Here]

---

## Restaurant Profile

Each restaurant should have a driver-facing profile.

Information may include:

- Restaurant name
- Location
- Distance from driver
- Current driver coverage
- Maximum driver capacity
- Coverage gaps
- Busy periods
- Historical demand
- Estimated delivery activity
- Operating hours
- Current order volume
- Restaurant rating
- Driver rating
- Available work periods

---

## Demand Forecasting

The platform can use historical order information to estimate future delivery demand.

Example:

### Tonight

Expected orders:

**87**

Recommended drivers:

**5**

Current drivers:

**3**

System recommendation:

> ⚠️ 2 additional drivers recommended

The restaurant can adjust its desired driver coverage accordingly.

---

## Driver Earnings

Drivers remain independent delivery workers within the platform's delivery model.

Drivers are NOT paid simply for reserving time at a restaurant.

They earn money by completing deliveries.

Each delivery can include:

### Delivery Compensation

- Base delivery pay
- Distance-based compensation
- Applicable delivery incentives
- Customer tips

Example:

### Delivery #1842

Base Pay: **$4.00**

Distance Pay: **$3.25**

Customer Tip: **$5.00**

Total Driver Earnings: **$12.25**

---

## Tips

Customer tips are associated with the delivery and driver.

Driver earnings should clearly separate:

**Delivery Earnings**

and

**Tips**

Example:

> Delivery Earnings: $71.50  
> Tips: $32.50  
> Total: **$104.00**

---

## Stripe Connection and Payments

RUNR uses **Stripe** as the platform payment provider. Stripe Connect powers the marketplace model so customers, businesses, and RUNRs can all transact through one integrated payment system.

### Payment Architecture Overview

RUNR operates as a **Stripe Connect marketplace platform**.

| Party | Stripe Object | Purpose |
|---|---|---|
| RUNR (platform) | Platform Stripe account | Collects payments, routes funds, takes platform fees |
| Customer | Stripe Customer | Saved cards, checkout, order charges |
| Business | Connected Account | Receives food order revenue |
| RUNR (driver) | Connected Account | Receives delivery pay and tips |

Money flow:

**Customer → Platform charge → Split between Business, RUNR, and RUNR platform fee**

---

### Stripe Connect Setup

Each business and RUNR must complete Stripe onboarding before receiving payouts.

**Business onboarding**

- Business owner creates or links a Stripe Connect account
- Stripe collects identity, business, and bank details
- Platform verifies onboarding status before enabling payouts
- Business dashboard shows payout status, pending balance, and payout history

**RUNR onboarding**

- RUNR completes Stripe Express onboarding during account setup
- Identity verification, tax information, and payout destination required
- RUNR cannot receive delivery earnings until Stripe onboarding is complete
- Incomplete onboarding blocks payout but does not block scheduling a RUN (configurable by policy)

**Onboarding states**

| Status | Meaning |
|---|---|
| Not started | User has not begun Stripe setup |
| In progress | Onboarding started but incomplete |
| Pending verification | Stripe reviewing submitted information |
| Active | Eligible to receive payouts |
| Restricted | Action required — payouts paused |
| Rejected | Cannot receive payouts until resolved |

---

### Customer Payments

Customers pay for orders through Stripe at checkout.

**Supported payment methods (MVP)**

- Credit and debit cards
- Apple Pay
- Google Pay

**Future payment methods**

- Cash App Pay
- Link
- Buy now, pay later (region-dependent)

**Checkout flow**

1. Customer reviews cart (food + delivery fee + tax + tip)
2. Platform creates a Stripe **Payment Intent**
3. Customer confirms payment via Stripe Payment Element
4. Stripe authorizes and captures payment
5. Order is created only after successful payment confirmation
6. Customer receives receipt and order confirmation

**Saved payment methods**

- Stripe Customer objects store tokenized payment methods
- Customers can save a default card for faster checkout
- No raw card data is stored on RUNR servers

**Example checkout breakdown**

| Line Item | Amount |
|---|---:|
| Food subtotal | $24.50 |
| Delivery fee | $4.99 |
| Service fee | $1.50 |
| Tax | $2.14 |
| Tip | $5.00 |
| **Total charged** | **$38.13** |

---

### Order Payment Split

Each completed order payment is split across marketplace participants.

**Example: Order #4821**

Customer total charged: **$38.13**

| Recipient | Amount | Type |
|---|---:|---|
| Tony's Pizza (Business) | $24.50 | Food subtotal |
| RUNR (Driver) | $7.25 | Base pay + distance pay |
| RUNR (Driver) | $5.00 | Tip |
| RUNR (Platform) | $1.50 | Service / platform fee |
| Tax (held/remitted per policy) | $2.14 | Tax |

The platform uses Stripe **application fees** and **transfers** to route funds to connected accounts.

---

### Delivery Earnings and Payouts

RUNRs are paid per completed delivery, not for time reserved at a restaurant.

**Earnings components (per delivery)**

- Base delivery pay
- Distance-based compensation
- Delivery incentives (if applicable)
- Customer tips

**Weekly payout schedule**

RUNR uses **weekly payouts** as the default pay cycle for all RUNRs.

| Setting | Default |
|---|---|
| Payout frequency | **Weekly** |
| Pay period | Monday 12:00 AM – Sunday 11:59 PM (local market time) |
| Payout day | Wednesday (for prior week's completed pay period) |
| Processing window | Monday–Tuesday (earnings finalized, Prop 22 adjustments calculated) |
| Minimum payout threshold | $1.00 (no hold unless Stripe/account issue) |
| Payout destination | RUNR bank account or debit card (via Stripe) |

**Weekly payout flow**

1. RUNR completes deliveries throughout the week
2. Per-delivery earnings accrue in real time to pending balance
3. Pay period closes Sunday at midnight
4. Platform calculates gross delivery earnings, tips, incentives, and adjustments
5. Platform calculates Prop 22 minimum earnings top-up (California RUNRs only)
6. Platform calculates healthcare stipend eligibility (California RUNRs only)
7. Stripe initiates weekly payout on Wednesday
8. RUNR receives deposit and weekly earnings statement

**Between payout days**

- Earnings are visible in real time but marked as **Pending — pays Wednesday**
- RUNR can see running week-to-date totals at all times
- Tips and delivery pay update immediately after each completed delivery
- Prop 22 top-up amount updates as engaged time and miles accumulate

**RUNR Earnings screen should show**

- Current pay period dates (e.g., Aug 11–Aug 17)
- Next payout date and amount (estimated)
- Week-to-date delivery earnings
- Week-to-date tips (separate line)
- Engaged time and engaged miles (California)
- Prop 22 minimum earnings status (California)
- Prop 22 top-up amount, if applicable (California)
- Pending earnings (not yet paid out)
- Available balance (from prior completed payouts)
- Payout history (weekly statements)
- Per-delivery earnings breakdown
- Stripe payout status

**Example weekly payout**

> **Weekly Payout #47**  
> Pay period: Aug 11–Aug 17, 2026  
> Payout date: Aug 20, 2026
>
> Delivery earnings: $412.50  
> Tips: $186.00  
> Incentives: $25.00  
> Prop 22 top-up: $18.75  
> Healthcare stipend: $0.00  
> Adjustments: -$0.00  
> **Total deposited: $642.25**

**Weekly earnings statement**

Each payout includes a downloadable weekly earnings statement showing:

- Every completed delivery with pay breakdown
- Total engaged time and engaged miles
- Tips (itemized separately)
- Prop 22 minimum earnings calculation (California)
- Healthcare stipend, if earned (California)
- Net deposit amount
- Year-to-date totals

---

### Tips Through Stripe

Tips are collected at checkout or added after delivery (if enabled).

**Rules**

- Tips are associated with the specific delivery and RUNR
- Tips are displayed separately from delivery pay in all earnings views
- Tips transfer to the assigned RUNR's connected account
- Platform does not take a fee on tips (unless policy changes — document explicitly if so)
- Post-delivery tip additions create a separate Stripe charge or Payment Intent

**Tip flow**

1. Customer selects or enters tip at checkout
2. Tip amount included in total Payment Intent
3. On delivery completion, tip is allocated to the assigned RUNR
4. Tip appears in RUNR earnings and next weekly payout

---

## California Prop 22 Compliance

RUNR operates in California as a **network company** under Proposition 22. All California RUNRs are classified as **independent contractors** and receive the benefits and protections required by Prop 22.

This section defines every Prop 22 requirement the platform must implement, track, and report.

---

### Prop 22 Overview

Proposition 22 (California Business and Professions Code § 7448–7467) requires app-based delivery platforms to provide:

| Requirement | Description |
|---|---|
| Minimum earnings guarantee | Net earnings floor for each earnings period |
| Engaged mileage reimbursement | Per-mile pay during engaged time |
| Healthcare stipends | Quarterly stipend for eligible RUNRs with qualifying health coverage |
| Occupational accident insurance | Medical and disability coverage while engaged |
| Accidental death insurance | Coverage for death while engaged |
| Rest periods | Mandatory break after 12 hours engaged time in 24 hours |
| Anti-discrimination | Protection from discrimination |
| Safety training | Required safety education |
| Background checks | Criminal background screening |
| Deactivation appeals | Fair process for account deactivation |
| Pay transparency | Clear disclosure of how earnings are calculated |

Prop 22 applies to all California RUNRs. Non-California markets follow regional compliance rules separately.

---

### Engaged Time

Prop 22 compensation is based on **engaged time**, not total time online or time reserved at a restaurant.

**Engaged time begins when:**

- RUNR accepts a delivery assignment

**Engaged time ends when:**

- RUNR completes the delivery (drop-off confirmed)

**Engaged time does NOT include:**

- Time waiting for a delivery assignment
- Time between deliveries
- Time reserved at a restaurant with no active delivery
- Time after a customer cancels before pickup
- Time after a RUNR abandons a delivery

**Platform must track per delivery:**

| Metric | Tracked |
|---|---|
| Accept timestamp | ✓ |
| Pickup timestamp | ✓ |
| Drop-off timestamp | ✓ |
| Engaged time (minutes) | ✓ |
| Engaged miles | ✓ |
| Pickup location (for local minimum wage) | ✓ |

**RUNR dashboard should display:**

> **This Week**  
> Engaged time: 14h 32m  
> Engaged miles: 87.4 mi  
> Deliveries completed: 28

---

### Minimum Earnings Guarantee (Net Earnings Floor)

For each earnings period, RUNR must ensure every California RUNR earns at least the **net earnings floor**.

**Net earnings floor formula:**

> **(120% × applicable minimum wage × engaged hours) + (engaged miles × per-mile rate)**

| Component | Rate (2026) | Notes |
|---|---|---|
| Minimum wage multiplier | 120% | Of applicable minimum wage |
| Applicable minimum wage | $16.90/hr (state) or higher local wage | Determined at **pickup location** |
| Per-mile rate | $0.37/mile | Adjusted annually for inflation |
| Earnings period | Up to 14 days | RUNR uses **7-day weekly periods** |

**Applicable minimum wage**

- Use California state minimum wage ($16.90/hr as of 2026) by default
- If pickup is in a city/county with a higher minimum wage, use the **local minimum wage**
- Platform must maintain an updated local minimum wage database by pickup location

**Net earnings calculation**

Net earnings include:

- Base delivery pay
- Distance-based compensation
- Delivery incentives
- Prop 22 per-mile engaged mileage amount (included in floor, not additive on top)

Net earnings do **NOT** include:

- Customer tips (tips are always 100% RUNR's — separate from floor calculation)
- Healthcare stipends
- Prop 22 top-up payments themselves

**Top-up payment**

If a RUNR's net earnings for the pay period fall below the net earnings floor, RUNR pays the difference as a **Prop 22 top-up** included in the weekly payout.

**Example: Weekly Prop 22 calculation**

| Metric | Value |
|---|---:|
| Engaged time | 18.5 hours |
| Engaged miles | 112 miles |
| Applicable minimum wage (pickup avg) | $17.50/hr |
| Gross delivery earnings | $310.00 |
| Tips (not in floor) | $95.00 |

**Net earnings floor:**

> (18.5 × $17.50 × 1.20) + (112 × $0.37)  
> = $388.50 + $41.44  
> = **$429.94**

**Top-up required:**

> $429.94 − $310.00 = **$119.94**

**Weekly payout:**

> Delivery earnings: $310.00  
> Tips: $95.00  
> Prop 22 top-up: $119.94  
> **Total: $524.94**

**RUNR app must show:**

- Current week net earnings vs. floor (real-time)
- Whether RUNR is above or below floor
- Estimated top-up amount
- Final top-up on weekly earnings statement

---

### Healthcare Stipends

California RUNRs who meet engaged-time and enrollment requirements receive a **quarterly healthcare stipend**.

**Eligibility requirements**

- RUNR completes average of **15+ hours engaged time per week** during the calendar quarter
- RUNR is the **primary policyholder** of a qualifying health plan
- Health plan is **not employer-sponsored**
- RUNR is **not enrolled in Medi-Cal** or other public assistance programs that disqualify eligibility
- RUNR submits **proof of enrollment** within 15 days after quarter end

**Stipend amounts (based on average weekly engaged time for the quarter)**

| Avg Weekly Engaged Time | Stipend |
|---|---|
| Under 15 hours | $0 |
| 15 – 24.9 hours | 50% of average Covered California bronze plan premium |
| 25+ hours | 100% of average Covered California bronze plan premium |

**Calendar quarters**

| Quarter | Period |
|---|---|
| Q1 | January 1 – March 31 |
| Q2 | April 1 – June 30 |
| Q3 | July 1 – September 30 |
| Q4 | October 1 – December 31 |

**Healthcare stipend flow**

1. Platform tracks engaged time throughout the quarter
2. Quarter ends — platform calculates average weekly engaged hours
3. RUNR notified of eligibility and documentation requirements
4. RUNR uploads proof of qualifying health plan enrollment
5. Platform verifies within 15 days
6. Stipend paid within 15 days of verified documentation
7. Stipend appears on California Earnings Statement

**RUNR app must include:**

- Quarter-to-date engaged hours and weekly average
- Healthcare stipend eligibility status
- Document upload for proof of enrollment
- Stipend payment history
- Link to Covered California resources

---

### Insurance Requirements

RUNR must provide insurance coverage to California RUNRs while they are engaged in deliveries.

#### Occupational Accident Insurance

Covers injuries sustained while engaged in a delivery.

| Coverage | Minimum |
|---|---|
| Medical expenses | Up to $1,000,000 |
| Disability payments | As required by Prop 22 |
| Coverage period | From acceptance to delivery completion |

**Platform must:**

- Maintain occupational accident insurance policy for all California RUNRs
- Provide insurance certificate and coverage details in RUNR app
- Process injury claims through designated insurance workflow
- Document all injury reports

#### Accidental Death Insurance

Covers death while engaged in a delivery.

| Coverage | Minimum |
|---|---|
| Accidental death benefit | As required by Prop 22 |
| Coverage period | From acceptance to delivery completion |

**Platform must:**

- Maintain accidental death insurance for California RUNRs
- Provide beneficiary designation flow in RUNR onboarding
- Display coverage summary in RUNR profile

#### Auto Insurance

RUNRs must maintain valid personal auto insurance meeting California minimum requirements.

**Platform must:**

- Verify auto insurance during onboarding
- Require proof of insurance renewal
- Suspend RUNR if insurance lapses

---

### Rest Period Requirements

California RUNRs cannot exceed **12 hours of engaged time within any 24-hour period** without a mandatory rest break.

**Rules**

| Rule | Requirement |
|---|---|
| Maximum engaged time | 12 hours in any rolling 24-hour window |
| Required rest break | 6 consecutive hours off after hitting 12-hour limit |
| During rest break | RUNR cannot accept new deliveries |
| RUN scheduling | Platform must block delivery assignment during rest period |

**Platform behavior when rest is required**

> ⚠️ REST PERIOD REQUIRED
>
> You've reached 12 hours of engaged time in the last 24 hours.
>
> You must take a 6-hour break before accepting new deliveries.
>
> Rest period ends: 2:30 AM

**Platform must:**

- Track rolling 24-hour engaged time windows
- Automatically block new delivery assignments during rest
- Allow RUNR to remain checked in at restaurant but not accept deliveries
- Log rest period events for compliance audit

---

### Anti-Discrimination Protections

Prop 22 prohibits discrimination against RUNRs based on:

- Race, color, national origin, ancestry
- Religion
- Sex, gender, gender identity, gender expression
- Sexual orientation
- Disability
- Medical condition
- Age
- Military or veteran status
- Any other protected class under California law

**Platform must:**

- Enforce anti-discrimination policy in RUNR terms
- Provide reporting mechanism for discrimination claims
- Investigate reports through Moderator/Administrator workflow
- Document all discrimination complaints and resolutions
- Train internal staff on Prop 22 anti-discrimination requirements

---

### Background Checks

California RUNRs must pass a criminal background check before activation.

**Platform must:**

- Conduct background check during RUNR onboarding
- Re-check on a defined schedule (at least every 12 months)
- Disqualify RUNRs per Prop 22 and platform safety standards
- Provide adverse action notice if denied based on background check
- Allow RUNR to dispute inaccurate background check results

**Disqualifying offenses (per Prop 22 and platform policy)**

- Violent felonies
- Sexual offenses
- DUI within defined lookback period
- Other offenses as defined in platform safety policy

---

### Deactivation and Appeals

Prop 22 requires a fair deactivation process with the right to appeal.

**Deactivation rules**

| Rule | Requirement |
|---|---|
| Notice | RUNR notified of deactivation reason |
| Appeal window | RUNR may appeal within defined period |
| Response time | Platform must respond within **5 business days** |
| Appeal review | Independent review of deactivation decision |
| Reinstatement | RUNR reinstated if appeal upheld |

**Deactivation flow**

1. Platform or Moderator initiates deactivation with documented reason
2. RUNR receives notification with reason and appeal instructions
3. RUNR submits appeal with supporting information
4. Administrator reviews appeal within 5 business days
5. Decision communicated to RUNR
6. If upheld, account reinstated; if denied, deactivation stands with final explanation

**Platform must track:**

- Deactivation reason and timestamp
- Appeal submission and review timeline
- Appeal outcome
- Reinstatement date, if applicable

---

### Safety Training

California RUNRs must complete safety training before accepting deliveries.

**Required training topics**

- Safe driving practices
- Food safety and handling
- Contactless delivery procedures
- Accident and injury reporting
- Harassment and discrimination prevention
- Prop 22 rights and benefits overview

**Platform must:**

- Provide training module during onboarding
- Require completion before first delivery
- Require annual refresher training
- Track training completion dates
- Block delivery assignment if training is expired

---

### Pay Transparency

Prop 22 requires clear disclosure of how RUNR earnings are calculated.

**Before each delivery acceptance, RUNR must see:**

- Estimated delivery pay
- Estimated distance pay
- Estimated engaged time
- Estimated engaged miles
- Tip amount (if pre-selected by customer)
- Confirmation that tips are 100% RUNR's

**RUNR must have access to:**

- Full pay policy documentation
- Prop 22 rights summary
- How engaged time is calculated
- How minimum earnings guarantee works
- Healthcare stipend eligibility rules
- Insurance coverage details
- Weekly and quarterly earnings statements

**Example pre-acceptance display**

> **Delivery #2847 — Tony's Pizza**  
> Estimated pay: $7.25  
> Distance pay: $3.10  
> Est. engaged time: 22 min  
> Est. engaged miles: 4.2 mi  
> Customer tip: $5.00  
> Tips are 100% yours.

---

### Prop 22 Earnings Statement

California RUNRs receive a **Prop 22 Earnings Statement** with each weekly payout and quarterly for healthcare.

**Weekly statement includes:**

| Field | Included |
|---|---|
| Pay period dates | ✓ |
| Total deliveries completed | ✓ |
| Total engaged time | ✓ |
| Total engaged miles | ✓ |
| Gross delivery earnings | ✓ |
| Tips (separate) | ✓ |
| Incentives | ✓ |
| Net earnings floor calculation | ✓ |
| Prop 22 top-up amount | ✓ |
| Net deposit | ✓ |
| Year-to-date earnings | ✓ |
| Year-to-date engaged time | ✓ |

**Quarterly statement adds:**

| Field | Included |
|---|---|
| Calendar quarter | ✓ |
| Average weekly engaged hours | ✓ |
| Healthcare stipend eligibility | ✓ |
| Healthcare stipend amount | ✓ |
| Proof of enrollment status | ✓ |

Statements must be available in-app and downloadable as PDF.

---

### Prop 22 Platform Systems

The platform must build these systems to maintain Prop 22 compliance.

| System | Purpose |
|---|---|
| Engaged time engine | Track accept-to-complete time per delivery |
| Engaged miles engine | Track miles during engaged time via GPS |
| Local minimum wage database | Apply correct wage by pickup location |
| Net earnings floor calculator | Real-time and end-of-period floor calculation |
| Top-up payment processor | Auto-calculate and pay shortfall via Stripe |
| Healthcare stipend tracker | Quarterly hours + enrollment verification |
| Insurance management | Policy docs, claims, beneficiary records |
| Rest period enforcer | Block assignments after 12hr engaged / 24hr window |
| Background check integration | Onboarding and recurring checks |
| Deactivation appeals workflow | 5-business-day response compliance |
| Safety training module | Onboarding + annual refresher |
| Earnings statement generator | Weekly + quarterly Prop 22 statements |
| Compliance audit log | Immutable record of all compliance actions |

---

### Prop 22 Admin Controls

| Role | Prop 22 Controls |
|---|---|
| Support | View engaged time, earnings statements (read-only) |
| Moderator | Manage deactivation appeals, discrimination reports |
| Administrator | Process healthcare stipend verification, injury claims |
| Director | Configure local minimum wage overrides, stipend rates |
| Founder | Full compliance configuration, insurance policy management |

---

### Prop 22 MVP Requirements

Build these Prop 22 features for California launch.

**RUNR**

- Engaged time and miles tracking (per delivery)
- Real-time weekly earnings vs. net earnings floor
- Prop 22 top-up displayed on weekly payout
- Weekly Prop 22 Earnings Statement (PDF)
- Healthcare stipend eligibility tracker
- Healthcare enrollment document upload
- Rest period notifications and assignment blocking
- Pre-delivery pay transparency display
- Safety training module
- Prop 22 rights summary in app
- Insurance coverage details and beneficiary designation

**Platform**

- Engaged time engine
- Engaged miles engine (GPS)
- Local minimum wage database by pickup location
- Net earnings floor calculator (weekly)
- Automatic top-up payment via Stripe (weekly)
- Healthcare stipend quarterly calculator
- Healthcare enrollment verification workflow
- Occupational accident insurance integration
- Accidental death insurance integration
- Rest period enforcement (12hr/24hr rule)
- Background check integration
- Deactivation appeals workflow (5-business-day SLA)
- Safety training content and completion tracking
- Prop 22 Earnings Statement generator
- Compliance audit logging
- California geofence — Prop 22 rules apply only to CA deliveries

---

### Business Payouts

Businesses receive food order revenue minus applicable platform fees on a **weekly payout schedule**.

| Setting | Default |
|---|---|
| Payout frequency | Weekly |
| Pay period | Monday – Sunday |
| Payout day | Wednesday |

**Business dashboard should show**

- Gross order revenue
- Platform fees deducted
- Refunds and adjustments
- Net payout amount
- Payout schedule and history
- Pending vs. available balance

**Example business payout**

> **Weekly Payout #338**  
> Pay period: Aug 11–Aug 17, 2026  
> Payout date: Aug 20, 2026  
> Gross sales: $1,842.00  
> Platform fees: -$92.10  
> Refunds: -$24.50  
> **Net deposited: $1,725.40**

---

### Platform Fees

RUNR collects platform revenue through Stripe application fees.

**Fee types**

| Fee | Applied to | Example |
|---|---|---|
| Service fee | Customer order | $1.50 per order |
| Platform commission | Business food subtotal | 5% of food sales |
| Delivery fee share | Delivery fee | Configurable split between platform and RUNR |

Fees should be configurable by Director/Founder per market or business tier.

All fees must be visible to the customer at checkout before payment confirmation.

---

### Refunds and Adjustments

Refunds are processed through Stripe and reflected across all connected accounts.

**Refund scenarios**

| Scenario | Action |
|---|---|
| Order cancelled before preparation | Full refund to customer |
| Item unavailable | Partial or full refund |
| Delivery never completed | Full refund; RUNR may not receive delivery pay |
| Customer dispute | Refund or credit per policy |
| Incorrect charge | Administrator-initiated refund |

**Refund flow**

1. Support/Administrator initiates refund in RUNR admin
2. Platform creates Stripe refund against original Payment Intent
3. Funds reversed from business, RUNR, and platform shares proportionally
4. Customer receives refund to original payment method
5. Refund logged in order history and audit trail

**Partial refunds**

- Item-level refunds adjust business share only
- Delivery fee refunds may adjust RUNR share depending on delivery stage
- Tips may be refunded if delivery was not completed

---

### Disputes and Chargebacks

Stripe handles card network disputes. RUNR must surface dispute status internally.

**Dispute workflow**

1. Stripe webhook notifies platform of dispute opened
2. Order flagged in admin dashboard
3. Administrator gathers evidence (order details, delivery proof, timestamps)
4. Evidence submitted to Stripe within deadline
5. Outcome recorded — won, lost, or accepted

**Internal visibility**

- Support can view dispute status (read-only)
- Moderator can flag accounts with dispute patterns
- Administrator manages dispute evidence and responses
- Director approves large dispute losses or policy exceptions

---

### Stripe Webhooks

The platform must listen to Stripe webhooks for real-time payment state.

**Required webhook events (MVP)**

| Event | Action |
|---|---|
| `payment_intent.succeeded` | Confirm order, begin fulfillment |
| `payment_intent.payment_failed` | Show checkout error, do not create order |
| `charge.refunded` | Update order refund status |
| `charge.dispute.created` | Flag order, notify admin |
| `charge.dispute.closed` | Record dispute outcome |
| `account.updated` | Update business/RUNR onboarding status |
| `payout.paid` | Record payout in earnings history |
| `payout.failed` | Alert user, prompt to update bank details |
| `transfer.created` | Log fund transfer to connected account |

Webhooks must be verified using Stripe signing secrets. All webhook events should be logged for audit.

---

### Stripe Dashboard Access

| Role | Stripe Access |
|---|---|
| Customer | Receipts via email; payment history in app |
| Business | Stripe Express Dashboard (payouts, tax docs) |
| RUNR | Stripe Express Dashboard (earnings, payouts, tax docs) |
| Support | Read-only payment status in RUNR admin |
| Administrator | Refund initiation, dispute management in RUNR admin |
| Director | Fee configuration, payout exception approval |
| Founder | Full Stripe platform dashboard access |

RUNR admin tools should embed or link to Stripe Express Dashboard for businesses and RUNRs where appropriate.

---

### Security and Compliance

**PCI compliance**

- Use Stripe Payment Element — card data never touches RUNR servers
- Stripe handles PCI DSS compliance for card processing

**Identity and verification**

- Stripe Identity (optional) for enhanced RUNR verification
- Stripe Connect onboarding handles KYC for connected accounts

**Tax reporting**

- Stripe generates 1099 forms for eligible RUNRs and businesses (US)
- Tax information collected during Connect onboarding
- Platform provides annual earnings summaries in-app
- California RUNRs receive Prop 22 Earnings Statements (weekly and quarterly)

**California Prop 22 compliance**

- Engaged time and mileage tracking for all California deliveries
- Weekly net earnings floor calculation and automatic top-up
- Quarterly healthcare stipend tracking and payment
- Occupational accident and accidental death insurance
- Rest period enforcement (12-hour engaged time limit)
- Background checks, safety training, and deactivation appeals
- See [California Prop 22 Compliance](#california-prop-22-compliance) for full requirements

**Fraud prevention**

- Stripe Radar for fraud scoring on customer payments
- Velocity checks on refunds and new accounts
- Flag high-risk transactions for manual review

---

### Environment Configuration

| Environment | Purpose |
|---|---|
| Stripe Test Mode | Development and QA — test cards, no real money |
| Stripe Live Mode | Production — real payments and payouts |

**Required secrets (server-side only)**

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_CONNECT_CLIENT_ID` (if using OAuth onboarding)

**Publishable key (client-safe)**

- `STRIPE_PUBLISHABLE_KEY` — used by Payment Element in checkout

Never expose secret keys in client-side code, mobile apps, or public repositories.

---

### Payment-Integrated Order Flow

Updated order lifecycle with Stripe:

1. Customer builds cart
2. Customer enters tip and reviews total
3. Platform creates Stripe Payment Intent
4. Customer confirms payment
5. `payment_intent.succeeded` webhook received
6. Order created and sent to business
7. Business accepts and prepares order
8. Platform assigns RUNR and dispatches delivery
9. RUNR picks up and delivers order
10. Delivery marked complete
11. Platform records earnings split
12. Engaged time and miles logged (California — Prop 22)
13. Funds accrue to RUNR weekly payout balance
14. Weekly payout processed Wednesday (includes Prop 22 top-up if applicable)
15. Customer can add post-delivery tip (optional)
16. Customer rates order, business, and RUNR

---

### Stripe MVP Requirements

Build these payment features first.

**Customer**

- Stripe Payment Element at checkout
- Payment Intent creation and confirmation
- Order total breakdown (food, fees, tax, tip)
- Payment success and failure handling
- Email receipt via Stripe or platform
- Saved payment methods (Stripe Customer)

**RUNR**

- Stripe Connect Express onboarding
- Onboarding status in profile
- Per-delivery earnings breakdown
- Tips displayed separately
- Weekly payout history
- Weekly Prop 22 Earnings Statement (California)
- Engaged time and miles dashboard (California)
- Prop 22 top-up tracking (California)
- Healthcare stipend tracker (California)
- Link to Stripe Express Dashboard

**Business**

- Stripe Connect onboarding
- Payout status and history
- Gross sales and fee breakdown
- Refund visibility on orders

**Platform**

- Stripe Connect platform account setup
- Webhook endpoint and event handling
- Application fee configuration
- Transfer logic (business + RUNR splits)
- Weekly payout scheduler (Stripe)
- Prop 22 engaged time and miles engine
- Prop 22 net earnings floor calculator
- Prop 22 top-up payment processor
- Healthcare stipend quarterly system
- Rest period enforcement
- Refund processing
- Dispute notification and admin tools
- Test mode and live mode environment switching
- Audit logging for all payment and compliance actions

---

## Restaurant-Specific Delivery Routing

When a driver is actively assigned to a restaurant during their selected period, the platform prioritizes eligible delivery orders originating from that restaurant.

Example:

Driver is working:

> Tony's Pizza  
> 5 PM–9 PM

Orders from Tony's Pizza become available to that driver based on the platform's dispatch logic.

The driver does not need to repeatedly search for individual orders.

---

## Automatic Order Assignment

When a restaurant receives a delivery order:

1. Customer places order and pays via Stripe
2. Payment Intent succeeds — order is created
3. Restaurant accepts order
4. Restaurant prepares food
5. Platform identifies eligible drivers
6. Platform selects an available driver
7. Driver receives delivery
8. Driver accepts/fulfills delivery
9. Driver picks up order
10. Driver delivers order
11. Customer receives order
12. Platform records earnings split and initiates Stripe transfers
13. Engaged time and miles logged for Prop 22 (California)
14. Driver earnings and tips accrue to weekly payout balance

---

## Driver Coverage Dashboard

Drivers should have a dashboard showing their active restaurant commitments.

Example:

### My Work

#### Active

**Tony's Pizza**

5:30 PM–8:15 PM

Status: 🟢 Active

Deliveries Completed: **4**

Delivery Earnings: **$38.50**

Tips: **$21.00**

Total: **$59.50**

---

## Restaurant Coverage Dashboard

Restaurants should have a live staffing dashboard.

Example:

### Tony's Pizza

#### Current Coverage

Drivers Needed: **6**

Drivers Active: **5**

Drivers Needed: **1**

Status: 🟠 LOW COVERAGE

---

#### Upcoming

| Period | Coverage |
|---|---|
| 5 PM–6 PM | 5/6 |
| 6 PM–7 PM | 6/6 |
| 7 PM–8 PM | 4/4 |
| 8 PM–9 PM | 2/3 |

---

## Coverage Alerts

Restaurants can receive alerts when staffing falls below their desired level.

Examples:

> ⚠️ DRIVER SHORTAGE
>
> Tony's Pizza currently has 3 of 6 requested drivers.
>
> 3 additional drivers recommended.

---

Drivers can receive opportunities such as:

> 🔥 BUSY RESTAURANT
>
> Tony's Pizza needs 2 additional drivers.
>
> High delivery demand expected.
>
> Available: 5 PM–8 PM
>
> [Work Here]

---

## Restaurant Capacity Rules

Restaurants control their maximum desired driver capacity.

The system should prevent unnecessary overscheduling.

Example:

Restaurant maximum: **6 drivers**

Current scheduled: **6 drivers**

New driver attempts: **5 PM–7 PM**

System:

> This restaurant is currently fully covered during part or all of your selected period.

The driver can choose another available time or another restaurant.

---

## Real-Time Adjustments

Restaurants should be able to change their staffing requirements.

Example:

A restaurant becomes extremely busy.

Manager changes **Maximum Drivers** from **4** to **6**.

The platform immediately updates available coverage.

Drivers nearby may see:

> 🔥 NEW DRIVER OPENINGS
>
> Tony's Pizza
>
> 2 additional drivers needed
>
> 6 PM–8 PM

---

## Driver Cancellation

Drivers should be able to cancel a future restaurant commitment according to platform rules.

The system should track:

- Cancellation time
- Frequency
- Late cancellations
- No-shows
- Restaurant impact

Repeated last-minute cancellations may affect a driver's reliability rating or ability to reserve certain high-demand periods.

---

## Driver Check-In

When the driver's selected time begins, the driver can check in at the restaurant.

Example:

> Tony's Pizza
>
> Your work period begins at 5:30 PM.
>
> [CHECK IN]

The platform confirms the driver is at or near the restaurant.

---

## Driver Check-Out

When the selected period ends:

> Your Tony's Pizza assignment has ended.
>
> Deliveries completed: 6
>
> Total earnings: $87.50
>
> Tips: $31.00
>
> Total: $118.50
>
> [DONE]

The driver can then:

- Choose another restaurant
- Continue accepting open deliveries
- End their work session

---

## Core Advantage

Traditional delivery platforms primarily ask:

> "Which delivery do you want?"

This platform asks:

> "Where do you want to work?"

The driver chooses the restaurant.

The restaurant chooses how many drivers it needs.

The driver chooses their own time.

The platform dynamically matches available driver time with restaurant demand.

---

## Platform Philosophy

### Restaurants control

- Driver capacity
- Desired coverage
- Operating hours
- Staffing requirements
- Demand expectations

### Drivers control

- Restaurant selection
- Start time
- End time
- When they want to work
- Which restaurants they prefer

### Platform controls

- Availability
- Coverage calculations
- Order dispatch
- Delivery routing
- Earnings calculations
- Driver/restaurant matching
- Real-time demand indicators
- Notifications
- Payments
- Delivery tracking
- Stripe Connect marketplace payments

### Internal roles control

- Support tickets and customer/RUNR/business assistance
- Moderation, policy enforcement, and account safety
- Platform administration and operational overrides
- Regional strategy, approvals, and policy configuration
- Founder-level governance, role assignment, and system authority

---

## Platform Roles and Controls

RUNR operates with a clear internal role hierarchy. Each role inherits the permissions of roles below it unless explicitly restricted.

| Role | Primary Focus | Scope |
|---|---|---|
| Support | User assistance | Ticket-based, read-heavy |
| Moderator | Safety and policy | Account and content enforcement |
| Administrator | Platform operations | Day-to-day system management |
| Director | Regional and strategic ops | Approvals, policy, escalations |
| Founder | Platform governance | Full authority |

Higher roles can perform all actions available to lower roles within their assigned scope.

---

### Support

Support is the front-line operational role for helping customers, RUNRs, and businesses use the platform.

**Purpose**

- Resolve user issues quickly
- Answer questions about orders, deliveries, earnings, and account access
- Triage problems to the correct internal team

**Controls**

- View customer, RUNR, and business profiles (limited)
- View order and delivery details (read-only)
- View payment and earnings summaries (read-only, no payout changes)
- Create, assign, and resolve support tickets
- Add internal notes to accounts and orders
- Send platform notifications and templated messages
- Reset passwords and unlock accounts (with verification workflow)
- Escalate issues to Moderator or Administrator

**Restrictions**

- Cannot suspend or ban accounts
- Cannot modify menus, pricing, or business settings
- Cannot override dispatch or coverage
- Cannot issue refunds or adjust payouts without approval
- Cannot assign or change internal roles

---

### Moderator

Moderators enforce platform rules and protect marketplace integrity across customers, RUNRs, and businesses.

**Purpose**

- Maintain trust and safety on the platform
- Review reports, disputes, and policy violations
- Take corrective action on accounts and content

**Controls**

Everything Support can do, plus:

- Review and action user reports
- Suspend or restrict customer, RUNR, or business accounts (temporary)
- Remove or flag inappropriate content (reviews, messages, profile content)
- Manage dispute workflows between customers, RUNRs, and businesses
- Review cancellation patterns, no-shows, and reliability issues
- Apply warnings and account strikes
- Freeze suspicious accounts pending review
- Request documentation (ID, business license, insurance)
- Escalate fraud, safety, or legal issues to Administrator or Director

**Restrictions**

- Cannot permanently delete platform accounts without Administrator approval
- Cannot modify dispatch rules or coverage engine logic
- Cannot change platform-wide fees or payment architecture
- Cannot assign internal roles above Support
- Cannot access full financial reporting or payout configuration

---

### Administrator

Administrators manage day-to-day platform operations and have operational override authority across the marketplace.

**Purpose**

- Keep the platform running smoothly
- Manage businesses, RUNRs, and live operations
- Resolve escalated operational issues

**Controls**

Everything Moderator can do, plus:

- Approve, reject, or suspend business onboarding
- Approve or deactivate RUNR accounts
- Override dispatch assignments in exceptional cases
- Manually reassign deliveries
- Adjust coverage visibility and promotional driver openings
- Issue refunds, credits, and payout adjustments (within policy limits)
- Manage business menus, hours, and operational settings (when authorized)
- Configure notification templates and operational alerts
- View platform analytics and operational dashboards
- Manage Support and Moderator accounts within assigned teams
- Access audit logs for orders, deliveries, and account actions

**Restrictions**

- Cannot change core platform architecture or global policy without Director approval
- Cannot modify payment provider configuration or treasury settings
- Cannot assign Director or Founder roles
- Cannot delete historical financial or audit records

---

### Director

Directors oversee regional operations, strategic platform policy, and high-impact decisions that affect marketplace behavior.

**Purpose**

- Set operational standards across regions or business categories
- Approve high-risk or high-impact platform changes
- Resolve escalations that Administrators cannot safely close

**Controls**

Everything Administrator can do, plus:

- Define and update regional operating policies
- Approve major business partnerships and enterprise accounts
- Set platform-wide fee structures and incentive programs (within Founder policy)
- Approve large refunds, chargebacks, and payout exceptions
- Configure coverage and dispatch policies by market
- Manage Administrator teams and regional staffing
- Assign Support, Moderator, and Administrator roles
- Access advanced analytics, forecasting, and performance reporting
- Approve platform experiments and feature rollouts by region
- Halt operations in a region during safety or compliance events

**Restrictions**

- Cannot modify core system infrastructure or security architecture
- Cannot assign Founder role
- Cannot override Founder-level governance decisions

---

### Founder

The Founder role holds ultimate platform authority and is reserved for platform ownership and executive governance.

**Purpose**

- Define the long-term direction of RUNR
- Maintain final authority over platform rules, systems, and internal access
- Protect the integrity of the business model and brand

**Controls**

Full platform authority, including everything Director can do, plus:

- Assign and revoke all internal roles (Support through Director)
- Configure global platform settings and system behavior
- Manage payment architecture, treasury, and financial integrations
- Set immutable platform policies and terms of service enforcement rules
- Access all data, logs, and administrative tools
- Enable or disable major platform features globally
- Approve or reject core product and infrastructure changes
- Manage legal, compliance, and executive-level incident response
- Create and destroy internal organizations, regions, and operating units

**Governance rules**

- Founder actions should always be logged and auditable
- Sensitive actions (payout changes, role assignment, policy overrides) require confirmation
- Founder access should be limited to the smallest possible number of accounts

---

### Role Assignment Rules

| Action | Support | Moderator | Administrator | Director | Founder |
|---|---|---|---|---|---|
| Assign Support | — | — | ✓ | ✓ | ✓ |
| Assign Moderator | — | — | ✓ | ✓ | ✓ |
| Assign Administrator | — | — | — | ✓ | ✓ |
| Assign Director | — | — | — | — | ✓ |
| Assign Founder | — | — | — | — | ✓ |

- Role changes must be logged with actor, timestamp, and reason
- Higher roles can demote or revoke lower roles within their authority
- No role can elevate itself
- Temporary elevation (e.g., on-call Administrator) should expire automatically when possible

---

### Internal Operations Dashboard

Internal roles should have a unified operations console.

Example:

#### RUNR Operations

**Open Tickets:** 14  
**Active Disputes:** 3  
**Coverage Alerts:** 7  
**Suspended Accounts:** 2

| Queue | Owner | Priority |
|---|---|---|
| Missing delivery | Support | High |
| RUNR no-show | Moderator | High |
| Refund request | Administrator | Medium |
| Regional coverage gap | Director | Medium |

The dashboard should surface only the tools and data each role is authorized to see.

---

## The Big Idea

This is not simply another food delivery app.

It is a **restaurant-based delivery workforce marketplace**.

Instead of creating a marketplace where drivers constantly compete for individual orders, the platform allows drivers to strategically position themselves at restaurants where delivery demand exists.

Restaurants receive better delivery coverage.

Drivers get more predictable access to orders.

Customers receive their food through the same familiar ordering experience.

The platform becomes the system connecting all three.

---

## Real-Time Requirements

Coverage changes should update quickly.

Example:

| Event | Drivers Needed | Current | Status |
|---|---:|---:|---|
| Business needs | 6 | 4 | 🟠 |
| RUNR joins | 6 | 5 | 🟠 |
| Another RUNR joins | 6 | 6 | 🟢 |
| RUNR cancels | 6 | 5 | 🟠 |

Status automatically transitions between ORANGE and GREEN as coverage changes in real time.

---

## RUNR Experience Priority

The RUNR should never wonder:

| Question | Answer |
|---|---|
| "Where is the work?" | The map |
| "When can I work?" | The coverage timeline |
| "How much did I make?" | The Earnings screen |
| "When do I get paid?" | Weekly payout — every Wednesday |
| "Am I meeting Prop 22 minimum?" | Weekly earnings vs. net earnings floor (CA) |

---

## Business Experience Priority

The business should never wonder:

| Question | Answer |
|---|---|
| "Do I have enough drivers?" | Coverage dashboard |
| "Where are my deliveries?" | Live map |
| "Who is delivering this?" | Order detail |
| "What did I earn today?" | Sales and payout dashboard |
| "When is my payout?" | Weekly — every Wednesday |

---

## Customer Experience Priority

The customer should never wonder:

| Question | Answer |
|---|---|
| "Where is my order?" | Tracking map |
| "When will it arrive?" | ETA |
| "Who is delivering it?" | Assigned RUNR information |
| "What was I charged?" | Order receipt and payment breakdown |

---

## Product Differentiator

RUNR's defining feature is:

**BUSINESS COVERAGE + DRIVER FREEDOM**

| Role | Controls |
|---|---|
| Businesses | How many RUNRs they want |
| RUNRs | Where and when they want to work |
| RUNR (platform) | Matching, delivery dispatch, weekly payouts, Prop 22 compliance |
| Support → Founder | Escalating internal operations, safety, and governance |

This should be reflected throughout the application.

---

## MVP Priority

Build these first.

### Customer

- Authentication
- Location
- Map
- Business discovery
- Restaurant pages
- Menus
- Cart
- Checkout
- Stripe Payment Element
- Orders
- Order tracking
- Tips
- Ratings
- Payment receipts

### RUNR

- Authentication
- RUNR profile
- Location
- Map
- Business discovery
- Coverage indicators
- Business profiles
- Custom RUN scheduling
- RUN management
- Check-in
- Delivery assignment
- Navigation
- Pickup
- Delivery completion
- Earnings
- Tips
- History
- Stripe Connect onboarding
- Payout history
- Weekly Prop 22 Earnings Statement (California)
- Engaged time and miles tracking (California)
- Healthcare stipend enrollment (California)

### Business

- Authentication
- Business profile
- Location
- Map
- Orders
- Menu
- RUNR capacity
- Coverage schedule
- Live RUNR view
- Delivery management
- Analytics
- Stripe Connect onboarding
- Sales and payout dashboard

### Platform

- User management
- Business management
- RUNR management
- Dispatch
- Coverage engine
- Stripe Connect platform setup
- Payment Intents and checkout
- Application fees and transfers
- Weekly payout scheduler
- Prop 22 compliance engine (California)
- Refund and dispute handling
- Stripe webhooks
- Payout management
- Notifications
- Support ticketing
- Role-based access control (Support, Moderator, Administrator, Director, Founder)
- Internal operations dashboard
- Audit logging

---

## Development Priority

Build the application in this order:

### Phase 1

Design system  
↓  
Authentication  
↓  
Navigation  
↓  
Map infrastructure

### Phase 2

Customer discovery  
↓  
Business pages  
↓  
Menus  
↓  
Cart  
↓  
Orders

### Phase 3

RUNR map  
↓  
Business coverage  
↓  
RUN selection  
↓  
Custom RUN scheduling  
↓  
Coverage engine

### Phase 4

Dispatch  
↓  
Delivery workflow  
↓  
Navigation  
↓  
Pickup  
↓  
Dropoff

### Phase 5

Business dashboard  
↓  
Orders  
↓  
RUNRs  
↓  
Coverage  
↓  
Live operations

### Phase 6

Earnings  
↓  
Tips  
↓  
Stripe Connect onboarding  
↓  
Payment Intents and checkout  
↓  
Weekly payouts  
↓  
Prop 22 compliance engine (California)  
↓  
Engaged time and miles tracking  
↓  
Healthcare stipends  
↓  
Insurance integration  
↓  
Refunds and disputes  
↓  
Notifications  
↓  
Ratings

---

## Final UI Principle

The interface should always feel:

**MAP FIRST → ACTION SECOND → DETAILS THIRD**

Do not overwhelm users with dashboards when a map and simple bottom sheet can communicate the same information.

---

## Final Product Experience

RUNR opens.

The map appears.

The RUNR sees:

> 🔥 7 RUN OPPORTUNITIES NEAR YOU

They tap **Tony's Pizza**.

They see:

- 6 needed
- 4 covered
- 2 RUN GAP
- High demand

They tap **WORK HERE**.

They choose **5:37 PM–8:12 PM**.

The system confirms: **COVERAGE AVAILABLE**

They confirm.

Their RUN becomes active.

The platform sends eligible deliveries.

They deliver.

They earn:

- Delivery Pay
- Distance Pay
- Tips

Stripe processes their **weekly payout** every Wednesday.

The RUN ends.

Their earnings update — delivery pay, tips, and Prop 22 top-up if applicable.

The RUNR can choose another business.

---

## Final Brand Message

# RUNR

**PICK YOUR PLACE.**  
**RUN YOUR TIME.**  
**GET PAID TO DELIVER.**

RUNR should feel as polished and intuitive as the largest transportation and food-delivery platforms, while maintaining a completely unique delivery workforce model.

The application should be:

- Map-first
- Real-time
- Business-aware
- Driver-controlled
- Customer-friendly
- Operationally intelligent
- Fast
- Clean
- Professional
- Scalable

Build the product around the RUNR model rather than attempting to reproduce a traditional driver/order marketplace.
