import { useState, useEffect } from 'react';

// สร้างตัวแปรเก็บ URL ของ Backend
// เวลาทดสอบในเครื่อง ใช้ 'http://localhost:3000/api'
// เวลาเอาขึ้น Vercel ให้เปลี่ยนเป็นลิงก์ Backend จริงของคุณ
const API_BASE_URL = 'https://test2-q0wt.onrender.com/api'; 
// (ถ้ายังไม่มีลิงก์จริง ต้องไปทำขั้นตอนที่ 1 ก่อนครับ)

function App() {
  // ... (ส่วน State คงเดิม) ...

  const fetchAllData = async () => {
    try {
      // เปลี่ยนมาใช้ API_BASE_URL แทน localhost
      const resMatch = await fetch(`${API_BASE_URL}/matchings`);
      setMatchings(await resMatch.json());

      const resActive = await fetch(`${API_BASE_URL}/active-orders`);
      setActiveOrders(await resActive.json());
    } catch (error) {
      console.error("ดึงข้อมูลไม่ได้:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newUserId = generateRandomUserId();
    
    try {
      // เปลี่ยนมาใช้ API_BASE_URL
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: newUserId,
          name: formData.name, email: formData.email, phone: formData.phone,
          product_id: Number(formData.product_id), order_type_id: Number(formData.order_type_id),
          price: Number(formData.price), volume: Number(formData.volume)
        })
      });

      if (res.ok) {
        setFormData({ ...formData, price: '', volume: '' }); 
        await fetchAllData();
        alert(`ส่งคำสั่งสำเร็จ! รหัสผู้ใช้คือ: ${newUserId}`);
      }
    } catch (error) {
      console.error("ส่งข้อมูลไม่สำเร็จ:", error);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      // เปลี่ยนมาใช้ API_BASE_URL
      const res = await fetch(`${API_BASE_URL}/users/${userId}`);
      if (res.ok) {
        setSelectedUser(await res.json());
      } else {
        alert("ไม่พบข้อมูลผู้ใช้งาน");
      }
    } catch (error) {
      console.error("ดึงข้อมูลผู้ใช้ไม่ได้:", error);
    }
  };

  const handleResetSystem = async () => {
    if (window.confirm("🚨 คุณต้องการล้างประวัติคำสั่งซื้อขายทั้งหมดเพื่อเริ่มทดสอบใหม่ ใช่หรือไม่?")) {
      try {
        // เปลี่ยนมาใช้ API_BASE_URL
        const res = await fetch(`${API_BASE_URL}/reset`, { method: 'DELETE' });
        if (res.ok) {
          await fetchAllData();
          alert("ทำความสะอาดระบบเรียบร้อย พร้อมสำหรับการทดสอบรอบใหม่!");
        }
      } catch (error) {
        console.error("รีเซ็ตไม่สำเร็จ:", error);
      }
    }
  };

  // ... (ส่วน Helpers และ HTML/JSX คงเดิมทั้งหมด) ...

  // ==========================================
  // ส่วนที่ 4: ฟังก์ชันช่วยเหลือ (Helpers)
  // ==========================================

  // 4.1 แปลงรหัสสินค้า (ID) ให้กลายเป็นชื่อภาษาไทย
  const getProductName = (id) => {
    switch (id) {
      case 101: return "เก๋ากี้"; case 102: return "ถังเช่า"; case 103: return "โสมจีน"; 
      case 104: return "ตังกุย"; case 105: return "หลินจือ"; default: return "ไม่ทราบชื่อสินค้า";
    }
  };

  // ==========================================
  // ส่วนที่ 5: โครงสร้างหน้าเว็บ (HTML/JSX)
  // ==========================================
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* --- ส่วนหัวเว็บ --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>ระบบจับคู่ซื้อขายสมุนไพร demo</h1>
        <button onClick={handleResetSystem} style={{ padding: '10px 15px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
          (Reset)
        </button>
      </div>

      {/* --- ตารางที่ 1: ฟอร์มกรอกข้อมูลการสั่งซื้อ/ขาย --- */}
      <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px', borderRadius: '8px' }}>
        <h2> รายละเอียดข้อมูลการซื้อ-ขาย </h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid #eee', paddingBottom: '10px' }}><strong>ข้อมูลใช้งาน (User)</strong></div>
          <div><label>ชื่อ-นามสกุล: </label><br/><input type="text" name="name" value={formData.name} onChange={handleChange} required style={{ width: '100%', padding: '5px' }} /></div>
          <div><label>เบอร์โทรศัพท์: </label><br/><input type="tel" name="phone" value={formData.phone} onChange={handleChange} required style={{ width: '100%', padding: '5px' }} /></div>
          <div style={{ gridColumn: '1 / -1' }}><label>อีเมล: </label><br/><input type="email" name="email" value={formData.email} onChange={handleChange} required style={{ width: '100%', padding: '5px' }} /></div>

          <div style={{ gridColumn: '1 / -1', borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: '10px' }}><strong>รายละเอียดสินค้า</strong></div>
          <div>
            <label>Buy (ซื้อ) / Sell (ขาย): </label><br/>
            <select name="order_type_id" value={formData.order_type_id} onChange={handleChange} style={{ width: '100%', padding: '5px' }}>
              <option value={1}>Buy (ซื้อ)</option><option value={2}>Sell (ขาย)</option>
            </select>
          </div>
          <div>
            <label>สินค้า: </label><br/>
            <select name="product_id" value={formData.product_id} onChange={handleChange} style={{ width: '100%', padding: '5px' }}>
              <option value={101}>เก๋ากี้ (101)</option><option value={102}>ถังเช่า (102)</option><option value={103}>โสมจีน (103)</option>
              <option value={104}>ตังกุย (104)</option><option value={105}>หลินจือ (105)</option>
            </select>
          </div>
          <div><label>ราคาเสนอ ($): </label><br/><input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} required style={{ width: '100%', padding: '5px' }} /></div>
          <div><label>ปริมาณ (kg): </label><br/><input type="number" name="volume" value={formData.volume} onChange={handleChange} required style={{ width: '100%', padding: '5px' }} /></div>
          <button type="submit" style={{ gridColumn: '1 / -1', padding: '12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>ยืนยันข้อมูล</button>
        </form>
      </div>

      {/* --- ตารางที่ 2: แสดงประวัติที่จับคู่กันสำเร็จแล้ว --- */}
      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>ตารางการจับคู่</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Match ID</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>สินค้า</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>ฝั่งขาย (ผู้ใช้) / เวลาสั่ง</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>ฝั่งซื้อ (ผู้ใช้) / เวลาสั่ง</th>
            </tr>
          </thead>
          <tbody>
            {matchings.length > 0 ? (
              matchings.map((m) => (
                <tr key={m.id}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{m.id}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>{getProductName(m.product_id)}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    <button onClick={() => fetchUserDetails(m.seller_user_id)} style={{ border: 'none', background: 'none', color: '#d32f2f', cursor: 'pointer', fontWeight: 'bold', padding: 0, textAlign: 'left' }}>
                      {m.seller_name || 'ไม่ทราบชื่อ'} (ID: {m.seller_user_id}) <br/>
                      <span style={{ fontWeight: 'normal', color: '#555' }}>(${m.price.toFixed(2)}, {m.volume} kg) 🔍</span>
                    </button>
                    <br/><small style={{ color: '#666' }}>สั่งเมื่อ: {m.seller_order_time}</small>
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    <button onClick={() => fetchUserDetails(m.buyer_user_id)} style={{ border: 'none', background: 'none', color: '#388e3c', cursor: 'pointer', fontWeight: 'bold', padding: 0, textAlign: 'left' }}>
                      {m.buyer_name || 'ไม่ทราบชื่อ'} (ID: {m.buyer_user_id}) <br/>
                      <span style={{ fontWeight: 'normal', color: '#555' }}>(${m.price.toFixed(2)}, {m.volume} kg) 🔍</span>
                    </button>
                    <br/><small style={{ color: '#666' }}>สั่งเมื่อ: {m.buyer_order_time}</small>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>ยังไม่มีประวัติการจับคู่</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- ตารางที่ 3: แสดงสถานะคิวที่ยังเหลือและรอจับคู่ --- */}
      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
        <h2>สถานะคำสั่งซื้อ-ขาย (ยอดเเละสินค้าคงเหลือ)</h2>
        <p style={{ color: '#666', fontSize: '14px', marginTop: 0 }}>*แสดงคำสั่งที่ยังรอคิวจับคู่ และยอดปริมาณคงเหลือ (Final State)</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#fff3e0' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>ประเภท</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>สินค้า</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>ลูกค้า (ราคาเสนอ, ปริมาณคงเหลือ)</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>เวลาที่สั่ง</th>
            </tr>
          </thead>
          <tbody>
            {activeOrders.length > 0 ? (
              activeOrders.map((order) => (
                <tr key={order.id}>
                  <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold', color: order.order_type_id === 1 ? '#388e3c' : '#d32f2f' }}>
                    {order.order_type_id === 1 ? 'Buy (รอซื้อ)' : 'Sell (รอขาย)'}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{getProductName(order.product_id)}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    <button onClick={() => fetchUserDetails(order.user_id)} style={{ border: 'none', background: 'none', color: '#007bff', cursor: 'pointer', fontWeight: 'bold', padding: 0, textAlign: 'left' }}>
                      {order.user_name || 'ไม่ทราบชื่อ'} (ID: {order.user_id}) <br/>
                      <span style={{ color: '#555', fontWeight: 'normal' }}>(${order.price.toFixed(2)}, {order.volume} kg) 🔍</span>
                    </button>
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '12px', color: '#666' }}>{order.timestamp}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>ไม่มีคำสั่งซื้อขายค้างในระบบ</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- ส่วนที่ 6: Popup แสดงข้อมูลติดต่อ (จะโชว์ก็ต่อเมื่อมีข้อมูลใน State selectedUser) --- */}
      {selectedUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '10px', minWidth: '350px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>
            <h2 style={{ marginTop: 0, borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
              ข้อมูลการติดต่อของ {selectedUser.name}
            </h2>
            <p style={{ fontSize: '16px' }}><strong>📞 เบอร์โทร:</strong> {selectedUser.phone}</p>
            <p style={{ fontSize: '16px' }}><strong>✉️ อีเมล:</strong> {selectedUser.email}</p>
            <div style={{ textAlign: 'center', marginTop: '25px' }}>
              <button onClick={() => setSelectedUser(null)} style={{ padding: '10px 20px', backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
