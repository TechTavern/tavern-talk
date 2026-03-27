import { Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { Synthesis } from './pages/Synthesis';
import { Voices } from './pages/Voices';
import { History } from './pages/History';
import { Settings } from './pages/Settings';

export function App() {
  return (
    <>
      <Sidebar />
      <main className="main">
        <TopNav />
        <Routes>
          <Route path="/" element={<Synthesis />} />
          <Route path="/voices" element={<Voices />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </>
  );
}
