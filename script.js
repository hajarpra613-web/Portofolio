/**
 * Interactive Portfolio Logic (GitHub Pages & LocalStorage Compatible, Syncs with Google Sheets)
 */

// Google Apps Script Web App URL
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx2pnCswca1SI2s0wDRJRYKJfenoncxJEXBlhbK4sbBo_rp8IvhsvY7Jz6p0-L4mJxf/exec";

// Initial Seed Data
const DEFAULT_DATA = {
  profile: {
    name: "Nama Lengkap Anda",
    title: "HR Admin & Data Entry Specialist",
    bio: "Lulusan berdedikasi dengan pengalaman magang di bidang administrasi, pengolahan data, serta manajemen dokumen profesional.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    linkedin: "https://linkedin.com",
    email: "mailto:email@example.com"
  },
  items: [
    {
      id: "exp-1",
      category: "pengalaman",
      title: "HR & Admin Staff",
      subtitle: "PT Digital Indo",
      period: "Jan - Apr 2024",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80",
      description: "• Mengelola data absensi karyawan.\n• Menyusun rekapitulasi data lembur & operasional harian.",
      mainCaption: "Dokumentasi kegiatan koordinasi tim administrasi dan pengolahan data absensi harian.",
      gallery: [
        {
          image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=80",
          caption: "Pengolahan & rekapitulasi data absensi dan kalkulasi lembur."
        },
        {
          image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&auto=format&fit=crop&q=80",
          caption: "Penyelenggaraan briefing harian dan manajemen berkas kerja."
        }
      ]
    },
    {
      id: "exp-2",
      category: "pengalaman",
      title: "Data Entry Asst.",
      subtitle: "Dinas Kominfo",
      period: "Ags - Nov 2023",
      image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80",
      description: "• Digitalisasi 500+ dokumen fisik.\n• Validasi & verifikasi entri data ke sistem arsip digital.",
      mainCaption: "Proses scanning, verifikasi, dan digitalisasi arsip fisik ke sistem database pusat.",
      gallery: [
        {
          image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80",
          caption: "Audit & pencocokan data digital dengan dokumen fisik."
        },
        {
          image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&auto=format&fit=crop&q=80",
          caption: "Penyusunan laporan rekapitulasi entri mingguan."
        }
      ]
    },
    {
      id: "cert-1",
      category: "sertifikat",
      title: "HR Management Certificate",
      subtitle: "Coursera / HR Institute",
      period: "2024",
      image: "https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=600&auto=format&fit=crop&q=80",
      description: "Sub-penjelasan: Dasar Rekrutmen, Hubungan Industrial, dan Pengelolaan Kinerja Karyawan."
    },
    {
      id: "cert-2",
      category: "sertifikat",
      title: "Google Data Analytics",
      subtitle: "Google Professional Cert.",
      period: "2023",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80",
      description: "Sub-penjelasan: Pembersihan, Analisis, dan Visualisasi Data Spreadsheet & SQL."
    }
  ]
};

// State App
// Load admin PIN from localStorage if set, otherwise default to "Hajar1234"
const savedStateJson = localStorage.getItem("portfolio_data");
let state = {
  isAdmin: false,
  adminPin: localStorage.getItem("admin_pin") || "Hajar1234",
  data: null
};

// Tracking waktu editan lokal terakhir untuk proteksi overwrite
let lastLocalEditTime = 0;

if (savedStateJson) {
  try {
    state.data = JSON.parse(savedStateJson);
  } catch (error) {
    console.warn('[Portfolio] Data localStorage rusak, mengatur ulang ke default:', error);
    localStorage.removeItem('portfolio_data');
    state.data = null;
  }
}

// DOM Elements (Admin elements - hidden from public)
const adminExitBtn  = document.getElementById("adminExitBtn");
const adminActiveBadge = document.getElementById("adminActiveBadge");

const loginModal = document.getElementById("loginModal");
const closeLoginModal = document.getElementById("closeLoginModal");
const loginForm = document.getElementById("loginForm");
const adminPinInput = document.getElementById("adminPin");

const itemModal = document.getElementById("itemModal");
const closeItemModal = document.getElementById("closeItemModal");
const itemForm = document.getElementById("itemForm");
const itemModalTitle = document.getElementById("itemModalTitle");

const lightboxModal = document.getElementById("lightboxModal");
const closeLightboxModal = document.getElementById("closeLightboxModal");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxCaption = document.getElementById("lightboxCaption");

const addExpBtn = document.getElementById("addExpBtn");
const addCertBtn = document.getElementById("addCertBtn");
const editAvatarBtn = document.getElementById("editAvatarBtn");
const editProfileBtn = document.getElementById("editProfileBtn");
const forceSyncBtn = document.getElementById("forceSyncBtn");

const profileModal = document.getElementById("profileModal");
const closeProfileModal = document.getElementById("closeProfileModal");
const profileForm = document.getElementById("profileForm");
const profileNameInput = document.getElementById("profileNameInput");
const profileTitleInput = document.getElementById("profileTitleInput");
const profileBioInput = document.getElementById("profileBioInput");
const profileAvatarFileInput = document.getElementById("profileAvatarFileInput");
const profileAvatarUrlInput = document.getElementById("profileAvatarUrlInput");
const profileLinkedinInput = document.getElementById("profileLinkedinInput");
const profileEmailInput = document.getElementById("profileEmailInput");

// Helper untuk Google Drive View Link Conversion & Base64 handling
function formatDriveUrl(url) {
  if (!url) return '';
  if (typeof url === 'string' && url.startsWith('data:image/')) return url;

  let fileId = null;
  if (url.includes('drive.google.com') && url.includes('id=')) {
    fileId = url.split('id=')[1].split('&')[0];
  } else if (url.includes('drive.google.com/file/d/')) {
    fileId = url.split('/file/d/')[1].split('/')[0];
  } else if (url.includes('lh3.googleusercontent.com/d/')) {
    fileId = url.split('lh3.googleusercontent.com/d/')[1].split('=')[0];
  } else if (url.includes('drive.google.com/thumbnail?id=')) {
    fileId = url.split('thumbnail?id=')[1].split('&')[0];
  } else if (url.includes('drive.google.com/uc') && url.includes('id=')) {
    fileId = url.split('id=')[1].split('&')[0];
  }

  if (fileId) {
    // Gunakan thumbnail Google Drive yang kompatibel lintas browser & lintas device
    // Format lh3.googleusercontent.com lebih stabil dari uc?export=view
    return 'https://lh3.googleusercontent.com/d/' + fileId + '=w800';
  }
  return url;
}

