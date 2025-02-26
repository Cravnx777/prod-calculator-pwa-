console.log("App.js loaded");

// Import SQLite functions
import { insertCalculation, updateCalculation, getCalculations } from './db.js';

// Konfigurasi Toastr (Pindahkan ke sini agar tersedia di seluruh kode)
toastr.options = {
    "closeButton": true,
    "progressBar": true,
    "positionClass": "toast-top-right",
    "preventDuplicates": false,
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "5000",
    "extendedTimeOut": "1000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
};
document.getElementById("prodForm").addEventListener("submit", function(event) {
    event.preventDefault();
  
    const btnText = document.getElementById("btnText");
    const btnLoader = document.getElementById("btnLoader");
  
    btnText.classList.add("hidden");
    btnLoader.classList.remove("hidden");

    setTimeout(() => {
        btnLoader.classList.add("hidden"); 
        btnText.classList.remove("hidden");
    }, 2000);
});


// ==========================================================================
// i18next Initialization (Tambahkan di sini)
// ==========================================================================
import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18next
  .use(Backend)
  .use(LanguageDetector)
  .init({
    fallbackLng: 'id', // Bahasa default adalah Indonesia
    debug: true,       // Aktifkan debug untuk melihat pesan di konsol
    detection: {
      order: ['localStorage', 'cookie', 'htmlTag', 'path', 'subdomain'], // Urutan deteksi bahasa
      caches: ['localStorage', 'cookie'] // Tempat menyimpan bahasa yang terdeteksi
    },
    backend: {
      loadPath: '/prod-calculator-pwa-/locales/{{lng}}/translation.json' // Jalur ke file terjemahan
    }
  })
  .then(() => {
    updateContent(); // Panggil fungsi untuk memperbarui konten
  });

export default i18next; // Ekspor untuk digunakan di tempat lain

// Fungsi untuk memperbarui teks pada halaman
function updateContent() {
    document.title = i18next.t('title'); // Perbarui judul halaman
    // Perbarui teks di elemen lain
    document.querySelector('.nav-link-bottom[href="#"]').innerHTML = `<i class="fas fa-home nav-icon-bottom"></i> ${i18next.t('home')}`;
    document.querySelector('.nav-link-bottom[href="#historyPage"]').innerHTML = `<i class="fas fa-history nav-icon-bottom"></i> ${i18next.t('history')}`;
    document.querySelector('.nav-link-bottom[href="#infoEgiPage"]').innerHTML = `<i class="fas fa-info-circle nav-icon-bottom"></i> ${i18next.t('infoEgi')}`;
    document.querySelector('.nav-link-bottom[href="#settingsPage"]').innerHTML = `<i class="fas fa-cog nav-icon-bottom"></i> ${i18next.t('settings')}`;

    // Tambahkan pembaruan untuk semua elemen lain yang perlu diterjemahkan
    document.getElementById('languageSelectLabel').textContent = i18next.t('selectLanguage');
    document.querySelector('label[for="vehicleType"]').textContent = i18next.t('vehicleTypeLabel');
    document.querySelector('label[for="wke"]').textContent = i18next.t('wkeLabel');
    document.querySelector('label[for="st"]').textContent = i18next.t('stLabel');
    document.querySelector('label[for="lt"]').textContent = i18next.t('ltLabel');
    document.querySelector('label[for="ct"]').textContent = i18next.t('ctLabel');
    document.querySelector('label[for="n"]').textContent = i18next.t('nLabel');
    document.querySelector('label[for="s"]').textContent = i18next.t('sLabel');
    document.querySelector('label[for="v"]').textContent = i18next.t('vLabel');
    document.getElementById('btnText').textContent = i18next.t('calculate');

    // Tambahkan lebih banyak elemen yang perlu diterjemahkan di sini
}

// Event listener untuk elemen select pemilihan bahasa
document.addEventListener('DOMContentLoaded', () => {
    const languageSelect = document.getElementById('languageSelect');

    if (languageSelect) {
        languageSelect.addEventListener('change', function(event) {
            i18next.changeLanguage(event.target.value);
        });
    } else {
        console.warn("Elemen dengan ID 'languageSelect' tidak ditemukan.");
    }

    // Panggil updateContent() saat halaman dimuat
    updateContent();

     // Splash screen akan hilang setelah 3 detik
    const splashScreen = document.getElementById("splash-screen");
        if (splashScreen) {
            setTimeout(() => {
                splashScreen.classList.add("hidden");
            }, 3000);
    }
});

i18next.on('languageChanged', () => {
    updateContent();
});

// ==========================================================================
// Service Worker
// ==========================================================================
// Fungsi untuk mendaftarkan Service Worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then((reg) => {
                    console.log('Service worker registered.', reg);
                })
                .catch((err) => {
                    console.error('Service worker not registered.', err);
                });
        });
    } else {
        console.warn('Service workers are not supported by this browser.');
    }
}

// ==========================================================================
// Theme Management
// ==========================================================================

// Fungsi untuk mengatur tema berdasarkan preferensi yang disimpan
function setTheme(theme) {
    try {
        const body = document.body;
        if (theme === 'light') {
            body.classList.add('light-mode');
        } else {
            body.classList.remove('light-mode');
        }
        localStorage.setItem('theme', theme);
    } catch (error) {
        console.error("Error setting theme:", error);
    }
}

// Fungsi untuk memuat tema yang disimpan
function loadTheme() {
    try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setTheme(savedTheme);
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.value = savedTheme;
            } else {
                console.warn("themeToggle element not found.");
            }
        }
    } catch (error) {
        console.error("Error loading theme:", error);
    }
}

// ==========================================================================
// History Management
// ==========================================================================

// Array untuk menyimpan riwayat perhitungan
let calculationHistory = [];
const itemsPerPage = 5; // Jumlah item per halaman
let currentPage = 1;     // Halaman saat ini

// Fungsi untuk menyimpan perhitungan ke dalam riwayat
function saveToHistory(formData, results) {
  const historyItem = {
      timestamp: new Date().toLocaleString(),
      formData: formData,
      results: results
  };

  // Periksa apakah item yang sama sudah ada
  const alreadyExists = calculationHistory.some(item => {
      return (
          item.timestamp === historyItem.timestamp &&
          JSON.stringify(item.formData) === JSON.stringify(historyItem.formData) &&
          JSON.stringify(item.results) === JSON.stringify(historyItem.results)
      );
  });

  if (!alreadyExists) {
      calculationHistory.push(historyItem);
      localStorage.setItem('calculationHistory', JSON.stringify(calculationHistory));
      updateHistoryList();
  } else {
      console.log("Riwayat sudah ada, tidak disimpan lagi.");
  }
}

let historyLoaded = false; // Flag baru

