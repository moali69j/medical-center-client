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
    const [showProfileView, setShowProfileView] = useState(false);

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
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // فتح صفحة السجل الكامل للمريض
    const handleOpenPatientProfile = async (patient) => {
        setSelectedPatient(patient);
        setShowProfileView(true);
        setLoadingHistory(true);
        try {
            const res = await api.get(`/patients/${patient.id}/cases`);
            const fetchedCases = res.data?.cases_details || [];
            setPatientHistory(fetchedCases);
        } catch (err) {
            console.error("خطأ في جلب سجل زيارات المريض:", err);
            setPatientHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleExportPatients = () => {
        window.open('http://localhost:8000/api/export/patients', '_blank');
    };

    if (loading) return <div className="text-center p-12 text-sm font-bold text-slate-500">🔍 جاري تحميل أرشيف السجلات الطبية للمرضى...</div>;

    return (
        <div className="space-y-6" dir="rtl">
            
            {/* إذا كان مريض محدد معروضاً، نفتح صفحته الكاملة الشبيهة بصفحة إضافة حالة */}
            {showProfileView && selectedPatient ? (
                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xs border border-slate-200/80 space-y-6 animate-fade-in">
                    
                    {/* رأس الصفحة مع زر العودة */}
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1e3a8a] font-black text-xl flex items-center justify-center border border-blue-100">
                                👤
                            </div>
                            <div>
                                <span className="text-[10px] bg-blue-100 text-[#1e3a8a] font-bold px-2.5 py-0.5 rounded-md">السجل المرضي الرقمي الشامل</span>
                                <h2 className="text-xl font-black text-slate-900 mt-0.5">{selectedPatient.full_name}</h2>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowProfileView(false)} 
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition"
                        >
                            ← العودة لقائمة المرضى
                        </button>
                    </div>

                    {/* شبكة معلومات المريض */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* معلومات الهوية */}
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                            <h3 className="font-bold text-slate-800 text-sm border-b pb-2">📋 الهوية والبيانات الشخصية</h3>
                            <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                                <div><span className="font-bold text-slate-400 block">الاسم الكامل:</span> <span className="font-bold text-slate-800">{selectedPatient.full_name}</span></div>
                                <div><span className="font-bold text-slate-400 block">رقم الهاتف:</span> <span className="font-mono font-bold text-slate-800">{selectedPatient.phone || '—'}</span></div>
                                <div><span className="font-bold text-slate-400 block">العمر:</span> <span className="font-bold text-[#1e3a8a]">{selectedPatient.age ? `${selectedPatient.age} سنة` : 'غير محدد'}</span></div>
                                <div><span className="font-bold text-slate-400 block">الرقم الوطني:</span> <span className="font-mono">{selectedPatient.national_id || '—'}</span></div>
                                <div className="col-span-2"><span className="font-bold text-slate-400 block">العنوان:</span> <span>{selectedPatient.address || '—'}</span></div>
                            </div>
                        </div>

                        {/* الملف الصحي والتراكمي */}
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                            <h3 className="font-bold text-slate-800 text-sm border-b pb-2">🏥 الملف الصحي والبيانات الطبية الدائمة</h3>
                            <div className="space-y-2 text-xs text-slate-600">
                                <div><span className="font-bold text-[#16a34a]">زمرة الدم:</span> <span className="font-bold text-slate-800">{selectedPatient.blood_type || 'غير مسجلة'}</span></div>
                                <div><span className="font-bold text-slate-700">الأمراض المزمنة والتحسس:</span> <p className="bg-white p-2 rounded-xl border border-slate-200 mt-1">{selectedPatient.chronic_diseases || 'لا يوجد'}</p></div>
                                <div><span className="font-bold text-slate-700">الأدوية الدائمة:</span> <p className="bg-white p-2 rounded-xl border border-slate-200 mt-1">{selectedPatient.current_medications || 'لا يوجد'}</p></div>
                                <div><span className="font-bold text-amber-700">ملاحظات العمليات السابقة:</span> <p className="bg-amber-50/50 p-2 rounded-xl border border-amber-200 mt-1">{selectedPatient.permanent_medical_notes || 'لا يوجد'}</p></div>
                            </div>
                        </div>
                    </div>

                    {/* سجل الزيارات والحالات السابقة للمريض */}
                    <div className="space-y-4 pt-4">
                        <h3 className="font-bold text-slate-800 text-sm border-b pb-2">📂 سجل الزيارات والخدمات الطبية المقدمة للمريض ({patientHistory.length}):</h3>
                        
                        {loadingHistory ? (
                            <p className="text-center text-slate-400 py-8 text-xs font-bold animate-pulse">جاري جلب تفاصيل زيارات المريض...</p>
                        ) : patientHistory.length === 0 ? (
                            <p className="text-center text-slate-400 py-8 text-xs font-bold bg-slate-50 rounded-2xl border border-dashed">لم يسجل هذا المريض أي زيارة سابقة.</p>
                        ) : (
                            <div className="space-y-3">
                                {patientHistory.map((c, idx) => (
                                    <div key={c.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                                        <div className="flex justify-between items-center font-bold">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-400"># زيارة رقم {patientHistory.length - idx}</span>
                                                <span className="bg-white border px-2.5 py-0.5 rounded-lg text-slate-700">{c.created_at ? new Date(c.created_at).toLocaleDateString('ar-SY') : ''}</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${c.case_type === 'internal' ? 'bg-blue-50 text-[#1e3a8a]' : 'bg-orange-50 text-orange-600'}`}>
                                                    {c.case_type === 'internal' ? 'زيارة داخلية' : 'عملية خارجية'}
                                                </span>
                                            </div>
                                            <span className="font-black text-[#16a34a] bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100">{parseFloat(c.total_paid).toLocaleString()} ل.س</span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-100">
                                            <span>🩺 الضغط: {c.blood_pressure || '—'}</span>
                                            <span>🩸 السكر: {c.sugar_level || '—'}</span>
                                            <span>🫁 الأكسجة: {c.oxygen_saturation || '—'}</span>
                                        </div>

                                        <p className="text-slate-600 font-medium">
                                            <span className="font-bold text-slate-700 block mb-0.5">ملاحظات الزيارة:</span>
                                            <span className="bg-white p-2 rounded-lg block border border-slate-200 text-slate-700">{c.visit_notes || 'لا يوجد ملاحظات مدونة.'}</span>
                                        </p>

                                        <div className="flex flex-wrap gap-1 items-center pt-1">
                                            <span className="font-bold text-slate-700 ml-1">الخدمات الطبية المقدمة:</span>
                                            {c.services && c.services.map(s => (
                                                <span key={s.id} className="bg-blue-50 text-[#1e3a8a] px-2.5 py-0.5 rounded-lg text-[10px] font-bold border border-blue-100">{s.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    {/* رأس الصفحة العادي وقائمة المرضى */}
                    <div className="flex justify-between items-center border-b border-slate-200/80 pb-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">👥 سجل المرضى والملف الصحي التراكمي</h2>
                            <p className="text-xs text-slate-400 mt-1">البحث السريع عن المريض، استعراض العمر، التاريخ الطبي، وجميع الزيارات</p>
                        </div>
                        <button onClick={handleExportPatients} className="bg-[#16a34a] hover:bg-green-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-xs">
                            🟢 تصدير السجلات لـ Excel
                        </button>
                    </div>

                    {/* شريط البحث الذكي */}
                    <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 flex items-center gap-3">
                        <span className="text-base">🔍</span>
                        <input 
                            type="text" 
                            placeholder="ابحث فوراً باسم المريض، رقم الهاتف، أو الرقم الوطني..."
                            className="w-full text-xs font-medium text-slate-700 outline-none p-1 bg-transparent placeholder-slate-400"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2">✕ مسح</button>
                        )}
                    </div>

                    {/* جدول المرضى */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto text-xs">
                            <table className="w-full text-right border-collapse">
                                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px]">
                                    <tr>
                                        <th className="p-4">اسم المريض الكامل</th>
                                        <th className="p-4">رقم الهاتف</th>
                                        <th className="p-4">العمر</th>
                                        <th className="p-4">زمرة الدم</th>
                                        <th className="p-4 text-center">عدد الزيارات</th>
                                        <th className="p-4 text-center">استعراض السجل الكامل</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                    {patientsList.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center py-10 text-slate-400 font-bold">⚠️ لا يوجد مريض مطابق لنتائج البحث.</td></tr>
                                    ) : (
                                        patientsList.map(p => {
                                            // معالجة آمنة لضمان قراءة عداد الحالات مهما كانت التسمية القادمة من الباك إند
                                            const totalVisits = p.cases_count ?? p.case_reports_count ?? p.caseReports_count ?? 0;
                                            return (
                                                <tr key={p.id} className="hover:bg-slate-50/50 transition">
                                                    <td className="p-4 font-bold text-slate-900 text-sm">{p.full_name}</td>
                                                    <td className="p-4 font-mono text-slate-500 text-xs">{p.phone || '—'}</td>
                                                    <td className="p-4 font-bold text-[#1e3a8a]">{p.age ? `${p.age} سنة` : '—'}</td>
                                                    <td className="p-4 font-bold text-[#16a34a]">{p.blood_type || '—'}</td>
                                                    <td className="p-4 text-center">
                                                        <span className="bg-blue-50 text-[#1e3a8a] font-black px-3 py-1 rounded-full text-[11px] border border-blue-100">
                                                            {totalVisits} زيارات
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <button 
                                                            onClick={() => handleOpenPatientProfile(p)}
                                                            className="bg-[#1e3a8a] hover:bg-blue-900 text-white font-bold px-3.5 py-2 rounded-xl text-[10px] transition shadow-xs"
                                                        >
                                                            📂 فتح الملف الطبي ←
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex justify-between items-center p-4 bg-slate-50 border-t border-slate-200">
                                <button disabled={currentPage === 1} onClick={() => fetchPatients(currentPage - 1, searchQuery)} className="bg-white border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs disabled:opacity-50">السابق</button>
                                <span className="text-xs text-slate-500 font-bold">صفحة {currentPage} من {totalPages}</span>
                                <button disabled={currentPage === totalPages} onClick={() => fetchPatients(currentPage + 1, searchQuery)} className="bg-white border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs disabled:opacity-50">التالي</button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default PatientsManagement;