/**
 * Upload Base64 image ke Google Drive via Google Apps Script Web App.
 * Mengembalikan Promise<string> berisi URL Drive jika berhasil, atau null jika gagal.
 * Ini memastikan gambar tersimpan di cloud (Drive), bukan hanya base64 lokal,
 * sehingga browser lain juga bisa melihat gambar yang sama.
 */
function uploadImageToAppsScript(base64Data, fileName) {
  return new Promise(function(resolve) {
    if (!base64Data || !base64Data.startsWith('data:image/')) {
      resolve(null);
      return;
    }
    if (typeof APPS_SCRIPT_URL === 'undefined' || !APPS_SCRIPT_URL) {
      resolve(null);
      return;
    }

    // Menggunakan URLSearchParams agar dijamin diterima oleh Apps Script doPost tanpa terbentur CORS Preflight
    const params = new URLSearchParams();
    params.append('action', 'uploadFile');
    params.append('base64', base64Data);
    params.append('fileName', fileName || 'uploaded_image.jpg');

    fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    })
    .then(function(res) {
      return res.json();
    })
    .then(function(result) {
      if (result && result.success && result.url) {
        console.log('[Portfolio] Gambar berhasil diupload ke Google Drive:', result.url);
        resolve(result.url);
      } else {
        console.warn('[Portfolio] Upload ke Drive gagal:', result && result.error);
        resolve(null);
      }
    })
    .catch(function(err) {
      console.warn('[Portfolio] Upload gambar via POST gagal, mencoba GET fallback...', err);
      resolve(null);
    });
  });
}

// Compress image file dengan kualitas HD & proteksi kualitas gambar asli
function compressImageFile(file, maxWidth, maxHeight, quality, callback) {
  maxWidth = maxWidth || 2000;
  maxHeight = maxHeight || 2000;
  quality = quality || 0.9;

  if (!file || !file.type || !file.type.startsWith('image/')) {
    callback(null);
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const rawBase64 = e.target.result;

    // Semua gambar akan di-resize secara proporsional sesuai resolusi maksimal (misal 1200x900)
    // agar ukuran Base64 tetap ringan namun kualitas tetap tajam (HD).

    const img = new Image();
    img.onload = function() {
      function processCanvas(w, h, q) {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        return canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', q);
      }

      let w = img.width;
      let h = img.height;
      if (w > maxWidth || h > maxHeight) {
        if (w / h > maxWidth / maxHeight) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        } else {
          w = Math.round((w * maxHeight) / h);
          h = maxHeight;
        }
      }

      let dataUrl = processCanvas(w, h, quality);
      callback(dataUrl);
    };
    img.onerror = function() {
      callback(rawBase64);
    };
    img.src = rawBase64;
  };
  reader.onerror = function() {
    callback(null);
  };
  reader.readAsDataURL(file);
}

// Render Header & Profile Data
function renderProfile() {
  const p = state.data.profile;
  document.getElementById("profileName").innerText = p.name;
  document.getElementById("profileTitle").innerText = p.title;
  document.getElementById("profileBio").innerText = p.bio;
  document.getElementById("profileImage").src = formatDriveUrl(p.avatar);
  document.getElementById("navBrandName").innerText = p.name;

  if (p.linkedin) document.getElementById("linkedinLink").href = p.linkedin;
  if (p.email) {
    const emailLink = document.getElementById("emailLink");
    const email = p.email.startsWith('mailto:') ? p.email.slice(7) : p.email;
    emailLink.href = 'mailto:' + email;
    emailLink.textContent = email;
  }
}

// Global Carousel Animation Timers Map
let activeCarouselTimers = new Map();

function startCarouselAnimation(boxEl) {
  if (!boxEl || activeCarouselTimers.has(boxEl)) return;

  const slides = boxEl.querySelectorAll('.carousel-slide');
  const dots = boxEl.querySelectorAll('.carousel-dot');
  if (slides.length <= 1) return;

  let currentIdx = 0;

  function scheduleNextSlide() {
    // Gambar 1 (awal): Tampil selama 6000ms (6 detik). Gambar 2/3: Tampil 3000ms (3 detik)
    const delay = currentIdx === 0 ? 6000 : 3000;

    const timerId = setTimeout(function() {
      slides[currentIdx].classList.remove('active');
      if (dots[currentIdx]) dots[currentIdx].classList.remove('active');

      currentIdx = (currentIdx + 1) % slides.length;

      slides[currentIdx].classList.add('active');
      if (dots[currentIdx]) dots[currentIdx].classList.add('active');

      scheduleNextSlide();
    }, delay);

    activeCarouselTimers.set(boxEl, timerId);
  }

  scheduleNextSlide();
}

function stopCarouselAnimation(boxEl) {
  if (activeCarouselTimers.has(boxEl)) {
    clearTimeout(activeCarouselTimers.get(boxEl));
    activeCarouselTimers.delete(boxEl);
  }
}

// Observer otomatis untuk memutar/menghentikan slider foto saat pengguna menggeser ke kartu pengalaman
function initExperienceSliderObserver() {
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      const carouselBoxes = entry.target.querySelectorAll('.auto-carousel-box');
      if (entry.isIntersecting) {
        carouselBoxes.forEach(function(box) {
          startCarouselAnimation(box);
        });
      } else {
        carouselBoxes.forEach(function(box) {
          stopCarouselAnimation(box);
        });
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.exp-card').forEach(function(card) {
    observer.observe(card);
  });
}

// Global click handler untuk membuka gambar yang sedang aktif di Lightbox
window.handleCarouselClick = function(boxEl, title) {
  const activeSlide = boxEl.querySelector('.carousel-slide.active') || boxEl.querySelector('.carousel-slide');
  if (activeSlide && activeSlide.src) {
    openLightbox(activeSlide.src, title);
  }
};

