# Color System Update Prompt
## Match realestate.com.au (REA Group) Color Scheme
# Paste _shared-context.md above this, then use this section.
# This is a CROSS-CUTTING change — run it before any phase that generates UI code,
# OR run it as a one-shot update after all phases are complete.

---

## What This Prompt Does

Replaces the current PropSphere blue-based design tokens (`brand-primary: #1A56DB`)
with the realestate.com.au red-based palette across:
1. `tailwind.config.ts`
2. `.claude/design.md` (color tokens section)
3. `apps/web/src/styles/globals.css` (CSS variables)
4. `apps/web/src/components/ui/` — all primitive components
5. `_shared-context.md` (color token lines)

---

## REA Color Palette (Extracted from realestate.com.au)

These are the exact values to use. Do not substitute.

### Primary — REA Red
```
rea-red:          #E5001A   ← primary brand, CTAs, active states, logo
rea-red-dark:     #B3001A   ← button hover, darker press state
rea-red-light:    #FF1A33   ← subtle variant (hover glow, focus ring)
rea-red-tint:     #FFF0F2   ← very light red bg (alert banners, badges bg)
```

### Rent / Secondary — REA Teal
```
rea-teal:         #007A78   ← rent listings tab, renter-facing elements
rea-teal-dark:    #005F5D   ← teal hover
rea-teal-tint:    #E6F4F4   ← teal light bg
```

### Sold — Charcoal Accent
```
rea-sold:         #555555   ← "Sold" badge, sold listing states
```

### Status / Functional
```
rea-success:      #0A7A4B   ← form success, positive stats
rea-warning:      #D97706   ← auction countdown warning, inspection soon
rea-error:        #C00B1F   ← form errors (darker red, distinct from brand red)
```

### Neutrals (White-first design — REA is extremely clean)
```
rea-charcoal:     #1C1C1C   ← primary text (near-black, warmer than pure black)
rea-body:         #444444   ← body text, descriptions
rea-secondary:    #6F6F6F   ← secondary text, labels, meta info
rea-placeholder:  #9E9E9E   ← input placeholders, disabled text
rea-border:       #DDDDDD   ← card borders, dividers, input borders
rea-border-light: #EEEEEE   ← subtle separators
rea-bg:           #F7F7F7   ← page background (very light warm grey)
rea-bg-card:      #FFFFFF   ← card backgrounds
rea-white:        #FFFFFF
```

### Header Specific
```
rea-header-bg:    #FFFFFF   ← white header
rea-header-text:  #1C1C1C
rea-header-border: #E0E0E0  ← 1px bottom border on header
```

---

## Typography Update

REA Group uses **Pangea** (Fontwerk, licensed) for their rebrand.
Since Pangea is a paid font, use the closest free alternative:

```
Primary font: "Mona Sans" (GitHub's open-source alternative — geometric, modern)
Fallback:     "Inter", ui-sans-serif, system-ui
```

If Mona Sans is too unfamiliar for the team: keep **Inter** — it is visually close.
The key distinction in REA's typography vs our current setup:
- **Heavier weights** — REA uses 700–800 for headings (bolder feel)
- **Tighter letter-spacing** on headings: `tracking-tight` or `-0.02em`
- **Slightly larger body text**: 15px default (not 14px)
- Price figures: **800 weight** (extra-bold), tabular numerals

---

## Updated Tailwind Config

Replace the current `theme.extend` in `apps/web/tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      // REA primary
      'rea-red':          '#E5001A',
      'rea-red-dark':     '#B3001A',
      'rea-red-light':    '#FF1A33',
      'rea-red-tint':     '#FFF0F2',
      // REA teal (rent)
      'rea-teal':         '#007A78',
      'rea-teal-dark':    '#005F5D',
      'rea-teal-tint':    '#E6F4F4',
      // Sold state
      'rea-sold':         '#555555',
      // Status
      'rea-success':      '#0A7A4B',
      'rea-warning':      '#D97706',
      'rea-error':        '#C00B1F',
      // Neutrals
      'rea-charcoal':     '#1C1C1C',
      'rea-body':         '#444444',
      'rea-secondary':    '#6F6F6F',
      'rea-placeholder':  '#9E9E9E',
      'rea-border':       '#DDDDDD',
      'rea-border-light': '#EEEEEE',
      'rea-bg':           '#F7F7F7',
      'rea-bg-card':      '#FFFFFF',

      // Keep these as aliases so existing code doesn't need rewrite:
      // (map old names → new REA values)
      brand: {
        primary:      '#E5001A',
        'primary-dark': '#B3001A',
        secondary:    '#007A78',
        accent:       '#D97706',
      },
      neutral: {
        900: '#1C1C1C',
        800: '#333333',
        700: '#444444',
        600: '#555555',
        500: '#6F6F6F',
        400: '#9E9E9E',
        300: '#CCCCCC',
        200: '#DDDDDD',
        100: '#EEEEEE',
        50:  '#F7F7F7',
      },
    },
    boxShadow: {
      // REA uses minimal, crisp shadows — less blurry than Material
      card:       '0 1px 4px rgba(0,0,0,0.08)',
      'card-hover': '0 4px 16px rgba(0,0,0,0.12)',
      modal:      '0 8px 40px rgba(0,0,0,0.16)',
      header:     '0 1px 0px #E0E0E0',  // hairline shadow on header
    },
    borderRadius: {
      card:   '8px',    // REA uses tighter radius than our previous 12px
      btn:    '4px',    // REA buttons are nearly square — very low radius
      badge:  '4px',    // REA badges are rectangular pills, not fully round
      input:  '4px',
    },
    fontFamily: {
      sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      // REA uses slightly larger base
      'body': ['15px', { lineHeight: '1.6' }],
    },
  },
},
```

