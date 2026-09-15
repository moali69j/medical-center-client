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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-['Cairo'] transition-colors duration-300">
        {/* شريط ملاحة علوي فاخر مطابق لهوية أطلس الطبية */}
        <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800 shadow-xs px-6 py-3.5 flex justify-between items-center" dir="rtl">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1e3a8a] to-[#16a34a] flex items-center justify-center text-white font-black text-lg shadow-md group-hover:scale-105 transition-transform">
              🩺
            </div>
            <div>
              <span className="text-base font-black text-[#1e3a8a] dark:text-blue-400 tracking-tight block leading-tight">فريق أطلس</span>
              <span className="text-[10px] font-bold text-[#16a34a] tracking-wider uppercase block">لخدمات التمريض</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
            <Link to="/" className="px-3.5 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-[#1e3a8a] dark:hover:text-blue-400 transition">الرئيسية</Link>
            <Link to="/cases/new" className="px-3.5 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-[#1e3a8a] dark:hover:text-blue-400 transition">حالة جديدة</Link>
            <Link to="/inventory" className="px-3.5 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-[#1e3a8a] dark:hover:text-blue-400 transition">المخزون</Link>
            <Link to="/services" className="px-3.5 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-[#1e3a8a] dark:hover:text-blue-400 transition">الخدمات</Link>
            <Link to="/financial" className="px-3.5 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-[#1e3a8a] dark:hover:text-blue-400 transition">المالية</Link>
            <Link to="/patients-management" className="px-3.5 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-[#1e3a8a] dark:hover:text-blue-400 transition">المرضى</Link>
          </div>
        </nav>

        {/* محتوى الصفحات الديناميكي */}
        <div className="py-8 px-4 sm:px-6">
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
        </div>
      </div>
    </Router>
  );
}

export default App;