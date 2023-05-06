import Home from '@/pages/Home';
import FullView from '@/pages/FullView';
import { RouteObject } from 'react-router-dom';
import App from '@/App';

export const menuRoutes: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/full-view',
    element: <FullView />
  }
]
const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: menuRoutes
  }
];

export default routes;