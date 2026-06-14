import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Services = () => {
    const [services, setServices] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [creditPrice, setCreditPrice] = useState(1000);
    const [newCreditPrice, setNewCreditPrice] = useState('');
    
    const [newService, setNewService] = useState({ name: '', credits_required: '' });
    const [selectedMaterials, setSelectedMaterials] = useState([]);

    // حالات نافذة التعديل الشامل للمادة ومستلزماتها
    const [editingService, setEditingService] = useState(null);
    const [editMaterials, setEditMaterials] = useState([]);

    const fetchPageData = async () => {
        try {
            const resServices = await api.get('/services');
            if (resServices.data) {
                setServices(resServices.data.services || []);
                setCreditPrice(resServices.data.current_credit_price || 1000);
            }
            const resInventory = await api.get('/inventory');
            if (resInventory.data && Array.isArray(resInventory.data)) {
                setInventory(resInventory.data.filter(i => i.is_measurable));
            }
        } catch (err) { console.error(err); }
    };

    useEffect(() => { void fetchPageData(); }, []);

    const handleUpdateCredit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put('/settings/credit-price', { credit_price: parseFloat(newCreditPrice) });
            alert(response.data.message);
            setNewCreditPrice('');
            fetchPageData();
        } catch (err) { alert('خطأ في تحديث السعر'); }
    };

    const addMaterialToService = (itemId) => {
        const item = inventory.find(i => i.id === parseInt(itemId));
        if (item && !selectedMaterials.find(m => m.id === item.id)) {
            setSelectedMaterials([...selectedMaterials, { id: item.id, name: item.name, quantity: 1, unit: item.unit }]);
        }
    };

    const handleCreateService = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: newService.name,
                credits_required: parseInt(newService.credits_required),
                materials: selectedMaterials.map(m => ({ id: m.id, quantity: parseFloat(m.quantity) }))
            };
            await api.post('/services', payload);
            alert('تم حفظ الخدمة الطبية بنجاح');
            setNewService({ name: '', credits_required: '' });
            setSelectedMaterials([]);
            fetchPageData();
        } catch (err) { alert('خطأ في الحفظ والتأسيس'); }
    };

    // فتح الـ Modal وشحن البيانات للتعديل الشامل
    const startEditService = (service) => {
        setEditingService({ ...service });
        const existingMaterials = service.materials.map(m => ({
            id: m.id,
            name: m.name,
            quantity: m.pivot.quantity,
            unit: m.unit
        }));
        setEditMaterials(existingMaterials);
    };

    const addMaterialToEditForm = (itemId) => {
        const item = inventory.find(i => i.id === parseInt(itemId));
        if (item && !editMaterials.find(m => m.id === item.id)) {
            setEditMaterials([...editMaterials, { id: item.id, name: item.name, quantity: 1, unit: item.unit }]);
        }
    };

    const handleSaveFullUpdate = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: editingService.name,
                credits_required: parseInt(editingService.credits_required),
                materials: editMaterials.map(m => ({ id: m.id, quantity: parseFloat(m.quantity) }))
            };
            await api.put(`/services/${editingService.id}`, payload);
            alert('تم التعديل الشامل للخدمة والمواد المرتبطة بها بنجاح!');
            setEditingService(null);
            fetchPageData();
        } catch (err) {
            alert('فشل في إرسال التحديث الشامل');
        }
    };

    const handleDeleteService = async (id) => {
        if (!window.confirm('هل أنت متأكد من حذف هذه الخدمة الطبية وفك ارتباط مستلزماتها نهائياً؟')) return;
        try {
            const response = await api.delete(`/services/${id}`);
            alert(response.data.message || 'تم حذف الخدمة بنجاح');
            fetchPageData();
        } catch (err) {
            alert('حدث خطأ أثناء محاولة الحذف من السيرفر');
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6" dir="rtl">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">لوحة الإدارة: الخدمات والتسعير الذكي</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6 lg:col-span-1">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-700 mb-2">تحديث سعر الكريدت (النقاط)</h3>
                        <p className="text-xs text-gray-400 mb-3">السعر الحالي: <span className="text-blue-600 font-bold text-sm">{creditPrice} ل.س</span></p>
                        <form onSubmit={handleUpdateCredit} className="flex gap-2">
                            <input type="number" required placeholder="السعر الجديد..." className="border p-2 rounded-lg flex-1 text-sm" value={newCreditPrice} onChange={e => setNewCreditPrice(e.target.value)} />
                            <button type="submit" className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold">تعديل</button>
                        </form>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-700 mb-4">إنشاء خدمة جديدة وطبابة</h3>
                        <form onSubmit={handleCreateService} className="space-y-3">
                            <input type="text" placeholder="اسم الخدمة الطبية" required className="w-full border p-2 rounded-lg text-sm" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} />
                            <input type="number" placeholder="عدد النقاط (Credits)" required className="w-full border p-2 rounded-lg text-sm" value={newService.credits_required} onChange={e => setNewService({...newService, credits_required: e.target.value})} />
                            <hr />
                            <select className="w-full border p-2 rounded-lg text-sm" value="" onChange={e => addMaterialToService(e.target.value)}>
                                <option value="" disabled>اختر مادة لربطها آلياً...</option>
                                {inventory.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                            </select>
                            <div className="space-y-2">
                                {selectedMaterials.map((m, idx) => (
                                    <div key={m.id} className="flex justify-between items-center bg-gray-50 p-2 rounded border text-xs">
                                        <span>{m.name}</span>
                                        <div className="flex items-center gap-1">
                                            <input type="number" step="0.1" required className="w-12 border text-center p-1 rounded" value={m.quantity} onChange={e => {
                                                const updated = [...selectedMaterials];
                                                updated[idx].quantity = e.target.value;
                                                setSelectedMaterials(updated);
                                            }} />
                                            <button type="button" onClick={() => setSelectedMaterials(selectedMaterials.filter(item => item.id !== m.id))} className="text-red-500 font-bold mr-1">×</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-green-700 transition">حفظ الخدمة ومستلزماتها</button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-700 mb-4">الخدمات الفعّالة والتسعير التلقائي</h3>
                    <div className="overflow-hidden rounded-lg border border-gray-100 text-xs">
                        <table className="w-full text-right border-collapse">
                            <thead className="bg-gray-50 text-gray-600 font-bold border-b">
                                <tr>
                                    <th className="p-3">اسم الخدمة</th>
                                    <th className="p-3">النقاط</th>
                                    <th className="p-3">السعر بالعملة المحلية</th>
                                    <th className="p-3">المستلزمات المرتبطة</th>
                                    <th className="p-3 text-center">العمليات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-gray-600">
                                {services.map(s => (
                                    <tr key={s.id} className="hover:bg-gray-50">
                                        <td className="p-3 font-bold text-gray-800">{s.name}</td>
                                        <td className="p-3">{s.credits_required} نقطة</td>
                                        <td className="p-3 text-green-600 font-bold">{s.calculated_price?.toLocaleString()} ل.س</td>
                                        <td className="p-3">
                                            {s.materials && s.materials.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {s.materials.map(m => <span key={m.id} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px]">{m.name} ({m.pivot?.quantity})</span>)}
                                                </div>
                                            ) : <span className="text-gray-300">بلا مستلزمات</span>}
                                        </td>
                                        <td className="p-3 text-center flex gap-1 justify-center">
                                            <button onClick={() => startEditService(s)} className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-[11px] font-bold hover:bg-amber-100 transition">📝 تعديل شامل</button>
                                            <button onClick={() => handleDeleteService(s.id)} className="bg-red-50 text-red-600 px-2 py-1 rounded text-[11px] font-bold hover:bg-red-100 transition">🗑️ حذف</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* نافذة التعديل الشامل للخدمة والمواد المرتبطة بها (Modal) */}
            {editingService && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full" dir="rtl">
                        <h3 className="text-base font-bold text-gray-800 mb-4">📝 نموذج التعديل الشامل للخدمة ومستلزماتها</h3>
                        <form onSubmit={handleSaveFullUpdate} className="space-y-4 text-xs">
                            <div>
                                <label className="block mb-1 font-medium">تعديل اسم الخدمة:</label>
                                <input type="text" required className="w-full border p-2 rounded-lg text-sm" value={editingService.name} onChange={e => setEditingService({ ...editingService, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block mb-1 font-medium">تعديل النقاط (Credits):</label>
                                <input type="number" required className="w-full border p-2 rounded-lg text-sm" value={editingService.credits_required} onChange={e => setEditingService({ ...editingService, credits_required: e.target.value })} />
                            </div>
                            <hr />
                            <div>
                                <label className="block mb-1 font-bold text-gray-700">إضافة أو تعديل روابط مستلزمات المخزن:</label>
                                <select className="w-full border p-2 rounded-lg text-sm bg-gray-50 mb-2" value="" onChange={e => addMaterialToEditForm(e.target.value)}>
                                    <option value="" disabled>أضف مادة مستهلكة جديدة للخدمة...</option>
                                    {inventory.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                                </select>
                                <div className="space-y-2 max-h-40 overflow-y-auto border p-2 rounded bg-gray-50/50">
                                    {editMaterials.map((m, idx) => (
                                        <div key={m.id} className="flex justify-between items-center bg-white p-2 rounded border">
                                            <span className="font-bold text-gray-700">{m.name}</span>
                                            <div className="flex items-center gap-1">
                                                <input type="number" step="0.1" required className="w-12 border text-center p-0.5 rounded" value={m.quantity} onChange={e => {
                                                    const updated = [...editMaterials];
                                                    updated[idx].quantity = e.target.value;
                                                    setEditMaterials(updated);
                                                }} />
                                                <button type="button" onClick={() => setEditMaterials(editMaterials.filter(item => item.id !== m.id))} className="text-red-500 font-bold mr-1">×</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end pt-2 text-xs">
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">تأكيد الحفظ الشامل</button>
                                <button type="button" onClick={() => setEditingService(null)} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg">إلغاء</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Services;