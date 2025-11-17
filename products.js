// ===================================================================================================================
// 1. CONFIGURATION, UTILITIES, and SYNCHRONIZATION
// ===================================================================================================================

const API_URL = "http://localhost:5000/api/products"; // MongoDB API Endpoint
window.POLLING_INTERVAL = 10000;

// NOTE: This file assumes 'addItemToCart' is defined elsewhere (e.g., in script.js).

/**
 * Utility function to handle API requests (POST, PUT, DELETE, GET).
 */
async function sendProductRequest(productData, method, endpoint = API_URL) {
    try {
        const requiresBody = ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase());
        
        const fetchOptions = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (requiresBody && productData) {
            fetchOptions.body = JSON.stringify(productData); 
        } 

        const response = await fetch(endpoint, fetchOptions);
        
        if (!response.ok) {
            const errorText = await response.text(); 
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }
        return true;
    } catch (error) {
        console.error(`Error during ${method} operation:`, error);
        return false;
    }
}

/**
 * Retrieves the product array from the MongoDB database via the API.
 */
async function getProducts() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json(); 
    } catch (error) {
        console.error("Could not fetch products:", error);
        return [];
    }
}

/**
 * Refreshes the product view on the current page (admin table or public index).
 */
async function refreshProductViews() {
    // If the admin table exists, update it
    if (document.getElementById('product-list')) {
        await renderAdminProducts();
    }
    // If the public product grid exists, update it
    if (document.getElementById('product-container')) {
        await renderProductsOnIndex();
    }
}

/**
 * Starts the polling mechanism to check for external database changes every 10 seconds.
 */
function startPolling() {
    // Only poll if the page contains a product display area
    if (document.getElementById('product-list') || document.getElementById('product-container')) {
        setInterval(async () => {
            await refreshProductViews();
        }, window.POLLING_INTERVAL);
    }
}


// ===================================================================================================================
// 2. PUBLIC PRODUCT RENDERING (Index Page) - MODIFIED FOR QUANTITY SELECTION
// ===================================================================================================================

/**
 * Renders the products onto the main index/shop page with a quantity selector.
 */
