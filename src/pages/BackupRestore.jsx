import React, { useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const BackupRestore = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [restoreFile, setRestoreFile] = useState(null);
    const [restoreLoading, setRestoreLoading] = useState(false);
    const navigate = useNavigate();

    const handleRunBackup = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const res = await api.post('/backup/run');
            setMessage({ type: 'success', text: res.data.message });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'حدث خطأ أثناء أخذ النسخة الاحتياطية' });
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        if (!restoreFile) return;
        
        if (!window.confirm('هل أنت متأكد من رغبتك في استعادة النظام؟ سيتم فقدان جميع البيانات الحالية واستبدالها ببيانات النسخة المرفوعة.')) {
            return;
        }

        setRestoreLoading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('backup_file', restoreFile);

        try {
            const res = await api.post('/backup/restore', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage({ type: 'success', text: res.data.message });
            setRestoreFile(null);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'حدث خطأ أثناء الاستعادة.' });
        } finally {
            setRestoreLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in" dir="rtl">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-800">💾 النسخ الاحتياطي والاستعادة</h2>
                    <p className="text-sm text-gray-500 mt-1">حماية بيانات المركز الطبي وإرشادات استعادة النظام</p>
                </div>
                <button 
                    onClick={() => navigate('/')} 
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs transition"
                >
                    ← العودة للوحة التحكم
                </button>
            </div>

            {/* Backup Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-blue-700 border-b pb-2">عمل نسخة احتياطية (Backup)</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                    يقوم النظام تلقائياً بأخذ نسخة احتياطية يومية في الساعة الثانية صباحاً. 
                    مع ذلك، يمكنك أخذ نسخة احتياطية يدوية في أي وقت بالضغط على الزر أدناه.
                </p>
                
                {message && (
                    <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                        {message.text}
                    </div>
                )}

                <button 
                    onClick={handleRunBackup} 
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold px-6 py-3 rounded-xl text-sm transition shadow-md flex items-center gap-2"
                >
                    {loading ? '⏳ جاري إنشاء النسخة الاحتياطية...' : '📥 أخذ نسخة احتياطية الآن'}
                </button>
            </div>

            {/* Restore Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-rose-700 border-b pb-2">استعادة النظام (Restore)</h3>
                
                <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-xl text-sm font-bold flex items-start gap-3">
                    <span className="text-xl">⚠️</span>
                    <p>
                        تحذير: عملية الاستعادة ستقوم بمسح جميع البيانات الحالية بالكامل واستبدالها ببيانات النسخة المرفوعة. هذه العملية لا يمكن التراجع عنها!
                    </p>
                </div>

                <div className="space-y-4 text-sm text-gray-700 font-medium bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <p className="font-bold text-base mb-2">رفع ملف النسخة الاحتياطية (.zip):</p>
                    
                    <input 
                        type="file" 
                        accept=".zip" 
                        onChange={(e) => setRestoreFile(e.target.files[0])}
                        className="block w-full text-sm text-gray-500
                                   file:mr-4 file:py-2 file:px-4
                                   file:rounded-full file:border-0
                                   file:text-sm file:font-semibold
                                   file:bg-rose-50 file:text-rose-700
                                   hover:file:bg-rose-100 cursor-pointer"
                    />

                    <button 
                        onClick={handleRestore}
                        disabled={!restoreFile || restoreLoading}
                        className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-xl transition shadow-sm flex items-center justify-center gap-2 mt-4"
                    >
                        {restoreLoading ? '⏳ جاري استخراج البيانات واستعادة النظام (يرجى عدم إغلاق الصفحة)...' : '🔄 بدء عملية استعادة النظام'}
                    </button>
                </div>
            </div>

        </div>
    );
};

export default BackupRestore;
