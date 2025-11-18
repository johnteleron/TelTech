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
// ADMIN LOGOUT HANDLER
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

// 🚀 NEW: Function to send a request to the server to update stock
async function updateProductStock(productId, quantityDeducted) {
    // NOTE: This URL must match the new route you are adding in server.js
    const API_STOCK_DEDUCT_URL = `https://mongodb-crud-api-khgh.onrender.com/api/products/stock/deduct`; 

    try {
        const response = await fetch(API_STOCK_DEDUCT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                productId: productId, 
                quantity: quantityDeducted 
            })
        });

        if (!response.ok) {
            // Handle error response from server (e.g., "Insufficient stock")
            const errorData = await response.json();
            console.error("Stock deduction failed:", errorData.error || response.statusText);
            // Optionally, show a modal to the user
            showModal('Stock Error', false, errorData.error || "Could not complete purchase. Stock issue.");
            return false; // Indicate failure
        }
        console.log(`Stock successfully deducted for product ${productId}.`);
        
        // After successful deduction, refresh the product views (function defined in products.js)
        if (typeof refreshProductViews === 'function') {
            // This forces the index page/admin dashboard to show updated stock
            refreshProductViews(); 
        }
        return true; // Indicate success
        
    } catch (error) {
        console.error("Stock deduction API request error:", error.message);
        showModal('Error', false, "Network error during stock update.");
        return false; // Indicate failure
    }
}


/**
 * Adds an item to the cart, handling quantity AND initiating stock deduction.
 * This is called by the 'Add to Cart' buttons in products.js.
 */
async function addItemToCart(product) {
    const cart = getCart();
    const quantityToAdd = product.quantity || 1; // Quantity selected by user
    
    // 1. Call the API to deduct stock from the database
    // We make this synchronous so the local cart is only updated if stock deduction succeeds
    const deductionSuccess = await updateProductStock(product.id, quantityToAdd);
    
    if (deductionSuccess) {
        // 2. ONLY if stock deduction succeeded, update the local cart:
        
        // Check if item exists in cart
        const existingItem = cart.find(item => item.id === product.id); 
        
        if (existingItem) {
            // Increment by the selected quantity 
            existingItem.quantity = (existingItem.quantity || 0) + quantityToAdd; 
        } else {
            // Add new item with the selected quantity
            cart.push({ ...product, quantity: quantityToAdd });
        }
        
        // 3. Save the updated cart to local storage
        saveCart(cart);
        
        // 4. Update the cart count badge
        updateCartCount();
        
    } else {
        // Deduction failed (e.g., insufficient stock), do NOT update the cart locally.
        console.log("Cart update aborted due to stock deduction failure.");
    }
}


// ===========================
// CART DISPLAY
// ===========================
function updateCartCount() {
    const count = getCart().reduce((sum, item) => sum + (item.quantity || 0), 0);
    const desktop = document.getElementById('cart-count-desktop');
    const mobile = document.getElementById('cart-count-mobile');
    if (desktop) desktop.textContent = count;
    if (mobile) mobile.textContent = count;
}

function renderCartModal() {
    const cartModal = document.getElementById('cart-modal');
    const cartItemsList = document.getElementById('cart-items-list');
    const emptyCartMessage = document.getElementById('empty-cart-message');

    if (!cartModal || !cartItemsList || !emptyCartMessage) return; 

    const cart = getCart();
    cartItemsList.innerHTML = '';

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
    
    // NOTE: In a real app, clicking 'Remove' should *add* stock back. 
    // We are skipping that logic for now to focus on 'Add to Cart' deduction.

    document.querySelectorAll('.remove-from-cart-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const cart = getCart();
            cart.splice(parseInt(btn.dataset.index), 1);
            saveCart(cart);
            updateCartCount();
            renderCartModal();
        });
    });
    
    cartModal.classList.remove('hidden');
    cartModal.classList.add('flex');
}

// ===========================
// CART EVENT LISTENERS
// ===========================
function initCartListeners() {
    const cartModal = document.getElementById('cart-modal');
    const cartButtons = [document.getElementById('cart-button-desktop'), document.getElementById('cart-button-mobile')];
    const closeCartButton = document.getElementById('close-cart-modal');

    // Listener for opening the cart
    cartButtons.forEach(btn => btn?.addEventListener('click', () => {
        renderCartModal(); 
    }));

    // Listener for closing the cart
    closeCartButton?.addEventListener('click', () => {
        cartModal?.classList.add('hidden');
        cartModal?.classList.remove('flex');
    });
}

// ===========================
// INIT (Loads on all pages)
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    initAuthButtons();
    updateCartCount();
    initCartListeners();

    // Elements that exist only on the Admin Dashboard
    const adminLogoutBtn = document.getElementById('logout-btn');

    if (adminLogoutBtn) {
        // This is the ADMIN DASHBOARD
        adminLogoutBtn.addEventListener('click', handleAdminLogout);
    }
    
    // Event listener for the Admin Login form (if it exists on the current page)
    const adminLoginForm = document.getElementById('admin-login-form');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }
});

