// Faqat admin login/paroli (ekranda ko'rinmaydi)
const ADMIN_LOGIN = 'adminjons';
const ADMIN_PASS = 'adminbekka';

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
let isAdmin = JSON.parse(localStorage.getItem('techstore_isAdmin')) || false;

function saveState() {
    localStorage.setItem('techstore_products', JSON.stringify(products));
    localStorage.setItem('techstore_orders', JSON.stringify(orders));
    localStorage.setItem('techstore_cart', JSON.stringify(cart));
    localStorage.setItem('techstore_isAdmin', JSON.stringify(isAdmin));
}

document.addEventListener('DOMContentLoaded', () => {
    updateHeaderUI();
    renderProducts();
    updateCartUI();
    document.getElementById('searchInput').addEventListener('input', renderProducts);
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
    orders.unshift({
        id: Date.now(),
        customer: name,
        phone,
        address,
        items: [...cart],
        total,
        status: 'Yangi',
        date: new Date().toLocaleString()
    });

    cart = [];
    saveState();
    updateCartUI();
    updateOrderBadge();

    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('customerAddress').value = '';
    toggleCartModal();

    document.getElementById('successModal').classList.remove('hidden');
}

function closeSuccessModal() {
    document.getElementById('successModal').classList.add('hidden');
}

// Admin Panel
function toggleAdminModal() {
    if (!isAdmin) return;
    document.getElementById('adminModal').classList.toggle('hidden');
    renderAdminProducts();
    renderAdminOrders();
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
    const image = document.getElementById('prodImage').value.trim();

    products.unshift({
        id: Date.now(),
        name,
        price,
        category,
        image: image || `https://via.placeholder.com/500x300/0d1322/67e8f9?text=${encodeURIComponent(name)}`
    });

    saveState();
    updateHeaderUI();
    renderProducts();
    renderAdminProducts();
    document.getElementById('addProductForm').reset();
    alert("Mahsulot do'konga joylandi!");
}

function deleteProduct(id) {
    if (!isAdmin) return;
    products = products.filter(p => p.id !== id);
    saveState();
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
