import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
// import App from './App.tsx';
import '@patternfly/react-core/dist/styles/base.css';
import '@patternfly/patternfly/patternfly.css';
import '@patternfly/chatbot/dist/css/main.css';
// import './fonts.css';
import { ChatbotComponent } from './components/ChatbotComponent';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Router>
            <Routes>
                {/* Chat route with sessionId */}
                <Route path="/chat/:sessionId?" element={<ChatbotComponent />} />
                <Route path="*" element={<Navigate to="/chat" replace />} />
            </Routes>
        </Router>
        {/* <App /> */}
    </StrictMode>
);
