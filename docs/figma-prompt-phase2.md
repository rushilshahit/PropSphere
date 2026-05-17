# Phase 2 — Figma Design Prompt
## For Claude Design Tool

---

## Context
Extend the existing PropSphere design system (REA red #E5001A palette,
Inter font, 8px card radius, 4px button radius). Phase 2 adds 8 new screens
and enhances 4 existing ones. All designs must feel native to the existing
system — no redesigns of Phase 1 screens.

---

## Design System Reference (from Phase 1)
```
Primary:     #E5001A  (REA red — CTAs, active states)
Primary Dark: #B3001A  (hover)
Teal:        #007A78  (rent, success)
Charcoal:    #1C1C1C  (primary text)
Body text:   #444444
Secondary:   #6F6F6F
Border:      #DDDDDD
Page bg:     #F7F7F7  (warm off-white)
Card bg:     #FFFFFF
Font:        Inter
Card radius: 8px
Btn radius:  4px
Badge radius: 4px
```

---

## NEW SCREENS TO DESIGN

### Screen 1: Sold Property Card (variant of existing Property Card)
Design a card variant for sold listings:
- Red diagonal "SOLD" ribbon across top-left corner of image
- Sold price in place of asking price (or "Price withheld" in italic grey)
- "Sold [date]" below address in red text
- Days on market badge: "X days on market" — small pill, neutral-100 bg
- No "Save" heart button — replace with "View agent →" text link
- Auction result badge if applicable: "Sold at auction" — amber pill

### Screen 2: Sold Search Results Page (`/sold`)
Layout identical to Buy search results but:
- Left filter panel: date sold range selector (3m / 6m / 1y / custom)
  + sale method multi-select (Auction / Private Treaty / EOI)
  + standard filters (type, beds, price range)
- Results header: "2,847 sold properties"
- Sort options: Most recent / Price high–low / Days on market
- Cards use the Sold Card variant (Screen 1)

### Screen 3: Sold Property Detail Page
Full listing detail but:
- Hero banner replaces price panel:
  - Large "SOLD" text (48px, rea-red) + sold date
  - Sold price: huge bold (56px tabular-nums) — or "Price withheld"
  - Sale summary card below: Sold date · Method · Days on market · vs asking price delta
- "Thinking of selling?" CTA section — full-width soft-red bg card:
  - "Get a free appraisal of your property" — H3
  - Simple form: name, email, phone, suburb → submit
- Price History section: Recharts timeline chart (dots + line)
  - X axis: dates (2019, 2021, 2023, 2025)
  - Y axis: INR price (formatted ₹XX L / ₹X Cr)
  - Each data point: hover tooltip with date + price + method badge

### Screen 4: Agent Self-Signup Wizard (`/become-an-agent`)
Multi-step wizard, white card on rea-bg:
Step progress bar at top (4 steps, rea-red active, neutral-200 inactive).

Step 1 — Your Details:
- Headshot upload circle (drag-drop or click) — dashed border upload zone
- Full name (pre-filled if logged in), email, phone
- "Already have an account? Sign in" link

Step 2 — Your Agency:
- Two radio options:
  - "Join existing agency" → agency search autocomplete
  - "Create new agency" → agency name, address, phone, logo upload
- Visual: two option cards side-by-side, selected = rea-red border

Step 3 — License & Verification:
- License number input
- Certificate upload (drag-drop zone, accepts PDF/JPG)
- Bio textarea (min 50 chars, char counter)
- Years of experience dropdown

Step 4 — Review & Submit:
- Summary card showing all entered data
- "Submit application" primary button (rea-red)
- Fine print: "Applications reviewed within 2 business days"

Success state: full-width green confirmation card with checkmark illustration

### Screen 5: Price History Timeline (Component)
Standalone component for property detail pages:

```
[Price History]
₹1.5 Cr ●─────────────────────────────●  ← current (if sold)
₹1.2 Cr              ●
₹80 L  ●
        2019        2022         2025
```
- Line chart (Recharts), rea-red line + dot markers
- Each dot: hover → tooltip card (date, price, method badge)
- Method badges inline under chart: "Private Treaty" "Auction"
- "Source: PropSphere records" footnote in caption grey

### Screen 6: Agency Profile Page (`/agency/:slug`)
Three-section layout:

Hero section (full-width, agency brand colour or default charcoal):
- Agency logo (centred, white bg circle)
- Agency name (H1, white)
- Suburb · State · Website link
- "Contact agency" button (white outline)

Agency stats strip (white bg below hero):
- Agents: X · Active listings: X · Properties sold: X

Main content (2-col grid):
- Left (2/3): "Our Agents" section — row of agent avatar cards
  - Each: photo circle, name, listings count, "View profile →"
- Right (1/3): "Active Listings" — compact vertical card list (3–4 items)
- Below: "Recent Sales" — horizontal scroll of sold cards

### Screen 7: Agent Profile Page — Full (`/agent/:slug`)
Enhancement of the existing stub:

Hero card (full-width):
- Large agency colour band at top (40px)
- Agent headshot (100px circle, overlapping band bottom)
- Name (H2), Agency name + logo, "Verified agent" green badge if verified
- Phone + Email + "Send enquiry" button row
- Years active · License number (small, muted)

