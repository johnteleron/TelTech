// ===========================
// GLOBAL MODAL HANDLER
// ===========================
function showModal(type, success = true, customMessage = null) {
    const modal = document.getElementById('custom-modal');
    const title = document.getElementById('modal-title');
    const message = document.getElementById('modal-message');
    if (!modal || !title || !message) return;

    let defaultTitle = 'Notice';
    let defaultMessage = 'Action completed.';

    switch(type) {
        case 'User':
            defaultTitle = 'User Login Attempt';
            defaultMessage = success ? 'Login successful! Redirecting...' :
                                      'Please fill in both username/email and password fields.';
            break;
        case 'Logout':
            defaultTitle = 'Session Ended';
            defaultMessage = 'You have been successfully logged out.';
            break;
        case 'Admin':
            defaultTitle = 'Admin Login Attempt';
            defaultMessage = success ? 'Admin login successful! Redirecting...' :
                                      'Invalid credentials. Please try again.';
            break;
    }

    title.textContent = defaultTitle;
    message.textContent = customMessage || defaultMessage;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function hideModal() {
    const modal = document.getElementById('custom-modal');
    if (modal) {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }
}

// ===========================
// AUTHENTICATION (USER)
// ===========================
const AUTH_KEY = 'isUserLoggedIn';

function updateAuthButtons() {
    const loggedIn = localStorage.getItem(AUTH_KEY) === 'true';
    const loginButtons = [document.getElementById('login-btn-desktop'), document.getElementById('login-btn-mobile')];
    const logoutButtons = [document.getElementById('logout-btn-desktop'), document.getElementById('logout-btn-mobile')];

    loginButtons.forEach(btn => btn && btn.classList.toggle('hidden', loggedIn));
    logoutButtons.forEach(btn => btn && btn.classList.toggle('hidden', !loggedIn));
}

function handleUserLoginRedirect() {
    window.location.href = 'login.html';
}

function handleUserLogout() {
    localStorage.setItem(AUTH_KEY, 'false');
    updateAuthButtons();
    showModal('Logout');
    setTimeout(() => {
        hideModal();
        window.location.href = 'index.html';
    }, 1500);
}

function initAuthButtons() {
    const loginButtons = [document.getElementById('login-btn-desktop'), document.getElementById('login-btn-mobile')];
    const logoutButtons = [document.getElementById('logout-btn-desktop'), document.getElementById('logout-btn-mobile')];

    loginButtons.forEach(btn => btn && btn.addEventListener('click', handleUserLoginRedirect));
    logoutButtons.forEach(btn => btn && btn.addEventListener('click', handleUserLogout));

    updateAuthButtons();
}

// ===========================
// ADMIN LOGOUT HANDLER (ADD THIS)
// ===========================
function handleAdminLogout() {
    // Clear admin and user login state
    localStorage.setItem("isAdminLoggedIn", "false"); 
    localStorage.setItem(AUTH_KEY, "false"); 
    
    // Use the general modal handler
    showModal('Logout'); 
    
    setTimeout(() => {
        hideModal();
        // Redirect to the login page
        window.location.href = 'login.html'; 
    }, 1500);
}

// ===========================
// ADMIN LOGIN
// ===========================
function handleAdminLogin(event) {
    event.preventDefault();
    const identifierInput = document.getElementById('admin-identifier');
    const passwordInput = document.getElementById('admin-password');
    if (!identifierInput || !passwordInput) return;

    const ADMIN_USER = "admin";
    const ADMIN_PASS = "12345";

    if (identifierInput.value === ADMIN_USER && passwordInput.value === ADMIN_PASS) {
        localStorage.setItem("isAdminLoggedIn", "true");
        showModal('Admin', true);
        setTimeout(() => {
            hideModal();
            window.location.href = 'admin-dashboard.html';
        }, 1500);
    } else {
        showModal('Admin', false, "Invalid credentials. Please try again.");
    }
}

// ===========================
// CART FUNCTIONS
// ===========================
const CART_KEY = 'teltech_cart';

function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addItemToCart(product) {
    const cart = getCart();
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveCart(cart);
    updateCartCount();
}

// ===========================
// CART DISPLAY
// ===========================
function updateCartCount() {
    // ... (This function remains the same)
    const count = getCart().reduce((sum, item) => sum + (item.quantity || 1), 0);
    const desktop = document.getElementById('cart-count-desktop');
    const mobile = document.getElementById('cart-count-mobile');
    if (desktop) desktop.textContent = count;
    if (mobile) mobile.textContent = count;
}

function renderCartModal() {
    // Move element retrieval inside the function to ensure they exist on call
    const cartModal = document.getElementById('cart-modal');
    const cartItemsList = document.getElementById('cart-items-list');
    const emptyCartMessage = document.getElementById('empty-cart-message');

    if (!cartModal || !cartItemsList || !emptyCartMessage) return; // Safely exit if elements aren't found

    const cart = getCart();
    cartItemsList.innerHTML = '';

    // ... (rest of your existing renderCartModal logic remains here)
    if (cart.length === 0) {
        emptyCartMessage.classList.remove('hidden');
    } else {
        emptyCartMessage.classList.add('hidden');
        cart.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'flex justify-between items-center bg-gray-700 p-4 rounded-xl';
            li.innerHTML = `
                <span class="text-white">${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</span>
                <button class="remove-from-cart-btn bg-red-600 px-3 py-1 rounded hover:bg-red-700" data-index="${index}">Remove</button>
            `;
            cartItemsList.appendChild(li);
        });
    }

    document.querySelectorAll('.remove-from-cart-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const cart = getCart();
            cart.splice(parseInt(btn.dataset.index), 1);
            saveCart(cart);
            updateCartCount();
            renderCartModal();
        });
    });
    
    // Crucial: Show the modal after rendering
    cartModal.classList.remove('hidden');
    cartModal.classList.add('flex');
}

