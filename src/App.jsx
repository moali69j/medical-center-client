import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CaseEntry from './pages/CaseEntry';
import Inventory from './pages/Inventory';
import Services from './pages/Services';
import FinancialDashboard from './pages/FinancialDashboard';
import ExpensesManagement from './pages/ExpensesManagement';
import PatientsManagement from './pages/PatientsManagement';
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* شريط ملاحة علوي بسيط (Navbar) */}
        <nav className="bg-white shadow-sm border-b p-4 flex justify-between items-center" dir="rtl">
          <Link to="/" className="text-xl font-bold text-blue-700">⚙️ نظام المركز الطبي</Link>
          <div className="flex gap-4">
            <Link to="/" className="text-gray-600 hover:text-blue-600">الرئيسية</Link>
            <Link to="/cases/new" className="text-gray-600 hover:text-blue-600">حالة جديدة</Link>
            <Link to="/inventory" className="text-gray-600 hover:text-blue-600">المخزون</Link>
            <Link to="/services" className="text-gray-600 hover:text-blue-600">الخدمات</Link>
            <Link to="/financial" className="text-gray-600 hover:text-blue-600">المالية</Link>
          </div>
        </nav>

        {/* محتوى الصفحات الديناميكي */}
        <div className="py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cases/new" element={<CaseEntry />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/services" element={<Services />} />
            <Route path="/financial" element={<FinancialDashboard />} />
            <Route path="/expenses-management" element={<ExpensesManagement />} />
            <Route path="/patients-management" element={<PatientsManagement />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;