import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { MobileNav } from './MobileNav';

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container pb-24 pt-4">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}
