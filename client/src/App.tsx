import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { ImmobilienListe } from "./pages/ImmobilienListe";
import { ImmobilieDetail } from "./pages/ImmobilieDetail";
import { ImmobilieForm } from "./pages/ImmobilieForm";
import { CsvImport } from "./pages/CsvImport";
import { Settings } from "./pages/Settings";
import { NotFound } from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/immobilien" element={<ImmobilienListe />} />
        <Route path="/immobilien/neu" element={<ImmobilieForm />} />
        <Route path="/immobilien/:id" element={<ImmobilieDetail />} />
        <Route path="/immobilien/:id/bearbeiten" element={<ImmobilieForm />} />
        <Route path="/csv-import" element={<CsvImport />} />
        <Route path="/einstellungen" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
