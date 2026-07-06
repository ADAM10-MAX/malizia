/* ==========================================================================
   MALIZIA — Admin dashboard logic

   ACCESS GUARD
   This page checks (1) that a real Supabase session exists, and (2) that
   the signed-in user's id is present in the `admins` table. There is no
   password shortcut here — if someone opens admin.html directly without
   a valid admin session, they're bounced back to login.html. Even that
   guard is just a UX convenience; the real protection is the Row Level
   Security policy on `products` (see schema.sql), which Supabase enforces
   server-side regardless of what happens in this file.
   ========================================================================== */

let uploadedImageDataUrl = null; // background-removed image (data URL) ready to publish
let currentTitle = "";

/* ---------------- Access guard ---------------- */

async function guardAdminAccess() {
  if (isDemoMode()) {
    document.getElementById("admin-email").textContent = "demo mode — no Supabase configured";
    document.getElementById("stat-mode").textContent = "Demo (local)";
    return true;
  }

  const { data: userData } = await sb.auth.getUser();
  if (!userData?.user) {
    window.location.href = "login.html";
    return false;
  }

  const { data: adminRow } = await sb
    .from("admins")
    .select("user_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (!adminRow) {
    await sb.auth.signOut();
    window.location.href = "login.html";
    return false;
  }

  document.getElementById("admin-email").textContent = userData.user.email;
  document.getElementById("stat-mode").textContent = "Live (Supabase)";
  return true;
}

/* ---------------- Simulated AI background removal ----------------
   A real implementation would call a background-removal API (e.g.
   remove.bg, or a Supabase Edge Function wrapping one) and store the
   returned image. Here we simulate the *effect* entirely client-side:
   we flood-fill outward from the image corners, turning any pixels
   that are close in color to the corner (usually the background) fully
   transparent, so the admin sees an immediate "background removed"
   preview without needing an API key.
------------------------------------------------------------------- */

