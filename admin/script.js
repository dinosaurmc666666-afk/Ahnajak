// ============================================
// ZOOM PREVENTION
// ============================================
(function() {
  document.addEventListener('touchstart', function(e) {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });
  
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function(e) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
  
  document.addEventListener('wheel', function(e) {
    if (e.ctrlKey || e.metaKey) e.preventDefault();
  }, { passive: false });
  
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=')) {
      e.preventDefault();
    }
  });
  
  document.addEventListener('gesturestart', function(e) { e.preventDefault(); });
  document.addEventListener('gesturechange', function(e) { e.preventDefault(); });
  document.addEventListener('gestureend', function(e) { e.preventDefault(); });
})();

// ============================================
// DATA
// ============================================
let PRODUCTS = JSON.parse(localStorage.getItem('products')) || [];
let ORDERS = JSON.parse(localStorage.getItem('admin_orders')) || [];
let USERS = JSON.parse(localStorage.getItem('users')) || [];

let currentOrderFilter = 'all';
let newOrdersCount = 0;
let lastOrderCheck = Date.now();

// ============================================
// INIT - ដំណើរការពេល page load
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('Admin Panel Initialized');
  
  loadData();
  renderHome();
  renderProductsTable();
  renderOrdersTable();
  renderUsersTable();
  
  // តាមដាន localStorage changes
  window.addEventListener('storage', handleStorageChange);
  
  // ពិនិត្យ orders ថ្មីរៀងរាល់ 3 វិនាទី
  setInterval(checkNewOrders, 3000);
  
  // ដាក់ event listeners ឱ្យ buttons
  setupEventListeners();
});

function setupEventListeners() {
  // Modal close buttons
  const closeBtns = document.querySelectorAll('.close-btn');
  closeBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const modal = this.closest('.modal');
      if (modal) modal.classList.remove('active');
    });
  });
  
  // Close modal when clicking outside
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('active');
      }
    });
  });
  
  // Form submit
  const productForm = document.getElementById('productForm');
  if (productForm) {
    productForm.addEventListener('submit', function(e) {
      e.preventDefault();
      saveProduct(e);
    });
  }
  
  console.log('Event listeners setup complete');
}

function loadData() {
  PRODUCTS = JSON.parse(localStorage.getItem('products')) || [];
  ORDERS = JSON.parse(localStorage.getItem('admin_orders')) || [];
  USERS = JSON.parse(localStorage.getItem('users')) || [];
  console.log('Data loaded:', { products: PRODUCTS.length, orders: ORDERS.length, users: USERS.length });
}

// ============================================
// REAL-TIME ORDER MONITORING
// ============================================
function handleStorageChange(e) {
  if (e.key === 'admin_orders') {
    const newOrders = JSON.parse(e.newValue) || [];
    const oldOrders = JSON.parse(e.oldValue) || [];
    
    if (newOrders.length > oldOrders.length) {
      const newOrder = newOrders[newOrders.length - 1];
      showOrderNotification(newOrder);
      playNotificationSound();
    }
    
    loadData();
    renderHome();
    renderOrdersTable();
  }
  
  if (e.key === 'products') {
    PRODUCTS = JSON.parse(e.newValue) || [];
    renderProductsTable();
    renderHome();
  }
  
  if (e.key === 'users') {
    USERS = JSON.parse(e.newValue) || [];
    renderUsersTable();
    renderHome();
  }
}

function checkNewOrders() {
  const currentOrders = JSON.parse(localStorage.getItem('admin_orders')) || [];
  const currentTime = Date.now();
  
  const recentOrders = currentOrders.filter(o => {
    const orderTime = new Date(o.date).getTime();
    return orderTime > lastOrderCheck && orderTime > (currentTime - 10000);
  });
  
  if (recentOrders.length > 0) {
    recentOrders.forEach(order => {
      showOrderNotification(order);
    });
    playNotificationSound();
  }
  
  lastOrderCheck = currentTime;
}

function showOrderNotification(order) {
  newOrdersCount++;
  
  const notifDot = document.getElementById('orderNotification');
  const notifBadge = document.getElementById('notifBadge');
  const notifCount = document.getElementById('notifCount');
  
  if (notifDot) notifDot.style.display = 'block';
  if (notifBadge) {
    notifBadge.style.display = 'flex';
    notifCount.textContent = newOrdersCount;
  }
  
  const popup = document.getElementById('orderNotificationPopup');
  const orderText = document.getElementById('newOrderText');
  
  if (popup && orderText) {
    orderText.textContent = `Order #${order.id} from ${order.customer} - $${order.amount}`;
    popup.classList.add('show');
    
    setTimeout(() => {
      popup.classList.remove('show');
    }, 5000);
  }
}

