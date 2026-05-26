import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();

    const menuItems = [
        { title: 'إضافة حالة جديدة', desc: 'تسجيل مريض وفحص سريري', المكّون: 'cases/new', color: 'bg-blue-600' },
        { title: 'إدارة المخزون', desc: 'مراقبة المواد وحد العتبة', المكّون: 'inventory', color: 'bg-green-600' },
        { title: 'قائمة الخدمات', desc: 'تعديل الخدمات ونقاط الكريدت', المكّون: 'services', color: 'bg-purple-600' },
        { title: 'تقارير الرقابة', desc: 'مشاهدة الأرباح والحالات اليومية', المكّون: 'reports', color: 'bg-amber-600' },
    ];

    return (
        <div className="max-w-6xl mx-auto p-6" dir="rtl">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">المركز الطبي الرقمي</h1>
            <p className="text-gray-500 mb-8">مرحباً بك، يمكنك إدارة أقسام المركز من خلال الخيارات أدناه:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {menuItems.map((item, index) => (
                    <div 
                        key={index}
                        onClick={() => navigate(`/${item.مكّون}`)}
                        className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-xl transition cursor-pointer flex flex-col justify-between"
                    >
                        <div>
                            <div className={`w-12 h-12 rounded-lg ${item.color} mb-4 flex items-center justify-center text-white font-bold text-xl`}>
                                {item.title[0]}
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
                            <p className="text-sm text-gray-500">{item.desc}</p>
                        </div>
                        <span className="text-blue-500 text-sm font-semibold mt-4 block">دخول →</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;