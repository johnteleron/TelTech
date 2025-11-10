/**
 * script.js
 * Handles product management, rendering, and cart functionality (for teltech.html).
 */

let products = JSON.parse(localStorage.getItem('products')) || [
    {
        id: Date.now(),
        name: "Quantum Headset Pro",
        price: 299.99,
        rating: 4.8,
        description: "High-fidelity wireless headphones with noise cancellation.",
        image_url: "https://placehold.co/400x300/6366f1/ffffff?text=HEADSET"
    },
    {
        id: Date.now() + 1,
        name: "Aura Smartwatch",
        price: 149.5,
        rating: 4.2,
        description: "Fitness tracker with 7-day battery life and health monitoring.",
        image_url: "https://placehold.co/400x300/6366f1/ffffff?text=SMARTWATCH"
    }
];

let cartItemCount = 0;
const cartCount = document.getElementById("cart-count");
const grid = document.getElementById("product-grid");
const modal = document.getElementById("product-management-modal");
const adminList = document.getElementById("admin-product-list");
const form = document.getElementById("product-form");

// DOM elements for image management
const productIdInput = document.getElementById("product-id");
const productImageUrlInput = document.getElementById("product-image-url");
const imagePreviewContainer = document.getElementById("current-image-preview");
const imagePreview = document.getElementById("product-image-preview");


function saveProducts() {
    localStorage.setItem("products", JSON.stringify(products));
}

function renderProducts() {
    // Exit if elements for rendering aren't present (i.e., we are on signup or login page)
    if (!grid) return; 

    const loadingMessage = document.getElementById("loading-message");
    
    if (!products.length) {
        grid.innerHTML = `<p class="text-center col-span-full text-gray-500 py-10">No products found.</p>`;
        if (adminList) adminList.innerHTML = `<p class="text-center text-gray-500">No products yet.</p>`;
        if (loadingMessage) loadingMessage.classList.add("hidden");
        return;
    }
    
    if (loadingMessage) loadingMessage.classList.add("hidden");

    // 1. Update Grid Rendering
    grid.innerHTML = products.map(p => `
        <div class="bg-white rounded-xl shadow-lg hover:shadow-2xl transition overflow-hidden group">
          <div class="h-48 overflow-hidden">
            <img src="${p.image_url || 'https://placehold.co/400x300/aaaaaa/ffffff?text=No+Image'}" alt="${p.name}" class="w-full h-full object-cover transition group-hover:scale-105">
          </div>
          <div class="p-5">
            <h4 class="text-xl font-semibold text-gray-900 mb-1">${p.name}</h4>
            <p class="text-xs text-gray-500 mb-3">${p.description}</p>
            <div class="flex justify-between mb-4">
              <span class="text-yellow-500">${"★".repeat(Math.floor(p.rating))} (${p.rating})</span>
              <span class="text-2xl font-bold text-indigo-600">$${p.price.toFixed(2)}</span>
            </div>
            <button onclick="addToCart('${p.id}')" class="w-full add-to-cart bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">
              <i class="fas fa-cart-plus mr-2"></i> Add to Cart
            </button>
          </div>
        </div>
    `).join('');

    // 2. Update Admin List Rendering (Only if adminList exists)
    if (adminList) {
        adminList.innerHTML = products.map(p => `
            <div class="flex items-center justify-between bg-white p-3 rounded-lg border">
              <div class="flex items-center">
                <img src="${p.image_url || 'https://placehold.co/40x40/cccccc/ffffff?text=N/A'}" alt="${p.name}" class="h-10 w-10 object-cover rounded-md mr-4">
                <strong>${p.name}</strong> <small class="text-gray-500 ml-2">$${p.price.toFixed(2)}</small>
              </div>
              <div class="space-x-2">
                <button onclick="editProduct(${p.id})" class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm hover:bg-yellow-200">Edit</button>
                <button onclick="deleteProduct(${p.id})" class="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm hover:bg-red-200">Delete</button>
              </div>
            </div>
        `).join('');
    }
}

window.addToCart = function() {
    cartItemCount++;
    if (cartCount) {
        cartCount.textContent = cartItemCount;
    }
}

