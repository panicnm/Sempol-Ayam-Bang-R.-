/* ===== Configuration (edit these to customize) ===== */
const CONFIG = {
  productName: "Sempol Ayam",
  unitPrice: 1000,            // harga per tusuk (IDR)
  minQty: 1,
  maxQty: 500,
  defaultQty: 10,
  whatsappNumber: "6285286562298", // digits only, with country code
};

(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
  const fmt = (n) => rupiah.format(n).replace(/\s/g, "");

  /* ---------- Elements ---------- */
  const qtyInput = $("#qty-input");
  const qtyError = $("#qty-error");
  const nameInput = $("#customer-name");
  const nameError = $("#name-error");
  const notesInput = $("#customer-notes");
  const orderText = $("#order-text");
  const copyStatus = $("#copy-status");
  const waNote = $("#wa-note");

  let qty = CONFIG.defaultQty;
  let qtyValid = true;

  /* ---------- Helpers ---------- */
  function parseQty(value) {
    const str = String(value).trim();
    if (!/^\d+$/.test(str)) return null; // rejects decimals, negatives, text, empty
    const n = Number(str);
    return n >= CONFIG.minQty && n <= CONFIG.maxQty ? n : null;
  }

  function getOrderType() {
    const checked = document.querySelector('input[name="order-type"]:checked');
    return checked ? checked.value : "Konfirmasi pesanan dengan penjual";
  }

  function buildMessage() {
    const notes = notesInput.value.trim() || "-";
    return [
      "Halo Bang R., saya ingin memesan " + CONFIG.productName + ".",
      "",
      "Nama: " + (nameInput.value.trim() || "-"),
      "Menu: " + CONFIG.productName,
      "Harga per tusuk: " + fmt(CONFIG.unitPrice),
      "Jumlah: " + qty + " tusuk",
      "Total harga produk: " + fmt(qty * CONFIG.unitPrice),
      "Jenis pesanan: " + getOrderType(),
      "Catatan: " + notes,
      "",
      "Mohon konfirmasi ketersediaan, waktu pemesanan, dan opsi pengambilan atau pengantaran. Terima kasih!",
    ].join("\n");
  }

  function waUrl(message) {
    const base = "https://wa.me/" + CONFIG.whatsappNumber;
    return message ? base + "?text=" + encodeURIComponent(message) : base;
  }

  function openExternal(url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  /* ---------- Rendering ---------- */
  function render() {
    $("#sum-unit").textContent = fmt(CONFIG.unitPrice);
    $("#sum-qty").textContent = qtyValid ? qty + " tusuk" : "–";
    $("#sum-total").textContent = qtyValid ? fmt(qty * CONFIG.unitPrice) : "–";
    $("#sum-name").textContent = nameInput.value.trim() || "–";
    $("#sum-type").textContent = getOrderType();
    $("#sum-notes").textContent = notesInput.value.trim() || "–";
    orderText.value = qtyValid ? buildMessage() : "Jumlah tusuk belum valid.";
    copyStatus.textContent = "";
  }

  function setQty(n) {
    qty = n;
    qtyValid = true;
    qtyInput.value = String(n);
    qtyInput.classList.remove("invalid");
    qtyError.textContent = "";
    render();
  }

  /* ---------- Quantity stepper ---------- */
  $("#qty-minus").addEventListener("click", () => {
    const current = parseQty(qtyInput.value) ?? qty;
    setQty(Math.max(CONFIG.minQty, current - 1));
  });
  $("#qty-plus").addEventListener("click", () => {
    const current = parseQty(qtyInput.value) ?? qty;
    setQty(Math.min(CONFIG.maxQty, current + 1));
  });
  qtyInput.addEventListener("input", () => {
    const n = parseQty(qtyInput.value);
    if (n === null) {
      qtyValid = false;
      qtyInput.classList.add("invalid");
      qtyError.textContent = "Jumlah harus bilangan bulat antara " + CONFIG.minQty + " dan " + CONFIG.maxQty + " tusuk.";
      render();
    } else {
      setQty(n);
      qtyInput.value = String(n); // normalise e.g. "007" -> "7"
    }
  });
  qtyInput.addEventListener("blur", () => {
    if (!qtyValid) setQty(qty); // restore last valid value
  });

  /* ---------- Other fields ---------- */
  nameInput.addEventListener("input", () => {
    if (nameInput.value.trim()) {
      nameInput.classList.remove("invalid");
      nameError.textContent = "";
    }
    render();
  });
  notesInput.addEventListener("input", render);
  document.querySelectorAll('input[name="order-type"]').forEach((r) => r.addEventListener("change", render));
  $("#order-form").addEventListener("submit", (e) => e.preventDefault());

  /* ---------- Validation + WhatsApp ---------- */
  function validate() {
    let ok = true;
    if (!qtyValid || parseQty(qtyInput.value) === null) {
      qtyError.textContent = "Masukkan jumlah tusuk yang valid (" + CONFIG.minQty + "–" + CONFIG.maxQty + ").";
      qtyInput.classList.add("invalid");
      qtyInput.focus();
      ok = false;
    }
    if (!nameInput.value.trim()) {
      nameError.textContent = "Nama pemesan wajib diisi.";
      nameInput.classList.add("invalid");
      if (ok) nameInput.focus();
      ok = false;
    }
    return ok;
  }

  const waBtn = $("#wa-submit");
  waBtn.addEventListener("click", () => {
    if (!validate()) return;
    const original = waBtn.textContent;
    waBtn.disabled = true;
    waBtn.textContent = "Membuka WhatsApp…";
    openExternal(waUrl(buildMessage()));
    waNote.textContent = "WhatsApp dibuka di tab baru. Tekan Kirim di WhatsApp agar pesan sampai ke penjual. Pesanan belum dikonfirmasi sampai penjual membalas.";
    setTimeout(() => {
      waBtn.disabled = false;
      waBtn.textContent = original;
    }, 1500);
  });

  // Hero button: full message if the form is ready, otherwise a simple greeting
  $("#hero-wa").addEventListener("click", () => {
    if (nameInput.value.trim() && qtyValid) {
      openExternal(waUrl(buildMessage()));
    } else {
      const greeting = "Halo Bang R., saya ingin memesan " + CONFIG.productName + ". Mohon info ketersediaannya. Terima kasih!";
      openExternal(waUrl(greeting));
    }
  });

  /* ---------- Copy summary (Instagram) ---------- */
  $("#copy-btn").addEventListener("click", async () => {
    if (!validate()) {
      copyStatus.textContent = "";
      return;
    }
    const text = orderText.value;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error("clipboard unavailable");
      }
      copyStatus.textContent = "Ringkasan tersalin. Tempel di DM Instagram.";
    } catch (err) {
      orderText.focus();
      orderText.select();
      try { document.execCommand("copy"); } catch (_) { /* ignore */ }
      copyStatus.textContent = "Teks sudah dipilih. Salin manual dengan Ctrl+C atau tekan lama lalu Salin.";
    }
  });

  /* ---------- Mobile menu ---------- */
  const toggle = $("#menu-toggle");
  const nav = $("#main-nav");
  function setMenu(open) {
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Tutup menu navigasi" : "Buka menu navigasi");
  }
  toggle.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  /* ---------- Active section highlight ---------- */
  const links = Array.from(nav.querySelectorAll("a:not(.btn)"));
  const sections = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id));
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach((s) => io.observe(s));

    // Hide the bottom CTA while the order section is on screen
    const cta = $("#bottom-cta");
    const menuSection = $("#menu");
    new IntersectionObserver((entries) => {
      cta.classList.toggle("hide", entries[0].isIntersecting);
    }, { threshold: 0.15 }).observe(menuSection);
  }

  /* ---------- Image fallback ---------- */
  document.querySelectorAll("img[data-fallback]").forEach((img) => {
    const showFallback = () => {
      img.hidden = true;
      const fb = img.parentElement.querySelector(".img-fallback");
      if (fb) fb.hidden = false;
    };
    img.addEventListener("error", showFallback);
    if (img.complete && img.naturalWidth === 0) showFallback();
  });

  /* ---------- Init ---------- */
  $("#year").textContent = new Date().getFullYear();
  setQty(CONFIG.defaultQty);
})();
