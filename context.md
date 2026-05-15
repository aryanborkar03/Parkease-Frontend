ParkEase Premium Pass — Complete Implementation Prompt
Project Context
ParkEase is a parking management application. The frontend is built in React (with React Router, Tailwind CSS). The backend is Spring Boot microservices with a dedicated payment-service. Authentication uses JWT — the driver's email is extracted from the token on every secured endpoint. Existing payment flow uses Razorpay.
The driver sidebar currently has: Dashboard, Find Parking, My Bookings, My Vehicles, My Receipts, Notifications. The bottom-left of the sidebar shows the driver avatar, name, and "Driver" label.

Feature Summary
Implement a ParkEase Premium Pass — a ₹5,000 prepaid subscription pass purchased via Razorpay that gives a driver 150 parking uses within 30 days. The pass works across all vehicles owned by the driver. Pass payments must be a fully equivalent alternative to Razorpay payments — same booking completion behavior, same receipt generation, same UI outcomes.

Business Rules
RuleDetailPrice₹5,000 fixed — no free-form entryValidity30 days from purchasedAt (expiresAt = purchasedAt + 30 days)Parking limit150 uses per passVehicle scopeAll vehicles owned by the driver — no per-vehicle restrictionOne pass at a timeCannot buy a new pass if current pass is ACTIVE and not expired and parkingCountUsed < 150No partial paymentPass either covers the full booking amount or is not usable — no mixed paymentNo balance trackingPass is count-based only (parkingCountUsed out of 150), not rupee-balance-basedExpiry checkChecked both on use (payWithPass) and on page load (getMyPass)DepletionStatus → DEPLETED when parkingCountUsed reaches 150ExpiryStatus → EXPIRED when now > expiresAt, set lazily on use or proactively by schedulerReceiptPDF receipt generated for every pass payment, identical structure to Razorpay receiptRefundsNot in scopePass stackingNot supported

Backend — payment-service
1. PassStatus.java (enum)
javaACTIVE, DEPLETED, EXPIRED

2. PassBalance.java (JPA entity, table: pass_balances)
FieldTypeNotespassIdLong PKAuto-generateddriverEmailStringUnique indexrazorpayOrderIdStringOrder used to buy the passrazorpayPaymentIdStringPayment that funded the passstatusPassStatusACTIVE / DEPLETED / EXPIREDparkingCountLimitintAlways 150parkingCountUsedintStarts at 0, incremented per usepurchasedAtLocalDateTimeSet on activationexpiresAtLocalDateTimepurchasedAt + 30 dayslastUsedAtLocalDateTimeUpdated on each use

3. PassTransaction.java (JPA entity, table: pass_transactions)
FieldTypeNotestransactionIdLong PKAutopassIdLongFK → pass_balancesdriverEmailStringbookingIdLongamountdoubleBooking amount coveredpassTransactionRefStringPASS-{UUID} — shown as Transaction IDcountBeforeintparkingCountUsed before this deductioncountAfterintparkingCountUsed after this deductioncreatedAtLocalDateTime

4. Repositories
PassBalanceRepository.java
javaOptional<PassBalance> findByDriverEmail(String email);
Optional<PassBalance> findByDriverEmailAndStatus(String email, PassStatus status);
List<PassBalance> findAllByStatusAndExpiresAtBefore(PassStatus status, LocalDateTime now);
PassTransactionRepository.java
javaList<PassTransaction> findByDriverEmailOrderByCreatedAtDesc(String email);
Optional<PassTransaction> findByBookingId(Long bookingId);

5. DTOs
BuyPassOrderRequest.java — empty body (amount is fixed)
PayWithPassRequest.java
javaLong bookingId;
double amount;
PassBalanceDTO.java — all fields from PassBalance plus:
javaint parkingCountRemaining; // = parkingCountLimit - parkingCountUsed
int transactionCount;
PassTransactionDTO.java — all fields from PassTransaction
VerifyPassRequest.java — reuse shape of existing VerifyPaymentRequest:
javaString razorpayOrderId;
String razorpayPaymentId;
String razorpaySignature;

6. PassService.java (interface) + PassServiceImpl.java
createPassOrder(String email): OrderResponseDTO

If driver has a pass where status == ACTIVE AND expiresAt > now AND parkingCountUsed < 150 → throw BadRequestException("You already have an active pass")
Otherwise create a Razorpay order for ₹5,000 and return OrderResponseDTO