window.openProductModal = function() {
    // Added Auth Check for protection
    if (!sessionStorage.getItem('loggedInUserEmail')) {
        alert("You must be logged in to manage products.");
        window.location.href = "login.html";
        return;
    }
    if (modal) modal.classList.remove("hidden");
}

window.closeProductModal = function(e) {
    if (!modal) return;
    if (!e || e.target === modal || (e.target.tagName === "BUTTON" && e.target.closest('#product-management-modal'))) {
        modal.classList.add("hidden");
        clearForm();
    }
}

window.clearForm = function() {
    if (form) form.reset();
    if (productIdInput) productIdInput.value = "";
    if (productImageUrlInput) productImageUrlInput.value = "";
    if (imagePreview) imagePreview.src = "";
    if (imagePreviewContainer) imagePreviewContainer.classList.add("hidden");
}

window.editProduct = function(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;

    // Check auth again before opening the modal
    if (!sessionStorage.getItem('loggedInUserEmail')) {
        alert("You must be logged in to edit products.");
        window.location.href = "login.html";
        return;
    }
    
    // Populate Form
    document.getElementById("product-id").value = p.id;
    document.getElementById("product-name").value = p.name;
    document.getElementById("product-price").value = p.price;
    document.getElementById("product-description").value = p.description;
    document.getElementById("product-rating").value = p.rating;

    // Image handling for editing
    productImageUrlInput.value = ''; 
    if (p.image_url) {
        imagePreview.src = p.image_url;
        imagePreviewContainer.classList.remove("hidden");
    } else {
        imagePreview.src = '';
        imagePreviewContainer.classList.add("hidden");
    }

    openProductModal();
}

window.deleteProduct = function(id) {
    if (!sessionStorage.getItem('loggedInUserEmail')) {
        alert("You must be logged in to delete products.");
        window.location.href = "login.html";
        return;
    }
    
    if (confirm("Are you sure you want to delete this product?")) {
        products = products.filter(p => p.id !== id);
        saveProducts();
        renderProducts();
    }
}

window.deleteImage = function() {
    const id = productIdInput.value;
    
    if (id && confirm("Are you sure you want to delete the product image? This will be permanent when you click 'Save Product'.")) {
        const productIndex = products.findIndex(p => p.id === Number(id));
        
        if (productIndex !== -1) {
            products[productIndex].image_url = null; // Mark for deletion
            imagePreviewContainer.classList.add('hidden');
            productImageUrlInput.value = ''; // Ensure URL input is empty
            
            alert("Image deleted successfully! Click 'Save Product' to confirm the change.");
        }
    } else if (!id) {
        productImageUrlInput.value = '';
        imagePreviewContainer.classList.add('hidden');
    }
}

// Ensure the form listener is only attached if the form exists
if (form) {
    form.addEventListener("submit", e => {
        e.preventDefault(); 
        
        // Final auth check
        if (!sessionStorage.getItem('loggedInUserEmail')) {
            alert("You must be logged in to save products.");
            window.location.href = "login.html";
            return;
        }

        const id = productIdInput.value;
        const newImageUrl = productImageUrlInput.value;

        const productData = {
            name: document.getElementById("product-name").value,
            price: parseFloat(document.getElementById("product-price").value),
            rating: parseFloat(document.getElementById("product-rating").value),
            description: document.getElementById("product-description").value,
        };

        if (id) {
            // Editing existing product
            products = products.map(p => {
                if (p.id === Number(id)) {
                    const updatedProduct = { ...p, ...productData };
                    
                    if (newImageUrl) {
                        updatedProduct.image_url = newImageUrl;
                    } 
                    // If deleteImage was called, p.image_url is already null, so no need to overwrite if newImageUrl is empty
                    return updatedProduct;
                }
                return p;
            });

        } else {
            // Adding new product
            const fallbackImage = `https://placehold.co/400x300/6366f1/ffffff?text=${encodeURIComponent(productData.name.toUpperCase().slice(0, 10))}`;
            
            const newProduct = {
                id: Date.now(),
                ...productData,
                image_url: newImageUrl || fallbackImage
            };
            products.push(newProduct);
        }

        saveProducts();
        renderProducts();
        closeProductModal();
    });
}

document.addEventListener("DOMContentLoaded", renderProducts);