---

## CSS Variables (globals.css)

Add these after the existing `@layer base` block:

```css
:root {
  --color-primary:        #E5001A;
  --color-primary-dark:   #B3001A;
  --color-secondary:      #007A78;
  --color-text-primary:   #1C1C1C;
  --color-text-body:      #444444;
  --color-text-secondary: #6F6F6F;
  --color-border:         #DDDDDD;
  --color-bg-page:        #F7F7F7;
  --color-bg-card:        #FFFFFF;
}
```

---

## Component Token Mapping

Every component that previously used `brand-primary` maps to `rea-red`.
Every component that used `brand-secondary` maps to `rea-teal`.

The token alias in `tailwind.config.ts` above (`brand.primary → #E5001A`) means
**existing Tailwind classes like `bg-brand-primary` require no code changes** —
they just resolve to the new red value automatically.

Only these explicit changes need code edits:

### Header
```
Before: bg-brand-primary text-white (blue header)
After:  bg-white border-b border-[#E0E0E0] (white header — REA style)

Logo: The REA logo mark is red on white. Use `text-rea-red` for the logo/wordmark.
Nav links: text-rea-charcoal hover:text-rea-red (not hover:bg)
"Sign in" button: border border-rea-red text-rea-red hover:bg-rea-red hover:text-white
```

### Listing Type Tabs (Buy / Rent / Sold)
```
Container: bg-white border border-rea-border rounded-[4px] inline-flex (no shadow)

Active Buy:  bg-rea-red text-white border-rea-red
Active Rent: bg-rea-teal text-white border-rea-teal
Active Sold: bg-rea-sold text-white border-rea-sold
Inactive:    bg-white text-rea-body hover:bg-rea-bg border-transparent
```

### Hero Section
```
Before: gradient from #1A56DB to #0D1B4D (blue gradient)
After:
  Option A (match REA exactly):
    background: #1C1C1C (very dark charcoal — REA's hero is dark, not blue)
    overlay: rgba(28,28,28,0.7) on property image
    
  Option B (warmer REA-inspired):
    gradient: linear-gradient(135deg, rgba(229,0,26,0.88) 0%, rgba(90,0,10,0.95) 100%)
    (deep red hero — used on some REA campaign pages)

Recommended: Option A — charcoal/dark over city image, red SearchWidget inside.
```

### Search Bar / SearchWidget
```
Container:  bg-white rounded-[8px] shadow-[0_4px_20px_rgba(0,0,0,0.15)] p-3
Search btn: bg-rea-red hover:bg-rea-red-dark text-white rounded-[4px]
Input:      border border-rea-border focus:border-rea-red focus:ring-1 ring-rea-red
```

### Buttons
```
primary:   bg-rea-red hover:bg-rea-red-dark text-white rounded-[4px]
secondary: border border-rea-red text-rea-red hover:bg-rea-red-tint rounded-[4px]
ghost:     text-rea-body hover:bg-rea-bg hover:text-rea-charcoal rounded-[4px]
danger:    bg-rea-error text-white rounded-[4px]
```

### Input Fields
```
border:       border-rea-border
focus ring:   focus:border-rea-red focus:ring-1 focus:ring-rea-red/30
error:        border-rea-error ring-rea-error/30
label:        text-rea-charcoal font-medium
helper/error: text-rea-secondary / text-rea-error
```

### Property Card
```
container:  bg-white rounded-[8px] shadow-card hover:shadow-card-hover
            border border-transparent hover:border-rea-border-light

price:      text-[22px] font-bold text-rea-charcoal tabular-nums
            (REA uses very bold, slightly larger price text)
address:    text-[14px] text-rea-body
suburb:     text-[13px] text-rea-secondary
stats row:  text-[13px] text-rea-secondary
save btn:   text-rea-secondary hover:text-rea-red (heart outline → filled red)
```

