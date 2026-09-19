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
            setSelectedMaterials([...selectedMaterials, { 
                id: item.id, 
                name: item.name, 
                quantity: 1, 
                unit: item.unit,
                cost_price: parseFloat(item.cost_price || 0)
            }]);
        }
    };

    // حسابات النموذج الجديد لحظياً
    const createMaterialsCost = selectedMaterials.reduce((sum, m) => sum + (parseFloat(m.cost_price || 0) * (parseFloat(m.quantity) || 0)), 0);
    const createSellingPrice = (parseInt(newService.credits_required) || 0) * creditPrice;
    const createMinCredits = createMaterialsCost > 0 ? Math.ceil(createMaterialsCost / creditPrice) : 0;
    const createProfit = createSellingPrice - createMaterialsCost;
    const createIsLoss = createMaterialsCost > 0 && createSellingPrice < createMaterialsCost;

    const handleCreateService = async (e) => {
        e.preventDefault();
        if (createIsLoss) {
            alert(`خطأ: لا يمكن حفظ الخدمة لأن سعر البيع (${createSellingPrice.toLocaleString()} ل.س) أقل من تكلفة المواد (${createMaterialsCost.toLocaleString()} ل.س)! الحد الأدنى المطلوب هو (${createMinCredits} نقطة).`);
            return;
        }

        try {
            const payload = {
                name: newService.name,
                credits_required: parseInt(newService.credits_required),
                materials: selectedMaterials.map(m => ({ id: m.id, quantity: parseFloat(m.quantity) }))
            };
            const res = await api.post('/services', payload);
            alert(res.data.message || 'تم حفظ الخدمة الطبية بنجاح');
            setNewService({ name: '', credits_required: '' });
            setSelectedMaterials([]);
            fetchPageData();
        } catch (err) { 
            alert(err.response?.data?.message || 'خطأ في الحفظ والتأسيس'); 
        }
    };

    // فتح الـ Modal وشحن البيانات للتعديل الشامل
    const startEditService = (service) => {
        setEditingService({ ...service });
        const existingMaterials = (service.materials || []).map(m => ({
            id: m.id,
            name: m.name,
            quantity: m.pivot?.quantity || 1,
            unit: m.unit,
            cost_price: parseFloat(m.cost_price || 0)
        }));
        setEditMaterials(existingMaterials);
    };

    const addMaterialToEditForm = (itemId) => {
        const item = inventory.find(i => i.id === parseInt(itemId));
        if (item && !editMaterials.find(m => m.id === item.id)) {
            setEditMaterials([...editMaterials, { 
                id: item.id, 
                name: item.name, 
                quantity: 1, 
                unit: item.unit,
                cost_price: parseFloat(item.cost_price || 0)
            }]);
        }
    };

    // حسابات نموذج التعديل لحظياً
    const editMaterialsCost = editMaterials.reduce((sum, m) => sum + (parseFloat(m.cost_price || 0) * (parseFloat(m.quantity) || 0)), 0);
    const editSellingPrice = editingService ? (parseInt(editingService.credits_required) || 0) * creditPrice : 0;
    const editMinCredits = editMaterialsCost > 0 ? Math.ceil(editMaterialsCost / creditPrice) : 0;
    const editProfit = editSellingPrice - editMaterialsCost;
    const editIsLoss = editMaterialsCost > 0 && editSellingPrice < editMaterialsCost;

    const handleSaveFullUpdate = async (e) => {
        e.preventDefault();
        if (editIsLoss) {
            alert(`خطأ: لا يمكن حفظ التعديل لأن سعر البيع (${editSellingPrice.toLocaleString()} ل.س) أقل من تكلفة المواد (${editMaterialsCost.toLocaleString()} ل.س)! الحد الأدنى المطلوب هو (${editMinCredits} نقطة).`);
            return;
        }

        try {
            const payload = {
                name: editingService.name,
                credits_required: parseInt(editingService.credits_required),
                materials: editMaterials.map(m => ({ id: m.id, quantity: parseFloat(m.quantity) }))
            };
            const res = await api.put(`/services/${editingService.id}`, payload);
            alert(res.data.message || 'تم التعديل الشامل للخدمة والمواد المرتبطة بها بنجاح!');
            setEditingService(null);
            fetchPageData();
        } catch (err) {
            alert(err.response?.data?.message || 'فشل في إرسال التحديث الشامل');
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
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">لوحة الإدارة: الخدمات والتسعير الذكي</h2>
                    <p className="text-xs text-slate-500 mt-1">تحديد نقاط الخدمات وحساب تكلفة المستلزمات وضمان هوامش الربح</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6 lg:col-span-1">
                    {/* بطاقة تحديث سعر النقطة */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
                        <h3 className="font-bold text-slate-800 text-sm mb-2">⚙️ سعر النقطة العامة (Credit)</h3>
                        <p className="text-xs text-slate-500 mb-3">القيمة الحالية: <span className="text-blue-700 font-extrabold text-sm">{creditPrice.toLocaleString()} ل.س</span> لكل نقطة</p>
                        <form onSubmit={handleUpdateCredit} className="flex gap-2">
                            <input type="number" required placeholder="السعر الجديد..." className="border border-slate-200 p-2.5 rounded-xl flex-1 text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-[#1e3a8a]" value={newCreditPrice} onChange={e => setNewCreditPrice(e.target.value)} />
                            <button type="submit" className="bg-[#1e3a8a] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-900 transition">تحديث</button>
                        </form>
                    </div>

                    {/* بطاقة إنشاء خدمة جديدة */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
                        <h3 className="font-bold text-slate-800 text-sm mb-4">➕ إضافة خدمة طبية جديدة</h3>
                        <form onSubmit={handleCreateService} className="space-y-4">
                            <div>
                                <label className="block mb-1 text-xs font-bold text-slate-700">اسم الخدمة:</label>
                                <input type="text" placeholder="مثال: غيار جرح كبير، تركيب كانيولا..." required className="w-full border border-slate-200 p-2.5 rounded-xl text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-[#1e3a8a]" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-slate-700">عدد النقاط (Credits):</label>
                                    {createMaterialsCost > 0 && (
                                        <button 
                                            type="button" 
                                            onClick={() => setNewService({...newService, credits_required: createMinCredits})}
                                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
                                        >
                                            💡 الحد الأدنى ({createMinCredits})
                                        </button>
                                    )}
                                </div>
                                <input type="number" min="0" placeholder="مثال: 5" required className="w-full border border-slate-200 p-2.5 rounded-xl text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-[#1e3a8a] font-bold" value={newService.credits_required} onChange={e => setNewService({...newService, credits_required: e.target.value})} />
                            </div>

                            <hr className="border-slate-100" />
                            
                            <div>
                                <label className="block mb-1 text-xs font-bold text-slate-700">المواد المستهلكة مع الخدمة:</label>
                                <select className="w-full border border-slate-200 p-2.5 rounded-xl text-sm bg-slate-50 outline-none font-medium mb-2" value="" onChange={e => addMaterialToService(e.target.value)}>
                                    <option value="" disabled>اختر مادة لربطها بالخدمة...</option>
                                    {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (تكلفة: {parseFloat(i.cost_price || 0).toLocaleString()} ل.س/{i.unit})</option>)}
                                </select>
                                
                                <div className="space-y-2 max-h-36 overflow-y-auto">
                                    {selectedMaterials.map((m, idx) => (
                                        <div key={m.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                                            <div>
                                                <span className="font-bold text-slate-800">{m.name}</span>
                                                <span className="text-[10px] text-slate-400 block">{(m.cost_price * (parseFloat(m.quantity) || 1)).toLocaleString()} ل.س</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <input type="number" step="0.1" min="0.1" required className="w-14 border border-slate-200 text-center p-1 rounded-lg bg-white font-bold" value={m.quantity} onChange={e => {
                                                    const updated = [...selectedMaterials];
                                                    updated[idx].quantity = e.target.value;
                                                    setSelectedMaterials(updated);
                                                }} />
                                                <span className="text-slate-500 text-[10px]">{m.unit}</span>
                                                <button type="button" onClick={() => setSelectedMaterials(selectedMaterials.filter(item => item.id !== m.id))} className="text-red-500 font-bold px-1 text-sm">×</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* بطاقة الحسابات اللحظية وصمام الأمان */}
                            <div className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${createIsLoss ? 'bg-rose-50/80 border-rose-200 text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                <div className="flex justify-between">
                                    <span>📦 تكلفة المواد المستهلكة:</span>
                                    <span className="font-bold">{createMaterialsCost.toLocaleString()} ل.س</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>💵 سعر بيع الخدمة:</span>
                                    <span className="font-bold text-blue-700">{createSellingPrice.toLocaleString()} ل.س</span>
                                </div>
                                <hr className="border-current opacity-20" />
                                <div className="flex justify-between font-bold text-sm pt-0.5">
                                    <span>{createIsLoss ? '⚠️ خسارة متوقعة:' : '📈 صافي الربح المتوقع:'}</span>
                                    <span className={createIsLoss ? 'text-rose-600' : 'text-emerald-600'}>
                                        {createProfit.toLocaleString()} ل.س
                                    </span>
                                </div>
                                {createIsLoss && (
                                    <p className="text-[11px] text-rose-700 font-bold pt-1 leading-tight">
                                        ❌ سعر البيع أقل من التكلفة! يجب وضع {createMinCredits} نقطة على الأقل.
                                    </p>
                                )}
                            </div>

                            <button 
                                type="submit" 
                                disabled={createIsLoss}
                                className={`w-full py-3 rounded-xl font-bold text-sm shadow-sm transition ${createIsLoss ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                            >
                                حفظ الخدمة ومستلزماتها
                            </button>
                        </form>
                    </div>
                </div>

                {/* جدول الخدمات الفعالة */}
                <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-800 text-base">الخدمات الفعّالة وقائمة التسعير والأرباح</h3>
                        <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">العدد: {services.length}</span>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200 text-sm">
                        <table className="w-full text-right border-collapse">
                            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-xs">
                                <tr>
                                    <th className="py-3.5 px-4">اسم الخدمة</th>
                                    <th className="py-3.5 px-3 text-center">النقاط</th>
                                    <th className="py-3.5 px-3">سعر البيع</th>
                                    <th className="py-3.5 px-3">تكلفة المواد</th>
                                    <th className="py-3.5 px-3">الربح المتوقع</th>
                                    <th className="py-3.5 px-3">المستلزمات</th>
                                    <th className="py-3.5 px-3 text-center">العمليات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                {services.map(s => {
                                    const isLoss = (s.expected_profit || 0) < 0;
                                    return (
                                        <tr key={s.id} className={`hover:bg-slate-50/80 transition ${isLoss ? 'bg-rose-50/50' : ''}`}>
                                            <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                                            <td className="py-3 px-3 text-center font-bold text-slate-800">{s.credits_required}</td>
                                            <td className="py-3 px-3 font-bold text-blue-700">{s.calculated_price?.toLocaleString()} ل.س</td>
                                            <td className="py-3 px-3 text-slate-600 font-semibold">{parseFloat(s.total_materials_cost || 0).toLocaleString()} ل.س</td>
                                            <td className={`py-3 px-3 font-bold ${isLoss ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {parseFloat(s.expected_profit ?? (s.calculated_price - (s.total_materials_cost || 0))).toLocaleString()} ل.س
                                            </td>
                                            <td className="py-3 px-3">
                                                {s.materials && s.materials.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {s.materials.map(m => (
                                                            <span key={m.id} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-xs font-semibold">
                                                                {m.name} ({m.pivot?.quantity} {m.unit})
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : <span className="text-slate-400 text-xs">بلا مستلزمات</span>}
                                            </td>
                                            <td className="py-3 px-3 text-center flex gap-1.5 justify-center">
                                                <button onClick={() => startEditService(s)} className="bg-amber-50 text-amber-800 border border-amber-200/60 px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-amber-100 transition">📝 تعديل</button>
                                                <button onClick={() => handleDeleteService(s.id)} className="bg-rose-50 text-rose-600 border border-rose-200/60 px-2 py-1 rounded-lg text-xs font-bold hover:bg-rose-100 transition">🗑️</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* نافذة التعديل الشامل للخدمة والمواد المرتبطة بها (Modal) */}
            {editingService && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-3xl shadow-xl max-w-lg w-full border border-slate-200" dir="rtl">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                            <h3 className="text-base font-bold text-slate-800">📝 تعديل الخدمة ومستلزماتها</h3>
                            <button onClick={() => setEditingService(null)} className="text-slate-400 font-bold hover:text-slate-600 text-lg">✕</button>
                        </div>
                        
                        <form onSubmit={handleSaveFullUpdate} className="space-y-4 text-sm">
                            <div>
                                <label className="block mb-1 text-xs font-bold text-slate-700">اسم الخدمة:</label>
                                <input type="text" required className="w-full border border-slate-200 p-2.5 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-[#1e3a8a] font-semibold" value={editingService.name} onChange={e => setEditingService({ ...editingService, name: e.target.value })} />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-slate-700">النقاط (Credits):</label>
                                    {editMaterialsCost > 0 && (
                                        <button 
                                            type="button" 
                                            onClick={() => setEditingService({...editingService, credits_required: editMinCredits})}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                                        >
                                            💡 تعيين الحد الأدنى ({editMinCredits})
                                        </button>
                                    )}
                                </div>
                                <input type="number" min="0" required className="w-full border border-slate-200 p-2.5 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-[#1e3a8a] font-bold" value={editingService.credits_required} onChange={e => setEditingService({ ...editingService, credits_required: e.target.value })} />
                            </div>

                            <hr className="border-slate-100" />
                            
                            <div>
                                <label className="block mb-1 text-xs font-bold text-slate-700">تعديل المستلزمات المرتبطة:</label>
                                <select className="w-full border border-slate-200 p-2.5 rounded-xl text-sm bg-slate-50 outline-none font-medium mb-2" value="" onChange={e => addMaterialToEditForm(e.target.value)}>
                                    <option value="" disabled>أضف مادة مستهلكة جديدة للخدمة...</option>
                                    {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (تكلفة: {parseFloat(i.cost_price || 0).toLocaleString()} ل.س/{i.unit})</option>)}
                                </select>
                                <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-100 p-2 rounded-xl bg-slate-50/50">
                                    {editMaterials.map((m, idx) => (
                                        <div key={m.id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                                            <div>
                                                <span className="font-bold text-slate-800">{m.name}</span>
                                                <span className="text-[10px] text-slate-400 block">{(m.cost_price * (parseFloat(m.quantity) || 1)).toLocaleString()} ل.س</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <input type="number" step="0.1" min="0.1" required className="w-14 border border-slate-200 text-center p-1 rounded-lg bg-slate-50 font-bold" value={m.quantity} onChange={e => {
                                                    const updated = [...editMaterials];
                                                    updated[idx].quantity = e.target.value;
                                                    setEditMaterials(updated);
                                                }} />
                                                <span className="text-slate-500 text-[10px]">{m.unit}</span>
                                                <button type="button" onClick={() => setEditMaterials(editMaterials.filter(item => item.id !== m.id))} className="text-red-500 font-bold px-1 text-sm">×</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* بطاقة الحسابات اللحظية وصمام الأمان للتعديل */}
                            <div className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${editIsLoss ? 'bg-rose-50/80 border-rose-200 text-rose-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                <div className="flex justify-between">
                                    <span>📦 تكلفة المواد المستهلكة:</span>
                                    <span className="font-bold">{editMaterialsCost.toLocaleString()} ل.س</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>💵 سعر بيع الخدمة:</span>
                                    <span className="font-bold text-blue-700">{editSellingPrice.toLocaleString()} ل.س</span>
                                </div>
                                <hr className="border-current opacity-20" />
                                <div className="flex justify-between font-bold text-sm pt-0.5">
                                    <span>{editIsLoss ? '⚠️ خسارة متوقعة:' : '📈 صافي الربح المتوقع:'}</span>
                                    <span className={editIsLoss ? 'text-rose-600' : 'text-emerald-600'}>
                                        {editProfit.toLocaleString()} ل.س
                                    </span>
                                </div>
                                {editIsLoss && (
                                    <p className="text-[11px] text-rose-700 font-bold pt-1 leading-tight">
                                        ❌ سعر البيع أقل من التكلفة! يجب وضع {editMinCredits} نقطة على الأقل.
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2 justify-end pt-2">
                                <button 
                                    type="submit" 
                                    disabled={editIsLoss}
                                    className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition ${editIsLoss ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-[#1e3a8a] hover:bg-blue-900 text-white'}`}
                                >
                                    تأكيد وحفظ التعديل
                                </button>
                                <button type="button" onClick={() => setEditingService(null)} className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-200 transition">إلغاء</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Services;