function closeOrderNotification() {
  const popup = document.getElementById('orderNotificationPopup');
  if (popup) popup.classList.remove('show');
  
  newOrdersCount = 0;
  
  const notifDot = document.getElementById('orderNotification');
  const notifBadge = document.getElementById('notifBadge');
  
  if (notifDot) notifDot.style.display = 'none';
  if (notifBadge) notifBadge.style.display = 'none';
}

function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.log('Sound blocked');
  }
}

// ============================================
// NAVIGATION
// ============================================
function showSection(sectionId, element) {
  console.log('Showing section:', sectionId);
  
  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  if (element) element.classList.add('active');
  
  // Show section
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('active');
  }
  
  // Update title
  const titles = {
    home: { title: 'Home', subtitle: 'Dashboard Overview' },
    products: { title: 'Products', subtitle: 'Manage Your Products' },
    orders: { title: 'Orders', subtitle: 'Track Customer Orders' },
    users: { title: 'Users', subtitle: 'Manage Registered Users' }
  };
  
  const pageTitle = document.getElementById('pageTitle');
  const pageSubtitle = document.getElementById('pageSubtitle');
  
  if (pageTitle && titles[sectionId]) {
    pageTitle.textContent = titles[sectionId].title;
  }
  if (pageSubtitle && titles[sectionId]) {
    pageSubtitle.textContent = titles[sectionId].subtitle;
  }
  
  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('active');
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.toggle('active');
    console.log('Sidebar toggled');
  }
}

function refreshData() {
  loadData();
  renderHome();
  renderProductsTable();
  renderOrdersTable();
  renderUsersTable();
  showToast('✅ Data refreshed successfully!');
}

// ============================================
// HOME / DASHBOARD
// ============================================
function renderHome() {
  // Stats
  const statProducts = document.getElementById('statProducts');
  const statOrders = document.getElementById('statOrders');
  const statUsers = document.getElementById('statUsers');
  const statRevenue = document.getElementById('statRevenue');
  
  if (statProducts) statProducts.textContent = PRODUCTS.length;
  if (statOrders) statOrders.textContent = ORDERS.length;
  if (statUsers) statUsers.textContent = USERS.length;
  
  const totalRevenue = ORDERS
    .filter(o => o.status === 'paid')
    .reduce((sum, o) => sum + (o.amount || 0), 0);
  
  if (statRevenue) statRevenue.textContent = '$' + totalRevenue.toFixed(2);
  
  // Quick stats
  const paidOrders = document.getElementById('paidOrders');
  const pendingOrders = document.getElementById('pendingOrders');
  const unpaidOrders = document.getElementById('unpaidOrders');
  const totalDownloads = document.getElementById('totalDownloads');
  
  if (paidOrders) paidOrders.textContent = ORDERS.filter(o => o.status === 'paid').length;
  if (pendingOrders) pendingOrders.textContent = ORDERS.filter(o => o.status === 'pending').length;
  if (unpaidOrders) unpaidOrders.textContent = ORDERS.filter(o => o.status === 'unpaid').length;
  if (totalDownloads) totalDownloads.textContent = PRODUCTS.reduce((sum, p) => sum + (p.downloads || 0), 0);
  
  // Recent products
  const recentContainer = document.getElementById('recentProducts');
  if (recentContainer) {
    const recent = PRODUCTS.slice(0, 5);
    
    if (recent.length === 0) {
      recentContainer.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>No products yet</p></div>';
    } else {
      recentContainer.innerHTML = recent.map(p => {
        if (p.image) {
          return `
            <div class="mini-product-item">
              <img src="${p.image}" alt="${p.title}" class="mini-product-image">
              <div class="mini-product-info">
                <h4>${p.title}</h4>
                <p>${p.vendor || 'Unknown'}</p>
              </div>
              <div class="mini-product-price">$${p.price}</div>
            </div>
          `;
        } else {
          return `
            <div class="mini-product-item">
              <div class="mini-product-icon">
                <i class="fas fa-box"></i>
              </div>
              <div class="mini-product-info">
                <h4>${p.title}</h4>
                <p>${p.vendor || 'Unknown'}</p>
              </div>
              <div class="mini-product-price">$${p.price}</div>
            </div>
          `;
        }
      }).join('');
    }
  }
}

