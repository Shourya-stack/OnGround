import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PublicNavbar } from '../public/PublicNavbar';
import { PublicFooter } from '../public/PublicFooter';

export const PublicLayout: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="public-layout">
      {!isHomePage && <PublicNavbar />}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
};
