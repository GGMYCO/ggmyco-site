const PRODUCTS = [
  { id: 1, name: "Strain 1", price: 25.00 },
  { id: 2, name: "Strain 2", price: 30.00 },
  { id: 3, name: "Strain 3", price: 22.00 },
  { id: 4, name: "Strain 4", price: 28.00 },
];

const cart = new Map(); // id -> {product, qty}

const productsEl = document.getElementById("products");
const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");

function money(n){
  return `$${n.toFixed(2)}`;
}

function renderProducts(){
  productsEl.innerHTML = "";
  PRODUCTS.forEach(p => {
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

function addToCart(id){
  const product = PRODUCTS.find(p => p.id === id);
  const existing = cart.get(id);
  if(existing){
    existing.qty += 1;
  } else {
    cart.set(id, { product, qty: 1 });
  }
  renderCart();
}

function removeOne(id){
  const item = cart.get(id);
  if(!item) return;
  item.qty -= 1;
  if(item.qty <= 0) cart.delete(id);
  renderCart();
}

function renderCart(){
  if(cart.size === 0){
    cartItemsEl.innerHTML = `<p class="muted">No items yet.</p>`;
    cartTotalEl.textContent = "$0.00";
    return;
  }

  let total = 0;
  cartItemsEl.innerHTML = "";

  [...cart.values()].forEach(({product, qty}) => {
    total += product.price * qty;

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <div class="row">
        <strong>${product.name}</strong>
        <strong>${money(product.price * qty)}</strong>
      </div>
      <small>Qty: ${qty}</small>
      <button type="button" class="add-btn" style="margin-top:8px;background:#ffffff;color:#111;border:1px solid rgba(0,0,0,0.12);">
        Remove 1
      </button>
    `;

    div.querySelector("button").addEventListener("click", () => removeOne(product.id));
    cartItemsEl.appendChild(div);
  });

  cartTotalEl.textContent = money(total);
}

checkoutBtn.addEventListener("click", () => {
  alert("Checkout clicked. Next step: connect PayPal button / checkout link.");
});

renderProducts();
renderCart();
