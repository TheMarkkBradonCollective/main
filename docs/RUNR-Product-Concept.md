# Restaurant-Based Delivery Marketplace

## Table of Contents

1. [Overview](#overview)
2. [Core Concept](#core-concept)
3. [Driver Model](#driver-model)
4. [RUNR Sign-Up](#runnr-sign-up)
5. [Coverage System](#example) — staffing, discovery, dashboards
6. [Payments & Stripe](#stripe-connection-and-payments)
7. [California Prop 22](#california-prop-22-compliance)
8. [Delivery Routing & Dispatch](#restaurant-specific-delivery-routing)
9. [Complete Platform Specification](#complete-platform-specification) — customer, business, orders, delivery, safety, legal, tech
10. [Ratings & Reviews](#ratings--reviews) — DoorDash-style feedback system
11. [Customer Preferences](#customer-preferences) — dietary, delivery, and personalization
12. [Platform Roles](#platform-roles-and-controls)
13. [Experience Priorities](#runnr-experience-priority)
14. [MVP & Development Roadmap](#mvp-priority)
15. [Brand & UI Principles](#final-brand-message)

---

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

## RUNR Sign-Up

Every RUNR must complete sign-up and document verification before they can schedule a RUN or accept deliveries.

### Sign-Up Flow

1. Create account (email / phone + password or OAuth)
2. Basic profile (name, date of birth, photo)
3. **Driver's license** — upload and verify
4. **Vehicle insurance** — upload and verify
5. Vehicle information (make, model, year, color, license plate)
6. Background check authorization
7. Safety training completion
8. Stripe Connect payout setup
9. Account review and activation

RUNRs cannot browse coverage, schedule a RUN, or accept deliveries until steps 3 and 4 are approved.

---

### Driver's License Requirements

RUNRs must hold a **valid, unexpired driver's license** to deliver on the platform.

**Required information**

| Field | Required |
|---|---|
| Legal first and last name | ✓ |
| Date of birth | ✓ |
| License number | ✓ |
| Issuing state | ✓ |
| Expiration date | ✓ |
| License class | ✓ |
| Front of license (photo) | ✓ |
| Back of license (photo) | ✓ |

**Eligibility rules**

- License must be **currently valid** — not expired
- RUNR must be at least **18 years old**
- License must authorize operation of the vehicle type used for deliveries
- Name on license must match RUNR account name (or verified legal name change)
- Temporary permits and learner's permits are **not accepted**
- Suspended or revoked licenses result in immediate account suspension

**Accepted license types**

| License Type | Accepted |
|---|---|
| Standard Class C (California) | ✓ |
| Valid out-of-state U.S. license | ✓ |
| Commercial license (if applicable) | ✓ |
| Motorcycle-only license | ✗ (unless motorcycle delivery enabled) |
| Learner's permit / provisional only | ✗ |

**Upload requirements**

- Photo of **front** of license — clear, unobstructed, all corners visible
- Photo of **back** of license — clear, unobstructed, all corners visible
- No glare, blur, or cropped edges
- Document must be legible — all text readable
- Photos must be taken at time of upload (no screenshots of prior uploads unless re-verification)

**Verification process**

1. RUNR uploads front and back license photos
2. Platform runs automated document scan (OCR + fraud detection)
3. Platform validates expiration date, license number format, and issuing state
4. Name and date of birth matched against account profile
5. If automated check passes → approved
6. If automated check fails or flags concern → manual review by Administrator
7. RUNR notified of approval, rejection, or request to re-upload

**Verification statuses**

| Status | Meaning | Can deliver? |
|---|---|---|
| Not submitted | License not yet uploaded | ✗ |
| Pending review | Uploaded, awaiting verification | ✗ |
| Approved | License verified and valid | ✓ |
| Rejected | Failed verification — must re-upload | ✗ |
| Expired | License passed expiration date | ✗ |
| Suspended | License flagged or revoked | ✗ |

**Expiration handling**

- Platform tracks license expiration date
- RUNR notified **30 days**, **14 days**, and **7 days** before expiration
- Account automatically suspended on expiration date
- RUNR must upload renewed license to reactivate
- Deliveries blocked immediately when license expires

**Example — license upload screen**

> **Driver's License**
>
> Upload a clear photo of the front and back of your driver's license.
>
> [Upload Front]  
> [Upload Back]
>
> Requirements:
> - Valid and unexpired
> - All four corners visible
> - No glare or blur
> - Name must match your account

---

### Vehicle Insurance Requirements

RUNRs must maintain **active personal auto insurance** that meets platform and state minimum requirements.

**Required information**

| Field | Required |
|---|---|
| Insurance company name | ✓ |
| Policy number | ✓ |
| Policyholder name | ✓ |
| Effective date | ✓ |
| Expiration date | ✓ |
| Insurance declaration page (photo/PDF) | ✓ |

**Minimum coverage requirements (California)**

| Coverage Type | Minimum |
|---|---|
| Bodily injury liability | $15,000 per person / $30,000 per accident |
| Property damage liability | $5,000 per accident |
| Uninsured motorist (if required by state) | Per state minimum |

Platform may require **higher minimums** than state law. Director/Founder can configure coverage requirements by market.

**Eligibility rules**

- Policy must be **currently active** — not expired
- Policyholder name must match RUNR account name or list RUNR as a covered driver
- Policy must cover the vehicle used for deliveries
- Commercial-only policies accepted if they cover delivery activity
- Personal auto policies must **not exclude** commercial or delivery use (RUNR must confirm)
- Platform may require delivery/ride-share endorsement where applicable

**Upload requirements**

- Photo or PDF of **insurance declaration page** (proof of insurance)
- Document must show policyholder name, policy number, effective dates, and coverage amounts
- Must be current — not expired
- All text legible, no cropped edges

**Verification process**

1. RUNR uploads insurance declaration page
2. RUNR enters policy number, carrier, and expiration date
3. Platform validates policy number format and expiration date
4. Automated verification where carrier API available; otherwise manual review
5. Coverage amounts checked against platform minimums
6. If approved → RUNR insurance status set to Active
7. If rejected → RUNR notified with reason and re-upload instructions

**Verification statuses**

| Status | Meaning | Can deliver? |
|---|---|---|
| Not submitted | Insurance not yet uploaded | ✗ |
| Pending review | Uploaded, awaiting verification | ✗ |
| Approved | Insurance verified and active | ✓ |
| Rejected | Failed verification — must re-upload | ✗ |
| Expired | Policy passed expiration date | ✗ |
| Lapsed | Policy cancelled or non-renewed | ✗ |

**Expiration and renewal handling**

- Platform tracks insurance expiration date
- RUNR notified **30 days**, **14 days**, and **7 days** before expiration
- Account automatically suspended on expiration date
- RUNR must upload renewed declaration page to reactivate
- Deliveries blocked immediately when insurance expires
- Mid-term cancellation flagged via carrier notification (if integrated)

**Example — insurance upload screen**

> **Vehicle Insurance**
>
> Upload your current insurance declaration page.
>
> [Upload Document]
>
> Insurance company: ___________  
> Policy number: ___________  
> Expiration date: ___________
>
> Requirements:
> - Active and not expired
> - Covers the vehicle you use for deliveries
> - Meets California minimum coverage
> - Policyholder name matches your account

---

### Sign-Up Account States

A RUNR account progresses through states based on document verification.

| State | License | Insurance | Can Schedule RUN? | Can Deliver? |
|---|---|---|---|---|
| Incomplete | Not submitted | Not submitted | ✗ | ✗ |
| Docs pending | Pending | Pending | ✗ | ✗ |
| Partial | Approved | Not submitted | ✗ | ✗ |
| Partial | Not submitted | Approved | ✗ | ✗ |
| Docs approved | Approved | Approved | ✓ (after background check + training) | ✓ |
| Suspended | Expired / rejected | Any | ✗ | ✗ |
| Suspended | Any | Expired / lapsed | ✗ | ✗ |
| Active | Approved | Approved | ✓ | ✓ |

**Activation checklist**

Before a RUNR can go live, all of the following must be complete:

- [ ] Driver's license — approved
- [ ] Vehicle insurance — approved
- [ ] Vehicle information — submitted
- [ ] Background check — passed
- [ ] Safety training — completed
- [ ] Stripe Connect — active (required for payouts, not scheduling)

---

### Document Re-Verification

RUNRs must keep license and insurance current at all times.

**Triggers for re-verification**

| Trigger | Action |
|---|---|
| License approaching expiration | Notify RUNR, require re-upload before expiry |
| Insurance approaching expiration | Notify RUNR, require re-upload before expiry |
| Name change on account | Require new license upload |
| New vehicle added | Require updated insurance showing new vehicle |
| Random audit | Platform may request fresh document upload |
| Fraud flag | Immediate suspension pending re-verification |

**Admin re-verification controls**

| Role | Can review license/insurance? |
|---|---|
| Support | View status (read-only) |
| Moderator | Flag documents for review |
| Administrator | Approve, reject, request re-upload |
| Director | Override rejections, set coverage minimums |
| Founder | Full document management access |

---

### Sign-Up MVP Requirements

**RUNR app**

- Account creation (email/phone)
- Basic profile setup
- Driver's license upload (front + back)
- Insurance declaration page upload
- Policy number and expiration entry
- Vehicle information form
- Document verification status display
- Expiration reminders (push + email)
- Re-upload flow for rejected/expired documents

**Platform**

- License OCR and fraud detection
- Insurance document verification
- Expiration date tracking and auto-suspension
- Manual document review queue for Administrators
- Notification system for expiration warnings
- Audit log for all document submissions and approvals

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

RUNRs must maintain valid personal auto insurance meeting California minimum requirements. See [RUNR Sign-Up — Vehicle Insurance Requirements](#vehicle-insurance-requirements) for full upload and verification requirements.

**Platform must:**

- Verify auto insurance during sign-up and onboarding
- Require proof of insurance renewal before expiration
- Suspend RUNR immediately if insurance lapses or expires
- Track policy number, carrier, and expiration date
- Send expiration reminders at 30, 14, and 7 days

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

California RUNRs must pass a criminal background check before activation. RUNRs must also have an approved driver's license and active vehicle insurance on file. See [RUNR Sign-Up](#runnr-sign-up).

**Platform must:**

- Verify driver's license during sign-up (before background check)
- Conduct background check after license and insurance are approved
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

## Complete Platform Specification

The sections above define RUNR's unique delivery workforce model. This section documents **everything else** required to operate a full food delivery marketplace.

---

### Customer App

#### Account & Authentication

| Feature | Details |
|---|---|
| Sign-up | Email, phone, or OAuth (Apple, Google) |
| Phone verification | SMS OTP required for first order |
| Profile | Name, photo, email, phone |
| Saved addresses | Home, work, custom labels, delivery instructions per address |
| Saved payment methods | Cards via Stripe Customer |
| Order history | All past orders with reorder button |
| Favorites | Saved restaurants and menu items |
| Preferences | Dietary, delivery defaults, cuisine interests — see [Customer Preferences](#customer-preferences) |
| Notification preferences | Push, SMS, email toggles per event type |
| Account deletion | Self-service with data retention policy |
| 2FA | Optional two-factor authentication |

#### Discovery & Search

- Map-based restaurant discovery (primary)
- List view with distance, rating, ETA, delivery fee
- Search by restaurant name, cuisine, dish, or category
- Filters: cuisine type, rating, delivery fee, distance, open now, price range
- Sort: nearest, highest rated, fastest delivery, most popular
- Categories: Pizza, Mexican, Asian, Burgers, Healthy, Late Night, etc.
- Featured and promoted restaurants (platform-controlled)
- "Order again" shortcuts from order history
- Nearby RUNR coverage indicator (indirect signal of delivery reliability)

#### Restaurant Page (Customer-Facing)

- Hero image, name, cuisine tags, rating, review count
- Operating hours and open/closed status
- Estimated delivery time and delivery fee
- Minimum order amount
- Full menu with categories
- Item photos, descriptions, prices, calorie info (optional)
- Modifiers and customizations (size, toppings, extras, special instructions)
- Allergen warnings per item
- Out-of-stock items grayed out
- Popular items highlighted
- Reviews and ratings tab

#### Cart & Checkout

| Step | Details |
|---|---|
| Cart review | Items, quantities, modifiers, per-item notes |
| Delivery address | Select or add; gate code, apt/unit, instructions |
| Delivery type | Hand to me / Leave at door |
| Contactless | Optional no-contact delivery toggle |
| Utensils | Include utensils yes/no |
| Scheduled order | Order now or schedule for later (within business hours) |
| Tip | Preset ($2/$3/$5) or custom; option to tip after delivery |
| Promo code | Apply discount codes |
| Order summary | Subtotal, delivery fee, service fee, tax, tip, total |
| Payment | Stripe Payment Element |
| Confirmation | Order number, estimated prep and delivery time |

#### Order Tracking

**Order statuses (customer-visible)**

| Status | Customer Sees |
|---|---|
| Order placed | "Order received" |
| Confirmed | "Restaurant is preparing your order" |
| Preparing | "Your food is being prepared" |
| Ready for pickup | "Waiting for RUNR pickup" |
| RUNR assigned | RUNR name, photo, vehicle info |
| RUNR en route to restaurant | Map — RUNR heading to restaurant |
| Picked up | Map — RUNR heading to you |
| Arriving | "Your RUNR is nearby" |
| Delivered | "Enjoy your meal!" |
| Cancelled | Reason and refund status |

- Live map with RUNR location (when assigned)
- ETA updates in real time
- Contact RUNR (masked call/text in-app)
- Order details and receipt accessible throughout
- Push notifications at every status change
- Photo proof of delivery (when left at door)

#### Customer Cancellations

| Timing | Policy |
|---|---|
| Before restaurant confirms | Free cancellation, full refund |
| After confirm, before prep starts | Full refund (configurable) |
| After prep starts | Partial or no refund; business discretion |
| After RUNR pickup | No cancellation; contact support |

---

### Business Onboarding & Management

#### Business Sign-Up

1. Create business account
2. Business information (legal name, DBA, EIN/tax ID)
3. Business address and location pin on map
4. Business license upload and verification
5. Food handler permit / health department certificate
6. Owner identity verification
7. Bank account / Stripe Connect setup
8. Menu setup (manual or import)
9. Delivery zone and radius configuration
10. Operating hours setup
11. RUNR capacity schedule setup
12. Platform review and approval
13. Go live

**Business cannot receive orders until approved by Administrator.**

#### Business Staff Roles

| Role | Permissions |
|---|---|
| Owner | Full access — menu, orders, staff, payouts, settings |
| Manager | Orders, menu edits, RUNR capacity, analytics; no payout/bank changes |
| Staff | View and manage incoming orders only; mark ready for pickup |
| Accountant | View payouts and sales reports (read-only) |

- Owner can invite staff by email
- Role assigned per location (multi-location support)
- Staff activity logged in audit trail

#### Business Profile & Settings

- Business name, description, logo, cover photo
- Cuisine categories and tags
- Phone number (customer-visible)
- Operating hours (per day; holiday overrides)
- Delivery radius (miles from location)
- Minimum order amount
- Average prep time (manual or auto-calculated)
- Auto-pause orders when kitchen overwhelmed
- Accept/prepare time targets
- Delivery fee (platform-set or business contribution — configurable)
- Special instructions field for all orders
- Printer/tablet mode for order tickets

#### Menu Management

**Menu structure**

```
Menu
├── Category (e.g., Appetizers)
│   ├── Item (e.g., Garlic Bread)
│   │   ├── Base price
│   │   ├── Description, photo, calories
│   │   ├── Allergens
│   │   ├── Modifier groups
│   │   │   ├── Size (required, pick 1): Small / Medium / Large
│   │   │   ├── Toppings (optional, pick up to 5): Pepperoni, Mushroom...
│   │   │   └── Extras (optional): Extra cheese +$1.50
│   │   └── Availability schedule (e.g., breakfast only)
│   └── Item...
└── Category...
```

**Menu controls**

- Add, edit, archive items and categories
- Drag-and-drop category and item ordering
- Item photos (required for featured items)
- Mark items out of stock (86'd) — real-time sync to customer app
- Scheduled availability (lunch menu, dinner menu)
- Price changes with effective date
- Modifier pricing (per-option upcharges)
- Menu versioning — changes go live immediately or scheduled
- Bulk import via CSV
- Clone menu across locations (multi-location)

#### Business Order Management

**Business-facing order statuses**

| Status | Business Action |
|---|---|
| New | Accept or reject (timer — auto-reject if no response in X min) |
| Accepted | Begin preparation |
| Preparing | In kitchen |
| Ready | Mark ready for RUNR pickup |
| Picked up | RUNR confirmed pickup |
| Completed | Delivered |
| Cancelled | With reason |

- Order ticket printing (Bluetooth / network printer)
- Tablet-optimized order queue view
- Sound/push alert on new order
- Prep time adjustment per order
- Item-level "unavailable" from active order
- Internal notes on orders
- Daily order volume and revenue summary

#### Business Analytics

| Metric | Available to |
|---|---|
| Orders today / week / month | Manager+ |
| Revenue (gross and net) | Owner, Accountant |
| Average order value | Manager+ |
| Peak hours | Manager+ |
| Most popular items | Manager+ |
| Average prep time | Manager+ |
| RUNR coverage vs. demand | Manager+ |
| Customer ratings trend | Manager+ |
| Cancellation rate | Manager+ |
| Payout history | Owner, Accountant |

---

### Orders & Fulfillment

#### Full Order Lifecycle (System)

```
PLACED → CONFIRMED → PREPARING → READY → ASSIGNED → PICKED_UP → EN_ROUTE → ARRIVED → DELIVERED
                                                                              ↘ CANCELLED (any stage with rules)
```

| Stage | Triggered By | System Action |
|---|---|---|
| PLACED | Customer payment succeeds | Notify business; start accept timer |
| CONFIRMED | Business accepts | Notify customer; begin prep tracking |
| PREPARING | Business starts prep | Update customer ETA |
| READY | Business marks ready | Notify eligible RUNRs; begin dispatch |
| ASSIGNED | Dispatch selects RUNR | Notify RUNR and customer; show on maps |
| PICKED_UP | RUNR confirms at restaurant | Start engaged time (Prop 22); navigate to customer |
| EN_ROUTE | RUNR leaves restaurant | Live tracking for customer |
| ARRIVED | RUNR within geofence of customer | Notify customer |
| DELIVERED | RUNR confirms drop-off | Complete payment split; prompt ratings |
| CANCELLED | Customer, business, or system | Process refund per policy |

#### Dispatch Algorithm

When an order is READY, the platform selects a RUNR:

**Eligibility criteria (all must pass)**

1. RUNR is actively checked in at the originating restaurant
2. RUNR's RUN period covers current time
3. RUNR is not in Prop 22 rest period
4. RUNR has no active delivery in progress (or batching enabled)
5. RUNR reliability score above minimum threshold
6. RUNR vehicle type compatible with order

**Selection priority**

1. RUNRs at the restaurant with fewest active/completed deliveries this RUN
2. Shortest idle time since last delivery
3. Highest reliability score (tiebreaker)
4. Closest to ready time (minimize food wait)

**Dispatch rules**

- Auto-assign with 30-second accept window (configurable)
- If RUNR declines or times out → offer to next eligible RUNR
- If no RUNR available → alert business; extend ready time; notify customer of delay
- Manual override available to Administrator

#### Pickup Verification

- RUNR must be within restaurant geofence to mark "Arrived at restaurant"
- Order confirmation PIN shown to RUNR (last 4 of order # or unique PIN)
- Business marks order handed off → RUNR confirms pickup
- Photo of order/bag optional at pickup
- Engaged time starts at pickup confirmation

#### Delivery Completion

- RUNR must be within customer delivery geofence to complete
- Delivery type determines completion flow:

| Type | Completion |
|---|---|
| Hand to customer | RUNR taps "Delivered" after handoff |
| Leave at door | RUNR takes photo → taps "Delivered" |
| Contactless | Photo required; no contact confirmation |

- Customer receives delivery notification with photo (if applicable)
- RUNR prompted to rate experience (optional, non-blocking)

---

### Delivery Zones & Fees

#### Service Areas

- Each business defines a delivery radius (default: 5 miles)
- Platform can enforce maximum radius per market
- Customer address validated against business delivery zone at checkout
- Out-of-zone addresses blocked with clear message
- Map overlay shows delivery zone on business page

#### Delivery Fee Calculation

| Component | How Calculated |
|---|---|
| Base delivery fee | Flat fee per market (e.g., $2.99) |
| Distance fee | Per-mile beyond base distance |
| Small order fee | If subtotal below minimum |
| Busy area fee | Optional surge during high demand |
| RUNR share | Configurable % of delivery fee |
| Platform share | Remainder of delivery fee |

**Example**

> Distance: 3.2 miles  
> Base fee: $2.99  
> Distance fee (3.2 mi × $0.50): $1.60  
> **Total delivery fee: $4.59**

#### ETA Calculation

| Factor | Weight |
|---|---|
| Business average prep time | 40% |
| Current kitchen queue | 20% |
| RUNR availability at restaurant | 20% |
| Distance to customer | 15% |
| Traffic (real-time) | 5% |

- ETA shown at checkout (range, e.g., 25–35 min)
- ETA updates at each order status change
- Customer notified if ETA changes by more than 10 minutes

---

### Navigation & Maps

#### Map Infrastructure

- Primary map provider: Google Maps (or Mapbox — configurable)
- Real-time location tracking for RUNRs (when on active delivery or checked in)
- Customer sees RUNR on map during EN_ROUTE and ARRIVED
- Business sees all active RUNRs on live map
- RUNR sees restaurant, customer, and route

#### RUNR Navigation

- Turn-by-turn navigation (in-app or deep link to Google/Apple Maps)
- Route optimized for driving
- Multiple stops if batching enabled (future)
- Arrival geofence triggers (restaurant and customer)
- Offline map fallback for poor connectivity areas

#### Map-First UI (All Apps)

| App | Map Shows |
|---|---|
| Customer | Nearby restaurants, active order RUNR location |
| RUNR | Nearby businesses with coverage gaps, active delivery route |
| Business | Active RUNRs, delivery destinations for current orders |

---

### Notifications

#### Push Notifications

| Event | Customer | RUNR | Business |
|---|---|---|---|
| Order confirmed | ✓ | | ✓ |
| Order ready | | ✓ | |
| RUNR assigned | ✓ | ✓ | |
| RUNR arriving | ✓ | | |
| Delivered | ✓ | ✓ | ✓ |
| New order | | | ✓ |
| RUN gap alert | | ✓ | |
| Coverage low | | | ✓ |
| Payout processed | | ✓ | ✓ |
| Document expiring | | ✓ | |
| Promo / marketing | ✓ (opt-in) | ✓ (opt-in) | ✓ (opt-in) |

#### SMS Notifications

- Order status updates (opt-in)
- Delivery arriving alerts
- Account verification OTP
- Critical security alerts (all users)

#### Email Notifications

- Order receipts
- Weekly payout statements
- Account changes (password, email)
- Prop 22 earnings statements (California RUNRs)
- Marketing (opt-in)

#### In-App Notifications

- Notification center with read/unread state
- Deep links to relevant screen (order, payout, coverage)
- Badge counts on tab bar icons

---

### Ratings & Reviews

RUNR uses a **DoorDash-style ratings system** — separate feedback flows for the business, the RUNR, and individual menu items, with quick tags, optional written reviews, and public or private visibility options.

---

#### Post-Delivery Rating Flow

After every delivery, the customer is prompted to rate **two things separately**:

1. **The business** (food and order experience)
2. **The RUNR** (delivery experience)

These are always separate screens. A customer cannot skip the business rating to only rate the RUNR, but both can be submitted quickly.

**Prompt timing**

- Rating prompt appears when order status = DELIVERED
- Push notification: "How was your order from Tony's Pizza?"
- In-app banner on next open if not yet rated
- 72-hour window to submit or edit ratings
- One verified review per order (cannot rate same order twice)

---

#### Business Rating (Store Feedback)

**Step 1 — Overall rating (required)**

DoorDash-style three-option system:

| Rating | Meaning | Maps to |
|---|---|---|
| 😍 **Loved it** | Excellent experience | 5 stars |
| 👍 **Liked it** | Good experience | 4 stars |
| 👎 **Didn't like it** | Poor experience | 2 stars |

**Step 2 — Experience tags (optional, multi-select)**

Tags shown based on rating selected:

**Positive tags (Loved / Liked)**

| Tag | Category |
|---|---|
| Good flavor | Food quality |
| Accurate order | Order accuracy |
| Hot & fresh | Food temperature |
| Good portion size | Value |
| Well packaged | Packaging |
| Fast preparation | Speed |
| Great value | Price |

**Negative tags (Didn't like)**

| Tag | Category |
|---|---|
| Missing items | Order accuracy |
| Wrong order | Order accuracy |
| Cold food | Food temperature |
| Poor packaging | Packaging |
| Small portions | Value |
| Too slow | Speed |
| Overpriced | Price |
| Not as described | Accuracy |

**Step 3 — Item ratings (optional)**

Rate individual menu items from the order:

| Rating | Display |
|---|---|
| 👍 Thumbs up | Item liked |
| 👎 Thumbs down | Item disliked |

- Item ratings submitted alongside store rating
- Items with consistently high thumbs-up ratings earn **Most Liked** badge on menu
- Up to 3 **Most Liked** items displayed on business page at a time
- Ranked by % positive ratings from verified RUNR orders

**Step 4 — Written review (optional)**

| Visibility | Who sees it |
|---|---|
| **Everyone** | Public on business page and customer profile (if profile public) |
| **Store feedback only** | Business and RUNR platform only — not shown publicly |

- Written review optional regardless of rating selected
- Photo upload optional (food photo attached to review)
- Photos may be lightly enhanced for clarity (lighting, blur correction)
- All content moderated before display
- Verified reviews show **"Ordered on RUNR"** badge

**Example — business rating screen**

> **How was Tony's Pizza?**
>
> 😍 Loved it &nbsp; 👍 Liked it &nbsp; 👎 Didn't like it
>
> What stood out?  
> [Good flavor] [Accurate order] [Hot & fresh] [Great value]
>
> Rate your items:  
> 🍕 Pepperoni Pizza — 👍 👎  
> 🥗 Caesar Salad — 👍 👎
>
> Add a review (optional)  
> [Everyone ▾] [Write a review...]  
> [Add photo]
>
> [Submit]

---

#### RUNR Rating (Delivery Feedback)

Separate, simpler flow — no written review option for RUNR ratings.

**Rating options**

| Rating | Meaning |
|---|---|
| 👍 **Thumbs up** | Great delivery |
| 👎 **Thumbs down** | Poor delivery |

**Optional delivery tags (multi-select)**

| Positive | Negative |
|---|---|
| Friendly | Unprofessional |
| On time | Late delivery |
| Followed instructions | Ignored instructions |
| Careful with order | Damaged order |
| Good communication | Hard to reach |

- RUNR rating is **private** — not shown publicly on RUNR profile
- RUNR sees their aggregate rating score in their app (e.g., 4.87)
- Customer cannot see RUNR's rating history from other customers
- RUNR name and photo shown to customer during delivery; rating affects dispatch priority internally

**Example — RUNR rating screen**

> **How was your delivery?**
>
> Your RUNR: **Marcus T.** 🚗
>
> 👍 Great &nbsp; 👎 Poor
>
> [On time] [Friendly] [Followed instructions] [Careful with order]
>
> [Submit]

---

#### Business Page — Ratings Display

**Lifetime rating**

- Displayed as **1–5 star average** on business page (e.g., ⭐ 4.7)
- Calculated from all verified Loved/Liked/Didn't Like ratings
- Review count shown (e.g., "500+ ratings")
- Tapping rating opens full reviews section

**Reviews section on business page**

- Recent public reviews ("Everyone" visibility)
- Star rating, tags, written review, photo (if submitted)
- "Ordered on RUNR" verified badge
- Date of order
- Items ordered (visible on public reviews)
- Business owner response (if responded within 7 days)
- Sort: Most recent, Highest rated, Lowest rated

**Rating breakdown**

| Metric | Displayed |
|---|---|
| Lifetime average | ⭐ 4.7 |
| Last 30 days average | ⭐ 4.8 |
| Loved it % | 72% |
| Liked it % | 21% |
| Didn't like it % | 7% |
| Most common positive tag | "Good flavor" |
| Most common negative tag | "Cold food" |

**Most Liked items**

- Up to 3 menu items with **Most Liked** badge on business page
- Badge: "Most Liked · 94% liked this"
- Eligibility: minimum order threshold of ratings, majority thumbs up
- Displayed in menu with badge on item card

---

#### Most Loved Program (Business Recognition)

Top-performing businesses earn **Most Loved** status — displayed as a badge on discovery and business page.

**Eligibility requirements**

| Requirement | Threshold |
|---|---|
| Lifetime rating | 4.5+ stars |
| Lifetime orders | 25+ orders |
| Monthly cancellation rate | Below platform threshold |
| Menu photos | Logo and header uploaded |
| Price parity | Menu prices match in-store pricing |

**Most Loved badge display**

> ⭐ **Most Loved** — Top-rated on RUNR

- Featured placement in discovery carousels
- Higher search ranking priority
- Eligible for "Top Rated" filter
- Badge visible on map pins and list view

---

#### Business Review Management

**Business dashboard — Ratings & Reviews tab**

- All ratings and tags (public and store-feedback-only)
- Item-level thumbs up/down aggregate (not individual votes)
- Rating trends over time (daily, weekly, monthly)
- Tag frequency breakdown
- Operations quality score
- Response queue for public reviews

**Business can:**

- Read all store feedback (public and private)
- Respond to public reviews within **7 days** of receipt
- View tag trends to identify improvement areas
- See Most Loved eligibility status and gaps
- Export ratings report (CSV)

**Example — business response**

> ⭐ Loved it · Good flavor · Accurate order  
> *"Best pizza in town, always hot!"* — Sarah M. · Aug 15  
>
> **Tony's Pizza responded:**  
> *"Thank you Sarah! We're glad you enjoyed it. See you next time!"*

---

#### RUNR Rating Management

**RUNR app — My Ratings**

- Aggregate delivery rating (e.g., 4.91 / 5.00)
- Rating trend over last 30 / 90 days
- Most common positive tags received
- Most common negative tags received
- Rating does not display individual customer reviews (no text reviews for RUNR)
- Rating below 4.2 triggers coaching notification
- Rating below 4.0 flagged for Moderator review
- Rating below 3.5 may restrict high-demand RUN reservations

**Private ratings (RUNR rates others)**

| RUNR rates | Visibility |
|---|---|
| Business (pickup experience) | Private — platform only |
| Customer (delivery experience) | Private — platform only |

---

#### Rating Rules & Policies

| Rule | Policy |
|---|---|
| One review per order | Only one verified review per completed order |
| Edit window | 72 hours after delivery to edit or add review |
| Moderation | All public reviews and photos moderated before display |
| Prohibited content | Profanity, threats, personal info, off-topic content |
| Fake reviews | Orders must be verified RUNR orders; fraud flagged |
| Business response window | 7 days to respond to public reviews |
| Rating removal | Moderator can remove reviews violating guidelines |
| Disputed reviews | Customer or business can flag review for Moderator review |

---

#### Reliability Score (RUNR)

Calculated from:

| Factor | Impact |
|---|---|
| Completion rate | High |
| On-time delivery rate | High |
| Cancellation rate | Negative |
| No-show rate | High negative |
| Customer RUNR rating (thumbs up/down) | Medium |
| Late RUN cancellations | Medium negative |
| Check-in punctuality | Low |

- Score: 0–100
- Minimum score to accept deliveries: 70 (configurable)
- Score visible to RUNR in profile
- Score affects dispatch priority

---

#### Ratings MVP Requirements

**Customer**

- Post-delivery business rating (Loved / Liked / Didn't Like)
- Experience tag selection
- Item-level thumbs up/down
- Optional written review with visibility toggle (Everyone / Store feedback)
- Photo upload on review
- Separate RUNR rating (thumbs up/down + tags)
- View public reviews on business page
- Edit rating within 72 hours

**Business**

- Ratings & Reviews dashboard
- Tag trend analytics
- Respond to public reviews
- Most Loved eligibility tracker
- Most Liked items visibility

**RUNR**

- Aggregate rating display in profile
- Rating trend and tag summary
- Coaching alerts for low ratings

**Platform**

- Rating aggregation engine (lifetime + rolling averages)
- Most Loved program eligibility checker
- Most Liked items calculator
- Review moderation queue
- Verified order badge system
- Tag analytics and reporting

---

### Customer Preferences

RUNR provides **DoorDash-style customer preferences** — saved settings that personalize discovery, filter menus, and set delivery defaults so every order starts with the right choices already applied.

---

#### Preference Onboarding

During first sign-up (or first order), customers are prompted to set preferences:

> **Let's personalize your experience**
>
> What do you like to eat?  
> [🍕 Pizza] [🌮 Mexican] [🍣 Asian] [🍔 Burgers] [🥗 Healthy] [☕ Coffee] [+ More]
>
> Any dietary needs?  
> [Vegetarian] [Vegan] [Gluten-free] [Dairy-free] [Nut-free] [Halal] [Kosher]
>
> [Save preferences] [Skip for now]

- Preferences can be updated anytime in **Account → Preferences**
- Skipping onboarding shows preferences prompt again after 3 orders

---

#### Cuisine Preferences

Customers select cuisines they enjoy. These power the **"For You"** personalized feed.

| Cuisine | Examples |
|---|---|
| Pizza | Italian, flatbread |
| Mexican | Tacos, burritos |
| Asian | Chinese, Japanese, Thai, Korean, Vietnamese |
| Burgers & Sandwiches | American, fast food |
| Healthy | Salads, bowls, organic |
| Seafood | Fish, sushi |
| Indian | Curry, tandoori |
| Mediterranean | Greek, Middle Eastern |
| Desserts & Bakery | Cakes, pastries |
| Coffee & Breakfast | Cafes, brunch |
| Late Night | Open after 10 PM |
| Comfort Food | Soul food, homestyle |

- Multi-select — choose as many as apply
- "For You" tab on home screen shows restaurants matching cuisine preferences
- Order history also influences recommendations (collaborative filtering)
- Preferences used to rank search results

---

#### Dietary Preferences & Restrictions

**Dietary lifestyle (multi-select)**

| Preference | Effect |
|---|---|
| Vegetarian | Highlights vegetarian items; filters available |
| Vegan | Highlights vegan items; filters available |
| Pescatarian | Highlights seafood and vegetarian |
| Gluten-free | Highlights GF items; shows GF filter |
| Dairy-free | Highlights dairy-free items |
| Nut-free | Highlights nut-free items; allergy alert |
| Halal | Highlights halal-certified businesses |
| Kosher | Highlights kosher-certified businesses |
| Low-carb / Keto | Highlights low-carb items |

**Allergen alerts**

- Customer enters specific allergens (e.g., peanuts, shellfish, eggs, soy, wheat)
- Allergen set in profile applies as a **persistent warning** on menu items
- Items containing flagged allergens show ⚠️ alert on menu card and item detail
- Alert shown again at checkout: "Your order contains [allergen] — please confirm"
- Allergen data sourced from business menu labels (business-confirmed)

**Food labels on menu items (business-set, customer-filtered)**

| Label | Filterable |
|---|---|
| Vegetarian | ✓ |
| Vegan | ✓ |
| Gluten-free | ✓ |
| Dairy-free | ✓ |
| Spicy 🌶️ | ✓ |
| Contains nuts | ✓ |
| Halal | ✓ |
| Organic | ✓ |
| Low calorie | ✓ |

- Sensitive labels (gluten-free, vegan, allergen-free) require business confirmation before display
- Customers can filter menu by any label
- Labels appear as badges on item cards in menu and search results

---

#### Delivery Preferences (Defaults)

Saved defaults applied automatically at checkout. Customer can override per order.

| Preference | Options | Default |
|---|---|---|
| Delivery type | Hand to me / Leave at door | Hand to me |
| Contactless delivery | On / Off | Off |
| Include utensils | Yes / No | No |
| Default tip | $0 / $2 / $3 / $5 / 15% / 20% / Custom | $3 |
| Delivery instructions | Free text (per saved address) | — |
| Ring doorbell | Yes / No / Only if needed | Only if needed |
| Call on arrival | Yes / No | No |

**Per-address instructions**

Each saved address can have unique instructions:

> **Home**  
> 123 Oak Street, Apt 4B  
> Gate code: #4521 · Leave at door · Don't ring doorbell

- Instructions auto-applied when address selected at checkout
- RUNR sees delivery instructions on assignment screen
- Instructions editable per order without changing saved default

---

#### Discovery & Filter Preferences

**Default sort preference**

| Option | Behavior |
|---|---|
| Recommended | Personalized based on preferences + history |
| Nearest | Closest to delivery address |
| Highest rated | Best lifetime rating first |
| Fastest delivery | Shortest ETA first |
| Lowest delivery fee | Cheapest delivery first |

**Default filters (always applied unless cleared)**

- Cuisine preferences (from profile)
- Dietary filters (from profile)
- Open now
- Minimum rating (e.g., 4.0+ only)
- Price range ($ to $$$$)
- Delivery fee max
- Distance max

**"For You" personalized feed**

Built from:

| Signal | Weight |
|---|---|
| Cuisine preferences | High |
| Order history (reorder patterns) | High |
| Dietary preferences | High |
| Favorited restaurants | Medium |
| Highly rated businesses (customer's own ratings) | Medium |
| Nearby RUNR coverage (delivery reliability) | Low |
| Trending in area | Low |

- "For You" is the default home tab
- Refreshes based on time of day (breakfast spots in morning, dinner in evening)
- Shows "Because you ordered [item]" recommendations
- Shows "New for you" for unexplored cuisines matching preferences

---

#### Favorite Restaurants & Items

**Favorite restaurants**

- Tap ♥ on any business page to save
- Saved restaurants appear in **Favorites** tab
- Favorites sorted by most recently ordered
- Notification when a favorited restaurant has a promotion or new menu items
- Quick reorder from favorites list

**Favorite menu items**

- Tap ♥ on any menu item to save
- Saved items appear in **Favorites → Items**
- "Order again" button on each saved item
- Item availability checked in real time (grayed out if 86'd)
- Cross-restaurant item favorites supported

---

#### Notification Preferences

Granular control per notification type:

| Notification | Push | SMS | Email |
|---|---|---|---|
| Order status updates | ✓ default on | ✓ default on | ✓ default on |
| RUNR arriving | ✓ | ✓ | — |
| Delivery complete | ✓ | — | ✓ (receipt) |
| Promotions & deals | opt-in | — | opt-in |
| New restaurants nearby | opt-in | — | opt-in |
| Favorited restaurant updates | opt-in | — | opt-in |
| Reorder reminders | opt-in | — | opt-in |
| Account & security | ✓ | ✓ | ✓ |
| Weekly order summary | — | — | opt-in |

- Marketing notifications off by default (opt-in required)
- Order-critical notifications cannot be fully disabled (push required for active orders)
- Quiet hours setting: no promotional push between 10 PM – 8 AM

---

#### Privacy Preferences

| Setting | Options |
|---|---|
| Profile visibility | Public / Private |
| Show my reviews publicly | On / Off |
| Show order history on profile | On / Off |
| Personalized ads & recommendations | On / Off |
| Share order data for recommendations | On / Off |
| Location tracking | While using app / Always / Never |

- Public profile shows customer's first name and public reviews only
- Private profile: reviews still count toward business ratings but not shown on profile

---

#### Preferences Screen (Account → Preferences)

**Example layout**

> **Preferences**
>
> **Cuisines I like**  
> 🍕 Pizza · 🌮 Mexican · 🍣 Asian · [Edit]
>
> **Dietary needs**  
> Vegetarian · Gluten-free · [Edit]
>
> **Allergens**  
> ⚠️ Peanuts · Shellfish · [Edit]
>
> **Delivery defaults**  
> Leave at door · No utensils · $3 tip · [Edit]
>
> **Sort & filters**  
> Recommended · Open now · 4.0+ rating · [Edit]
>
> **Notifications**  
> [Manage]
>
> **Privacy**  
> [Manage]

---

#### Preferences MVP Requirements

**Customer**

- Preference onboarding flow (cuisine + dietary)
- Cuisine multi-select with "For You" feed
- Dietary preferences and allergen alerts
- Menu item food label filters
- Delivery defaults (type, utensils, tip, instructions)
- Per-address delivery instructions
- Favorite restaurants and items
- Notification preference toggles
- Privacy settings
- Preferences screen in account settings

**Platform**

- Preference storage and sync across devices
- "For You" recommendation engine
- Allergen warning system on menu and checkout
- Food label filter engine
- Default application at checkout
- Preference-based search ranking

---

### Promotions & Pricing

#### Promo Codes

| Type | Example |
|---|---|
| Percentage off | 20% off first order |
| Fixed amount off | $5 off orders over $25 |
| Free delivery | Waive delivery fee |
| BOGO | Buy one get one (business-funded) |
| RUNR incentive | Bonus per delivery during gap periods |

- Platform-funded or business-funded (configured per code)
- Usage limits: per user, total redemptions, date range
- Minimum order amount requirement
- Single-use or multi-use codes
- Referral codes tied to user accounts

#### Referral Program

- Customer refers customer: both get credit after first order
- RUNR refers RUNR: bonus after referred RUNR completes X deliveries
- Business refers business: platform credit
- Unique referral link and code per user
- Referral tracking dashboard

#### RUNR Incentives

- **Gap bonuses**: Extra pay per delivery when restaurant has coverage gap
- **Quest bonuses**: "Complete 10 deliveries this RUN for $20 bonus"
- **Peak bonuses**: Higher pay during high-demand periods
- **New RUNR bonus**: First-week incentive for new RUNRs
- Incentives shown on map and business profile
- Paid in weekly payout as separate line item

---

### Communication

#### In-App Messaging

- Customer ↔ RUNR: masked in-app chat (no personal phone numbers exposed)
- Available from RUNR assignment until delivery complete
- Pre-set quick messages: "I'm here", "Running 5 min late", "Where's the gate code?"
- Messages logged for support and safety review
- Chat disabled after delivery completed

#### Masked Calling

- Tap-to-call between customer and RUNR via proxy number
- Numbers never exposed to either party
- Calls logged (metadata only, not recorded)
- Available during active delivery only

---

### Safety & Trust

#### RUNR Safety

- **SOS button**: Emergency alert with live location sent to platform safety team
- **Share trip**: RUNR can share live delivery location with personal contact
- **Incident reporting**: Report safety issue, harassment, accident, or theft
- **Community guidelines**: Clear conduct standards for all users
- **Account verification**: Phone, email, license, insurance, background check

#### Customer Safety

- Verified RUNR profiles (name, photo, vehicle, rating)
- Live tracking during delivery
- Report a problem on any order
- Block RUNR from future deliveries to their address

#### Business Safety

- Verified business licenses on file
- Health permit tracking and expiration alerts
- Report problematic RUNRs or customers
- Fraud detection on high-value or suspicious orders

#### Content Moderation

- Review text screened for profanity, threats, and personal info
- Photo uploads (menu, delivery proof) screened for inappropriate content
- Moderator queue for flagged content
- Three-strike policy for policy violations

---

### Vehicle Types

| Type | Requirements | Use Case |
|---|---|---|
| Car | Valid license + auto insurance | Standard deliveries |
| Motorcycle | Motorcycle license + insurance | Fast urban deliveries |
| Bicycle | ID verification only | Short-distance, eco zones |
| Scooter | ID verification | Campus and downtown zones |

- RUNR selects vehicle type during sign-up
- Vehicle type shown on customer tracking screen
- Some businesses or orders may require car (large orders, catering)
- Insurance requirements vary by vehicle type

---

### Legal, Privacy & Compliance

#### Required Legal Documents

- Terms of Service (customer, RUNR, business — separate or combined)
- Privacy Policy
- Cookie Policy (web)
- RUNR Independent Contractor Agreement
- Business Partner Agreement
- Prop 22 disclosure and rights summary (California RUNRs)
- Community Guidelines
- Refund and Cancellation Policy

#### Data & Privacy

- CCPA compliance (California users): right to access, delete, opt-out of sale
- Data retention policy: order data 7 years; location data 90 days; chat 1 year
- Location data collected only during active delivery or check-in
- Users can download their data (data portability)
- Account deletion removes PII; anonymized order data retained for analytics
- No sale of personal data to third parties

#### Tax

- Sales tax calculated via Stripe Tax (or TaxJar) based on delivery address
- Tax remittance handled per state/local requirements
- 1099 issued to RUNRs and businesses via Stripe
- Customers receive itemized tax on receipts

---

### Technical Architecture

#### Platforms

| Platform | Technology |
|---|---|
| Customer app | React Native (iOS + Android) + Web (PWA) |
| RUNR app | React Native (iOS + Android) |
| Business app | Web dashboard (tablet-optimized) + optional tablet app |
| Admin console | Web (internal) |
| API | REST + WebSocket (real-time) |
| Database | PostgreSQL (primary) + Redis (cache/sessions) |
| File storage | S3-compatible (menu photos, delivery proof, documents) |
| Maps | Google Maps Platform |
| Payments | Stripe Connect |
| Push notifications | Firebase Cloud Messaging (FCM) + APNs |
| SMS | Twilio |
| Email | SendGrid or Postmark |
| Background checks | Checkr (or equivalent) |
| Real-time | WebSocket server (order status, location, coverage) |

#### Real-Time Requirements

| Data | Update Frequency |
|---|---|
| RUNR location (active delivery) | Every 5 seconds |
| Coverage counts | Every 30 seconds |
| Order status | Immediate (WebSocket push) |
| Menu availability | Immediate on change |
| ETA | Every 60 seconds or on status change |

#### API Design Principles

- Versioned API (`/v1/`)
- JWT authentication with refresh tokens
- Role-based access on every endpoint
- Rate limiting per user and IP
- Webhook signatures verified (Stripe, background check provider)
- Idempotent payment and order endpoints
- Audit log on all write operations

#### Environments

| Environment | Purpose |
|---|---|
| Development | Local development |
| Staging | QA, Stripe test mode, test maps |
| Production | Live users, Stripe live mode |

#### Monitoring & Reliability

- Uptime monitoring on API and WebSocket
- Error tracking (Sentry or equivalent)
- Performance monitoring (response times, dispatch latency)
- Alerting for payment failures, dispatch failures, coverage gaps
- Database backups daily; point-in-time recovery
- 99.9% uptime target for order and payment flows

---

### Scheduled & Future Orders

- Customer can schedule order up to 7 days in advance
- Scheduled orders enter business queue at configured lead time (e.g., 30 min before requested time)
- RUNR coverage for scheduled periods should be visible when scheduling
- Customer can cancel scheduled order free up to 1 hour before prep starts
- Future: group ordering, catering, subscription/meal plans, gift cards, POS integration

---

### Accessibility

- WCAG 2.1 AA compliance target for all apps
- Screen reader support
- Minimum touch target sizes
- High contrast mode
- Scalable text
- Alt text on all menu and profile images
- Keyboard navigation on web dashboards

---

### Complete Platform MVP Additions

Add these to the existing MVP lists.

**Customer (additions)**

- Phone verification, saved addresses
- Preference onboarding (cuisine + dietary + allergens)
- "For You" personalized feed
- Food label filters on menu
- Delivery defaults (type, utensils, tip, instructions)
- Favorite restaurants and items
- Search, filters, categories
- Menu modifiers and item-level instructions
- Delivery type (hand to me / leave at door)
- Scheduled orders, promo codes
- Live order tracking map, in-app chat with RUNR
- DoorDash-style ratings (Loved/Liked/Didn't Like, tags, item thumbs, RUNR thumbs)
- Public and private review visibility, photo reviews
- Reorder, referral codes

**RUNR (additions)**

- Vehicle type selection, reliability score
- Turn-by-turn navigation, pickup/delivery geofencing
- Delivery photo proof, in-app chat with customer
- SOS button, incident reporting
- RUNR incentives and quest bonuses
- Masked calling

**Business (additions)**

- Business sign-up and document verification (license, health permit)
- Staff roles (owner, manager, staff, accountant)
- Full menu management with modifiers and photos
- Order queue with printer support
- Auto-pause orders, prep time management
- Operating hours and holiday overrides
- Delivery zone configuration
- Review responses, business analytics
- Most Loved program tracker
- Most Liked items badges
- Tag trend analytics

**Platform (additions)**

- Dispatch algorithm engine
- ETA calculation service
- Delivery zone and fee engine
- Notification service (push, SMS, email)
- Ratings and reliability score engine
- Most Loved program eligibility engine
- Most Liked items calculator
- Review moderation queue
- "For You" recommendation engine
- Allergen warning and food label filter system
- Customer preferences storage and defaults engine
- Promo code and referral system
- In-app chat and masked calling (Twilio)
- Content moderation queue
- Stripe Tax integration
- Business approval workflow
- Real-time WebSocket infrastructure
- Background check integration (Checkr)
- Legal document management
- CCPA data export and deletion tools

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
| "What's good near me?" | "For You" feed based on preferences |
| "Does this have my allergen?" | Allergen alerts on menu items |

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
- Ratings (DoorDash-style) and preferences
- Payment receipts

### RUNR

- Authentication
- RUNR profile
- Sign-up and document verification
- Driver's license upload (front + back)
- Vehicle insurance upload and verification
- Vehicle information
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
- Driver's license verification queue
- Insurance verification queue
- Document expiration tracking and auto-suspension
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
RUNR sign-up (license + insurance)  
↓  
Navigation  
↓  
Map infrastructure

### Phase 2

Customer discovery  
↓  
Search, filters, and categories  
↓  
Business pages  
↓  
Menus and modifiers  
↓  
Cart and checkout  
↓  
Saved addresses and delivery instructions  
↓  
Orders and tracking

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

Dispatch algorithm  
↓  
Delivery workflow  
↓  
Navigation and geofencing  
↓  
Pickup verification  
↓  
Dropoff and photo proof  
↓  
In-app chat and masked calling

### Phase 5

Business onboarding and approval  
↓  
Menu management  
↓  
Business dashboard and order queue  
↓  
RUNRs and coverage  
↓  
Live operations map  
↓  
Analytics

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
Ratings and reliability scores  
↓  
Promotions and referrals  
↓  
Notifications (push, SMS, email)  
↓  
Safety (SOS, incident reporting)  
↓  
Legal and privacy (CCPA, terms)

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
