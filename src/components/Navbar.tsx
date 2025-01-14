import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white shadow">
      <div className="flex items-center justify-between px-4 py-4">
        <button
          type="button"
          className="text-gray-500 lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="flex items-center space-x-4 ml-auto">
          <button className="text-gray-500 hover:text-gray-700">
            <Bell className="h-6 w-6" />
          </button>
          
          <div className="relative">
            <button
              type="button"
              className="flex items-center space-x-3 focus:outline-none"
            >
              <img
                className="h-8 w-8 rounded-full"
                src={`https://ui-avatars.com/api/?name=${user?.email}&background=random`}
                alt=""
              />
              <span className="text-sm font-medium text-gray-700">
                {user?.email}
              </span>
            </button>
          </div>

          <button
            onClick={() => signOut()}
            className="text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}