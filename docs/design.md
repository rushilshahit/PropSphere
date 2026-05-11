# Design System — PropSphere
## For Claude Design

---

## Brand

**Name:** PropSphere · **Tagline:** Find your place.
**Personality:** Trustworthy, modern, warm. Not corporate-cold.

---

## Colors

```
brand-primary:      #1A56DB   CTAs, links, active states
brand-primary-dark: #1239A0   hover
brand-secondary:    #0E9F6E   rent tab, success
brand-accent:       #FF6B35   auction badge, price drop

neutral-900: #111827   primary text
neutral-700: #374151   body text
neutral-500: #6B7280   secondary text
neutral-400: #9CA3AF   placeholder, disabled
neutral-200: #E5E7EB   borders
neutral-100: #F3F4F6   card bg
neutral-50:  #F9FAFB   page bg
white:       #FFFFFF

status-success: #0E9F6E
status-error:   #E02424
status-warning: #FACA15
```

---

## Typography — Inter

```
display:  700 · 48px · tracking-tight    hero headings
h1:       700 · 36px · tracking-tight
h2:       600 · 28px
h3:       600 · 22px
h4:       600 · 18px
body-lg:  400 · 16px · leading-relaxed
body-md:  400 · 14px · leading-relaxed   (default)
caption:  400 · 12px
label:    500 · 13px · uppercase tracking-wide

price:    700 · 20px · tabular-nums      card price
price-lg: 700 · 32px · tabular-nums     listing page
```

---

## Spacing · Border Radius · Shadows

```
Spacing (4px base): 8 · 16 · 24 · 32 · 40 · 48 · 64 · 80px

Border radius:
  card:   12px
  button: 8px
  input:  8px
  badge:  100px (pill)

Shadows:
  card:       0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04)
  card-hover: 0 10px 25px rgba(0,0,0,.12)
  modal:      0 20px 60px rgba(0,0,0,.18)
```

---

## Components

### Button

```
Variants: primary | secondary | ghost | danger
Sizes: sm py-1.5 px-3 text-sm · md py-2.5 px-4 text-sm · lg py-3 px-6 text-base
All: font-medium rounded-[8px] transition-colors duration-150

primary:   bg-brand-primary text-white hover:bg-brand-primary-dark
secondary: border border-brand-primary text-brand-primary hover:bg-brand-primary/5
ghost:     text-neutral-700 hover:bg-neutral-100
danger:    bg-red-600 text-white hover:bg-red-700
disabled:  opacity-50 cursor-not-allowed
loading:   spinner + opacity-70
```

---

### Input + Label

```
input:    border border-neutral-300 rounded-[8px] px-3 py-2.5 text-sm
          focus:ring-2 ring-brand-primary border-transparent
error:    border-red-400 focus:ring-red-400
disabled: opacity-50 bg-neutral-50
label:    text-[13px] font-medium text-neutral-700 mb-1.5 block
helper:   text-xs text-neutral-500 mt-1
error-msg: text-xs text-red-500 mt-1
```

---

### Property Card

```
article: bg-white rounded-[12px] shadow-card hover:shadow-card-hover
         transition-shadow duration-200 overflow-hidden cursor-pointer group

Image (aspect-[4/3] relative overflow-hidden):
  img:        w-full h-full object-cover group-hover:scale-105 transition duration-300
  save-btn:   absolute top-3 right-3 · bg-white/80 backdrop-blur-sm rounded-full p-2
  badge:      absolute top-3 left-3
  photo-count: absolute bottom-3 right-3 · bg-black/50 text-white text-xs px-2 py-0.5 rounded

Content (p-4):
  price:   text-xl font-bold tabular-nums text-neutral-900
  address: text-sm text-neutral-700 mt-1 truncate
  stats:   flex items-center gap-3 mt-2 text-sm text-neutral-500
           [BedDouble 2] · [Bath 1] · [Car 1] · [Maximize2 120m²]
```

---

### Badge

```
Base: text-xs font-semibold px-2.5 py-1 rounded-[100px]
new:           bg-brand-primary text-white
auction:       bg-brand-accent text-white
price_reduced: bg-brand-secondary text-white
under_offer:   bg-yellow-500 text-white
sold:          bg-neutral-700 text-white
```

