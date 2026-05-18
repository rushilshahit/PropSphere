import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

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

const FinancePage = lazy(() => import('./features/finance/pages/FinancePage'));

const AgentsPage = lazy(() => import('./features/agent/pages/AgentsPage'));

const SuburbPage = lazy(() => import('./features/suburb/pages/SuburbPage'));

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

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<Loading />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: 'buy',
        element: (
          <Suspense fallback={<Loading />}>
            <SearchResultsPage />
          </Suspense>
        ),
      },
      {
        path: 'rent',
        element: (
          <Suspense fallback={<Loading />}>
            <SearchResultsPage />
          </Suspense>
        ),
      },
      {
        path: 'sold',
        element: (
          <Suspense fallback={<Loading />}>
            <SearchResultsPage />
          </Suspense>
        ),
      },
      {
        path: ':listingType/:id',
        element: (
          <Suspense fallback={<Loading />}>
            <ListingPage />
          </Suspense>
        ),
      },
      {
        path: 'map',
        element: (
          <Suspense fallback={<Loading />}>
            <MapPage />
          </Suspense>
        ),
      },
      {
        path: 'account/saved',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <CollectionsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'account/searches',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<Loading />}>
              <SavedSearchesPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'collections/shared/:token',
        element: (
          <Suspense fallback={<Loading />}>
            <StubPage label="Shared Collection" />
          </Suspense>
        ),
      },
      {
        path: 'suburb/:state/:slug',
        element: (
          <Suspense fallback={<Loading />}>
            <SuburbPage />
          </Suspense>
        ),
      },
      {
        path: 'agents',
        element: (
          <Suspense fallback={<Loading />}>
            <AgentsPage />
          </Suspense>
        ),
      },
      { path: 'agent/:slug', element: <StubPage label="Agent Profile" /> },
      {
        path: 'finance',
        element: (
          <Suspense fallback={<Loading />}>
            <FinancePage />
          </Suspense>
        ),
      },
      { path: 'account/*', element: <StubPage label="Account" /> },
      { path: 'dashboard/*', element: <StubPage label="Agent Dashboard" /> },
    ],
  },
]);
