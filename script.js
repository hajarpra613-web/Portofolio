/**
 * Interactive Portfolio Logic (GitHub Pages & LocalStorage Compatible, Syncs with Google Sheets)
 */

// Google Apps Script Web App URL
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxcdlieLa12dQsUJFvF0DzElNPiyxvJk_3xx1wYHtye8TgzukcPBQ9WyvhuYEbK9pk/exec";

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

// Helper untuk Google Drive View Link Conversion
function formatDriveUrl(url) {
  if (!url) return '';
  if (url.includes('drive.google.com') && url.includes('id=')) {
    const fileId = url.split('id=')[1].split('&')[0];
    return 'https://lh3.googleusercontent.com/d/' + fileId;
  } else if (url.includes('drive.google.com/file/d/')) {
    const fileId = url.split('/file/d/')[1].split('/')[0];
    return 'https://lh3.googleusercontent.com/d/' + fileId;
  }
  return url;
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

    const formattedImg = formatDriveUrl(item.image);

    const adminActions = state.isAdmin ?
      '<div class="card-admin-actions">' +
        '<button class="btn-card-action edit" onclick="openEditModal(\'' + item.id + '\')">Edit</button>' +
        '<button class="btn-card-action delete" onclick="deleteItem(\'' + item.id + '\')">Hapus</button>' +
      '</div>' : '';

    const formattedDesc = item.description ? item.description.replace(/\n/g, '<br>') : '';

    const badgeText = item.category === 'pengalaman' ? 'Kegiatan' : 'Sertifikat & Pelatihan';

    card.innerHTML =
      '<div class="card-image-wrap" onclick="openLightbox(\'' + formattedImg + '\', \'' + item.title + ' - ' + item.subtitle + '\')">' +
        '<img src="' + formattedImg + '" alt="' + item.title + '" class="card-image" onerror="this.src=\'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80\'">' +
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

      const mainImg = formatDriveUrl(item.image);
      const mainCap = item.mainCaption || item.description;

      let subPhotosHtml = "";
      if (item.gallery && item.gallery.length > 0) {
        item.gallery.forEach(function(g) {
          const gImg = formatDriveUrl(g.image);
          const gCap = g.caption || "";
          subPhotosHtml +=
            '<div class="exp-sub-item">' +
              '<div class="exp-sub-img-wrap" onclick="openLightbox(\'' + gImg + '\', \'' + item.title + ' - Foto Kegiatan\')">' +
                '<img src="' + gImg + '" alt="Foto Kegiatan" onerror="this.src=\'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80\'">' +
              '</div>' +
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
            '<div class="exp-main-img-wrap" onclick="openLightbox(\'' + mainImg + '\', \'' + item.title + '\')">' +
              '<img src="' + mainImg + '" alt="' + item.title + '" onerror="this.src=\'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80\'">' +
            '</div>' +
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

  // Re-initialize Lucide Icons for added elements
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
  state.data.lastSaved = new Date().toISOString();

  try {
    localStorage.setItem("portfolio_data", JSON.stringify(state.data));
    console.log('[Portfolio] Data tersimpan ke localStorage.');
  } catch(e) {
    console.error('[Portfolio] Gagal simpan ke localStorage:', e);
    showToast('Gagal menyimpan data. Storage penuh?', 'error');
    return;
  }
  
  // Jika berjalan di lingkungan Google Apps Script
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler(function() { console.log("Data berhasil disinkronkan ke Google Sheets via GAS!"); })
      .withFailureHandler(function(err) { console.error("Gagal sync GAS:", err); })
      .savePortfolioDataToSheet(state.data);
    return;
  }

  // Jika berjalan di web external (misal GitHub Pages)
  if (typeof APPS_SCRIPT_URL !== 'undefined' && APPS_SCRIPT_URL) {
    fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: "savePortfolio",
        data: state.data
      })
    })
    .then(function() {
      // mode 'no-cors' always returns an opaque response (status 0), so we assume success if no network error
      console.log("[Portfolio] Permintaan POST dikirim (no-cors).");
      showToast('Berhasil sinkronisasi ke Google Sheets!');
    })
    .catch(function(err) {
      console.warn("[Portfolio] Gagal sync via POST:", err);
      showToast('Gagal sinkronisasi jaringan.', 'error');
    });
  }
}

