// Products
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

function money(n){ return `$${n.toFixed(2)}`; }

/* ============ AGE GATE (ONLY ONCE) ============ */
function setupAgeGate(){
  const gate = document.getElementById("ageGate");
  const yes = document.getElementById("ageYes");
  const no = document.getElementById("ageNo");

  if(!gate) return;

  const accepted = localStorage.getItem("gg_age_21_accepted") === "true";
  if(accepted){
    gate.remove();
    document.body.classList.remove("locked");
    return;
  }

  gate.style.display = "flex";
  gate.setAttribute("aria-hidden", "false");
  document.body.classList.add("locked");

  yes?.addEventListener("click", () => {
    localStorage.setItem("gg_age_21_accepted", "true");
    gate.remove();
    document.body.classList.remove("locked");
  });

  no?.addEventListener("click", () => {
    alert("You must be 21+ to access this site.");
  });
}

/* ============ CART (PERSISTS BETWEEN PAGES) ============ */
const CART_KEY = "gg_cart_v1";

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

function cartTotalNumber(){
  const all = getAllProducts();
  const cart = loadCart();
  let total = 0;

  for(const id of Object.keys(cart)){
    const qty = cart[id];
    const product = all.find(p => p.id === id);
    if(product) total += product.price * qty;
  }
  return total;
}

function cartTotalValueString(){
  return cartTotalNumber().toFixed(2); // PayPal wants "12.34"
}

function addToCart(productId){
  const cart = loadCart();
  cart[productId] = (cart[productId] || 0) + 1;
  saveCart(cart);
  renderCart();
  renderPayPalButtons(); // keep PayPal buttons in sync with current total
}

function removeOne(productId){
  const cart = loadCart();
  if(!cart[productId]) return;

  cart[productId] -= 1;
  if(cart[productId] <= 0) delete cart[productId];

  saveCart(cart);
  renderCart();
  renderPayPalButtons();
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

/* ============ PRODUCTS ============ */
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

/* ============ PAYPAL SMART BUTTONS ============ */
function renderPayPalButtons(){
  const container = document.getElementById("paypal-buttons");
  if(!container) return;

  // If PayPal SDK didn't load, show a helpful message
  if(typeof paypal === "undefined" || !paypal.Buttons){
    container.innerHTML = `<p class="muted">PayPal not loaded. Check your Client ID script line.</p>`;
    return;
  }

  // Clear container before rendering (important when cart changes)
  container.innerHTML = "";

  paypal.Buttons({
    createOrder: function(data, actions){
      const total = cartTotalValueString();
      if(total === "0.00"){
        alert("Your cart is empty.");
        return;
      }

      return actions.order.create({
        purchase_units: [{
          amount: { value: total }
        }]
      });
    },

    onApprove: function(data, actions){
      return actions.order.capture().then(function(details){
        alert("Payment complete. Thanks!");

        // Clear cart after successful payment
        localStorage.removeItem(CART_KEY);
        renderCart();
        renderPayPalButtons();
      });
    },

    onError: function(err){
      console.error(err);
      alert("PayPal error. Please try again.");
    }
  }).render("#paypal-buttons");
}

/* ============ INIT ============ */
setupAgeGate();
renderProducts();
renderCart();
renderPayPalButtons();
