import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

const HomePage = lazy(() => import('./features/home/pages/HomePage'));

const SearchResultsPage = lazy(() =>
  import('./features/search/pages/SearchResultsPage').then((m) => ({ default: m.SearchResultsPage })),
);

const ListingPage = lazy(() => import('./features/listing/pages/ListingPage'));

const MapPage = lazy(() => import('./features/map/pages/MapPage'));

const CollectionsPage = lazy(() =>
  import('./features/collections/pages/CollectionsPage'),
);

const SavedSearchesPage = lazy(() =>
  import('./features/alerts/pages/SavedSearchesPage'),
);

const RecentlyViewedPage = lazy(() =>
  import('./features/account/pages/RecentlyViewedPage'),
);

const EnquiryHistoryPage = lazy(() =>
  import('./features/account/pages/EnquiryHistoryPage'),
);

const OfferHistoryPage = lazy(() =>
  import('./features/account/pages/OfferHistoryPage'),
);

const MyListingsPage = lazy(() =>
  import('./features/account/pages/MyListingsPage'),
);

const MyListingDetailPage = lazy(() =>
  import('./features/account/pages/MyListingDetailPage'),
);

const FinancePage = lazy(() => import('./features/finance/pages/FinancePage'));

const AgentsPage = lazy(() => import('./features/agent/pages/AgentsPage'));

const AgentPage = lazy(() => import('./features/agent/pages/AgentPage'));

const AgencyPage = lazy(() => import('./features/agency/pages/AgencyPage'));

const SoldSearchPage = lazy(() => import('./features/sold/pages/SoldSearchPage'));

const SuburbPage = lazy(() => import('./features/suburb/pages/SuburbPage'));

const DashboardLayout = lazy(() =>
  import('./features/dashboard/components/DashboardLayout').then((m) => ({ default: m.DashboardLayout })),
);
const DashboardHome = lazy(() => import('./features/dashboard/pages/DashboardHome'));
const ListingManagement = lazy(() => import('./features/dashboard/pages/ListingManagement'));
const EnquiriesInbox = lazy(() => import('./features/dashboard/pages/EnquiriesInbox'));
const OfferInbox = lazy(() => import('./features/dashboard/pages/OfferInbox'));
const AnalyticsPage = lazy(() => import('./features/dashboard/pages/AnalyticsPage'));

const BecomeAnAgentPage = lazy(() => import('./features/agent-signup/pages/BecomeAnAgentPage'));

function StubPage({ label }: { label: string }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center text-neutral-400">
      {label} — coming soon
    </div>
  );
}

const Loading = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

function Page({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <Page><HomePage /></Page>,
      },
      {
        path: 'buy',
        element: <Page><SearchResultsPage /></Page>,
      },
      {
        path: 'rent',
        element: <Page><SearchResultsPage /></Page>,
      },
      {
        path: 'sold',
        element: <Page><SoldSearchPage /></Page>,
      },
      {
        path: ':listingType/:id',
        element: <Page><ListingPage /></Page>,
      },
      {
        path: 'map',
        element: <Page><MapPage /></Page>,
      },
      {
        path: 'account/saved',
        element: (
          <ProtectedRoute>
            <Page><CollectionsPage /></Page>
          </ProtectedRoute>
        ),
      },
      {
        path: 'account/searches',
        element: (
          <ProtectedRoute>
            <Page><SavedSearchesPage /></Page>
          </ProtectedRoute>
        ),
      },
      {
        path: 'collections/shared/:token',
        element: <Page><StubPage label="Shared Collection" /></Page>,
      },
      {
        path: 'suburb/:state/:slug',
        element: <Page><SuburbPage /></Page>,
      },
      {
        path: 'agents',
        element: <Page><AgentsPage /></Page>,
      },
      {
        path: 'agent/:slug',
        element: <Page><AgentPage /></Page>,
      },
      {
        path: 'agency/:slug',
        element: <Page><AgencyPage /></Page>,
      },
      {
        path: 'become-an-agent',
        element: (
          <ProtectedRoute roles={['pending_agent', 'agent', 'admin']}>
            <Suspense fallback={<Loading />}>
              <BecomeAnAgentPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'post-property',
        element: <Page><StubPage label="Post a Property" /></Page>,
      },
      {
        path: 'finance',
        element: <Page><FinancePage /></Page>,
      },
      {
        path: 'account/history',
        element: (
          <ProtectedRoute>
            <Page><RecentlyViewedPage /></Page>
          </ProtectedRoute>
        ),
      },
      {
        path: 'account/enquiries',
        element: (
          <ProtectedRoute>
            <Page><EnquiryHistoryPage /></Page>
          </ProtectedRoute>
        ),
      },
      {
        path: 'account/offers',
        element: (
          <ProtectedRoute>
            <Page><OfferHistoryPage /></Page>
          </ProtectedRoute>
        ),
      },
      {
        path: 'account/my-listings',
        element: (
          <ProtectedRoute roles={['seller', 'agent']}>
            <Page><MyListingsPage /></Page>
          </ProtectedRoute>
        ),
      },
      {
        path: 'account/my-listings/:id',
        element: (
          <ProtectedRoute roles={['seller', 'agent']}>
            <Page><MyListingDetailPage /></Page>
          </ProtectedRoute>
        ),
      },
      { path: 'account/*', element: <StubPage label="Account" /> },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Page><DashboardLayout /></Page>
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <Page><DashboardHome /></Page>,
          },
          {
            path: 'listings',
            element: <Page><ListingManagement /></Page>,
          },
          {
            path: 'enquiries',
            element: <Page><EnquiriesInbox /></Page>,
          },
          {
            path: 'offers',
            element: <Page><OfferInbox /></Page>,
          },
          {
            path: 'analytics',
            element: <Page><AnalyticsPage /></Page>,
          },
        ],
      },
    ],
  },
]);