Stats strip (4 boxes in a row):
- Active listings · Sold (12m) · Avg days on market · Median sold price

Two-tab content:
Tab 1 "Current Listings" → PropertyCard grid (compact)
Tab 2 "Sold History" → Sold cards + stats card at top

"Sold by [Agent Name]" stats card (left sidebar on desktop, top on mobile):
- Total sales: X
- Median sold price: ₹X Cr
- Median days on market: X days
- Highest sale: ₹X Cr
- Filters: suburb dropdown, property type, date range

### Screen 8: Offer Submit Modal
Triggered by "Make an Offer" button on active buy listings:

Modal overlay (white card, max-w-md):
- Header: "Make an offer" + property address (small, muted below)
- Amount input: large, left-aligned, INR prefix "₹", tabular-nums
  - Range hint below: "Asking price: ₹X Cr"
  - Quick buttons: "Asking price" "-5%" "+5%" chips
- Message textarea: "Add a message (optional)" — grey border, 3 rows
- Confidentiality toggle: "Keep my offer confidential" (toggle switch)
- Submit: "Submit offer" button (rea-red, full-width)
- Disclaimer: "Your offer is not legally binding until accepted in writing."
- Name/Email auto-filled if authenticated; editable text fields if not

Success state: 
- Checkmark animation
- "Offer submitted" — H3
- "The agent will be in touch shortly."
- "View your offers →" link

---

## ENHANCED EXISTING SCREENS

### Enhancement 1: Property Card — Add Phase 2 Badges
Add badge logic to existing Property Card design:
- Priority order: AUCTION > INSPECTION > NEW > VIRTUAL TOUR > UNDER OFFER
- Only one badge shown at a time (top-left of image)
- AUCTION: rea-accent (#D97706) bg
- INSPECTION: rea-teal bg, "Open Sat 10am" text if space allows
- NEW: rea-red bg
- VIRTUAL TOUR: purple bg (#7C3AED), 360° icon
- UNDER OFFER: neutral-700 bg
- SOLD: diagonal ribbon (Screen 1 above)

### Enhancement 2: Listing Detail Page — Virtual Tour Tab
Add "360° Tour" tab to the photo gallery tab switcher:
- Tab row: [Photos X] [Floor Plan] [360° Tour] [Street View]
- 360° Tour tab: full-height iframe (same height as photo gallery)
- Placeholder state if no tour: dashed border card, "No virtual tour available"
- "Open in full screen" button overlay (top-right)

### Enhancement 3: User Account — New Pages
Design three new account sub-pages using existing account layout:

a) Recently Viewed (`/account/history`):
- "Clear history" button top-right
- Property grid (same 3-col as saved properties)
- Each card: timestamp below "Viewed X days ago" in caption grey
- Empty state: "No recently viewed properties" + "Start browsing" button

b) Enquiry History (`/account/enquiries`):
- Timeline list (not grid)
- Each item: property thumbnail (64x64) + address + agent name + "Sent X days ago"
- "View property →" link per item
- Empty state

c) Offer History (`/account/offers`):
- Similar to enquiries but shows offer amount + status badge
- Status badges: Pending (amber) · Accepted (green) · Rejected (red) · Withdrawn (grey)

### Enhancement 4: Suburb Profile Page — Sold Aggregations
Add a "Market Insights" section below the price trend chart:

Metrics grid (2x2 on desktop, 1-col on mobile):
- Clearance rate: large % number + "of auctions sold" label
- Median days on market: large number + "days on market" label
- Properties sold (last 12m): large number
- Price growth: large % with ↑ or ↓ arrow indicator

Sale method distribution: horizontal bar showing % Auction vs % Private Treaty vs % EOI

---

## Figma File Structure

```
PropSphere — Phase 2
├── 🎨 Design Tokens (unchanged from Phase 1)
├── 🆕 Phase 2 Components
│   ├── Sold Property Card
│   ├── Price History Chart
│   ├── Offer Submit Modal
│   ├── Agent Signup Wizard Steps (1–4)
│   ├── Badge variants (all 6)
│   └── Sold Price Banner
├── 📄 New Pages
│   ├── Sold Search Results
│   ├── Sold Property Detail
│   ├── Agent Self-Signup (/become-an-agent)
│   ├── Agent Profile (full)
│   ├── Agency Profile
│   └── Account sub-pages (History, Enquiries, Offers)
├── 🔄 Enhanced Pages
│   ├── Property Card (with all badge variants)
│   ├── Listing Detail (with virtual tour tab)
│   └── Suburb Profile (with sold aggregations)
└── 📱 Mobile Variants
    ├── Sold card (mobile)
    ├── Agent signup (mobile)
    └── Agency profile (mobile)
```

---

## Illustration Prompts (for AI-generated assets)

**Agent signup success:**
"Flat design illustration. Person receiving a verified badge / tick from a house icon.
Clean lines, REA red (#E5001A) and teal (#007A78) palette. No outlines.
Minimal, modern. 400x300px."

**Empty offer inbox:**
"Flat design illustration. Empty inbox tray with a small house icon and a
gentle pulse/waiting effect. Neutral greys and subtle red accent. Minimal."

**Price history empty:**
"Flat design illustration. A simple upward trend line chart on a whiteboard,
person pointing at it. Blue-grey tones. Professional, clean."