// Generator Markup Slot Foto (Dukungan 1 foto biasa ATAU 2-3 foto dengan Auto-Slideshow & Dots)
function createImageSlotMarkup(rawImagesData, altTitle, wrapperClass) {
  let images = [];
  if (Array.isArray(rawImagesData)) {
    images = rawImagesData.filter(Boolean);
  } else if (typeof rawImagesData === 'string' && rawImagesData.trim()) {
    if (rawImagesData.includes(',')) {
      images = rawImagesData.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
    } else {
      images = [rawImagesData.trim()];
    }
  }

  // Maksimal 3 foto per slot sesuai permintaan
  images = images.slice(0, 3);

  if (images.length === 0) {
    const fallback = 'https://placehold.co/600x400/2a2a35/a0a0b0?text=Foto+Gagal+Dimuat';
    return '<div class="' + wrapperClass + '" onclick="openLightbox(\'' + fallback + '\', \'' + altTitle + '\')">' +
             '<img src="' + fallback + '" alt="' + altTitle + '">' +
           '</div>';
  }

  if (images.length === 1) {
    const singleImg = formatDriveUrl(images[0]);
    return '<div class="' + wrapperClass + '" onclick="openLightbox(\'' + singleImg + '\', \'' + altTitle + '\')">' +
             '<img src="' + singleImg + '" alt="' + altTitle + '" onerror="this.src=\'https://placehold.co/600x400/2a2a35/a0a0b0?text=Foto+Gagal+Dimuat\'">' +
           '</div>';
  }

  // Jika ada 2 atau 3 foto -> buat Carousel HTML dengan titik indikator (dots) & Auto-Slide
  let slidesHtml = "";
  let dotsHtml = "";
  images.forEach(function(imgUrl, idx) {
    const formattedUrl = formatDriveUrl(imgUrl);
    const activeClass = idx === 0 ? " active" : "";
    slidesHtml += '<img src="' + formattedUrl + '" alt="' + altTitle + ' foto ' + (idx + 1) + '" class="carousel-slide' + activeClass + '" data-slide-index="' + idx + '" onerror="this.src=\'https://placehold.co/600x400/2a2a35/a0a0b0?text=Foto+Gagal+Dimuat\'">';
    dotsHtml += '<span class="carousel-dot' + activeClass + '" data-dot-index="' + idx + '"></span>';
  });

  const badgeHtml = '<div class="multi-photo-badge"><i data-lucide="layers" style="width:11px;height:11px;"></i> ' + images.length + ' Foto</div>';

  return '<div class="' + wrapperClass + ' auto-carousel-box" data-carousel="true" onclick="handleCarouselClick(this, \'' + altTitle + '\')">' +
           '<div class="carousel-container">' +
             slidesHtml +
             badgeHtml +
             '<div class="carousel-dots">' + dotsHtml + '</div>' +
           '</div>' +
         '</div>';
}

// Render Card Grid
function renderGrid() {
  const expGrid = document.getElementById("pengalamanGrid");
  const certGrid = document.getElementById("sertifikatGrid");

  if (expGrid) expGrid.innerHTML = "";
  if (certGrid) certGrid.innerHTML = "";

  state.data.items.forEach(function(item) {
    if (item.category !== "pengalaman" && item.category !== "sertifikat") return;

    const card = document.createElement("div");
    card.className = "card";

    const formattedImg = formatDriveUrl(item.images ? item.images[0] : item.image);

    const adminActions = state.isAdmin ?
      '<div class="card-admin-actions">' +
        '<button class="btn-card-action edit" onclick="openEditModal(\'' + item.id + '\')">Edit</button>' +
        '<button class="btn-card-action delete" onclick="deleteItem(\'' + item.id + '\')">Hapus</button>' +
      '</div>' : '';

    const formattedDesc = item.description ? item.description.replace(/\n/g, '<br>') : '';
    const badgeText = item.category === 'pengalaman' ? 'Kegiatan' : 'Sertifikat & Pelatihan';

    card.innerHTML =
      '<div class="card-image-wrap" onclick="openLightbox(\'' + formattedImg + '\', \'' + item.title + ' - ' + item.subtitle + '\')">' +
        '<img src="' + formattedImg + '" alt="' + item.title + '" class="card-image" onerror="this.src=\'https://placehold.co/600x400/2a2a35/a0a0b0?text=Foto+Gagal+Dimuat\'">' +
        '<span class="card-badge">' + badgeText + '</span>' +
      '</div>' +
      '<div class="card-body">' +
        '<div class="card-period">' + item.period + '</div>' +
        '<h3 class="card-title">' + item.title + '</h3>' +
        '<h4 class="card-subtitle">' + item.subtitle + '</h4>' +
        '<div class="card-description">' + formattedDesc + '</div>' +
        adminActions +
      '</div>';

    if (item.category === "pengalaman" && expGrid) {
      const expCard = document.createElement("div");
      expCard.className = "exp-card";

      // Memasang slot foto utama (bisa 1, 2, atau 3 foto dengan auto-slideshow)
      const mainImages = item.images || item.image;
      const mainImgMarkup = createImageSlotMarkup(mainImages, item.title, "exp-main-img-wrap");
      const mainCap = item.mainCaption || item.description;

      let subPhotosHtml = "";
      if (item.gallery && item.gallery.length > 0) {
        item.gallery.forEach(function(g) {
          const gImages = g.images || g.image;
          const gCap = g.caption || "";
          const subSlotMarkup = createImageSlotMarkup(gImages, item.title + ' - Foto Kegiatan', "exp-sub-img-wrap");

          subPhotosHtml +=
            '<div class="exp-sub-item">' +
              subSlotMarkup +
              '<div class="exp-sub-caption">' + gCap + '</div>' +
            '</div>';
        });
      } else {
        subPhotosHtml = '<p style="font-size:0.85rem; color:var(--text-dim); font-style:italic;">Belum ada foto galeri tambahan.</p>';
      }

      const adminBtns = state.isAdmin ?
        '<div class="card-admin-actions" style="margin-top: 20px;">' +
          '<button class="btn-card-action edit" onclick="openEditModal(\'' + item.id + '\')">Edit Pengalaman & Galeri</button>' +
          '<button class="btn-card-action delete" onclick="deleteItem(\'' + item.id + '\')">Hapus</button>' +
        '</div>' : '';

      expCard.innerHTML =
        '<div class="exp-header">' +
          '<div class="card-period">' + item.period + '</div>' +
          '<h3 class="card-title" style="font-size: 1.4rem;">' + item.title + '</h3>' +
          '<h4 class="card-subtitle">' + item.subtitle + '</h4>' +
        '</div>' +
        '<div class="exp-gallery-split">' +
          '<!-- Sisi Kiri: Foto Utama -->' +
          '<div class="exp-main-box">' +
            mainImgMarkup +
            '<div class="exp-photo-caption">' + (formattedDesc || mainCap) + '</div>' +
          '</div>' +
          '<!-- Sisi Kanan: Foto-foto Tambahan & Keterangan -->' +
          '<div class="exp-sub-box">' +
            '<div class="exp-sub-header-title">Galeri Kegiatan & Keterangan</div>' +
            '<div class="exp-sub-grid">' +
              subPhotosHtml +
            '</div>' +
          '</div>' +
        '</div>' +
        adminBtns;

      expGrid.appendChild(expCard);
    } else if (item.category === "sertifikat" && certGrid) {
      certGrid.appendChild(card);
    }
  });

  // Inisialisasi IntersectionObserver untuk Auto-Slider saat scrolled ke layar
  initExperienceSliderObserver();

  // Re-initialize Lucide Icons
  if (window.lucide) lucide.createIcons();
}

