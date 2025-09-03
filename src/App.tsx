import { Route, Routes } from "react-router-dom";
import ToiletPage from "./app/toilets/page";
import AddToiletPage from "./app/add/page";
import AdminPage from "./app/admin/page";
import HomePage from "./app/page";
import LoginPage from "./app/login/page";
import RegisterPage from "./app/register/page";
import PrivacyPolicyPage from "./app/privacy/page";
import TermsPage from "./app/terms/page";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/toilets" element={<ToiletPage />} />
      <Route path="/add" element={<AddToiletPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsPage />} />
    </Routes>
  );
}

export default App;
