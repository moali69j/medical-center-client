import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Dashboard = () => {
    const navigate = useNavigate();
    const { isDarkMode, toggleTheme } = useTheme();

    const medicalSection = [
        { title: 'إضافة حالة جديدة', desc: 'تسجيل زيارة مريض، تشخيص سريري وسحب مستهلكات آلي', path: 'cases/new', icon: '🩺', badge: 'طبي مباشر', badgeColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
        { title: 'أرشيف سجلات المرضى', desc: 'البحث عن المرضى واستعراض الملف التاريخي والتشخيصي لكل مريض', path: 'patients-management', icon: '👥', badge: 'سجلات حية', badgeColor: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
    ];

    const managementSection = [
        { title: 'لوحة التحكم المالية', desc: 'تحليل الأرباح، رصد الإيرادات، وتصدير تقارير Excel', path: 'financial', icon: '📊', badge: 'الخزنة المركزية', badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
        { title: 'إدارة الخزنة والمصاريف', desc: 'تسجيل رواتب الموظفين، فواتير التشغيل وتصفية حصص الممرضين كاش', path: 'expenses-management', icon: '💸', badge: 'المصروفات', badgeColor: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
        { title: 'إدارة المخزون والمستودع', desc: 'مراقبة كميات المواد الطبية وتتبع حركات التوريد الحية', path: 'inventory', icon: '📦', badge: 'المستودع', badgeColor: 'bg-teal-500/10 text-teal-500 border-teal-500/20' },
        { title: 'قائمة الخدمات والعيادات', desc: 'تعديل أسعار الخدمات، نقاط الكريديت المطلوبة والمواد المرتبطة بها', path: 'services', icon: '⚡', badge: 'التسعير الذكي', badgeColor: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
    ];

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-8 animate-fade-in" dir="rtl">
            
            {/* الشريط العلوي الزجاجي النظيف */}
            <div className="glass-panel p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_#10b981]"></span>
                    <span className="text-xs font-bold tracking-wide opacity-80">المنظومة متصلة بقاعدة البيانات الحية للمركز</span>
                </div>
                <button 
                    onClick={toggleTheme}
                    className="flex items-center gap-2 bg-slate-200/50 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-300 border border-slate-300/30 dark:border-slate-700/50"
                >
                    {isDarkMode ? '☀️ الوضع المضيء' : '🌙 مظهر ليلي مريح'}
                </button>
            </div>

            {/* الهيدر الترحيبي المستقبلي */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden border border-slate-800/40">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20">منظومة الرعاية الرقمية المتكاملة v2.5</span>
                    <h1 className="text-3xl font-black tracking-tight pt-2">المركز الطبي الرقمي</h1>
                    <p className="text-xs text-slate-300 max-w-xl font-medium leading-relaxed opacity-80">نظام موحد لإدارة العيادات، حساب الأرباح، تصفية مستحقات الكادر الطبي، ومراقبة جرد مستهلكات المخزون تلقائياً.</p>
                </div>
            </div>

            {/* الأقسام الطبية الحية */}
            <div className="space-y-4">
                <h2 className="text-xs font-black tracking-wider text-blue-600 dark:text-blue-400 uppercase mr-1">🏥 العمليات الطبية وشؤون المرضى</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {medicalSection.map((item, index) => (
                        <div 
                            key={index}
                            onClick={() => navigate(`/${item.path}`)}
                            className="glass-panel p-5 cursor-pointer flex flex-col justify-between group h-44"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 flex items-center justify-center text-2xl shadow-2xs group-hover:scale-105 transition-transform duration-300">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold tracking-tight group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">{item.title}</h3>
                                        <span className={`text-[9px] font-bold border px-2 py-0.5 rounded-md ${item.badgeColor}`}>{item.badge}</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs opacity-60 leading-relaxed font-medium mb-2">{item.desc}</p>
                            <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800/40 pt-3">
                                <span className="text-[11px] font-bold opacity-40 group-hover:opacity-100 transition-opacity">فتح القسم النظير</span>
                                <span className="text-xs font-black text-blue-500">دخول 🡨</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* الأقسام الإدارية والمالية */}
            <div className="space-y-4">
                <h2 className="text-xs font-black tracking-wider text-emerald-600 dark:text-emerald-400 uppercase mr-1">💼 الإدارة المالية واللوجستية</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {managementSection.map((item, index) => (
                        <div 
                            key={index}
                            onClick={() => navigate(`/${item.path}`)}
                            className="glass-panel p-5 cursor-pointer flex flex-col justify-between group h-44"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-2xl shadow-2xs group-hover:scale-105 transition-transform duration-300">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold tracking-tight group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                                        <span className={`text-[9px] font-bold border px-2 py-0.5 rounded-md ${item.badgeColor}`}>{item.badge}</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs opacity-60 leading-relaxed font-medium mb-2">{item.desc}</p>
                            <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800/40 pt-3">
                                <span className="text-[11px] font-bold opacity-40 group-hover:opacity-100 transition-opacity">مراقبة المعاملات الإدارية</span>
                                <span className="text-xs font-black text-emerald-500">إدارة ⚙</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* فوتر المنظومة */}
            <div className="text-center text-[10px] opacity-30 font-medium pt-4">
                جميع الحقوق محفوظة للمركز الطبي الرقمي © {new Date().getFullYear()}
            </div>
        </div>
    );
};

export default Dashboard;