// ===========================
// CART EVENT LISTENERS (NEW FUNCTION)
// ===========================
function initCartListeners() {
    const cartModal = document.getElementById('cart-modal');
    const cartButtons = [document.getElementById('cart-button-desktop'), document.getElementById('cart-button-mobile')];
    const closeCartButton = document.getElementById('close-cart-modal');

    // Listener for opening the cart
    cartButtons.forEach(btn => btn?.addEventListener('click', () => {
        renderCartModal(); // renderCartModal now handles showing the modal
    }));

    // Listener for closing the cart
    closeCartButton?.addEventListener('click', () => {
        cartModal?.classList.add('hidden');
        cartModal?.classList.remove('flex');
    });
}

// ===========================
// PRODUCT MANAGEMENT
// ===========================
const PRODUCT_KEY = 'teltech_products';

function getProducts() {
    return JSON.parse(localStorage.getItem(PRODUCT_KEY)) || [];
}

function saveProducts(products) {
    localStorage.setItem(PRODUCT_KEY, JSON.stringify(products));
    // Trigger storage event so other tabs can update
    window.dispatchEvent(new Event('storage'));
}

// Render products on index.html
function renderProductsOnIndex() {
    const container = document.getElementById('product-container');
    if (!container) return;

    const products = getProducts();
    container.innerHTML = '';

    products.forEach(product => {
        const div = document.createElement('div');
        div.className = 'bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-700 flex flex-col justify-between';
        div.innerHTML = `
            <div>
                <h3 class="text-xl font-bold text-white mb-2">${product.name}</h3>
                ${product.image ? `<img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover rounded-lg mb-2">` : ''}
                <p class="text-gray-300 mb-4">$${parseFloat(product.price).toFixed(2)}</p>
                <p class="text-gray-400 text-sm mb-4">Category: ${product.category}</p>
            </div>
            <button class="add-to-cart-btn bg-black text-white px-4 py-2 rounded-xl font-semibold hover:bg-gray-800 transition duration-150" 
                data-id="${product.id}" data-name="${product.name}" data-price="${product.price}">
                Add to Cart
            </button>
        `;
        container.appendChild(div);
    });

    // ... INSIDE renderProductsOnIndex ...
document.querySelectorAll('.add-to-cart-btn').forEach(btn => btn.addEventListener('click', () => {
    addItemToCart({
        id: btn.dataset.id,
        name: btn.dataset.name,
        price: parseFloat(btn.dataset.price)
    });
    // Add a simple confirmation or use the showModal if you want a non-cart modal confirmation
    // If you want the cart modal to pop up:
    // document.getElementById('cart-modal')?.classList.remove('hidden');
}));
}

// ===========================
// ADMIN PRODUCT TABLE RENDERING
// ===========================

function renderAdminProducts() {
    const productList = document.getElementById('product-list');
    if (!productList) return;

    const products = getProducts();
    productList.innerHTML = '';

    products.forEach((p, index) => {
        const row = document.createElement('tr');
        row.classList = 'border-b border-gray-700 align-middle';
        
        // Simple placeholder logic for admin view
        const imgSrc = p.image && p.image.trim() !== '' ? p.image : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9CA3AF" font-size="10">No Image</text></svg>';

        row.innerHTML = `
            <td class="py-3 px-3 align-middle">${index + 1}</td>
            <td class="py-3 px-3 align-middle"><img src="${imgSrc}" alt="${p.name}" class="w-16 h-16 rounded-lg object-cover bg-gray-700"></td>
            <td class="py-3 px-3 align-middle">${p.name}</td>
            <td class="py-3 px-3 align-middle">$${Number(p.price).toFixed(2)}</td>
            <td class="py-3 px-3 align-middle">${p.category}</td>
            <td class="py-3 px-3 text-center align-middle space-x-2">
                <button onclick="window.openEditModal(${index})" class="text-blue-400 hover:underline">Edit</button>
                <button onclick="window.deleteProduct(${index})" class="text-red-400 hover:underline">Delete</button>
            </td>
        `;
        productList.appendChild(row);
    });
}


// ===========================
// ADMIN EDIT & DELETE HANDLERS
// ===========================

window.deleteProduct = function(i) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    let products = getProducts();
    products.splice(i, 1);
    saveProducts(products); // saves and triggers update on index page
    renderAdminProducts(); // update admin table
};

window.openEditModal = function(i) {
    const products = getProducts();
    const p = products[i];
    const EDIT_MODAL = document.getElementById('edit-modal');
    
    if (EDIT_MODAL) {
        document.getElementById('edit-id').value = i;
        document.getElementById('edit-name').value = p.name;
        document.getElementById('edit-price').value = p.price;
        document.getElementById('edit-category').value = p.category;
        document.getElementById('edit-image-url').value = p.image || ''; // Pre-fill URL if available
        document.getElementById('edit-image-file').value = ''; // Clear file input
        EDIT_MODAL.classList.remove('hidden');
        EDIT_MODAL.classList.add('flex');
    }
};

function saveEdit(id, imageData) {
    const name = document.getElementById('edit-name').value.trim();
    const price = Number(document.getElementById('edit-price').value);
    const category = document.getElementById('edit-category').value.trim();
    
    let products = getProducts();

    // Only update image if new data (imageData) is provided, otherwise keep existing
    products[id] = { 
        id: products[id].id, // Keep the original ID
        name, 
        price, 
        category, 
        image: imageData === '' ? products[id].image : imageData // Use new image or keep old one
    };
    
    saveProducts(products); // saves and triggers update on index page
    renderAdminProducts();  // update admin table
    document.getElementById('edit-modal').classList.add('hidden');
    document.getElementById('edit-modal').classList.remove('flex');
}

// ===========================
// ADMIN MODAL & FORM LISTENERS
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    // Only run these listeners if we are on the admin dashboard
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-form');
    const cancelEditBtn = document.getElementById('cancel-edit');

    if (editModal && editForm) {
        // Cancel button
        cancelEditBtn.addEventListener('click', () => {
            editModal.classList.add('hidden');
            editModal.classList.remove('flex');
        });

        // Save button
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = Number(document.getElementById('edit-id').value);
            const file = document.getElementById('edit-image-file').files[0];
            const url = document.getElementById('edit-image-url').value.trim();

            if (file) {
                const reader = new FileReader();
                reader.onload = () => { saveEdit(id, reader.result); };
                reader.readAsDataURL(file);
            } else {
                saveEdit(id, url);
            }
        });
    }

    // Initial render for Admin Page
    renderAdminProducts(); 
});

// ===========================
// ADMIN PRODUCT HANDLERS
// ===========================
function handleAddProduct(e) {
    e.preventDefault();
    const name = document.getElementById('product-name').value.trim();
    const price = parseFloat(document.getElementById('product-price').value);
    const category = document.getElementById('product-category').value.trim();
    if (!name || isNaN(price) || !category) return;

    const products = getProducts();
    const fileInput = document.getElementById('product-image-file');
    const urlInput = document.getElementById('product-image-url');

    const addProduct = (img) => {
        products.push({ id: Date.now().toString(), name, price, category, image: img });
        saveProducts(products);
        document.getElementById('product-form')?.reset();
    };

    if (fileInput?.files[0]) {
        const reader = new FileReader();
        reader.onload = () => addProduct(reader.result);
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        addProduct(urlInput?.value.trim() || '');
    }
}

// ===========================
// LISTEN FOR STORAGE CHANGES (LIVE UPDATE)
// ===========================
window.addEventListener('storage', (e) => {
    if (e.key === PRODUCT_KEY) {
        renderProductsOnIndex();
    }
});

// ===========================
// INIT (FINAL, CORRECTED BLOCK - REPLACE ALL PREVIOUS INIT BLOCKS)
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    initAuthButtons();
    updateCartCount();
    initCartListeners();

    // Elements that exist only on the Admin Dashboard
    const productForm = document.getElementById('product-form');
    const adminLogoutBtn = document.getElementById('logout-btn');
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-form');
    const cancelEditBtn = document.getElementById('cancel-edit');

    if (productForm) {
        // --- ADMIN DASHBOARD LOGIC ---
        
        // 1. Add Product Listener
        productForm.addEventListener('submit', handleAddProduct);
        
        // 2. Render Product Table
        renderAdminProducts();
        
        // 3. Admin Logout Listener (THE FIX)
        if (adminLogoutBtn) {
            adminLogoutBtn.addEventListener('click', handleAdminLogout);
        }

        // 4. Edit Modal Listeners
        if (editModal && editForm) {
            cancelEditBtn.addEventListener('click', () => {
                editModal.classList.add('hidden');
                editModal.classList.remove('flex');
            });

            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const id = Number(document.getElementById('edit-id').value);
                const file = document.getElementById('edit-image-file').files[0];
                const url = document.getElementById('edit-image-url').value.trim();

                if (file) {
                    const reader = new FileReader();
                    reader.onload = () => { saveEdit(id, reader.result); };
                    reader.readAsDataURL(file);
                } else {
                    saveEdit(id, url);
                }
            });
        }
    } else {
        // --- INDEX PAGE LOGIC ---
        renderProductsOnIndex(); // Render product grid for customers
    }
});