function simulateBackgroundRemoval(imgEl) {
  const canvas = document.createElement("canvas");
  const w = (canvas.width = imgEl.naturalWidth);
  const h = (canvas.height = imgEl.naturalHeight);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imgEl, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const sampleAt = (x, y) => {
    const i = (y * w + x) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const corners = [sampleAt(0, 0), sampleAt(w - 1, 0), sampleAt(0, h - 1), sampleAt(w - 1, h - 1)];
  const bg = corners[0]; // approximate background color
  const threshold = 32;

  for (let i = 0; i < data.length; i += 4) {
    const dr = data[i] - bg[0];
    const dg = data[i + 1] - bg[1];
    const db = data[i + 2] - bg[2];
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    if (dist < threshold) {
      data[i + 3] = 0; // fully transparent
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

function handleImageUpload(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const processed = simulateBackgroundRemoval(img);
      uploadedImageDataUrl = processed;

      document.getElementById("preview-img").src = processed;
      document.getElementById("upload-preview").classList.add("show");
      document.getElementById("bg-badge").style.display = "inline-flex";
      document.getElementById("upload-label").textContent = "✓ تم رفع الصورة — اضغط لتغييرها";
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* ---------------- AI description generator (template-based) ----------------
   No external AI API key is wired up here. This produces a genuinely
   varied Arabic marketing description from the product title using a
   small set of rotating phrase templates — enough to demo the feature
   end-to-end. Swap generateDescription() for a real call to Claude/OpenAI
   once you have an API key (ideally from a server/Edge Function, never
   with a secret key exposed in this file).
------------------------------------------------------------------------- */

function generateDescription(title) {
  const openers = [
    `قطعة "${title}" تجمع بين البساطة والفخامة`,
    `تصميم "${title}" مستوحى من الحرفية الأصيلة`,
    `"${title}" — إضافة أنيقة تعكس ذوقا راقيا`,
  ];
  const middles = [
    "بخامات مختارة بعناية ولمسات نهائية دقيقة",
    "تفاصيلها اليدوية تمنحها طابعا مميزا لا يتكرر",
    "تصميمها الهادئ يتناغم مع مختلف أنماط الديكور",
  ];
  const closers = [
    "لتحول أي ركن في منزلك إلى مساحة تستحق التأمل.",
    "قطعة تضيف دفئا وأناقة لكل من يراها.",
    "اختيار مثالي لمن يبحث عن التميز في التفاصيل الصغيرة.",
  ];
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  return `${pick(openers)}، ${pick(middles)}. ${pick(closers)}`;
}

function handleGenerateDescription() {
  const title = document.getElementById("p-title").value.trim();
  const box = document.getElementById("ai-desc-box");
  if (!title) {
    box.textContent = "أدخل عنوان المنتوج أولا.";
    return;
  }
  box.textContent = "جارٍ التوليد…";
  setTimeout(() => {
    box.textContent = generateDescription(title);
  }, 500);
}

/* ---------------- Publish ---------------- */

function sanitizeFileName(str) {
  return (
    str
      .trim()
      .toLowerCase()
      // Replace any character that's not a-z, 0-9, dash, or underscore
      // (this strips Arabic text, accents, spaces, punctuation, etc.)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "product"
  );
}

async function uploadImageToStorage(dataUrl, title) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const fileName = `${Date.now()}-${sanitizeFileName(title)}.png`;

  const { data, error } = await sb.storage.from(PRODUCT_BUCKET).upload(fileName, blob, {
    contentType: "image/png",
    upsert: false,
  });
  if (error) throw error;

  const { data: publicUrlData } = sb.storage.from(PRODUCT_BUCKET).getPublicUrl(data.path);
  return publicUrlData.publicUrl;
}

async function handlePublish(e) {
  e.preventDefault();
  const errorEl = document.getElementById("form-error");
  errorEl.style.display = "none";

  const title = document.getElementById("p-title").value.trim();
  const price = parseFloat(document.getElementById("p-price").value);
  const description = document.getElementById("ai-desc-box").textContent.trim();

  if (!title || !price || !uploadedImageDataUrl) {
    errorEl.textContent = "يرجى تعبئة العنوان والسعر ورفع صورة قبل النشر.";
    errorEl.style.display = "block";
    return;
  }

  const publishBtn = document.getElementById("publish-btn");
  publishBtn.disabled = true;
  publishBtn.textContent = "Publishing…";

  try {
    if (isDemoMode()) {
      await new Promise((r) => setTimeout(r, 600));
      DEMO_PRODUCTS.unshift({
        id: "local-" + Date.now(),
        title,
        price,
        image_url: uploadedImageDataUrl,
        ai_description: description,
        created_at: new Date().toISOString(),
      });
      showAdminToast("تم النشر محليا (وضع تجريبي — بدون Supabase).");
      resetForm();
      loadRecentProducts();
      return;
    }

    const imageUrl = await uploadImageToStorage(uploadedImageDataUrl, title);

    const { error } = await sb.from("products").insert({
      title,
      price,
      image_url: imageUrl,
      ai_description: description,
    });
    if (error) throw error;

    showAdminToast("تم نشر المنتوج بنجاح. الصفحة الرئيسية تحدثت مباشرة.");
    resetForm();
    loadRecentProducts();
  } catch (err) {
    console.error(err);
    errorEl.textContent = "حدث خطأ أثناء النشر: " + (err.message || err);
    errorEl.style.display = "block";
  } finally {
    publishBtn.disabled = false;
    publishBtn.textContent = "Publish product";
  }
}

function showAdminToast(msg) {
  showToastFallback(msg);
}
function showToastFallback(msg) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function resetForm() {
  document.getElementById("product-form").reset();
  document.getElementById("upload-preview").classList.remove("show");
  document.getElementById("bg-badge").style.display = "none";
  document.getElementById("upload-label").textContent = "📷 اضغط لرفع صورة المنتوج";
  document.getElementById("ai-desc-box").textContent = "اضغط الزر أعلاه بعد كتابة عنوان المنتوج لتوليد وصف تلقائي.";
  uploadedImageDataUrl = null;
}

/* ---------------- Orders (checkout requests to call back) ---------------- */

async function loadOrders() {
  const list = document.getElementById("orders-list");
  if (isDemoMode()) {
    list.innerHTML = `<div class="foot-note">الطلبات تحتاج Supabase مفعّل لتظهر هنا.</div>`;
    return;
  }

  const { data, error } = await sb
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    list.innerHTML = `<div class="foot-note">تعذر تحميل الطلبات.</div>`;
    console.error(error);
    return;
  }

  if (!data || !data.length) {
    list.innerHTML = `<div class="foot-note">لا توجد طلبات جديدة.</div>`;
    return;
  }

  list.innerHTML = data
    .map((order) => {
      const itemsSummary = (order.items || []).map((i) => `${i.title} ×${i.qty}`).join("، ");
      const isDone = order.status === "تم الاتصال";
      return `
      <div class="order-row" data-order-id="${order.id}">
        <div class="top">
          <span class="name">${escapeAdminHtml(order.customer_name)}</span>
          <span class="total">${Number(order.total).toLocaleString()} MAD</span>
        </div>
        <div class="items">${escapeAdminHtml(itemsSummary)}</div>
        <div class="actions">
          <a class="call-link" href="tel:${order.phone}">📞 ${order.phone}</a>
          <span class="status-pill ${isDone ? "done" : ""}">${order.status}</span>
          ${
            !isDone
              ? `<button type="button" class="btn btn-outline mark-called-btn" style="padding:6px 12px; font-size:11px;" data-order-id="${order.id}">تم الاتصال</button>`
              : ""
          }
        </div>
      </div>`;
    })
    .join("");

  list.querySelectorAll(".mark-called-btn").forEach((btn) => {
    btn.addEventListener("click", () => markOrderCalled(btn.dataset.orderId));
  });
}

async function markOrderCalled(orderId) {
  const { error } = await sb.from("orders").update({ status: "تم الاتصال" }).eq("id", orderId);
  if (error) {
    console.error(error);
    return;
  }
  loadOrders();
}

function escapeAdminHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

/* ---------------- Recent products / stats ---------------- */

async function loadRecentProducts() {
  const list = document.getElementById("recent-products");
  let products = [];

  if (isDemoMode()) {
    products = DEMO_PRODUCTS;
  } else {
    const { data, error } = await sb.from("products").select("*").order("created_at", { ascending: false }).limit(6);
    if (!error) products = data || [];
  }

  document.getElementById("stat-total").textContent = products.length;

  if (!products.length) {
    list.innerHTML = `<div class="foot-note">لا توجد منتوجات بعد.</div>`;
    return;
  }

  list.innerHTML = products
    .map(
      (p) => `
    <div class="admin-product-row">
      <div class="thumb"><img src="${p.image_url}" alt=""/></div>
      <div class="name">${p.title}</div>
      <div class="price">${Number(p.price).toLocaleString()}</div>
    </div>`
    )
    .join("");
}

/* ---------------- Wire up ---------------- */

document.addEventListener("DOMContentLoaded", async () => {
  const ok = await guardAdminAccess();
  if (!ok) return;

  loadRecentProducts();
  loadOrders();

  const uploadZone = document.getElementById("upload-zone");
  const fileInput = document.getElementById("p-image");
  uploadZone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => {
    if (e.target.files[0]) handleImageUpload(e.target.files[0]);
  });

  document.getElementById("gen-desc-btn").addEventListener("click", handleGenerateDescription);
  document.getElementById("product-form").addEventListener("submit", handlePublish);

  document.getElementById("logout-btn").addEventListener("click", async () => {
    if (!isDemoMode()) await sb.auth.signOut();
    window.location.href = "login.html";
  });
});
