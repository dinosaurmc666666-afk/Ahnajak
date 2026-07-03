// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
    // បង្ើត Products លំនាំដើម បើមិនទាន់មាន
    if (!localStorage.getItem('products')) {
        const defaultProducts = [
            { id: 1, title: "E-commerce Script", category: "script", price: 49, icon: "fa-shopping-cart", desc: "Script ពេញលេញសម្រាប់ហាងអនឡាញ", vendor: "DevMaster" },
            { id: 2, title: "WordPress SEO Plugin", category: "plugin", price: 29, icon: "fa-plug", desc: "Plugin សម្រាប់បង្កើន SEO", vendor: "PluginPro" },
            { id: 3, title: "Portfolio Template", category: "template", price: 19, icon: "fa-briefcase", desc: "Template ស្អាតសម្រាប់ Portfolio", vendor: "TemplateHub" }
        ];
        localStorage.setItem('products', JSON.stringify(defaultProducts));
    }
    
    renderProductsTable();
});

// ============ ADD PRODUCT ============
document.getElementById('addProductForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const newProduct = {
        id: Date.now(),
        title: document.getElementById('p-title').value.trim(),
        category: document.getElementById('p-category').value,
        price: parseFloat(document.getElementById('p-price').value),
        vendor: document.getElementById('p-vendor').value.trim(),
        desc: document.getElementById('p-desc').value.trim(),
        icon: document.getElementById('p-icon').value.trim() || 'fa-code'
    };
    
    const products = JSON.parse(localStorage.getItem('products')) || [];
    products.push(newProduct);
    
    // Save to localStorage (User site will see this immediately!)
    localStorage.setItem('products', JSON.stringify(products));
    
    // Reset form
    document.getElementById('addProductForm').reset();
    document.getElementById('p-icon').value = 'fa-code';
    
    renderProductsTable();
    showToast(`✅ "${newProduct.title}" added successfully!`);
});

// ============ RENDER TABLE ============
function renderProductsTable(products = null) {
    const allProducts = products || JSON.parse(localStorage.getItem('products')) || [];
    const tbody = document.getElementById('productsTableBody');
    
    document.getElementById('productCount').textContent = allProducts.length;
    
    if (allProducts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted);">No products yet. Add your first product above!</td></tr>';
        return;
    }
    
    tbody.innerHTML = allProducts.map(p => `
        <tr>
            <td><span class="product-icon-cell"><i class="fas ${p.icon}"></i></span></td>
            <td><strong>${p.title}</strong><br><small style="color:var(--text-muted);">${p.vendor}</small></td>
            <td><span class="category-badge">${p.category}</span></td>
            <td><strong style="color:var(--success);">$${p.price}</strong></td>
            <td>
                <button class="btn-edit" onclick="openEditModal(${p.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" onclick="deleteProduct(${p.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ============ SEARCH ============
function searchProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const products = JSON.parse(localStorage.getItem('products')) || [];
    
    const filtered = products.filter(p => 
        p.title.toLowerCase().includes(query) || 
        p.desc.toLowerCase().includes(query) ||
        p.vendor.toLowerCase().includes(query)
    );
    
    renderProductsTable(filtered);
}

// ============ EDIT PRODUCT ============
function openEditModal(id) {
    const products = JSON.parse(localStorage.getItem('products')) || [];
    const product = products.find(p => p.id === id);
    
    if (!product) return;
    
    document.getElementById('edit-id').value = product.id;
    document.getElementById('edit-title').value = product.title;
    document.getElementById('edit-category').value = product.category;
    document.getElementById('edit-price').value = product.price;
    document.getElementById('edit-vendor').value = product.vendor;
    document.getElementById('edit-desc').value = product.desc;
    document.getElementById('edit-icon').value = product.icon;
    
    document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
}

document.getElementById('editProductForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('edit-id').value);
    const products = JSON.parse(localStorage.getItem('products')) || [];
    const index = products.findIndex(p => p.id === id);
    
    if (index === -1) return;
    
    products[index] = {
        id: id,
        title: document.getElementById('edit-title').value.trim(),
        category: document.getElementById('edit-category').value,
        price: parseFloat(document.getElementById('edit-price').value),
        vendor: document.getElementById('edit-vendor').value.trim(),
        desc: document.getElementById('edit-desc').value.trim(),
        icon: document.getElementById('edit-icon').value.trim()
    };
    
    localStorage.setItem('products', JSON.stringify(products));
    
    closeEditModal();
    renderProductsTable();
    
    showToast('✅ Product updated successfully!');
});

// ============ DELETE PRODUCT ============
function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    let products = JSON.parse(localStorage.getItem('products')) || [];
    products = products.filter(p => p.id !== id);
    
    localStorage.setItem('products', JSON.stringify(products));
    renderProductsTable();
    
    showToast('🗑️ Product deleted!');
}

// ============ TOAST ============
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Close modal when clicking outside
document.getElementById('editModal').addEventListener('click', (e) => {
    if (e.target.id === 'editModal') {
        closeEditModal();
    }
});
