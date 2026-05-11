# Figma Design Prompt
## PropSphere — Real Estate Marketplace UI/UX

---

## Context for the Designer

Design a modern real estate marketplace called **PropSphere**. Reference: realestate.com.au, Domain.com.au, Zillow, and Rightmove. The goal is to feel more human and premium than the reference site — cleaner whitespace, better typography, more engaging micro-interactions.

The product is a web app (desktop-first, but fully responsive to 375px). Users are property buyers, renters, and sellers in Australia. Agents also use a separate dashboard view.

---

## Brand Identity

**Personality:** Trustworthy, modern, warm, approachable. Not corporate-cold. Not startup-chaotic.

**Name:** PropSphere  
**Tagline:** "Find your place."

### Color Palette

| Token | Value | Usage |
|---|---|---|
| `brand-primary` | `#1A56DB` | CTAs, links, active states |
| `brand-primary-dark` | `#1239A0` | Hover states |
| `brand-secondary` | `#0E9F6E` | Rent tab accent, success states |
| `brand-accent` | `#FF6B35` | Auction badge, price drop indicator |
| `neutral-900` | `#111827` | Primary text |
| `neutral-700` | `#374151` | Secondary text |
| `neutral-400` | `#9CA3AF` | Placeholder, disabled |
| `neutral-100` | `#F3F4F6` | Backgrounds, cards |
| `neutral-50` | `#F9FAFB` | Page background |
| `white` | `#FFFFFF` | Cards, inputs |

### Typography

| Scale | Font | Weight | Size |
|---|---|---|---|
| Display | Inter | 700 | 48px |
| H1 | Inter | 700 | 36px |
| H2 | Inter | 600 | 28px |
| H3 | Inter | 600 | 22px |
| H4 | Inter | 600 | 18px |
| Body L | Inter | 400 | 16px |
| Body M | Inter | 400 | 14px |
| Caption | Inter | 400 | 12px |
| Label | Inter | 500 | 13px |

Use Inter for all text. Numbers (prices, stats) should use Inter's tabular numerals (`font-variant-numeric: tabular-nums`).

### Spacing System
4px base unit. Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96.

### Border Radius
- Cards: 12px
- Buttons: 8px
- Inputs: 8px
- Badges: 100px (pill)
- Map popups: 12px

### Shadows
- Card default: `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)`
- Card hover: `0 10px 25px rgba(0,0,0,0.12)`
- Modal: `0 20px 60px rgba(0,0,0,0.18)`

---

## Pages to Design

### 1. Homepage / Hero

**Layout:**
- Full-bleed hero: gradient from `#1A56DB` to `#0E1B4D`, overlaid on a high-quality Australian streetscape photo
- Centred search bar with tab switcher (Buy / Rent / Sold / Commercial)
- Search input with location autocomplete dropdown below
- "Popular suburbs" chips below search bar: e.g. Sydney, Melbourne, Brisbane, Perth
- Below hero: 3-column feature highlights (Search, Save, Compare) with illustrated icons
- "Recent listings" carousel section
- "Explore by suburb" map section
- "Market trends" summary strip
- Footer

**Key elements:**
- Tab bar uses a pill switcher with `brand-primary` active state for Buy, `brand-secondary` for Rent
- Search input: large (56px height), white, prominent shadow, location pin icon left, "Search" button right
- Hero background: subtle animated gradient shift (slow, 8s loop)

---

### 2. Search Results Page

**Layout (desktop):**
- Top: sticky header with simplified search bar + filter button
- Left column (360px): filter panel (collapsible sections per filter group)
- Right area: results grid OR map view toggle
- Results grid: 3 columns of property cards

**Layout (mobile):**
- Full-width search bar
- Filters in a bottom sheet
- Stacked property cards
- Floating "Map" button bottom-right

**Property Card Design:**
- Image (aspect ratio 4:3) with photo count badge top-right
- "New" / "Price reduced" / "Auction" badge top-left on image
- Below image: price (bold, 20px), address (16px), beds/baths/car icons + values
- Suburb + state (caption, neutral-400)
- Agency logo small bottom-right
- Save button (heart icon) top-right corner of image
- Hover: card lifts (shadow transition), save button always visible on hover
- Card dimensions: min 280px wide