---

### Listing Type Tabs

```
Container: bg-white rounded-full p-1 inline-flex shadow-sm
Tab:       px-5 py-2 rounded-full text-sm font-medium transition-all duration-150
active-buy:  bg-brand-primary text-white
active-rent: bg-brand-secondary text-white
active-sold: bg-neutral-700 text-white
inactive:    text-neutral-600 hover:bg-neutral-100
```

---

### Segmented Control (beds/baths)

```
Container: flex gap-1
Option:    px-3 py-1.5 rounded-[8px] text-sm font-medium border transition-all
active:    bg-brand-primary text-white border-brand-primary
inactive:  bg-white text-neutral-700 border-neutral-300 hover:border-brand-primary
```

---

### Modal

```
overlay: fixed inset-0 bg-black/40 backdrop-blur-sm z-50
         flex items-center justify-center p-4
panel:   bg-white rounded-[12px] shadow-modal w-full max-w-lg relative p-6
         scale-in animation (0.95→1, 200ms ease)
close:   absolute top-4 right-4 text-neutral-400 hover:text-neutral-700
header:  text-[18px] font-semibold text-neutral-900 mb-4
```

---

### Agent Card

```
Container: border border-neutral-200 rounded-[12px] p-4 flex gap-4
avatar:    w-16 h-16 rounded-full object-cover shrink-0
name:      text-sm font-semibold text-neutral-900
agency:    text-xs text-neutral-500
phone:     text-sm text-brand-primary font-medium mt-1
```

---

### Map Pin

```
normal:  white bg · brand-primary border 2px · rounded-full
         px-2.5 py-1 · text-xs font-bold text-brand-primary · shadow-sm
active:  bg-brand-primary text-white · scale-110 z-10
cluster: bg-neutral-700 text-white rounded-full w-10 h-10
         text-sm font-bold border-2 border-white shadow-md
```

---

### Skeleton / Toast

```
skeleton: bg-neutral-200 rounded shimmer animation (1.5s loop)
          shimmer: bg gradient 90deg #f0f0f0→#e0e0e0→#f0f0f0, size 200%

toast: fixed bottom-4 right-4 z-50
       bg-white border rounded-[12px] shadow-card p-4 min-w-[280px]
       success: border-l-4 border-status-success
       error:   border-l-4 border-status-error
```

---

## Animations

```
page-fade:       opacity 0→1, 150ms ease
card-hover:      translateY(-2px) + shadow, 200ms ease-out
modal-open:      scale 0.95→1 + opacity, 200ms ease
pin-hover:       scale 1→1.2, 150ms
heart-save:      scale 1→1.25→1, 300ms ease-out
filter-collapse: height, 250ms ease-in-out
```

---

## Layout

```
max-width:     max-w-7xl mx-auto
page-padding:  px-4 sm:px-6 lg:px-8
section-gap:   py-12 md:py-16

Search results:
  flex gap-6
  aside: w-80 shrink-0          ← filter panel
  main:  flex-1 min-w-0

Property grid:
  grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6

Listing detail (lg+):
  grid grid-cols-[1fr_380px] gap-8
```

---

## Breakpoints

```
sm: 640px · md: 768px · lg: 1024px · xl: 1280px
```

---

## Icons — lucide-react

```
Property: BedDouble · Bath · Car · Maximize2
Actions:  Heart · HeartOff · MapPin · Search · Share2
UI:       Bell · Calendar · ChevronDown · ChevronUp · X · Check · AlertCircle · Eye
Sizes:    w-4 h-4 inline · w-5 h-5 button · w-6 h-6 standalone
```

---

## Tailwind Config

```ts
theme: {
  extend: {
    colors: {
      brand: {
        primary: '#1A56DB', 'primary-dark': '#1239A0',
        secondary: '#0E9F6E', accent: '#FF6B35',
      }
    },
    boxShadow: {
      card: '0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04)',
      'card-hover': '0 10px 25px rgba(0,0,0,.12)',
      modal: '0 20px 60px rgba(0,0,0,.18)',
    },
    borderRadius: { card: '12px', btn: '8px', badge: '100px' },
    fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui'] },
  }
}
```
