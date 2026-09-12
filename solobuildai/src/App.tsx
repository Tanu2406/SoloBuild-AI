import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/ui/Layout';
import { ToastProvider } from './components/ui/Toast';
import { AppProvider } from './store/appStore';

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

// Styles
import './styles/global.css';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <ToastProvider>
          <Routes>
            {/* Create Hiring: full-screen flow, no sidebar */}
            <Route path="/hiring/create" element={<CreateHiring />} />

            {/* Screening progress: full-screen, no sidebar */}
            <Route path="/hiring/:id/screening" element={<ScreeningProgress />} />

            {/* Main app shell with sidebar */}
            <Route
              path="/*"
              element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/hiring" element={<Hiring />} />
                    <Route path="/hiring/:id" element={<HiringWorkspace />} />
                    <Route path="/candidates" element={<Candidates />} />
                    <Route path="/candidates/:id" element={<CandidateDetail />} />
                    <Route path="/recruiters" element={<AIRecruiters />} />
                    <Route path="/interviews" element={<Interviews />} />
                    <Route path="/activity" element={<Activity />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/screening-reports" element={<ScreeningReports />} />
                    <Route path="/screening-reports/:hiringId" element={<ScreeningReportHiring />} />
                    <Route path="/screening-reports/:hiringId/candidate/:candidateId" element={<CandidateScreeningReport />} />
                  </Routes>
                </Layout>
              }
            />
          </Routes>
        </ToastProvider>
      </AppProvider>
    </BrowserRouter>
  );
};

export default App;
