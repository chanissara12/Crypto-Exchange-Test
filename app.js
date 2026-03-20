// ไฟล์: app.js
const express = require('express');
const app = express();
const port = 3000;
const path = require('path');

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Serve static files
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/seed', express.static(path.join(__dirname, 'seed')));
app.use(express.static(path.join(__dirname, 'templates'))); // Serve templates as static files

// 1. นำเข้าไฟล์ Router ที่สร้างไว้
const loginRoutes = require('./routes/login');
const registerRoutes = require('./routes/register');
const marketRoutes = require('./routes/markets');
const profileRoutes = require('./routes/profile');
const tradeRoutes = require('./routes/trade');
const offerRoutes = require('./routes/offer');
// const productRoutes = require('./routes/products'); // สมมติว่ามีอีกไฟล์

// 2. นำ Router มาผูกกับ Path หลัก
app.use('/login', loginRoutes);
app.use('/register', registerRoutes);
app.use('/profile', profileRoutes);
app.use('/markets', marketRoutes);
app.use('/trade', tradeRoutes);
app.use('/offer', offerRoutes);

// app.use('/products', productRoutes);

// Route พื้นฐานของหน้าหลัก
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/templates/index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});