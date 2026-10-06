import React, { useEffect, useState } from 'react';
import {
BrowserRouter,
Routes,
Route,
Navigate,
useLocation,
useNavigate,
} from 'react-router-dom';

import { Layout } from './components/ui/Layout';
import { ToastProvider } from './components/ui/Toast';
import { AppProvider } from './store/appStore';
import { authService } from './services/authService';
import { clearAuthTokens, readAuthTokens } from './services/api';

// Pages
import Home from './pages/Home';
import Hiring from './pages/Hiring';
import CreateHiring from './pages/CreateHiring';
import HiringWorkspace from './pages/HiringWorkspace';
import ScreeningProgress from './pages/ScreeningProgress';
import Candidates from './pages/Candidates';
import CandidateDetail from './pages/CandidateDetail';
import AIRecruiters from './pages/AIRecruiters';
import Interviews from './pages/Interviews';
import Activity from './pages/Activity';
import Settings from './pages/Settings';
import ScreeningReports from './pages/ScreeningReports';
import ScreeningReportHiring from './pages/ScreeningReportHiring';
import CandidateScreeningReport from './pages/CandidateScreeningReport';
import Sales from './pages/Sales';
import AuthPage from './pages/Auth';

// Styles
import './styles/global.css';

const ProtectedDashboard: React.FC<{ children: React.ReactNode }> = ({
children,
}) => {
const location = useLocation();
const navigate = useNavigate();

const [ready, setReady] = useState(false);
const [isAuthenticated, setIsAuthenticated] = useState(false);

useEffect(() => {
const verifyAuth = async () => {
const tokens = readAuthTokens();

```
  if (!tokens) {
    setIsAuthenticated(false);
    setReady(true);
    navigate('/login', { replace: true });
    return;
  }

  try {
    await authService.getCurrentUser();
    setIsAuthenticated(true);
  } catch {
    clearAuthTokens();
    setIsAuthenticated(false);
    navigate('/login', { replace: true });
  } finally {
    setReady(true);
  }
};

verifyAuth();
```

}, [location.pathname, navigate]);

if (!ready) {
return (
<div
className="page-content animate-fade-in"
style={{
display: 'grid',
placeItems: 'center',
minHeight: '100vh',
}}
>
<div
style={{
fontSize: 'var(--font-size-md)',
color: 'var(--text-secondary)',
}}
>
Checking session… </div> </div>
);
}

if (!isAuthenticated) {
return <Navigate to="/login" replace />;
}

return <>{children}</>;
};

const AppRoutes: React.FC = () => {
return ( <Routes>
{/* Authentication */}
<Route path="/login" element={<AuthPage mode="login" />} />
<Route path="/register" element={<AuthPage mode="register" />} />

```
  {/* Full-screen hiring flows */}
  <Route
    path="/hiring/create"
    element={
      <ProtectedDashboard>
        <CreateHiring />
      </ProtectedDashboard>
    }
  />

  <Route
    path="/hiring/:id/screening"
    element={
      <ProtectedDashboard>
        <ScreeningProgress />
      </ProtectedDashboard>
    }
  />

  {/* Main application */}
  <Route
    path="/*"
    element={
      <ProtectedDashboard>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/hiring" element={<Hiring />} />
            <Route
              path="/hiring/:id"
              element={<HiringWorkspace />}
            />
            <Route path="/candidates" element={<Candidates />} />
            <Route
              path="/candidates/:id"
              element={<CandidateDetail />}
            />
            <Route
              path="/recruiters"
              element={<AIRecruiters />}
            />
            <Route
              path="/interviews"
              element={<Interviews />}
            />
            <Route path="/activity" element={<Activity />} />
            <Route path="/settings" element={<Settings />} />

            <Route
              path="/screening-reports"
              element={<ScreeningReports />}
            />

            <Route
              path="/screening-reports/:hiringId"
              element={<ScreeningReportHiring />}
            />

            <Route
              path="/screening-reports/:hiringId/candidate/:candidateId"
              element={<CandidateScreeningReport />}
            />

            {/* Sales */}
            <Route path="/sales/*" element={<Sales />} />
          </Routes>
        </Layout>
      </ProtectedDashboard>
    }
  />
</Routes>
```

);
};

const App: React.FC = () => {
return ( <BrowserRouter> <AppProvider> <ToastProvider> <AppRoutes /> </ToastProvider> </AppProvider> </BrowserRouter>
);
};

export default App;
