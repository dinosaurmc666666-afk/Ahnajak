// ============================================
// CONFIGURATION
// ============================================
const SHARE_BASE_URL = 'https://www.forestsmp.site';
const SHARE_STORAGE_KEY = 'share_clicked_devices';
const PAYMENT_API_URL = 'https://backend-11zq.onrender.com';

// ============================================
// DATA
// ============================================
let PRODUCTS = JSON.parse(localStorage.getItem('products')) || [
  { id: 1, title: "E-commerce Script", category: "script", price: 49, image: "", icon: "fa-shopping-cart", desc: "Script ពេញលេញសម្រាប់ហាងអនឡាញ", vendor: "DevMaster", downloads: 12 },
  { id: 2, title: "WordPress SEO Plugin", category: "plugin", price: 29, image: "", icon: "fa-plug", desc: "Plugin សម្រាប់បង្ើន SEO", vendor: "PluginPro", downloads: 8 },
  { id: 3, title: "Portfolio Template", category: "template", price: 19, image: "", icon: "fa-briefcase", desc: "Template ស្អាតសម្រាប់ Portfolio", vendor: "TemplateHub", downloads: 15 },
  { id: 4, title: "Admin Dashboard UI", category: "ui", price: 39, image: "", icon: "fa-chart-line", desc: "UI Kit សម្រាប់ Admin Dashboard", vendor: "UIDesign", downloads: 6 }
];

const COUPONS = {
  'SAVE20': { discount: 20, type: 'percent' },
  'FLAT10': { discount: 10, type: 'fixed' },
  'NEWUSER': { discount: 15, type: 'percent', minOrder: 30 }
};

const CURRENCY_RATES = { USD: 1, KHR: 4100, THB: 35, EUR: 0.92 };
const CURRENCY_SYMBOLS = { USD: '$', KHR: '៛', THB: '฿', EUR: '€' };

// ============================================
// STATE
// ============================================
let currentUser = JSON.parse(localStorage.getItem('current_user')) || null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentCurrency = localStorage.getItem('currency') || 'USD';
let currentTheme = localStorage.getItem('theme') || 'dark';
let appliedCoupon = null;

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Load currency
  const currencySelect = document.getElementById('currencySelect');
  if (currencySelect) currencySelect.value = currentCurrency;
  
  // Load theme
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon();
  
  // Check affiliate ref
  const urlParams = new URLSearchParams(window.location.search);
  const ref = urlParams.get('ref');
  if (ref) {
    trackAffiliateClick(ref);
  }
  
  // Initial render
  renderFeatured();
  renderAllProducts('all');
  updateCartCount();
  updateAuthUI();
  updateShareButtonState();
});

// Listen for storage changes (when admin adds products)
window.addEventListener('storage', (e) => {
  if (e.key === 'products') {
    PRODUCTS = JSON.parse(localStorage.getItem('products')) || PRODUCTS;
    renderFeatured();
    renderAllProducts('all');
  }
  if (e.key === 'users') {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (currentUser) {
      const updatedUser = users.find(u => u.email === currentUser.email);
      if (updatedUser) {
        currentUser = updatedUser;
        localStorage.setItem('current_user', JSON.stringify(currentUser));
        updateAuthUI();
      }
    }
  }
});

// Refresh products when page gains focus
window.addEventListener('focus', () => {
  PRODUCTS = JSON.parse(localStorage.getItem('products')) || PRODUCTS;
  renderFeatured();
  renderAllProducts('all');
});

// ============================================
// THEME
// ============================================
function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('theme', currentTheme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const icon = document.getElementById('themeIcon');
  if (icon) icon.className = currentTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
}

// ============================================
// CURRENCY
// ============================================
function changeCurrency() {
  currentCurrency = document.getElementById('currencySelect').value;
  localStorage.setItem('currency', currentCurrency);
  renderFeatured();
  renderAllProducts('all');
  renderCart();
  if (currentUser) renderDashboard();
}

function formatPrice(priceUSD) {
  const converted = priceUSD * CURRENCY_RATES[currentCurrency];
  const symbol = CURRENCY_SYMBOLS[currentCurrency];
  if (currentCurrency === 'KHR') return symbol + converted.toLocaleString();
  return symbol + converted.toFixed(2);
}

// ============================================
// SIDEBAR & PROFILE
// ============================================
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('active');
  document.getElementById('sidebarOverlay').classList.toggle('active');
}

