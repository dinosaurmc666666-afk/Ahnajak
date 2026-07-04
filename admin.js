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
  { id: 2, title: "WordPress SEO Plugin", category: "plugin", price: 29, image: "", icon: "fa-plug", desc: "Plugin សម្រាប់បង្កើន SEO របស់អ្នក", vendor: "PluginPro", downloads: 8 },
  { id: 3, title: "Portfolio Template", category: "template", price: 19, image: "", icon: "fa-briefcase", desc: "Template ស្អាតសមរាប់ Portfolio", vendor: "TemplateHub", downloads: 15 },
  { id: 4, title: "Admin Dashboard UI", category: "ui", price: 39, image: "", icon: "fa-chart-line", desc: "UI Kit សម្រាប់ Admin Dashboard", vendor: "UIDesign", downloads: 6 },
  { id: 5, title: "Chat App Script", category: "script", price: 59, image: "", icon: "fa-comments", desc: "Real-time chat application", vendor: "DevMaster", downloads: 10 },
  { id: 6, title: "Payment Gateway Plugin", category: "plugin", price: 35, image: "", icon: "fa-credit-card", desc: "ភជាប់ ABA/Stripe ទៅវេបសាយ", vendor: "PluginPro", downloads: 7 }
];

const COUPONS = {
  'SAVE20': { discount: 2
