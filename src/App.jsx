import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CaseEntry from './pages/CaseEntry';
import Inventory from './pages/Inventory';
import Services from './pages/Services';
import FinancialDashboard from './pages/FinancialDashboard';
import ExpensesManagement from './pages/ExpensesManagement';
import PatientsManagement from './pages/PatientsManagement';
import BackupRestore from './pages/BackupRestore';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-100/70 font-['Readex_Pro'] text-slate-800 transition-colors duration-300" dir="rtl">
        {/* شريط ملاحة علوي احترافي */}
        <nav className="bg-white border-b border-slate-200/80 sticky top-0 z-50 px-6 py-3.5 flex justify-between items-center shadow-xs">
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src="/atlas-logo.png" 
              alt="شعار فريق أطلس" 
              className="w-11 h-11 object-contain rounded-xl bg-slate-50 p-1 border border-slate-100 group-hover:scale-105 transition-transform" 
            />
            <div>
              <span className="text-base font-black text-[#1e3a8a] tracking-tight block leading-tight">فريق أطلس</span>
              <span className="text-[10px] font-bold text-[#16a34a] tracking-wider uppercase block">لخدمات التمريض</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-600">
            <Link to="/" className="px-3.5 py-2 rounded-xl hover:bg-blue-50 hover:text-[#1e3a8a] transition">الرئيسية</Link>
            <Link to="/cases/new" className="px-3.5 py-2 rounded-xl hover:bg-blue-50 hover:text-[#1e3a8a] transition">حالة جديدة</Link>
            <Link to="/inventory" className="px-3.5 py-2 rounded-xl hover:bg-blue-50 hover:text-[#1e3a8a] transition">المخزون</Link>
            <Link to="/services" className="px-3.5 py-2 rounded-xl hover:bg-blue-50 hover:text-[#1e3a8a] transition">الخدمات</Link>
            <Link to="/financial" className="px-3.5 py-2 rounded-xl hover:bg-blue-50 hover:text-[#1e3a8a] transition">المالية</Link>
            <Link to="/patients-management" className="px-3.5 py-2 rounded-xl hover:bg-blue-50 hover:text-[#1e3a8a] transition">سجل المرضى</Link>
          </div>
        </nav>

        {/* محتوى الصفحات الديناميكي */}
        <main className="py-8 px-4 sm:px-6 max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cases/new" element={<CaseEntry />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/services" element={<Services />} />
            <Route path="/financial" element={<FinancialDashboard />} />
            <Route path="/expenses-management" element={<ExpensesManagement />} />
            <Route path="/patients-management" element={<PatientsManagement />} />
            <Route path="/backup-restore" element={<BackupRestore />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;