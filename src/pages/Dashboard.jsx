import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Dashboard = () => {
    const navigate = useNavigate();
    const [summary, setSummary] = useState({ total_cases: 0, total_revenue: 0, total_patients: 0 });
    const [loadingSummary, setLoadingSummary] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const resCasesCount = await api.get('/cases/count').catch(() => ({ data: { total_cases: 0 } }));
                const resPatients = await api.get('/patients').catch(() => ({ data: { total: 0 } }));
                const resReport = await api.get('/financial/reports').catch(() => ({ data: { summary: { total_revenue: 0 } } }));
                
                const casesCount = resCasesCount.data?.total_cases || 0;
                const patientsCount = resPatients.data?.total || resPatients.data?.data?.length || 0;
                const totalRevenue = resReport.data?.summary?.total_revenue || 0;

                setSummary({
                    total_cases: casesCount,
                    total_revenue: totalRevenue,
                    total_patients: patientsCount
                });
            } catch (err) {
                console.error("خطأ في جلب الملخص:", err);
            } finally {
                setLoadingSummary(false);
            }
        };
        fetchDashboardData();
    }, []);

    const cards = [
        { title: 'إضافة حالة مريض جديد', desc: 'تسجيل زيارة، إدخال العمر، الفحص السريري وسحب مستهلكات المخزون آلياً', path: 'cases/new', icon: '🩺', badge: 'طبي مباشر', color: 'bg-blue-50/80 text-[#1e3a8a] border-blue-100' },
        { title: 'سجل المرضى والملف الصحي', desc: 'استعراض السجل المرضي الكامل لكل مريض، العمر، تفاصيل الزيارات السابقة والخدمات', path: 'patients-management', icon: '👥', badge: 'سجلات حية', color: 'bg-emerald-50/80 text-[#16a34a] border-emerald-100' },
        { title: 'الخزنة والتقارير المالية', desc: 'رصد الإيرادات، الأرباح الصافية، وتصدير التقارير الطبية والمالية إلى إكسل', path: 'financial', icon: '📊', badge: 'الخزنة', color: 'bg-indigo-50/80 text-indigo-700 border-indigo-100' },
        { title: 'إدارة الخزنة والمصاريف', desc: 'تسجيل الرواتب، المصاريف التشغيلية وتصفية حصص الممرضين كاش', path: 'expenses-management', icon: '💸', badge: 'المصروفات', color: 'bg-rose-50/80 text-rose-700 border-rose-100' },
        { title: 'إدارة مستودع المستهلكات', desc: 'مراقبة كميات المواد الطبية، حد العتبة، وتوريد أصناف جديدة', path: 'inventory', icon: '📦', badge: 'المستودع', color: 'bg-teal-50/80 text-teal-700 border-teal-100' },
        { title: 'الخدمات والتسعير الذكي', desc: 'تعديل أسعار الخدمات الطبية ونقاط الكريديت المرتبطة باستهلاك المخزن', path: 'services', icon: '⚡', badge: 'التسعير', color: 'bg-purple-50/80 text-purple-700 border-purple-100' },
        { title: 'النسخ الاحتياطي والاستعادة', desc: 'أخذ نسخة احتياطية لقاعدة البيانات وحمايتها من التلف أو الفقدان', path: 'backup-restore', icon: '💾', badge: 'الأمان', color: 'bg-amber-50/80 text-amber-700 border-amber-100' },
    ];

    return (
        <div className="space-y-8 animate-fade-in pb-10" dir="rtl">
            
            {/* الهيدر الفاخر مع الشعار وإحصائيات الملخص */}
            <div className="luxury-card p-6 sm:p-10 flex flex-col lg:flex-row justify-between items-center gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white shadow-md p-3 border border-slate-100 flex items-center justify-center shrink-0">
                        <img 
                            src="/atlas-logo.png" 
                            alt="شعار فريق أطلس" 
                            className="w-full h-full object-contain" 
                        />
                    </div>
                    <div className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#16a34a] bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200/60 inline-block">منظومة الرعاية الصحية الرقمية v2.7</span>
                        <h1 className="text-2xl sm:text-4xl font-black text-[#1e3a8a] tracking-tight">فريق أطلس لخدمات التمريض</h1>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl leading-relaxed">إدارة متكاملة للعيادات، تتبع السجلات الطبية بدقة، حساب الأرباح، ومراقبة المخزون وفق أعلى معايير الجودة.</p>
                    </div>
                </div>

                {/* بطاقات الملخص السريع الفاخرة */}
                <div className="grid grid-cols-3 gap-3 w-full lg:w-auto relative z-10 shrink-0">
                    <div className="bg-white/80 border border-slate-200/60 p-4 rounded-2xl text-center shadow-xs min-w-[100px]">
                        <span className="text-[10px] text-slate-400 font-bold block mb-1">إجمالي المرضى</span>
                        <span className="text-lg font-black text-[#1e3a8a] block">{loadingSummary ? '...' : summary.total_patients}</span>
                    </div>
                    <div className="bg-white/80 border border-slate-200/60 p-4 rounded-2xl text-center shadow-xs min-w-[100px]">
                        <span className="text-[10px] text-slate-400 font-bold block">الزيارات المسجلة</span>
                        <span className="text-lg font-black text-[#16a34a] block">{loadingSummary ? '...' : summary.total_cases}</span>
                    </div>
                    <div className="bg-white/80 border border-slate-200/60 p-4 rounded-2xl text-center shadow-xs min-w-[110px]">
                        <span className="text-[10px] text-slate-400 font-bold block">الإيرادات الكلية</span>
                        <span className="text-xs sm:text-sm font-black text-slate-700 mt-1 block truncate">{loadingSummary ? '...' : `${summary.total_revenue.toLocaleString()} ل.س`}</span>
                    </div>
                </div>
            </div>

            {/* شبكة البطاقات الفاخرة للتحكم بالنظام */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((item, index) => (
                    <div 
                        key={index}
                        onClick={() => navigate(`/${item.path}`)}
                        className="luxury-card p-7 cursor-pointer flex flex-col justify-between group"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border shadow-2xs ${item.color} group-hover:scale-110 transition-transform duration-300`}>
                                {item.icon}
                            </div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">{item.badge}</span>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-black text-slate-800 group-hover:text-[#1e3a8a] transition-colors">{item.title}</h3>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-6">
                            <span className="text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">الانتقال للقسم</span>
                            <span className="text-xs font-black text-[#1e3a8a] group-hover:translate-x-[-4px] transition-transform">دخول 🡨</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* فوتر المنظومة */}
            <div className="text-center text-xs text-slate-400 font-bold pt-8 border-t border-slate-200/60">
                فريق أطلس لخدمات التمريض © {new Date().getFullYear()} — جميع الحقوق محفوظة
            </div>
        </div>
    );
};

export default Dashboard;