function toggleProfileDropdown() {
  document.getElementById('profileDropdown').classList.toggle('active');
}

document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('profileDropdown');
  const profileIcon = document.querySelector('.profile-icon');
  if (dropdown && profileIcon && !dropdown.contains(e.target) && !profileIcon.contains(e.target)) {
    dropdown.classList.remove('active');
  }
});

// ============================================
// PAGE NAVIGATION
// ============================================
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  window.scrollTo(0, 0);
  
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const dropdown = document.getElementById('profileDropdown');
  if (sidebar) sidebar.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
  if (dropdown) dropdown.classList.remove('active');

  if (pageId === 'cart') renderCart();
  if (pageId === 'dashboard') renderDashboard();
  if (pageId === 'products') renderAllProducts('all');
  if (pageId === 'profile') renderProfile();
}

// ============================================
// AUTH
// ============================================
document.getElementById('registerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const phone = document.getElementById('regPhone').value.trim();
  const password = document.getElementById('regPassword').value;

  const users = JSON.parse(localStorage.getItem('users')) || [];
  if (users.find(u => u.email === email)) {
    showToast('Email នេះមានរួចហើយ!', 'error');
    return;
  }

  const newUser = { 
    id: Date.now(),
    name, 
    email, 
    phone,
    password, 
    purchases: [],
    affiliateCode: generateAffiliateCode(),
    affiliateClicks: 0,
    affiliateEarnings: 0,
    role: 'user',
    joined: new Date().toLocaleDateString()
  };
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('current_user', JSON.stringify(newUser));
  currentUser = newUser;

  updateAuthUI();
  updateShareButtonState();
  showToast('🎉 Register ជោគជ័យ! សូមស្វាគមន ' + name);
  showPage('dashboard');
  e.target.reset();
});

document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;

  const users = JSON.parse(localStorage.getItem('users')) || [];
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    showToast('Email ឬ Password មិនត្រឹមតរូវ!', 'error');
    return;
  }

  currentUser = user;
  localStorage.setItem('current_user', JSON.stringify(user));
  updateAuthUI();
  updateShareButtonState();
  showToast('✅ Login ជោគជ័យ! សូមស្វាគមន ' + user.name);
  showPage('dashboard');
  e.target.reset();
});

function logout() {
  currentUser = null;
  localStorage.removeItem('current_user');
  updateAuthUI();
  updateShareButtonState();
  showToast(' បាន Logout ដោយជោគជ័យ');
  showPage('home');
}

function updateAuthUI() {
  const sidebarAuth = document.getElementById('sidebarAuth');
  const profileName = document.getElementById('profileName');
  const profileEmail = document.getElementById('profileEmail');
  const profileAuth = document.getElementById('profileAuth');
  
  if (currentUser) {
    if (profileName) profileName.textContent = currentUser.name;
    if (profileEmail) profileEmail.textContent = currentUser.email;
    
    if (sidebarAuth) {
      sidebarAuth.innerHTML = `
        <a href="#" onclick="showPage('profile'); toggleSidebar();"><i class="fas fa-user"></i> My Profile</a>
        <a href="#" onclick="showPage('dashboard'); toggleSidebar();"><i class="fas fa-box"></i> My Purchases</a>
        <a href="#" onclick="logout(); toggleSidebar();"><i class="fas fa-sign-out-alt"></i> Logout</a>
      `;
    }
    if (profileAuth) {
      profileAuth.innerHTML = `
        <a href="#" onclick="showPage('profile'); toggleProfileDropdown();"><i class="fas fa-user"></i> My Profile</a>
        <a href="#" onclick="showPage('dashboard'); toggleProfileDropdown();"><i class="fas fa-box"></i> My Purchases</a>
        <a href="#" onclick="logout(); toggleProfileDropdown();"><i class="fas fa-sign-out-alt"></i> Logout</a>
      `;
    }
  } else {
    if (profileName) profileName.textContent = 'Guest';
    if (profileEmail) profileEmail.textContent = 'Please login';
    if (sidebarAuth) {
      sidebarAuth.innerHTML = `<a href="#" onclick="showPage('login'); toggleSidebar();"><i class="fas fa-sign-in-alt"></i> Login</a>`;
    }
    if (profileAuth) {
      profileAuth.innerHTML = `<a href="#" onclick="showPage('login'); toggleProfileDropdown();"><i class="fas fa-sign-in-alt"></i> Login / Register</a>`;
    }
  }
}