const syncLoader = document.getElementById('syncLoader');
const loaderMessage = document.getElementById('loaderMessage');
const loaderBrandName = document.getElementById('loaderBrandName');

// Sembunyikan loader setelah data siap (gunakan class 'hidden', bukan hapus 'active')
// Loader sudah visible secara default dari HTML - ini menghilangkan flash of default content
function hideSyncLoading() {
  if (!syncLoader) return;
  // Sedikit delay agar transisi terasa halus
  setTimeout(function() {
    syncLoader.classList.add('hidden');
  }, 180);
}

// Tampilkan loader saat sync manual (bukan initial load)
function showSyncLoading(message) {
  if (!syncLoader) return;
  if (loaderMessage) loaderMessage.innerText = message || 'Sinkronisasi portofolio...';
  syncLoader.classList.remove('hidden');
  syncLoader.classList.add('active');
}

// Load data portofolio dari Google Sheets (background sync)
function loadDataFromGoogleSheets() {
  if (typeof APPS_SCRIPT_URL !== 'undefined' && APPS_SCRIPT_URL) {
    if (loaderMessage) loaderMessage.innerText = 'Menyinkronkan data terbaru...';
    console.log("[Portfolio] Menghubungkan ke Google Sheets...");
    return fetch(APPS_SCRIPT_URL + "?action=read", { mode: 'cors' })
      .then(function(res) {
        if (!res.ok) throw new Error('HTTP status ' + res.status);
        return res.json();
      })
      .then(function(result) {
        if (result && result.profile && Object.keys(result.profile).length > 0) {
          state.data = result;
          localStorage.setItem("portfolio_data", JSON.stringify(state.data));
          console.log("[Portfolio] Sinkronisasi data dari Google Sheets berhasil!");
          renderProfile();
          renderGrid();
        } else {
          console.warn("[Portfolio] Data di Google Sheets kosong, tetap menggunakan data lokal.");
        }
      })
      .catch(function(err) {
        console.warn("[Portfolio] Gagal sinkronisasi dari Google Sheets, menggunakan data cache/default:", err);
        showToast('Gagal memuat data dari Google Sheets.', 'error');
      })
      .finally(function() {
        hideSyncLoading();
      });
  }

  return Promise.resolve().then(function() {
    hideSyncLoading();
  });
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
    alert("Profil & Data Diri berhasil diperbarui!");
  }

  // Handle Foto Profil File Upload jika ada
  if (fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(ev) {
      const base64Data = ev.target.result;
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(driveUrl) {
            finishSaveProfile(driveUrl);
          })
          .withFailureHandler(function(err) {
            console.warn("Drive upload profile failed, using base64 fallback:", err);
            finishSaveProfile(base64Data);
          })
          .uploadFileToDrive(base64Data, file.name, { category: "profile", title: newName });
      } else {
        finishSaveProfile(base64Data);
      }
    };
    reader.readAsDataURL(file);
    return;
  }

  finishSaveProfile(avatarUrl);
});

// Force Sync Event
if (forceSyncBtn) {
  forceSyncBtn.addEventListener("click", function() {
    saveData();
  });
}

// Sub-Photo Gallery Helpers for Pengalaman
const addSubPhotoBtn = document.getElementById("addSubPhotoBtn");
const subPhotosContainer = document.getElementById("subPhotosContainer");