### Badges
```
new:           bg-rea-red text-white rounded-[4px]
auction:       bg-rea-warning text-white rounded-[4px]
price_reduced: bg-rea-teal text-white rounded-[4px]
under_offer:   bg-rea-sold text-white rounded-[4px]  (grey, not yellow)
sold:          bg-rea-charcoal text-white rounded-[4px]
```

### Map Pins
```
normal: bg-white border-2 border-rea-red text-rea-red text-xs font-bold
active: bg-rea-red text-white (inverted)
cluster: bg-rea-charcoal text-white border-2 border-white
```

### Footer
```
Before: bg-neutral-900 (very dark, almost black)
After:  bg-[#1C1C1C] (REA charcoal — slightly warmer than pure black)
        border-t: border-[#333333]
        link colour: text-[#AAAAAA] hover:text-white
        section headers: text-white font-semibold
```

---

## Page Background Change

REA uses a slightly warm off-white for page backgrounds, NOT pure white.
All search results pages and listing pages use `#F7F7F7` as the body background.

```
apps/web/src/styles/globals.css:
body { background-color: #F7F7F7; }

Cards are white (#FFFFFF) on this off-white background — this creates
the subtle card-vs-page depth that REA relies on instead of heavy shadows.
```

---

## Files to Update

**Session order — do these in sequence:**

### Step 1: Config files (no component changes yet)
1. `apps/web/tailwind.config.ts` — full replacement of `theme.extend`
2. `apps/web/src/styles/globals.css` — add CSS variables + body background
3. `.claude/design.md` — update Colors section only

### Step 2: Layout components
4. `apps/web/src/components/layout/Header.tsx` — white bg, red logo, updated nav
5. `apps/web/src/components/layout/Footer.tsx` — charcoal bg update

### Step 3: UI primitives
6. `apps/web/src/components/ui/Button.tsx` — all 4 variants
7. `apps/web/src/components/ui/Input.tsx` — border + focus colours
8. `apps/web/src/components/ui/Badge.tsx` — all types + square corners

### Step 4: Feature components
9. `apps/web/src/features/search/components/PropertyCard.tsx` — price weight, border
10. `apps/web/src/features/search/components/FilterPanel.tsx` — active state colours
11. `apps/web/src/features/home/components/Hero.tsx` — dark charcoal bg
12. `apps/web/src/features/home/components/SearchWidget.tsx` — red search button
13. `apps/web/src/features/map/components/PropertyMarker.tsx` — red pins

### Step 5: _shared-context.md token lines
14. Update the "Design tokens" block at the bottom of `_shared-context.md`

---

## Quick Visual Reference — REA vs PropSphere (Before → After)

```
Element               Before (Blue)         After (REA Red)
─────────────────────────────────────────────────────────────
Logo / brand mark     Deep blue #1A56DB     Red #E5001A
Header background     Blue                  White
Hero background       Blue gradient         Dark charcoal #1C1C1C
Buy tab active        Blue                  Red #E5001A
Rent tab active       Green #0E9F6E         Teal #007A78
CTA buttons           Blue                  Red
Search button         Blue                  Red
Map pins (normal)     Blue border           Red border
Map pins (active)     Blue fill             Red fill
Save heart (saved)    Blue                  Red #E5001A
Card hover border     None                  Subtle #EEEEEE
Body text             #374151               #444444 (warmer)
Page background       #F9FAFB               #F7F7F7
Card border radius    12px                  8px
Button border radius  8px                   4px (sharper)
Badge border radius   100px (pill)          4px (rectangular)
```

---

## Token Backward Compatibility

The Tailwind alias map (`brand.primary → #E5001A`) ensures that any existing
code using `text-brand-primary`, `bg-brand-primary`, `border-brand-primary`
does NOT break after the config update — it just renders red instead of blue.

Only the header (currently has a solid blue bg) and hero (blue gradient) need
explicit code edits. Everything else inherits the new red automatically via tokens.

---

## Verification Checklist
```
[ ] tailwind.config.ts updated — rea-* tokens present
[ ] `pnpm dev` runs without errors after config change
[ ] Header: white bg, red logo colour, red hover on nav links
[ ] Hero: dark charcoal background (not blue)
[ ] SearchWidget: red "Search" button
[ ] Buy tab: red active state
[ ] Rent tab: teal active state
[ ] CTA buttons: red not blue
[ ] Property card save heart turns red when saved
[ ] Map pins: red border (not blue)
[ ] Footer: charcoal #1C1C1C background
[ ] Page bg: #F7F7F7 (warm off-white)
[ ] Cards: #FFFFFF on #F7F7F7 — visible depth difference
[ ] No broken Tailwind classes (audit with `pnpm build`)
```