activatePass(VerifyPassRequest req, String email): PassBalanceDTO

Verify Razorpay signature (reuse existing signature verification logic)
Create PassBalance:

status = ACTIVE
parkingCountUsed = 0
parkingCountLimit = 150
purchasedAt = LocalDateTime.now()
expiresAt = purchasedAt + 30 days


Save and return PassBalanceDTO
Publish notification: "Your ParkEase Premium Pass is now active! 150 parkings available until [expiresAt]."

getMyPass(String email): PassBalanceDTO

Find pass by email
If not found → throw ResourceNotFoundException
If found and status == ACTIVE and now > expiresAt → update status to EXPIRED, save, return updated DTO
Return PassBalanceDTO

payWithPass(PayWithPassRequest req, String email): PassTransactionDTO

Find pass by email where status == ACTIVE
If not found → throw BadRequestException("No active pass found")
If now > expiresAt → set status EXPIRED, save, throw BadRequestException("Your pass has expired")
If parkingCountUsed >= 150 → set status DEPLETED, save, throw BadRequestException("Pass fully used")
Proceed:

countBefore = parkingCountUsed
parkingCountUsed++
lastUsedAt = now
If parkingCountUsed == 150 → status = DEPLETED
Save PassBalance
Create PassTransaction with passTransactionRef = "PASS-" + UUID.randomUUID()
Update booking payment status to PAID — call booking-service or update directly, same as Razorpay payment does
Generate PDF receipt — identical to Razorpay receipt but with:

Payment Method: ParkEase Pass
Transaction ID: passTransactionRef
Extra fields: Parkings Remaining (150 - parkingCountUsed), Pass Valid Until (expiresAt)


Save receipt so it appears in existing receipts API
Publish notification: "Pass used for Booking #X. Parkings remaining: Y."


Return PassTransactionDTO

getMyPassTransactions(String email): List<PassTransactionDTO>

Return all transactions for driver, newest first

getPassTransactionByBooking(Long bookingId, String email): PassTransactionDTO

Return transaction for specific booking

@Scheduled(fixedRate = 3600000) checkAndExpirePasses()

Find all passes where status == ACTIVE and expiresAt < now
Set each to EXPIRED, save
Log count of expired passes


7. PassController.java
Base path: /api/pass — all endpoints require DRIVER role
MethodPathHandlerDescriptionPOST/ordercreatePassOrderCreate Razorpay order for ₹5,000POST/verifyactivatePassVerify Razorpay payment → activate passGET/mygetMyPassGet current pass (any status)POST/paypayWithPassUse pass to pay for a bookingGET/transactionsgetMyPassTransactionsAll pass deductionsGET/transactions/booking/{bookingId}getPassTransactionByBookingPass txn for a booking

8. PaymentMode.java — add PASS to enum

9. Receipt generation for pass payments
Reuse the exact same PDF receipt generation service used for Razorpay payments. Fields:

Driver Name
Driver Email
Booking ID
Parking Spot
Vehicle
Check-in / Check-out
Amount Paid
Payment Method: ParkEase Pass
Transaction ID: PASS-{UUID}
Date & Time
Parkings Remaining: X / 150 (extra field)
Pass Valid Until: [expiresAt formatted date] (extra field)

The receipt must be retrievable from the existing /api/receipts endpoint tagged with payment mode PASS.

Frontend — Parkease-Frontend

1. DriverLayout.jsx — Sidebar changes
Navigation: Do NOT add a new top-level nav item. Keep existing 6 items unchanged.
Premium badge on driver profile: In the bottom-left driver info section (where avatar, name, "Driver" label are shown):

