// script.js - FIXED VERSION
const API_BASE = "http://localhost:5000/api";

// Global State
let currentPage = "home";

// DOM Elements
const homePage = document.getElementById("homePage");
const customerLoginPage = document.getElementById("customerLoginPage");
const ownerLoginPage = document.getElementById("ownerLoginPage");
const homeStats = document.getElementById("homeStats");

// ✅ Check server & database connection
async function checkServerConnection() {
  try {
    console.log("🔍 Checking server connection...");
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    console.log("✅ Server:", data.status);
    console.log("📊 Database:", data.database);
    return true;
  } catch (error) {
    console.error("❌ Cannot connect to backend:", error);
    alert("Backend not connected! Please start Node server.");
    return false;
  }
}

// ✅ Initialize event listeners
function initializeEventListeners() {
  console.log("🎯 Setting up event listeners...");

  document.getElementById("homeLink")?.addEventListener("click", showHomePage);
  document.getElementById("customerLoginLink")?.addEventListener("click", showCustomerLogin);
  document.getElementById("ownerLoginLink")?.addEventListener("click", showOwnerLogin);

  document.getElementById("backFromCustomerLogin")?.addEventListener("click", showHomePage);
  document.getElementById("backFromOwnerLogin")?.addEventListener("click", showHomePage);

  document.getElementById("customerLoginBtn")?.addEventListener("click", loginCustomer);
  document.getElementById("ownerLoginBtn")?.addEventListener("click", loginOwner);
}

// ✅ Page Switch Functions
function hideAllPages() {
  const pages = [homePage, customerLoginPage, ownerLoginPage];
  pages.forEach(page => {
    if (page) page.classList.add("hidden");
  });
}

function showHomePage() {
  hideAllPages();
  if (homePage) homePage.classList.remove("hidden");
  loadHomeStats();
}

function showCustomerLogin() {
  hideAllPages();
  if (customerLoginPage) customerLoginPage.classList.remove("hidden");
}

function showOwnerLogin() {
  hideAllPages();
  if (ownerLoginPage) ownerLoginPage.classList.remove("hidden");
}

// ✅ Customer Login - FIXED VERSION
async function loginCustomer(e) {
  if (e) e.preventDefault();
  
  const phoneInput = document.getElementById("customerPhone");
  const phone = phoneInput?.value.trim();
  
  if (!phone) {
    alert("Enter your phone number!");
    return;
  }

  try {
    const connected = await checkServerConnection();
    if (!connected) return;

    const res = await fetch(`${API_BASE}/customer/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Invalid phone number");
    }

    const data = await res.json();
    localStorage.setItem("loggedInCustomer", JSON.stringify(data));
    window.location.href = "customer.html";
    
  } catch (err) {
    console.error("❌ Login error:", err);
    alert(err.message);
  }
}

// ✅ Owner Login - FIXED VERSION
async function loginOwner(e) {
  if (e) e.preventDefault();
  
  const email = document.getElementById("ownerEmail")?.value;
  const password = document.getElementById("ownerPassword")?.value;

  if (!email || !password) {
    alert("Enter email and password!");
    return;
  }

  try {
    const connected = await checkServerConnection();
    if (!connected) return;

    const res = await fetch(`${API_BASE}/owner/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Login failed");
    }

    const data = await res.json();
    alert("✅ Login successful!");
    window.location.href = "owner.html";
    
  } catch (err) {
    console.error("Owner login error:", err);
    alert(err.message);
  }
}

// ✅ Load Home Stats
async function loadHomeStats() {
  try {
    const res = await fetch(`${API_BASE}/analytics`);
    if (!res.ok) throw new Error("Failed to fetch analytics");
    
    const data = await res.json();

    if (!homeStats) {
      console.warn("⚠️ Skipping home stats update — not on home page.");
      return;
    }

    homeStats.innerHTML = `
      <div class="stat-card">
        <i class="fas fa-users fa-2x" style="color: #3498db;"></i>
        <div class="stat-title">Total Customers</div>
        <div class="stat-value">${data.totalCustomers}</div>
      </div>
      <div class="stat-card">
        <i class="fas fa-money-bill-wave fa-2x" style="color: #e74c3c;"></i>
        <div class="stat-title">Total Loan Amount</div>
        <div class="stat-value">₹${data.totalLoanAmount}</div>
      </div>
    `;
  } catch (err) {
    console.error("❌ Error loading home stats:", err);
    if (homeStats) {
      homeStats.innerHTML = `<p> Unable to load statistics </p>`;
    }
  }
}

// ✅ On Page Load
window.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Frontend loaded");

  await checkServerConnection();
  initializeEventListeners();

  // Only show home page if we're on the index page
  if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/" || window.location.pathname.includes("index.html")) {
    showHomePage();
  }
});