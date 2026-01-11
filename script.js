// ✅ Put your PayPal checkout link here (PayPal.me, hosted button link, etc.)
const PAYPAL_CHECKOUT_URL = "PASTE_YOUR_PAYPAL_LINK_HERE";

// Page 1 = 4 products, Page 2 = 5 products.
// Edit names/prices however you want:
const PRODUCTS_PAGE_1 = [
  { id: "p1-1", name: "Product 1", price: 25.00 },
  { id: "p1-2", name: "Product 2", price: 30.00 },
  { id: "p1-3", name: "Product 3", price: 22.00 },
  { id: "p1-4", name: "Product 4", price: 28.00 },
];

const PRODUCTS_PAGE_2 = [
  { id: "p2-1", name: "Product 1", price: 15.00 },
  { id: "p2-2", name: "Product 2", price: 18.00 },
  { id: "p2-3", name: "Product 3", price: 20.00 },
  { id: "p2-4", name: "Product 4", price: 24.00 },
  { id: "p2-5", name: "Product 5", price: 12.00 },
];

// ---------- helpers ----------
function money(n){ return `$${n.toFixed(2)}`; }

// ---------- age gate ----------
function setupAgeGate(){
  const gate = document.getElementById("ageGate");
  const yes = document.getElementById("ageYes");
  const no = document.getElementById("ageNo");

  const isVerified = localStorage.getItem("gg_age_verified") === "true";
  if(!isVerified){
    gate.classList.add("show");
    gate.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  yes?.addEventListener("click", () => {
    localStorage.setItem("gg_age_verified", "true");
    gate.classList.remove("show");
    gate.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  });

  no?.addEventListener("click", () => {
    // If under 21, block access
    document.body.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#000;color:#fff;padding:18px;text-align:center;">
        <div style="max-width:520px;">
          <h1 style="margin:0 0 10px;">Access Denied</h1>
          <p style="margin:0;opacity:0.85;">You must be 21+ to access this website.</p>
        </div>
      </div>
    `;
  });
}

// ---------- cart ----------
const CART_KEY = "gg_cart_v1"; // persists across page 1 and 2
function loadCart(){
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; }
  catch { return {}; }
}
function saveCart(cart){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function getAllProducts(){
  return [...PRODUCTS_PAGE_1, ...PRODUCTS_PAGE_2];
}

function addToCart(productId){
  const cart = loadCart();
  cart[productId] = (cart[productId] || 0) + 1;
  saveCart(cart);
  renderCart();
}

function removeOne(productId){
  const cart = loadCart();
  if(!cart[productId]) return;
  cart[productId] -= 1;
  if(cart[productId] <= 0) delete cart[productId];
  saveCart(cart);
  renderCart();
}

function renderCart(){
  const cartItemsEl = document.getElementById("cartItems");
  const cartTotalEl = document.getElementById("cartTotal");
  const all = getAllProducts();
  const cart = loadCart();

  const ids = Object.keys(cart);
  if(ids.length === 0){
    cartItemsEl.innerHTML = `<p class="muted">No items yet.</p>`;
    cartTotalEl.textContent = "$0.00";
    return;
  }

  let total = 0;
  cartItemsEl.innerHTML = "";

  ids.forEach(id => {
    const qty = cart[id];
    const product = all.find(p => p.id === id);
    if(!product) return;

    total += product.price * qty;

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <div class="row">
        <strong>${product.name}</strong>
        <strong>${money(product.price * qty)}</strong>
      </div>
      <small>Qty: ${qty}</small>
      <button type="button" class="remove-btn">Remove 1</button>
    `;

    div.querySelector("button").addEventListener("click", () => removeOne(product.id));
    cartItemsEl.appendChild(div);
  });

  cartTotalEl.textContent = money(total);
}

// ---------- products ----------
function renderProducts(){
  const productsEl = document.getElementById("products");
  const page = window.GG_PAGE || 1;

  const list = page === 2 ? PRODUCTS_PAGE_2 : PRODUCTS_PAGE_1;

  productsEl.innerHTML = "";
  list.forEach(p => {
    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <h3>${p.name}</h3>
      <div class="price">${money(p.price)}</div>
      <button class="add-btn" type="button">Add to Cart</button>
    `;
    card.querySelector("button").addEventListener("click", () => addToCart(p.id));
    productsEl.appendChild(card);
  });
}

// ---------- checkout link ----------
function setupPayPal(){
  const link = document.getElementById("paypalCheckout");
  if(!link) return;

  if(PAYPAL_CHECKOUT_URL && PAYPAL_CHECKOUT_URL !== "PASTE_YOUR_PAYPAL_LINK_HERE"){
    link.href = PAYPAL_CHECKOUT_URL;
  } else {
    link.href = "#";
    link.addEventListener("click", (e) => {
      e.preventDefault();
      alert("Paste your PayPal checkout link into script.js (PAYPAL_CHECKOUT_URL).");
    });
  }
}

// init
setupAgeGate();
setupPayPal();
renderProducts();
renderCart();

