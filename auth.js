/**
 * auth.js
 * Handles user authentication state, checking, and redirection.
 * This should be linked in both login.html (conditionally) and teltech.html.
 */

// Function to handle the login/logout button status on teltech.html
function checkAuthStatus() {
    const authButton = document.getElementById('auth-button');
    const manageProductsButton = document.getElementById('product-manager-btn');
    const loggedInUserEmail = sessionStorage.getItem('loggedInUserEmail');

    if (!authButton) return; // Exit if not on teltech.html

    if (loggedInUserEmail) {
        // Logged In: Show Log Out button and Management button
        authButton.innerHTML = '<i class="fas fa-sign-out-alt text-xs mr-2"></i> Log Out';
        authButton.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
        authButton.classList.add('bg-red-500', 'hover:bg-red-600');
        
        if (manageProductsButton) {
            manageProductsButton.style.display = 'inline-block';
        }

        authButton.onclick = (e) => { 
            e.preventDefault();
            sessionStorage.removeItem('loggedInUserEmail'); // Clear session
            alert("You have been logged out.");
            window.location.href = "login.html"; // Redirect to login
        };

    } else {
        // Not Logged In: Show Log In button and hide Management button
        authButton.innerHTML = '<i class="fas fa-sign-in-alt text-xs mr-2"></i> Log In';
        authButton.classList.remove('bg-red-500', 'hover:bg-red-600');
        authButton.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
        
        if (manageProductsButton) {
             manageProductsButton.style.display = 'none';
        }

        authButton.onclick = (e) => { 
            e.preventDefault();
            window.location.href = 'login.html';
        };
    }
}

// Function used by the HTML pages for navigation (kept for clarity)
function goToLoginPage() {
    window.location.href = "login.html"; 
}

// Attach the status check to the DOMContentLoaded event if we are on teltech.html
document.addEventListener("DOMContentLoaded", checkAuthStatus);
