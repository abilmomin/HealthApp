import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Dumbbell, Apple, Target, Users, Award, User, LogOut, Menu, X, Leaf
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/workouts', icon: Dumbbell, label: 'Workouts' },
  { to: '/nutrition', icon: Apple, label: 'Nutrition' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/social', icon: Users, label: 'Social' },
  { to: '/achievements', icon: Award, label: 'Achievements' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar() {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-[#5b9a3c]/15">
        <div className="flex items-center gap-3">
          <Leaf className="w-8 h-8 text-[#8bc34a]" />
          <span className="text-xl font-bold font-['Barlow_Condensed'] uppercase tracking-wider text-white">
            Healthmax
          </span>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium font-['Manrope'] transition-all duration-200 ${
                isActive
                  ? 'bg-[#5b9a3c] text-white'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#5b9a3c]/10'
              }`
            }
            data-testid={`nav-${item.label.toLowerCase()}`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-[#5b9a3c]/15">
        <div className="flex items-center gap-3 px-4 py-2 mb-2">
          {profile?.photo_url ? (
            <img src={profile.photo_url} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#5b9a3c] flex items-center justify-center text-white text-sm font-bold">
              {(profile?.display_name || 'U')[0].toUpperCase()}
            </div>
          )}
          <span className="text-sm text-[#c0ccb8] truncate font-['Manrope']">
            {profile?.display_name || 'User'}
          </span>
        </div>
        <button
          onClick={handleLogout}
          data-testid="logout-button"
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm text-[#94a3b8] hover:text-white hover:bg-[#5b9a3c]/10 transition-colors font-['Manrope']"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-[#162618] border border-[#5b9a3c]/20 p-2 rounded-lg text-white"
        data-testid="mobile-menu-toggle"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-[#12201a] border-r border-[#5b9a3c]/15 z-40 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <SidebarContent />
      </aside>
    </>
  );
}