// Fungsi untuk memuat riwayat dari localStorage saat halaman dimuat
function loadHistory() {
    console.log("loadHistory() dipanggil");

    if (historyLoaded) {
        console.log("loadHistory() diabaikan: sudah dimuat sebelumnya");
        return;
    }

    try {
        const storedHistory = localStorage.getItem('calculationHistory');
        
        if (storedHistory) {
            calculationHistory = JSON.parse(storedHistory);

            // Pastikan data valid (array)
            if (!Array.isArray(calculationHistory)) {
                console.warn("Data riwayat tidak valid, menginisialisasi ulang.");
                calculationHistory = [];
            }
        } else {
            console.log("Tidak ada riwayat tersimpan, memulai dengan array kosong.");
            calculationHistory = [];
        }
    } catch (error) {
        console.error("Gagal memuat riwayat dari localStorage:", error);
        calculationHistory = []; // Fallback ke array kosong
    }

    updateHistoryList();
    historyLoaded = true; // Set flag ke true
}

// Fungsi untuk menampilkan detail riwayat dalam modal
function showHistoryDetail(index) {
    const item = calculationHistory[index];
    const detailContent = `
        <p><strong>Waktu:</strong> ${item.timestamp}</p>
        <p><strong>Jenis EGI:</strong> ${item.formData.vehicleType}</p>
        <p><strong>Waktu Kerja Efektif:</strong> ${item.formData.wke}</p>
        <p><strong>Spotting Time:</strong> ${item.formData.st}</p>
        <p><strong>Loading Time:</strong> ${item.formData.lt}</p>
        <p><strong>CT HD:</strong> ${item.formData.ct}</p>
        <p><strong>Jumlah HD:</strong> ${item.formData.n}</p>
        <p><strong>Jarak Front Ke Disposal:</strong> ${item.formData.s}</p>
        <p><strong>Kecepatan HD:</strong> ${item.formData.v}</p>
        <hr>
        <p><strong>Ritase:</strong> ${item.results.ritase} Rit/Jam</p>
        <p><strong>Produktivitas:</strong> ${item.results.produktivitas} Bcm/Jam</p>
    `;
    document.getElementById('historyDetailContent').innerHTML = detailContent;
    document.getElementById('historyDetailModal').style.display = 'block';
}

// Fungsi untuk menutup modal detail riwayat
function closeHistoryDetailModal() {
    document.getElementById('historyDetailModal').style.display = 'none';
}

// Fungsi untuk menghapus item riwayat
function deleteHistoryItem(index) {
    calculationHistory.splice(index, 1);
    localStorage.setItem('calculationHistory', JSON.stringify(calculationHistory));
    updateHistoryList();
}

// Fungsi untuk menghapus semua riwayat
function clearHistory() {
    calculationHistory = [];
    localStorage.removeItem('calculationHistory');
    updateHistoryList();
}

// Fungsi untuk mengurutkan riwayat
function sortHistory(sortOrder) {
    let sortedHistory = [...calculationHistory];

    switch (sortOrder) {
        case 'timestamp_desc':
            sortedHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            break;
        case 'timestamp_asc':
            sortedHistory.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            break;
        case 'vehicleType_asc':
            sortedHistory.sort((a, b) => a.formData.vehicleType.localeCompare(b.formData.vehicleType));
            break;
        case 'vehicleType_desc':
            sortedHistory.sort((a, b) => b.formData.vehicleType.localeCompare(a.formData.vehicleType));
            break;
    }

    updateHistoryList(sortedHistory);
}


// Fungsi untuk memfilter riwayat
function filterHistory(filterType) {
    if (filterType === 'all') {
        // Tidak perlu memfilter, tampilkan semua
        loadHistory();
    } else {
        const storedHistory = localStorage.getItem('calculationHistory');
        calculationHistory = JSON.parse(storedHistory);
        calculationHistory = calculationHistory.filter(item => item.formData.vehicleType === filterType);

    }
    updateHistoryList();
}

// Fungsi untuk mengupdate tampilan daftar riwayat dengan paginasi
function updateHistoryList() {
    const historyList = document.getElementById('historyList');
    if (!historyList) {
        console.error("historyList element not found");
        return;
    }
    historyList.innerHTML = '';

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentHistory = calculationHistory.slice(startIndex, endIndex);

    currentHistory.forEach((item, index) => {
        const globalIndex = startIndex + index;  // index dalam array calculationHistory

        const historyItemElement = document.createElement('div');
        historyItemElement.classList.add('history-item');

        const historyItemDetails = document.createElement('div');
        historyItemDetails.classList.add('history-item-details');
        historyItemDetails.innerHTML = `
            <p><strong>Waktu:</strong> ${item.timestamp}</p>
            <p><strong>Jenis EGI:</strong> ${item.formData.vehicleType}, <strong>WKE:</strong> ${item.formData.wke}, <strong>Jumlah HD:</strong> ${item.formData.n}</p>
            <p><strong>Ritase:</strong> ${item.results.ritase} Rit/Jam, <strong>Produktivitas:</strong> ${item.results.produktivitas} Bcm/Jam</p>
        `;
        historyItemElement.appendChild(historyItemDetails);

        const historyItemActions = document.createElement('div');
        historyItemActions.classList.add('history-item-actions');

        const detailButton = document.createElement('button');
        detailButton.textContent = 'Detail';
        detailButton.classList.add('history-delete-btn'); // Menggunakan style yang sama dengan tombol delete
        detailButton.onclick = () => showHistoryDetail(globalIndex);
        historyItemActions.appendChild(detailButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Hapus';
        deleteButton.classList.add('history-delete-btn');
        deleteButton.onclick = () => deleteHistoryItem(globalIndex);
        historyItemActions.appendChild(deleteButton);

        historyItemElement.appendChild(historyItemActions);

        historyList.appendChild(historyItemElement);
    });

    updatePaginationButtons();
}

// Fungsi untuk mengupdate tombol paginasi
function updatePaginationButtons() {
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');

    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage * itemsPerPage >= calculationHistory.length;
}

const modal = document.getElementById('historyDetailModal');
const closeModal = document.querySelector('.history-detail-content .close');

document.querySelectorAll('.history-button').forEach(button => {
    button.addEventListener('click', () => {
        modal.classList.add('active');
    });
});

closeModal.addEventListener('click', () => {
    modal.classList.remove('active');
});

// ==========================================================================
// Form Submission and Calculation
// ==========================================================================

// Fungsi untuk mendapatkan data formulir
function getFormData() {
    return {
        vehicleType: document.getElementById('vehicleType').value,
        wke: parseFloat(document.getElementById('wke').value),
        st: parseFloat(document.getElementById('st').value),
        lt: parseFloat(document.getElementById('lt').value),
        ct: parseFloat(document.getElementById('ct').value),
        n: parseFloat(document.getElementById('n').value),
        s: parseFloat(document.getElementById('s').value),
        v: parseFloat(document.getElementById('v').value)
    };
}

// Fungsi untuk menampilkan pesan kesalahan
function showError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    } else {
        toastr.error(message, "Error");
    }
}

