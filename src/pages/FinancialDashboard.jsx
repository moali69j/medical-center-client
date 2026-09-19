import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const getLocalDateString = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getPresetDates = (presetKey) => {
    const now = new Date();
    const todayStr = getLocalDateString(now);

    switch (presetKey) {
        case 'today':
            return { from_date: todayStr, to_date: todayStr };
        case 'week': {
            const d = new Date();
            d.setDate(now.getDate() - 6);
            return { from_date: getLocalDateString(d), to_date: todayStr };
        }
        case '30days': {
            const d = new Date();
            d.setDate(now.getDate() - 29);
            return { from_date: getLocalDateString(d), to_date: todayStr };
        }
        case '90days': {
            const d = new Date();
            d.setDate(now.getDate() - 89);
            return { from_date: getLocalDateString(d), to_date: todayStr };
        }
        case 'all':
        default:
            return { from_date: '', to_date: '' };
    }
};

const FinancialDashboard = () => {
    const [activePreset, setActivePreset] = useState('today');
    const initialDates = getPresetDates('today');
    const [filters, setFilters] = useState({
        from_date: initialDates.from_date,
        to_date: initialDates.to_date,
        service_id: ''
    });
    const [showCustomRange, setShowCustomRange] = useState(false);
    const [summary, setSummary] = useState({});
    const [serviceAnalytics, setServiceAnalytics] = useState([]);
    const [servicesList, setServicesList] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchFinancialData = async () => {
        setLoading(true);
        try {
            const resServices = await api.get('/services');
            setServicesList(resServices.data.services || []);

            const queryParams = new URLSearchParams({
                from_date: filters.from_date || '',
                to_date: filters.to_date || '',
                service_id: filters.service_id || ''
            }).toString();

            const resReport = await api.get(`/financial/reports?${queryParams}`);

            if (resReport.data) {
                setSummary(resReport.data.summary || {});
                setServiceAnalytics(resReport.data.service_analytics || []);
            }
        } catch (err) {
            console.error(err);
            alert("فشل جلب البيانات المالية");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchFinancialData();
    }, [filters]);

    const handleSelectPreset = (presetKey) => {
        setActivePreset(presetKey);
        setShowCustomRange(false);
        const dates = getPresetDates(presetKey);
        setFilters(prev => ({
            ...prev,
            from_date: dates.from_date,
            to_date: dates.to_date
        }));
    };

    const handleToggleCustom = () => {
        const nextState = !showCustomRange;
        setShowCustomRange(nextState);
        if (nextState) {
            setActivePreset('custom');
        }
    };

    const getActiveRangeLabel = () => {
        if (activePreset === 'today') {
            return `اليوم (${filters.from_date})`;
        }
        if (activePreset === 'week') {
            return `آخر 7 أيام (من ${filters.from_date} إلى ${filters.to_date})`;
        }
        if (activePreset === '30days') {
            return `آخر 30 يوم (من ${filters.from_date} إلى ${filters.to_date})`;
        }
        if (activePreset === '90days') {
            return `آخر 90 يوم (من ${filters.from_date} إلى ${filters.to_date})`;
        }
        if (activePreset === 'all') {
            return 'السجل التاريخي الكامل (كل الأوقات)';
        }
        if (filters.from_date && filters.to_date) {
            return `تخصيص: من ${filters.from_date} إلى ${filters.to_date}`;
        }
        if (filters.from_date) {
            return `تخصيص: ابتداءً من ${filters.from_date}`;
        }
        if (filters.to_date) {
            return `تخصيص: حتى ${filters.to_date}`;
        }
        return 'فترة مخصصة';
    };

    // دالة التصدير باستخدام الباك إند
    const handleExportCases = () => {
        const queryParams = new URLSearchParams({
            from_date: filters.from_date || '',
            to_date: filters.to_date || ''
        }).toString();
        window.open(`http://localhost:8000/api/export/cases?${queryParams}`, '_blank');
    };

    const handleExportExpenses = () => {
        const queryParams = new URLSearchParams({
            from_date: filters.from_date || '',
            to_date: filters.to_date || ''
        }).toString();
        window.open(`http://localhost:8000/api/export/expenses?${queryParams}`, '_blank');
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6" dir="rtl">

            {/* شريط العنوان والتصدير السريع */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">📊 لوحة التحكم والإحصائيات المالية</h2>
                    <p className="text-xs text-slate-500 mt-1">متابعة رصيد الصندوق، الإيرادات، المصروفات، وتحليلات الخدمات الطبية</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={handleExportCases}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                        🟢 إكسل الحالات
                    </button>
                    <button
                        onClick={handleExportExpenses}
                        className="bg-green-700 hover:bg-green-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                        🟢 إكسل المصاريف
                    </button>
                </div>
            </div>

            {/* شريط المدد الجاهزة والفلاتر الفورية الذكية */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/80 space-y-4">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    {/* أزرار المدد الجاهزة السريعة */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 ml-1">⏱️ الفترة:</span>

                        <button
                            type="button"
                            onClick={() => handleSelectPreset('today')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${activePreset === 'today'
                                    ? 'bg-[#1e3a8a] text-white shadow-sm ring-2 ring-blue-300'
                                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                                }`}
                        >
                            <span>⚡</span>
                            <span>اليوم</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleSelectPreset('week')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${activePreset === 'week'
                                    ? 'bg-[#1e3a8a] text-white shadow-sm ring-2 ring-blue-300'
                                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                                }`}
                        >
                            <span>📅</span>
                            <span>أسبوع</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleSelectPreset('30days')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${activePreset === '30days'
                                    ? 'bg-[#1e3a8a] text-white shadow-sm ring-2 ring-blue-300'
                                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                                }`}
                        >
                            <span>🗓️</span>
                            <span>30 يوم</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleSelectPreset('90days')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${activePreset === '90days'
                                    ? 'bg-[#1e3a8a] text-white shadow-sm ring-2 ring-blue-300'
                                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                                }`}
                        >
                            <span>📊</span>
                            <span>90 يوم</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleSelectPreset('all')}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${activePreset === 'all'
                                    ? 'bg-[#1e3a8a] text-white shadow-sm ring-2 ring-blue-300'
                                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                                }`}
                        >
                            <span>♾️</span>
                            <span>كل الأوقات</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleToggleCustom}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${activePreset === 'custom' || showCustomRange
                                    ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-300'
                                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                                }`}
                        >
                            <span>⚙️</span>
                            <span>تخصيص الفترة...</span>
                        </button>
                    </div>

                    {/* فلتر الخدمة السريع */}
                    <div className="flex items-center gap-2 w-full lg:w-auto">
                        <span className="text-xs font-bold text-slate-500 whitespace-nowrap">🩺 الخدمة:</span>
                        <select
                            className="border border-slate-200 p-2 rounded-xl outline-none bg-slate-50 font-medium text-xs text-slate-700 focus:ring-2 focus:ring-[#1e3a8a] w-full lg:w-48"
                            value={filters.service_id}
                            onChange={e => setFilters(prev => ({ ...prev, service_id: e.target.value }))}
                        >
                            <option value="">جميع الخدمات</option>
                            {servicesList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* شريط النطاق الزمني المخصص (يظهر عند الضغط على زر التخصيص أو عند تحديد فترة مخصصة) */}
                {(showCustomRange || activePreset === 'custom') && (
                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs items-end animate-in fade-in duration-200">
                        <div>
                            <label className="block mb-1 font-bold text-slate-700">من تاريخ (البداية):</label>
                            <input
                                type="date"
                                className="w-full border border-slate-200 p-2.5 rounded-xl outline-none bg-white font-medium text-xs focus:ring-2 focus:ring-[#1e3a8a]"
                                value={filters.from_date}
                                onChange={e => {
                                    setActivePreset('custom');
                                    setFilters(prev => ({ ...prev, from_date: e.target.value }));
                                }}
                            />
                        </div>
                        <div>
                            <label className="block mb-1 font-bold text-slate-700">إلى تاريخ (النهاية):</label>
                            <input
                                type="date"
                                className="w-full border border-slate-200 p-2.5 rounded-xl outline-none bg-white font-medium text-xs focus:ring-2 focus:ring-[#1e3a8a]"
                                value={filters.to_date}
                                onChange={e => {
                                    setActivePreset('custom');
                                    setFilters(prev => ({ ...prev, to_date: e.target.value }));
                                }}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => handleSelectPreset('today')}
                                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold p-2.5 rounded-xl text-xs transition cursor-pointer"
                            >
                                🔄 إعادة لليوم
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowCustomRange(false)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold px-3 py-2.5 rounded-xl text-xs transition cursor-pointer"
                            >
                                إخفاء
                            </button>
                        </div>
                    </div>
                )}

                {/* شارة توضيحية للفترة الفعالة الحالية */}
                <div className="flex justify-between items-center text-[11px] pt-1 text-slate-500 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                        <span>النطاق الزمني المطبق:</span>
                        <strong className="text-slate-700">{getActiveRangeLabel()}</strong>
                        {filters.service_id && (
                            <span className="mr-2 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-semibold border border-blue-100">
                                فلترة: {servicesList.find(s => s.id === parseInt(filters.service_id))?.name || 'خدمة محددة'}
                            </span>
                        )}
                    </div>
                    {loading && (
                        <span className="text-blue-600 font-bold flex items-center gap-1">
                            <span className="inline-block animate-spin">⏳</span> جارٍ التحديث السريع...
                        </span>
                    )}
                </div>
            </div>

            {/* بطاقات الأداء المالي والمركز المالي الفعلي */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. إجمالي الدخل */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 flex flex-col justify-between shadow-xs">
                    <span className="text-xs text-slate-400 font-bold block">💵 إجمالي المقبوضات (الفترة)</span>
                    <span className="text-2xl font-black text-emerald-600 my-2">{(summary.total_revenue || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">ل.س</span></span>
                    <span className="text-[11px] text-slate-400 font-medium">إجمالي {summary.total_cases || 0} زيارة طبية منفذة</span>
                </div>

                {/* 2. إجمالي المصاريف */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 flex flex-col justify-between shadow-xs">
                    <span className="text-xs text-slate-400 font-bold block">🧾 إجمالي المصاريف (الفترة)</span>
                    <span className="text-2xl font-black text-rose-600 my-2">{(summary.total_expenses || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">ل.س</span></span>
                    <span className="text-[11px] text-slate-400 font-medium">رواتب، مشتريات، ونثريات تشغيلية</span>
                </div>

                {/* 3. كاش الصندوق الفعلي المتوفر حالياً بالمركز */}
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 rounded-3xl text-white flex flex-col justify-between shadow-md relative overflow-hidden">
                    <div className="absolute -left-3 -bottom-3 text-white/10 text-6xl font-black">💰</div>
                    <div className="relative z-10">
                        <span className="text-xs font-bold block opacity-90">💰 كاش الصندوق الحالي بالمركز</span>
                        <span className="text-2xl font-black my-2 block tracking-tight">{(summary.current_cash_in_treasury || 0).toLocaleString()} <span className="text-xs font-normal opacity-80">ل.س</span></span>
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-semibold inline-block">الرصيد الفعلي المتوفر بالخزينة</span>
                    </div>
                </div>

                {/* 4. صافي التدفق النقدي للفترة */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 flex flex-col justify-between shadow-xs">
                    <span className="text-xs text-slate-400 font-bold block">📈 صافي حركة الكاش (الفترة)</span>
                    <span className={`text-2xl font-black my-2 ${(summary.period_net_cash || 0) >= 0 ? 'text-blue-700' : 'text-rose-600'}`}>
                        {(summary.period_net_cash || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">ل.س</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">الفارق بين مقبوضات ومصروفات الفترة</span>
                </div>
            </div>

            {/* بطاقات التنقل السريعة للسجلات المستقلة (بدلاً من تحميل الجداول الثقيلة) */}
            <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-sm">🗂️ السجلات والبيانات المحاسبية المفصلة:</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* بطاقة سجل الحالات */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4 hover:border-blue-300 transition group">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center text-2xl font-bold shrink-0">
                                📂
                            </div>
                            <div>
                                <h4 className="font-black text-slate-800 text-base group-hover:text-blue-700 transition">
                                    سجل الحالات والزيارات الطبية
                                </h4>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    استعراض وتدقيق كافة الزيارات المسجلة، مبالغ الحالات المقبوضة، نسب المركز والكادر الطبي، وتكلفة المستلزمات مع البحث الفوري.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                            <span className="text-xs font-bold text-slate-500">
                                إجمالي الزيارات المسجلة بالفترة: <strong className="text-slate-800">{summary.total_cases || 0}</strong>
                            </span>
                            <Link
                                to="/financial/cases"
                                className="bg-[#1e3a8a] hover:bg-blue-900 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                                <span>فتح سجل الزيارات والعمليات</span>
                                <span>←</span>
                            </Link>
                        </div>
                    </div>

                    {/* بطاقة سجل المصاريف والخزنة */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4 hover:border-rose-300 transition group">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl font-bold shrink-0">
                                💸
                            </div>
                            <div>
                                <h4 className="font-black text-slate-800 text-base group-hover:text-rose-600 transition">
                                    إدارة الخزنة وسجل المصاريف والرواتب
                                </h4>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    تسجيل سندات الصرف، تتبع مشتريات المستودع التلقائية، فواتير التشغيل، وتصفية مستحقات الممرضين والكادر نقداً.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                            <span className="text-xs font-bold text-slate-500">
                                إجمالي المصاريف بالفترة: <strong className="text-rose-600">{(summary.total_expenses || 0).toLocaleString()} ل.س</strong>
                            </span>
                            <Link
                                to="/expenses-management"
                                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                                <span>إدارة الخزنة والمصاريف</span>
                                <span>←</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* ترتيب الخدمات الأكثر طلباً واستخداماً */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-800">📊 ترتيب الخدمات الطبية الأكثر طلباً واستخداماً:</h3>
                    <span className="text-[11px] text-slate-400">حسب عدد مرات الاستدعاء بالفترة المحددة</span>
                </div>

                {serviceAnalytics.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">لا توجد خدمات منفذة في الفترة المحددة</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {serviceAnalytics.map((s, idx) => (
                            <span key={idx} className="bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs border border-slate-200 flex items-center gap-2">
                                <span className="font-bold text-blue-700">#{idx + 1}</span>
                                <span className="font-bold text-slate-800">{s.name}</span>
                                <span className="bg-blue-100 text-[#1e3a8a] font-black px-2 py-0.5 rounded-full text-[10px]">{s.usage_count} مرّة</span>
                            </span>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};

export default FinancialDashboard;