// ============================================
// PRODUCTS
// ============================================
function renderProductsTable(products = null) {
  const allProducts = products || PRODUCTS;
  const tbody = document.getElementById('productsTableBody');
  
  if (!tbody) {
    console.error('productsTableBody not found');
    return;
  }
  
  if (allProducts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><i class="fas fa-box-open"></i><p>No products found</p></div></td></tr>';
    return;
  }
  
  tbody.innerHTML = allProducts.map(p => {
    let imageCell = '';
    if (p.image) {
      imageCell = `<img src="${p.image}" alt="${p.title}" class="product-image-cell">`;
    } else {
      imageCell = `<span class="product-icon-cell"><i class="fas fa-box"></i></span>`;
    }
    
    return `
      <tr>
        <td>${imageCell}</td>
        <td><strong>${p.title}</strong><br><small style="color:var(--text-muted)">${p.desc ? p.desc.substring(0, 40) + '...' : ''}</small></td>
        <td><span class="category-badge ${p.category}">${p.category}</span></td>
        <td><strong style="color:var(--success)">$${p.price}</strong></td>
        <td>${p.vendor || '-'}</td>
        <td>${p.downloads || 0}</td>
        <td>
          <div class="action-btns">
            <button class="btn-action edit" onclick="editProduct(${p.id})" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-action delete" onclick="deleteProduct(${p.id})" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function searchProducts() {
  const searchInput = document.getElementById('productSearch');
  const categoryFilter = document.getElementById('categoryFilter');
  
  if (!searchInput) return;
  
  const query = searchInput.value.toLowerCase();
  const category = categoryFilter ? categoryFilter.value : 'all';
  
  let filtered = PRODUCTS.filter(p => 
    p.title.toLowerCase().includes(query) ||
    (p.vendor && p.vendor.toLowerCase().includes(query)) ||
    (p.desc && p.desc.toLowerCase().includes(query))
  );
  
  if (category !== 'all') {
    filtered = filtered.filter(p => p.category === category);
  }
  
  renderProductsTable(filtered);
}

function filterProducts() {
  searchProducts();
}

function previewImage(input) {
  const preview = document.getElementById('imagePreview');
  const imageData = document.getElementById('pImageData');
  
  if (!preview || !input.files || !input.files[0]) return;
  
  const reader = new FileReader();
  
  reader.onload = function(e) {
    if (imageData) imageData.value = e.target.result;
    preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
    preview.classList.remove('empty');
  };
  
  reader.readAsDataURL(input.files[0]);
}

function openProductModal() {
  console.log('Opening product modal');
  
  const modalTitle = document.getElementById('modalTitle');
  const productForm = document.getElementById('productForm');
  const productId = document.getElementById('productId');
  const pImageData = document.getElementById('pImageData');
  const imagePreview = document.getElementById('imagePreview');
  const productModal = document.getElementById('productModal');
  
  if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Add New Product';
  if (productForm) productForm.reset();
  if (productId) productId.value = '';
  if (pImageData) pImageData.value = '';
  if (imagePreview) {
    imagePreview.innerHTML = '';
    imagePreview.classList.add('empty');
  }
  if (productModal) {
    productModal.classList.add('active');
    console.log('Modal opened');
  }
}

function closeProductModal() {
  const productModal = document.getElementById('productModal');
  if (productModal) {
    productModal.classList.remove('active');
    console.log('Modal closed');
  }
}

function editProduct(id) {
  console.log('Editing product:', id);
  
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) {
    console.error('Product not found:', id);
    return;
  }
  
  const modalTitle = document.getElementById('modalTitle');
  const productId = document.getElementById('productId');
  const pTitle = document.getElementById('pTitle');
  const pCategory = document.getElementById('pCategory');
  const pPrice = document.getElementById('pPrice');
  const pVendor = document.getElementById('pVendor');
  const pDesc = document.getElementById('pDesc');
  const pImageData = document.getElementById('pImageData');
  const imagePreview = document.getElementById('imagePreview');
  const productModal = document.getElementById('productModal');
  
  if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Product';
  if (productId) productId.value = product.id;
  if (pTitle) pTitle.value = product.title;
  if (pCategory) pCategory.value = product.category;
  if (pPrice) pPrice.value = product.price;
  if (pVendor) pVendor.value = product.vendor || '';
  if (pDesc) pDesc.value = product.desc || '';
  if (pImageData) pImageData.value = product.image || '';
  
  if (imagePreview) {
    if (product.image) {
      imagePreview.innerHTML = `<img src="${product.image}" alt="${product.title}">`;
      imagePreview.classList.remove('empty');
    } else {
      imagePreview.innerHTML = '';
      imagePreview.classList.add('empty');
    }
  }
  
  if (productModal) {
    productModal.classList.add('active');
    console.log('Edit modal opened');
  }
}

function saveProduct(e) {
  if (e) e.preventDefault();
  
  console.log('Saving product...');
  
  const productId = document.getElementById('productId');
  const pTitle = document.getElementById('pTitle');
  const pCategory = document.getElementById('pCategory');
  const pPrice = document.getElementById('pPrice');
  const pVendor = document.getElementById('pVendor');
  const pDesc = document.getElementById('pDesc');
  const pImageData = document.getElementById('pImageData');
  
  if (!pTitle || !pCategory || !pPrice) {
    showToast('❌ Please fill all required fields', 'error');
    return;
  }
  
  const id = productId ? productId.value : '';
  const productData = {
    title: pTitle.value.trim(),
    category: pCategory.value,
    price: parseFloat(pPrice.value),
    vendor: pVendor ? pVendor.value.trim() : '',
    desc: pDesc ? pDesc.value.trim() : '',
    image: pImageData ? pImageData.value : ''
  };
  
  if (id) {
    // Update
    const index = PRODUCTS.findIndex(p => p.id === parseInt(id));
    if (index !== -1) {
      PRODUCTS[index] = { ...PRODUCTS[index], ...productData };
      showToast('✅ Product updated successfully!');
    }
  } else {
    // Create
    const newProduct = {
      id: Date.now(),
      ...productData,
      downloads: 0
    };
    PRODUCTS.push(newProduct);
    showToast('✅ Product added successfully!');
  }
  
  localStorage.setItem('products', JSON.stringify(PRODUCTS));
  closeProductModal();
  renderProductsTable();
  renderHome();
}

function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  
  PRODUCTS = PRODUCTS.filter(p => p.id !== id);
  localStorage.setItem('products', JSON.stringify(PRODUCTS));
  renderProductsTable();
  renderHome();
  showToast('🗑️ Product deleted!');
}

// ============================================
// ORDERS
// ============================================
function renderOrdersTable(filter = currentOrderFilter) {
  let filtered = ORDERS;
  
  if (filter !== 'all') {
    filtered = ORDERS.filter(o => o.status === filter);
  }
  
  // Update order stats
  const allOrdersCount = document.getElementById('allOrdersCount');
  const paidCount = document.getElementById('paidCount');
  const pendingCount = document.getElementById('pendingCount');
  const unpaidCount = document.getElementById('unpaidCount');
  
  if (allOrdersCount) allOrdersCount.textContent = ORDERS.length;
  if (paidCount) paidCount.textContent = ORDERS.filter(o => o.status === 'paid').length;
  if (pendingCount) pendingCount.textContent = ORDERS.filter(o => o.status === 'pending').length;
  if (unpaidCount) unpaidCount.textContent = ORDERS.filter(o => o.status === 'unpaid').length;
  
  const tbody = document.getElementById('ordersTableBody');
  
  if (!tbody) {
    console.error('ordersTableBody not found');
    return;
  }
  
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><i class="fas fa-shopping-cart"></i><p>No orders found</p></div></td></tr>';
    return;
  }
  
  tbody.innerHTML = filtered.map(o => `
    <tr>
      <td><strong>${o.id}</strong></td>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="user-avatar-placeholder">${(o.customer || 'U').charAt(0).toUpperCase()}</div>
          <div>
            <strong>${o.customer || 'Unknown'}</strong><br>
            <small style="color:var(--text-muted)">${o.email || '-'}</small>
          </div>
        </div>
      </td>
      <td>${o.product || '-'}</td>
      <td><strong style="color:var(--success)">$${(o.amount || 0).toFixed(2)}</strong></td>
      <td>${o.date || '-'}</td>
      <td>
        <span class="status-badge ${o.status}">
          <i class="fas ${o.status === 'paid' ? 'fa-check-circle' : o.status === 'pending' ? 'fa-clock' : 'fa-times-circle'}"></i>
          ${o.status}
        </span>
      </td>
      <td>
        <div class="action-btns">
          <button class="btn-action view" onclick="viewOrder('${o.id}')" title="View">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-action delete" onclick="deleteOrder('${o.id}')" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterOrders(status, element) {
  console.log('Filtering orders:', status);
  currentOrderFilter = status;
  
  // Update active card
  document.querySelectorAll('.order-stat-card').forEach(card => {
    card.classList.remove('active');
  });
  if (element) {
    element.classList.add('active');
  }
  
  renderOrdersTable(status);
}

function viewOrder(orderId) {
  console.log('Viewing order:', orderId);
  
  const order = ORDERS.find(o => o.id === orderId);
  if (!order) {
    console.error('Order not found:', orderId);
    return;
  }
  
  const orderDetails = document.getElementById('orderDetails');
  const orderModal = document.getElementById('orderModal');
  
  if (orderDetails) {
    orderDetails.innerHTML = `
      <div class="order-detail-row">
        <span class="label">Order ID</span>
        <span class="value">${order.id}</span>
      </div>
      <div class="order-detail-row">
        <span class="label">Customer</span>
        <span class="value">${order.customer || 'Unknown'}</span>
      </div>
      <div class="order-detail-row">
        <span class="label">Email</span>
        <span class="value">${order.email || '-'}</span>
      </div>
      <div class="order-detail-row">
        <span class="label">Product</span>
        <span class="value">${order.product || '-'}</span>
      </div>
      <div class="order-detail-row">
        <span class="label">Amount</span>
        <span class="value" style="color:var(--success)">$${(order.amount || 0).toFixed(2)}</span>
      </div>
      <div class="order-detail-row">
        <span class="label">Date</span>
        <span class="value">${order.date || '-'}</span>
      </div>
      <div class="order-detail-row">
        <span class="label">Status</span>
        <span class="value">
          <span class="status-badge ${order.status}">
            <i class="fas ${order.status === 'paid' ? 'fa-check-circle' : order.status === 'pending' ? 'fa-clock' : 'fa-times-circle'}"></i>
            ${order.status}
          </span>
        </span>
      </div>
    `;
  }
  
  if (orderModal) {
    orderModal.classList.add('active');
    console.log('Order modal opened');
  }
}

function closeOrderModal() {
  const orderModal = document.getElementById('orderModal');
  if (orderModal) {
    orderModal.classList.remove('active');
    console.log('Order modal closed');
  }
}

function deleteOrder(orderId) {
  if (!confirm('Are you sure you want to delete this order?')) return;
  
  ORDERS = ORDERS.filter(o => o.id !== orderId);
  localStorage.setItem('admin_orders', JSON.stringify(ORDERS));
  renderOrdersTable();
  renderHome();
  showToast('🗑️ Order deleted!');
}

// ============================================
// USERS
// ============================================
function renderUsersTable(users = null) {
  const allUsers = users || USERS;
  const tbody = document.getElementById('usersTableBody');
  
  if (!tbody) {
    console.error('usersTableBody not found');
    return;
  }
  
  if (allUsers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><i class="fas fa-users"></i><p>No users found</p></div></td></tr>';
    return;
  }
  
  tbody.innerHTML = allUsers.map(u => `
    <tr>
      <td><strong>#${u.id}</strong></td>
      <td>
        ${u.avatar 
          ? `<img src="${u.avatar}" alt="${u.name}" class="user-avatar">`
          : `<div class="user-avatar-placeholder">${(u.name || 'U').charAt(0).toUpperCase()}</div>`
        }
      </td>
      <td><strong>${u.name || '-'}</strong></td>
      <td>${u.email || '-'}</td>
      <td>${u.phone || '-'}</td>
      <td><strong style="color:var(--primary)">${(u.purchases || []).length}</strong></td>
      <td>${u.joined || new Date().toLocaleDateString()}</td>
    </tr>
  `).join('');
}

function searchUsers() {
  const userSearch = document.getElementById('userSearch');
  if (!userSearch) return;
  
  const query = userSearch.value.toLowerCase();
  const filtered = USERS.filter(u => 
    (u.name && u.name.toLowerCase().includes(query)) ||
    (u.email && u.email.toLowerCase().includes(query)) ||
    (u.phone && u.phone.includes(query))
  );
  renderUsersTable(filtered);
}

// ============================================
// TOAST
// ============================================
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) {
    console.error('Toast element not found');
    return;
  }
  
  toast.textContent = message;
  toast.className = 'toast show' + (type === 'error' ? ' error' : type === 'warning' ? ' warning' : '');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Make functions globally accessible
window.showSection = showSection;
window.toggleSidebar = toggleSidebar;
window.refreshData = refreshData;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.saveProduct = saveProduct;
window.previewImage = previewImage;
window.searchProducts = searchProducts;
window.filterProducts = filterProducts;
window.filterOrders = filterOrders;
window.viewOrder = viewOrder;
window.closeOrderModal = closeOrderModal;
window.deleteOrder = deleteOrder;
window.searchUsers = searchUsers;
window.closeOrderNotification = closeOrderNotification;