// Fungsi untuk menyembunyikan pesan kesalahan
function hideError(fieldId) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement) {
        errorElement.classList.add('hidden');
    }
}

// Fungsi untuk validasi input
function validateForm(formData) {
    let isValid = true;

    // Validasi Waktu Kerja Efektif (WKE)
    if (isNaN(formData.wke) || formData.wke <= 0) {
        showError('wke', 'Waktu Kerja Efektif harus berupa angka dan lebih besar dari 0.');
        isValid = false;
    } else {
        hideError('wke');
    }

    // Validasi Spotting Time (ST)
    if (isNaN(formData.st) || formData.st < 0) {
        showError('st', 'Spotting Time harus berupa angka positif.');
        isValid = false;
    } else {
        hideError('st');
    }

    // Validasi Loading Time (LT)
    if (isNaN(formData.lt) || formData.lt < 0) {
        showError('lt', 'Loading Time harus berupa angka positif.');
        isValid = false;
    } else {
        hideError('lt');
    }

    // Validasi CT HD
    if (isNaN(formData.ct) || formData.ct < 0) {
        showError('ct', 'CT HD harus berupa angka positif.');
        isValid = false;
    } else {
        hideError('ct');
    }

    // Validasi Jumlah HD
    if (isNaN(formData.n) || formData.n <= 0) {
        showError('n', 'Jumlah HD harus berupa angka dan lebih besar dari 0.');
        isValid = false;
    } else {
        hideError('n');
    }

    // Validasi Jarak Front Ke Disposal
    if (isNaN(formData.s) || formData.s < 0) {
        showError('s', 'Jarak Front Ke Disposal harus berupa angka positif.');
        isValid = false;
    } else {
        hideError('s');
    }

    // Validasi Kecepatan HD
    if (isNaN(formData.v) || formData.v < 0 || formData.v > 99.9) {
        showError('v', 'Kecepatan HD harus berupa angka positif dan maksimal 99.9 km/jam.');
        isValid = false;
    } else {
        hideError('v');
    }

    return isValid;
}

// Fungsi untuk melakukan perhitungan
function calculateResults(formData) {
    const { vehicleType, wke, st, lt, ct, n, s, v } = formData;
    const target = targetValues[vehicleType];

    if (!target) {
        toastr.error("Tipe kendaraan tidak valid.", "Error");
        return null;
    }

    //Konversi satuan kecepatan dari Km/jam ke Km/menit
    const kecepatanKmPerMenit = v / 60;

    // Calculate target ideal CT
    const targetIdealLt = target.lt;
    const targetIdealSt = target.st / 60;
    const targetIdealCt = (((s / 23) * 60) + 1) + targetIdealSt + targetIdealLt;

    // Calculate actual CT
    const actualCt = (((s / v) * 60) + 1) + (st / 60) + lt;

    // Calculate ritase and productivity
    const ritase = Math.round((wke / ((ct) + (st/60) + lt)) * n);
    const produktivitas = Math.round(ritase * 42);

    return {
        ritase,
        produktivitas,
        targetRitase: target.ritase,
        targetProduktivitas: target.produktivitas,
        wke,
        st,
        v,
        ct,
        lt,
        target,
        targetIdealCt, //Hanya return target ideal CT, karena actual CT sudah dihapus
        vehicleType
    };
}

// Fungsi untuk menampilkan hasil perhitungan
function displayResults(results) {
    if (!results) return;

    document.getElementById('ritase').innerHTML = `<i class="fas fa-truck-loading mr-2"></i>Ritase: ${results.ritase} Rit/Jam`;
    document.getElementById('produktivitas').innerHTML = `<i class="fas fa-mountain mr-2"></i>Produktivitas: ${results.produktivitas} Bcm/Jam`;
    document.getElementById('results').classList.remove('hidden');
}

// ==========================================================================
// Warnings and Suggestions
// ==========================================================================

// Konfigurasi (Magic Numbers disimpan di sini untuk kemudahan pemeliharaan)
const konfigurasi = {
    kecepatanIdealHD: 23, // Kecepatan ideal Hauling Truck (HD) dalam km/jam
    waktuKerjaEfektifIdeal: 60 // Waktu Kerja Efektif (WKE) ideal dalam menit
};

// Data Target EGI (Letakkan di sini, sebelum fungsi lain)
const targetData = {
    'PC1250': { targetSpottingTime: 11, loadingTime: 3.2 },
    'PC2000-8': { targetSpottingTime: 11, loadingTime: 2.16 },
    'PC2000-11R': { targetSpottingTime: 11, loadingTime: 1.86 },
    'EX2600': { targetSpottingTime: 11, loadingTime: 1.5 }
};

/**
 * Fungsi pembantu untuk membulatkan angka ke dua tempat desimal dan mengembalikan string.
 * Digunakan untuk memastikan format angka yang konsisten.
 * @param {number} num Angka yang akan dibulatkan.
 * @returns {string} Angka yang dibulatkan sebagai string.
 */
function roundToTwo(num) {
    return +(Math.round(num + "e+2") + "e-2");
}

/**
 * Fungsi pembantu untuk menghilangkan ".00" dari angka jika bilangan bulat.
 * Contoh: 10.00 menjadi 10, 9.50 menjadi 9.5
 * @param {number|string} num Angka yang akan diformat.
 * @returns {string} Angka yang diformat sebagai string.
 */
function formatNumberWithoutDecimals(num) {
    const formattedNum = Number(num).toFixed(2);
    const numStr = formattedNum.replace(/\.00$/, ''); // Hilangkan .00
    return numStr.replace(/\.([0-9])0$/, '.$1'); // Hilangkan angka 0 di belakang koma (contoh: .70 menjadi .7)
}

/**
 * Fungsi pembantu untuk membuat teks saran ritase.
 * Menghitung dan menyajikan potensi perubahan ritase berdasarkan perbaikan yang disarankan.
 * @param {number} perkiraanRitase Ritase yang diperkirakan setelah perbaikan.
 * @param {number} targetRitase Target ritase yang diinginkan.
 * @param {number} ritaseSaatIni Ritase saat ini.
 * @returns {string} Teks saran ritase.
 */
