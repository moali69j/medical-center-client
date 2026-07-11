import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Inventory = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false); // لمنع الإضافة المزدوجة حتماً
    
    const [selectedItem, setSelectedItem] = useState(null);
    const [amount, setAmount] = useState('');
    const [actionType, setActionType] = useState('add');
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    const [newItem, setNewItem] = useState({
        name: '', quantity: '', unit: 'قطعة', threshold: '', is_measurable: true, cost_price: ''
    });

    const fetchInventory = async () => {
        try {
            const res = await api.get('/inventory');
            setItems(res.data || []);
            setLoading(false);
        } catch {
            alert('خطأ في جلب بيانات المخزون');
            setLoading(false);
        }
    };

    useEffect(() => { void fetchInventory(); }, []);

    const handleCreateItem = async (e) => {
        e.preventDefault();
        if (submitLoading) return;
        setSubmitLoading(true);

        try {
            await api.post('/inventory', {
                ...newItem,
                quantity: parseFloat(newItem.quantity),
                threshold: parseFloat(newItem.threshold),
                cost_price: parseFloat(newItem.cost_price) || 0
            });
            alert('تم إضافة المادة الجديدة للمخزن بنجاح');
            setShowCreateModal(false);
            setNewItem({ name: '', quantity: '', unit: 'قطعة', threshold: '', is_measurable: true, cost_price: '' });
            fetchInventory();
        } catch (err) {
            alert('خطأ في إضافة المادة، يرجى التحقق من المدخلات ومطابقتها للسيرفر');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleStockUpdate = async (e) => {
        e.preventDefault();
        if (!amount || !selectedItem) return;

        try {
            const res = await api.put(`/inventory/${selectedItem.id}`, {
                action: actionType,
                amount: parseFloat(amount)
            });
            alert(res.data.message);
            setSelectedItem(null);
            setAmount('');
            fetchInventory();
        } catch (err) {
            alert(err.response?.data?.message || 'حدث خطأ أثناء التحديث');
        }
    };

    const handleDeleteItem = async (id) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا الصنف نهائياً من مستودع العيادة؟')) return;
        try {
            const res = await api.delete(`/inventory/${id}`);
            alert(res.data.message || 'تم الحذف');
            fetchInventory();
        } catch (err) {
            alert(err.response?.data?.message || 'لا يمكن حذف مادة مستخدمة في العمليات الحالية');
        }
    };

    const handleExportInventory = () => {
        window.open('http://localhost:8000/api/export/inventory', '_blank');
    };

    if (loading) return <div className="text-center p-10 text-xl font-bold">جاري تحميل المخزون...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6" dir="rtl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">إدارة مستودع المواد والمستهلكات</h2>
                <div className="flex gap-3 items-center">
                    <button onClick={handleExportInventory} className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition shadow-sm text-sm font-bold">
                        🟢 تصدير للإكسل
                    </button>
                    <span className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-full">إجمالي الأصناف: {items.length}</span>
                    <button onClick={() => setShowCreateModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm text-sm font-bold">
                        + إضافة مادة جديدة بالكامل
                    </button>
                </div>
            </div>

            <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
                <table className="w-full text-right border-collapse text-xs">
                    <thead>
                        <tr className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200 text-xs">
                            <th className="p-4">اسم المادة</th>
                            <th className="p-4">الكمية الحالية</th>
                            <th className="p-4">وحدة القياس</th>
                            <th className="p-4">حد العتبة</th>
                            <th className="p-4">سعر تكلفة الشراء</th>
                            <th className="p-4">طريقة الخصم</th>
                            <th className="p-4 text-center">التحكم والعمليات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-600">
                        {items.map(item => {
                            const isLow = item.quantity <= item.threshold;
                            return (
                                <tr key={item.id} className={`hover:bg-gray-50 transition ${isLow ? 'bg-red-50' : ''}`}>
                                    <td className="p-4 font-bold text-gray-800">{item.name}</td>
                                    <td className={`p-4 font-black text-sm ${isLow ? 'text-red-600 animate-pulse' : 'text-green-600'}`}>
                                        {item.quantity} {isLow && '⚠️'}
                                    </td>
                                    <td className="p-4 text-gray-400">{item.unit}</td>
                                    <td className="p-4">{item.threshold}</td>
                                    <td className="p-4 font-bold text-blue-600">{parseFloat(item.cost_price || 0).toLocaleString()} ل.س</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${item.is_measurable ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {item.is_measurable ? 'آلي مع الخدمة' : 'يدوي/كاش إضافي'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center flex justify-center gap-2">
                                        <button onClick={() => { setSelectedItem(item); setActionType('add'); }} className="bg-green-600 text-white px-2 py-1 rounded text-[11px] hover:bg-green-700 transition shadow-sm">+ توريد</button>
                                        <button onClick={() => { setSelectedItem(item); setActionType('subtract'); }} className="bg-amber-500 text-white px-2 py-1 rounded text-[11px] hover:bg-amber-600 transition shadow-sm">- استهلاك</button>
                                        <button onClick={() => handleDeleteItem(item.id)} className="bg-red-50 text-red-600 px-2 py-1 rounded text-[11px] hover:bg-red-100 transition font-bold">🗑️ حذف</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* نافذة التعديل اليدوي */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full" dir="rtl">
                        <h3 className="text-base font-bold text-gray-800 mb-2">{actionType === 'add' ? 'شراء وتوريد كمية جديدة' : 'تسجيل استهلاك يدوي'}</h3>
                        <p className="text-xs text-gray-500 mb-4">الصنف: <span className="font-bold text-gray-700">{selectedItem.name}</span></p>
                        <form onSubmit={handleStockUpdate} className="space-y-4">
                            <input type="number" step="0.1" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`الكمية بـ (${selectedItem.unit})...`} className="w-full border p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                            <div className="flex gap-2 justify-end text-xs">
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">تأكيد</button>
                                <button type="button" onClick={() => setSelectedItem(null)} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg">إلغاء</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* نافذة إضافة بطاقة صنف جديدة */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full" dir="rtl">
                        <h3 className="text-base font-bold text-gray-800 mb-4">بطاقة مادة جديدة بالمستودع</h3>
                        <form onSubmit={handleCreateItem} className="space-y-3 text-xs">
                            <input type="text" placeholder="اسم المادة (شاش معقم، سيروم...)" required className="w-full border p-2 rounded-lg text-sm" onChange={e => setNewItem({...newItem, name: e.target.value})} />
                            <div className="grid grid-cols-2 gap-2">
                                <input type="number" placeholder="الكمية الابتدائية" required className="w-full border p-2 rounded-lg" onChange={e => setNewItem({...newItem, quantity: e.target.value})} />
                                <select className="w-full border p-2 rounded-lg bg-gray-50 font-bold" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})}>
                                    <option value="قطعة">قطعة</option>
                                    <option value="ليتر">ليتر</option>
                                    <option value="مل">ملغ</option>
                                    <option value="علبة">علبة</option>
                                    <option value="متر">متر</option>
                                </select>
                            </div>
                            <input type="number" placeholder="حد العتبة للتنبيه" required className="w-full border p-2 rounded-lg" onChange={e => setNewItem({...newItem, threshold: e.target.value})} />
                            <input type="number" placeholder="سعر تكلفة الشراء المالي (للقطعة)" required className="w-full border p-2 rounded-lg bg-blue-50/40 font-bold" onChange={e => setNewItem({...newItem, cost_price: e.target.value})} />
                            <select className="w-full border p-2 rounded-lg" onChange={e => setNewItem({...newItem, is_measurable: e.target.value === 'true'})}>
                                <option value="true">تلقائي (يربط ويدخل في حساب الخدمات)</option>
                                <option value="false">يدوي (يصرف كمستهلك عام)</option>
                            </select>
                            <div className="flex gap-2 justify-end pt-2">
                                <button type="submit" disabled={submitLoading} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold">{submitLoading ? 'جاري الحفظ...' : 'حفظ الصنف'}</button>
                                <button type="button" onClick={() => setShowCreateModal(false)} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg">إلغاء</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;