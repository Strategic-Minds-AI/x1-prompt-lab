import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout.jsx';
import { LangProvider } from './lib/LangContext';
import Dashboard from './pages/Dashboard';
import MultiSource from './pages/MultiSource';
import StructuredExtraction from './pages/StructuredExtraction';
import TextTransform from './pages/TextTransform';
import ChainPrompting from './pages/ChainPrompting';
import WebEnriched from './pages/WebEnriched';
import ImageAnalysis from './pages/ImageAnalysis';
import Playground from './pages/Playground';
import WebScraper from './pages/WebScraper';
import PdfExtraction from './pages/PdfExtraction';
import BiasDetection from './pages/BiasDetection';
import HallucinationLab from './pages/HallucinationLab';
import OverconfidenceLab from './pages/OverconfidenceLab';
import ReActAgent from './pages/ReActAgent';
import PromptStudio from './pages/PromptStudio';
import PromptLibrary from './pages/PromptLibrary';
import ModelCompare from './pages/ModelCompare';
import { ThemeProvider } from '@/lib/ThemeContext';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

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
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/prompt-studio" element={<PromptStudio />} />
        <Route path="/prompt-library" element={<PromptLibrary />} />
        <Route path="/model-compare" element={<ModelCompare />} />
        <Route path="/multi-source" element={<MultiSource />} />
        <Route path="/structured-extraction" element={<StructuredExtraction />} />
        <Route path="/text-transform" element={<TextTransform />} />
        <Route path="/chain-prompting" element={<ChainPrompting />} />
        <Route path="/web-enriched" element={<WebEnriched />} />
        <Route path="/image-analysis" element={<ImageAnalysis />} />
        <Route path="/web-scraper" element={<WebScraper />} />
        <Route path="/pdf-extraction" element={<PdfExtraction />} />
        <Route path="/bias-detection" element={<BiasDetection />} />
        <Route path="/hallucination-lab" element={<HallucinationLab />} />
        <Route path="/overconfidence-lab" element={<OverconfidenceLab />} />
        <Route path="/react-agent" element={<ReActAgent />} />
        <Route path="/playground" element={<Playground />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <ThemeProvider>
      <LangProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </LangProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App