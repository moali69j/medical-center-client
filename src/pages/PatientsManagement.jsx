import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const PatientsManagement = () => {
    const [patientsList, setPatientsList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // حالات النافذة المنبثقة للملف الشخصي التفاعلي
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientHistory, setPatientHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);

    // 1. جلب قائمة المرضى المسجلين عند تحميل الصفحة
    const fetchPatients = async (page = 1, search = '') => {
        setLoading(true);
        try {
            const url = search 
                ? `/patients/search?query=${search}&page=${page}`
                : `/patients?page=${page}`;
                
            const res = await api.get(url);
            
            // Handle Laravel Pagination (res.data.data) vs normal array fallback
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
        }, 500); // 500ms debounce for search

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // 2. دالة جلب التاريخ المرضي والزيارات الكاملة لمريض معين عند النقر عليه
    const handleOpenPatientProfile = async (patient) => {
        setSelectedPatient(patient);
        setShowProfileModal(true);
        setLoadingHistory(true);
        try {
            // جلب تقارير الحالات المرتبطة بهذا المريض تحديداً من الباك إند
            const res = await api.get(`/financial/reports?patient_id=${patient.id}`);
            // نقوم بفلترة الحالات محلياً لضمان مطابقتها للمريض المختار تماماً
            const filteredCases = res.data?.cases_details?.filter(c => c.patient_id === patient.id) || [];
            setPatientHistory(filteredCases);
        } catch (err) {
            console.error("خطأ في جلب سجل زيارات المريض:", err);
        } finally {
            setLoadingHistory(false);
        }
    };

    // دالة التصدير للإكسل عبر الباك إند
    const handleExportPatients = () => {
        window.open('http://localhost:8000/api/export/patients', '_blank');
    };

    if (loading) return <div className="text-center p-10 text-xl font-bold text-gray-600">🔍 جاري فتح ملفات وأرشيف المرضى المسجلين...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6" dir="rtl">
            
            {/* رأس الصفحة مع زر العودة للمالية */}
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">👥 أرشيف سجلات المرضى والولاء الطبي</h2>
                    <p className="text-xs text-gray-400 mt-1">البحث الفوري عن المريض واستعراض السجل التاريخي الكامل لزياراته وعملياته</p>
                </div>
                <button 
                    onClick={handleExportPatients}
                    className="bg-green-700 hover:bg-green-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-sm flex items-center gap-1.5"
                >
                    🟢 تصدير قائمة المرضى لـ Excel
                </button>
            </div>

            {/* شريط البحث الذكي السريع */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                <span className="text-base">🔍</span>
                <input 
                    type="text" 
                    placeholder="ابحث فوراً عن مريض بكتابة الاسم الكامل أو رقم الهاتف المحمول..."
                    className="w-full text-xs font-medium text-gray-700 outline-none p-1 bg-transparent"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 text-xs font-bold px-2">✕ مسح</button>
                )}
            </div>

            {/* جدول استعراض كافة سجلات المرضى وقوة تكرار زياراتهم */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto text-xs">
                    <table className="w-full text-right border-collapse">
                        <thead className="bg-gray-50/50 text-gray-500 font-bold border-b text-[11px]">
                            <tr>
                                <th className="p-4">اسم المريض الكامل</th>
                                <th className="p-4">رقم الهاتف</th> {/* إصلاح: نص ثابت في العناوين لعدم حدوث كراش */}
                                <th className="p-4">تاريخ التسجيل بالمركز</th>
                                <th className="p-4 text-center">إجمالي عدد الزيارات</th>
                                <th className="p-4 text-center">الملف التاريخي</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-gray-700 font-medium">
                            {patientsList.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-8 text-gray-400 font-bold">⚠️ لا يوجد مريض مطابق لبيانات البحث الحالية بالمركز.</td></tr>
                            ) : (
                                patientsList.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50/30 transition">
                                        <td className="p-4 font-bold text-gray-900 text-sm">{p.full_name}</td>
                                        <td className="p-4 font-mono text-gray-500 text-xs">{p.phone || p.phone_number || '— لا يوجد رقم'}</td>
                                        <td className="p-4 text-gray-400">{p.created_at ? new Date(p.created_at).toLocaleDateString('ar-SY') : 'قديم'}</td>
                                        <td className="p-4 text-center">
                                            <span className="bg-blue-50 text-blue-700 font-black px-2.5 py-1 rounded-full text-[11px] border border-blue-100">
                                                {p.cases_count || 0} زيارات
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button 
                                                onClick={() => handleOpenPatientProfile(p)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] transition shadow-sm"
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

                {/* أزرار التنقل بين الصفحات (Pagination) */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center p-4 bg-gray-50 border-t">
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => fetchPatients(currentPage - 1, searchQuery)}
                            className="bg-white border text-gray-700 font-bold px-4 py-2 rounded-lg text-xs disabled:opacity-50"
                        >
                            السابق
                        </button>
                        <span className="text-xs text-gray-500 font-bold">
                            صفحة {currentPage} من {totalPages}
                        </span>
                        <button 
                            disabled={currentPage === totalPages}
                            onClick={() => fetchPatients(currentPage + 1, searchQuery)}
                            className="bg-white border text-gray-700 font-bold px-4 py-2 rounded-lg text-xs disabled:opacity-50"
                        >
                            التالي
                        </button>
                    </div>
                )}
            </div>

            {/* 💎 النافذة المنبثقة التفاعلية (Patient Profile Modal) */}
            {showProfileModal && selectedPatient && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-3xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto flex flex-col" dir="rtl">
                        
                        {/* رأس كارت المريض */}
                        <div className="flex justify-between items-start border-b pb-4 mb-4">
                            <div>
                                <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-md">الملف الطبي الرقمي الرسمي</span>
                                <h3 className="text-lg font-black text-gray-900 mt-1">👤 {selectedPatient.full_name}</h3>
                                <p className="text-xs text-gray-400 mt-1 font-medium">📱 هاتف: {selectedPatient.phone || selectedPatient.phone_number || 'غير متوفر'} | 📆 مسجل منذ: {selectedPatient.created_at ? new Date(selectedPatient.created_at).toLocaleDateString('ar-SY') : '—'}</p>
                            </div>
                            <button onClick={() => setShowProfileModal(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 text-base font-bold p-1.5 rounded-full w-8 h-8 flex items-center justify-center transition">✕</button>
                        </div>

                        {/* محتوى السجل التاريخي للزيارات */}
                        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                            <h4 className="text-xs font-black text-gray-700 flex items-center gap-1.5">📊 التسلسل الزمني للخدمات الطبية والزيارات السابقة:</h4>
                            
                            {loadingHistory ? (
                                <p className="text-center text-gray-400 py-8 text-xs font-bold animate-pulse">جاري سحب وفحص أرشيف الزيارات والعمليات من السيرفر...</p>
                            ) : patientHistory.length === 0 ? (
                                <p className="text-center text-gray-400 py-10 text-xs font-bold bg-gray-50 rounded-2xl border border-dashed border-gray-200">هذا المريض لم يسجل أي زيارة معالجة مالية أو طبية بعد.</p>
                            ) : (
                                <div className="space-y-2.5">
                                    {patientHistory.map((c, idx) => (
                                        <div key={c.id} className="p-3.5 bg-gray-50/60 rounded-2xl border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-400">#{patientHistory.length - idx}</span>
                                                    <span className="font-bold text-gray-800 bg-white border px-2 py-0.5 rounded-lg text-[11px] shadow-2xs">{c.date}</span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${c.case_type === 'internal' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                                        {c.case_type === 'internal' ? 'زيارة داخلية' : 'عملية خارجية'}
                                                    </span>
                                                </div>
                                                <p className="text-gray-500 font-medium text-[11px] pt-1">
                                                    📄 <span className="italic">{c.notes || 'لم يتم كتابة تفاصيل تشخيصية إضافية لهذه الحالة.'}</span>
                                                </p>
                                            </div>
                                            
                                            <div className="text-left sm:text-left bg-white px-3 py-2 rounded-xl border border-gray-100/80 shadow-3xs whitespace-nowrap min-w-[120px]">
                                                <span className="text-[10px] text-gray-400 font-medium block">المبلغ المدفوع كاش:</span>
                                                <span className="font-black text-green-700 text-sm">{parseFloat(c.total_paid).toLocaleString()} ل.س</span>
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