// Update UI State berdasarkan status Admin
function updateAdminStateUI() {
  const adminElements = document.querySelectorAll(".admin-only");
  adminElements.forEach(function(el) {
    el.style.display = state.isAdmin ? "flex" : "none";
  });

  if (editAvatarBtn) editAvatarBtn.style.display = state.isAdmin ? "flex" : "none";
  if (forceSyncBtn) forceSyncBtn.style.display = state.isAdmin ? "flex" : "none";

  // Tombol exit admin & badge: hanya terlihat saat admin aktif
  if (adminExitBtn) adminExitBtn.style.display = state.isAdmin ? "flex" : "none";
  if (adminActiveBadge) adminActiveBadge.style.display = state.isAdmin ? "block" : "none";

  renderGrid();
}

// Section Scroll Observer
function initSectionObserver() {
  const sections = document.querySelectorAll('.section');
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });
  sections.forEach(function(section) { observer.observe(section); });
}

// Toast Notification Helper
function showToast(message, type) {
  type = type || 'success';
  let toast = document.getElementById('portfolioToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'portfolioToast';
    toast.style.cssText = 'position:fixed; bottom:30px; left:50%; transform:translateX(-50%) translateY(100px); background: linear-gradient(135deg,#6c63ff,#48bfe3); color:#fff; padding:14px 28px; border-radius:50px; font-size:0.95rem; font-weight:600; z-index:99999; box-shadow:0 8px 32px rgba(108,99,255,0.4); transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s; opacity:0; pointer-events:none; text-align:center; max-width:90vw;';
    if (type === 'error') toast.style.background = 'linear-gradient(135deg,#e63946,#f4a261)';
    document.body.appendChild(toast);
  }
  toast.style.background = type === 'error' ? 'linear-gradient(135deg,#e63946,#f4a261)' : 'linear-gradient(135deg,#6c63ff,#48bfe3)';
  toast.innerText = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(100px)';
  }, 3200);
}

// Storage Save Handler (LocalStorage & Google Sheets Sync)
function saveData() {
  showToast('⏳ Menyimpan data...');
  lastLocalEditTime = Date.now();
  state.data.lastSaved = new Date().toISOString();

  // Simpan cepat ke localStorage dulu
  try {
    localStorage.setItem("portfolio_data", JSON.stringify(state.data));
    console.log('[Portfolio] Data tersimpan ke localStorage.');
  } catch(e) {
    console.error('[Portfolio] Gagal simpan ke localStorage:', e);
  }

  // Cari apakah ada gambar yang masih berupa data Base64
  var items = state.data.items || [];
  var profile = state.data.profile || {};
  var pendingUploads = [];

  if (profile.avatar && profile.avatar.startsWith('data:image/')) {
    pendingUploads.push(
      uploadImageToAppsScript(profile.avatar, 'profile_avatar.jpg').then(function(url) {
        if (url) state.data.profile.avatar = url;
      })
    );
  }

  items.forEach(function(item, idx) {
    if (item.image && item.image.startsWith('data:image/')) {
      pendingUploads.push(
        uploadImageToAppsScript(item.image, 'item_' + idx + '.jpg').then(function(url) {
          if (url) state.data.items[idx].image = url;
        })
      );
    }
    if (item.gallery && Array.isArray(item.gallery)) {
      item.gallery.forEach(function(g, gIdx) {
        if (g.image && g.image.startsWith('data:image/')) {
          pendingUploads.push(
            uploadImageToAppsScript(g.image, 'item_' + idx + '_gal_' + gIdx + '.jpg').then(function(url) {
              if (url) state.data.items[idx].gallery[gIdx].image = url;
            })
          );
        }
      });
    }
  });

  // Fungsi pengiriman aktual setelah dipastikan semua Base64 diubah ke URL Drive
  function executeServerSync() {
    try {
      localStorage.setItem("portfolio_data", JSON.stringify(state.data));
    } catch(e) {}

    // Jika berjalan di lingkungan Google Apps Script
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      google.script.run
        .withSuccessHandler(function() {
          showToast('✓ Tersimpan ke Google Sheets!');
        })
        .withFailureHandler(function(err) {
          showToast('Gagal sync ke Google Sheets.', 'error');
        })
        .savePortfolioDataToSheet(state.data);
      return;
    }

    // Jika berjalan di web external (GitHub Pages)
    if (typeof APPS_SCRIPT_URL !== 'undefined' && APPS_SCRIPT_URL) {
      const dataString = JSON.stringify(state.data);
      const params = new URLSearchParams();
      params.append('action', 'savePortfolio');
      params.append('data', dataString);

      fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
      })
      .then(function(res) {
        return res.json();
      })
      .then(function(result) {
        if (result && result.success) {
          console.log("[Portfolio] Data terkirim ke Google Sheets.");
          showToast('✓ Tersimpan & dikirim ke Google Sheets!');
        } else {
          throw new Error((result && result.error) || 'Gagal menyimpan');
        }
      })
      .catch(function(err) {
        console.warn("[Portfolio] POST Form-data gagal, mencoba mode fallback...", err);

        fetch(APPS_SCRIPT_URL + "?action=savePortfolio", {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ action: "savePortfolio", data: state.data })
        })
        .then(function() {
          showToast('✓ Tersimpan & dikirim ke Google Sheets!');
        })
        .catch(function(finalErr) {
          console.error("[Portfolio] Gagal kirim akhir:", finalErr);
          showToast('Tersimpan lokal, gagal kirim ke server.', 'error');
        });
      });
    }
  }

  // Jika ada unggahan gambar Base64 tertunda, tunggu hingga selesai dulu
  if (pendingUploads.length > 0) {
    showToast('⏳ Mengupload gambar ke Google Drive...');
    Promise.all(pendingUploads).then(function() {
      executeServerSync();
    });
  } else {
    executeServerSync();
  }
}

// Smart Merge Data dari Server dengan Data Lokal
function mergeData(localData, serverData) {
  if (!serverData || !serverData.profile) return localData;
  if (!localData || !localData.profile) return serverData;

  const localTime = new Date(localData.lastSaved || 0).getTime();
  const serverTime = new Date(serverData.lastSaved || 0).getTime();

  // Jika browser ini baru saja mengedit dalam 30 detik terakhir, prioritaskan data lokal sementara
  if (Date.now() - lastLocalEditTime < 30000) {
    console.log('[Portfolio] Menggunakan data lokal (karena baru diedit dalam 30 detik).');
    return localData;
  }

  // Jika server lebih baru, terima data dari server (agar browser lain dapat pembaruan)
  if (serverTime >= localTime) {
    console.log('[Portfolio] Data server lebih baru atau sama, menggunakan server:', new Date(serverTime).toLocaleTimeString());
    return serverData;
  }

  // Data lokal lebih baru, tapi sudah lebih dari 30 detik sejak edit
  // Kemungkinan server belum tersinkron, gunakan lokal
  console.log('[Portfolio] Data lokal lebih baru dari server, menggunakan lokal.');
  return localData;
}

