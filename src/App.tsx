import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { BottomNav } from "./components/BottomNav";
import { useSettingsStore } from "./store/settingsStore";
import { useScheduleNotifications } from "./hooks/useScheduleNotifications";
import HomePage from "./pages/Home/HomePage";
import OnboardingPage from "./pages/Onboarding/OnboardingPage";
import ItemsPage from "./pages/Items/ItemsPage";
import SetsPage from "./pages/Sets/SetsPage";
import SetEditPage from "./pages/Sets/SetEditPage";
import CalendarPage from "./pages/Calendar/CalendarPage";
import ScheduleEditPage from "./pages/Calendar/ScheduleEditPage";
import CheckRunPage from "./pages/CheckRun/CheckRunPage";
import CheckCompletePage from "./pages/CheckRun/CheckCompletePage";
import SettingsPage from "./pages/Settings/SettingsPage";

function FontSizeEffect() {
  const fontSize = useSettingsStore((s) => s.fontSize);
  useEffect(() => {
    document.documentElement.dataset.fontSize = fontSize;
  }, [fontSize]);
  return null;
}

export default function App() {
  const onboardingCompleted = useSettingsStore((s) => s.onboardingCompleted);
  const location = useLocation();
  const navigate = useNavigate();

  useScheduleNotifications((scheduleId) => navigate(`/check/from-schedule/${scheduleId}`));

  if (!onboardingCompleted && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  const showNav = location.pathname !== "/onboarding" && !location.pathname.startsWith("/check");

  return (
    <>
      <FontSizeEffect />
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/sets" element={<SetsPage />} />
        <Route path="/sets/new" element={<SetEditPage />} />
        <Route path="/sets/:setId/edit" element={<SetEditPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/calendar/new" element={<ScheduleEditPage />} />
        <Route path="/calendar/:scheduleId/edit" element={<ScheduleEditPage />} />
        <Route path="/check/from-schedule/:scheduleId" element={<CheckRunPage />} />
        <Route path="/check/session/:sessionId" element={<CheckRunPage />} />
        <Route path="/check/session/:sessionId/complete" element={<CheckCompletePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showNav && <BottomNav />}
    </>
  );
}
