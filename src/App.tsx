import { Route, Routes } from "react-router-dom";
import ToiletPage from "./app/toilets/page";
import AddToiletPage from "./app/add/page";
import AdminPage from "./app/admin/page";
import HomePage from "./app/page";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/toilets" element={<ToiletPage />} />
      <Route path="/add" element={<AddToiletPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}

export default App;
