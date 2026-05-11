# Folder Structure

## Monorepo Root

```
propsphere/
├── apps/
│   ├── web/                    # React frontend (Vite + React 18)
│   └── api/                    # NestJS backend
├── packages/
│   ├── types/                  # Shared TypeScript interfaces
│   ├── utils/                  # Shared pure utility functions
│   └── config/                 # Shared Zod schemas, constants, env validation
├── docs/                       # Project documentation (MD files)
├── .claude/                    # AI tooling documentation
├── scripts/                    # Dev/ops scripts
├── .claudeignore
├── .gitignore
├── package.json                # Workspace root
├── turbo.json                  # Turborepo config
└── claude.md                   # Main project context for Claude
```

---

## Frontend: `apps/web/`

```
apps/web/
├── public/
│   ├── favicon.ico
│   ├── robots.txt
│   └── og-default.jpg
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── router.tsx              # React Router v6 route definitions
│   │
│   ├── features/               # Feature-based modules (primary org unit)
│   │   ├── search/
│   │   │   ├── components/
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   ├── FilterPanel.tsx
│   │   │   │   ├── PropertyCard.tsx
│   │   │   │   ├── PropertyGrid.tsx
│   │   │   │   └── SortControls.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── usePropertySearch.ts
│   │   │   │   └── useSearchFilters.ts
│   │   │   ├── store/
│   │   │   │   └── searchSlice.ts
│   │   │   ├── pages/
│   │   │   │   └── SearchResultsPage.tsx
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── listing/
│   │   │   ├── components/
│   │   │   │   ├── PhotoGallery.tsx
│   │   │   │   ├── PropertyStats.tsx
│   │   │   │   ├── InspectionTimes.tsx
│   │   │   │   ├── AgentCard.tsx
│   │   │   │   ├── EnquiryModal.tsx
│   │   │   │   ├── FeaturesList.tsx
│   │   │   │   ├── AuctionCountdown.tsx
│   │   │   │   └── SimilarProperties.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useProperty.ts
│   │   │   │   └── useEnquiry.ts
│   │   │   ├── pages/
│   │   │   │   └── ListingPage.tsx
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── map/
│   │   │   ├── components/
│   │   │   │   ├── MapView.tsx
│   │   │   │   ├── PropertyMarker.tsx
│   │   │   │   ├── PropertyPopup.tsx
│   │   │   │   ├── ClusterMarker.tsx
│   │   │   │   └── LayerToggles.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useMapState.ts
│   │   │   ├── store/
│   │   │   │   └── mapSlice.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── suburb/
│   │   │   ├── components/
│   │   │   │   ├── PriceTrendChart.tsx
│   │   │   │   ├── SuburbStats.tsx
│   │   │   │   ├── DemographicsChart.tsx
│   │   │   │   └── SchoolsList.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useSuburb.ts
│   │   │   ├── pages/
│   │   │   │   └── SuburbPage.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── collections/
│   │   │   ├── components/
│   │   │   │   ├── CollectionList.tsx
│   │   │   │   ├── SaveButton.tsx
│   │   │   │   ├── SaveModal.tsx
│   │   │   │   └── CompareDrawer.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useCollections.ts
│   │   │   ├── pages/
│   │   │   │   └── CollectionsPage.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   └── SocialAuthButtons.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   ├── store/
│   │   │   │   └── authSlice.ts
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── RegisterPage.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── agent/
│   │   │   ├── components/
│   │   │   │   ├── AgentProfile.tsx
│   │   │   │   ├── AgentListings.tsx
│   │   │   │   └── ReviewsList.tsx
│   │   │   ├── pages/
│   │   │   │   └── AgentPage.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── finance/
│   │   │   ├── components/
│   │   │   │   ├── RepaymentCalculator.tsx
│   │   │   │   ├── BorrowCapacity.tsx
│   │   │   │   └── StampDutyCalculator.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── alerts/
│   │   │   ├── components/
│   │   │   │   ├── AlertsPage.tsx
│   │   │   │   └── NotificationCentre.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── dashboard/           # Agent dashboard
│   │       ├── components/
│   │       │   ├── ListingWizard/
│   │       │   │   ├── Step1Details.tsx
│   │       │   │   ├── Step2Media.tsx
│   │       │   │   ├── Step3Features.tsx
│   │       │   │   ├── Step4Pricing.tsx
│   │       │   │   ├── Step5Inspections.tsx
│   │       │   │   └── Step6Preview.tsx
│   │       │   ├── EnquiriesInbox.tsx
│   │       │   └── ListingManagement.tsx
│   │       └── index.ts
│   │
│   ├── components/             # Shared/generic UI components
│   │   ├── ui/                 # Primitives: Button, Input, Modal, Badge, etc.
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── RangeSlider.tsx
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── seo/
│   │   │   ├── PageMeta.tsx
│   │   │   └── StructuredData.tsx
│   │   └── providers/
│   │       ├── QueryProvider.tsx
│   │       ├── AuthProvider.tsx
│   │       └── ToastProvider.tsx
│   │
│   ├── hooks/                  # Global/cross-feature hooks
│   │   ├── useDebounce.ts
│   │   ├── useGeolocation.ts
│   │   ├── useMediaQuery.ts
│   │   └── useIntersectionObserver.ts
│   │
│   ├── lib/                    # Third-party client wrappers
│   │   ├── supabase.ts         # Supabase client init
│   │   ├── mapbox.ts           # Mapbox config
│   │   ├── queryClient.ts      # TanStack Query client
│   │   └── analytics.ts
│   │
│   ├── api/                    # API layer (TanStack Query + fetch)
│   │   ├── properties.ts
│   │   ├── suburbs.ts
│   │   ├── agents.ts
│   │   ├── collections.ts
│   │   ├── enquiries.ts
│   │   └── notifications.ts
│   │
│   ├── store/                  # Redux store setup
│   │   ├── index.ts
│   │   └── rootReducer.ts
│   │
│   ├── styles/
│   │   ├── globals.css
│   │   └── mapbox.css
│   │
│   └── types/                  # Frontend-only supplementary types
│       └── index.ts
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Backend: `apps/api/`

```
apps/api/
├── src/
│   ├── main.ts                         # Bootstrap
│   ├── app.module.ts                   # Root module
│   │
│   ├── config/
│   │   ├── configuration.ts            # Env config via @nestjs/config
│   │   └── validation.schema.ts        # Zod or Joi env validation
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── guards/
│   │   │   ├── auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── interceptors/
│   │   │   └── transform.interceptor.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── pipes/
│   │   │   └── zod-validation.pipe.ts
│   │   └── types/
│   │       └── index.ts
│   │
│   ├── database/
│   │   └── supabase.service.ts         # Supabase admin client
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── dto/
│   │   │       ├── register.dto.ts
│   │   │       └── login.dto.ts
│   │   │
│   │   ├── properties/
│   │   │   ├── properties.module.ts
│   │   │   ├── properties.controller.ts
│   │   │   ├── properties.service.ts
│   │   │   ├── properties.search.service.ts  # Typesense integration
│   │   │   └── dto/
│   │   │       ├── search-properties.dto.ts
│   │   │       ├── create-property.dto.ts
│   │   │       └── update-property.dto.ts
│   │   │
│   │   ├── agents/
│   │   │   ├── agents.module.ts
│   │   │   ├── agents.controller.ts
│   │   │   ├── agents.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── suburbs/
│   │   │   ├── suburbs.module.ts
│   │   │   ├── suburbs.controller.ts
│   │   │   └── suburbs.service.ts
│   │   │
│   │   ├── enquiries/
│   │   │   ├── enquiries.module.ts
│   │   │   ├── enquiries.controller.ts
│   │   │   ├── enquiries.service.ts
│   │   │   └── dto/
│   │   │       └── create-enquiry.dto.ts
│   │   │
│   │   ├── collections/
│   │   │   ├── collections.module.ts
│   │   │   ├── collections.controller.ts
│   │   │   └── collections.service.ts
│   │   │
│   │   ├── alerts/
│   │   │   ├── alerts.module.ts
│   │   │   ├── alerts.processor.ts     # BullMQ processor
│   │   │   └── alerts.service.ts
│   │   │
│   │   ├── notifications/
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.controller.ts
│   │   │   └── notifications.service.ts
│   │   │
│   │   ├── media/
│   │   │   ├── media.module.ts
│   │   │   ├── media.controller.ts
│   │   │   └── media.service.ts        # Supabase Storage
│   │   │
│   │   └── search-history/
│   │       └── search-history.service.ts
│   │
│   └── jobs/
│       ├── alert-matching.job.ts       # BullMQ: new listing alert processing
│       ├── price-drop.job.ts           # BullMQ: price change detection
│       └── suburb-stats.job.ts         # Nightly suburb stats refresh
│
├── test/
│   ├── app.e2e-spec.ts
│   └── properties.e2e-spec.ts
│
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
└── package.json
```

---

## Shared Packages: `packages/`

```
packages/
├── types/
│   ├── src/
│   │   ├── property.ts         # Property, PropertyImage, ListingType enums
│   │   ├── agent.ts            # Agent, Agency, AgentReview
│   │   ├── suburb.ts           # Suburb, SuburbStats
│   │   ├── user.ts             # Profile, UserRole
│   │   ├── collection.ts       # Collection, CollectionProperty
│   │   ├── enquiry.ts          # Enquiry, EnquiryStatus
│   │   ├── search.ts           # SearchFilters, SearchResult
│   │   └── index.ts
│   ├── tsconfig.json
│   └── package.json
│
├── utils/
│   ├── src/
│   │   ├── format-price.ts
│   │   ├── format-address.ts
│   │   ├── calc-stamp-duty.ts
│   │   ├── calc-repayment.ts
│   │   └── index.ts
│   └── package.json
│
└── config/
    ├── src/
    │   ├── env.schema.ts       # Zod env validation
    │   └── constants.ts        # App-wide constants
    └── package.json
```

---

## `.claude/` Directory

```
.claude/
├── skills.md           # What Claude can do in this repo
├── design.md           # Design system reference
├── task.md             # Active task queue
├── coding-standards.md
├── naming-conventions.md
├── git-standards.md
├── vibe-coding.md
└── token-saving.md
```
