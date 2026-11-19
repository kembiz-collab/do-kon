// Faqat admin login/paroli (ekranda ko'rinmaydi)
const ADMIN_LOGIN = 'admin';
const ADMIN_PASS = '1234';

// Telegram Bot sozlamalari (boshqa Telegram'ga buyurtma yuborish uchun)
const TELEGRAM_BOT_TOKEN = '9196327297:AAE5Khw3O3vi0y-b_K-Wt9h9TB3P2pyHzAA';

// Umumiy bulutli katalog (JSONBin.io) - boshqa foydalanuvchilarga ham mahsulot yuborish uchun
const JSONBIN_API_URL = 'https://api.jsonbin.io/v3/b';

const defaultProducts = [
    {
        id: 1,
        name: "Samsung Galaxy S24 Ultra",
        price: 13800000,
        category: "Smartfonlar",
        image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500"
    },
    {
        id: 2,
        name: "Apple MacBook Air M3",
        price: 14500000,
        category: "Noutbuklar",
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500"
    },
    {
        id: 3,
        name: "Sony WH-1000XM5 Quloqchin",
        price: 3650000,
        category: "Aksessuarlar",
        image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500"
    },
    {
        id: 4,
        name: "DeLonghi Espresso Kofemashina",
        price: 4900000,
        category: "Maishiy texnika",
        image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500"
    }
];

let products = JSON.parse(localStorage.getItem('techstore_products')) || defaultProducts;
let orders = JSON.parse(localStorage.getItem('techstore_orders')) || [];
let cart = JSON.parse(localStorage.getItem('techstore_cart')) || [];
let isAdmin = false;
localStorage.setItem('techstore_isAdmin', JSON.stringify(false));
let uploadedImageDataUrl = "";
let adminChatId = localStorage.getItem('techstore_admin_chat_id') || "";
let cloudBinId = localStorage.getItem('techstore_jsonbin_id') || "";
let cloudMasterKey = localStorage.getItem('techstore_jsonbin_key') || "";

function saveState() {
    localStorage.setItem('techstore_products', JSON.stringify(products));
    localStorage.setItem('techstore_orders', JSON.stringify(orders));
    localStorage.setItem('techstore_cart', JSON.stringify(cart));
    localStorage.setItem('techstore_isAdmin', JSON.stringify(isAdmin));
    localStorage.setItem('techstore_admin_chat_id', adminChatId);
    localStorage.setItem('techstore_jsonbin_id', cloudBinId);
    localStorage.setItem('techstore_jsonbin_key', cloudMasterKey);
}

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('authModal').classList.add('hidden');
    document.getElementById('cartModal').classList.add('hidden');
    document.getElementById('successModal').classList.add('hidden');
    document.getElementById('adminModal').classList.add('hidden');
    updateHeaderUI();
    renderProducts();
    updateCartUI();
    document.getElementById('searchInput').addEventListener('input', renderProducts);
    await fetchCloudProducts();
});

function updateHeaderUI() {
    document.getElementById('authBtn').classList.toggle('hidden', isAdmin);
    document.getElementById('logoutBtn').classList.toggle('hidden', !isAdmin);
    document.getElementById('adminPanelBtn').classList.toggle('hidden', !isAdmin);
    document.getElementById('adminBadge').classList.toggle('hidden', !isAdmin);
    document.getElementById('totalProductsStat').textContent = products.length;
    updateOrderBadge();
}

// Admin Auth
function toggleAuthModal() {
    document.getElementById('authModal').classList.toggle('hidden');
}

function handleAdminLogin(e) {
    e.preventDefault();
    const loginVal = document.getElementById('username').value.trim();
    const passVal = document.getElementById('password').value.trim();

    if (loginVal === ADMIN_LOGIN && passVal === ADMIN_PASS) {
        isAdmin = true;
        saveState();
        updateHeaderUI();
        toggleAuthModal();
        document.getElementById('authForm').reset();
    } else {
        alert("Login yoki parol noto'g'ri!");
    }
}

