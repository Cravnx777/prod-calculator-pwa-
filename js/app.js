console.log("App.js loaded");

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
document.addEventListener("DOMContentLoaded", function () {
    const splashScreen = document.getElementById("splash-screen");

    if (splashScreen) {
        setTimeout(() => {
            splashScreen.classList.add("hidden");
        }, 3000); // Splash screen akan hilang setelah 3 detik
    } else {
        console.warn("Element #splash-screen tidak ditemukan.");
    }
});


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
                const jarakHauling = parseFloat(jarakHaulingStr);
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
                easing: 'easeInOutQuad
    
