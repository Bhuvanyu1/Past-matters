import React from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import PhotoSearchPage from './pages/PhotoSearchPage';
import ResultsPage from './pages/ResultsPage';
import AnalyticsPage from './pages/AnalyticsPage';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/photo-search" element={<PhotoSearchPage />} />
          <Route path="/results/:jobId" element={<ResultsPage />} />
          <Route path="/analytics/:jobId" element={<AnalyticsPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
