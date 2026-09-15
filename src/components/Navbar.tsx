import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Users,
  Calendar,
  Clock,
  DollarSign,
  HandCoins,
  FileText,
  History as HistoryIcon,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  ChevronRight,
  User,
} from "lucide-react";
import logo from "../assets/Firefly Logo - No BG.png";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role") || "Employee";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  // Grouped Navigation Hierarchy
  const navSections: NavSection[] = [
    {
      items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      title: "Time & Attendance",
      items: [
        { to: "/timesheet", label: "Timesheet", icon: FileText },
        { to: "/leaves", label: "Leaves", icon: Calendar },
        { to: "/overtime", label: "Overtime", icon: Clock },
        { to: "/history", label: "History", icon: HistoryIcon },
      ],
    },
    {
      title: "Finance & Payroll",
      items: [
        { to: "/cash-advances", label: "Advances", icon: HandCoins },
        ...(role === "Admin"
          ? [{ to: "/payroll", label: "Payroll", icon: DollarSign }]
          : []),
      ],
    },
    ...(role === "Admin"
      ? [
          {
            title: "Administration",
            items: [
              { to: "/employees", label: "Employees", icon: Users },
              { to: "/holidays", label: "Holidays", icon: Calendar },
            ],
          },
        ]
      : []),
    {
      title: "Account",
      items: [{ to: "/profile", label: "Profile", icon: User }],
    },
  ];

  const renderNavSection = (section: NavSection, isMobile = false) => (
    <div key={section.title || "main"} className="space-y-1">
      {section.title && (
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-4 mb-1">
          {section.title}
        </p>
      )}
      {section.items.map((link) => {
        const Icon = link.icon;
        const active = isActive(link.to);
        return (
          <Link
            key={link.to}
            to={link.to}
            onClick={() => isMobile && setIsOpen(false)}
            className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
              active
                ? "bg-(--primary) text-slate-950 shadow-xs font-bold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon
                size={18}
                className={active ? "text-slate-950" : "text-slate-400"}
              />
              <span>{link.label}</span>
            </div>
            {active && <ChevronRight size={14} className="text-slate-950/70" />}
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-2.5 flex justify-between items-center shadow-2xs">
        <div
          className="flex items-center gap-2 cursor-pointer py-0.5"
          onClick={() => navigate("/dashboard")}
        >
          <img
            src={logo}
            alt="Firefly Logo"
            className="h-9 w-auto object-contain"
          />
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-hidden"
          aria-label="Open Menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Overlay & Drawer with CSS Transitions */}
      <div
        className={`md:hidden fixed inset-0 z-50 flex transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
          onClick={() => setIsOpen(false)}
        />

        {/* Sliding Drawer */}
        <div
          className={`relative bg-white w-64 max-w-xs h-full flex flex-col p-4 shadow-xl border-r border-slate-200 z-10 transform transition-transform duration-300 ease-in-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex justify-between items-center pb-4 mb-2 border-b border-slate-100">
            <div className="flex items-center">
              <img
                src={logo}
                alt="Firefly Logo"
                className="h-10 w-auto object-contain"
              />
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
              aria-label="Close Menu"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto space-y-2 pr-1">
            {navSections.map((section) => renderNavSection(section, true))}
          </nav>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between px-3">
              <span className="text-xs font-medium text-slate-500">Role</span>
              <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded uppercase border border-slate-200">
                {role}
              </span>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="flex items-center gap-2 text-rose-600 text-sm font-medium w-full px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <LogOut size={16} /> Logout System
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Vertical Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-white h-screen sticky top-0 shrink-0">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100 flex flex-col items-center justify-center text-center space-y-1">
          <div
            className="w-full h-16 flex items-center justify-center cursor-pointer"
            onClick={() => navigate("/dashboard")}
          >
            <img
              src={logo}
              alt="Firefly Logo"
              className="h-full w-auto object-contain"
            />
          </div>
          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Management Suite
          </p>
        </div>

        {/* Grouped Navigation Links */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-1">
          {navSections.map((section) => renderNavSection(section))}
        </nav>

        {/* User Role & Logout Panel */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 m-3 rounded-xl border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Access Level
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-white text-slate-700 font-bold rounded-md border border-slate-200 uppercase tracking-wider">
              {role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full text-slate-600 hover:text-rose-600 text-xs font-semibold transition-colors cursor-pointer pt-1"
          >
            <LogOut size={15} /> Sign Out Account
          </button>
        </div>
      </aside>
    </>
  );
}
