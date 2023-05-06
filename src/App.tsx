import { useState } from 'react'
import { menuRoutes } from './router/routes';
import './App.scss'
import { Outlet, useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();
  const [count, setCount] = useState(0)

  const dict = {
    '/': '首页',
    '/full-view': '全景图',
  }

  const renderMenuList = () => {
    const switchPage = (path: string) => {
      navigate(path);
    }
    
    return (
      <ul>
        {
          menuRoutes.map((route => {
            const path = route.path as string;
            return (
              <li key={path} onClick={() => switchPage(path) }>{ dict[path as KeysTuple<typeof dict>] }</li>
            );
          }))
        }
      </ul>
    );
  };

  return (
    <div id="app">
      <div className="menu">
        { renderMenuList() }
      </div>
      <div className="container">
        <Outlet />
      </div>
    </div>
  )
}

export default App
