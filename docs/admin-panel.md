# Admin Panel
## PropSphere — Feature Specification

**Version:** 1.0
**Status:** Draft

---

## Overview

A separate web app (`apps/admin/`) accessible only to users with `role = 'admin'` in the `profiles` table. Built with the same React + Tailwind stack as `apps/web/`. The panel is the **single source of truth for all data operations** that end-users cannot perform themselves.

---

## Authentication & Access Control

- Admin login via the same Supabase Auth (email + password only — no Google OAuth for admin)
- Role guard on every route: redirect to `/` if `profile.role !== 'admin'`
- Session timeout after 30 minutes of inactivity
- Audit log entry on every write action (who did what, when)

---

## 1. Dashboard (Home)

**Purpose:** At-a-glance health of the platform.

| Metric Card | Data Source |
|---|---|
| Total active listings | `properties` where `status = 'active'` |
| New listings today | `properties.published_at >= today` |
| Total enquiries this week | `enquiries.created_at >= 7 days ago` |
| New users today | `profiles.created_at >= today` |
| Unread enquiries | `enquiries` where `status = 'new'` |
| Featured listings count | `properties.is_featured = true` |

**Charts:**
- Listings by status (pie: draft / active / under offer / sold / withdrawn)
- Enquiries over last 30 days (line chart)
- New registrations over last 30 days (line chart)
- Top 5 suburbs by listing count (bar chart)

---

## 2. Property Management

**List view:**
- Table columns: address, suburb, type (buy/rent/sold), status, agent, price, views, enquiries, published date
- Filters: listing type, status, suburb, property type, agent, featured flag
- Sort by: price, published date, view count, enquiry count
- Bulk actions: activate, withdraw, mark as featured, delete

**Create / Edit listing (multi-step form):**

| Step | Fields |
|---|---|
| 1. Basic Info | Property type, listing type, sale method, status |
| 2. Address | Street number, street name, suburb, state, postcode, lat/lng (map pin picker) |
| 3. Specs | Bedrooms, bathrooms, car spaces, land size (m²), build size (m²) |
| 4. Pricing | Price / price range / hide price / display text, auction datetime |
| 5. Content | Headline, description (rich text), features checklist (indoor / outdoor / climate) |
| 6. Media | Drag-and-drop image uploader (Supabase Storage), floor plan flag per image, reorder by drag, caption per image |
| 7. Inspection Times | Add/remove slots — date, start time, end time, type (open home / private) |
| 8. Assignment | Assign agent and agency (searchable dropdowns) |
| 9. Preview & Publish | Preview card + publish / save as draft |

**Detail view:** All fields + enquiries thread + image gallery + inspection list

---

## 3. Agency Management

- List with: name, suburb, state, active agents count, active listings count
- Create/Edit: name, slug, logo upload, website, phone, address, suburb, state, postcode
- Delete (only if no agents or listings are linked)
- View all agents belonging to the agency inline

---

## 4. Agent Management

- List with: name (from linked profile), agency, license number, years active, active listings count
- Create: link to an existing user profile (searchable by email), assign agency, license number, bio, years active
- Edit all fields above
- View agent's active + sold listings
- Deactivate agent (does not delete the profile)

---

## 5. User Management

- List with: name, email, role, joined date, status (active / suspended)
- Filter by role: `buyer`, `renter`, `seller`, `agent`, `admin`
- Search by name or email
- View profile detail: role, phone, collections count, saved searches count, enquiries sent
- Edit: change role, update email / name
- Suspend / reactivate account (sets a `suspended` flag — not a hard delete)
- Cannot delete the currently logged-in admin account

---

## 6. Suburb Management

- List all suburbs: name, state, postcode, median sale price, median rent, avg days on market, stats last updated
- Edit stats manually: `median_sale_price`, `median_rent_price`, `days_on_market_avg`
- Trigger manual stats refresh for a single suburb (calls the nightly cron job on demand)
- Create new suburb (for seed data or geographic expansion)

---

## 7. School Management

- List with: name, type (primary / secondary / combined), sector (govt / catholic / independent), suburb, state, rating
- Create/Edit: all fields including lat/lng (map pin picker)
- Delete
- Bulk import via CSV upload (columns: name, type, sector, suburb, state, postcode, lat, lng, rating)

---

