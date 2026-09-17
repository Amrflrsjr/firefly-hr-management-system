import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import api from "../services/api";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  showBadge?: boolean;
  notificationType?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState<{ [key: string]: number }>({
    Leave: 0,
    Overtime: 0,
    Advance: 0,
    Payroll: 0,
  });

  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role") || "Employee";
  const employeeId = localStorage.getItem("employeeId");

  useEffect(() => {
    if (!employeeId) return;

    const fetchCounts = async () => {
      try {
        const [leaveRes, otRes, advRes, payrollRes] = await Promise.all([
          api.get(`/Notifications/unread-count/${employeeId}?type=Leave`),
          api.get(`/Notifications/unread-count/${employeeId}?type=Overtime`),
          api.get(`/Notifications/unread-count/${employeeId}?type=Advance`),
          api.get(`/Notifications/unread-count/${employeeId}?type=Payroll`),
        ]);

        setBadgeCounts({
          Leave: leaveRes.data || 0,
          Overtime: otRes.data || 0,
          Advance: advRes.data || 0,
          Payroll: payrollRes.data || 0,
        });
      } catch {
        // Fail silently
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 10000);
    return () => clearInterval(interval);
  }, [employeeId]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleNavClick = async (
    e: React.MouseEvent,
    path: string,
    notifType?: string,
    isMobile = false,
  ) => {
    e.preventDefault();
    if (isMobile) setIsOpen(false);

    if (employeeId && notifType && badgeCounts[notifType] > 0) {
      try {
        await api.put(
          `/Notifications/mark-type-read/${employeeId}?type=${notifType}`,
        );
        setBadgeCounts((prev) => ({ ...prev, [notifType]: 0 }));
      } catch {
        // Fail silently
      }
    }
    navigate(path);
  };

  const isActive = (path: string) => location.pathname === path;

  const navSections: NavSection[] = [
    {
      items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      title: "Time & Attendance",
      items: [
        { to: "/timesheet", label: "Timesheet", icon: FileText },
        {
          to: "/leaves",
          label: "Leaves",
          icon: Calendar,
          showBadge: true,
          notificationType: "Leave",
        },
        {
          to: "/overtime",
          label: "Overtime",
          icon: Clock,
          showBadge: true,
          notificationType: "Overtime",
        },
        {
          to: "/history",
          label: "History",
          icon: HistoryIcon,
          showBadge: true,
          notificationType: "Payroll",
        },
      ],
    },
    {
      title: "Finance & Payroll",
      items: [
        {
          to: "/cash-advances",
          label: "Advances",
          icon: HandCoins,
          showBadge: true,
          notificationType: "Advance",
        },
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
        const count = link.notificationType
          ? badgeCounts[link.notificationType]
          : 0;

        return (
          <a
            key={link.to}
            href={link.to}
            onClick={(e) =>
              handleNavClick(e, link.to, link.notificationType, isMobile)
            }
            className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
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

            {link.showBadge && count > 0 ? (
              <span className="flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
                {count > 9 ? "9+" : count}
              </span>
            ) : (
              active && <ChevronRight size={14} className="text-slate-950/70" />
            )}
          </a>
        );
      })}
    </div>
  );

  return (
    <>
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-hidden cursor-pointer"
            aria-label="Open Menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      <div
        className={`md:hidden fixed inset-0 z-50 flex transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
          onClick={() => setIsOpen(false)}
        />

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
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
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
              className="flex items-center gap-2 text-rose-600 text-sm font-medium w-full px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut size={16} /> Logout System
            </button>
          </div>
        </div>
      </div>

      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-white h-screen sticky top-0 shrink-0">
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

        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-1">
          {navSections.map((section) => renderNavSection(section))}
        </nav>

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
