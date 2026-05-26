import React, { useState, useEffect} from 'react';
import api from "../api/axios";

const CaseEntry = () => {
    // أضف هذه الحالات (States) في أعلى المكون
const [availableServices, setAvailableServices] = useState([]);
const [selectedServices, setSelectedServices] = useState([]);

// جلب الخدمات عند تحميل الصفحة
useEffect(() => {
    api.get('/services').then(res => setAvailableServices(res.data));
}, []);

// دالة لإضافة خدمة للقائمة المختارة وحساب السعر
const addService = (serviceId) => {
    const service = availableServices.find(s => s.id === parseInt(serviceId));
    if (service && !selectedServices.find(s => s.id === service.id)) {
        const updatedServices = [...selectedServices, service];
        setSelectedServices(updatedServices);
        
        // حساب السعر تلقائياً (عدد النقاط * سعر النقطة الافتراضي 1000)
        const newTotal = updatedServices.reduce((sum, s) => sum + (s.credits_required * 1000), 0);
        setCaseDetails({ ...caseDetails, total_paid: newTotal });
    }
};
    const [patient, setPatient] = useState({
        full_name: '', phone: '', national_id: '', address: '',
        blood_type: '', chronic_diseases: '', current_medications: '', extra_notes: ''
    });

    const [caseDetails, setCaseDetails] = useState({
        case_type: 'internal',
        blood_pressure: '', sugar_level: '', oxygen_saturation: '',
        total_paid: '', case_notes: ''
    });

    // دالة البحث التلقائي عند كتابة رقم الهاتف
    const handleSearch = async (val) => {
        setPatient({ ...patient, phone: val });
        if (val.length >= 10) { // يبدأ البحث بعد كتابة رقم هاتف كامل تقريباً
            try {
                const res = await api.get(`/patients/search?query=${val}`);
                if (res.data) {
                    setPatient(res.data); // تعبئة البيانات تلقائياً إذا وُجد
                }
            } catch (err) {
                console.log("مريض جديد");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/cases', { ...patient, ...caseDetails, services: [1] }); // حالياً نرسل خدمة رقم 1 للتجربة
            alert(response.data.message);
        } catch (error) {
            alert("خطأ في البيانات، يرجى التأكد من الحقول الأساسية");
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg my-10" dir="rtl">
            <h2 className="text-2xl font-bold mb-6 text-blue-800 border-b pb-2">تسجيل حالة مرضية جديدة</h2>
            <div className="bg-red-500 text-white p-10 text-center">
  إذا رأيت هذا باللون الأحمر، فالتيلويند يعمل!
</div>
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* قسم المريض */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2 text-gray-600 font-semibold">بيانات المريض الأساسية</div>
                    <input className="border p-2 rounded focus:ring-2 focus:ring-blue-400" placeholder="رقم الهاتف (للبحث أو الإضافة)" value={patient.phone} onChange={(e) => handleSearch(e.target.value)} required />
                    <input className="border p-2 rounded" placeholder="الاسم الكامل" value={patient.full_name} onChange={(e) => setPatient({...patient, full_name: e.target.value})} required />
                    <input className="border p-2 rounded" placeholder="الرقم الوطني" value={patient.national_id || ''} onChange={(e) => setPatient({...patient, national_id: e.target.value})} />
                    <select className="border p-2 rounded" value={patient.blood_type || ''} onChange={(e) => setPatient({...patient, blood_type: e.target.value})}>
                        <option value="">زمرة الدم</option>
                        <option value="A+">A+</option>
                        <option value="O+">O+</option>
                        {/* أضف البقية لاحقاً */}
                    </select>
                </section>

                <hr />
                <section className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
    <h3 className="font-semibold mb-3 text-gray-700">الخدمات والمستهلكات</h3>
    <div className="flex gap-4 mb-4">
        <select 
            className="border p-2 rounded flex-1"
            onChange={(e) => addService(e.target.value)}
            value=""
        >
            <option value="" disabled>اختر خدمة لإضافتها...</option>
            {availableServices.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.credits_required} نقطة)</option>
            ))}
        </select>
    </div>

    {/* عرض الخدمات المختارة كبطاقات صغيرة (Tags) */}
    <div className="flex flex-wrap gap-2">
        {selectedServices.map(s => (
            <span key={s.id} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                {s.name}
                <button type="button" onClick={() => setSelectedServices(selectedServices.filter(item => item.id !== s.id))} className="text-red-500 font-bold">×</button>
            </span>
        ))}
    </div>
</section>
 <hr />


                {/* قسم الحالة */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-3 text-gray-600 font-semibold">تقرير الفحص السريري</div>
                    <input className="border p-2 rounded" placeholder="الضغط (مثال: 12/8)" onChange={(e) => setCaseDetails({...caseDetails, blood_pressure: e.target.value})} />
                    <input className="border p-2 rounded" placeholder="السكري" onChange={(e) => setCaseDetails({...caseDetails, sugar_level: e.target.value})} />
                    <input className="border p-2 rounded" placeholder="الأكسجة" onChange={(e) => setCaseDetails({...caseDetails, oxygen_saturation: e.target.value})} />
                    
                    <div className="col-span-3">
                        <label className="block mb-2 font-medium">نوع الحالة:</label>
                        <select className="border p-2 rounded w-full" onChange={(e) => setCaseDetails({...caseDetails, case_type: e.target.value})}>
                            <option value="internal">داخل المركز (60% للمركز)</option>
                            <option value="external">زيارة خارجية (40% للمركز)</option>
                        </select>
                    </div>
                </section>

                <div className="flex justify-between items-center bg-blue-50 p-4 rounded">
                    <input className="border p-2 rounded w-1/3" placeholder="المبلغ المدفوع كاش" type="number" onChange={(e) => setCaseDetails({...caseDetails, total_paid: e.target.value})} required />
                    <button type="submit" className="bg-blue-700 text-white px-10 py-2 rounded-lg hover:bg-blue-800 transition shadow-md">حفظ وإصدار التقرير</button>
                </div>
            </form>
        </div>
    );
};

export default CaseEntry;