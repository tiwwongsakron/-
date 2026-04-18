// ==========================================
// ส่วนตั้งค่าเริ่มต้น (Setup & Imports)
// ==========================================
const express = require('express'); // นำเข้า Express.js สำหรับทำ Web Server
const cors = require('cors');       // นำเข้า CORS เพื่ออนุญาตให้หน้าเว็บ (Frontend) คุยกับเซิร์ฟเวอร์ได้
const db = require('./database');   // นำเข้าการเชื่อมต่อฐานข้อมูล SQLite ที่เราเขียนไว้ในไฟล์ database.js

const app = express();
app.use(cors());                    // เปิดใช้งาน CORS
app.use(express.json());            // อนุญาตให้เซิร์ฟเวอร์รับข้อมูลที่ส่งมาเป็นรูปแบบ JSON ได้

// ==========================================
// ส่วนที่ 1: API ดึงประวัติการจับคู่ (Trade History)
// ==========================================
app.get('/api/matchings', (req, res) => {
    // ใช้คำสั่ง LEFT JOIN เพื่อดึง "ชื่อ" ของคนขาย (s.name) และคนซื้อ (b.name) จากตาราง users มาด้วย
    const query = `
        SELECT m.*, 
               s.name AS seller_name, 
               b.name AS buyer_name
        FROM matchings m
        LEFT JOIN users s ON m.seller_user_id = s.id
        LEFT JOIN users b ON m.buyer_user_id = b.id
        ORDER BY m.id ASC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows); // ส่งข้อมูลกลับไปให้หน้าเว็บ
    });
});

// ==========================================
// ส่วนที่ 2: API รับคำสั่งซื้อ-ขายใหม่ (Order Entry)
// ==========================================
app.post('/api/orders', (req, res) => {
    // 2.1 แกะข้อมูลที่หน้าเว็บส่งมาให้
    const { user_id, name, email, phone, product_id, order_type_id, price, volume } = req.body;
    
    // 2.2 บันทึกข้อมูลลูกค้าลงตาราง users ก่อน
    const insertUserQuery = `INSERT INTO users (id, name, email, phone) VALUES (?, ?, ?, ?)`;
    db.run(insertUserQuery, [user_id, name, email, phone], function(err) {
        
        // 2.3 บันทึกคำสั่งซื้อ/ขาย ลงตาราง orders
        const insertOrderQuery = `INSERT INTO orders (user_id, product_id, order_type_id, price, volume) VALUES (?, ?, ?, ?, ?)`;
        db.run(insertOrderQuery, [user_id, product_id, order_type_id, price, volume], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            // 2.4 ทันทีที่บันทึกคำสั่งเสร็จ ให้เรียกใช้ "ฟังก์ชันจับคู่" ทันที!
            matchOrders(product_id, () => {
                res.json({ message: 'ส่งคำสั่งและประมวลผลเรียบร้อย!' });
            });
        });
    });
});

// ==========================================
// ส่วนที่ 3: API ดึงข้อมูลส่วนตัวผู้ใช้ (สำหรับ Popup)
// ==========================================
app.get('/api/users/:id', (req, res) => {
    const userId = req.params.id; // รับ ID ที่แนบมากับ URL
    
    // ค้นหาข้อมูลคนๆ นั้นในฐานข้อมูล
    db.get(`SELECT id, name, email, phone FROM users WHERE id = ?`, [userId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้งานนี้" });
        res.json(row); // ส่งข้อมูลกลับไปโชว์ใน Popup
    });
});

// ==========================================
// ส่วนที่ 4: หัวใจหลัก 🧠 ลอจิกการจับคู่ (Matching Algorithm)
// ==========================================
function matchOrders(productId, callback) {
    // 4.1 จัดเรียงคิวรอซื้อ (Buy): ราคาสูงอยู่บน (DESC) -> เวลาน้อย/มาก่อนอยู่บน (ASC) -> ปริมาณมากอยู่บน (DESC)
    const buyQuery = `SELECT * FROM orders WHERE product_id = ? AND order_type_id = 1 AND volume > 0 ORDER BY price DESC, timestamp ASC, volume DESC`;
    
    // 4.2 จัดเรียงคิวรอขาย (Sell): ราคาต่ำอยู่บน (ASC) -> เวลาน้อย/มาก่อนอยู่บน (ASC) -> ปริมาณมากอยู่บน (DESC)
    const sellQuery = `SELECT * FROM orders WHERE product_id = ? AND order_type_id = 2 AND volume > 0 ORDER BY price ASC, timestamp ASC, volume DESC`;

    db.all(buyQuery, [productId], (err, buyOrders) => {
        if (err) return callback();
        db.all(sellQuery, [productId], (err, sellOrders) => {
            if (err) return callback();

            let bIndex = 0; // ตัวชี้คิวฝั่งซื้อ (เริ่มที่คิวแรก)
            let sIndex = 0; // ตัวชี้คิวฝั่งขาย (เริ่มที่คิวแรก)

            // ฟังก์ชันย่อยสำหรับเช็คจับคู่ทีละคู่
            function processNextMatch() {
                // ถ้าคิวฝั่งไหนฝั่งนึงหมดแล้ว ให้หยุดทำงาน
                if (bIndex >= buyOrders.length || sIndex >= sellOrders.length) return callback(); 

                let buyOrder = buyOrders[bIndex];
                let sellOrder = sellOrders[sIndex];

                // 4.3 เช็คเงื่อนไขราคา: ถ้าคนซื้อให้ราคา "มากกว่าหรือเท่ากับ" ที่คนขายอยากได้ = เกิดการซื้อขาย
                if (buyOrder.price >= sellOrder.price) {
                    
                    // 4.4 ตัดสินราคาขาย (Trade Price): ให้ยึดราคาของคนที่ "มาก่อน (Maker)" เป็นหลัก
                    let tradePrice = (new Date(buyOrder.timestamp) <= new Date(sellOrder.timestamp)) ? buyOrder.price : sellOrder.price;
                    
                    // 4.5 ตัดสินปริมาณ (Trade Volume): ซื้อขายกันด้วยจำนวนที่ "น้อยกว่า" ระหว่างสองฝั่ง
                    let tradeVolume = Math.min(buyOrder.volume, sellOrder.volume);

                    // 4.6 บันทึกประวัติที่จับคู่สำเร็จลงตาราง matchings
                    const insertMatch = `INSERT INTO matchings (seller_user_id, buyer_user_id, product_id, price, volume, seller_order_time, buyer_order_time) VALUES (?, ?, ?, ?, ?, ?, ?)`;
                    
                    db.run(insertMatch, [sellOrder.user_id, buyOrder.user_id, productId, tradePrice, tradeVolume, sellOrder.timestamp, buyOrder.timestamp], function(err) {
                        if (!err) {
                            // 4.7 หักลบจำนวนสินค้าของทั้งสองฝั่งใน Memory
                            buyOrder.volume -= tradeVolume;
                            sellOrder.volume -= tradeVolume;
                            
                            // 4.8 อัปเดตยอดสินค้าที่เหลือกลับลงไปใน Database
                            const updateVolume = `UPDATE orders SET volume = ? WHERE id = ?`;
                            db.run(updateVolume, [buyOrder.volume, buyOrder.id]);
                            db.run(updateVolume, [sellOrder.volume, sellOrder.id]);
                            
                            // 4.9 ถ้าใครของหมด (เหลือ 0) ให้เลื่อนคิวไปหาคนถัดไป
                            if (buyOrder.volume === 0) bIndex++;
                            if (sellOrder.volume === 0) sIndex++;
                            
                            // วนลูปเช็คคิวต่อไป
                            processNextMatch();
                        } else {
                            processNextMatch();
                        }
                    });
                } else {
                    // ถ้าราคาคนซื้อน้อยกว่าคนขาย (ตกลงกันไม่ได้) ให้หยุดทำงาน
                    callback();
                }
            }
            processNextMatch(); // เริ่มต้นทำงาน
        });
    });
}

// ==========================================
// ส่วนที่ 5: API ดึงสถานะสมุดคำสั่งซื้อขาย (Active Order Book)
// ==========================================
app.get('/api/active-orders', (req, res) => {
    // ดึงเฉพาะคำสั่งที่ยังมี volume > 0 (ยังไม่ถูกจับคู่ หรือจับคู่ไม่หมด) 
    // และ JOIN เอาชื่อเจ้าของออเดอร์มาด้วย
    const query = `
        SELECT o.*, u.name AS user_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.volume > 0 
        ORDER BY o.timestamp ASC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ==========================================
// ส่วนที่ 6: API รีเซ็ตข้อมูลสำหรับทดสอบ (Clear/Reset)
// ==========================================
app.delete('/api/reset', (req, res) => {
    // สั่งรันคำสั่งลบข้อมูลเรียงตามลำดับ (serialize)
    db.serialize(() => {
        db.run(`DELETE FROM orders`);    // ลบคำสั่งซื้อขายทั้งหมด
        db.run(`DELETE FROM matchings`); // ลบประวัติจับคู่ทั้งหมด
        // รีเซ็ตตัวนับ ID อัตโนมัติ (AUTOINCREMENT) ให้กลับไปเป็น 1 ใหม่
        db.run(`DELETE FROM sqlite_sequence WHERE name IN ('orders', 'matchings')`, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'รีเซ็ตข้อมูลระบบเรียบร้อย!' });
        });
    });
});

// ==========================================
// ส่วนสั่งเปิดเซิร์ฟเวอร์
// ==========================================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 เซิร์ฟเวอร์ Backend รันพร้อมระบบ Matching Algorithm ที่ http://localhost:${PORT}`);
});