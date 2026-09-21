import { Navigate, Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ScrollManager } from "./components/ScrollManager";
import Calculator from "./pages/Calculator";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Assumptions from "./pages/Assumptions";
import Disclaimer from "./pages/Disclaimer";
import EducationLoanPrepayment from "./pages/EducationLoanPrepayment";
import ExtraMonthlyLoanPayment from "./pages/ExtraMonthlyLoanPayment";
import LumpSumLoanPrepayment from "./pages/LumpSumLoanPrepayment";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollManager />
      <Header />
      <Routes>
        <Route path="/" element={<Calculator />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/assumptions" element={<Assumptions />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/education-loan-prepayment" element={<EducationLoanPrepayment />} />
        <Route path="/extra-monthly-loan-payment" element={<ExtraMonthlyLoanPayment />} />
        <Route path="/lump-sum-loan-prepayment" element={<LumpSumLoanPrepayment />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </div>
  );
}