If driver has an active pass → show a small gold "✦ PREMIUM" badge below the "Driver" label
Style: tiny pill, gold gradient background (#F59E0B → #D97706), white text, text-xs
Fetch pass status on layout mount via GET /api/pass/my — handle 404 silently (no pass = no badge)
Cache this in context or local state — don't re-fetch on every route change


2. NotificationsPage.jsx (or equivalent notifications route)
Add a "Subscription" section card at the top of the notifications page, visually distinct from regular notification items:
┌──────────────────────────────────────────────┐
│  🎫  Subscription                    →        │
│  Manage your ParkEase Premium Pass            │
│  [ACTIVE: 142/150 parkings · 28 days left]    │
│           OR                                  │
│  [No active pass · ₹5,000/month]              │
└──────────────────────────────────────────────┘

Card has a subtle indigo-left-border or gold accent
Clicking anywhere on the card navigates to /driver/subscription
The status line dynamically shows pass state (active with counts, or prompt to buy)


3. src/pages/driver/Subscription.jsx — NEW PAGE at /driver/subscription
State: No pass / Expired / Depleted — Marketing / Purchase view
Full-width premium marketing page. Layout top to bottom:
Hero section (dark gradient background: #0F0C29 → #302B63 → #24243e):

Animated gold shimmer sweep across the background (CSS keyframe @keyframes shimmer)
Centered content:

Small label: INTRODUCING in gold spaced caps
Large heading: "ParkEase Premium Pass" in white, bold
Subheading: "Park smarter. 150 spots. 30 days. One price." in muted white



Feature cards row (4 cards in a grid):
IconTitleSubtitle🅿️150 ParkingsPer 30-day pass📅30-Day ValidityFrom date of purchase🚗All Your VehiclesNo per-vehicle restriction🧾Full ReceiptsGenerated for every use
Pricing block (centered, prominent):

Large ₹5,000 in white/gold
/month label in muted
Fine print: "That's just ₹33 per parking"
Subtext: "One-time purchase · No auto-renewal · No expiry extension"

CTA Button:

Label: "Buy ParkEase Pass — ₹5,000"
Style: large, gold gradient (#F59E0B → #D97706), rounded-full, shadow-lg, hover scale
On click:

Call POST /api/pass/order
Open Razorpay checkout with returned order details
On Razorpay success callback: call POST /api/pass/verify
On verify success: transition page to Active Pass view without page reload (update local state)



If previous pass was expired/depleted, show the old pass card in greyed-out state above the marketing section with a red "EXPIRED" or "DEPLETED" stamp, then the buy section below.

State: Active Pass view
Pass Card (styled like a premium credit/debit card):

Dimensions: 400px × 240px, border-radius: 20px
Background: animated gradient #312e81 → #4c1d95 → #78350f with a gold shimmer sweep animation
Content layout:

Top-left: ParkEase P logo icon (white) + "PREMIUM" text in gold caps, letter-spacing: 0.2em
Top-right: Gold star icon ✦
Middle: Driver name in large white text
Below name: "ParkEase Pass Holder" in muted gold
Bottom-left: Valid Until: Jun 13, 2026 in small white
Bottom-right: Pass ID: #XX in small muted white


Subtle card shine/glare overlay using a pseudo-element
Hover: slight 3D tilt effect (transform: rotateY(5deg) rotateX(2deg))

Progress section (below card):

Label: "Parkings Used"
Large counter: X / 150
Progress bar: full width, gold fill, rounded, animated fill on load
Below bar: "Y parkings remaining" and "Z days left"` side by side

Pass details row:

Purchase Date, Expiry Date, Pass ID, Status pill (ACTIVE in green)

Transaction History (below details):

Section heading: "Usage History"
Table columns: Date & Time | Booking # | Spot | Amount | Parkings Left | Transaction Ref
If no transactions yet: empty state "No parkings used yet. Start parking!"
Each row has a small 🎫 icon in the Transaction Ref column


4. PaymentPage.jsx — MODIFY existing Complete Payment page
Current state
Single "Pay ₹X via Razorpay" button below the Booking Summary card.
New state — two-option payment selector
Below the Booking Summary card, replace the single button with:
┌─────────────────────────────────────────────────┐
│  Choose Payment Method                          │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ ● 💳  Pay via Razorpay                  │    │
│  │       Card, UPI, Net Banking            │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ ○ 🎫  Pay with ParkEase Pass            │    │
│  │       142 parkings remaining            │    │
│  │       Valid till Jun 13, 2026           │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  [ Pay ₹50 via Razorpay ] ← changes dynamically │
└─────────────────────────────────────────────────┘
Radio card styling:

Each option is a rounded card with border
Selected state: indigo border + light indigo background tint
Unselected: grey border, white background
Razorpay option selected by default

Pass option conditional rendering:
Pass stateAppearanceBehaviourNo pass ever / 404Greyed card, "No active pass", subtext "→ Buy one in Subscriptions"Clicking navigates to /driver/subscriptionPass expiredGreyed card, "Pass expired on [DATE]"Not selectablePass depletedGreyed card, "Pass fully used (150/150)"Not selectableActive and validFull color, shows remaining count + expirySelectable
Confirm button label (dynamic):

Razorpay selected → "Pay ₹X via Razorpay" (existing red style)
Pass selected → "Pay ₹X with Pass" (indigo/violet gradient, same size)

On submit — Pass selected:

Show loading state on button
Call POST /api/pass/pay with { bookingId, amount }
On success:

Navigate to success screen (or existing post-payment route)
Pass passTransactionRef as the Transaction ID to display


On error (expired/depleted detected server-side):

Show inline error message on the pass card
Re-enable the button
Auto-switch selection back to Razorpay



Success screen / post-payment:
The success screen must show identical information regardless of payment method:

Booking ID, Spot, Vehicle, Check-in, Check-out, Amount Paid
Payment Method: "ParkEase Pass" (if pass) or "Razorpay" (if Razorpay)
Transaction ID: PASS-{UUID} or Razorpay payment ID
If pass payment: additionally show "Parkings Remaining: X / 150" and "Pass Valid Until: [DATE]"


5. My Bookings — MyBookings.jsx — NO structural changes
After a pass payment completes:

Booking card must update identically to after a Razorpay payment
Status pill → Completed (green)
"Payment pending" label disappears
"Pay ₹X" button disappears
Amount displayed normally (no orange/pending styling)

This happens automatically if the backend correctly updates booking payment status to PAID in payWithPass.

6. My Receipts — MyReceipts.jsx — MINOR visual change only
Pass receipts appear automatically (generated by backend, returned by existing receipts API).
Visual differentiation:

In the receipts list, pass receipts show a small 🎫 Pass badge next to the amount (or payment method column)
Razorpay receipts continue showing as before
No structural change to the receipts page needed


7. App.jsx — add route
jsx<Route
  path="/driver/subscription"
  element={
    <ProtectedRoute allowedRole="DRIVER">
      <Subscription />
    </ProtectedRoute>
  }
/>

Complete Data Flow
Buy Pass Flow
Driver → POST /api/pass/order
       → Razorpay checkout opens (₹5,000)
       → Razorpay success callback
       → POST /api/pass/verify { orderId, paymentId, signature }
       → Backend: verify sig → create PassBalance (ACTIVE, 0/150, expiresAt = now+30d)
       → Publish notification
       → Frontend: show active pass card
Pay with Pass Flow (from Payment Page)
Driver selects "Pay with Pass" → clicks "Pay ₹X with Pass"
       → POST /api/pass/pay { bookingId, amount }
       → Backend:
           check pass ACTIVE + not expired + count < 150
           increment parkingCountUsed
           if count == 150 → status = DEPLETED
           create PassTransaction (PASS-{UUID})
           update booking payment status → PAID
           generate PDF receipt (saved to receipts store)
           publish notification
       → Frontend: navigate to success screen with passTransactionRef
       → My Bookings: booking shows Completed, Pay button gone
       → My Receipts: new receipt appears with 🎫 Pass badge

Verification Checklist
Backend

 POST /api/pass/order throws if active pass exists
 POST /api/pass/verify creates pass_balances row with correct expiresAt
 POST /api/pass/pay increments parkingCountUsed, creates pass_transactions row
 POST /api/pass/pay sets status DEPLETED when count hits 150
 POST /api/pass/pay sets status EXPIRED and throws if now > expiresAt
 Booking payment status updates to PAID after pass payment
 PDF receipt generated and saved, appears in /api/receipts
 Scheduler runs hourly and expires stale passes
 GET /api/pass/my returns updated status if expired

Frontend

 /driver/subscription shows buy page when no pass
 Razorpay flow activates pass, page transitions to active pass card without reload
 Active pass card shows correct count, expiry, progress bar
 Premium badge appears in sidebar bottom-left when pass is active
 Notifications page shows Subscription card with live pass status
 Payment page shows two payment options
 Pass option greyed out correctly for no-pass / expired / depleted states
 Pass payment completes booking — My Bookings shows Completed, Pay button gone
 Success screen shows PASS-{UUID} as Transaction ID
 Receipt appears in My Receipts with 🎫 badge
 Server-side expiry/depletion error on payment page shows inline error and falls back to Razorpay
