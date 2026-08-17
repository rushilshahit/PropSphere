import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminShell } from './components/layout/AdminShell';
import { AdminRoute } from './components/layout/AdminRoute';
import { Spinner } from './components/ui';

const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'));
const DashboardPage = lazy(() => import('./features/dashboard/pages/DashboardPage'));
const PropertiesPage = lazy(() => import('./features/properties/pages/PropertiesPage'));
const PropertyFormPage = lazy(() => import('./features/properties/pages/PropertyFormPage'));
const AgenciesPage = lazy(() => import('./features/agencies/pages/AgenciesPage'));
const AgencyFormPage = lazy(() => import('./features/agencies/pages/AgencyFormPage'));
const AgentsPage = lazy(() => import('./features/agents/pages/AgentsPage'));
const AgentFormPage = lazy(() => import('./features/agents/pages/AgentFormPage'));
const UsersPage = lazy(() => import('./features/users/pages/UsersPage'));
const UserDetailPage = lazy(() => import('./features/users/pages/UserDetailPage'));
const SuburbsPage = lazy(() => import('./features/suburbs/pages/SuburbsPage'));
const SchoolsPage = lazy(() => import('./features/schools/pages/SchoolsPage'));
const EnquiriesPage = lazy(() => import('./features/enquiries/pages/EnquiriesPage'));
const NotificationsPage = lazy(() => import('./features/notifications/pages/NotificationsPage'));
const MediaPage = lazy(() => import('./features/media/pages/MediaPage'));
const FeaturedPage = lazy(() => import('./features/featured/pages/FeaturedPage'));
const AnalyticsPage = lazy(() => import('./features/analytics/pages/AnalyticsPage'));

const Loading = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Spinner size="lg" />
  </div>
);

const wrap = (Page: React.ComponentType) => (
  <Suspense fallback={<Loading />}>
    <Page />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Suspense fallback={<Loading />}><LoginPage /></Suspense>,
  },
  {
    path: '/',
    element: (
      <AdminRoute>
        <AdminShell />
      </AdminRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: wrap(DashboardPage) },
      { path: 'properties', element: wrap(PropertiesPage) },
      { path: 'properties/new', element: wrap(PropertyFormPage) },
      { path: 'properties/:id/edit', element: wrap(PropertyFormPage) },
      { path: 'agencies', element: wrap(AgenciesPage) },
      { path: 'agencies/new', element: wrap(AgencyFormPage) },
      { path: 'agencies/:id/edit', element: wrap(AgencyFormPage) },
      { path: 'agents', element: wrap(AgentsPage) },
      { path: 'agents/:id/edit', element: wrap(AgentFormPage) },
      { path: 'users', element: wrap(UsersPage) },
      { path: 'users/:id', element: wrap(UserDetailPage) },
      { path: 'suburbs', element: wrap(SuburbsPage) },
      { path: 'schools', element: wrap(SchoolsPage) },
      { path: 'enquiries', element: wrap(EnquiriesPage) },
      { path: 'notifications', element: wrap(NotificationsPage) },
      { path: 'media', element: wrap(MediaPage) },
      { path: 'featured', element: wrap(FeaturedPage) },
      { path: 'analytics', element: wrap(AnalyticsPage) },
    ],
  },
]);
