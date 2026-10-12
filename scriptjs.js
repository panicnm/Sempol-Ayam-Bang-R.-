(function () {
  'use strict';

  var UNIT_PRICE = 1000;
  var WA_NUMBER = '6285286562298';
  var quantity = 10;

  var $ = function (id) { return document.getElementById(id); };
  var qtyInput = $('qtyInput'), nameInput = $('customerName'), notesInput = $('customerNotes');

  function formatIDR(n) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
  }

  function getOrderType() {
    return document.querySelector('input[name="order_type"]:checked').value;
  }

  function setQuantity(val) {
    val = parseInt(val, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 500) val = 500;
    quantity = val;
    render();
  }

  function render() {
    qtyInput.value = quantity;
    $('qtyLabel').textContent = quantity + ' Tusuk';
    $('sumQty').textContent = quantity + ' Tusuk';
    $('sumTotal').textContent = formatIDR(quantity * UNIT_PRICE);

    var name = nameInput.value.trim();
    var sumName = $('sumName');
    sumName.textContent = name || 'Belum diisi';
    sumName.classList.toggle('empty', !name);

    $('sumType').textContent = getOrderType();

    var notes = notesInput.value.trim();
    $('sumNotesRow').hidden = !notes;
    $('sumNotes').textContent = notes;

    document.querySelectorAll('#quickBtns button').forEach(function (b) {
      b.classList.toggle('active', parseInt(b.dataset.qty, 10) === quantity);
    });
    document.querySelectorAll('#orderTypes .radio').forEach(function (r) {
      r.classList.toggle('active', r.querySelector('input').checked);
    });
  }

  function getMessage() {
    return 'Halo Bang R., saya ingin memesan Sempol Ayam.\n\n' +
      'Nama: ' + (nameInput.value.trim() || '(Belum diisi)') + '\n' +
      'Menu: Sempol Ayam\n' +
      'Harga per tusuk: Rp1.000\n' +
      'Jumlah: ' + quantity + ' tusuk\n' +
      'Total harga produk: ' + formatIDR(quantity * UNIT_PRICE) + '\n' +
      'Jenis pesanan: ' + getOrderType() + '\n' +
      'Catatan: ' + (notesInput.value.trim() || '-') + '\n\n' +
      'Mohon konfirmasi ketersediaan, waktu pemesanan, dan opsi pengambilan atau pengantaran. Terima kasih!';
  }

  function sendWhatsApp(e) {
    if (e) e.preventDefault();
    if (!nameInput.value.trim()) {
      $('nameError').hidden = false;
      nameInput.classList.add('invalid');
      nameInput.focus();
      return;
    }
    $('nameError').hidden = true;
    nameInput.classList.remove('invalid');
    window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(getMessage()), '_blank', 'noopener,noreferrer');
  }

  function showToast() {
    var t = $('toast');
    t.hidden = false;
    setTimeout(function () { t.hidden = true; }, 3000);
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); showToast(); } catch (err) { console.error('Gagal menyalin teks', err); }
    document.body.removeChild(ta);
  }

  function copySummary() {
    var text = getMessage();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(showToast).catch(function () { fallbackCopy(text); });
    } else {
      fallbackCopy(text);
    }
  }

  // Events
  $('minusBtn').addEventListener('click', function () { setQuantity(quantity - 1); });
  $('plusBtn').addEventListener('click', function () { setQuantity(quantity + 1); });
  qtyInput.addEventListener('input', function () { setQuantity(qtyInput.value); });
  $('quickBtns').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-qty]');
    if (b) setQuantity(b.dataset.qty);
  });
  nameInput.addEventListener('input', function () {
    if (nameInput.value.trim()) { $('nameError').hidden = true; nameInput.classList.remove('invalid'); }
    render();
  });
  notesInput.addEventListener('input', render);
  document.querySelectorAll('input[name="order_type"]').forEach(function (r) { r.addEventListener('change', render); });
  $('orderForm').addEventListener('submit', sendWhatsApp);
  $('waBtn').addEventListener('click', sendWhatsApp);
  $('copyBtn').addEventListener('click', copySummary);

  // Mobile menu
  var nav = $('nav'), toggle = $('menuToggle');
  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    toggle.textContent = open ? '✕' : '☰';
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { nav.classList.remove('open'); toggle.textContent = '☰'; }
  });

  // Scroll spy
  var ids = ['beranda', 'keunggulan', 'menu', 'cara-pemesanan', 'kontak', 'lokasi'];
  window.addEventListener('scroll', function () {
    var pos = window.scrollY + 200;
    for (var i = 0; i < ids.length; i++) {
      var el = $(ids[i]);
      if (el && pos >= el.offsetTop && pos < el.offsetTop + el.offsetHeight) {
        document.querySelectorAll('.nav a[data-section]').forEach(function (a) {
          a.classList.toggle('active', a.dataset.section === ids[i]);
        });
        break;
      }
    }
  });

  // Image fallback
  document.querySelectorAll('img[data-fallback]').forEach(function (img) {
    img.addEventListener('error', function () {
      if (img.src !== img.dataset.fallback) img.src = img.dataset.fallback;
    });
  });

  $('year').textContent = new Date().getFullYear();
  render();
})();