const syncLoader = document.getElementById('syncLoader');
const loaderMessage = document.getElementById('loaderMessage');
const loaderBrandName = document.getElementById('loaderBrandName');

// Sembunyikan loader via JS (lebih cepat dari CSS animation)
function hideSyncLoading() {
  if (!syncLoader) return;
  syncLoader.classList.add('hidden');
}

function showSyncLoading(message) {
  if (!syncLoader) return;
  syncLoader.classList.remove('hidden');
}

function showTemporaryLoading(message, maxMs) {
  // Tidak digunakan lagi — loader auto-hide via CSS
}

// Load data dari Google Sheets sepenuhnya di background
function loadDataFromGoogleSheets() {
  if (typeof APPS_SCRIPT_URL !== 'undefined' && APPS_SCRIPT_URL) {
    console.log("[Portfolio] Memulai sinkronisasi background ke Google Sheets...");
    fetch(APPS_SCRIPT_URL + "?action=read", { mode: 'cors' })
      .then(function(res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function(result) {
        if (result && result.profile && Object.keys(result.profile).length > 0) {
          const mergedData = mergeData(state.data, result);
          const currentJson = JSON.stringify(state.data);
          const mergedJson = JSON.stringify(mergedData);
          if (currentJson !== mergedJson) {
            state.data = mergedData;
            localStorage.setItem("portfolio_data", JSON.stringify(state.data));
            console.log("[Portfolio] Data dari Google Sheets diperbarui!");
            renderProfile();
            renderGrid();
          } else {
            console.log("[Portfolio] Data sudah terbaru, tidak ada perubahan.");
          }
        } else {
          console.warn("[Portfolio] Google Sheets kosong, menggunakan data lokal.");
        }
      })
      .catch(function(err) {
        console.warn("[Portfolio] Sinkronisasi background gagal:", err);
      });
  }
  return Promise.resolve();
}

// Lightbox Open/Close
function openLightbox(imgSrc, captionText) {
  lightboxImage.src = imgSrc;
  lightboxCaption.innerText = captionText;
  lightboxModal.classList.add("active");
}

if (closeLightboxModal) {
  closeLightboxModal.addEventListener("click", function() {
    lightboxModal.classList.remove("active");
  });
}

// Close Lightbox when clicking outside box (backdrop) or pressing Escape key
lightboxModal.addEventListener("click", function(e) {
  if (e.target === lightboxModal) {
    lightboxModal.classList.remove("active");
  }
});

// ===== SECRET ADMIN ACCESS =====
// Cara masuk admin: klik logo/nama 5x cepat, ATAU tekan Ctrl+Shift+A

// Metode 1: Klik logo 5x dalam 3 detik
let secretClickCount = 0;
let secretClickTimer = null;
const navBrand = document.getElementById('navBrand');
if (navBrand) {
  navBrand.addEventListener('click', function(e) {
    e.preventDefault();
    secretClickCount++;
    clearTimeout(secretClickTimer);
    secretClickTimer = setTimeout(function() { secretClickCount = 0; }, 3000);
    if (secretClickCount >= 5) {
      secretClickCount = 0;
      if (!state.isAdmin) loginModal.classList.add('active');
    }
  });
}

// Metode 2: Keyboard shortcut Ctrl+Shift+A
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    e.preventDefault();
    if (!state.isAdmin) loginModal.classList.add('active');
  }
  if (e.key === 'Escape' && lightboxModal.classList.contains('active')) {
    lightboxModal.classList.remove('active');
  }
  if (e.key === 'Escape' && loginModal.classList.contains('active')) {
    loginModal.classList.remove('active');
  }
});

// Tombol Keluar Admin
if (adminExitBtn) {
  adminExitBtn.addEventListener('click', function() {
    if (confirm('Keluar dari Mode Admin?')) {
      state.isAdmin = false;
      updateAdminStateUI();
      showToast('Mode Admin dinonaktifkan.');
    }
  });
}

closeLoginModal.addEventListener('click', function() { loginModal.classList.remove('active'); });

loginForm.addEventListener('submit', function(e) {
  e.preventDefault();
  if (adminPinInput.value === state.adminPin) {
    state.isAdmin = true;
    loginModal.classList.remove('active');
    adminPinInput.value = '';
    updateAdminStateUI();
    showToast('✓ Mode Admin aktif. Selamat datang!');
  } else {
    showToast('PIN Admin salah. Coba lagi.', 'error');
    adminPinInput.value = '';
    adminPinInput.focus();
  }
});

// Profile Edit Handlers
function openProfileModal() {
  const p = state.data.profile;
  profileNameInput.value = p.name || "";
  profileTitleInput.value = p.title || "";
  profileBioInput.value = p.bio || "";
  profileAvatarUrlInput.value = p.avatar || "";
  profileLinkedinInput.value = p.linkedin || "";
  profileEmailInput.value = p.email ? p.email.replace("mailto:", "") : "";
  profileAvatarFileInput.value = "";
  profileModal.classList.add("active");
}

if (editAvatarBtn) editAvatarBtn.addEventListener("click", openProfileModal);
if (editProfileBtn) editProfileBtn.addEventListener("click", openProfileModal);
if (closeProfileModal) {
  closeProfileModal.addEventListener("click", function() {
    profileModal.classList.remove("active");
  });
}

profileForm.addEventListener("submit", function(e) {
  e.preventDefault();

  const newName = profileNameInput.value.trim();
  const newTitle = profileTitleInput.value.trim();
  const newBio = profileBioInput.value.trim();
  const newLinkedin = profileLinkedinInput.value.trim();
  let newEmail = profileEmailInput.value.trim();
  if (newEmail && !newEmail.startsWith("mailto:")) {
    newEmail = "mailto:" + newEmail;
  }
  const fileInput = profileAvatarFileInput;
  let avatarUrl = profileAvatarUrlInput.value.trim();

  function finishSaveProfile(finalAvatarUrl) {
    state.data.profile = {
      name: newName,
      title: newTitle,
      bio: newBio,
      avatar: finalAvatarUrl || state.data.profile.avatar,
      linkedin: newLinkedin,
      email: newEmail
    };

    saveData();
    renderProfile();
    profileModal.classList.remove("active");
    showToast('✓ Profil & Data Diri berhasil diperbarui!');
  }

  // Handle Foto Profil File Upload jika ada
  if (fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    compressImageFile(file, 600, 600, 0.85, function(compressedBase64) {
      const base64Data = compressedBase64 || avatarUrl;
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        // Di dalam Google Apps Script environment
        google.script.run
          .withSuccessHandler(function(driveUrl) { finishSaveProfile(driveUrl); })
          .withFailureHandler(function(err) {
            console.warn('Drive upload profile via GAS gagal, fallback base64:', err);
            finishSaveProfile(base64Data);
          })
          .uploadFileToDrive(base64Data, file.name, { category: 'profile', title: newName });
      } else {
        // Di GitHub Pages / external web: upload via fetch ke GAS Web App
        showToast('⏳ Mengupload foto profil ke Drive...');
        uploadImageToAppsScript(base64Data, file.name)
          .then(function(driveUrl) {
            if (driveUrl) {
              finishSaveProfile(driveUrl);
            } else {
              // Fallback: simpan base64 hanya jika Drive upload benar-benar gagal
              console.warn('[Portfolio] Gagal upload ke Drive, menyimpan base64 sebagai fallback.');
              finishSaveProfile(base64Data);
            }
          });
      }
    });
    return;
  }

  finishSaveProfile(avatarUrl);
});

