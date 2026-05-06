import React, { useEffect, useState } from 'react';
import api from './api/axios';

function App() {
  const [services, setServices] = useState([]);
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    // جلب الخدمات
    api.get('/services').then(res => setServices(res.data));
    // جلب المخزون
    api.get('/inventory').then(res => setInventory(res.data));
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>مركز الطبابة الصغير - لوحة التحكم</h1>
      
      <div style={{ display: 'flex', gap: '50px' }}>
        <section>
          <h2>الخدمات المتاحة</h2>
          <ul>
            {services.map(s => <li key={s.id}>{s.name} ({s.credits_required} نقطة)</li>)}
          </ul>
        </section>

        <section>
          <h2>المخزون الحالي</h2>
          <ul>
            {inventory.map(i => (
              <li key={i.id} style={{ color: i.quantity <= i.threshold ? 'red' : 'black' }}>
                {i.name}: {i.quantity} {i.unit}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default App;