// ============================================
// PROFILE
// ============================================
function renderProfile() {
  if (!currentUser) { showPage('login'); return; }
  document.getElementById('profileNameInput').value = currentUser.name;
  document.getElementById('profileEmailInput').value = currentUser.email;
  document.getElementById('profilePhoneInput').value = currentUser.phone || '';
}

document.getElementById('profileForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('profileNameInput').value.trim();
  const email = document.getElementById('profileEmailInput').value.trim().toLowerCase();
  const phone = document.getElementById('profilePhoneInput').value.trim();
  
  const users = JSON.parse(localStorage.getItem('users')) || [];
  const userIndex = users.findIndex(u => u.email === currentUser.email);
  if (userIndex === -1) return;
  
  users[userIndex].name = name;
  users[userIndex].email = email;
  users[userIndex].phone = phone;
  
  localStorage.setItem('users', JSON.stringify(users));
  currentUser = users[userIndex];
  localStorage.setItem('current_user', JSON.stringify(currentUser));
  updateAuthUI();
  showToast('✅ Profile updated successfully!');
});

// ============================================
// PRODUCTS
// ============================================
function renderProducts(containerId, products) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  if (!products.length) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);grid-column:1/-1;">No products found</p>';
    return;
  }
  container.innerHTML = products.map(p => {
    let imageHtml = '';
    if (p.image) {
      imageHtml = `<img src="${p.image}" alt="${p.title}" style="width:100%;height:100%;object-fit:cover;">`;
    } else {
      imageHtml = `<i class="fas ${p.icon || 'fa-code'}"></i>`;
    }
    
    return `
      <div class="product-card">
        <div class="product-image">${imageHtml}</div>
        <div class="product-info">
          <span class="product-category">${p.category}</span>
          <span class="product-vendor"><i class="fas fa-store"></i> ${p.vendor}</span>
          <h3 class="product-title">${p.title}</h3>
          <p class="product-desc">${p.desc}</p>
          <div class="product-footer">
            <span class="product-price">${formatPrice(p.price)}</span>
            <button class="btn-small" onclick="addToCart(${p.id})">
              <i class="fas fa-cart-plus"></i> Add
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderFeatured() {
  renderProducts('featuredProducts', PRODUCTS.slice(0, 4));
}

function renderAllProducts(category) {
  const filtered = category === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === category);
  renderProducts('allProducts', filtered);
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderAllProducts(btn.dataset.cat);
  });
});

function searchProducts() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const filtered = PRODUCTS.filter(p => 
    p.title.toLowerCase().includes(query) || 
    (p.desc && p.desc.toLowerCase().includes(query)) ||
    (p.vendor && p.vendor.toLowerCase().includes(query))
  );
  renderProducts('allProducts', filtered);
}

// ============================================
// CART
// ============================================
function addToCart(productId) {
  if (!currentUser) {
    showToast('️ សូម Login ជាមុនសិន!', 'error');
    showPage('login');
    return;
  }
  if (cart.find(i => i.id === productId)) {
    showToast('មានក្នុង Cart រួចហើយ!', 'error');
    return;
  }
  const product = PRODUCTS.find(p => p.id === productId);
  cart.push(product);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  showToast(`✅ បានបន្ថែម "${product.title}" ទៅ Cart`);
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

function updateCartCount() {
  const el = document.getElementById('cartCount');
  if (el) el.textContent = cart.length;
}

function renderCart() {
  const container = document.getElementById('cartItems');
  const summary = document.getElementById('cartSummary');
  if (!container || !summary) return;

  if (!cart.length) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:40px;">🛒 Cart របស់អ្នកទទេ</p>';
    summary.style.display = 'none';
    return;
  }

  container.innerHTML = cart.map(item => {
    let imageHtml = '';
    if (item.image) {
      imageHtml = `<img src="${item.image}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;margin-right:10px;">`;
    } else {
      imageHtml = `<i class="fas ${item.icon || 'fa-code'}" style="font-size:2rem;margin-right:10px;color:var(--primary);"></i>`;
    }
    
    return `
      <div class="cart-item">
        <div class="cart-item-info" style="display:flex;align-items:center;">
          ${imageHtml}
          <div>
            <h4>${item.title}</h4>
            <p>${item.desc}</p>
          </div>
        </div>
        <span class="cart-item-price">${formatPrice(item.price)}</span>
        <button class="btn-danger" onclick="removeFromCart(${item.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
  }).join('');

  const subtotal = cart.reduce((sum, i) => sum + i.price, 0);
  let discount = 0;
  if (appliedCoupon) {
    discount = appliedCoupon.type === 'percent' 
      ? subtotal * (appliedCoupon.discount / 100) 
      : appliedCoupon.discount;
  }
  const total = subtotal - discount;
  
  document.getElementById('cartSubtotal').textContent = formatPrice(subtotal);
  document.getElementById('cartTotal').textContent = formatPrice(total);
  
  if (discount > 0) {
    document.getElementById('discountRow').style.display = 'flex';
    document.getElementById('cartDiscount').textContent = '-' + formatPrice(discount);
  } else {
    document.getElementById('discountRow').style.display = 'none';
  }
  summary.style.display = 'block';
}

