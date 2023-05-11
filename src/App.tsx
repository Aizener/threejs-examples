import { useState } from 'react'
import { menuRoutes } from './router/routes';
import './App.scss'
import { Outlet, useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();
  const [isToggle, setIsToggle] = useState(false);

  const dict = {
    '/': '首页',
    '/full-view': '暂住小区全景图',
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
      <div className="menu" style={{ transform: `translateX(${isToggle ? 0 : '-100%'})`}}>
        { renderMenuList() }
        <div className="menu-toggle-btn" onClick={() => setIsToggle(!isToggle)}>
          <div className="line"></div>
          <div className="line"></div>
          <div className="line"></div>
        </div>
      </div>
      <div className="container">
        <Outlet />
      </div>
    </div>
  )
}

export default App
