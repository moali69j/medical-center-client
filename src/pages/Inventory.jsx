import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Inventory = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // حالات النوافذ المنبثقة (Modals) للتعديل اليدوي
    const [selectedItem, setSelectedItem] = useState(null);
    const [amount, setAmount] = useState('');
    const [actionType, setActionType] = useState('add'); // add أو subtract

    // جلب البيانات من السيرفر
    const fetchInventory = async () => {
        try {
            const res = await api.get('/inventory');
            setItems(res.data);
            setLoading(false);
        } catch {
            alert('خطأ في جلب بيانات المخزون');
            setLoading(false);
        }
    };

    useEffect(() => {
        const load = async () => { await fetchInventory(); };
        load();
    }, []);

    // إرسال طلب التحديث اليدوي للـ API
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
            fetchInventory(); // إعادة جلب البيانات لتحديث الجدول
        } catch (err) {
            alert(err.response?.data?.message || 'حدث خطأ أثناء التحديث');
        }
    };

    // دالة مساعدة لعرض صف كل عنصر (تفادي مشاكل التحليل داخل JSX)
    const renderItem = (item) => {
        const isLow = item.quantity <= item.threshold;
        return (
            <tr key={item.id} className={`hover:bg-gray-50 transition ${isLow ? 'bg-red-50' : ''}`}>
                <td className="p-4 font-bold text-gray-800">{item.name}</td>
                <td className={`p-4 font-semibold text-lg ${isLow ? 'text-red-600 font-bold animate-pulse' : 'text-green-600'}`}>
                    {item.quantity} {isLow && '⚠️ (منخفض)'}
                </td>
                <td className="p-4">{item.unit}</td>
                <td className="p-4 text-gray-400">{item.threshold}</td>
                <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${item.is_measurable ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                        {item.is_measurable ? 'تلقائي مع الخدمة' : 'يدوي (مستهلكات عامة)'}
                    </span>
                </td>
                <td className="p-4 text-center space-x-2 space-x-reverse">
                    <button 
                        onClick={() => { setSelectedItem(item); setActionType('add'); }}
                        className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-xs transition shadow-sm"
                    >
                        + توريد/شراء
                    </button>
                    <button 
                        onClick={() => { setSelectedItem(item); setActionType('subtract'); }}
                        className="bg-amber-500 text-white px-3 py-1 rounded-md hover:bg-amber-600 text-xs transition shadow-sm"
                    >
                        - استهلاك يدوي
                    </button>
                </td>
            </tr>
        );
    };

    if (loading) return <div className="text-center p-10 text-xl font-bold">جاري تحميل المخزون...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6" dir="rtl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">إدارة مستودع المواد والمستهلكات</h2>
                <span className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-full">إجمالي الأصناف: {items.length}</span>
            </div>

            {/* جدول عرض المخزون */}
            <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
                <table className="w-full text-right border-collapse">
                    <thead>
                        <tr className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200 text-sm">
                            <th className="p-4">اسم المادة</th>
                            <th className="p-4">الكمية الحالية</th>
                            <th className="p-4">وحدة القياس</th>
                            <th className="p-4">حد العتبة</th>
                            <th className="p-4">طريقة الخصم</th>
                            <th className="p-4 text-center">إجراءات يدوية</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-600 text-sm">
                        {items.map(renderItem)}
                    </tbody>
                </table>
            </div>

            {/* النافذة المنبثقة للتعديل اليدوي (Modal) */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full" dir="rtl">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">
                            {actionType === 'add' ? 'شراء وتوريد كمية جديدة' : 'تسجيل استهلاك يدوي'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">المادة الحالية: <span className="font-bold text-gray-700">{selectedItem.name}</span></p>
                        
                        <form onSubmit={handleStockUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">الكمية بـ ({selectedItem.unit}):</label>
                                <input 
                                    type="number" 
                                    step="0.1"
                                    required
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="أدخل الكمية هنا..."
                                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex gap-2 pt-2 justify-end">
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm transition">تأكيد التعديل</button>
                                <button type="button" onClick={() => setSelectedItem(null)} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm transition">إلغاء</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;