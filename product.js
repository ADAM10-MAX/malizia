/* ==========================================================================
   MALIZIA — Product detail logic
   ========================================================================== */

// 🛠️ دالة التطهير المفقودة لمنع أخطاء الـ ReferenceError وحماية الموقع
function escapeHtml(text) {
  if (!text) return '';
  return text
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getIdFromUrl() {
  return new URLSearchParams(window.location.search).get("id");
}

function renderProduct(product) {
  const root = document.getElementById("product-root");
  if (!product) {
    root.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">هذا المنتوج غير موجود.</div>`;
    return;
  }

  const img = product.image_url || "https://via.placeholder.com/700?text=Malizia";

  root.innerHTML = `
    <div class="pd-image">
      <img src="${img}" alt="${escapeHtml(product.title)}" />
    </div>
    <div>
      <p class="eyebrow">Malizia Collection</p>
      <h1 class="display-2" style="font-size:32px; margin-top:10px;">${escapeHtml(product.title)}</h1>
      <div class="pd-price-tag">${Number(product.price).toLocaleString()} MAD</div>
      <p class="pd-desc">${escapeHtml(product.ai_description || "وصف هذا المنتوج قيد الإعداد.")}</p>
      <div style="margin-top:30px;">
        <button id="add-to-cart-btn" class="btn btn-brass btn-block">🛒 سلة المشتريات</button>
      </div>
      <div class="pd-meta">
        شحن آمن · قطع مفحوصة يدويا · إرجاع خلال 14 يوما
      </div>
    </div>
  `;

  document.getElementById("add-to-cart-btn").addEventListener("click", () => {
    addToCart(product);
  });
}

async function loadProduct() {
  const id = getIdFromUrl();
  const root = document.getElementById("product-root");
  if (!id) {
    root.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">لم يتم تحديد أي منتوج.</div>`;
    return;
  }

  root.innerHTML = `
    <div class="pd-image skeleton"></div>
    <div>
      <div class="skeleton" style="height:16px; width:40%; margin-bottom:14px;"></div>
      <div class="skeleton" style="height:30px; width:70%; margin-bottom:20px;"></div>
      <div class="skeleton" style="height:100px; width:100%;"></div>
    </div>`;

  let product = null;

  // فحص وضع الديمو أو جلب البيانات الحية من Supabase
  if (!isDemoMode()) {
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
    if (error) {
      console.error(error);
    } else {
      product = data;
    }
  } else {
    await new Promise((r) => setTimeout(r, 250));
    product = getDemoProductById(id);
  }

  renderProduct(product);
}

document.addEventListener("DOMContentLoaded", loadProduct);