// Force Sync Event: Upload semua Base64 ke Drive dulu, lalu simpan
if (forceSyncBtn) {
  forceSyncBtn.addEventListener('click', function() {
    migrateBase64ToDriveAndSync();
  });
}

/**
 * Memeriksa semua gambar dalam state.data yang masih berformat Base64,
 * menguploadnya ke Google Drive, lalu menyimpan ulang ke server.
 * Ini menyelesaikan masalah: gambar hanya terlihat di browser yang upload.
 */
function migrateBase64ToDriveAndSync() {
  showToast('⏳ Memigrasikan foto ke Drive & sinkronisasi...');

  var items = state.data.items || [];
  var profile = state.data.profile || {};
  var uploadTasks = [];

  // Cek avatar profil
  if (profile.avatar && profile.avatar.startsWith('data:image/')) {
    uploadTasks.push(
      uploadImageToAppsScript(profile.avatar, 'avatar_profil.jpg')
        .then(function(url) {
          if (url) {
            console.log('[Portfolio] Avatar profil berhasil dimigrasi ke Drive:', url);
            state.data.profile.avatar = url;
          } else {
            console.warn('[Portfolio] Gagal migrasi avatar profil.');
          }
        })
    );
  }

  // Cek semua gambar item & gallery
  items.forEach(function(item, idx) {
    if (item.image && item.image.startsWith('data:image/')) {
      uploadTasks.push(
        uploadImageToAppsScript(item.image, 'item_' + idx + '_main.jpg')
          .then(function(url) {
            if (url) {
              console.log('[Portfolio] Foto utama item "' + item.title + '" dimigrasi ke Drive:', url);
              state.data.items[idx].image = url;
            }
          })
      );
    }
    var gallery = item.gallery || [];
    gallery.forEach(function(g, gIdx) {
      if (g.image && g.image.startsWith('data:image/')) {
        uploadTasks.push(
          uploadImageToAppsScript(g.image, 'item_' + idx + '_gallery_' + gIdx + '.jpg')
            .then(function(url) {
              if (url) {
                console.log('[Portfolio] Galeri foto dimigrasi ke Drive:', url);
                state.data.items[idx].gallery[gIdx].image = url;
              }
            })
        );
      }
    });
  });

  if (uploadTasks.length === 0) {
    showToast('⏳ Tidak ada Base64 ditemukan, langsung sinkronisasi...');
    saveData();
    return;
  }

  showToast('⏳ Mengupload ' + uploadTasks.length + ' foto ke Drive...');
  Promise.all(uploadTasks).then(function() {
    showToast('✓ Foto dimigrasi! Menyimpan ke Google Sheets...');
    saveData();
  });
}

// Multi-Photo Slot Helpers for Modal Form
let modalMainPhotos = [];
let modalSubSlots = [];

const mainPhotosThumbs = document.getElementById("mainPhotosThumbs");
const itemFileInput = document.getElementById("itemFileInput");
const itemImageUrl = document.getElementById("itemImageUrl");
const addMainUrlBtn = document.getElementById("addMainUrlBtn");
const addSubPhotoBtn = document.getElementById("addSubPhotoBtn");
const subPhotosContainer = document.getElementById("subPhotosContainer");

function renderMainPhotoThumbsUI() {
  if (!mainPhotosThumbs) return;
  mainPhotosThumbs.innerHTML = "";

  if (modalMainPhotos.length === 0) {
    mainPhotosThumbs.innerHTML = '<div class="photo-thumbs-empty">Belum ada foto utama. Klik + Upload Foto atau tempelkan Link.</div>';
    return;
  }

  modalMainPhotos.forEach(function(imgUrl, idx) {
    const card = document.createElement("div");
    card.className = "photo-thumb-card";

    const formatted = formatDriveUrl(imgUrl);

    card.innerHTML =
      '<img src="' + formatted + '" class="photo-thumb-img" alt="Preview ' + (idx + 1) + '" onerror="this.src=\'https://placehold.co/100x100/2a2a35/a0a0b0?text=Error\'">' +
      '<span class="photo-thumb-badge">Foto #' + (idx + 1) + '</span>' +
      '<button type="button" class="photo-thumb-remove" title="Hapus foto ini">&times;</button>';

    card.querySelector(".photo-thumb-remove").addEventListener("click", function(e) {
      e.stopPropagation();
      modalMainPhotos.splice(idx, 1);
      renderMainPhotoThumbsUI();
    });

    mainPhotosThumbs.appendChild(card);
  });
}

if (itemFileInput) {
  itemFileInput.addEventListener("change", function(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    showToast('⏳ Memproses ' + files.length + ' foto...');
    let processed = 0;
    files.forEach(function(file) {
      compressImageFile(file, 1200, 900, 0.8, function(compressedBase64) {
        if (compressedBase64) {
          modalMainPhotos.push(compressedBase64);
        }
        processed++;
        if (processed === files.length) {
          renderMainPhotoThumbsUI();
          showToast('✓ ' + files.length + ' foto ditambahkan!');
        }
      });
    });
    itemFileInput.value = "";
  });
}

function handleAddMainUrl() {
  if (!itemImageUrl) return;
  const val = itemImageUrl.value.trim();
  if (!val) return;

  const urls = val.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
  urls.forEach(function(url) {
    modalMainPhotos.push(url);
  });
  itemImageUrl.value = "";
  renderMainPhotoThumbsUI();
  showToast('✓ Link foto ditambahkan!');
}

if (addMainUrlBtn) {
  addMainUrlBtn.addEventListener("click", handleAddMainUrl);
}

