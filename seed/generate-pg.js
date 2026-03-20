const { faker } = require('@faker-js/faker');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const path = require('path');

// --- 0. PostgreSQL Connection ---
// * PLEASE EDIT THE CONNECTION DETAILS TO MATCH YOUR DATABASE *
const pool = new Pool({
  
  connectionString: 'postgres://postgres:1234@localhost:5432/crypto_exchange_test',
});

// --- Create Tables ---
async function createTables() {
    const client = await pool.connect();
    try {
        await client.query(`
            DROP TABLE IF EXISTS transactions;
            DROP TABLE IF EXISTS offers;
            DROP TABLE IF EXISTS wallets;
            DROP TABLE IF EXISTS currencies;
            DROP TABLE IF EXISTS users;

            CREATE TABLE users (
                id UUID PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                user_name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE currencies (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                price NUMERIC(20, 8) NOT NULL DEFAULT 1
            );
            CREATE TABLE wallets (
                user_id UUID REFERENCES users(id),
                currency_id TEXT REFERENCES currencies(id),
                balance NUMERIC(20, 8) NOT NULL,
                update_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, currency_id)
            );
            CREATE TABLE offers (
                id UUID PRIMARY KEY,
                user_id UUID REFERENCES users(id),
                type TEXT NOT NULL,
                crypto_currency_id TEXT REFERENCES currencies(id),
                fiat_currency_id TEXT REFERENCES currencies(id),
                price NUMERIC(20, 8) NOT NULL,
                available NUMERIC(20, 8) NOT NULL,
                order_limit NUMERIC(20, 3) NOT NULL,
                payment_method TEXT NOT NULL,
                status TEXT NOT NULL,
                update_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE transactions (
                id UUID PRIMARY KEY,
                user_id UUID REFERENCES users(id),
                trader_id UUID REFERENCES users(id),
                offer_id UUID REFERENCES offers(id),
                price NUMERIC(20, 8) NOT NULL,
                quantity NUMERIC(20, 8) NOT NULL,
                fee NUMERIC(20, 8) NOT NULL,
                update_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Tables created successfully!');
    } finally {
        client.release();
    }
}

// --- 1. ฟังก์ชันสร้างข้อมูล Users ---
const generateUsers = (count) => {
  const users = [];
  hashpassword = bcrypt.hashSync('1234', 10); // รหัสผ่านตัวอย่างที่ถูก hash แล้ว
  for (let i = 1; i <= count; i++) {
    users.push({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      user_name: faker.internet.username(),
      password_hash: hashpassword, // ในความจริงต้องผ่านการ hash
      createdAt: faker.date.past()
    });
  }
  return users;
};

// --- 2. ฟังก์ชันสร้างข้อมูล Wallets (อ้างอิงจาก Users) ---
const generateWallets = (users, currencies) => {
  const wallets = [];

  users.forEach((user) => {
    // สุ่มเลือก 2-4 เหรียญให้แต่ละคน
    const selected = faker.helpers.arrayElements(currencies, { min: 1, max: 3 });

    selected.forEach((currency) => {
      wallets.push({
        user_id: user.id, // ใช้ ID จาก User ที่เพิ่งสร้าง
        currency_id: currency.id,
        balance: parseFloat(faker.finance.amount({ min: 0, max: 100, dec: 8 })),
        update_date: new Date()
      });
    });
  });
  return wallets;
};

// --- 3. ฟังก์ชันสร้างข้อมูล Offers (อ้างอิงจาก Users) ---
const generateOffers = (users, currencies) => {
  const offers = [];
  const cryptoCurrencies = currencies.filter((c) => c.type === 'CRYPTO');
  const fiatCurrencies = currencies.filter((c) => c.type === 'FIAT');

  users.forEach((user) => {
    const type = faker.helpers.arrayElement(['BUY', 'SELL']);
    let crypto, fiat;

    crypto = faker.helpers.arrayElement(cryptoCurrencies);
    fiat = faker.helpers.arrayElement(fiatCurrencies);

    // Calculate realistic price based on currency prices (+/- 5%)
    const basePrice = crypto.price * fiat.price;
    const minPrice = basePrice * 0.95;
    const maxPrice = basePrice * 1.05;

    offers.push({
      id: faker.string.uuid(),
      user_id: user.id,
      type: type,
      crypto_currency_id: crypto.id,
      fiat_currency_id: fiat.id,
      price: parseFloat(faker.finance.amount({ min: minPrice, max: maxPrice, dec: 8 })),
      available: parseFloat(faker.finance.amount({ min: 100000, max: 500000, dec: 8 })),
      order_limit: parseFloat(faker.finance.amount({ min: 100000, max: 500000, dec: 3 })),
      payment_method: faker.helpers.arrayElement(['BANK_TRANSFER', 'PAYPAL', 'CRYPTO_TRANSFER']),
      status: 'OPEN',
      update_date: new Date()
    });
  });
  return offers;
};

// --- 3. ฟังก์ชันสร้างข้อมูล Transactions (อ้างอิงจาก Users) ---
const generateTransactions = (users, offers) => {
  const transactions = [];

  users.forEach((user) => {
    const selectedOffers = faker.helpers.arrayElement(offers);

    transactions.push({
      id: faker.string.uuid(),
      user_id: user.id,
      trader_id: selectedOffers.user_id,
      offer_id: selectedOffers.id,
      price: selectedOffers.price,
      quantity: faker.number.int({ min: 1, max: 100 }),
      fee: parseFloat(faker.finance.amount({ min: 0, max: 0.01, dec: 8 })),
      update_date: new Date()
    });
  });
  return transactions;
};

// --- Insert Data ---
async function insertUsers(client, users) {
    const query = 'INSERT INTO users (id, email, user_name, password_hash, "createdAt") VALUES ($1, $2, $3, $4, $5)';
    for (const user of users) {
        await client.query(query, [user.id, user.email, user.user_name, user.password_hash, user.createdAt]);
    }
    console.log(`✅ Inserted ${users.length} users`);
}

async function insertCurrencies(client, currencies) {
    const query = 'INSERT INTO currencies (id, name, type) VALUES ($1, $2, $3)';
    for (const currency of currencies) {
        await client.query(query, [currency.id, currency.name, currency.type]);
    }
    console.log(`✅ Inserted ${currencies.length} currencies`);
}

async function insertWallets(client, wallets) {
    const query = 'INSERT INTO wallets (user_id, currency_id, balance, update_date) VALUES ($1, $2, $3, $4)';
    for (const wallet of wallets) {
        await client.query(query, [wallet.user_id, wallet.currency_id, wallet.balance, wallet.update_date]);
    }
    console.log(`✅ Inserted ${wallets.length} wallets`);
}

async function insertOffers(client, offers) {
    const query = 'INSERT INTO offers (id, user_id, type, crypto_currency_id, price, fiat_currency_id, available, order_limit, payment_method, status, update_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)';
    for (const offer of offers) {
        await client.query(query, [offer.id, offer.user_id, offer.type, offer.crypto_currency_id, offer.price, offer.fiat_currency_id, offer.available, offer.order_limit, offer.payment_method, offer.status, offer.update_date]);
    }
    console.log(`✅ Inserted ${offers.length} offers`);
}

async function insertTransactions(client, transactions) {
    const query = 'INSERT INTO transactions (id, user_id, trader_id, offer_id, price, quantity, fee, update_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
    for (const transaction of transactions) {
        await client.query(query, [transaction.id, transaction.user_id, transaction.trader_id, transaction.offer_id, transaction.price, transaction.quantity, transaction.fee, transaction.update_date]);
    }
    console.log(`✅ Inserted ${transactions.length} transactions`);
}

// --- ส่วนการทำงานหลัก (Execution) ---
const USER_COUNT = 50;

console.log('⏳ กำลังเริ่มสร้างข้อมูลจำลอง...');

async function generateData() {
    const client = await pool.connect();
    try {
        await createTables();

        // อ่านไฟล์ currencies.json
        const currenciesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'currencies.json'), 'utf8'));
        console.log(`✅ โหลด currencies.json เรียบร้อย! (${currenciesData.length} เหรียญ)`);

        // สร้าง Data ใน Memory
        const usersData = generateUsers(USER_COUNT);
        const walletsData = generateWallets(usersData, currenciesData);
        const offersData = generateOffers(usersData, currenciesData);
        const transactionsData = generateTransactions(usersData, offersData);

        // Insert Data into PostgreSQL
        await insertCurrencies(client, currenciesData);
        await insertUsers(client, usersData);
        await insertWallets(client, walletsData);
        await insertOffers(client, offersData);
        await insertTransactions(client, transactionsData);

        console.log('\nสร้างข้อมูลจำลองสำเร็จ!');
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error.message);
    } finally {
        await client.release();
        await pool.end();
    }
}

generateData();
