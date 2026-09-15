import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const PatientsManagement = () => {
    const [patientsList, setPatientsList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientHistory, setPatientHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);

    const fetchPatients = async (page = 1, search = '') => {
        setLoading(true);
        try {
            const url = search 
                ? `/patients/search?query=${search}&page=${page}`
                : `/patients?page=${page}`;
                
            const res = await api.get(url);
            
            if (res.data && res.data.data) {
                setPatientsList(res.data.data);
                setCurrentPage(res.data.current_page);
                setTotalPages(res.data.last_page);
            } else {
                setPatientsList(res.data || []);
                setTotalPages(1);
            }
        } catch (err) {
            console.error("خطأ في جلب أرشيف المرضى:", err);
            alert("فشل في الاتصال بالسيرفر لجلب قائمة المرضى");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchPatients(1, searchQuery);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleOpenPatientProfile = async (patient) => {
        setSelectedPatient(patient);
        setShowProfileModal(true);
        setLoadingHistory(true);
        try {
            const res = await api.get(`/financial/reports?patient_id=${patient.id}`);
            const filteredCases = res.data?.cases_details?.filter(c => c.patient_id === patient.id) || [];
            setPatientHistory(filteredCases);
        } catch (err) {
            console.error("خطأ في جلب سجل زيارات المريض:", err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleExportPatients = () => {
        window.open('http://localhost:8000/api/export/patients', '_blank');
    };

    if (loading) return <div className="text-center p-12 text-lg font-bold text-slate-500">🔍 جاري فتح ملفات وأرشيف المرضى المسجلين...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6" dir="rtl">
            
            {/* رأس الصفحة مع زر التصدير */}
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">👥 أرشيف سجلات المرضى والولاء الطبي</h2>
                    <p className="text-xs text-slate-400 mt-1">البحث الفوري عن المريض واستعراض العمر، الملف التاريخي الكامل لزياراته وعملياته</p>
                </div>
                <button 
                    onClick={handleExportPatients}
                    className="bg-[#16a34a] hover:bg-green-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-xs flex items-center gap-1.5"
                >
                    🟢 تصدير قائمة المرضى لـ Excel
                </button>
            </div>

            {/* شريط البحث الذكي السريع */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                <span className="text-base">🔍</span>
                <input 
                    type="text" 
                    placeholder="ابحث فوراً عن مريض بكتابة الاسم الكامل أو رقم الهاتف المحمول..."
                    className="w-full text-xs font-medium text-slate-700 dark:text-slate-200 outline-none p-1 bg-transparent placeholder-slate-400"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2">✕ مسح</button>
                )}
            </div>

            {/* جدول استعراض كافة سجلات المرضى */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="overflow-x-auto text-xs">
                    <table className="w-full text-right border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 text-[11px]">
                            <tr>
                                <th className="p-4">اسم المريض الكامل</th>
                                <th className="p-4">رقم الهاتف</th>
                                <th className="p-4">العمر</th>
                                <th className="p-4">تاريخ التسجيل</th>
                                <th className="p-4 text-center">إجمالي الزيارات</th>
                                <th className="p-4 text-center">الملف التاريخي</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                            {patientsList.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-10 text-slate-400 font-bold">⚠️ لا يوجد مريض مطابق لبيانات البحث الحالية بالمركز.</td></tr>
                            ) : (
                                patientsList.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                                        <td className="p-4 font-bold text-slate-900 dark:text-slate-100 text-sm">{p.full_name}</td>
                                        <td className="p-4 font-mono text-slate-500 text-xs">{p.phone || '— لا يوجد رقم'}</td>
                                        <td className="p-4 font-bold text-[#1e3a8a] dark:text-blue-400">{p.age ? `${p.age} سنة` : '— غير محدد'}</td>
                                        <td className="p-4 text-slate-400">{p.created_at ? new Date(p.created_at).toLocaleDateString('ar-SY') : 'قديم'}</td>
                                        <td className="p-4 text-center">
                                            <span className="bg-blue-50 dark:bg-blue-950 text-[#1e3a8a] dark:text-blue-300 font-black px-3 py-1 rounded-full text-[11px] border border-blue-100 dark:border-blue-900">
                                                {p.cases_count || 0} زيارات
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button 
                                                onClick={() => handleOpenPatientProfile(p)}
                                                className="bg-[#1e3a8a] hover:bg-blue-900 text-white font-bold px-3.5 py-2 rounded-xl text-[10px] transition shadow-xs"
                                            >
                                                👁️ عرض الملف المرضي الكامل ←
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => fetchPatients(currentPage - 1, searchQuery)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold px-4 py-2 rounded-xl text-xs disabled:opacity-50"
                        >
                            السابق
                        </button>
                        <span className="text-xs text-slate-500 font-bold">
                            صفحة {currentPage} من {totalPages}
                        </span>
                        <button 
                            disabled={currentPage === totalPages}
                            onClick={() => fetchPatients(currentPage + 1, searchQuery)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold px-4 py-2 rounded-xl text-xs disabled:opacity-50"
                        >
                            التالي
                        </button>
                    </div>
                )}
            </div>

            {/* النافذة المنبثقة التفاعلية (Patient Profile Modal) */}
            {showProfileModal && selectedPatient && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto flex flex-col border border-slate-200 dark:border-slate-800" dir="rtl">
                        
                        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                            <div>
                                <span className="text-[10px] bg-blue-100 text-[#1e3a8a] dark:bg-blue-950 dark:text-blue-300 font-bold px-2.5 py-1 rounded-md">الملف الطبي الرقمي الرسمي</span>
                                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1.5">👤 {selectedPatient.full_name}</h3>
                                <p className="text-xs text-slate-400 mt-1 font-medium">📱 هاتف: {selectedPatient.phone || 'غير متوفر'} | 🎂 العمر: {selectedPatient.age ? `${selectedPatient.age} سنة` : 'غير محدد'} | 📆 مسجل منذ: {selectedPatient.created_at ? new Date(selectedPatient.created_at).toLocaleDateString('ar-SY') : '—'}</p>
                            </div>
                            <button onClick={() => setShowProfileModal(false)} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 font-bold p-2 rounded-full w-8 h-8 flex items-center justify-center transition">✕</button>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                            <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">📊 التسلسل الزمني للخدمات الطبية والزيارات السابقة:</h4>
                            
                            {loadingHistory ? (
                                <p className="text-center text-slate-400 py-8 text-xs font-bold animate-pulse">جاري سحب وفحص أرشيف الزيارات والعمليات من السيرفر...</p>
                            ) : patientHistory.length === 0 ? (
                                <p className="text-center text-slate-400 py-10 text-xs font-bold bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">هذا المريض لم يسجل أي زيارة معالجة مالية أو طبية بعد.</p>
                            ) : (
                                <div className="space-y-3">
                                    {patientHistory.map((c, idx) => (
                                        <div key={c.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-400">#{patientHistory.length - idx}</span>
                                                    <span className="font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-lg text-[11px]">{c.date}</span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${c.case_type === 'internal' ? 'bg-blue-50 text-[#1e3a8a] dark:bg-blue-950 dark:text-blue-300' : 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-300'}`}>
                                                        {c.case_type === 'internal' ? 'زيارة داخلية' : 'عملية خارجية'}
                                                    </span>
                                                </div>
                                                <p className="text-slate-500 dark:text-slate-400 font-medium text-[11px] pt-1">
                                                    📄 <span className="italic">{c.notes || 'لم يتم كتابة تفاصيل تشخيصية إضافية لهذه الحالة.'}</span>
                                                </p>
                                            </div>
                                            
                                            <div className="text-left bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-3xs whitespace-nowrap min-w-[120px]">
                                                <span className="text-[10px] text-slate-400 font-medium block">المبلغ المدفوع كاش:</span>
                                                <span className="font-black text-[#16a34a] text-sm">{parseFloat(c.total_paid).toLocaleString()} ل.س</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientsManagement;