import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './components/providers/AuthProvider';
import { QueryProvider } from './components/providers/QueryProvider';
import { ToastProvider } from './components/providers/ToastProvider';
import { router } from './router';
import { store } from './store';

export function App() {
  return (
    <Provider store={store}>
      <QueryProvider>
        <AuthProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </AuthProvider>
      </QueryProvider>
    </Provider>
  );
}
