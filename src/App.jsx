import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import ScrollToTop from "./components/ScrollToTop";
// Add page imports here
import SiteLayout from "@/components/SiteLayout";
import Home from "@/pages/Home";
import Explore from "@/pages/Explore";
import BlueprintDetail from "@/pages/BlueprintDetail";
import CreatorProfile from "@/pages/CreatorProfile";
import Categories from "@/pages/Categories";
import Support from "@/pages/Support";
import Plans from "@/pages/Plans";
import AccountLayout from "@/components/account/AccountLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import PortalRoute from "@/components/PortalRoute";
import { ProfileProvider } from "@/lib/ProfileContext";
import PortalRedirect from "@/pages/PortalRedirect";
import CreatorDashboard from "@/pages/CreatorDashboard";
import MyDashboard from "@/pages/MyDashboard";
import SavedBlueprints from "@/pages/SavedBlueprints";
import ProjectTracker from "@/pages/ProjectTracker";
import PurchaseHistory from "@/pages/PurchaseHistory";
import Consultations from "@/pages/Consultations";
import CompareBlueprints from "@/pages/CompareBlueprints";
import BlueprintBuilder from "@/pages/BlueprintBuilder";
import CreatorEarnings from "@/pages/CreatorEarnings";
import PayoutSettings from "@/pages/PayoutSettings";
import AdminConsole from "@/pages/AdminConsole";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Mfa from "@/pages/Mfa";
import BlueprintLibrary from "@/pages/BlueprintLibrary";
import MentorMarketplace from "@/pages/MentorMarketplace";
import BookConsultation from "@/pages/BookConsultation";
import MilestoneManager from "@/pages/MilestoneManager";
import MarketplaceInsights from "@/pages/MarketplaceInsights";
import AccountSettings from "@/pages/AccountSettings";
import BusinessRoadmap from "@/pages/BusinessRoadmap";
import RevenueCalculator from "@/pages/RevenueCalculator";
import InvestmentAnalytics from "@/pages/InvestmentAnalytics";
import ProjectBudget from "@/pages/ProjectBudget";
import MyPurchases from "@/pages/MyPurchases";
import MyConsultations from "@/pages/MyConsultations";
import CreatorAnalytics from "@/pages/CreatorAnalytics";
import SupportTickets from "@/pages/SupportTickets";
import Guidelines from "@/pages/Guidelines";
const AuthenticatedApp = () => {
  const {
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    user,
    session,
    authChecked,
  } = useAuth();

  console.log("AUTH DEBUG:", {
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    authChecked,
    isAuthenticated: !!user,
    hasSession: !!session,
    currentPath: window.location.pathname,
  });

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === "user_not_registered") {
      return <UserNotRegisteredError />;
    } else if (authError.type === "auth_required") {
      return <Navigate to="/login" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Add your page Route elements here */}
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/blueprint/:slug" element={<BlueprintDetail />} />
        <Route path="/creator/:slug" element={<CreatorProfile />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/support" element={<Support />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/blueprints" element={<BlueprintLibrary />} />
        <Route path="/help-center" element={<Support />} />
        <Route path="/guidelines" element={<Guidelines />} />
        <Route path="/subscription-plans" element={<Plans />} />

        <Route element={<AccountLayout />}>
          <Route path="/compare-blueprints" element={<CompareBlueprints />} />
          <Route path="/blueprint-comparison" element={<CompareBlueprints />} />

          {/* Seeker portal — any signed-in role */}
          <Route element={<PortalRoute roles={["user", "creator", "admin"]} />}>
            <Route path="/my-dashboard" element={<MyDashboard />} />
            <Route path="/saved-blueprints" element={<SavedBlueprints />} />
            <Route path="/project-tracker" element={<ProjectTracker />} />
            <Route path="/purchase-history" element={<PurchaseHistory />} />
            <Route path="/consultations" element={<Consultations />} />
            <Route path="/mentorship-requests" element={<Consultations />} />
            <Route path="/mentor-marketplace" element={<MentorMarketplace />} />
            <Route path="/book-consultation" element={<BookConsultation />} />
            <Route path="/milestone-manager" element={<MilestoneManager />} />
            <Route
              path="/marketplace-insights"
              element={<MarketplaceInsights />}
            />
            <Route path="/account-settings" element={<AccountSettings />} />
            <Route path="/business-roadmap" element={<BusinessRoadmap />} />
            <Route path="/revenue-calculator" element={<RevenueCalculator />} />
            <Route path="/project-budget" element={<ProjectBudget />} />
            <Route
              path="/investment-analytics"
              element={<InvestmentAnalytics />}
            />
            <Route path="/my-purchases" element={<MyPurchases />} />
            <Route path="/my-consultations" element={<MyConsultations />} />
            <Route path="/support-tickets" element={<SupportTickets />} />
          </Route>

          {/* Creator portal */}
          <Route element={<PortalRoute roles={["creator", "admin"]} />}>
            <Route path="/creator-dashboard" element={<CreatorDashboard />} />
            <Route path="/blueprint-builder" element={<BlueprintBuilder />} />
            <Route path="/creator-earnings" element={<CreatorEarnings />} />
            <Route path="/payout-settings" element={<PayoutSettings />} />
            <Route path="/creator-analytics" element={<CreatorAnalytics />} />
          </Route>

          {/* Admin portal */}
          <Route element={<PortalRoute roles={["admin"]} />}>
            <Route path="/admin-console" element={<AdminConsole />} />
            <Route path="/admin-moderation" element={<AdminConsole />} />
          </Route>
        </Route>
      </Route>
      <Route
        element={
          <ProtectedRoute
            unauthenticatedElement={<Navigate to="/login" replace />}
          />
        }
      >
        <Route path="/portal" element={<PortalRedirect />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/mfa" element={<Mfa />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClientInstance}>
        <AuthProvider>
          <ProfileProvider>
            <ScrollToTop />
            <AuthenticatedApp />
            <Toaster />
          </ProfileProvider>
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App;
