/* ==========================================================================
   MALIZIA — Cart
   Kept intentionally simple: sessionStorage-backed cart, no backend cart
   table required. Swap for a Supabase `cart_items` table later if you want
   carts to persist across devices.
   ========================================================================== */

const CART_KEY = "malizia_cart_v1";

function getCart() {
  try {
    return JSON.parse(sessionStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find((i) => String(i.id) === String(product.id));
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image_url: product.image_url,
      qty: 1,
    });
  }
  saveCart(cart);
  showToast(`تمت إضافة "${product.title}" إلى السلة`);
}

function cartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

function updateCartBadge() {
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = cartCount();
  });
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.__maliziaToastTimer);
  window.__maliziaToastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

document.addEventListener("DOMContentLoaded", updateCartBadge);
