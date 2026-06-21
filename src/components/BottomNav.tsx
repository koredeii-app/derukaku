import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "今日の確認", icon: "🏠" },
  { to: "/sets", label: "セット", icon: "🧳" },
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
