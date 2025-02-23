console.log("App.js loaded");

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

// Event listener untuk tombol export PDF
function setupExportPdfButton() {
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', function () {
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
    }
}

// Fungsi untuk memasang event listener ke tombol "Info EGI"
function setupEgiInfoButton() {
    const egiInfoButton = document.querySelector('.nav-link-bottom[href="#"]');
    if (egiInfoButton) {
        if (egiInfoButton.querySelector('.fa-info-circle')) {
            egiInfoButton.addEventListener('click', function (event) {
                event.preventDefault(); // Prevent the default action
                if (typeof displayEgiInfo === 'function') {
                    displayEgiInfo();
                } else {
                    console.warn("displayEgiInfo function is not defined.");
                }
            });
        }
    }
}

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    registerServiceWorker();
    setupExportPdfButton();
    setupEgiInfoButton();

    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
        setTimeout(() => {
            splashScreen.classList.add('hidden');
        }, 2000);
    }
});