function createRitaseSuggestionText(perkiraanRitase, targetRitase, ritaseSaatIni) {
    // Bulatkan semua nilai ritase *untuk ditampilkan* (tapi gunakan nilai aslinya untuk perhitungan)
    const perkiraanRitaseBulat = formatNumberWithoutDecimals(perkiraanRitase);
    const ritaseSaatIniBulat = Math.round(ritaseSaatIni);

    const selisihRitase = perkiraanRitase - ritaseSaatIni; //Hitung selisihnya

    if (selisihRitase < 0) {
        // Perkiraan ritase lebih rendah, tampilkan pesan penurunan
        const potensiPenurunanBulat = Math.round(Math.abs(selisihRitase));

        return ` Perubahan ini berpotensi menurunkan ritase sekitar ${formatNumberWithoutDecimals(potensiPenurunanBulat)} rit/jam dari ritase saat ini ${formatNumberWithoutDecimals(ritaseSaatIniBulat)} rit/jam.`;
    } else if (selisihRitase > 0) {
        // Perkiraan ritase sama atau lebih tinggi, tampilkan pesan perbaikan
        const peningkatanRitaseBulat = formatNumberWithoutDecimals(selisihRitase);

        return `Perubahan ini berpotensi meningkatkan ritase sekitar ${formatNumberWithoutDecimals(peningkatanRitaseBulat)} rit/jam dari ritase saat ini ${formatNumberWithoutDecimals(ritaseSaatIniBulat)} rit/jam.`;
    } else {
        // Selisih ritase adalah 0, tampilkan pesan netral
        return ` Perubahan ini diperkirakan tidak akan memengaruhi ritase.`;
    }
}

/**
 * Fungsi utama untuk menghasilkan peringatan dan saran berdasarkan hasil perhitungan dan data formulir.
 * @param {object} results Objek yang berisi hasil perhitungan (ritase, produktivitas, dll.).
 * @param {object} formData Objek yang berisi data formulir yang dimasukkan pengguna.
 * @returns {string} HTML yang berisi peringatan dan saran
 */
