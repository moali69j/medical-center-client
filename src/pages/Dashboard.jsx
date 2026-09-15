import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Dashboard = () => {
    const navigate = useNavigate();
    const { isDarkMode, toggleTheme } = useTheme();

    const medicalSection = [
        { title: 'إضافة حالة جديدة', desc: 'تسجيل زيارة مريض، تشخيص سريري، إدخال العمر وسحب المستهلكات آلياً', path: 'cases/new', icon: '🩺', badge: 'طبي مباشر', badgeColor: 'bg-blue-500/10 text-[#1e3a8a] dark:text-blue-400 border-blue-500/20' },
        { title: 'أرشيف سجلات المرضى', desc: 'البحث عن المرضى واستعراض الملف التاريخي والعمر والتشخيص لكل مريض', path: 'patients-management', icon: '👥', badge: 'سجلات حية', badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
    ];

    const managementSection = [
        { title: 'لوحة التحكم المالية', desc: 'تحليل الأرباح، رصد الإيرادات، وتصدير تقارير Excel', path: 'financial', icon: '📊', badge: 'الخزنة المركزية', badgeColor: 'bg-emerald-500/10 text-[#16a34a] dark:text-emerald-400 border-emerald-500/20' },
        { title: 'إدارة الخزنة والمصاريف', desc: 'تسجيل رواتب الموظفين، فواتير التشغيل وتصفية حصص الممرضين كاش', path: 'expenses-management', icon: '💸', badge: 'المصروفات', badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
        { title: 'إدارة المخزون والمستودع', desc: 'مراقبة كميات المواد الطبية وتتبع حركات التوريد الحية', path: 'inventory', icon: '📦', badge: 'المستودع', badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' },
        { title: 'قائمة الخدمات والعيادات', desc: 'تعديل أسعار الخدمات، نقاط الكريديت المطلوبة والمواد المرتبطة بها', path: 'services', icon: '⚡', badge: 'التسعير الذكي', badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
        { title: 'النسخ الاحتياطي والاستعادة', desc: 'عمل نسخ احتياطية لقاعدة البيانات وحمايتها من الفقدان', path: 'backup-restore', icon: '💾', badge: 'أمان البيانات', badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in" dir="rtl">
            
            {/* الشريط العلوي الزجاجي النظيف */}
            <div className="glass-panel p-4 flex justify-between items-center rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] shadow-[0_0_12px_#16a34a]"></span>
                    <span className="text-xs font-bold tracking-wide text-slate-700 dark:text-slate-300">منظومة فريق أطلس لخدمات التمريض متصلة بقاعدة البيانات الحية</span>
                </div>
                <button 
                    onClick={toggleTheme}
                    className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                    {isDarkMode ? '☀️ الوضع المضيء' : '🌙 مظهر ليلي مريح'}
                </button>
            </div>

            {/* الهيدر الترحيبي المستوحى من اللوغو */}
            <div className="bg-gradient-to-br from-[#1e3a8a] via-[#1e293b] to-[#16a34a] p-8 sm:p-10 rounded-[32px] text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10 space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 bg-white/10 px-3 py-1 rounded-full border border-white/20">منظومة الرعاية الرقمية المتكاملة v2.6</span>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight">فريق أطلس لخدمات التمريض</h1>
                    <p className="text-xs sm:text-sm text-slate-200 max-w-xl font-medium leading-relaxed opacity-90">نظام موحد لإدارة العيادات، تتبع أعمار وحالات المرضى، حساب الأرباح، وتصفية مستحقات الكادر الطبي ومستهلكات المخزون آلياً.</p>
                </div>
            </div>

            {/* الأقسام الطبية الحية */}
            <div className="space-y-4">
                <h2 className="text-xs font-black tracking-wider text-[#1e3a8a] dark:text-blue-400 uppercase mr-1">🏥 العمليات الطبية وشؤون المرضى</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {medicalSection.map((item, index) => (
                        <div 
                            key={index}
                            onClick={() => navigate(`/${item.path}`)}
                            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between group transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#1e3a8a] dark:text-blue-400 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform duration-300">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100 group-hover:text-[#1e3a8a] dark:group-hover:text-blue-400 transition-colors">{item.title}</h3>
                                        <span className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-md mt-1 inline-block ${item.badgeColor}`}>{item.badge}</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium my-3">{item.desc}</p>
                            <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-3">
                                <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">فتح القسم النظير</span>
                                <span className="text-xs font-black text-[#16a34a]">دخول 🡨</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* الأقسام الإدارية والمالية */}
            <div className="space-y-4">
                <h2 className="text-xs font-black tracking-wider text-[#16a34a] dark:text-emerald-400 uppercase mr-1">💼 الإدارة المالية واللوجستية</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {managementSection.map((item, index) => (
                        <div 
                            key={index}
                            onClick={() => navigate(`/${item.path}`)}
                            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between group transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#16a34a] dark:text-emerald-400 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform duration-300">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100 group-hover:text-[#16a34a] dark:group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                                        <span className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-md mt-1 inline-block ${item.badgeColor}`}>{item.badge}</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium my-3">{item.desc}</p>
                            <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-3">
                                <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">مراقبة المعاملات الإدارية</span>
                                <span className="text-xs font-black text-[#16a34a]">إدارة ⚙</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* فوتر المنظومة */}
            <div className="text-center text-[11px] text-slate-400 font-medium pt-4 pb-6">
                فريق أطلس لخدمات التمريض © {new Date().getFullYear()} — جميع الحقوق محفوظة
            </div>
        </div>
    );
};

export default Dashboard;