function logout() {
    isAdmin = false;
    saveState();
    updateHeaderUI();
    document.getElementById('adminModal').classList.add('hidden');
}

// Galereya / Fayldan rasm o'qish va hajmini ixchamlashtirish
function handleImageFileChange(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert("Iltimos, faqat rasm faylini tanlang!");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const maxWidth = 800;
            const scale = img.width > maxWidth ? maxWidth / img.width : 1;
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            uploadedImageDataUrl = canvas.toDataURL('image/jpeg', 0.82);
            document.getElementById('selectedFileName').textContent = file.name;
            document.getElementById('imagePreview').src = uploadedImageDataUrl;
            document.getElementById('imagePreviewWrap').classList.remove('hidden');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function clearSelectedImage() {
    uploadedImageDataUrl = "";
    document.getElementById('prodImageFile').value = "";
    document.getElementById('selectedFileName').textContent = "Rasm tanlanmagan";
    document.getElementById('imagePreview').src = "";
    document.getElementById('imagePreviewWrap').classList.add('hidden');
}

// Catalog Render
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const search = document.getElementById('searchInput').value.toLowerCase();
    const cat = document.getElementById('categoryFilter').value;

    const filtered = products.filter(p => {
        const matchName = p.name.toLowerCase().includes(search);
        const matchCat = cat === 'all' || p.category === cat;
        return matchName && matchCat;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<p style="color:#94a3b8;">Mos mahsulot topilmadi.</p>`;
        return;
    }

    grid.innerHTML = filtered.map(p => `
        <article class="product-card">
            <img class="product-img" src="${p.image || 'https://via.placeholder.com/500x300/0d1322/67e8f9?text=TechStore'}" alt="${p.name}">
            <div class="product-body">
                <div class="product-cat">${p.category}</div>
                <h3 class="product-title">${p.name}</h3>
                <div class="product-price">${p.price.toLocaleString()} so'm</div>
                <button class="btn btn-cyan btn-block" onclick="addToCart(${p.id})">
                    🛒 Savatga qo'shish
                </button>
            </div>
        </article>
    `).join('');
}

// Cart (no login required for customers)
function toggleCartModal() {
    document.getElementById('cartModal').classList.toggle('hidden');
}

function addToCart(id) {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.qty += 1;
    } else {
        const prod = products.find(p => p.id === id);
        if (!prod) return;
        cart.push({ ...prod, qty: 1 });
    }
    saveState();
    updateCartUI();
}

function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
        cart = cart.filter(i => i.id !== id);
    }
    saveState();
    updateCartUI();
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    saveState();
    updateCartUI();
}

function updateCartUI() {
    const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
    document.getElementById('cartCount').textContent = totalCount;

    const list = document.getElementById('cartItems');
    if (cart.length === 0) {
        list.innerHTML = `<p style="color:#94a3b8; padding:10px 0;">Savatingiz hozircha bo'sh.</p>`;
        document.getElementById('cartTotal').textContent = "0 so'm";
        return;
    }

    let totalSum = 0;
    list.innerHTML = cart.map(item => {
        totalSum += item.price * item.qty;
        return `
            <div class="cart-row">
                <div>
                    <strong>${item.name}</strong><br>
                    <small style="color:#94a3b8;">${item.price.toLocaleString()} so'm × ${item.qty}</small>
                </div>
                <div class="qty-controls">
                    <button class="btn btn-sm btn-ghost" onclick="changeQty(${item.id}, -1)">-</button>
                    <span>${item.qty}</span>
                    <button class="btn btn-sm btn-ghost" onclick="changeQty(${item.id}, 1)">+</button>
                    <button class="btn btn-sm btn-rose" onclick="removeFromCart(${item.id})">&times;</button>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('cartTotal').textContent = `${totalSum.toLocaleString()} so'm`;
}

function placeOrder() {
    if (cart.length === 0) {
        alert("Avval savatga mahsulot qo'shing!");
        return;
    }

    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('customerAddress').value.trim();

    if (!name || !phone || !address) {
        alert("Iltimos, ismingiz, telefon raqamingiz va manzilingizni to'liq kiriting!");
        return;
    }

    const total = cart.reduce((acc, i) => acc + i.price * i.qty, 0);
    const orderObj = {
        id: Date.now(),
        customer: name,
        phone,
        address,
        items: [...cart],
        total,
        status: 'Yangi',
        date: new Date().toLocaleString()
    };

    orders.unshift(orderObj);
    cart = [];
    saveState();
    updateCartUI();
    updateOrderBadge();

    sendOrderToTelegram(orderObj);

    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('customerAddress').value = '';
    toggleCartModal();

    document.getElementById('successModal').classList.remove('hidden');
}

function sendOrderToTelegram(order) {
    if (!TELEGRAM_BOT_TOKEN || !adminChatId) return;

    const itemsText = order.items
        .map((i, idx) => `${idx + 1}. ${i.name} — ${i.qty} dona (${(i.price * i.qty).toLocaleString()} so'm)`)
        .join('\n');

    const message =
        `🛒 *YANGI BUYURTMA (TechStore.uz)*\n\n` +
        `👤 *Mijoz:* ${escapeMd(order.customer)}\n` +
        `📞 *Telefon:* ${escapeMd(order.phone)}\n` +
        `📍 *Manzil:* ${escapeMd(order.address)}\n` +
        `🕒 *Sana:* ${escapeMd(order.date)}\n\n` +
        `📦 *Mahsulotlar:*\n${escapeMd(itemsText)}\n\n` +
        `💰 *Jami:* *${order.total.toLocaleString()} so'm*`;

    fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: adminChatId,
            text: message,
            parse_mode: 'Markdown'
        })
    }).catch(() => {});
}