function generateWarnings(results, formData) {
    let warnings = '';

    try {
        // Destructuring objek hasil dan formulir dengan nilai default untuk menghindari error
        const {
            produktivitas = 0,
            targetRitase = 0,
            targetProduktivitas = 0,
            wke = 0,
            st = 0,
            v = 0,
            ct = 0,
            lt = 0,
            target = {}, // Objek default kosong
            targetIdealCt = 0,
            vehicleType = 'Unknown', // Nilai default string
            s: jarakHauling = 0 // Ganti 's' dengan nama yang lebih deskriptif, nilai default 0
        } = results || {}; // Objek default kosong jika results undefined

        const { n: jumlahHD = 1 } = formData || {}; // Jumlah HD, nilai default 1 jika undefined

        console.log("Vehicle Type:", vehicleType);
        console.log("ct (Cycle Time input pengguna):", ct);
        console.log("jumlahHD (Jumlah HD):", jumlahHD); // Tambahkan log untuk jumlahHD
        console.log("targetIdealCt (Target Ideal Cycle Time):", targetIdealCt);

        const dataTargetEGI = targetData[vehicleType];

        if (!dataTargetEGI) {
            console.warn("Jenis EGI tidak ditemukan dalam data target:", vehicleType);
            return `<p class="text-danger">Jenis EGI tidak dikenal: ${vehicleType}. Tidak dapat memberikan saran yang akurat.</p>`;
        }
        const targetIdealSt = dataTargetEGI.targetSpottingTime / 60; // Konversi ke menit
        const targetIdealLt = dataTargetEGI.loadingTime;

        // Hitung ritase awal menggunakan rumus yang sama *dengan jumlahHD*
        const ritase = Math.round((wke / ((ct) + (st/60) + lt)) * jumlahHD);

        // Periksa apakah target produktivitas dan ritase sudah tercapai
        if (ritase >= targetRitase && produktivitas >= targetProduktivitas) {
            warnings = `<p class="text-success"><i class="fas fa-check-circle mr-2"></i>Target Produktivitas/Ritase sudah tercapai, PERTAHANKAN!!!</p>`;
        } else {
            // Peringatan umum jika target belum tercapai
            warnings = `<p class="text-warning"><i class="fas fa-exclamation-triangle mr-2"></i>Peringatan: Produktivitas di bawah target (${formatNumberWithoutDecimals(targetProduktivitas)} Bcm/Jam) dan/atau Ritase di bawah target (${formatNumberWithoutDecimals(targetRitase)} Rit/Jam).</p>`;
            warnings += '<p class="text-mining-light"><i class="fas fa-lightbulb mr-2"></i>Untuk mencapai target di atas, maka perlu beberapa perbaikan:</p>';

            // 1. Saran WKE (Waktu Kerja Efektif)
            if (wke !== konfigurasi.waktuKerjaEfektifIdeal) {
                warnings += `<p class="text-warning"><i class="fas fa-exclamation-triangle mr-2"></i>Peringatan: Waktu Kerja Efektif idealnya ${formatNumberWithoutDecimals(konfigurasi.waktuKerjaEfektifIdeal)} menit.</p>`;
                const wkeDiff = Math.abs(wke - konfigurasi.waktuKerjaEfektifIdeal);
                const perkiraanWKEBaru = konfigurasi.waktuKerjaEfektifIdeal;

                // Hitung ritase baru *dengan WKE yang baru dan jumlahHD*
                const perkiraanRitaseKarenaWKE = Math.round((perkiraanWKEBaru / (ct + (st/60) + lt)) * jumlahHD);

                let ritaseSuggestionText = `Saran: ${wke > konfigurasi.waktuKerjaEfektifIdeal ? 'Kurangi' : 'Tingkatkan'} Waktu Kerja Efektif sebanyak ${formatNumberWithoutDecimals(wkeDiff)} menit.`;
                ritaseSuggestionText += createRitaseSuggestionText(perkiraanRitaseKarenaWKE, targetRitase, ritase);
                warnings += `<p class="text-mining-light"><i class="fas fa-tools mr-2"></i>${ritaseSuggestionText}</p>`;
            }

            // 2. Saran Spotting Time (ST)
            if (target && target.st !== undefined && st !== target.st) {
                warnings += `<p class="text-warning"><i class="fas fa-exclamation-triangle mr-2"></i>Peringatan: Spotting Time sebaiknya ${formatNumberWithoutDecimals(target.st)} detik.</p>`;

                const stDiff = Math.abs(st - target.st);

                // Hitung ritase baru *dengan CT yang baru dan jumlahHD*
                const perkiraanRitaseKarenaST = Math.round((wke / ((ct) + targetIdealSt + lt)) * jumlahHD);

                let ritaseSuggestionText = `Saran: Kurangi Spotting Time sebanyak ${formatNumberWithoutDecimals(stDiff)} detik.`;
                ritaseSuggestionText += createRitaseSuggestionText(perkiraanRitaseKarenaST, targetRitase, ritase);
                warnings += `<p class="text-mining-light"><i class="fas fa-tools mr-2"></i>${ritaseSuggestionText}</p>`;
            }

             // 3. Saran Loading Time (LT)
            if (target && target.lt !== undefined) {
                if (lt < target.lt) {
                    warnings += `<p class="text-success"><i class="fas fa-check-circle mr-2"></i>Loading Time sudah ideal (dibawah atau sama dengan ${formatNumberWithoutDecimals(target.lt)} menit). PERTAHANKAN!</p>`;
                } else if (lt > target.lt) {
                    warnings += `<p class="text-warning"><i class="fas fa-exclamation-triangle mr-2"></i>Peringatan: Loading Time saat ini melebihi target ideal. Loading Time sebaiknya ${formatNumberWithoutDecimals(target.lt)} menit.</p>`;
                    const ltDiff = Math.abs(lt - target.lt);

                    // Hitung ritase baru *dengan target Loading Time*
                    const perkiraanRitaseKarenaLT = Math.round((wke / ((ct) + (st/60) + target.lt)) * jumlahHD);

                    let ritaseSuggestionText = `Saran: Kurangi Loading Time sebanyak ${formatNumberWithoutDecimals(ltDiff)} menit.`;
                    ritaseSuggestionText += createRitaseSuggestionText(perkiraanRitaseKarenaLT, targetRitase, ritase);
                    warnings += `<p class="text-mining-light"><i class="fas fa-tools mr-2"></i>${ritaseSuggestionText}</p>`;
                } else {
                  // Tambahkan blok `else` jika lt sama dengan target.lt
                  warnings += `<p class="text-success"><i class="fas fa-check-circle mr-2"></i>Loading Time sudah ideal (sama dengan ${formatNumberWithoutDecimals(target.lt)} menit). PERTAHANKAN!</p>`;
              }
            }

            // 4. Saran Cycle Time HD (CT)
            if (ct > targetIdealCt) {
                warnings += `<p class="text-warning"><i class="fas fa-exclamation-triangle mr-2"></i>Peringatan: CT HD sebaiknya ${formatNumberWithoutDecimals(targetIdealCt)} menit.</p>`;
                const ctDiff = Math.abs(ct - targetIdealCt);

                // Hitung ritase baru *dengan CT yang baru dan jumlahHD*
                const perkiraanRitaseKarenaCT = Math.round((wke / ((targetIdealCt) + (st/60) + lt)) * jumlahHD);

                let ritaseSuggestionText = `Saran: Kurangi CT HD sebanyak ${formatNumberWithoutDecimals(ctDiff)} menit, Cycle time Baru = ${formatNumberWithoutDecimals(targetIdealCt)} menit.`;
                ritaseSuggestionText += createRitaseSuggestionText(perkiraanRitaseKarenaCT, targetRitase, ritase);
                warnings += `<p class="text-mining-light"><i class="fas fa-tools mr-2"></i>${ritaseSuggestionText}</p>`;
            }

            // 5. Saran Jumlah HD (Hauling Truck)
            const hdDiff = Math.ceil(targetRitase / (wke / (ct + targetIdealSt + targetIdealLt)) - jumlahHD);
            if (hdDiff > 0) {
                warnings += `<p class="text-warning"><i class="fas fa-exclamation-triangle mr-2"></i>Peringatan: Jumlah HD sebaiknya ditingkatkan sebanyak ${formatNumberWithoutDecimals(hdDiff)} unit.</p>`;

                // Hitung perkiraan ritase dengan jumlah HD yang baru
                const perkiraanRitaseKarenaHD = Math.round((wke / ((ct) + (st/60) + lt)) * (jumlahHD + hdDiff));

                let hdSuggestionTextSaran = `Saran: Tingkatkan Jumlah HD sebanyak ${formatNumberWithoutDecimals(hdDiff)} unit.`;
                // Tambahkan createRitaseSuggestionText hanya jika ritase belum melebihi target
                if (ritase < targetRitase) {
                    hdSuggestionTextSaran += createRitaseSuggestionText(perkiraanRitaseKarenaHD, targetRitase, ritase);
                }
                warnings += `<p class="text-mining-light"><i class="fas fa-tools mr-2"></i>${hdSuggestionTextSaran}</p>`;
            }
            // 6. Saran Kecepatan HD
            if (v < konfigurasi.kecepatanIdealHD) {
                console.log("Saran Kecepatan HD: v =", v);
                warnings += `<p class="text-warning"><i class="fas fa-exclamation-triangle mr-2"></i>Peringatan: Kecepatan HD sebaiknya ${formatNumberWithoutDecimals(konfigurasi.kecepatanIdealHD)} Km/jam.</p>`;
                const vDiff = Math.abs(v - konfigurasi.kecepatanIdealHD);
                const vTarget = konfigurasi.kecepatanIdealHD;

                // Ambil nilai jarakHauling dan kecepatan dari input dan trim spasi
                console.log("Mengambil nilai dari input...");
                const jarakHaulingStr = document.getElementById('s') ? document.getElementById('s').value.trim() : '0';
                const vStr = document.getElementById('v') ? document.getElementById('v').value.trim() : '0';

                // Konversi ke angka
                console.log("Konversi ke angka...");
                const jarakHauling = parseFloat(jarakHaaulingStr);
                const kecepatanHDInput = parseFloat(vStr); // Variabel baru untuk nilai input

                // Pemeriksaan untuk nilai jarakHauling dan v yang valid
                console.log("Validasi nilai...");
                if (isNaN(jarakHauling) || jarakHauling <= 0) {
                    console.error("Jarak (s) tidak valid!");
                    warnings += `<p class="text-warning">Jarak Front Ke Disposal tidak valid, tidak dapat memberikan saran kecepatan.</p>`;
                } else if (isNaN(kecepatanHDInput) || kecepatanHDInput <= 0) {
                    console.error("Kecepatan (v) tidak valid!");
                    warnings += `<p class="text-warning">Kecepatan HD tidak valid, tidak dapat memberikan saran kecepatan.</p>`;
                } else {
                    // Semua nilai valid, lakukan perhitungan
                    console.log("Semua nilai valid, melakukan perhitungan...");
                    const MINUTES_PER_HOUR = 60;
                    const FIXED_TIME = 1;

                    const ctSaatIni = (((jarakHauling / kecepatanHDInput) * MINUTES_PER_HOUR) + FIXED_TIME) + (st / MINUTES_PER_HOUR) + lt;
                    const ctTarget = (((jarakHauling / vTarget) * MINUTES_PER_HOUR) + FIXED_TIME) + (st / MINUTES_PER_HOUR) + lt;
                    const ctReduction = ctSaatIni - ctTarget;
                    const perkiraanRitaseKarenaV = Math.round((wke / ((ctTarget) + targetIdealSt + targetIdealLt)) * jumlahHD);

                    let vSuggestionText = `Saran: Tingkatkan kecepatan HD sebanyak ${formatNumberWithoutDecimals(vDiff)} km/jam. Ini berpotensi mengurangi Cycle Time HD sebanyak ${formatNumberWithoutDecimals(ctReduction)} menit.`;
                    vSuggestionText += createRitaseSuggestionText(perkiraanRitaseKarenaV, targetRitase, ritase);
                    warnings += `<p class="text-mining-light"><i class="fas fa-tools mr-2"></i>${vSuggestionText}</p>`;
                }
            }
        }

        // Saran untuk mengurangi jumlah HD jika ritase terlalu tinggi
        if (ritase > targetRitase) {
            console.log("Ritase melebihi target!");
            const excessRitase = ritase - targetRitase;
            const hdReduction = Math.floor(excessRitase / 2);
            console.log("Kelebihan ritase:", excessRitase);
            console.log("Pengurangan HD:", hdReduction);
            if (hdReduction > 0) {
                warnings += `<p class="text-warning"><i class="fas fa-exclamation-triangle mr-2"></i> Sebaiknya kurangi jumlah HD sebanyak ${formatNumberWithoutDecimals(hdReduction)} unit.</p>`;
            }
        }
    } catch (error) {
        console.error("Terjadi kesalahan dalam generateWarnings:", error);
        warnings = `<p class="text-danger"><i class="fas fa-exclamation-circle mr-2"></i>Terjadi kesalahan: ${error.message}.  Periksa input Anda.</p>`;
    }

    return warnings;
}

