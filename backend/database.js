// ==========================================
// ส่วนที่ 1: นำเข้าเครื่องมือ (Setup)
// ==========================================
// เรียกใช้งานไลบรารี sqlite3
// .verbose() ช่วยให้ระบบแสดงข้อความ Error แบบละเอียดเวลามีบั๊ก (มีประโยชน์มากตอนพัฒนา)
const sqlite3 = require('sqlite3').verbose();

// ==========================================
// ส่วนที่ 2: เชื่อมต่อ/สร้างฐานข้อมูล (Connection)
// ==========================================
// สร้างหรือเชื่อมต่อไปที่ไฟล์ชื่อ 'database.db' (ถ้ายังไม่มีไฟล์นี้ ระบบจะสร้างให้ใหม่ทันที)
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error("❌ เกิดข้อผิดพลาด:", err.message);
    } else {
        console.log('✅ เชื่อมต่อฐานข้อมูลสำเร็จ');
    }
});

// ==========================================
// ส่วนที่ 3: สร้างตารางเก็บข้อมูล (Schema Definition)
// ==========================================
// db.serialize() เป็นคำสั่งสำคัญ! ทำหน้าที่บังคับให้คำสั่ง SQL ด้านใน "ทำงานเรียงตามลำดับ (ทีละบรรทัด)" 
// ป้องกันปัญหาตารางยังสร้างไม่เสร็จ แต่ระบบรีบไปเขียนข้อมูลใส่
db.serialize(() => {
    
    // 3.1 สร้างตารางพื้นฐาน (Master Data)
    // - users: เก็บข้อมูลลูกค้า (ID เป็น Primary Key คือห้ามซ้ำ)
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, phone TEXT)`);
    // - products: เก็บชื่อสินค้าสมุนไพร
    db.run(`CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, name TEXT)`);
    // - order_types: เก็บประเภทคำสั่ง (เช่น 1=Buy, 2=Sell)
    db.run(`CREATE TABLE IF NOT EXISTS order_types (id INTEGER PRIMARY KEY, order_type TEXT)`);
    
    // 3.2 สร้างตารางเก็บ "คิวคำสั่งซื้อ/ขาย" (Active Orders)
    // - AUTOINCREMENT: ให้ระบบรันเลข ID ให้เองอัตโนมัติ (1, 2, 3...)
    // - REAL: เก็บตัวเลขทศนิยม (สำหรับราคาและปริมาณ)
    // - DEFAULT CURRENT_TIMESTAMP: ถ้าไม่มีการส่งเวลามา ให้ใช้เวลาปัจจุบันของเซิร์ฟเวอร์ทันที
    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        product_id INTEGER,
        order_type_id INTEGER,
        price REAL,
        volume REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 3.3 สร้างตารางเก็บ "ประวัติการจับคู่สำเร็จ" (Trade History)
    // - แยกรหัสคนขาย (seller_user_id) และคนซื้อ (buyer_user_id) ออกจากกันให้ชัดเจน
    // - เก็บเวลาที่ "กดยืนยันคำสั่ง" ของทั้งสองฝั่ง (seller_order_time, buyer_order_time) เพื่อเป็นหลักฐาน
    db.run(`CREATE TABLE IF NOT EXISTS matchings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        seller_user_id INTEGER,
        buyer_user_id INTEGER,
        product_id INTEGER,
        price REAL,
        volume REAL,
        seller_order_time DATETIME,
        buyer_order_time DATETIME
    )`);
});

// ==========================================
// ส่วนที่ 4: ส่งออกไปใช้งาน (Export)
// ==========================================
// อนุญาตให้ไฟล์อื่นๆ (เช่น server.js) สามารถเรียกใช้ตัวแปร 'db' นี้เพื่อไปดึงข้อมูลได้
module.exports = db;