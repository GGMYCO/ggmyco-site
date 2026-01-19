/********************
 * PRODUCTS
 ********************/
const PRODUCTS_PAGE_1 = [
  { id: "p1-1", name: "AIO Kit 5lb", price: 62.00 },
  { id: "p1-2", name: "AIO Kit 3LB", price: 50.00 },
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

function getAllProducts(){
  return [...PRODUCTS_PAGE_1, ...PRODUCTS_PAGE_2];
}

/********************
 * AGE GATE (ONLY ONCE)
 ********************/
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

/********************
 * CART (PERSISTS BETWEEN PAGES)
 ********************/
const CART_KEY = "gg_cart_v1";

function loadCart(){
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; }
  catch { return {}; }
}

function saveCart(cart){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
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
  return cartTotalNumber().toFixed(2);
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

/********************
 * PRODUCTS RENDER
 ********************/
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

/********************
 * PAYPAL ITEMS (so PayPal shows what they ordered)
 ********************/
function buildPayPalItems(){
  const cart = loadCart();
  const all = getAllProducts();
  const items = [];

  Object.keys(cart).forEach(id => {
    const qty = cart[id];
    const product = all.find(p => p.id === id);
    if(!product) return;

    items.push({
      name: product.name, // "Product 1", "Product 2", etc.
      unit_amount: {
        currency_code: "USD",
        value: product.price.toFixed(2)
      },
      quantity: String(qty)
    });
  });

  return items;
}

/********************
 * PAYPAL SMART BUTTONS (RENDER ONCE)
 ********************/
function renderPayPalButtons(){
  const container = document.getElementById("paypal-buttons");
  if(!container) return;

  if(typeof paypal === "undefined" || !paypal.Buttons){
    container.innerHTML = `<p class="muted">PayPal not loaded. Check your Client ID script line.</p>`;
    return;
  }

  // ✅ Render only once (prevents the spinner/disappearing bug)
  if(container.dataset.rendered === "true") return;
  container.dataset.rendered = "true";

  paypal.Buttons({
    createOrder: function(data, actions){
      const total = cartTotalValueString();

      if(total === "0.00"){
        alert("Your cart is empty.");
        return actions.reject();
      }

      return actions.order.create({
        application_context: {
          shipping_preference: "GET_FROM_FILE" // ✅ collect shipping address
        },
        purchase_units: [{
          description: "GG Myco Order",
          amount: {
            currency_code: "USD",
            value: total,
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: total
              }
            }
          },
          items: buildPayPalItems()
        }]
      });
    },

    onApprove: function(data, actions){
      return actions.order.capture().then(function(details){
        console.log("CAPTURE DETAILS:", details);
        console.log("SHIPPING:", details?.purchase_units?.[0]?.shipping);

        alert("Payment complete. Thanks!");

        localStorage.removeItem(CART_KEY);
        renderCart();
      });
    },

    onCancel: function(data){
      console.log("PAYPAL CANCELLED:", data);
    },

    onError: function(err){
      console.error("PAYPAL ERROR:", err);
      alert("PayPal error. Please try again.");
    }
  }).render("#paypal-buttons");
}

/********************
 * INIT
 ********************/
setupAgeGate();
renderProducts();
renderCart();
renderPayPalButtons();
