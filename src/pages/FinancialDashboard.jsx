import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const FinancialDashboard = () => {
    const [filters, setFilters] = useState({ from_date: '', to_date: '', service_id: '' });
    const [summary, setSummary] = useState({});
    const [casesDetails, setCasesDetails] = useState([]);
    const [expensesDetails, setExpensesDetails] = useState([]);
    const [serviceAnalytics, setServiceAnalytics] = useState([]);
    const [servicesList, setServicesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('cases');
    const [showExpenseModal, setShowExpenseModal] = useState(false);

    const fetchFinancialData = async () => {
        setLoading(true);
        try {
            const resServices = await api.get('/services');
            setServicesList(resServices.data.services || []);

            const queryParams = new URLSearchParams(filters).toString();
            const resReport = await api.get(`/financial/reports?${queryParams}`);
            
            if (resReport.data) {
                setSummary(resReport.data.summary || {});
                setCasesDetails(resReport.data.cases_details || []);
                setExpensesDetails(resReport.data.expenses_details || []);
                setServiceAnalytics(resReport.data.service_analytics || []);
            }
        } catch (err) {
            alert("فشل جلب البيانات المالية");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void fetchFinancialData(); }, [filters]);

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
            
            {/* شريط العنوان وزر الانتقال لإدارة الخزنة */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">لوحة التحكم والتحليلات المالية الذكية</h2>
                    <p className="text-xs text-gray-400 mt-1">رصد فوري لحساب الأرباح والكاش والكريديت المستهلك</p>
                </div>
                <div className="flex gap-2">
                    {/* زر التصدير إلى إكسل الاحترافي الأخضر */}
                    <button 
                        onClick={handleExportCases}
                        className="bg-green-700 hover:bg-green-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-sm flex items-center gap-1.5"
                    >
                        🟢 تصدير الحالات (Excel)
                    </button>
                    <button 
                        onClick={handleExportExpenses}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-sm flex items-center gap-1.5"
                    >
                        🟢 تصدير المصاريف (Excel)
                    </button>
                    <button 
                        onClick={() => window.location.href = '/expenses-management'} 
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-sm"
                    >
                        💸 إدارة الخزنة (الرواتب، المصاريف، وتصفية الممرضين) ←
                    </button>
                </div>
            </div>

            {/* شريط الفلاتر الذكية */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-end gap-4 text-xs text-gray-600">
                <div className="flex-1 min-w-[150px]">
                    <label className="block mb-1 font-bold text-gray-700">من تاريخ:</label>
                    <input type="date" className="w-full border p-2 rounded-xl outline-none" value={filters.from_date} onChange={e => setFilters({...filters, from_date: e.target.value})} />
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label className="block mb-1 font-bold text-gray-700">إلى تاريخ:</label>
                    <input type="date" className="w-full border p-2 rounded-xl outline-none" value={filters.to_date} onChange={e => setFilters({...filters, to_date: e.target.value})} />
                </div>
                <div className="flex-1 min-w-[200px]">
                    <label className="block mb-1 font-bold text-gray-700">تصفية حسب نوع الخدمة الطبية:</label>
                    <select className="w-full border p-2 rounded-xl outline-none bg-gray-50 font-medium" value={filters.service_id} onChange={e => setFilters({...filters, service_id: e.target.value})}>
                        <option value="">كل الخدمات الفعالة</option>
                        {servicesList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <button onClick={() => setFilters({ from_date: '', to_date: '', service_id: '' })} className="bg-gray-100 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-xs">🔄 تصفير الكل</button>
            </div>

            {/* بطاقات الأداء المالي KPI */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col justify-between shadow-sm">
                    <span className="text-[11px] text-gray-400 font-medium block">💵 إجمالي الكاش الصافي المستلم</span>
                    <span className="text-xl font-black text-green-600 mt-2">{(summary.total_revenue || 0).toLocaleString()} <span className="text-xs font-normal text-gray-400">ل.س</span></span>
                    <span className="text-[10px] text-gray-400 mt-1">من أصل {summary.total_cases || 0} حالة طبية</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col justify-between shadow-sm">
                    <span className="text-[11px] text-gray-400 font-medium block">🎯 إجمالي الكريديت المستهلك</span>
                    <span className="text-xl font-black text-purple-700 mt-2">{(summary.total_credits_consumed || 0).toLocaleString()} <span className="text-xs font-normal text-gray-400">نقطة</span></span>
                    <span className="text-[10px] text-purple-500 font-semibold mt-1">تساوي تكلفة استهلاك المواد آلياً</span>
                </div>

                <div 
                    onClick={() => setShowExpenseModal(true)} 
                    className="bg-white p-4 rounded-2xl border border-red-100 hover:border-red-400 flex flex-col justify-between shadow-sm cursor-pointer transition relative group"
                >
                    <span className="text-[11px] text-gray-400 font-medium block">🧾 إجمالي المصاريف المسجلة 🔍</span>
                    <span className="text-xl font-black text-red-600 mt-2">{(summary.total_expenses || 0).toLocaleString()} <span className="text-xs font-normal text-gray-400">ل.س</span></span>
                    <span className="text-[10px] text-red-500 font-bold mt-1 group-hover:underline">اضغط هنا لعرض تفاصيل الفواتير والرواتب ←</span>
                </div>

                <div className="bg-blue-600 p-4 rounded-2xl text-white flex flex-col justify-between shadow-md">
                    <span className="text-[11px] opacity-80 font-medium block">💎 صافي أرباح المركز الحقيقية</span>
                    <span className="text-xl font-black mt-2">{(summary.final_net_profit || 0).toLocaleString()} <span className="text-xs font-normal opacity-70">ل.س</span></span>
                    <span className="text-[10px] opacity-90 mt-1">حصص المركز الصافية مطروحاً منها المصاريف</span>
                </div>
            </div>

            {/* ترتيب الخدمات الأكثر طلباً */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-gray-700">📊 ترتيب الخدمات الطبية الأكثر طلباً واستخداماً:</h3>
                <div className="flex flex-wrap gap-2">
                    {serviceAnalytics.map((s, idx) => (
                        <span key={idx} className="bg-gray-50 text-gray-700 px-3 py-1.5 rounded-xl text-xs border flex items-center gap-2">
                            <span className="font-bold text-blue-600">#{idx + 1}</span>
                            <span className="font-medium text-gray-800">{s.name}</span>
                            <span className="bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-full text-[10px]">{s.usage_count} مرّة</span>
                        </span>
                    ))}
                </div>
            </div>

            {/* جداول استعراض السجلات التبادلية */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gray-50 border-b flex text-xs font-bold text-gray-500">
                    <button onClick={() => setActiveTab('cases')} className={`p-4 border-b-2 ${activeTab === 'cases' ? 'bg-white border-blue-600 text-blue-600' : ''}`}>📂 سجل الحالات والزيارات ({casesDetails.length})</button>
                    <button onClick={() => setActiveTab('expenses')} className={`p-4 border-b-2 ${activeTab === 'expenses' ? 'bg-white border-red-600 text-red-600' : ''}`}>💸 سجل فواتير المصاريف والرواتب ({expensesDetails.length})</button>
                </div>

                {activeTab === 'cases' && (
                    <div className="overflow-x-auto text-xs">
                        <table className="w-full text-right border-collapse">
                            <thead className="bg-gray-50/50 text-gray-500 font-bold border-b text-[11px]">
                                <tr>
                                    <th className="p-3">تاريخ الحالة</th>
                                    <th className="p-3">نوع الحالة</th>
                                    <th className="p-3">الكاش المستلم</th>
                                    <th className="p-3 text-blue-600">حصة المركز</th>
                                    <th className="p-3 text-purple-700">حصة الكادر</th>
                                    <th className="p-3">تكلفة المستهلكات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-gray-700">
                                {casesDetails.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50/50">
                                        <td className="p-3 font-semibold text-gray-500">{c.created_at ? new Date(c.created_at).toLocaleDateString('ar-SY') : ''}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.case_type === 'internal' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>{c.case_type === 'internal' ? 'داخلية' : 'خارجية'}</span>
                                        </td>
                                        <td className="p-3 font-black text-green-700">{parseFloat(c.total_paid).toLocaleString()} ل.س</td>
                                        <td className="p-3 font-bold text-blue-600">{parseFloat(c.center_share).toLocaleString()} ل.س</td>
                                        <td className="p-3 font-bold text-purple-700">{parseFloat(c.staff_share).toLocaleString()} ل.س</td>
                                        <td className="p-3 text-gray-400">{parseFloat(c.total_cost_of_materials).toLocaleString()} ل.س</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'expenses' && (
                    <div className="overflow-x-auto text-xs">
                        <table className="w-full text-right border-collapse">
                            <tbody className="divide-y text-gray-700">
                                {expensesDetails.map(e => (
                                    <tr key={e.id} className="hover:bg-gray-50/50">
                                        <td className="p-3 text-gray-500">{new Date(e.created_at).toLocaleDateString('ar-SY')}</td>
                                        <td className="p-3 font-bold text-red-600">{e.category}</td>
                                        <td className="p-3 font-black text-gray-800">{parseFloat(e.amount).toLocaleString()} ل.س</td>
                                        <td className="p-3 text-gray-500">{e.notes}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* النافذة المنبثقة التفصيلية للمصاريف */}
            {showExpenseModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-2xl shadow-xl max-w-xl w-full max-h-[75vh] overflow-y-auto" dir="rtl">
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 className="text-base font-bold text-gray-800">🧾 تفاصيل فواتير المصاريف والرواتب التشغيلية المخصومة</h3>
                            <button onClick={() => setShowExpenseModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
                        </div>
                        <div className="space-y-2 text-xs">
                            {expensesDetails.map(e => (
                                <div key={e.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center">
                                    <div className="space-y-1">
                                        <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded text-[10px]">{e.category}</span>
                                        <p className="font-medium text-gray-700 mt-1">{e.notes}</p>
                                        <span className="text-[10px] text-gray-400 block">{new Date(e.created_at).toLocaleString('ar-SY')}</span>
                                    </div>
                                    <span className="font-black text-red-600 text-sm whitespace-nowrap">{parseFloat(e.amount).toLocaleString()} ل.س</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialDashboard;