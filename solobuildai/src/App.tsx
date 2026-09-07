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
import Candidates from './pages/Candidates';
import CandidateDetail from './pages/CandidateDetail';
import AIRecruiters from './pages/AIRecruiters';
import Activity from './pages/Activity';
import Settings from './pages/Settings';

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
                    <Route path="/activity" element={<Activity />} />
                    <Route path="/settings" element={<Settings />} />
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
