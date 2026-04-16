import { useEffect } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TopicIntroPage from './pages/TopicIntroPage';
import MyRoomsPage from './pages/MyRoomsPage';
import GamePage from './pages/GamePage';
import CustomGamePage from './pages/CustomGamePage';
import InvitePage from './pages/InvitePage';
import JoinPage from './pages/JoinPage';
import WaitingPage from './pages/WaitingPage';
import ResultPage from './pages/ResultPage';
import TopBannerAd from './components/TopBannerAd';

// AIT 딥링크가 pathname으로 전달되는 경우 hash route로 리다이렉트
function DeepLinkRedirect() {
  useEffect(() => {
    const { pathname, search } = window.location;
    if (pathname && pathname !== '/' && !window.location.hash) {
      window.location.replace(`${window.location.origin}/#${pathname}${search}`);
    }
  }, []);
  return null;
}

export default function App() {
  return (
    <HashRouter>
      <DeepLinkRedirect />
      <TopBannerAd />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/intro" element={<TopicIntroPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/custom" element={<CustomGamePage />} />
        <Route path="/invite/:shortCode" element={<InvitePage />} />
        {/* /join/:shortCode — 딥링크 intoss://couple-balance-game/join/ABC123 */}
        <Route path="/join/:shortCode" element={<JoinPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/waiting/:shortCode" element={<WaitingPage />} />
        <Route path="/result/:shortCode" element={<ResultPage />} />
        <Route path="/my-rooms" element={<MyRoomsPage />} />
      </Routes>
    </HashRouter>
  );
}