function addSubPhotoRow(imgUrl, caption) {
  imgUrl = imgUrl || "";
  caption = caption || "";

  const row = document.createElement("div");
  row.className = "sub-photo-row";
  row.style.cssText = "background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px; display: flex; flex-direction: column; gap: 8px; position: relative;";

  row.innerHTML =
    '<div style="display:flex; justify-content:space-between; align-items:center;">' +
      '<span style="font-size:0.8rem; font-weight:600; color:var(--secondary);">Foto Tambahan #' + (subPhotosContainer.children.length + 1) + '</span>' +
      '<button type="button" class="btn-card-action delete btn-remove-sub" style="flex:none; padding:2px 8px; font-size:0.75rem;">Hapus</button>' +
    '</div>' +
    '<div>' +
      '<label class="form-label" style="font-size:0.75rem; margin-bottom:4px;">Upload File Gambar (Langsung dari Komputer/HP):</label>' +
      '<input type="file" class="form-control sub-photo-file" accept="image/*" style="padding:4px 8px; font-size:0.85rem;">' +
    '</div>' +
    '<div>' +
      '<label class="form-label" style="font-size:0.75rem; margin-bottom:4px;">Atau Link Gambar / Google Drive:</label>' +
      '<input type="url" class="form-control sub-photo-url" placeholder="https://..." value="' + imgUrl + '">' +
    '</div>' +
    '<div>' +
      '<label class="form-label" style="font-size:0.75rem; margin-bottom:4px;">Keterangan Foto Kegiatan:</label>' +
      '<input type="text" class="form-control sub-photo-caption" placeholder="Jelaskan apa yang dilakukan pada foto ini..." value="' + caption + '">' +
    '</div>';

  row.querySelector(".btn-remove-sub").addEventListener("click", function() {
    row.remove();
  });

  subPhotosContainer.appendChild(row);
}

if (addSubPhotoBtn) {
  addSubPhotoBtn.addEventListener("click", function() {
    addSubPhotoRow("", "");
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
  subPhotosContainer.innerHTML = "";

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
      document.getElementById("itemImageUrl").value = item.image;
      document.getElementById("itemDescription").value = item.description;

      if (item.category === "pengalaman" && item.gallery && item.gallery.length > 0) {
        item.gallery.forEach(function(g) {
          addSubPhotoRow(g.image, g.caption);
        });
      } else if (item.category === "pengalaman") {
        addSubPhotoRow("", "");
      }
    }
  } else {
    itemModalTitle.innerText = category === "pengalaman" ? "Tambah Pengalaman & Magang" : "Tambah Sertifikat, Lisensi & Pelatihan";
    if (category === "pengalaman") {
      addSubPhotoRow("", "");
    }
  }

  itemModal.classList.add("active");
}

closeItemModal.addEventListener("click", function() { itemModal.classList.remove("active"); });

// Item Submit Handler (Mendukung Upload Gambar Langsung Komputer/HP & Drive)
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
  const fileInput = document.getElementById("itemFileInput");
  var imageUrl = document.getElementById("itemImageUrl").value;

  // Process Sub-Photos (File uploads & URLs)
  function processSubPhotos(callback) {
    if (category !== "pengalaman") {
      callback([]);
      return;
    }

    const subRows = Array.from(subPhotosContainer.querySelectorAll(".sub-photo-row"));
    if (subRows.length === 0) {
      callback([]);
      return;
    }

    const promises = subRows.map(function(row) {
      return new Promise(function(resolve) {
        const subFileInput = row.querySelector(".sub-photo-file");
        const subUrlInput = row.querySelector(".sub-photo-url");
        const capInput = row.querySelector(".sub-photo-caption");
        const caption = capInput ? capInput.value.trim() : "";
        const existingUrl = subUrlInput ? subUrlInput.value.trim() : "";

        if (subFileInput && subFileInput.files && subFileInput.files[0]) {
          const file = subFileInput.files[0];
          const reader = new FileReader();
          reader.onload = function(ev) {
            const base64Data = ev.target.result;
            if (typeof google !== 'undefined' && google.script && google.script.run) {
              google.script.run
                .withSuccessHandler(function(driveUrl) {
                  resolve({ image: driveUrl, caption: caption });
                })
                .withFailureHandler(function(err) {
                  console.warn("Sub photo drive upload failed, fallback base64:", err);
                  resolve({ image: base64Data, caption: caption });
                })
                .uploadFileToDrive(base64Data, file.name, { category: "sub-photo", title: title });
            } else {
              resolve({ image: base64Data, caption: caption });
            }
          };
          reader.readAsDataURL(file);
        } else if (existingUrl) {
          resolve({ image: existingUrl, caption: caption });
        } else {
          resolve(null);
        }
      });
    });

    Promise.all(promises).then(function(results) {
      const validGallery = results.filter(function(r) { return r && r.image; });
      callback(validGallery);
    });
  }

  function handleFinish(finalImgUrl) {
    processSubPhotos(function(galleryData) {
      const itemData = {
        id: id,
        category: category,
        title: title,
        subtitle: subtitle,
        period: period,
        image: finalImgUrl,
        description: description
      };
      if (category === "pengalaman") {
        itemData.gallery = galleryData;
        itemData.mainCaption = description;
      }
      finishSaveItem(itemData);
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerText = "Simpan ke Portofolio";
      }
    });
  }

  // Process Main File Upload jika user memilih file foto utama
  if (fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(ev) {
      const base64Data = ev.target.result;
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(driveUrl) {
            handleFinish(driveUrl);
          })
          .withFailureHandler(function(err) {
            console.warn("Drive upload main file failed, fallback base64:", err);
            handleFinish(base64Data);
          })
          .uploadFileToDrive(base64Data, file.name, { category: category, title: title });
      } else {
        handleFinish(base64Data);
      }
    };
    reader.readAsDataURL(file);
    return;
  }

  // Gunakan placeholder jika tidak ada gambar (tidak memblokir penyimpanan)
  const fallbackImage = category === 'sertifikat'
    ? 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=600&auto=format&fit=crop&q=80'
    : 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80';

  handleFinish(imageUrl || fallbackImage);
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

