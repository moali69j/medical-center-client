import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const ExpensesManagement = () => {
    const [expenseForm, setExpenseForm] = useState({ amount: '', category: 'رواتب وأجور', notes: '' });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [expensesList, setExpensesList] = useState([]); 

    const [dateFilters, setDateFilters] = useState({ from_date: '', to_date: '' });
    const [staffSummary, setStaffSummary] = useState({ total_staff_owed: 0, detailed_shares: [] });
    const [loadingStaff, setLoadingStaff] = useState(false);

    const fetchExpenses = async () => {
        try {
            const res = await api.get('/expenses');
            setExpensesList(res.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchStaffReport = async () => {
        setLoadingStaff(true);
        try {
            const queryParams = new URLSearchParams(dateFilters).toString();
            const res = await api.get(`/financial/staff-reports?${queryParams}`);
            if (res.data) setStaffSummary(res.data);
        } catch (err) { console.error(err); }
        finally { setLoadingStaff(false); }
    };

    useEffect(() => {
        void fetchExpenses();
        void fetchStaffReport();
    }, [dateFilters]);

    const handleCreateExpense = async (e) => {
        e.preventDefault();
        if (submitLoading) return;
        setSubmitLoading(true);

        try {
            await api.post('/expenses', {
                amount: parseFloat(expenseForm.amount),
                category: expenseForm.category,
                notes: expenseForm.notes
            });
            alert('تم تسجيل القيد المالي بنجاح!');
            setExpenseForm({ amount: '', category: 'رواتب وأجور', notes: '' });
            fetchExpenses(); 
            fetchStaffReport();
        } catch (err) {
            alert('خطأ أثناء تسجيل المصروف');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleSettleStaffShare = async (caseId, staffShareAmount, patientName) => {
        if (!window.confirm(`هل أنت متأكد من تسليم الممرض حصته نقداً بقيمة (${staffShareAmount.toLocaleString()} ل.س)؟`)) return;
        try {
            await api.post('/expenses', {
                amount: staffShareAmount,
                category: 'توزيع أرباح كادر طبي',
                notes: `تصفية مستحقات كاش عن حالة المريض: [${patientName}] - رقم: #${caseId}`,
                case_id: caseId
            });
            alert('تم دفع مستحقات الممرض بنجاح وتصفية القيد المالي!');
            
            // التعديل الذكي: حذف الحالة من الجدول فوراً وتحديث المجموع الإجمالي بدون انتظار الـ refresh
            setStaffSummary(prev => {
                const updatedShares = prev.detailed_shares.filter(c => c.id !== caseId);
                const updatedTotal = updatedShares.reduce((sum, item) => sum + parseFloat(item.staff_share), 0);
                return {
                    total_staff_owed: updatedTotal,
                    detailed_shares: updatedShares
                };
            });

            fetchExpenses(); // لتحديث جدول المصاريف العامة والرواتب في الجانب الآخر
        } catch (err) { alert('فشل التصفية ورجاء التحقق من المدخلات'); }
    };

    const handleExportExpenses = () => {
        const queryParams = new URLSearchParams({
            from_date: dateFilters.from_date || '',
            to_date: dateFilters.to_date || ''
        }).toString();
        window.open(`http://localhost:8000/api/export/expenses?${queryParams}`, '_blank');
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6" dir="rtl">
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">💸 إدارة الخزنة الشاملة والمصاريف والرواتب</h2>
                    <p className="text-xs text-gray-400 mt-1">ضبط الرواتب يدويّاً، وتتبع مشتريات المستودع وتصفية حصص الممرضين الطبية</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExportExpenses} className="bg-green-700 hover:bg-green-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm">
                        🟢 تصدير المصاريف لـ Excel
                    </button>
                    <button onClick={() => window.location.href = '/financial'} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs transition">
                        ← العودة للوحة المالية والتقارير
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 text-xs">
                        <h3 className="font-bold text-gray-800 text-sm border-b pb-2">✍️ تسجيل قيد صرف / دفع رواتب</h3>
                        <form onSubmit={handleCreateExpense} className="space-y-3 text-gray-600">
                            <div>
                                <label className="block mb-1 font-medium">المبلغ المالي المدفوع (ل.س):</label>
                                <input type="number" required className="w-full border p-2.5 rounded-xl font-black text-center text-base text-red-600 bg-red-50/20" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} />
                            </div>
                            <div>
                                <label className="block mb-1 font-medium">تصنيف بند المصروف:</label>
                                <select className="w-full border p-2 rounded-xl bg-gray-50 font-bold" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}>
                                    <option value="رواتب وأجور">رواتب وأجور موظفين وكوادر</option>
                                    <option value="مصاريف تشغيلية">مصاريف تشغيلية (كهرباء، ماء)</option>
                                    <option value="صيانة ومعدات">صيانة أجهزة ومعدات طبية</option>
                                    <option value="مصرُوفات عامة">نثريات ومصروفات عامة</option>
                                </select>
                            </div>
                            <div>
                                <label className="block mb-1 font-medium">اسم الموظف / بيان التفاصيل:</label>
                                <textarea rows="3" required placeholder="اسم الموظف والمبلغ الذي قبضه..." className="w-full border p-2 rounded-xl text-xs" value={expenseForm.notes} onChange={e => setExpenseForm({...expenseForm, notes: e.target.value})}></textarea>
                            </div>
                            <button type="submit" disabled={submitLoading} className="w-full bg-red-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm">
                                {submitLoading ? 'جاري التسجيل...' : '✔ تأكيد قيد الصرف النقدي'}
                            </button>
                        </form>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3 text-xs max-h-64 overflow-y-auto">
                        <h4 className="font-bold text-gray-700 border-b pb-1">📋 رواتب ومصاريف مسجلة مؤخراً:</h4>
                        <div className="space-y-2">
                            {expensesList.map(e => (
                                <div key={e.id} className="bg-gray-50 p-2 rounded-xl border flex justify-between items-start">
                                    <div>
                                        <span className="font-bold block text-gray-800">{e.category}</span>
                                        <p className="text-[11px] text-gray-500">{e.notes}</p>
                                    </div>
                                    <span className="font-black text-red-600 whitespace-nowrap">{parseFloat(e.amount).toLocaleString()} ل.س</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex gap-2 items-center w-full text-xs text-gray-500">
                            <div className="flex-1">
                                <label className="block mb-1 font-semibold text-gray-600">من تاريخ:</label>
                                <input type="date" className="w-full border p-2 rounded-xl outline-none" value={dateFilters.from_date} onChange={e => setDateFilters({...dateFilters, from_date: e.target.value})} />
                            </div>
                            <div className="flex-1">
                                <label className="block mb-1 font-semibold text-gray-600">إلى تاريخ:</label>
                                <input type="date" className="w-full border p-2 rounded-xl outline-none" value={dateFilters.to_date} onChange={e => setDateFilters({...dateFilters, to_date: e.target.value})} />
                            </div>
                        </div>
                        <div className="bg-purple-600 p-3 rounded-xl text-white text-center min-w-[180px]">
                            <span className="text-[10px] block opacity-80 font-medium">إجمالي مستحقات الكادر بالفترة:</span>
                            <span className="text-base font-black">{(staffSummary.total_staff_owed || 0).toLocaleString()} ل.س</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-3 bg-gray-50 border-b">
                            <h4 className="text-xs font-bold text-gray-700">🩺 كشف مستحقات وحصص الممرضين التفصيلي عن الزيارات والعمليات:</h4>
                        </div>
                        <div className="overflow-x-auto text-xs">
                            <table className="w-full text-right border-collapse">
                                <thead className="bg-gray-50/50 text-gray-500 font-bold border-b text-[11px]">
                                    <tr>
                                        <th className="p-3">تاريخ الحالة</th>
                                        <th className="p-3">اسم المريض</th>
                                        <th className="p-3">نوع الحالة</th>
                                        <th className="p-3">الحساب المدفوع</th>
                                        <th className="p-3 text-purple-700">حصة الكادر</th>
                                        <th className="p-3 text-center">الإجراء المالي</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-gray-700">
                                    {loadingStaff ? (
                                        <tr><td colSpan="6" className="text-center py-6 text-gray-400">جاري احتساب النسب المئوية للحالات...</td></tr>
                                    ) : staffSummary.detailed_shares?.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center py-6 text-gray-400">لا يوجد حالات طبية معلقة بحاجة لتصفية في هذا النطاق الزمني.</td></tr>
                                    ) : (
                                        staffSummary.detailed_shares?.map(c => (
                                            <tr key={c.id} className="hover:bg-gray-50/50">
                                                <td className="p-3 text-gray-400 font-medium">{c.date}</td>
                                                <td className="p-3 font-bold text-gray-800">{c.patient_name}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${c.case_type === 'internal' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                                        {c.case_type === 'internal' ? 'داخلية (40% لك)' : 'خارجية (60% لك)'}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-gray-500">{c.total_paid.toLocaleString()} ل.س</td>
                                                <td className="p-3 font-black text-purple-700 bg-purple-50/20">{c.staff_share.toLocaleString()} ل.س</td>
                                                <td className="p-3 text-center">
                                                    <button onClick={() => handleSettleStaffShare(c.id, c.staff_share, c.patient_name)} className="bg-green-600 text-white font-bold px-2 py-1 rounded-lg text-[10px]">💵 تصفية الحساب كاش</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExpensesManagement;