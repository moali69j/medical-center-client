import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const CasesLog = () => {
    const [cases, setCases] = useState([]);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        from_date: '',
        to_date: '',
        case_type: '',
        search: ''
    });

    const fetchCases = async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page,
                from_date: filters.from_date || '',
                to_date: filters.to_date || '',
                case_type: filters.case_type || '',
                search: filters.search || ''
            }).toString();

            const res = await api.get(`/financial/cases-log?${params}`);
            if (res.data) {
                setCases(res.data.data || []);
                setPagination({
                    current_page: res.data.current_page || 1,
                    last_page: res.data.last_page || 1,
                    total: res.data.total || 0
                });
            }
        } catch (err) {
            console.error(err);
            alert('خطأ في جلب سجل الحالات والزيارات');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchCases(1);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [filters.from_date, filters.to_date, filters.case_type, filters.search]);

    const handleExportCases = () => {
        const queryParams = new URLSearchParams({
            from_date: filters.from_date || '',
            to_date: filters.to_date || ''
        }).toString();
        window.open(`http://localhost:8000/api/export/cases?${queryParams}`, '_blank');
    };

    // احتساب إجماليات الصفحة المعروضة حالياً
    const pageTotalRevenue = cases.reduce((sum, c) => sum + parseFloat(c.total_paid || 0), 0);
    const pageTotalCenterShare = cases.reduce((sum, c) => sum + parseFloat(c.center_share || 0), 0);
    const pageTotalStaffShare = cases.reduce((sum, c) => sum + parseFloat(c.staff_share || 0), 0);

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6" dir="rtl">
            {/* الترويسة وأزرار التنقل */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <span>📂</span>
                        <span>سجل الحالات والزيارات الطبية </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">عرض وتدقيق كافة الزيارات المسجلة، المبالغ المقبوضة، وتوزيع الحصص المالية</p>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <button
                        onClick={handleExportCases}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-xs flex items-center gap-1.5"
                    >
                        🟢 تصدير لإكسل (Excel)
                    </button>
                    <Link
                        to="/financial"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition"
                    >
                        ← العودة للمالية
                    </Link>
                </div>
            </div>

            {/* شريط الفلاتر والبحث */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex flex-wrap items-end gap-3 text-xs">
                <div className="flex-1 min-w-[200px]">
                    <label className="block mb-1 font-bold text-slate-700">🔍 بحث فوري (اسم المريض، هاتف، أو رقم الحالة):</label>
                    <input
                        type="text"
                        placeholder="اكتب للبحث السريع..."
                        className="w-full border border-slate-200 p-2.5 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-[#1e3a8a] text-xs font-semibold"
                        value={filters.search}
                        onChange={e => setFilters({ ...filters, search: e.target.value })}
                    />
                </div>

                <div className="w-40">
                    <label className="block mb-1 font-bold text-slate-700">من تاريخ:</label>
                    <input
                        type="date"
                        className="w-full border border-slate-200 p-2 rounded-xl bg-slate-50 outline-none text-xs"
                        value={filters.from_date}
                        onChange={e => setFilters({ ...filters, from_date: e.target.value })}
                    />
                </div>

                <div className="w-40">
                    <label className="block mb-1 font-bold text-slate-700">إلى تاريخ:</label>
                    <input
                        type="date"
                        className="w-full border border-slate-200 p-2 rounded-xl bg-slate-50 outline-none text-xs"
                        value={filters.to_date}
                        onChange={e => setFilters({ ...filters, to_date: e.target.value })}
                    />
                </div>

                <div className="w-36">
                    <label className="block mb-1 font-bold text-slate-700">نوع الحالة:</label>
                    <select
                        className="w-full border border-slate-200 p-2.5 rounded-xl bg-slate-50 outline-none text-xs font-semibold"
                        value={filters.case_type}
                        onChange={e => setFilters({ ...filters, case_type: e.target.value })}
                    >
                        <option value="">جميع الحالات</option>
                        <option value="internal">داخلية فقط</option>
                        <option value="external">خارجية فقط</option>
                    </select>
                </div>

                <button
                    onClick={() => setFilters({ from_date: '', to_date: '', case_type: '', search: '' })}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2.5 rounded-xl text-xs transition"
                >
                    🔄 تصفير
                </button>
            </div>

            {/* شريط الإحصائيات السريعة للصفحة */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <span className="text-slate-400 block mb-1">إجمالي الحالات بالسجل:</span>
                    <span className="text-lg font-black text-slate-800">{pagination.total} حالة</span>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <span className="text-slate-400 block mb-1">مقبوضات الصفحة المعروضة:</span>
                    <span className="text-lg font-black text-emerald-600">{pageTotalRevenue.toLocaleString()} ل.س</span>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <span className="text-slate-400 block mb-1">حصة المركز بالصفحة:</span>
                    <span className="text-lg font-black text-blue-700">{pageTotalCenterShare.toLocaleString()} ل.س</span>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                    <span className="text-slate-400 block mb-1">حصة الكادر بالصفحة:</span>
                    <span className="text-lg font-black text-purple-700">{pageTotalStaffShare.toLocaleString()} ل.س</span>
                </div>
            </div>

            {/* جدول الحالات المفصل */}
            <div className="bg-white shadow-md rounded-2xl overflow-hidden border border-slate-200/80">
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-xs">
                                <th className="py-3.5 px-4 text-center">#</th>
                                <th className="py-3.5 px-4">تاريخ الزيارة</th>
                                <th className="py-3.5 px-4">المريض</th>
                                <th className="py-3.5 px-4 text-center">النوع</th>
                                <th className="py-3.5 px-4">الخدمات المقدمة</th>
                                <th className="py-3.5 px-4 text-emerald-700">المبلغ المقبوض</th>
                                <th className="py-3.5 px-4 text-blue-700">حصة المركز</th>
                                <th className="py-3.5 px-4 text-purple-700">حصة الكادر</th>
                                <th className="py-3.5 px-4 text-slate-500">تكلفة المواد</th>
                                <th className="py-3.5 px-4 text-center">حالة الكادر</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                            {loading ? (
                                <tr>
                                    <td colSpan="10" className="text-center py-10 text-slate-400 font-bold">
                                        جاري جلب سجل الزيارات...
                                    </td>
                                </tr>
                            ) : cases.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="text-center py-10 text-slate-400">
                                        لا توجد حالات مسجلة تطابق خيارات البحث الحالية.
                                    </td>
                                </tr>
                            ) : (
                                cases.map(c => (
                                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                                        <td className="py-3.5 px-4 text-center font-black text-slate-400 text-xs">{c.id}</td>
                                        <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
                                            {c.created_at ? new Date(c.created_at).toLocaleDateString('ar-SY') : ''}
                                            <span className="text-[10px] text-slate-400 block font-normal">
                                                {c.created_at ? new Date(c.created_at).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="font-bold text-slate-900 block">{c.patient?.full_name || 'مريض غير معرف'}</span>
                                            <span className="text-[11px] text-slate-400">{c.patient?.phone || 'بلا رقم'}</span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${c.case_type === 'internal' ? 'bg-blue-50 text-blue-700 border border-blue-200/60' : 'bg-amber-50 text-amber-800 border border-amber-200/60'}`}>
                                                {c.case_type === 'internal' ? 'داخلية' : 'خارجية'}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex flex-wrap gap-1">
                                                {c.services && c.services.length > 0 ? (
                                                    c.services.map(s => (
                                                        <span key={s.id} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                                                            {s.name}
                                                        </span>
                                                    ))
                                                ) : <span className="text-slate-400 text-xs">بلا خدمات</span>}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 font-black text-emerald-700 text-sm">
                                            {parseFloat(c.total_paid || 0).toLocaleString()} ل.س
                                        </td>
                                        <td className="py-3.5 px-4 font-bold text-blue-700 text-xs">
                                            {parseFloat(c.center_share || 0).toLocaleString()} ل.س
                                        </td>
                                        <td className="py-3.5 px-4 font-bold text-purple-700 text-xs">
                                            {parseFloat(c.staff_share || 0).toLocaleString()} ل.س
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-500 text-xs">
                                            {parseFloat(c.total_cost_of_materials || 0).toLocaleString()} ل.س
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.is_paid_to_staff ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                {c.is_paid_to_staff ? 'مسددة ✓' : 'معلقة ⏳'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* أزرار الترقيم Pagination */}
                {pagination.last_page > 1 && (
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">
                            الصفحة {pagination.current_page} من أصل {pagination.last_page} (إجمالي: {pagination.total} حالة)
                        </span>
                        <div className="flex gap-2">
                            <button
                                disabled={pagination.current_page <= 1}
                                onClick={() => fetchCases(pagination.current_page - 1)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-100 transition"
                            >
                                السابق
                            </button>
                            <button
                                disabled={pagination.current_page >= pagination.last_page}
                                onClick={() => fetchCases(pagination.current_page + 1)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-100 transition"
                            >
                                التالي
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CasesLog;