// ==========================================================================
// Chart Management
// ==========================================================================

// Fungsi untuk membuat atau memperbarui grafik
function createCharts(results) {
    if (!results) return;

    const { ritase, produktivitas, targetRitase, targetProduktivitas } = results;

    const chartOptions = {
        type: 'bar',
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Nilai'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Parameter'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += context.parsed.y;
                            return label;
                        }
                    }
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1500,
                easing: 'easeInOutQuad'
            }
        }
    };

    const ritaseData= {
        labels: ['Ritase'],
        datasets: [{
            label: 'Aktual',
            data: [ritase],
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        },
        {
            label: 'Target',
            data: [targetRitase],
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
        }]
    };

    const produktivitasData = {
        labels: ['Produktivitas'],
        datasets: [{
            label: 'Aktual',
            data: [produktivitas],
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        },
        {
            label: 'Target',
            data: [targetProduktivitas],
            backgroundColor: 'rgba(255, 206, 86, 0.7)',
            borderColor: 'rgba(255, 206, 86, 1)',
            borderWidth: 1
        }]
    };

    createOrUpdateChart('ritaseChart', ritaseData, chartOptions);
    createOrUpdateChart('produktivitasChart', produktivitasData, chartOptions);
}

function createOrUpdateChart(chartId, chartData, options) {
    const ctx = document.getElementById(chartId).getContext('2d');

    if (ctx) {
        // Hancurkan instance chart sebelumnya jika ada
        if (chartId === 'ritaseChart' && ritaseChart) {
            ritaseChart.destroy();
        } else if (chartId === 'produktivitasChart' && produktivitasChart) {
            produktivitasChart.destroy();
        }

        // Buat instance chart baru
        if (chartId === 'ritaseChart') {
            ritaseChart = new Chart(ctx, {
                type: options.type,
                data: chartData,
                options: options.options
            });
        } else if (chartId === 'produktivitasChart') {
            produktivitasChart = new Chart(ctx, {
                type: options.type,
                data: chartData,
                options: options.options
            });
        }
    } else {
        console.error('Tidak dapat mendapatkan konteks 2D untuk ' + chartId);
    }
}

// ==========================================================================
// History Management
// ==========================================================================

// Array untuk menyimpan riwayat perhitungan
let calculationHistory = [];
const itemsPerPage = 5; // Jumlah item per halaman
let currentPage = 1;     // Halaman saat ini

// Fungsi untuk menyimpan perhitungan ke dalam riwayat
function saveToHistory(formData, results) {
    const historyItem = {
        timestamp: new Date().toLocaleString(),
        formData: formData,
        results: results
    };
        
    // Periksa apakah item yang sama sudah ada
    const alreadyExists = calculationHistory.some(item => {
        return (
            item.timestamp === historyItem.timestamp &&
            JSON.stringify(item.formData) === JSON.stringify(historyItem.formData) &&
            JSON.stringify(item.results) === JSON.stringify(historyItem.results)
        );
    });
        
    if (!alreadyExists) {
        calculationHistory.push(historyItem);
        localStorage.setItem('calculationHistory', JSON.stringify(calculationHistory));
        updateHistoryList();
    } else {
        console.log("Riwayat sudah ada, tidak disimpan lagi.");
    }
}
        
let historyLoaded = false; // Flag baru
        
// Fungsi untuk memuat riwayat dari localStorage saat halaman dimuat
function loadHistory() {
    console.log("loadHistory() dipanggil");
    if (!historyLoaded) {
        const storedHistory = localStorage.getItem('calculationHistory');
        if (storedHistory) {
            calculationHistory = JSON.parse(storedHistory);
        }
        updateHistoryList();
        historyLoaded = true; // Set flag ke true
    } else {
        console.log("loadHistory() diabaikan: sudah dimuat sebelumnya");
    }
}

// Fungsi untuk menampilkan detail riwayat dalam modal
function showHistoryDetail(index) {
    const item = calculationHistory[index];
    const detailContent = `
        <p><strong>Waktu:</strong> ${item.timestamp}</p>
        <p><strong>Jenis EGI:</strong> ${item.formData.vehicleType}</p>
        <p><strong>Waktu Kerja Efektif:</strong> ${item.formData.wke}</p>
        <p><strong>Spotting Time:</strong> ${item.formData.st}</p>
        <p><strong>Loading Time:</strong> ${item.formData.lt}</p>
        <p><strong>CT HD:</strong> ${item.formData.ct}</p>
        <p><strong>Jumlah HD:</strong> ${item.formData.n}</p>
        <p><strong>Jarak Front Ke Disposal:</strong> ${item.formData.s}</p>
        <p><strong>Kecepatan HD:</strong> ${item.formData.v}</p>
        <hr>
        <p><strong>Ritase:</strong> ${item.results.ritase} Rit/Jam</p>
        <p><strong>Produktivitas:</strong> ${item.results.produktivitas} Bcm/Jam</p>
    `;
    document.getElementById('historyDetailContent').innerHTML = detailContent;
    document.getElementById('historyDetailModal').style.display = 'block';
}

// Fungsi untuk menutup modal detail riwayat
function closeHistoryDetailModal() {
    document.getElementById('historyDetailModal').style.display = 'none';
}

// Fungsi untuk menghapus item riwayat
function deleteHistoryItem(index) {
    calculationHistory.splice(index, 1);
    localStorage.setItem('calculationHistory', JSON.stringify(calculationHistory));
    updateHistoryList();
}

// Fungsi untuk menghapus semua riwayat
function clearHistory() {
    calculationHistory = [];
    localStorage.removeItem('calculationHistory');
    updateHistoryList();
}

