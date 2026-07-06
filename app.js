/* ==========================================================================
   MALIZIA — Storefront homepage logic
   ========================================================================== */

function renderSkeletons(container, count = 6) {
  container.innerHTML = Array.from({ length: count })
    .map(
      () => `
      <div class="card">
        <div class="frame skeleton"></div>
        <div class="info">
          <div class="skeleton" style="height:14px; width:70%; margin-bottom:10px;"></div>
          <div class="skeleton" style="height:12px; width:40%;"></div>
        </div>
      </div>`
    )
    .join("");
}

function productCard(product, index) {
  const img = product.image_url || "https://via.placeholder.com/500x550?text=Malizia";
  return `
    <a class="card" href="product.html?id=${encodeURIComponent(product.id)}">
      <div class="frame">
        <span class="tag-index">N° ${String(index + 1).padStart(3, "0")}</span>
        <img src="${img}" alt="${escapeHtml(product.title)}" loading="lazy" />
      </div>
      <div class="info">
        <div class="title">${escapeHtml(product.title)}</div>
        <div class="price-row">
          <span class="price">${Number(product.price).toLocaleString()}</span>
        </div>
      </div>
    </a>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

async function loadProducts() {
  const grid = document.getElementById("product-grid");
  const countLabel = document.getElementById("product-count-label");
  renderSkeletons(grid);

  let products = [];

  if (!isDemoMode()) {
    const { data, error } = await sb
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading products:", error);
      grid.innerHTML = `<div class="empty-state">تعذر تحميل المنتوجات. تحقق من إعدادات Supabase.</div>`;
      return;
    }
    products = data || [];
  } else {
    // Demo mode: no Supabase credentials configured yet.
    await new Promise((r) => setTimeout(r, 350));
    products = DEMO_PRODUCTS;
  }

  if (!products.length) {
    grid.innerHTML = `<div class="empty-state">لا توجد منتوجات بعد. أضف أول منتوج من لوحة التحكم.</div>`;
    countLabel.textContent = "0 pieces";
    return;
  }

  grid.innerHTML = products.map((p, i) => productCard(p, i)).join("");
  countLabel.textContent = `${products.length} pieces`;
}

document.addEventListener("DOMContentLoaded", loadProducts);
