import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "katex/dist/katex.min.css";
import "./App.css";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import ProfileDetails from "./pages/ProfileDetails";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/stream" element={<HomePage />} />
          <Route path="/profile" element={<ProfileDetails />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