function applyCoupon() {
  const code = document.getElementById('couponInput').value.trim().toUpperCase();
  const coupon = COUPONS[code];
  if (!coupon) { showToast('❌ កូដមិនត្រឹមតរូវ!', 'error'); return; }
  const subtotal = cart.reduce((sum, i) => sum + i.price, 0);
  if (coupon.minOrder && subtotal < coupon.minOrder) {
    showToast(`⚠️ តម្រូវឱ្យទិញយ៉ាងតិច ${formatPrice(coupon.minOrder)}`, 'error');
    return;
  }
  appliedCoupon = coupon;
  renderCart();
  showToast('✅ បានប្រើកូដបញ្ចុះតមលៃ!');
}

// ============================================
// CHECKOUT
// ============================================
function checkout() {
  if (!currentUser) {
    showToast('⚠️ សូម Login ជាមុនសិន!', 'error');
    showPage('login');
    return;
  }
  if (!cart.length) {
    showToast('⚠️ Cart របស់អ្នកទទេ!', 'error');
    return;
  }
  
  const subtotal = cart.reduce((sum, i) => sum + i.price, 0);
  let discount = 0;
  if (appliedCoupon) {
    discount = appliedCoupon.type === 'percent' 
      ? subtotal * (appliedCoupon.discount / 100) 
      : appliedCoupon.discount;
  }
  const total = subtotal - discount;
  
  createOrderWithBakong(total);
}

