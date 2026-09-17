import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicNavbar } from '../public/PublicNavbar';
import { PublicFooter } from '../public/PublicFooter';

export const PublicLayout: React.FC = () => {
  return (
    <div className="public-layout">
      <PublicNavbar />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
};
