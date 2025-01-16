import { NavLink } from 'react-router-dom';
import { 
  Home, Database, Brain, Users, Settings, BarChart, X,
  
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Knowledge Base', href: '/knowledge-base', icon: Database },
  { name: 'Models', href: '/models', icon: Brain },
  { name: 'User Management', href: '/users', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Analytics', href: '/analytics', icon: BarChart },
  { name: 'Chats', href: '/chats', icon: Users  },
];

export default function Sidebar({ open, setOpen }: { 
  open: boolean; 
  setOpen: (open: boolean) => void;
}) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden ${
          open ? 'opacity-100 z-40' : 'opacity-0 -z-10'
        }`}
        onClick={() => setOpen(false)}
      />

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white transition duration-200 ease-in-out lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <Bot className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">AI Admin</span>
          </div>
          <button
            type="button"
            className="lg:hidden"
            onClick={() => setOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div> */}
        <div className="flex h-16 items-center justify-between px-4">
  <div className="flex items-center space-x-2">
    <img src="digiyatra-footernew.png" alt="AI Admin" className="h-7 " />
    {/* <span className="text-xl font-bold text-gray-900">Admin AI</span> */}
  </div>
  <button
    type="button"
    className="lg:hidden"
    onClick={() => setOpen(false)}
  >
    <X className="h-6 w-6" />
  </button>
</div>


        <nav className="mt-4 space-y-1 px-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
}