function renderSubPhotoSlotsUI() {
  if (!subPhotosContainer) return;
  subPhotosContainer.innerHTML = "";

  if (modalSubSlots.length === 0) {
    subPhotosContainer.innerHTML = '<div class="photo-thumbs-empty" style="text-align:left;">Belum ada slot galeri tambahan. Klik "+ Tambah Slot Galeri" untuk menambahkan.</div>';
    return;
  }

  modalSubSlots.forEach(function(slot, slotIdx) {
    const row = document.createElement("div");
    row.className = "sub-photo-row";
    row.style.cssText = "background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; display: flex; flex-direction: column; gap: 10px;";

    let thumbsHtml = '';
    if (!slot.images || slot.images.length === 0) {
      thumbsHtml = '<div class="photo-thumbs-empty" style="padding:6px 10px; font-size:0.78rem;">Belum ada foto pada slot ini. Upload file atau tempel link.</div>';
    }

    row.innerHTML =
      '<div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px dashed rgba(255,255,255,0.08); padding-bottom: 8px;">' +
        '<span style="font-size:0.85rem; font-weight:600; color:var(--secondary);">Slot Galeri #' + (slotIdx + 1) + '</span>' +
        '<button type="button" class="btn-card-action delete btn-remove-slot" style="flex:none; padding:3px 10px; font-size:0.78rem;">Hapus Slot</button>' +
      '</div>' +
      '<div>' +
        '<label class="form-label" style="font-size:0.75rem; margin-bottom:4px;">Foto pada Slot ini (Bisa Upload bertahap / beberapa kali):</label>' +
        '<div class="photo-thumbs-grid sub-thumbs-box"></div>' +
        '<div class="slot-upload-controls" style="margin-top:8px;">' +
          '<label class="btn-card-action edit" style="cursor:pointer; display:inline-flex; align-items:center; gap:4px; padding:5px 12px; font-size:0.78rem;">' +
            '<span>+ Upload Foto</span>' +
            '<input type="file" class="sub-file-input" accept="image/*" multiple style="display:none;">' +
          '</label>' +
          '<input type="text" class="form-control sub-url-input" placeholder="Atau Link / Drive URL..." style="flex:1; min-width:140px; font-size:0.8rem; padding:4px 8px;">' +
          '<button type="button" class="btn-card-action edit sub-url-btn" style="padding:5px 10px; font-size:0.78rem;">+ Link</button>' +
        '</div>' +
      '</div>' +
      '<div>' +
        '<label class="form-label" style="font-size:0.75rem; margin-bottom:4px;">Keterangan Foto Kegiatan:</label>' +
        '<input type="text" class="form-control sub-caption-input" placeholder="Jelaskan apa yang dilakukan pada foto ini..." value="' + (slot.caption || "").replace(/"/g, '&quot;') + '">' +
      '</div>';

    const thumbsBox = row.querySelector(".sub-thumbs-box");
    if (slot.images && slot.images.length > 0) {
      slot.images.forEach(function(imgUrl, imgIdx) {
        const thumbCard = document.createElement("div");
        thumbCard.className = "photo-thumb-card";
        const formatted = formatDriveUrl(imgUrl);

        thumbCard.innerHTML =
          '<img src="' + formatted + '" class="photo-thumb-img" alt="Sub Preview ' + (imgIdx + 1) + '" onerror="this.src=\'https://placehold.co/100x100/2a2a35/a0a0b0?text=Error\'">' +
          '<span class="photo-thumb-badge">#' + (imgIdx + 1) + '</span>' +
          '<button type="button" class="photo-thumb-remove" title="Hapus foto ini">&times;</button>';

        thumbCard.querySelector(".photo-thumb-remove").addEventListener("click", function(e) {
          e.stopPropagation();
          slot.images.splice(imgIdx, 1);
          renderSubPhotoSlotsUI();
        });

        thumbsBox.appendChild(thumbCard);
      });
    } else {
      thumbsBox.innerHTML = thumbsHtml;
    }

    const subFileInput = row.querySelector(".sub-file-input");
    subFileInput.addEventListener("change", function(e) {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      showToast('⏳ Memproses ' + files.length + ' foto...');
      let processed = 0;
      files.forEach(function(file) {
        compressImageFile(file, 1200, 900, 0.8, function(compressedBase64) {
          if (compressedBase64) {
            if (!slot.images) slot.images = [];
            slot.images.push(compressedBase64);
          }
          processed++;
          if (processed === files.length) {
            renderSubPhotoSlotsUI();
            showToast('✓ ' + files.length + ' foto ditambahkan ke Slot #' + (slotIdx + 1) + '!');
          }
        });
      });
      subFileInput.value = "";
    });

    const subUrlInput = row.querySelector(".sub-url-input");
    const subUrlBtn = row.querySelector(".sub-url-btn");

    function addSubUrl() {
      const val = subUrlInput.value.trim();
      if (!val) return;
      const urls = val.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
      if (!slot.images) slot.images = [];
      urls.forEach(function(u) { slot.images.push(u); });
      subUrlInput.value = "";
      renderSubPhotoSlotsUI();
      showToast('✓ Link foto ditambahkan!');
    }

    subUrlBtn.addEventListener("click", addSubUrl);

    const subCaptionInput = row.querySelector(".sub-caption-input");
    subCaptionInput.addEventListener("input", function(e) {
      slot.caption = e.target.value;
    });

    row.querySelector(".btn-remove-slot").addEventListener("click", function() {
      modalSubSlots.splice(slotIdx, 1);
      renderSubPhotoSlotsUI();
    });

    subPhotosContainer.appendChild(row);
  });
}

if (addSubPhotoBtn) {
  addSubPhotoBtn.addEventListener("click", function() {
    modalSubSlots.push({ images: [], caption: "" });
    renderSubPhotoSlotsUI();
  });
}

// Add Item Handlers
addExpBtn.addEventListener("click", function() { openItemModal("pengalaman"); });
addCertBtn.addEventListener("click", function() { openItemModal("sertifikat"); });

function openItemModal(category, editId) {
  editId = editId || null;
  itemForm.reset();
  document.getElementById("itemCategory").value = category;
  document.getElementById("itemId").value = editId || "";

  const expGallerySection = document.getElementById("expGallerySection");
  if (category === "pengalaman") {
    if (expGallerySection) expGallerySection.style.display = "block";
  } else {
    if (expGallerySection) expGallerySection.style.display = "none";
  }

  if (editId) {
    itemModalTitle.innerText = "Edit Item Portofolio";
    const item = state.data.items.find(function(i) { return i.id === editId; });
    if (item) {
      document.getElementById("itemTitle").value = item.title;
      document.getElementById("itemSubtitle").value = item.subtitle;
      document.getElementById("itemPeriod").value = item.period;
      document.getElementById("itemDescription").value = item.description;

      modalMainPhotos = Array.isArray(item.images) ? [...item.images] : (item.image ? [item.image] : []);

      if (item.category === "pengalaman" && item.gallery && item.gallery.length > 0) {
        modalSubSlots = item.gallery.map(function(g) {
          const imgs = Array.isArray(g.images) ? [...g.images] : (g.image ? [g.image] : []);
          return { images: imgs, caption: g.caption || "" };
        });
      } else if (item.category === "pengalaman") {
        modalSubSlots = [{ images: [], caption: "" }];
      } else {
        modalSubSlots = [];
      }
    }
  } else {
    itemModalTitle.innerText = category === "pengalaman" ? "Tambah Pengalaman & Magang" : "Tambah Sertifikat, Lisensi & Pelatihan";
    modalMainPhotos = [];
    if (category === "pengalaman") {
      modalSubSlots = [{ images: [], caption: "" }];
    } else {
      modalSubSlots = [];
    }
  }

  renderMainPhotoThumbsUI();
  renderSubPhotoSlotsUI();
  itemModal.classList.add("active");
}

closeItemModal.addEventListener("click", function() { itemModal.classList.remove("active"); });

// Item Submit Handler
itemForm.addEventListener("submit", function(e) {
  e.preventDefault();

  const saveBtn = document.getElementById("saveItemBtn");
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerText = "Menyimpan...";
  }

  const id = document.getElementById("itemId").value || "item-" + Date.now();
  const category = document.getElementById("itemCategory").value;
  const title = document.getElementById("itemTitle").value;
  const subtitle = document.getElementById("itemSubtitle").value;
  const period = document.getElementById("itemPeriod").value;
  const description = document.getElementById("itemDescription").value;

  const fallbackImage = category === 'sertifikat'
    ? 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=600&auto=format&fit=crop&q=80'
    : 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80';

  const finalMainImages = (modalMainPhotos && modalMainPhotos.length > 0) ? modalMainPhotos : [fallbackImage];

  const finalGallery = modalSubSlots
    .filter(function(s) { return (s.images && s.images.length > 0) || (s.caption && s.caption.trim()); })
    .map(function(s) {
      const slotImgs = (s.images && s.images.length > 0) ? s.images : [fallbackImage];
      return {
        image: slotImgs[0],
        images: slotImgs,
        caption: s.caption || ""
      };
    });

  const itemData = {
    id: id,
    category: category,
    title: title,
    subtitle: subtitle,
    period: period,
    image: finalMainImages[0],
    images: finalMainImages,
    description: description
  };

  if (category === "pengalaman") {
    itemData.gallery = finalGallery;
    itemData.mainCaption = description;
  }

  finishSaveItem(itemData);
  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.innerText = "Simpan ke Portofolio";
  }
});