function escapeMd(text) {
    return String(text).replace(/([_*`\[])/g, '\\$1');
}

function saveAdminChatId() {
    const input = document.getElementById('adminChatIdInput');
    if (!input) return;
    adminChatId = input.value.trim();
    saveState();
    alert(adminChatId ? "Admin Telegram Chat ID saqlandi!" : "Chat ID tozalandi.");
}

function closeSuccessModal() {
    document.getElementById('successModal').classList.add('hidden');
}

// Admin Panel
function toggleAdminModal() {
    if (!isAdmin) return;
    document.getElementById('adminModal').classList.toggle('hidden');
    const chatInput = document.getElementById('adminChatIdInput');
    if (chatInput) chatInput.value = adminChatId;
    const binInput = document.getElementById('jsonbinIdInput');
    if (binInput) binInput.value = cloudBinId;
    const keyInput = document.getElementById('jsonbinKeyInput');
    if (keyInput) keyInput.value = cloudMasterKey;
    renderAdminProducts();
    renderAdminOrders();
}

function saveCloudConfig() {
    const binInput = document.getElementById('jsonbinIdInput');
    const keyInput = document.getElementById('jsonbinKeyInput');
    cloudBinId = binInput ? binInput.value.trim() : '';
    cloudMasterKey = keyInput ? keyInput.value.trim() : '';
    saveState();
    alert(cloudBinId ? "Umumiy baza sozlamalari saqlandi!" : "Umumiy baza tozalandi.");
}

async function fetchCloudProducts() {
    if (!cloudBinId) return;
    try {
        const headers = {};
        if (cloudMasterKey) headers['X-Master-Key'] = cloudMasterKey;
        const res = await fetch(`${JSONBIN_API_URL}/${cloudBinId}/latest`, { headers });
        if (!res.ok) return;
        const data = await res.json();
        const remoteProducts = data?.record?.products;
        if (Array.isArray(remoteProducts)) {
            products = remoteProducts;
            localStorage.setItem('techstore_products', JSON.stringify(products));
            updateHeaderUI();
            renderProducts();
            if (isAdmin) renderAdminProducts();
        }
    } catch (_) {}
}

async function syncProductsToCloud() {
    if (!cloudBinId || !cloudMasterKey) return;
    try {
        await fetch(`${JSONBIN_API_URL}/${cloudBinId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': cloudMasterKey
            },
            body: JSON.stringify({ products })
        });
    } catch (_) {}
}