// Memeriksa pembaruan data secara berkala dari Google Sheets
function checkForUpdates(showLoaderIfChanged) {
  if (typeof APPS_SCRIPT_URL === 'undefined' || !APPS_SCRIPT_URL) {
    return Promise.resolve();
  }

  return fetch(APPS_SCRIPT_URL + "?action=read", { mode: 'cors' })
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function(result) {
      if (result && result.profile && Object.keys(result.profile).length > 0) {
        const currentJson = JSON.stringify(state.data);
        const newJson = JSON.stringify(result);
        if (currentJson !== newJson) {
          if (showLoaderIfChanged) {
            showSyncLoading("Pembaruan terdeteksi. Menyinkronkan...");
          }
          state.data = result;
          localStorage.setItem("portfolio_data", JSON.stringify(state.data));
          renderProfile();
          renderGrid();
          if (showLoaderIfChanged) {
            // Berikan sedikit jeda agar transisi loader terasa halus
            setTimeout(function() {
              hideSyncLoading();
              showToast("Portofolio berhasil diperbarui!");
            }, 800);
          }
        }
      }
    })
    .catch(function(err) {
      console.warn("[Portfolio] Gagal memeriksa pembaruan:", err);
    });
}

// Initial Load & Auto-Sync
// PENTING: Loader sudah VISIBLE dari HTML secara default
document.addEventListener("DOMContentLoaded", function() {
  if (!state.data) {
    state.data = DEFAULT_DATA;
  }
  
  // Update nama brand di loader sesuai profil (jika ada)
  if (loaderBrandName && state.data.profile && state.data.profile.name &&
      state.data.profile.name !== 'Nama Lengkap Anda') {
    loaderBrandName.innerText = state.data.profile.name.split(' ')[0];
  }

  // Render awal dari cache (cepat, tidak blank)
  renderProfile();
  renderGrid();
  updateAdminStateUI();
  initSectionObserver();

  // Ambil data terbaru dari Google Sheets di awal
  showSyncLoading("Menyinkronkan data terbaru...");
  checkForUpdates(false)
    .finally(function() {
      hideSyncLoading();
    });

  // Polling: Cek pembaruan setiap 15 detik secara berkala
  setInterval(function() {
    checkForUpdates(true);
  }, 15000);

  // Sync saat tab kembali aktif/difokuskan oleh pengguna
  window.addEventListener("focus", function() {
    checkForUpdates(true);
  });
});