async function createOrderWithBakong(totalAmount) {
  try {
    showToast('⏳ កំពុងបង្កើត Order...');
    
    const firstProduct = cart[0];
    
    const response = await fetch(`${PAYMENT_API_URL}/api/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        player_name: currentUser.name,
        user_email: currentUser.email,
        item_type: 'product',
        item_id: firstProduct.id
      })
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      showPaymentModal(data);
      startPaymentMonitoring(data.transaction_id, data.order_id);
    } else {
      showToast('❌ ' + (data.message || 'Failed to create order'), 'error');
    }
    
  } catch (error) {
    console.error('Payment error:', error);
    showToast('❌ Connection error. Please try again.', 'error');
  }
}

function showPaymentModal(paymentData) {
  document.getElementById('paymentModal').classList.add('active');
  document.getElementById('paymentOrderId').textContent = paymentData.order_id;
  document.getElementById('paymentAmountUSD').textContent = '$' + paymentData.price_usd.toFixed(2);
  document.getElementById('paymentAmountKHR').textContent = '៛' + paymentData.price_khr.toLocaleString();
  
  generateQRCode(paymentData.khqr_string);
  startPaymentTimer(600);
}

function closePaymentModal() {
  document.getElementById('paymentModal').classList.remove('active');
  if (paymentCheckInterval) clearInterval(paymentCheckInterval);
  if (timerInterval) clearInterval(timerInterval);
}

function generateQRCode(qrString) {
  const canvas = document.getElementById('qrCanvas');
  if (typeof QRCode !== 'undefined' && canvas) {
    QRCode.toCanvas(canvas, qrString, {
      width: 200,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });
  }
}

let paymentCheckInterval = null;

function startPaymentMonitoring(transactionId, orderId) {
  let checkCount = 0;
  const maxChecks = 120;
  
  paymentCheckInterval = setInterval(async () => {
    checkCount++;
    
    try {
      const response = await fetch(`${PAYMENT_API_URL}/api/check-status/${transactionId}`);
      const data = await response.json();
      
      if (data.status === 'success' && data.order_status === 'paid') {
        clearInterval(paymentCheckInterval);
        clearInterval(timerInterval);
        
        document.getElementById('paymentStatus').innerHTML = `
          <div class="status-success">
            <i class="fas fa-check-circle"></i>
            <p>Payment Verified!</p>
          </div>
        `;
        
        savePurchasesToUser();
        
        setTimeout(() => {
          closePaymentModal();
          showSuccessModal(orderId);
        }, 2000);
        
      } else if (checkCount >= maxChecks) {
        clearInterval(paymentCheckInterval);
        clearInterval(timerInterval);
        
        document.getElementById('paymentStatus').innerHTML = `
          <div class="status-pending" style="color: var(--danger);">
            <i class="fas fa-times-circle"></i>
            <p>Payment expired</p>
          </div>
        `;
        
        setTimeout(() => {
          closePaymentModal();
          showToast('⏰ Payment expired. Please try again.', 'error');
        }, 3000);
      }
      
    } catch (error) {
      console.error('Check status error:', error);
    }
    
  }, 5000);
}

let timerInterval = null;

function startPaymentTimer(seconds) {
  let remaining = seconds;
  
  timerInterval = setInterval(() => {
    remaining--;
    
    const minutes = Math.floor(remaining / 60);
    const secs = remaining % 60;
    
    document.getElementById('paymentTimer').textContent = 
      `${minutes}:${secs.toString().padStart(2, '0')}`;
    
    if (remaining <= 0) clearInterval(timerInterval);
  }, 1000);
}

function savePurchasesToUser() {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  const userIndex = users.findIndex(u => u.email === currentUser.email);
  
  if (userIndex !== -1) {
    if (!users[userIndex].purchases) users[userIndex].purchases = [];
    users[userIndex].purchases.push(...cart);
    localStorage.setItem('users', JSON.stringify(users));
    currentUser = users[userIndex];
    localStorage.setItem('current_user', JSON.stringify(currentUser));
  }
  
  cart = [];
  appliedCoupon = null;
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function showSuccessModal(orderId) {
  document.getElementById('successModal').classList.add('active');
  const purchasesCount = (currentUser.purchases || []).length;
  document.getElementById('successDetails').innerHTML = `
    <div class="info-row"><span>Order ID:</span><strong>${orderId}</strong></div>
    <div class="info-row"><span>Items:</span><strong>${purchasesCount} products</strong></div>
  `;
}

function closeSuccessModal() {
  document.getElementById('successModal').classList.remove('active');
  showPage('dashboard');
}

// ============================================
// DASHBOARD
// ============================================
function renderDashboard() {
  if (!currentUser) { showPage('login'); return; }
  document.getElementById('userName').textContent = currentUser.name;
  
  const purchases = currentUser.purchases || [];
  if (!purchases.length) {
    document.getElementById('myPurchases').innerHTML = 
      '<p style="text-align:center;color:var(--text-muted);grid-column:1/-1;">📦 អ្នកមិនទាន់បានទិញផលិតផលណាមួយទេ</p>';
    return;
  }
  const container = document.getElementById('myPurchases');
  container.innerHTML = purchases.map(p => {
    let imageHtml = '';
    if (p.image) {
      imageHtml = `<img src="${p.image}" style="width:100%;height:100%;object-fit:cover;">`;
    } else {
      imageHtml = `<i class="fas ${p.icon || 'fa-code'}"></i>`;
    }
    
    return `
      <div class="product-card">
        <div class="product-image">${imageHtml}</div>
        <div class="product-info">
          <span class="product-category">${p.category}</span>
          <h3 class="product-title">${p.title}</h3>
          <p class="product-desc">${p.desc}</p>
          <button class="btn-primary btn-full" onclick="downloadProduct('${p.title}')">
            <i class="fas fa-download"></i> Download
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function downloadProduct(title) {
  showToast(`⬇️ កំពុងទាញយក: ${title}`);
}

// ============================================
// AFFILIATE & SHARE
// ============================================
function generateAffiliateCode() {
  return 'REF' + Math.random().toString(36).substr(2, 8).toUpperCase();
}

function trackAffiliateClick(refCode) {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  const user = users.find(u => u.affiliateCode === refCode);
  if (user) {
    user.affiliateClicks = (user.affiliateClicks || 0) + 1;
    localStorage.setItem('users', JSON.stringify(users));
  }
}

function shareLink() {
  if (!currentUser) {
    showToast('⚠️ សូម Login ជាមុនសិន!', 'error');
    showPage('login');
    return;
  }
  
  toggleProfileDropdown();
  
  const deviceFingerprint = getDeviceFingerprint();
  const sharedDevices = JSON.parse(localStorage.getItem(SHARE_STORAGE_KEY) || '[]');
  
  if (sharedDevices.includes(deviceFingerprint)) {
    showToast('️ អ្នកបាន Share រួចហើយ! ( Device = ១ ដង)', 'error');
    return;
  }
  
  const affiliateCode = currentUser.affiliateCode || generateAffiliateCode();
  const shareUrl = `${SHARE_BASE_URL}/?ref=${affiliateCode}`;
  
  copyToClipboard(shareUrl).then(() => {
    sharedDevices.push(deviceFingerprint);
    localStorage.setItem(SHARE_STORAGE_KEY, JSON.stringify(sharedDevices));
    
    updateShareButtonState();
    showShareSuccessModal(shareUrl);
    showToast('✅ បាន Copy Link សម្រាប់ Share!');
  }).catch(err => {
    console.error('Copy failed:', err);
    showToast('❌ មិនអាច Copy បានទេ', 'error');
  });
}

function getDeviceFingerprint() {
  let fingerprint = localStorage.getItem('device_fingerprint');
  
  if (!fingerprint) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('AhnajakCode', 2, 2);
    
    const data = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
      navigator.hardwareConcurrency || 'unknown',
      navigator.platform || 'unknown'
    ].join('|');
    
    fingerprint = 'FP_' + simpleHash(data);
    localStorage.setItem('device_fingerprint', fingerprint);
  }
  
  return fingerprint;
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).toUpperCase();
}