## 8. Enquiry Inbox

- Table: sender name, sender email, property address, assigned agent, status, received date
- Filter by: status (new / read / replied / archived), agent, date range
- Click row to view full enquiry detail
- Change status: mark as read, archive
- Admin cannot reply — replies go through the agent
- Export filtered results to CSV

---

## 9. Notifications Management

- View all notifications sent: user, type, title, body, read status, sent at
- Filter by type: `new_listing`, `price_drop`, `inspection_reminder`, `enquiry_received`, `enquiry_replied`
- Manually trigger a broadcast notification to all users (title + body — for platform announcements)
- View unread count per user (for debugging delivery issues)

---

## 10. Media Library

- Browse all images in Supabase Storage grouped by property
- View storage usage summary: total file count, total size
- Delete orphaned images (images in storage with no matching `property_images` row)
- Preview image with a link to the associated property

---

## 11. Featured Listings Control

- Dedicated view showing all `is_featured = true` listings
- Toggle featured on/off from listing detail or in bulk from this view
- Reorder featured listings (controls display order in the homepage `FeaturedListings` carousel)

---

## 12. Analytics (Read-Only)

| View | Metrics |
|---|---|
| Search analytics | Top 10 searched suburbs, top keyword queries, common filter combinations |
| Listing performance | Most viewed properties, highest enquiry rate, avg days to sold |
| User activity | DAU / WAU / MAU (derived from `search_history` + `profiles`) |
| Alert performance | Alerts sent vs read (from `notifications`) |

---

## Admin API Endpoints

All endpoints sit behind an `AdminGuard` that verifies `profile.role === 'admin'`.

```
# Properties
POST   /admin/properties              — create listing
PATCH  /admin/properties/:id          — edit listing
DELETE /admin/properties/:id          — delete listing
PATCH  /admin/properties/bulk         — bulk status change

# Agencies
POST   /admin/agencies
PATCH  /admin/agencies/:id
DELETE /admin/agencies/:id

# Agents
POST   /admin/agents
PATCH  /admin/agents/:id
DELETE /admin/agents/:id

# Users
GET    /admin/users                   — list all profiles
PATCH  /admin/users/:id               — change role / suspend

# Suburbs
POST   /admin/suburbs
PATCH  /admin/suburbs/:id

# Schools
POST   /admin/schools
PATCH  /admin/schools/:id
DELETE /admin/schools/:id
POST   /admin/schools/import          — CSV bulk import

# Enquiries
GET    /admin/enquiries
PATCH  /admin/enquiries/:id/status

# Analytics
GET    /admin/analytics/dashboard
GET    /admin/analytics/listings
GET    /admin/analytics/users

# Notifications
POST   /admin/notifications/broadcast — send announcement to all users
```

---

## Routing Structure

```
/admin                          → Dashboard
/admin/properties               → Property list
/admin/properties/new           → Create listing
/admin/properties/:id/edit      → Edit listing
/admin/agencies                 → Agency list
/admin/agencies/new
/admin/agencies/:id/edit
/admin/agents                   → Agent list
/admin/agents/new
/admin/agents/:id/edit
/admin/users                    → User list
/admin/users/:id
/admin/suburbs
/admin/schools
/admin/enquiries
/admin/notifications
/admin/media
/admin/featured
/admin/analytics
```

---

## Implementation Approach

| Option | Pros | Cons |
|---|---|---|
| **A. Separate app** `apps/admin/` in the monorepo | Isolated bundle, separate deploy, clean auth boundary | More initial scaffolding |
| **B. Protected route in `apps/web/`** under `/admin` | Shares components, single deploy | Admin code ships in the public bundle |
| **C. Supabase Dashboard + custom views** | Zero build effort | No custom UX, limited control |

**Recommended: Option A** — a separate `apps/admin/` Vite app inside the same Turborepo, sharing `@propsphere/types` and `@propsphere/utils`. Deployed separately on Vercel under `admin.propsphere.in`.

---

## Shared Packages Used

| Package | Usage |
|---|---|
| `@propsphere/types` | `Property`, `Agent`, `Agency`, `Profile`, `Enquiry`, `Suburb`, `School` interfaces |
| `@propsphere/utils` | `formatPrice`, `formatAddress` for display |
| `@propsphere/config` | `PAGE_SIZE`, env schema |