**Filter Panel:**
- Collapsible sections: Location, Price, Property Type, Bedrooms, Bathrooms, Car Spaces, Features, Land Size
- Price: dual-handle range slider + manual input fields
- Bedrooms/bathrooms/car: segmented button row (Any, 1, 2, 3, 4, 5+)
- Property type: icon + label toggle buttons (House icon, Apartment icon, etc.)
- Features: scrollable multi-select checkbox list
- "Reset filters" link, "Show X results" primary button

**Sort Bar:**
- Right-aligned dropdown: Newest / Price Low–High / Price High–Low / Inspection Time
- Result count left ("1,284 properties found")

---

### 3. Listing Detail Page

**Layout (desktop):**
- Full-width photo gallery hero (70vh): main image left (60%), thumbnail strip right (40%)
- Clicking gallery opens full-screen lightbox carousel
- Below gallery: 2-column layout
  - Left (main, 65%): stats, description, features, inspection times, map
  - Right (sticky sidebar, 35%): price panel + agent card + enquiry CTA

**Price Panel (sticky sidebar):**
- Large price display (H2, brand-primary for buy, brand-secondary for rent)
- "Auction" or price range when applicable
- Days on market badge (e.g., "12 days on market")
- CTA: "Enquire now" (primary button, full-width)
- "Save property" (secondary button, full-width, heart icon)
- Agent card embedded below CTAs

**Stats Row:**
- Horizontal strip with icons: Bed | Bath | Car | Land: XXXm² | House: XXXm²
- Large, bold numbers. Icon + number + unit. Dividers between.

**Description:**
- "Show more / less" expansion after 4 lines
- Rich text rendered

**Feature Checklist:**
- Grid of 3 columns, icon + label
- Grouped: Indoor Features, Outdoor Features, Climate

**Inspection Times:**
- List of date + time slots
- "Add to calendar" (.ics download) button per slot

**Map Section:**
- Embedded Mapbox map, 400px height
- Layer toggles: Schools / Transport / Walk score
- Nearby schools listed below map (max 5)

**Similar Properties:**
- Horizontal scrollable carousel, same card design as search results

---

### 4. Map Full-Screen View

- Header: search bar pinned top-centre
- Full viewport map
- Right panel: property list (320px), scrollable, same property cards (compact version)
- Property pins: circular with price label, white bg, brand-primary border
- Active/hover pin: brand-primary bg, white text, pops up
- Cluster markers: grey pill with count
- Bottom-left: layer toggles (Schools, Transport, Flood zone)
- Bottom-right: zoom in/out, current location button
- "Draw area" button activates polygon draw mode

---

### 5. Suburb Profile Page

**Header:**
- Hero: suburb name large (H1), state, a static aerial image
- Stats strip: Median house price | Median rent | Avg days on market | Properties for sale

**Price Trend Chart:**
- Line chart (12 months default, tab toggles: 1Y / 3Y / 5Y)
- Two lines: Houses vs Units
- Clean chart: no grid clutter, subtle gridlines, brand-primary + brand-secondary

**Demographics Section:**
- Two donut charts side by side: Age distribution, Household types
- Legend with colour-coded labels

**Schools Section:**
- List of nearest schools: name, type badge (Gov/Catholic/Independent), rating bar, distance

**Nearby Suburbs:**
- Horizontal chip list, clickable

---

### 6. Collections Page

**Layout:**
- Left sidebar: collection list (My Saved, + Create new collection button)
- Main area: grid of saved property cards with note previews
- Compare mode: floating "Compare (3)" button when 2+ checked
- Compare drawer: slides up from bottom, 4-column table comparing stats

---

### 7. Finance Calculator Page

- Three tab sections: Repayment / Borrow Capacity / Stamp Duty
- Each tab: clean form left (50%), result panel right (50%) with animated number output
- Repayment result: large monthly payment figure + breakdown chart (principal vs interest, donut)
- Stamp duty: result table by state (when multiple states shown)

---

### 8. Auth Modals (Login / Register)

- Centred modal, max 480px wide
- Social buttons first: "Continue with Google" | "Continue with Apple"
- Divider: "or"
- Email + password fields
- CTA button
- Toggle: "Don't have an account? Sign up"
- Clean, minimal — no excess decoration

---

### 9. Agent Dashboard (Separate from public)

