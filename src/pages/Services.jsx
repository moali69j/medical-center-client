import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Services = () => {
    const [services, setServices] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [creditPrice, setCreditPrice] = useState(1000);
    const [newCreditPrice, setNewCreditPrice] = useState('');
    
    // حالة الخدمة الجديدة
    const [newService, setNewService] = useState({ name: '', credits_required: '' });
    const [selectedMaterials, setSelectedMaterials] = useState([]); // المواد المربوطة بالخدمة الجديدة

    // دالة محمية بالكامل لجلب البيانات مع validation
    const fetchPageData = async () => {
        try {
            // 1. جلب الخدمات والكريدت
            const resServices = await api.get('/services');
            if (resServices.data) {
                setServices(resServices.data.services || []);
                setCreditPrice(resServices.data.current_credit_price || 1000);
            }
            
            // 2. جلب المخزون بشكل مستقل تماماً
            const resInventory = await api.get('/inventory');
            if (resInventory.data && Array.isArray(resInventory.data)) {
                // نتأكد أن البيانات مصفوفة قبل عمل filter لحمايتها من الكراش
                setInventory(resInventory.data.filter(i => i.is_measurable));
            } else {
                setInventory([]);
            }

        } catch (err) {
            console.error("خطأ داخلي في جلب البيانات:", err);
        }
    };

    useEffect(() => {
        void fetchPageData();
    }, []);

    // تحديث سعر الكريدت
   const handleUpdateCredit = async (e) => {
    e.preventDefault();
    try {
        // نمرر القيمة كـ Number باستخدام parseFloat أو Number
        const response = await api.put('/settings/credit-price', { 
            credit_price: parseFloat(newCreditPrice) 
        });
        alert(response.data.message);
        setNewCreditPrice('');
        fetchPageData(); // تحديث الصفحة
    } catch (err) { 
        alert(err.response?.data?.message || 'خطأ في تحديث السعر'); 
    }
};

    // إضافة مادة لقائمة مستلزمات الخدمة الجديدة
    const addMaterialToService = (itemId) => {
        const item = inventory.find(i => i.id === parseInt(itemId));
        if (item && !selectedMaterials.find(m => m.id === item.id)) {
            setSelectedMaterials([...selectedMaterials, { id: item.id, name: item.name, quantity: 1, unit: item.unit }]);
        }
    };

    // حفظ الخدمة بالكامل
   const handleCreateService = async (e) => {
    e.preventDefault();
    try {
        // نجهز المصفوفة بحيث ترسل فقط الـ id والـ quantity لكل مادة مرتبطة
        const formattedMaterials = selectedMaterials.map(m => ({
            id: m.id,
            quantity: parseFloat(m.quantity)
        }));

        const payload = {
            name: newService.name,
            credits_required: parseInt(newService.credits_required),
            materials: formattedMaterials 
        };

        const response = await api.post('/services', payload);
        alert(response.data.message || 'تم الحفظ بنجاح');
        
        // تصفير الحقول بعد النجاح
        setNewService({ name: '', credits_required: '' });
        setSelectedMaterials([]);
        fetchPageData(); // إعادة جلب البيانات لتحديث الجدول
    } catch (err) { 
        alert(err.response?.data?.message || 'خطأ في الحفظ، تأكد من البيانات الأساسية'); 
    }
};

    return (
        <div className="max-w-6xl mx-auto p-6" dir="rtl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">لوحة الإدارة: الخدمات والتسعير الذكي</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* العمود الأول: الإعدادات وإضافة خدمة */}
                <div className="space-y-6 lg:col-span-1">
                    {/* تحديث سعر الكريدت */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-700 mb-2">تحديث سعر الكريدت (النقاط)</h3>
                        <p className="text-xs text-gray-400 mb-3">السعر الحالي: <span className="text-blue-600 font-bold text-sm">{creditPrice} ل.س</span></p>
                        <form onSubmit={handleUpdateCredit} className="flex gap-2">
                            <input type="number" required placeholder="السعر الجديد..." className="border p-2 rounded-lg flex-1 text-sm" value={newCreditPrice} onChange={e => setNewCreditPrice(e.target.value)} />
                            <button type="submit" className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs">تعديل الكل</button>
                        </form>
                    </div>

                    {/* إنشاء خدمة جديدة */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-700 mb-4">إنشاء خدمة جديدة وطبابة</h3>
                        <form onSubmit={handleCreateService} className="space-y-3">
                            <input type="text" placeholder="اسم الخدمة (مثال: غيار جرح حروق)" required className="w-full border p-2 rounded-lg text-sm" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} />
                            <input type="number" placeholder="عدد النقاط (Credits)" required className="w-full border p-2 rounded-lg text-sm" value={newService.credits_required} onChange={e => setNewService({...newService, credits_required: e.target.value})} />
                            
                            <hr />
                            <label className="block text-xs font-bold text-gray-500">ربط المستلزمات الطبية المستهلكة آلياً:</label>
                            <select className="w-full border p-2 rounded-lg text-sm" value="" onChange={e => addMaterialToService(e.target.value)}>
                                <option value="" disabled>اختر مادة من المخزن...</option>
                                {inventory.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                            </select>

                            {/* عرض المواد المختارة لتحديد الكمية المستهلكة لكل حركة */}
                            <div className="space-y-2">
                                {selectedMaterials.map((m, idx) => (
                                    <div key={m.id} className="flex justify-between items-center bg-gray-50 p-2 rounded border text-xs">
                                        <span>{m.name}</span>
                                        <div className="flex items-center gap-1">
                                            <input type="number" step="0.1" required className="w-12 border text-center p-1 rounded" value={m.quantity} onChange={e => {
                                                const updated = [...selectedMaterials];
                                                updated[idx].quantity = parseFloat(e.target.value);
                                                setSelectedMaterials(updated);
                                            }} />
                                            <span>{m.unit}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-green-700 transition">حفظ الخدمة ومستلزماتها</button>
                        </form>
                    </div>
                </div>

                {/* العمود الثاني: جدول استعراض الخدمات والأسعار المحسوبة */}
                <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-700 mb-4">الخدمات الفعّالة والتسعير التلقائي</h3>
                    <div className="overflow-hidden rounded-lg border border-gray-100">
                        <table className="w-full text-right border-collapse">
                            <thead className="bg-gray-50 text-gray-600 text-xs font-bold border-b">
                                <tr>
                                    <th className="p-3">اسم الخدمة</th>
                                    <th className="p-3">النقاط</th>
                                    <th className="p-3">السعر بالعملة المحلية</th>
                                    <th className="p-3">المستلزمات المرتبطة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-gray-600 text-xs">
                                {services.map(s => (
                                    <tr key={s.id} className="hover:bg-gray-50">
                                        <td className="p-3 font-bold text-gray-800">{s.name}</td>
                                        <td className="p-3">{s.credits_required} نقطة</td>
                                        <td className="p-3 text-green-600 font-bold text-sm">{s.calculated_price?.toLocaleString()} ل.س</td>
                                        <td className="p-3">
                                            {s.materials && s.materials.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {s.materials.map(m => (
                                                        <span key={m.id} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px]">
                                                            {m.name} ({m.pivot.quantity})
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : <span className="text-gray-300">لا يوجد مستلزمات</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Services;