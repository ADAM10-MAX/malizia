/* ==========================================================================
   MALIZIA — Login logic

   SECURITY NOTE
   There is intentionally NO hardcoded admin email/password in this file.
   A string like `if (email === "admin" && password === "123")` living in
   client-side JS is visible to anyone via "View Source" and gives no real
   protection. Instead:

     1. Admins sign in through normal Supabase Auth (real email + password).
     2. After sign-in we check the `admins` table for that user's id.
     3. The real gate is the Row Level Security policy on the `products`
        table (see schema.sql) — even if someone bypassed this page
        entirely, Supabase itself would refuse writes from a non-admin.
   ========================================================================== */

function showNotice(message, isError = false) {
  const notice = document.getElementById("notice");
  notice.textContent = message;
  notice.className = "notice show" + (isError ? " error" : "");
}

function initTabs() {
  const tabs = document.querySelectorAll(".auth-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById("tab-customer").style.display = tab.dataset.tab === "customer" ? "block" : "none";
      document.getElementById("tab-admin").style.display = tab.dataset.tab === "admin" ? "block" : "none";
      document.getElementById("notice").classList.remove("show");
    });
  });
}

async function handleGoogleLogin() {
  if (isDemoMode()) {
    showNotice("Supabase غير مُهيّأ بعد — أضف بيانات مشروعك في js/supabase-client.js لتفعيل تسجيل الدخول عبر Google.", true);
    return;
  }
  const { error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + "/set-password.html",
    },
  });
  if (error) showNotice(error.message, true);
}

async function handleFacebookLogin() {
  if (isDemoMode()) {
    showNotice("Supabase غير مُهيّأ بعد — أضف بيانات مشروعك في js/supabase-client.js لتفعيل تسجيل الدخول عبر Facebook.", true);
    return;
  }
  const { error } = await sb.auth.signInWithOAuth({
    provider: "facebook",
    options: {
      redirectTo: window.location.origin + "/set-password.html",
    },
  });
  if (error) showNotice(error.message, true);
}

let customerMode = "signin"; // "signin" | "signup"

function toggleCustomerMode() {
  customerMode = customerMode === "signin" ? "signup" : "signin";
  const btn = document.getElementById("customer-submit-btn");
  const toggleLink = document.getElementById("toggle-mode-link");
  if (customerMode === "signup") {
    btn.textContent = "Create account";
    toggleLink.textContent = "عندك حساب؟ سجل الدخول";
  } else {
    btn.textContent = "Sign in";
    toggleLink.textContent = "ليس لديك حساب؟ أنشئ واحدا";
  }
  document.getElementById("notice").classList.remove("show");
}

async function handleCustomerPasswordLogin(e) {
  e.preventDefault();
  const email = document.getElementById("c-email").value.trim();
  const password = document.getElementById("c-password").value;

  if (isDemoMode()) {
    showNotice("Supabase غير مُهيّأ بعد. هذا نموذج توضيحي فقط.", true);
    return;
  }

  if (customerMode === "signup") {
    // Real account creation for regular customers (email + password),
    // as an alternative to Google sign-in.
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) {
      showNotice(error.message, true);
      return;
    }
    if (data.session) {
      // Email confirmation was not required — user is already logged in.
      window.location.href = "index.html";
    } else {
      showNotice("تم إنشاء الحساب. تحقق من بريدك الإلكتروني لتأكيد الحساب قبل تسجيل الدخول.");
    }
    return;
  }

  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    showNotice("بيانات الدخول غير صحيحة. تحقق من البريد وكلمة السر، أو أنشئ حسابا جديدا إذا لم تكن مسجلا بعد.", true);
    return;
  }
  window.location.href = "index.html";
}

async function handleForgotPassword(e) {
  e.preventDefault();
  const email = document.getElementById("c-email").value.trim();
  if (!email) {
    showNotice("أدخل بريدك الإلكتروني أولاً في الحقل أعلاه، ثم اضغط على 'Forgot password?' مجددا.", true);
    return;
  }
  if (isDemoMode()) {
    showNotice("Supabase غير مُهيّأ بعد — رابط إعادة تعيين كلمة السر سيُرسل فعليا بمجرد ربط المشروع.", true);
    return;
  }
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/reset-password.html",
  });
  if (error) {
    showNotice(error.message, true);
  } else {
    showNotice("تم إرسال رابط إعادة تعيين كلمة السر إلى بريدك الإلكتروني.");
  }
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const email = document.getElementById("a-email").value.trim();
  const password = document.getElementById("a-password").value;

  if (isDemoMode()) {
    showNotice(
      "Supabase غير مُهيّأ بعد. أضف SUPABASE_URL و SUPABASE_ANON_KEY في js/supabase-client.js، ثم أنشئ حساب مسؤول حقيقي وأضفه لجدول admins (راجع schema.sql).",
      true
    );
    return;
  }

  // 1. Real Supabase Auth sign-in (no hardcoded credentials).
  const { data: signInData, error: signInError } = await sb.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    showNotice("بيانات الدخول غير صحيحة.", true);
    return;
  }

  // 2. Confirm this user is actually listed as an admin.
  //    RLS on `admins` only lets a user read their own row, so this check
  //    can't be spoofed from the browser.
  const { data: adminRow, error: adminError } = await sb
    .from("admins")
    .select("user_id")
    .eq("user_id", signInData.user.id)
    .maybeSingle();

  if (adminError || !adminRow) {
    await sb.auth.signOut();
    showNotice("هذا الحساب لا يتوفر على صلاحيات الإدارة.", true);
    return;
  }

  window.location.href = "admin.html";
}

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  document.getElementById("google-btn").addEventListener("click", handleGoogleLogin);
  document.getElementById("facebook-btn").addEventListener("click", handleFacebookLogin);
  document.getElementById("customer-password-form").addEventListener("submit", handleCustomerPasswordLogin);
  document.getElementById("toggle-mode-link").addEventListener("click", (e) => {
    e.preventDefault();
    toggleCustomerMode();
  });
  document.getElementById("forgot-password-link").addEventListener("click", handleForgotPassword);
  document.getElementById("admin-login-form").addEventListener("submit", handleAdminLogin);
});