function switchAdminTab(tab) {
    document.getElementById('tabAddProd').classList.toggle('active', tab === 'products');
    document.getElementById('tabOrders').classList.toggle('active', tab === 'orders');
    document.getElementById('adminProductsSection').classList.toggle('hidden', tab !== 'products');
    document.getElementById('adminOrdersSection').classList.toggle('hidden', tab !== 'orders');
}

function addProduct(e) {
    e.preventDefault();
    if (!isAdmin) return;

    const name = document.getElementById('prodName').value.trim();
    const price = Number(document.getElementById('prodPrice').value);
    const category = document.getElementById('prodCategory').value;

    const fallbackSvg = "data:image/svg+xml;utf8," + encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='500' height='300'><rect width='100%' height='100%' fill='#0d1322'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#67e8f9' font-family='sans-serif' font-size='22'>${name}</text></svg>`
    );

    products.unshift({
        id: Date.now(),
        name,
        price,
        category,
        image: uploadedImageDataUrl || fallbackSvg
    });

    try {
        saveState();
    } catch (err) {
        alert("Rasm hajmi biroz katta ekan, kichikroq rasm tanlang!");
        products.shift();
        return;
    }

    syncProductsToCloud();
    updateHeaderUI();
    renderProducts();
    renderAdminProducts();
    document.getElementById('addProductForm').reset();
    clearSelectedImage();
    alert("Mahsulot do'konga joylandi!");
}

function deleteProduct(id) {
    if (!isAdmin) return;
    products = products.filter(p => p.id !== id);
    saveState();
    syncProductsToCloud();
    updateHeaderUI();
    renderProducts();
    renderAdminProducts();
}

function renderAdminProducts() {
    const list = document.getElementById('adminProductList');
    list.innerHTML = products.map(p => `
        <div class="admin-prod-row">
            <div>
                <strong>${p.name}</strong>
                <span style="color:#94a3b8; font-size:0.85rem;"> • ${p.category} • ${p.price.toLocaleString()} so'm</span>
            </div>
            <button class="btn btn-sm btn-rose" onclick="deleteProduct(${p.id})">O'chirish</button>
        </div>
    `).join('');
}

function updateOrderBadge() {
    const newCount = orders.filter(o => o.status === 'Yangi').length;
    document.getElementById('orderBadge').textContent = newCount;
}

function renderAdminOrders() {
    const wrap = document.getElementById('ordersList');
    if (orders.length === 0) {
        wrap.innerHTML = `<p style="color:#94a3b8;">Hozircha buyurtmalar kelib tushmagan.</p>`;
        return;
    }

    wrap.innerHTML = orders.map(o => `
        <div class="order-card">
            <div class="order-top">
                <strong>👤 ${o.customer} • 📞 ${o.phone}</strong>
                <span class="status-tag ${o.status === 'Yangi' ? 'status-new' : 'status-done'}">${o.status}</span>
            </div>
            <p style="color:#94a3b8; font-size:0.88rem;">📍 Manzil: ${o.address} • 🕒 ${o.date}</p>
            <ul class="order-items">
                ${o.items.map(i => `<li>${i.name} — ${i.qty} dona (${(i.price * i.qty).toLocaleString()} so'm)</li>`).join('')}
            </ul>
            <div class="order-bottom">
                <strong style="color:#34d399;">Jami: ${o.total.toLocaleString()} so'm</strong>
                ${o.status === 'Yangi'
                    ? `<button class="btn btn-sm btn-emerald" onclick="markOrderDone(${o.id})">Aloqaga chiqildi / Bajarildi</button>`
                    : ''}
            </div>
        </div>
    `).join('');
}

function markOrderDone(id) {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    order.status = 'Bajarildi';
    saveState();
    renderAdminOrders();
    updateOrderBadge();
}