// Fungsi untuk mengurutkan riwayat
function sortHistory(sortOrder) {
    switch (sortOrder) {
        case 'timestamp_desc':
            calculationHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            break;
        case 'timestamp_asc':
            calculationHistory.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            break;
        case 'vehicleType_asc':
            calculationHistory.sort((a, b) => a.formData.vehicleType.localeCompare(b.formData.vehicleType));
            break;
        case 'vehicleType_desc':
            calculationHistory.sort((a, b) => b.formData.vehicleType.localeCompare(a.formData.vehicleType));
            break;
        // Tambahkan case lain untuk opsi penyortiran lain
    }
    updateHistoryList();
}

// Fungsi untuk memfilter riwayat
function filterHistory(filterType) {
    if (filterType === 'all') {
        // Tidak perlu memfilter, tampilkan semua
        loadHistory();
    } else {
        const storedHistory = localStorage.getItem('calculationHistory');
        calculationHistory = JSON.parse(storedHistory);
        calculationHistory = calculationHistory.filter(item => item.formData.vehicleType === filterType);

    }
    updateHistoryList();
}

// Fungsi untuk mengupdate tampilan daftar riwayat dengan paginasi
function updateHistoryList() {
    const historyList = document.getElementById('historyList');
    if (!historyList) {
        console.error("historyList element not found");
        return;
    }
    historyList.innerHTML = '';

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentHistory = calculationHistory.slice(startIndex, endIndex);

    currentHistory.forEach((item, index) => {
        const globalIndex = startIndex + index;  // index dalam array calculationHistory

        const historyItemElement = document.createElement('div');
        historyItemElement.classList.add('history-item');

        const historyItemDetails = document.createElement('div');
        historyItemDetails.classList.add('history-item-details');
        historyItemDetails.innerHTML = `
            <p><strong>Waktu:</strong> ${item.timestamp}</p>
            <p><strong>Jenis EGI:</strong> ${item.formData.vehicleType}, <strong>WKE:</strong> ${item.formData.wke}, <strong>Jumlah HD:</strong> ${item.formData.n}</p>
            <p><strong>Ritase:</strong> ${item.results.ritase} Rit/Jam, <strong>Produktivitas:</strong> ${item.results.produktivitas} Bcm/Jam</p>
        `;
        historyItemElement.appendChild(historyItemDetails);

        const historyItemActions = document.createElement('div');
        historyItemActions.classList.add('history-item-actions');

        const detailButton = document.createElement('button');
        detailButton.textContent = 'Detail';
        detailButton.classList.add('history-delete-btn'); // Menggunakan style yang sama dengan tombol delete
        detailButton.onclick = () => showHistoryDetail(globalIndex);
        historyItemActions.appendChild(detailButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Hapus';
        deleteButton.classList.add('history-delete-btn');
        deleteButton.onclick = () => deleteHistoryItem(globalIndex);
        historyItemActions.appendChild(deleteButton);

        historyItemElement.appendChild(historyItemActions);

        historyList.appendChild(historyItemElement);
    });

    updatePaginationButtons();
}

// Fungsi untuk mengupdate tombol paginasi
function updatePaginationButtons() {
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');

    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage * itemsPerPage >= calculationHistory.length;
}

// ==========================================================================
// Event Listeners and Initializations
// ==========================================================================

// Event listener untuk tombol halaman sebelumnya
document.addEventListener('DOMContentLoaded', () => {
        
    const prevPageBtn = document.getElementById('prevPageBtn');
    if (prevPageBtn) {
      prevPageBtn.addEventListener('click', () => {
          if (currentPage > 1) {
              currentPage--;
              updateHistoryList();
          }
      });
    } else {
        console.warn("Tombol 'prevPageBtn' tidak ditemukan.");
    }

    // Event listener untuk tombol halaman selanjutnya
    const nextPageBtn = document.getElementById('nextPageBtn');
    if (nextPageBtn) {
      nextPageBtn.addEventListener('click', () => {
          if (currentPage * itemsPerPage < calculationHistory.length) {
              currentPage++;
              updateHistoryList();
          }
      });
    } else {
        console.warn("Tombol 'nextPageBtn' tidak ditemukan.");
    }

    // Event listener untuk tombol clear history
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if(clearHistoryBtn){
        clearHistoryBtn.addEventListener('click', () => {
            clearHistory();
        });
    }else {
        console.warn("Tombol 'clearHistoryBtn' tidak ditemukan.");
    }
});

// Event listener untuk form submit
document.getElementById('prodForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const formData = getFormData();

    if (validateForm(formData)) {
        const results = calculateResults(formData);
        if (results) {
            displayResults(results);
            const warnings = generateWarnings(results, formData);
            document.getElementById('warnings').innerHTML = warnings;
            document.getElementById('results').classList.remove('hidden');
            createCharts(results);
            saveToHistory(formData, results); // Simpan perhitungan ke riwayat
        }
    }
});

// Fungsi untuk menampilkan halaman dan mengatur tautan aktif
function showPage(pageId, link) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');

    const links = document.querySelectorAll('.nav-link-bottom');
    links.forEach(link => link.classList.remove('active'));
    link.classList.add('active');

    // Jika halaman yang ditampilkan adalah riwayat, perbarui daftarnya
    if (pageId === 'historyPage') {
        updateHistoryList();
    }
}

// Fungsi untuk menutup modal info
function closeInfoModal() {
    document.getElementById('infoModal').style.display = 'none';
}

// Fungsi untuk menampilkan info EGI
function displayEgiInfo() {
    const egiInfoModal = document.getElementById('egiInfoModal');
    let tableHTML = `<table class="egi-table">
                        <thead>
                            <tr>
                                <th>Jenis EGI</th>
                                <th>Target Ritase</th>
                                <th>Waktu Kerja Efektif (menit)</th>
                                <th>CT HD (menit)</th>
                                <th>Spotting Time (detik)</th>
                                <th>Produktivitas (Target)</th>
                                <th>Cycle Time (menit)</th>
                                <th>Loading Time (menit)</th>
                            </tr>
                        </thead>
                        <tbody>`;

    for (const vehicleType in targetValues) {
        if (targetValues.hasOwnProperty(vehicleType)) {
            const egi = targetValues[vehicleType];
            tableHTML += `
                <tr>
                    <td>${vehicleType}</td>
                    <td>${egi.ritase}</td>
                    <td>${egi.wke}</td>
                    <td>${egi.ct}</td>
                    <td>${egi.st}</td>
                    <td>${egi.produktivitas}</td>
                    <td>${egi.cycleTime}</td>
                    <td>${egi.lt}</td>
                </tr>`;
        }
    }

    tableHTML += `</tbody></table>`;
    egiInfoModal.innerHTML = tableHTML;
    document.getElementById('infoModal').style.display = 'block'; // Show the modal
}