async function renderProductsOnIndex() {
    const container = document.getElementById('product-container');
    if (!container) return;

    const products = await getProducts(); // 🚀 Fetch from API
    container.innerHTML = '';

    products.forEach(product => {
        const div = document.createElement('div');
        div.className = 'bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-700 flex flex-col justify-between';
        
        // Add a unique ID for the quantity input for easier retrieval
        const quantityInputId = `qty-${product._id}`;
        
        div.innerHTML = `
            <div>
                <h3 class="text-xl font-bold text-white mb-2">${product.name}</h3>
                ${product.image ? `<img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover rounded-lg mb-2">` : ''}
                <p class="text-gray-300 mb-4">$${parseFloat(product.price).toFixed(2)}</p>
                <p class="text-gray-400 text-sm mb-4">Category: ${product.category}</p>
                <p class="text-gray-400 text-sm mb-4">Stock: ${product.quantity != null ? product.quantity : 'N/A'}</p>
            </div>
            
            <div class="flex items-center space-x-2 mb-4">
                <label for="${quantityInputId}" class="text-white text-sm">Qty:</label>
                <input type="number" id="${quantityInputId}" value="1" min="1" 
                    ${product.quantity != null ? `max="${product.quantity}"` : ''} 
                    class="w-16 p-1 bg-gray-700 text-white rounded-md border border-gray-600 focus:ring-blue-500 focus:border-blue-500">
            </div>

            <button class="add-to-cart-btn bg-black text-white px-4 py-2 rounded-xl font-semibold hover:bg-gray-800 transition duration-150" 
                data-id="${product._id}" data-name="${product.name}" data-price="${product.price}" data-qty-id="${quantityInputId}">
                Add to Cart
            </button>
        `;
        container.appendChild(div);
    });

    document.querySelectorAll('.add-to-cart-btn').forEach(btn => btn.addEventListener('click', () => {
        const quantityInput = document.getElementById(btn.dataset.qtyId);
        // Get the quantity value, ensuring it's at least 1
        const quantity = parseInt(quantityInput.value) || 1; 

        // Assumes addItemToCart is available globally and handles the quantity object
        if (typeof addItemToCart === 'function') {
            addItemToCart({ 
                id: btn.dataset.id, 
                name: btn.dataset.name, 
                price: parseFloat(btn.dataset.price),
                quantity: quantity // Pass the user-selected quantity
            });
        }
    }));
}


// ===================================================================================================================
// 3. ADMIN PRODUCT MANAGEMENT HANDLERS (CRUD) - MODIFIED FOR QUANTITY/STOCK
// ===================================================================================================================

/**
 * Renders the product table on the admin dashboard.
 */
async function renderAdminProducts() {
    const productList = document.getElementById('product-list');
    if (!productList) return;

    const products = await getProducts(); // 🚀 Fetch from API
    productList.innerHTML = '';

    products.forEach((p, index) => {
        const row = document.createElement('tr');
        row.classList = 'border-b border-gray-700 align-middle';
        
        const imgSrc = p.image && p.image.trim() !== '' ? p.image : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9CA3AF" font-size="10">No Image</text></svg>';

        row.innerHTML = `
            <td class="py-3 px-3 align-middle">${index + 1}</td>
            <td class="py-3 px-3 align-middle"><img src="${imgSrc}" alt="${p.name}" class="w-16 h-16 rounded-lg object-cover bg-gray-700"></td>
            <td class="py-3 px-3 align-middle">${p.name}</td>
            <td class="py-3 px-3 align-middle">$${Number(p.price).toFixed(2)}</td>
            <td class="py-3 px-3 align-middle">${p.category}</td>
            <td class="py-3 px-3 align-middle font-bold">${p.quantity != null ? p.quantity : 0}</td>
            <td class="py-3 px-3 text-center align-middle space-x-2">
                <button onclick="window.openEditModal('${p._id}')" class="text-blue-400 hover:underline">Edit</button>
                <button onclick="window.deleteProduct('${p._id}')" class="text-red-400 hover:underline">Delete</button>
            </td>
        `;
        productList.appendChild(row);
    });
}

/**
 * Handles the submission of the 'Add Product' form.
 */
async function handleAddProduct(e) { 
    e.preventDefault();
    const name = document.getElementById('product-name').value.trim();
    const price = parseFloat(document.getElementById('product-price').value);
    const category = document.getElementById('product-category').value.trim();
    // 💥 CORRECT: Read the quantity input
    const quantity = parseInt(document.getElementById('product-quantity')?.value) || 0; 

    if (!name || isNaN(price) || !category) return;
    
    const fileInput = document.getElementById('product-image-file');
    const urlInput = document.getElementById('product-image-url');

    const addProduct = async (img) => { 
        // 💥 CORRECT: Include quantity in the product object sent to API
        const newProduct = { name, price, category, quantity, image: img };
        
        const success = await sendProductRequest(newProduct, 'POST');

        if (success) {
            document.getElementById('product-form')?.reset();
            await refreshProductViews(); // 👈 Update both Admin table and Index grid
        }
    };

    if (fileInput?.files[0]) {
        const reader = new FileReader();
        reader.onload = () => addProduct(reader.result);
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        addProduct(urlInput?.value.trim() || '');
    }
}

/**
 * Deletes a product by MongoDB ID.
 */
window.deleteProduct = async function(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    const success = await sendProductRequest(null, 'DELETE', `${API_URL}/${productId}`);
    
    if (success) {
        await refreshProductViews(); // 👈 Update both Admin table and Index grid
    }
};

/**
 * Opens edit modal for a specific product ID.
 */
window.openEditModal = async function(productId) {
    const products = await getProducts(); 
    const p = products.find(prod => prod._id === productId); 
    
    if (!p) return; 

    const EDIT_MODAL = document.getElementById('edit-modal');
    
    if (EDIT_MODAL) {
        document.getElementById('edit-id').value = p._id; 
        document.getElementById('edit-name').value = p.name;
        document.getElementById('edit-price').value = p.price;
        document.getElementById('edit-category').value = p.category;
        // 💥 CORRECT: Populate the quantity field
const editQuantity = document.getElementById('edit-quantity');
if (editQuantity) {
     editQuantity.value = p.quantity != null ? p.quantity : 0; 
}
        }

        document.getElementById('edit-image-url').value = p.image || ''; 
        document.getElementById('edit-image-file').value = ''; 
        EDIT_MODAL.classList.remove('hidden');
        EDIT_MODAL.classList.add('flex');
    
};

/**
 * Saves the edited product data via API PUT call.
 */
async function saveEdit(productId, imageData) {
    const name = document.getElementById('edit-name').value.trim();
    const price = Number(document.getElementById('edit-price').value);
    const category = document.getElementById('edit-category').value.trim();
    // 💥 CORRECT: Read the updated quantity
    const quantity = parseInt(document.getElementById('edit-quantity')?.value) || 0; 
    
    const originalImageUrl = document.getElementById('edit-image-url').value.trim();
    
    const updatedProduct = { 
        name, 
        price, 
        category, 
        quantity, // 💥 CORRECT: Include the quantity in the updated object
        image: imageData || originalImageUrl // Preserve original if no new image/URL is provided
    };
    
    const success = await sendProductRequest(updatedProduct, 'PUT', `${API_URL}/${productId}`);
    
    if (success) {
        await refreshProductViews(); // 👈 Update both Admin table and Index grid
        document.getElementById('edit-modal').classList.add('hidden');
        document.getElementById('edit-modal').classList.remove('flex');
    }
}

// ===================================================================================================================
// 4. INITIALIZATION
// ===================================================================================================================

document.addEventListener('DOMContentLoaded', () => {
    
    const productForm = document.getElementById('product-form');
    const editForm = document.getElementById('edit-form');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const editModal = document.getElementById('edit-modal');

    // 🚀 Start polling to synchronize views across tabs/pages for external DB changes
    startPolling(); 

    if (productForm) {
        // --- ADMIN DASHBOARD LOGIC ---
        productForm.addEventListener('submit', handleAddProduct);
        renderAdminProducts(); // Initial load

        // Edit Modal Listeners
        if (editModal && editForm) {
            cancelEditBtn.addEventListener('click', () => {
                editModal.classList.add('hidden');
                editModal.classList.remove('flex');
            });

            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const id = document.getElementById('edit-id').value;
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
        renderProductsOnIndex(); // Initial load
    }
});