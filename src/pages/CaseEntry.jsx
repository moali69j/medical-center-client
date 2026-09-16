import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const CaseEntry = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isOldPatient, setIsOldPatient] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [pastCases, setPastCases] = useState([]);

    const [availableServices, setAvailableServices] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]);

    const [patientData, setPatientData] = useState({
        id: null,
        full_name: '', phone: '', national_id: '', age: '', address: '',
        blood_type: '', chronic_diseases: '', current_medications: '', permanent_medical_notes: ''
    });

    const [caseData, setCaseData] = useState({
        case_type: 'internal',
        blood_pressure: '', sugar_level: '', oxygen_saturation: '',
        visit_notes: '', total_paid: 0
    });

    const [selectedServices, setSelectedServices] = useState([]);
    const [extraItems, setExtraItems] = useState([]);

    useEffect(() => {
        api.get('/services').then(res => setAvailableServices(res.data.services || [])).catch(() => {});
        api.get('/inventory').then(res => {
            const allItems = res.data || [];
            // الطريقة الأولى: استبعاد مواد العهدة العامة (المراهم والمعقمات) واقتصار المواد الإضافية على المواد القابلة للقياس
            setInventoryItems(allItems.filter(i => i.is_measurable));
        }).catch(() => {});
    }, []);

    // البحث اللحظي مع تصحيح تحذيرات ESLint عبر تجنب setState المتزامن المباشر الضار
    useEffect(() => {
        let isMounted = true;
        if (searchQuery.trim().length > 1) {
            const delayDebounceFn = setTimeout(() => {
                api.get(`/patients/search?query=${searchQuery}`)
                    .then(res => {
                        if (isMounted) {
                            setSearchResults(res.data.data || res.data || []);
                        }
                    })
                    .catch(() => {
                        if (isMounted) setSearchResults([]);
                    });
            }, 300);
            return () => {
                isMounted = false;
                clearTimeout(delayDebounceFn);
            };
        } else {
            setSearchResults([]);
        }
        return () => {
            isMounted = false;
        };
    }, [searchQuery]);

    const resetCurrentVisit = () => {
        setCaseData({
            case_type: 'internal',
            blood_pressure: '',
            sugar_level: '',
            oxygen_saturation: '',
            visit_notes: '',
            total_paid: 0
        });
        setSelectedServices([]);
        setExtraItems([]); 
    };

    const selectPatient = (patient) => {
        setIsOldPatient(true);
        const history = patient.case_reports || patient.caseReports || [];
        setPastCases(history);
        resetCurrentVisit(); 

        setPatientData({
            id: patient.id,
            full_name: patient.full_name || '',
            phone: patient.phone || '',
            national_id: patient.national_id || '',
            age: patient.age !== null && patient.age !== undefined ? patient.age : '',
            address: patient.address || '',
            blood_type: patient.blood_type || '',
            chronic_diseases: patient.chronic_diseases || '',
            current_medications: patient.current_medications || '',
            permanent_medical_notes: patient.permanent_medical_notes || '' 
        });
        
        setSearchResults([]);
        setSearchQuery('');
    };

    const resetFormToNewPatient = () => {
        setIsOldPatient(false);
        setPastCases([]);
        setPatientData({ 
            id: null, full_name: '', phone: '', national_id: '', age: '', address: '', 
            blood_type: '', chronic_diseases: '', current_medications: '', 
            permanent_medical_notes: '' 
        });
        resetCurrentVisit();
    };

    const handleAddService = (id) => {
        const service = availableServices.find(s => s.id === parseInt(id));
        if (service && !selectedServices.find(s => s.id === service.id)) {
            const updatedServices = [...selectedServices, service];
            setSelectedServices(updatedServices);
            const servicesTotal = updatedServices.reduce((sum, s) => sum + (s.calculated_price || 0), 0);
            setCaseData(prev => ({ ...prev, total_paid: servicesTotal }));
        }
    };

    const handleRemoveService = (serviceId) => {
        const updatedServices = selectedServices.filter(item => item.id !== serviceId);
        setSelectedServices(updatedServices);
        const servicesTotal = updatedServices.reduce((sum, s) => sum + (s.calculated_price || 0), 0);
        setCaseData(prev => ({ ...prev, total_paid: servicesTotal }));
    };

    const handleAddExtraItem = (id) => {
        const item = inventoryItems.find(i => i.id === parseInt(id));
        if (item && !extraItems.find(i => i.id === item.id)) {
            setExtraItems([...extraItems, { id: item.id, name: item.name, qty: 1, unit: item.unit }]);
        }
    };

    const handleSubmitCase = async (e) => {
        e.preventDefault();
        if (selectedServices.length === 0) {
            alert('يجب اختيار خدمة واحدة على الأقل لفتح الحالة!');
            return;
        }

        let finalPermanentNotes = patientData.permanent_medical_notes ? patientData.permanent_medical_notes.trim() : '';

        if (isOldPatient && pastCases.length > 0) {
            const originalNotes = pastCases[0]?.patient?.permanent_medical_notes 
                ? pastCases[0].patient.permanent_medical_notes.trim() 
                : '';

            if (finalPermanentNotes !== originalNotes && originalNotes !== '') {
                if (!finalPermanentNotes.includes(originalNotes)) {
                    finalPermanentNotes = `${originalNotes}\n📌 تعديل جديد (${new Date().toLocaleDateString('ar-SY')}): ${finalPermanentNotes}`;
                }
            }
        }

        const finalPayload = {
            patient: {
                ...patientData,
                age: patientData.age !== '' ? parseInt(patientData.age) : null,
                permanent_medical_notes: finalPermanentNotes 
            },
            case: caseData,
            services: selectedServices.map(s => s.id),
            extra_items: extraItems.map(i => ({ id: i.id, quantity: i.qty }))
        };

        try {
            const response = await api.post('/cases', finalPayload);
            alert(response.data.message || 'تم تسجيل الحالة بنجاح!');
            resetFormToNewPatient(); 
        } catch (err) {
            alert(err.response?.data?.message || 'خطأ أثناء حفظ الحالة الموحدة');
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6" dir="rtl">
            
            {/* شريط البحث العلوي ومستعرض الزيارات */}
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative flex-1 w-full">
                    <input 
                        type="text" 
                        placeholder="🔍 ابحث هنا عن مريض سابق (بالاسم، الهاتف، أو الرقم الوطني) لملء السجل تلقائياً..." 
                        className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#1e3a8a] outline-none text-slate-800 placeholder-slate-400"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchResults.length > 0 && (
                        <div className="absolute left-0 right-0 bg-white border border-slate-200 mt-1 rounded-2xl shadow-xl max-h-60 overflow-y-auto z-50 divide-y divide-slate-100">
                            {searchResults.map(p => (
                                <div key={p.id} onClick={() => selectPatient(p)} className="p-3.5 hover:bg-blue-50/50 transition cursor-pointer flex justify-between items-center text-xs">
                                    <div>
                                        <span className="font-bold text-slate-800 text-sm">{p.full_name}</span>
                                        <span className="text-slate-400 mr-3">📱 {p.phone || 'بلا رقم'}</span>
                                        <span className="text-slate-400 mr-3">🎂 العمر: {p.age ? `${p.age} سنة` : 'غير محدد'}</span>
                                    </div>
                                    <span className="text-[11px] bg-blue-100 text-[#1e3a8a] px-2.5 py-1 rounded-full font-bold">زارنا {p.cases_count || 0} مرّات</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {isOldPatient && (
                    <div className="flex gap-2 w-full md:w-auto justify-end">
                        <button type="button" onClick={() => setShowHistoryModal(true)} className="bg-purple-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-purple-700 transition shadow-xs">
                            ⏳ استعراض السجل السابق ({pastCases.length})
                        </button>
                        <button type="button" onClick={resetFormToNewPatient} className="bg-slate-100 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-200 transition">
                            ✕ مريض جديد بالكامل
                        </button>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmitCase} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* القسم الأول: الهوية الشخصية */}
                    <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200/80 space-y-4">
                        <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 text-sm">القسم الأول: هوية المريض الشخصية</h3>
                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${isOldPatient ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-[#16a34a]'}`}>
                                {isOldPatient ? 'سجل مسترجع' : 'ملف جديد'}
                            </span>
                        </div>
                        
                        <div className="space-y-3.5 text-xs text-slate-600 font-medium">
                            <div>
                                <label className="block mb-1.5 font-bold">اسم المريض الكامل:</label>
                                <input type="text" required className="w-full border border-slate-200 p-2.5 rounded-xl bg-slate-50 disabled:opacity-80 outline-none focus:ring-2 focus:ring-[#1e3a8a]" value={patientData.full_name} onChange={e => setPatientData({...patientData, full_name: e.target.value})} disabled={isOldPatient} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block mb-1.5 font-bold">رقم الهاتف:</label>
                                    <input type="text" required className="w-full border border-slate-200 p-2.5 rounded-xl bg-slate-50 disabled:opacity-80 outline-none focus:ring-2 focus:ring-[#1e3a8a]" value={patientData.phone} onChange={e => setPatientData({...patientData, phone: e.target.value})} disabled={isOldPatient} />
                                </div>
                                <div>
                                    <label className="block mb-1.5 font-bold text-[#16a34a]">العمر (بالسنوات):</label>
                                    <input type="number" min="0" max="120" placeholder="مثال: 35" className="w-full border border-slate-200 p-2.5 rounded-xl bg-emerald-50/30 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#16a34a]" value={patientData.age} onChange={e => setPatientData({...patientData, age: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1.5 font-bold">الرقم الوطني:</label>
                                <input type="text" className="w-full border border-slate-200 p-2.5 rounded-xl bg-slate-50 disabled:opacity-80 outline-none focus:ring-2 focus:ring-[#1e3a8a]" value={patientData.national_id} onChange={e => setPatientData({...patientData, national_id: e.target.value})} disabled={isOldPatient} />
                            </div>
                            <div>
                                <label className="block mb-1.5 font-bold">العنوان:</label>
                                <input type="text" className="w-full border border-slate-200 p-2.5 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-[#1e3a8a]" value={patientData.address} onChange={e => setPatientData({...patientData, address: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    {/* القسم الثاني: البيانات الصحية التراكمية */}
                    <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200/80 space-y-4">
                        <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">القسم الثاني: التاريخ الطبي والملف التراكمي</h3>
                        
                        <div className="space-y-3.5 text-xs text-slate-600 font-medium">
                            <div>
                                <label className="block mb-1.5 font-bold text-[#1e3a8a]">زمرة الدم:</label>
                                <select className="w-full border border-slate-200 p-2.5 rounded-xl bg-blue-50/50 font-bold outline-none" value={patientData.blood_type} onChange={e => setPatientData({...patientData, blood_type: e.target.value})}>
                                    <option value="">غير محددة</option>
                                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block mb-1.5 font-bold">الأمراض المزمنة والتحسس:</label>
                                <textarea rows="2" placeholder="سكري، ضغط، تحسس بنسلين..." className="w-full border border-slate-200 p-2.5 rounded-xl bg-slate-50 outline-none" value={patientData.chronic_diseases} onChange={e => setPatientData({...patientData, chronic_diseases: e.target.value})}></textarea>
                            </div>
                            <div>
                                <label className="block mb-1.5 font-bold">الأدوية الدائمة التي يتناولها:</label>
                                <textarea rows="2" placeholder="أسبرين، مميع، إنسولين..." className="w-full border border-slate-200 p-2.5 rounded-xl bg-slate-50 outline-none" value={patientData.current_medications} onChange={e => setPatientData({...patientData, current_medications: e.target.value})}></textarea>
                            </div>
                            <div>
                                <label className="block mb-1.5 font-bold text-amber-700">ملاحظات جراحية وعمليات سابقة:</label>
                                <textarea rows="2" placeholder="أجرى جراحة عمود فقري، تركيب شبكة..." className="w-full border border-amber-200 p-2.5 rounded-xl bg-amber-50/20 outline-none" value={patientData.permanent_medical_notes} onChange={e => setPatientData({...patientData, permanent_medical_notes: e.target.value})}></textarea>
                            </div>
                        </div>
                    </div>

                    {/* القسم الثالث: الفحص والزيارة الحالية */}
                    <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200/80 space-y-4">
                        <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3">القسم الثالث: الفحص السريري والزيارة الحالية</h3>
                        
                        <div className="space-y-3.5 text-xs text-slate-600 font-medium">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block mb-1.5 font-bold">نوع الزيارة:</label>
                                    <select className="w-full border border-slate-200 p-2.5 rounded-xl font-bold text-[#1e3a8a] bg-slate-50 outline-none" value={caseData.case_type} onChange={e => setCaseData({...caseData, case_type: e.target.value})}>
                                        <option value="internal">داخلية (60% للمركز)</option>
                                        <option value="external">خارجية (40% للمركز)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-1.5 font-bold">ضغط الدم (BP):</label>
                                    <input type="text" placeholder="120/80" className="w-full border border-slate-200 p-2.5 rounded-xl bg-slate-50 outline-none" value={caseData.blood_pressure} onChange={e => setCaseData({...caseData, blood_pressure: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block mb-1.5 font-bold">مستوى السكر:</label>
                                    <input type="text" placeholder="95 mg/dL" className="w-full border border-slate-200 p-2.5 rounded-xl bg-slate-50 outline-none" value={caseData.sugar_level} onChange={e => setCaseData({...caseData, sugar_level: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block mb-1.5 font-bold">نسبة الأكسجة (SpO2):</label>
                                    <input type="text" placeholder="98%" className="w-full border border-slate-200 p-2.5 rounded-xl bg-slate-50 outline-none" value={caseData.oxygen_saturation} onChange={e => setCaseData({...caseData, oxygen_saturation: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1.5 font-bold text-rose-600">ملاحظات لزيارة اليوم فقط:</label>
                                <textarea rows="4" placeholder="اكتب تفاصيل وملاحظات هذه الزيارة هنا..." className="w-full border border-rose-200 p-2.5 rounded-xl bg-rose-50/10 outline-none" value={caseData.visit_notes} onChange={e => setCaseData({...caseData, visit_notes: e.target.value})}></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                {/* الفاتورة الذكية والمستهلكات */}
                <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm mb-2.5">1. اختيار الطبابات والخدمات المقدمة:</h4>
                            <select className="w-full border border-slate-200 p-3.5 rounded-xl text-sm bg-slate-50 outline-none font-semibold text-slate-700 focus:ring-2 focus:ring-[#1e3a8a]" value="" onChange={(e) => handleAddService(e.target.value)}>
                                <option value="" disabled>اختر خدمة من القائمة لإضافتها للحالة...</option>
                                {availableServices.map(s => <option key={s.id} value={s.id}>{s.name} ({s.credits_required} نقطة - {s.calculated_price?.toLocaleString()} ل.س)</option>)}
                            </select>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {selectedServices.map(s => (
                                    <span key={s.id} className="bg-blue-50 text-[#1e3a8a] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-blue-200 shadow-2xs">
                                        {s.name} ({s.calculated_price?.toLocaleString()} ل.س)
                                        <button type="button" onClick={() => handleRemoveService(s.id)} className="text-red-500 font-black hover:text-red-700 text-sm mr-1">×</button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        <div>
                            <h4 className="font-bold text-slate-800 text-sm mb-2.5">2. ربط مواد إضافية مستهلكة في زيارة اليوم:</h4>
                            <select className="w-full border border-slate-200 p-3.5 rounded-xl text-sm bg-slate-50 outline-none font-semibold text-slate-700 focus:ring-2 focus:ring-[#1e3a8a]" value="" onChange={(e) => handleAddExtraItem(e.target.value)}>
                                <option value="" disabled>اختر مادة إضافية مستهلكة (مثل شاش زائد)...</option>
                                {inventoryItems.map(i => <option key={i.id} value={i.id}>{i.name} (متوفر: {i.quantity} {i.unit})</option>)}
                            </select>
                            <div className="space-y-2 mt-3">
                                {extraItems.map((item, idx) => (
                                    <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl text-sm border border-slate-200">
                                        <span className="font-bold text-slate-800">{item.name}</span>
                                        <div className="flex items-center gap-2">
                                            <input type="number" min="1" className="w-16 border border-slate-200 text-center p-1.5 rounded-lg bg-white font-bold text-slate-800" value={item.qty} onChange={e => {
                                                const updated = [...extraItems];
                                                updated[idx].qty = parseInt(e.target.value) || 1;
                                                setExtraItems(updated);
                                            }} />
                                            <span className="text-slate-500 text-xs">{item.unit}</span>
                                            <button type="button" onClick={() => setExtraItems(extraItems.filter(i => i.id !== item.id))} className="text-red-500 font-black hover:text-red-700 text-base mr-2">×</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 p-6 rounded-3xl border border-blue-100/60 flex flex-col justify-between">
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm mb-4">💳 ملخص الصندوق والحساب المالي للزيارة</h4>
                            <div className="space-y-3 text-xs text-slate-600 font-medium">
                                <div className="flex justify-between"><span>إجمالي النقاط (Credits):</span><span className="font-bold text-slate-800">{selectedServices.reduce((sum, s) => sum + s.credits_required, 0)} نقطة</span></div>
                                <div className="flex justify-between"><span>حساب الخدمات التلقائي:</span><span>{selectedServices.reduce((sum, s) => sum + (s.calculated_price || 0), 0).toLocaleString()} ل.س</span></div>
                                <hr className="border-slate-200" />
                                <div className="flex justify-between items-center text-sm pt-2">
                                    <span className="font-bold text-[#1e3a8a] text-sm">المبلغ النهائي المستلم:</span>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number" 
                                            required
                                            className="border border-slate-200 p-2.5 rounded-xl w-36 font-black text-center text-lg text-[#16a34a] bg-white shadow-2xs outline-none"
                                            value={caseData.total_paid}
                                            onChange={e => setCaseData({...caseData, total_paid: parseFloat(e.target.value) || 0})}
                                        />
                                        <span className="font-bold text-slate-500">ل.س</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-[#1e3a8a] hover:bg-blue-900 text-white py-4 rounded-2xl font-bold text-xs shadow-md transition mt-6">
                            💾 حفظ وإغلاق الحالة وتوزيع الأرباح وخصم المخزن
                        </button>
                    </div>
                </div>
            </form>

            {/* نافذة مستكشف الزيارات السابقة (Modal Timeline) */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-slate-200" dir="rtl">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                            <h3 className="text-sm font-bold text-slate-800">⏳ السجل الصحي للمريض: <span className="text-[#1e3a8a]">{patientData.full_name}</span> (العمر: {patientData.age || 'غير محدد'})</h3>
                            <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 font-bold hover:text-slate-600 text-xl">✕</button>
                        </div>
                        
                        <div className="space-y-6">
                            {pastCases.length === 0 ? (
                                <p className="text-center text-slate-400 py-6 text-xs font-medium">لا يوجد زيارات مسجلة مسبقاً لهذا المريض.</p>
                            ) : (
                                pastCases.map((c, idx) => (
                                    <div key={c.id} className="border-r-2 border-blue-200 pl-2 pr-4 relative space-y-2 text-xs text-slate-600">
                                        <div className="absolute right-[-7px] top-1.5 w-3 h-3 rounded-full bg-[#1e3a8a]"></div>
                                        <div className="flex justify-between items-center font-bold text-slate-800 bg-slate-50 p-2.5 rounded-xl">
                                            <span>الزيارة رقم {pastCases.length - idx} ({c.case_type === 'internal' ? 'داخلية' : 'خارجية'})</span>
                                            <span className="text-slate-400 font-normal">{new Date(c.created_at).toLocaleDateString('ar-SY')}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-500 px-2">
                                            <span>🩺 الضغط: {c.blood_pressure || 'غير مسجل'}</span>
                                            <span>🩸 السكري: {c.sugar_level || 'غير مسجل'}</span>
                                            <span>🫁 الأكسجة: {c.oxygen_saturation || 'غير مسجل'}</span>
                                        </div>
                                        <div className="px-2">
                                            <span className="font-bold block text-slate-700">📋 ملاحظات زيارة اليوم:</span>
                                            <p className="bg-amber-50/40 p-2.5 rounded-xl border border-dashed border-amber-200 text-slate-600 mt-1">{c.visit_notes || 'لا يوجد ملاحظات مدونة'}</p>
                                        </div>
                                        <div className="px-2 flex flex-wrap gap-1 items-center">
                                            <span className="font-bold text-slate-700 ml-2">🛠️ الخدمات الفعالة:</span>
                                            {c.services && c.services.map(s => (
                                                <span key={s.id} className="bg-blue-50 text-[#1e3a8a] px-2 py-0.5 rounded-lg text-[10px] border border-blue-100 font-bold">{s.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CaseEntry;