// Fungsi untuk mengatur tema (terang/gelap)
function setTheme(theme) {
    const body = document.body;
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (theme === 'light') {
        body.classList.add('light-mode');
        themeToggleBtn.classList.add('light-mode');  // Tambahkan class ke tombol
    } else {
        body.classList.remove('light-mode');
        themeToggleBtn.classList.remove('light-mode'); // Hapus class dari tombol
    }
    localStorage.setItem('theme', theme); // Simpan preferensi tema
}

// Kode inisialisasi dan event listener untuk tombol switch mode
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const toggleThumb = document.getElementById('toggleThumb');

    // Cek tema yang tersimpan di localStorage saat halaman dimuat
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);

    // Tambahkan event listener ke tombol
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = localStorage.getItem('theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });

        
    registerServiceWorker();
    loadTheme();
    loadHistory();

    const splashScreen = document.getElementById('splash-screen');
        if (splashScreen) {
            setTimeout(() => {
                splashScreen.classList.add('hidden');
            }, 3000);
    }
});

document.getElementById('exportPdfBtn').addEventListener('click', function () {
console.log("Tombol Export PDF diklik");

const resultsElement = document.getElementById('results');
console.log("resultsElement:", resultsElement);

if (resultsElement) {
    console.log("Elemen hasil ditemukan");
    try {
        // Konfigurasi jsPDF - VERSI TERBARU
        const { jsPDF } = jspdf;  // Akses konstruktor jsPDF dengan benar
        const pdf = new jsPDF();
        pdf.setFontSize(12);

        // Judul Dokumen
        pdf.text("Hasil Perhitungan Produktivitas", 10, 10);

        let yOffset = 20; // Posisi awal untuk konten

        // Hasil Ritase dan Produktivitas
        const ritaseElement = document.getElementById('ritase');
        const produktivitasElement = document.getElementById('produktivitas');

        if (ritaseElement && produktivitasElement) {
            const ritaseText = ritaseElement.textContent;
            const produktivitasText = produktivitasElement.textContent;
            pdf.text(ritaseText, 15, yOffset);
            yOffset += 7;
            pdf.text(produktivitasText, 15, yOffset);
            yOffset += 15; // Spasi setelah hasil
        } else {
            console.warn("Elemen ritase atau produktivitas tidak ditemukan.");
            toastr.warning("Hasil ritase atau produktivitas tidak dapat diekspor.");
        }

        // Peringatan dan Saran
        const warningsElement = document.getElementById('warnings');
        if (warningsElement) {
            console.log("jsPDF instance:", pdf);
            pdf.setFontSize(12);
            const warningElements = warningsElement.querySelectorAll('p');
            warningElements.forEach(element => {
                pdf.text(element.textContent, 15, yOffset);
                yOffset += 7;
            });
        }

        // Charts
        const ritaseChartElement = document.getElementById('ritaseChart');
        if (ritaseChartElement) {
            try {
                console.log("Mencoba mendapatkan data URL untuk ritaseChart");
                const imgData = ritaseChartElement.toDataURL('image/png');
                console.log("Data URL ritaseChart berhasil didapatkan:", imgData.substring(0, 50) + "...");
                pdf.addImage(imgData, 'PNG', 15, yOffset, 180, 80);
                yOffset += 85;
            } catch (chartError) {
                console.error("Error adding ritase chart to PDF:", chartError);
                let errorMessage = "Gagal menambahkan grafik ritase ke PDF.";
                if (chartError instanceof Error && chartError.message) {
                    errorMessage += " " + chartError.message;
                } else {
                    errorMessage += " (Detail tidak tersedia)";
                }
                toastr.error(errorMessage, "Error");
            }
        }

        const produktivitasChartElement = document.getElementById('produktivitasChart');
        if (produktivitasChartElement) {
            try {
                console.log("Mencoba mendapatkan data URL untuk produktivitasChart");
                const imgData = produktivitasChartElement.toDataURL('image/png');
                console.log("Data URL produktivitasChart berhasil didapatkan:", imgData.substring(0, 50) + "...");
                pdf.addImage(imgData, 'PNG', 15, yOffset, 180, 80);
                yOffset += 85;
            } catch (chartError) {
                console.error("Error adding produktivitas chart to PDF:", chartError);
                let errorMessage = "Gagal menambahkan grafik produktivitas ke PDF.";
                if (chartError instanceof Error && chartError.message) {
                    errorMessage += " " + chartError.message;
                } else {
                    errorMessage += " (Detail tidak tersedia)";
                }
                toastr.error(errorMessage, "Error");
            }
        }

        try {
            pdf.save("hasil_produktivitas.pdf");
        } catch (saveError) {
            console.error("Gagal menyimpan PDF:", saveError);
            let errorMessage = "Gagal menyimpan PDF. Pastikan browser Anda mendukung penyimpanan file.";
            if (saveError instanceof Error && saveError.message) {
                errorMessage += " " + saveError.message;
            } else {
                errorMessage += " (Detail tidak tersedia)";
            }
            toastr.error(errorMessage, "Error");
        }
    } catch (overallError) {
        console.error("Terjadi kesalahan selama pembuatan PDF:", overallError);
        let errorMessage = "Terjadi kesalahan selama pembuatan PDF.";
        if (overallError instanceof Error && overallError.message) {
            errorMessage += " " + overallError.message;
        } else {
            errorMessage += " (Detail tidak tersedia)";
        }
        toastr.error(errorMessage, "Error");
    }
} else {
    console.log("Elemen hasil TIDAK ditemukan");
    toastr.error("Tidak ada hasil untuk diekspor.", "Error");
}
});

// Attach the displayEgiInfo function to the onclick event of the "Info EGI" navbar link
document.querySelector('.nav-link-bottom[href="#"]').addEventListener('click', function (event) {
    event.preventDefault(); // Prevent the default action
    if (this.querySelector('.fa-info-circle')) {
        displayEgiInfo();
    }
});

// ==========================================================================
// Fungsi untuk mengatur bahasa dan memicu terjemahan (Tambahkan di sini)
// ==========================================================================
// Fungsi untuk memuat tema yang disimpan
function loadTheme() {
    try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setTheme(savedTheme);
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.value = savedTheme;
            } else {
                console.warn("themeToggle element not found.");
            }
        }
    } catch (error) {
        console.error("Error loading theme:", error);
    }
}

// ==========================================================================
// Page Navigation
// ==========================================================================

// Fungsi untuk menampilkan halaman dan mengatur tautan aktif

// Fungsi untuk menampilkan halaman dan mengatur tautan aktif (Tambahkan di sini)

 /*
     * Saran:
     * - Pertimbangkan menggunakan linter (misalnya, ESLint) dan formatter (misalnya, Prettier)
     *   untuk menjaga konsistensi kode dan menemukan potensi masalah lebih awal.
     */
