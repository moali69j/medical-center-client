import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const ExpensesManagement = () => {
    const [expenseForm, setExpenseForm] = useState({ amount: '', category: 'سحب كاش من الصندوق', notes: '' });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [expensesList, setExpensesList] = useState([]);
    const [treasuryBalance, setTreasuryBalance] = useState(0);

    const [dateFilters, setDateFilters] = useState({ from_date: '', to_date: '' });
    const [staffSummary, setStaffSummary] = useState({ total_staff_owed: 0, detailed_shares: [] });
    const [loadingStaff, setLoadingStaff] = useState(false);

    // نافذة التنبيه الذكي عند السحب المكشوف (العجز في الصندوق)
    const [deficitModal, setDeficitModal] = useState({
        isOpen: false,
        amount: 0,
        currentBalance: 0,
        projectedBalance: 0,
        onConfirm: null
    });

    const isDeposit = Boolean(
        expenseForm.category && (
            expenseForm.category.includes('إيداع') || 
            expenseForm.category.includes('إدخال') || 
            expenseForm.category.includes('تغذية')
        )
    );

    const fetchTreasuryBalance = async () => {
        try {
            const res = await api.get('/financial/treasury-balance');
            if (res.data) {
                setTreasuryBalance(parseFloat(res.data.current_cash_in_treasury) || 0);
            }
        } catch (err) {
            console.error('فشل جلب رصيد الخزينة', err);
        }
    };

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
        void fetchTreasuryBalance();
        void fetchExpenses();
        void fetchStaffReport();
    }, [dateFilters]);

    // تنفيذ عملية حفظ القيد في الباك إند
    const executeCreateExpense = async (amountNum, category, notes, transactionType) => {
        setSubmitLoading(true);
        try {
            const res = await api.post('/expenses', {
                amount: amountNum,
                category: category,
                transaction_type: transactionType,
                notes: notes
            });
            alert(res.data?.message || 'تم تسجيل الحركة المالية بنجاح!');
            setExpenseForm({ amount: '', category: 'سحب كاش من الصندوق', notes: '' });
            setDeficitModal({ isOpen: false, amount: 0, currentBalance: 0, projectedBalance: 0, onConfirm: null });
            fetchExpenses();
            fetchStaffReport();
            fetchTreasuryBalance();
        } catch (err) {
            alert('خطأ أثناء تسجيل الحركة المالية');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleCreateExpense = (e) => {
        e.preventDefault();
        if (submitLoading) return;

        const amountNum = parseFloat(expenseForm.amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            alert('يرجى إدخال مبلغ صحيح أكبر من الصفر');
            return;
        }

        const transactionType = isDeposit ? 'deposit' : 'expense';

        // فحص العجز: إذا كانت العملية صرف/سحب والمبلغ يتجاوز الرصيد المتوفر في الصندوق
        if (!isDeposit && amountNum > treasuryBalance) {
            setDeficitModal({
                isOpen: true,
                amount: amountNum,
                currentBalance: treasuryBalance,
                projectedBalance: treasuryBalance - amountNum,
                onConfirm: () => executeCreateExpense(amountNum, expenseForm.category, expenseForm.notes, transactionType)
            });
            return;
        }

        // إذا كان الرصيد كافياً أو كانت العملية إيداع كاش
        executeCreateExpense(amountNum, expenseForm.category, expenseForm.notes, transactionType);
    };

    const handleSettleStaffShare = async (caseId, staffShareAmount, patientName) => {
        // فحص العجز عند تصفية حصة الممرض كاش
        if (staffShareAmount > treasuryBalance) {
            const confirmOverdraft = window.confirm(
                `⚠️ تنبيه عجز في الصندوق:\n\n` +
                `المبلغ المطلوب تسليمه للممرض (${staffShareAmount.toLocaleString()} ل.س) يتجاوز الرصيد المتوفر حالياً بالصندوق (${treasuryBalance.toLocaleString()} ل.س).\n` +
                `سيصبح رصيد الصندوق مكشوفاً بالسالب (${(treasuryBalance - staffShareAmount).toLocaleString()} ل.س).\n\n` +
                `هل تؤكد تصفية الحساب كاش والسماح بالسحب على المكشوف؟`
            );
            if (!confirmOverdraft) return;
        } else {
            if (!window.confirm(`هل أنت متأكد من تسليم الممرض حصته نقداً بقيمة (${staffShareAmount.toLocaleString()} ل.س)؟`)) return;
        }

        try {
            await api.post('/expenses', {
                amount: staffShareAmount,
                category: 'توزيع أرباح كادر طبي',
                transaction_type: 'expense',
                notes: `تصفية مستحقات كاش عن حالة المريض: [${patientName}] - رقم: #${caseId}`,
                case_id: caseId
            });
            alert('تم دفع مستحقات الممرض بنجاح وتصفية القيد المالي!');

            setStaffSummary(prev => {
                const updatedShares = prev.detailed_shares.filter(c => c.id !== caseId);
                const updatedTotal = updatedShares.reduce((sum, item) => sum + parseFloat(item.staff_share), 0);
                return {
                    total_staff_owed: updatedTotal,
                    detailed_shares: updatedShares
                };
            });

            fetchExpenses();
            fetchTreasuryBalance();
        } catch (err) { 
            alert('فشل التصفية، يرجى التحقق من المدخلات'); 
        }
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
            
            {/* شريط العنوان والتصدير */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">💸 إدارة الخزنة الشاملة والمصاريف وسحب الكاش</h2>
                    <p className="text-xs text-slate-400 mt-1">تسجيل سحب وإيداع الكاش بالصندوق، النفقات التشغيلية، وتصفية أتعاب الكادر الطبي</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExportExpenses} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-xs cursor-pointer">
                        🟢 تصدير المصاريف لـ Excel
                    </button>
                    <button onClick={() => window.location.href = '/financial'} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer">
                        ← العودة للوحة المالية والتقارير
                    </button>
                </div>
            </div>

            {/* بطاقة كاش الصندوق اللحظية (توضح الرصيد الحقيقي أو العجز) */}
            <div className={`p-4 rounded-2xl border transition shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                treasuryBalance >= 0 
                    ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/50 border-emerald-200 text-emerald-950'
                    : 'bg-gradient-to-r from-rose-50 via-amber-50 to-rose-100/60 border-rose-200 text-rose-950'
            }`}>
                <div className="flex items-center gap-3">
                    <span className="text-3xl">{treasuryBalance >= 0 ? '💰' : '⚠️'}</span>
                    <div>
                        <span className="text-xs font-bold block text-slate-600">رصيد كاش الصندوق الفعلي المتوفر حالياً بالمركز:</span>
                        <div className="flex items-baseline gap-2 mt-0.5">
                            <span className={`text-2xl font-black ${treasuryBalance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                {treasuryBalance.toLocaleString()} <span className="text-xs font-bold text-slate-500">ل.س</span>
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-black ${
                                treasuryBalance >= 0 ? 'bg-emerald-200/80 text-emerald-900' : 'bg-rose-200 text-rose-800 animate-pulse'
                            }`}>
                                {treasuryBalance >= 0 ? 'رصيد متاح للصرف' : 'عجز في الصندوق (سحب مكشوف)'}
                            </span>
                        </div>
                    </div>
                </div>
                {treasuryBalance < 0 && (
                    <div className="text-xs text-rose-700 bg-white/70 p-2.5 rounded-xl border border-rose-200 font-medium">
                        💡 يمكنك اختيار <strong>"إدخال كاش للصندوق"</strong> أدناه لإيداع نقد وتعديل كفة الصندوق.
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* قسم تسجيل القيد المالي (سحب / إيداع / مصروف) */}
                <div className="lg:col-span-1 space-y-6">
                    <div className={`bg-white p-5 rounded-3xl border shadow-xs space-y-4 text-xs ${
                        isDeposit ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-slate-200/80'
                    }`}>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                            <h3 className="font-bold text-slate-800 text-sm">
                                {isDeposit ? '📥 تسجيل إيداع وتغذية كاش' : '✍️ تسجيل قيد صرف أو سحب'}
                            </h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                isDeposit ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                                {isDeposit ? 'حركة وارد (+)' : 'حركة صادر (-)'}
                            </span>
                        </div>

                        <form onSubmit={handleCreateExpense} className="space-y-3.5 text-slate-600">
                            <div>
                                <label className="block mb-1.5 font-bold text-slate-700">تصنيف بند العملية المالية:</label>
                                <select 
                                    className="w-full border border-slate-200 p-2.5 rounded-xl bg-slate-50 font-bold text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                                    value={expenseForm.category} 
                                    onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                                >
                                    <option value="سحب كاش من الصندوق">🔴 سحب كاش من الصندوق</option>
                                    <option value="إدخال كاش للصندوق (تغذية من المالك)">🟢 إدخال كاش للصندوق (تغذية من المالك)</option>
                                    <option value="مصاريف تشغيلية">مصاريف تشغيلية (كهرباء، ماء، وقود)</option>
                                    <option value="صيانة ومعدات">صيانة أجهزة ومعدات طبية</option>
                                    <option value="مصرُوفات عامة">نثريات ومصروفات عامة</option>
                                </select>
                            </div>

                            <div>
                                <label className="block mb-1.5 font-bold text-slate-700">
                                    {isDeposit ? 'المبلغ المراد إيداعه وتغذية الصندوق به (ل.س):' : 'المبلغ المالي المدفوع / المسحوب (ل.س):'}
                                </label>
                                <input 
                                    type="number" 
                                    min="1"
                                    required 
                                    placeholder="أدخل المبلغ هنا..."
                                    className={`w-full border p-2.5 rounded-xl font-black text-center text-lg outline-none transition ${
                                        isDeposit 
                                            ? 'border-emerald-300 text-emerald-700 bg-emerald-50/20 focus:ring-2 focus:ring-emerald-500'
                                            : 'border-red-200 text-red-600 bg-red-50/20 focus:ring-2 focus:ring-red-400'
                                    }`} 
                                    value={expenseForm.amount} 
                                    onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} 
                                />
                            </div>

                            <div>
                                <label className="block mb-1.5 font-bold text-slate-700">
                                    {isDeposit ? 'البيان / سبب تغذية الصندوق:' : 'البيان / تفاصيل القيد أو السحب:'}
                                </label>
                                <textarea 
                                    rows="3" 
                                    required 
                                    placeholder={
                                        isDeposit 
                                            ? 'مثلاً: تمويل من المالك لتغطية مصاريف / تصحيح رصيد الخزينة...'
                                            : 'بيان سحب الكاش أو تفاصيل المصروف...'
                                    } 
                                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 outline-none focus:ring-2 focus:ring-[#1e3a8a]" 
                                    value={expenseForm.notes} 
                                    onChange={e => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                                ></textarea>
                            </div>

                            <button 
                                type="submit" 
                                disabled={submitLoading} 
                                className={`w-full text-white font-bold py-3 rounded-xl text-xs shadow-sm transition cursor-pointer flex items-center justify-center gap-2 ${
                                    isDeposit 
                                        ? 'bg-emerald-600 hover:bg-emerald-700' 
                                        : 'bg-rose-600 hover:bg-rose-700'
                                }`}
                            >
                                {submitLoading 
                                    ? 'جاري الحفظ...' 
                                    : isDeposit 
                                        ? '📥 تأكيد إيداع الكاش وتغذية الصندوق' 
                                        : '✔ تأكيد قيد الصرف النقدي'
                                }
                            </button>
                        </form>
                    </div>

                    {/* سجل القيود الأخيرة */}
                    <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3 text-xs max-h-80 overflow-y-auto">
                        <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-2">📋 آخر حركات الخزنة المسجلة:</h4>
                        <div className="space-y-2">
                            {expensesList.length === 0 ? (
                                <p className="text-center text-slate-400 py-4 text-xs font-medium">لا توجد حركات مسجلة</p>
                            ) : (
                                expensesList.map(e => {
                                    const isDepositItem = e.transaction_type === 'deposit' || (e.category && (e.category.includes('إيداع') || e.category.includes('تغذية')));
                                    return (
                                        <div 
                                            key={e.id} 
                                            className={`p-3 rounded-2xl border flex justify-between items-start text-xs ${
                                                isDepositItem 
                                                    ? 'bg-emerald-50/50 border-emerald-200' 
                                                    : 'bg-slate-50 border-slate-200/80'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`font-bold ${isDepositItem ? 'text-emerald-800' : 'text-slate-800'}`}>
                                                        {e.category}
                                                    </span>
                                                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
                                                        isDepositItem ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-100 text-rose-700'
                                                    }`}>
                                                        {isDepositItem ? 'وارد +' : 'صادر -'}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-0.5">{e.notes || 'بلا بيان'}</p>
                                            </div>
                                            <span className={`font-black whitespace-nowrap text-xs ${
                                                isDepositItem ? 'text-emerald-700' : 'text-rose-600'
                                            }`}>
                                                {isDepositItem ? '+' : '-'} {parseFloat(e.amount).toLocaleString()} ل.س
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* قسم مستحقات الكادر الطبي والعمليات */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex gap-2 items-center w-full text-xs text-slate-500">
                            <div className="flex-1">
                                <label className="block mb-1 font-semibold text-slate-600">من تاريخ:</label>
                                <input type="date" className="w-full border border-slate-200 p-2 rounded-xl outline-none bg-slate-50" value={dateFilters.from_date} onChange={e => setDateFilters({ ...dateFilters, from_date: e.target.value })} />
                            </div>
                            <div className="flex-1">
                                <label className="block mb-1 font-semibold text-slate-600">إلى تاريخ:</label>
                                <input type="date" className="w-full border border-slate-200 p-2 rounded-xl outline-none bg-slate-50" value={dateFilters.to_date} onChange={e => setDateFilters({ ...dateFilters, to_date: e.target.value })} />
                            </div>
                        </div>
                        <div className="bg-purple-700 p-3.5 rounded-2xl text-white text-center min-w-[200px] shadow-xs">
                            <span className="text-[10px] block opacity-85 font-semibold">إجمالي مستحقات الكادر بالفترة:</span>
                            <span className="text-base font-black">{(staffSummary.total_staff_owed || 0).toLocaleString()} ل.س</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="p-3.5 bg-slate-50 border-b border-slate-100">
                            <h4 className="text-xs font-bold text-slate-700">🩺 كشف مستحقات وحصص الممرضين التفصيلي عن الزيارات والعمليات:</h4>
                        </div>
                        <div className="overflow-x-auto text-xs">
                            <table className="w-full text-right border-collapse">
                                <thead className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-100 text-[11px]">
                                    <tr>
                                        <th className="p-3">تاريخ الحالة</th>
                                        <th className="p-3">اسم المريض</th>
                                        <th className="p-3">نوع الحالة</th>
                                        <th className="p-3">الحساب المدفوع</th>
                                        <th className="p-3 text-purple-700">حصة الكادر</th>
                                        <th className="p-3 text-center">الإجراء المالي</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {loadingStaff ? (
                                        <tr><td colSpan="6" className="text-center py-6 text-slate-400 font-medium">جاري احتساب النسب المئوية للحالات...</td></tr>
                                    ) : staffSummary.detailed_shares?.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center py-6 text-slate-400 font-medium">لا توجد حالات طبية معلقة بحاجة لتصفية في هذا النطاق الزمني.</td></tr>
                                    ) : (
                                        staffSummary.detailed_shares?.map(c => (
                                            <tr key={c.id} className="hover:bg-slate-50/60 transition">
                                                <td className="p-3 text-slate-400 font-medium">{c.date}</td>
                                                <td className="p-3 font-bold text-slate-800">{c.patient_name}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${c.case_type === 'internal' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                                                        {c.case_type === 'internal' ? 'داخلية (40% لك)' : 'خارجية (60% لك)'}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-slate-500">{c.total_paid.toLocaleString()} ل.س</td>
                                                <td className="p-3 font-black text-purple-700 bg-purple-50/20">{c.staff_share.toLocaleString()} ل.س</td>
                                                <td className="p-3 text-center">
                                                    <button 
                                                        onClick={() => handleSettleStaffShare(c.id, c.staff_share, c.patient_name)} 
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] shadow-2xs transition cursor-pointer"
                                                    >
                                                        💵 تصفية الحساب كاش
                                                    </button>
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

            {/* نافذة التنبيه التحذيري عند السحب المكشوف (عجز الصندوق) */}
            {deficitModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-200 space-y-4" dir="rtl">
                        <div className="flex items-center gap-3 text-rose-600 border-b border-rose-100 pb-3">
                            <span className="text-3xl">⚠️</span>
                            <div>
                                <h3 className="text-base font-black text-slate-900">تنبيه عجز نقدي (سحب على المكشوف)</h3>
                                <p className="text-xs text-rose-600 font-semibold">المبلغ المطلوب يتجاوز كاش الخزينة المتوفر!</p>
                            </div>
                        </div>

                        <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            <div className="flex justify-between">
                                <span>الرصيد الفعلي المتوفر حالياً:</span>
                                <strong className={`font-bold ${deficitModal.currentBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {deficitModal.currentBalance.toLocaleString()} ل.س
                                </strong>
                            </div>
                            <div className="flex justify-between">
                                <span>المبلغ المطلوب سحبه / صرفه:</span>
                                <strong className="font-bold text-rose-600">{deficitModal.amount.toLocaleString()} ل.س</strong>
                            </div>
                            <hr className="border-slate-200" />
                            <div className="flex justify-between items-center text-sm pt-1">
                                <span className="font-bold text-slate-800">الرصيد المتوقع بعد العملية:</span>
                                <strong className="font-black text-rose-700 text-base">{deficitModal.projectedBalance.toLocaleString()} ل.س (سالب)</strong>
                            </div>
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                            سيؤدي تسجيل هذا القيد إلى جعل رصيد الصندوق مكشوفاً بالسالب. هل تؤكد رغبتك في إتمام العملية والسماح بالرصيد المكشوف؟
                        </p>

                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    if (deficitModal.onConfirm) deficitModal.onConfirm();
                                }}
                                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer shadow-sm"
                            >
                                🔴 نعم، تأكيد السحب رغم العجز
                            </button>
                            <button
                                type="button"
                                onClick={() => setDeficitModal({ isOpen: false, amount: 0, currentBalance: 0, projectedBalance: 0, onConfirm: null })}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ExpensesManagement;