function finishSaveItem(itemData) {
  try {
    const existingIdx = state.data.items.findIndex(function(i) { return i.id === itemData.id; });
    if (existingIdx >= 0) {
      state.data.items[existingIdx] = itemData;
      console.log('[Portfolio] Item diperbarui:', itemData.id);
    } else {
      state.data.items.unshift(itemData);
      console.log('[Portfolio] Item baru ditambahkan:', itemData.id);
    }

    saveData();
    renderGrid();
    itemModal.classList.remove("active");
    showToast('✓ Berhasil disimpan ke portofolio!');
  } catch(err) {
    console.error('[Portfolio] Error saat menyimpan item:', err);
    showToast('Gagal menyimpan! Coba lagi.', 'error');
  }
}

// Delete Item
function deleteItem(id) {
  if (confirm("Apakah Anda yakin ingin menghapus item ini dari portofolio?")) {
    state.data.items = state.data.items.filter(function(i) { return i.id !== id; });
    saveData();
    renderGrid();
  }
}

// Global scope for onclick handlers
window.openEditModal = function(id) {
  const item = state.data.items.find(function(i) { return i.id === id; });
  if (item) openItemModal(item.category, id);
};

window.deleteItem = deleteItem;
window.openLightbox = openLightbox;

// Memeriksa pembaruan data dari Google Sheets di background (TANPA loader, TANPA blokir UI)
function checkForUpdates(isBackgroundSync) {
  if (typeof APPS_SCRIPT_URL === 'undefined' || !APPS_SCRIPT_URL) return;

  // Jika baru saja ada editan lokal dalam 15 detik terakhir, tunda dulu fetch dari server
  if (Date.now() - lastLocalEditTime < 15000) {
    console.log("[Portfolio] Menunda sync dari server karena ada editan lokal baru.");
    return;
  }

  fetch(APPS_SCRIPT_URL + "?action=read", { mode: 'cors' })
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function(result) {
      if (result && result.profile && Object.keys(result.profile).length > 0) {
        const mergedData = mergeData(state.data, result);
        const currentJson = JSON.stringify(state.data);
        const mergedJson = JSON.stringify(mergedData);
        if (currentJson !== mergedJson) {
          state.data = mergedData;
          localStorage.setItem("portfolio_data", JSON.stringify(state.data));
          renderProfile();
          renderGrid();
          if (isBackgroundSync) {
            showToast('✓ Portofolio diperbarui!');
          }
          console.log('[Portfolio] Data diperbarui dari Google Sheets.');
        } else {
          console.log('[Portfolio] Tidak ada perubahan data.');
        }
      }
    })
    .catch(function(err) {
      console.warn("[Portfolio] Gagal cek pembaruan:", err);
    });
}

// Initial Load & Auto-Sync
document.addEventListener("DOMContentLoaded", function() {
  if (!state.data) {
    state.data = DEFAULT_DATA;
  }

  // Update nama brand di loader sesuai profil
  if (loaderBrandName && state.data.profile && state.data.profile.name &&
      state.data.profile.name !== 'Nama Lengkap Anda') {
    loaderBrandName.innerText = state.data.profile.name.split(' ')[0];
  }

  // LANGKAH 1: Render SEGERA dari data lokal
  renderProfile();
  renderGrid();
  updateAdminStateUI();
  initSectionObserver();

  // LANGKAH 2: Sembunyikan loader via JS setelah render selesai
  setTimeout(function() {
    hideSyncLoading();
  }, 300);

  // LANGKAH 3: Sinkronisasi awal dari Google Sheets di background
  loadDataFromGoogleSheets();

  // LANGKAH 4: Polling setiap 10 detik agar browser lain juga ikut update
  setInterval(function() {
    checkForUpdates(true);
  }, 10000);

  // LANGKAH 5: Cek pembaruan segera saat tab kembali difokuskan
  window.addEventListener('focus', function() {
    checkForUpdates(true);
  });
});


