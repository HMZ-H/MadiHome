import { useState, useEffect, useRef} from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { User, Settings, LogOut, UserCircle, ChevronDown, MessageSquareText } from "lucide-react";
import { useState as useReactState } from 'react';
import ChatHubModal from './ChatHubModal';

interface UserType {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  photo: string;
}

export default function Navbar() {
  const [user, setUser] = useState<UserType | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showChatHub, setShowChatHub] = useReactState(false);

  // Load user data from localStorage
  useEffect(() => {
    const loadUserData = () => {
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user');
      if (token && userData){
        try {
          setUser(JSON.parse(userData));
        } catch (error) {
          console.error('Error parsing user data:', error)
        }
      }
    };

    // Load initial data
    loadUserData();

    // Listen for storage changes (when user data is updated)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' && e.newValue) {
        try {
          setUser(JSON.parse(e.newValue));
        } catch (error) {
          console.error('Error parsing updated user data:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setShowDropdown(false);
    window.location.href = '/';
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };
  


  // const [user, setUser] = useState<User | null>(null);
  // const [isLoading, setIsLoading] = useState(true);
  // const [showDropdown, setShowDropdown] = useState(false);
  // const dropdownRef = useRef<HTMLDivElement>(null);

  // useEffect(() => {
  //   // Check if user is logged in
  //   const token = localStorage.getItem('access_token');
  //   const userData = localStorage.getItem('user');
    
  //   if (token && userData) {
  //     try {
  //       const parsedUser = JSON.parse(userData);
  //       setUser(parsedUser);
  //     } catch (error) {
  //       console.error('Error parsing user data:', error);
  //     }
  //   }
  //   setIsLoading(false);
  // }, []);

  // Close dropdown when clicking outside
  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
  //       setShowDropdown(false);
  //     }
  //   };

  //   document.addEventListener('mousedown', handleClickOutside);
  //   return () => {
  //     document.removeEventListener('mousedown', handleClickOutside);
  //   };
  // }, []);

  // const handleLogout = () => {
  //   localStorage.removeItem('access_token');
  //   localStorage.removeItem('refresh_token');
  //   localStorage.removeItem('user');
  //   setUser(null);
  //   setShowDropdown(false);
  //   window.location.href = '/';
  // };

  // const getDashboardLink = () => {
  //   if (!user) return null;
  //   return user.role === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard';
  // };

  // const getDashboardText = () => {
  //   if (!user) return 'Dashboard';
  //   return user.role === 'doctor' ? 'Doctor Dashboard' : 'My Dashboard';
  // };

  // const toggleDropdown = () => {
  //   setShowDropdown(!showDropdown);
  // };

  return (
    <nav className="bg-white text-gray-800 px-4 py-2 flex justify-between items-center shadow-lg w-full sticky top-0 z-50 border-b border-gray-200">
      <Link to="/">
        <Logo size="md" variant="full" />
      </Link>
      
      <ul className="flex gap-8">
        <li><a href="#services" className="hover:text-emerald-600 transition-colors font-medium text-gray-700">Services</a></li>
        <li><a href="#about" className="hover:text-emerald-600 transition-colors font-medium text-gray-700">About</a></li>
        <li><a href="#contact" className="hover:text-emerald-600 transition-colors font-medium text-gray-700">Contact</a></li>
      </ul>
     {/* Login and Register */}
      <div className="flex items-center gap-3">
        {!user ? (
          <>
        <Link
          to="/login"
          className="btn-link px-5 py-2 text-emerald-600 border border-indigo-400 font-semibold rounded-lg bg-white transition-colors duration-200"
        
        >
          Login
        </Link>

        <Link
          to="/register"
          className="px-5 py-2 bg-emerald-600 text-white font-semibold rounded-lg shadow-sm hover:bg-emerald-700 transition-colors duration-200"
          style={{ color: 'white !important' }}
        >
          Register
        </Link>
        </>
         ): (
           <div className="relative" ref={dropdownRef}>
             {/* Interactive Profile Button */}
             <button
               onClick={toggleDropdown}
               className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
             >
               <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center overflow-hidden">
                 {user.photo ? (
                   <img 
                     src={user.photo} 
                     alt="Profile" 
                     className="w-full h-full object-cover"
                   />
                 ) : (
                   <User className="w-4 h-4 text-white" />
                 )}
               </div>
               <div className="text-left">
                 <p className="text-sm font-medium text-gray-900">
                   {user.first_name} {user.last_name}
                 </p>
                 <p className="text-xs text-gray-500 capitalize">
                   {user.role}
                 </p>
               </div>
               <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
             </button>

            {/* Quick AI Chat Button */}
            <button
              onClick={() => setShowChatHub(true)}
              className="ml-3 p-2 rounded-full hover:bg-gray-100"
              title="Ask AI Assistant"
            >
              <MessageSquareText className="w-5 h-5 text-emerald-600" />
            </button>

            {/* Dropdown Menu */}
             {showDropdown && (
               <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                 {/* User Info Header */}
                 <div className="px-4 py-3 border-b border-gray-100">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center overflow-hidden">
                       {user.photo ? (
                         <img 
                           src={user.photo} 
                           alt="Profile" 
                           className="w-full h-full object-cover"
                         />
                       ) : (
                         <User className="w-5 h-5 text-white" />
                       )}
                     </div>
                     <div>
                       <p className="font-medium text-gray-900">
                         {user.first_name} {user.last_name}
                       </p>
                       <p className="text-sm text-gray-500">{user.email}</p>
                     </div>
                   </div>
                 </div>

                 {/* Menu Items */}
                 <div className="py-1">
                   <Link
                     to="/profile"
                     className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                     onClick={() => setShowDropdown(false)}
                   >
                     <UserCircle className="w-4 h-4" />
                     <span>My Profile</span>
                   </Link>
                   
                   <Link
                     to={
                      user.role === 'doctor'
                        ? '/doctor-dashboard'
                        : user.role === 'super_admin'
                        ? '/super-admin-dashboard'
                        : '/patient-dashboard'
                    }
                    onClick={() => setShowDropdown(false)}
                     className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                   >
                     <Settings className="w-4 h-4" />
                     <span>
                        {user.role === 'doctor'
                          ? 'Doctor Dashboard'
                          : user.role === 'super_admin'
                          ? 'Super Admin Dashboard'
                          : 'My Dashboard'}
                      </span>
                   </Link>
                 </div>

                 {/* Logout Button */}
                 <div className="border-t border-gray-100 pt-1">
                   <button
                     onClick={handleLogout}
                     className="flex items-center gap-3 px-4 py-2 w-full text-left text-red-600 hover:bg-red-50 transition-colors"
                   >
                     <LogOut className="w-4 h-4" />
                     <span>Logout</span>
                   </button>
                 </div>
               </div>
             )}
           </div>
         )}
      </div>

      {/* AI Chat Modal */}
      <ChatHubModal isOpen={showChatHub} onClose={() => setShowChatHub(false)} roomId={1} />

       
    </nav>
  );
}