async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  
  try {
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  } catch (err) {
    document.body.removeChild(textarea);
    throw err;
  }
}

function showShareSuccessModal(url) {
  let modal = document.getElementById('shareSuccessModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'shareSuccessModal';
    modal.className = 'share-success-modal';
    modal.innerHTML = `
      <div class="share-success-content">
        <div class="share-success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h2 style="color: var(--success); margin-bottom: 15px;">🎉 Share Successful!</h2>
        <p style="color: var(--text-muted); margin-bottom: 15px;">
          Link របស់អ្នកត្រូវបាន Copy រួចរាល់!<br>
          ចែករំលែកទៅកាន់មិត្តភក្តិ ហើយទទួលបាន <strong style="color: var(--success);">10% Commission</strong>
        </p>
        <div class="share-link-box" id="shareLinkDisplay"></div>
        <button class="btn-primary btn-full" onclick="closeShareSuccessModal()" style="margin-top: 15px;">
          <i class="fas fa-thumbs-up"></i> Awesome!
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  document.getElementById('shareLinkDisplay').textContent = url;
  modal.classList.add('active');
}

function closeShareSuccessModal() {
  const modal = document.getElementById('shareSuccessModal');
  if (modal) modal.classList.remove('active');
}

function updateShareButtonState() {
  const deviceFingerprint = getDeviceFingerprint();
  const sharedDevices = JSON.parse(localStorage.getItem(SHARE_STORAGE_KEY) || '[]');
  const hasShared = sharedDevices.includes(deviceFingerprint);
  
  const shareItem = document.getElementById('shareMenuItem');
  const shareBadge = document.getElementById('shareBadge');
  
  if (!shareItem) return;
  
  if (hasShared) {
    shareItem.querySelector('a').classList.add('disabled');
    shareItem.querySelector('a').setAttribute('onclick', 'event.preventDefault(); showToast("⚠️ អ្នកបាន Share រួចហើយ!", "error");');
    if (shareBadge) {
      shareBadge.textContent = '✓ Done';
      shareBadge.style.background = 'var(--text-muted)';
    }
  } else {
    shareItem.querySelector('a').classList.remove('disabled');
    shareItem.querySelector('a').setAttribute('onclick', 'shareLink()');
    if (shareBadge) {
      shareBadge.textContent = '+10%';
      shareBadge.style.background = 'var(--success)';
    }
  }
}

// ============================================
// TOAST
// ============================================
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'toast show' + (type === 'error' ? ' error' : '');
  setTimeout(() => toast.classList.remove('show'), 3000);
  }
