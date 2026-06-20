import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "今日の予定", icon: "🏠" },
  { to: "/calendar", label: "カレンダー", icon: "📅" },
  { to: "/sets", label: "セット", icon: "🧳" },
  { to: "/items", label: "項目", icon: "📝" },
  { to: "/settings", label: "設定", icon: "⚙️" },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <span className="icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