**Sidebar nav:** Dashboard / My Listings / Enquiries / Analytics / Profile

**Listing Wizard (multi-step):**
- Stepper at top (5 steps, progress bar)
- Step 1: Property address (address autocomplete), property type, listing type
- Step 2: Photo upload — drag-and-drop zone, reorder via drag, set hero image
- Step 3: Description (rich text), features multi-select
- Step 4: Pricing (method dropdown, price input/range)
- Step 5: Inspection times (date/time picker, add multiple)
- Step 6: Preview (as it would appear to buyers) + Publish button

**Enquiries Inbox:**
- Email-client style layout: list left, thread right
- Unread count badge
- Sender name, property address, message preview, timestamp

---

## Component Library to Build in Figma

Primitives:
- Button (primary / secondary / ghost / danger) × (default / hover / active / disabled) × (sm / md / lg)
- Input (default / focus / error / disabled) + label + helper text pattern
- Badge (colours: blue / green / orange / red / grey) (sizes: sm / md)
- Modal overlay
- Tabs (underline style / pill style)
- Range slider
- Segmented control
- Checkbox, Radio, Toggle switch
- Skeleton loaders for card, page sections
- Toast notification (success / error / info)
- Dropdown menu

Composed:
- PropertyCard (full / compact)
- AgentCard
- MapPin (normal / active / cluster)
- FilterPanel
- PhotoGallery
- InspectionTimeSlot
- NotificationItem
- SearchBar

---

## Motion & Interaction Guidelines

- Page transitions: fade (150ms)
- Card hover: `transform: translateY(-2px)`, shadow increase (200ms ease-out)
- Modal open: scale from 0.95 + fade (200ms)
- Map pin hover: scale 1.2 (150ms)
- Filter panel collapse: height animate (250ms ease-in-out)
- Save button: heart fill animation with a small scale bounce (300ms)
- Price number updates: count-up animation (600ms)
- Skeleton loaders: shimmer effect left-to-right (1.5s loop)

---

## Responsive Breakpoints

| Name | Width |
|---|---|
| Mobile | 375px |
| Mobile L | 430px |
| Tablet | 768px |
| Desktop S | 1024px |
| Desktop M | 1280px |
| Desktop L | 1440px |

---

## Illustration / Asset Prompts

### Logo
**Prompt for AI logo generation:**
"Minimalist real estate marketplace logo. A stylised sphere or globe shape made of thin property/house roof silhouettes arranged in a circular pattern. Modern, clean, professional. Primary blue (#1A56DB). Works at 32x32px. No text. Flat design, not 3D."

### Hero Illustrations (SVG, for empty states and feature highlights)
1. **Search illustration:** "Flat design illustration of a person looking through a magnifying glass at tiny houses on a map. Warm colours, friendly style, no outlines, modern."
2. **Save illustration:** "Flat design illustration of a person pinning a house to a board/collection. Pastel blue and green tones. Friendly, minimal."
3. **Compare illustration:** "Flat design illustration of two houses on a balance scale, person deciding. Clean, minimal, blue tones."
4. **Empty state (no results):** "Flat design illustration of an empty street with a single house and a question mark above it. Subtle, friendly."
5. **Success (enquiry sent):** "Flat design illustration of an envelope flying toward a house. Green accent."

### Onboarding / Feature Illustrations
Use a consistent illustration style: flat, minimal shading, warm-cool palette, 2–3 colour maximum per illustration.

---

## Figma File Structure

```
PropSphere Design System
├── 🎨 Foundations
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   ├── Shadows
│   └── Icons
├── 🧱 Components
│   ├── Primitives
│   └── Composed
├── 📄 Pages
│   ├── 01 - Homepage
│   ├── 02 - Search Results
│   ├── 03 - Listing Detail
│   ├── 04 - Map View
│   ├── 05 - Suburb Profile
│   ├── 06 - Collections
│   ├── 07 - Finance Tools
│   ├── 08 - Auth
│   └── 09 - Agent Dashboard
├── 📱 Mobile
│   ├── Search (mobile)
│   ├── Listing (mobile)
│   └── Nav + Bottom Sheet
└── 🔄 Prototype Flows
    ├── Search → Results → Listing
    ├── Save to Collection
    └── Enquiry Submit
```
