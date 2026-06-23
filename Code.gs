// Google Apps Script - Editor App (v5.3.0 - Single Use & Security Update)
// Sayfa "1": A=Lisans Anahtarı, B=Lisans Süresi, C=Durum, D=Aktivasyon Tarihi, E=Bitiş Tarihi, F=Cihaz Id, G=Sürüm, H=İndirme Linki
// Sayfa "2": A=Cihaz Id, B=Kurulum Tarihi, C=Durum, D=Lisans Anahtarı, E=Lisans Süresi, F=Lisans Başlangıç, G=Lisans Bitiş, H=Altyazı Hak, I=OtoCut Hak, J=Video Hak, K=Metin Hak, L=Son Kullanım, M=Ban

var LICENSE_SHEET = "1";
var DEVICE_SHEET  = "2";

function doGet(e) {
  var action      = e.parameter.action;
  var key         = e.parameter.key;
  var hwid        = e.parameter.hwid;
  var version     = e.parameter.version;
  var checkUpdate = e.parameter.checkUpdate;
  var checkOnly   = e.parameter.checkOnly;
  var feature     = e.parameter.feature;

  var lock = LockService.getScriptLock();
  try { lock.waitLock(15000); }
  catch (err) { return ContentService.createTextOutput("BUSY"); }

  var ss     = SpreadsheetApp.getActiveSpreadsheet();
  var sheet1 = ss.getSheetByName(LICENSE_SHEET);
  var sheet2 = ss.getSheetByName(DEVICE_SHEET);

  try {
    // ── Güncelleme Kontrolü ────────────────────────────────────────────────
    if (checkUpdate == "true") {
      var currentVer = "5.0.4";
      var updateLink = "https://bit.ly/editorapp_v5";
      try {
        var v = sheet1.getRange("G2").getValue().toString().trim();
        var l = sheet1.getRange("H2").getValue().toString().trim();
        if (v) currentVer = v;
        if (l) updateLink = l;
      } catch(err) {}

      // Duyuruları al (I sütunundaki tüm boş olmayan duyurular)
      var announcements = [];
      try {
        var lastRow = sheet1.getLastRow();
        if (lastRow >= 2) {
          var range = sheet1.getRange(2, 9, lastRow - 1, 1).getValues(); // 9. sütun (I)
          for (var i = 0; i < range.length; i++) {
            var val = range[i][0] ? range[i][0].toString().trim() : "";
            if (val && val !== "-" && val !== "") {
              announcements.push(val);
            }
          }
        }
      } catch(err) {}
      var annStr = announcements.join("||");

      if (version != currentVer) {
        return ContentService.createTextOutput("UPDATE|" + currentVer + "|" + updateLink + "|" + annStr);
      } else {
        return ContentService.createTextOutput("LATEST|" + currentVer + "|" + annStr);
      }
    }

    // ── Lisans Kaldır ──────────────────────────────────────────────────────
    if (action == "remove" && key && hwid) {
      return removeLicense(sheet1, sheet2, key, hwid);
    }

    // ── Kullanım Düş ───────────────────────────────────────────────────────
    if (action == "consume" && hwid && feature) {
      return consumeUsage(sheet2, hwid, feature);
    }

    // ── Sadece Durum Kontrol ───────────────────────────────────────────────
    if (checkOnly == "true" && hwid) {
      return checkStatus(sheet1, sheet2, key, hwid);
    }

    // ── Lisans Aktivasyonu ─────────────────────────────────────────────────
    if (key && hwid) {
      return activateLicense(sheet1, sheet2, key, hwid);
    }

    return ContentService.createTextOutput("INVALID_REQUEST");

  } catch (err) {
    return ContentService.createTextOutput("ERROR: " + err.toString());
  } finally {
    try { applyStyles(sheet1, sheet2); SpreadsheetApp.flush(); } catch(err) {}
    lock.releaseLock();
  }
}

// ── Lisans Durumu Kontrol ──────────────────────────────────────────────────
function checkStatus(sheet1, sheet2, key, hwid) {
  // Cihaz kaydı yoksa oluştur
  var deviceData = findRow(sheet2, 0, hwid);
  if (!deviceData) deviceData = registerNewDevice(sheet2, hwid);

  // Ban kontrolü
  if (deviceData[12] == "Banlı") {
    return ContentService.createTextOutput("BANNED");
  }

  var altyazi_hak = deviceData[7];
  var autocut_hak = deviceData[8];
  var video_hak   = deviceData[9];

  // Eğer lisanslı değilse (Lisanssız veya Süresi Doldu ise) aylık hak sıfırlama kontrolü yap
  if (deviceData[2] !== "Lisanslı") {
    var lastReset = deviceData[11]; // L Sütunu (Son Kullanım)
    var refDate = null;
    if (lastReset && lastReset !== "-") {
      refDate = new Date(lastReset);
    } else if (deviceData[1]) {
      refDate = new Date(deviceData[1]); // B Sütunu (Kurulum Tarihi)
    }

    if (refDate && !isNaN(refDate.getTime())) {
      var now = new Date();
      // Eğer yeni bir takvim ayına geçilmişse hakları 10'a sıfırla
      if (now.getFullYear() > refDate.getFullYear() || 
         (now.getFullYear() === refDate.getFullYear() && now.getMonth() > refDate.getMonth())) {
        
        var dIdx = findRowIndex(sheet2, 0, hwid);
        if (dIdx > 0) {
          sheet2.getRange(dIdx, 8).setValue("Sınırsız");  // Altyazı Hak (H)
          sheet2.getRange(dIdx, 9).setValue("Sınırsız");  // AutoCut Hak (I)
          sheet2.getRange(dIdx, 10).setValue("Sınırsız"); // Video Hak (J)
          sheet2.getRange(dIdx, 12).setValue(now); // Son Kullanım / Sıfırlama Tarihi (L)
          
          // Yerel değişkenleri de güncelle ki eklentiye anında Sınırsız hakkı dönsün
          altyazi_hak = "Sınırsız";
          autocut_hak = "Sınırsız";
          video_hak = "Sınırsız";
        }
      }
    }
  }

  // Eğer anahtar boş geldiyse ama cihaz veritabanında lisanslıysa otomatik kurtar
  if (!key) {
    if (deviceData[2] == "Lisanslı") {
      var savedKey = deviceData[3];
      var expVal = deviceData[6];
      var actVal = deviceData[5];
      
      if (expVal && expVal !== "-") {
        var expDate = new Date(expVal);
        if (!isNaN(expDate.getTime()) && new Date() > expDate) {
          if (savedKey) {
            var lIdx = findRowIndex(sheet1, 0, savedKey);
            if (lIdx > 0) sheet1.getRange(lIdx, 3).setValue("Süresi Doldu");
          }
          var dIdx = findRowIndex(sheet2, 0, hwid);
          if (dIdx > 0) {
            sheet2.getRange(dIdx, 3).setValue("Süresi Doldu");
            sheet2.getRange(dIdx, 8).setValue("Sınırsız");
            sheet2.getRange(dIdx, 9).setValue("Sınırsız");
            sheet2.getRange(dIdx, 10).setValue("Sınırsız");
          }
          return ContentService.createTextOutput("EXPIRED");
        }
      }
      return ContentService.createTextOutput(
        "SUCCESS|" + formatDate(expVal) + "|" + formatDate(actVal) +
        "|" + altyazi_hak + "|" + autocut_hak + "|" + video_hak + "|" + savedKey
      );
    }
  }

  // Lisans anahtarı varsa kontrol et
  if (key) {
    var licenseData = findRow(sheet1, 0, key);
    // Sheet1: col C(2)=Durum, col E(4)=Bitiş, col F(5)=Cihaz Id
    if (licenseData && licenseData[5] == hwid && licenseData[2] == "Aktif") {
      // Bitiş tarihi geçti mi?
      var expVal = licenseData[4];
      if (expVal) {
        var expDate = new Date(expVal);
        if (!isNaN(expDate.getTime()) && new Date() > expDate) {
          // Süresi doldu — güncelle
          var lIdx = findRowIndex(sheet1, 0, key);
          sheet1.getRange(lIdx, 3).setValue("Süresi Doldu"); // C
          var dIdx = findRowIndex(sheet2, 0, hwid);
          if (dIdx > 0) {
            sheet2.getRange(dIdx, 3).setValue("Süresi Doldu"); // C
            sheet2.getRange(dIdx, 8).setValue("Sınırsız");
            sheet2.getRange(dIdx, 9).setValue("Sınırsız");
            sheet2.getRange(dIdx, 10).setValue("Sınırsız");
          }
          return ContentService.createTextOutput("EXPIRED");
        }
      }
      // Bitiş tarihi ve aktivasyon tarihi gönder (col D=3, col E=4, col A=key)
      return ContentService.createTextOutput(
        "SUCCESS|" + formatDate(licenseData[4]) + "|" + formatDate(licenseData[3]) +
        "|" + altyazi_hak + "|" + autocut_hak + "|" + video_hak + "|" + key
      );
    }

    // Süresi dolmuş mu?
    if (licenseData && licenseData[2] == "Süresi Doldu" && licenseData[5] == hwid) {
      return ContentService.createTextOutput("EXPIRED");
    }
  }

  return ContentService.createTextOutput("FREE|" + altyazi_hak + "|" + autocut_hak + "|" + video_hak);
}

function activateLicense(sheet1, sheet2, key, hwid) {
  var licenseData = findRow(sheet1, 0, key);
  if (!licenseData) return ContentService.createTextOutput("INVALID_KEY");

  var status = licenseData[2] ? licenseData[2].toString().trim() : "";

  // Eğer lisans aktif veya süresi dolmuşsa doğrudan engelle
  if (status === "Aktif" || status === "Süresi Doldu") {
    return ContentService.createTextOutput("USED_ON_OTHER_DEVICE");
  }

  // İlk defa aktif ediliyorsa (Durum boştur veya "Kullanan Yok"tur)
  var lRowIdx = findRowIndex(sheet1, 0, key);
  var now = new Date();
  var durationMonths = parseInt(licenseData[1]); // col B
  if (isNaN(durationMonths)) durationMonths = 1;

  var activationDate = now;
  var expiryDate = new Date();
  expiryDate.setMonth(now.getMonth() + durationMonths);

  // Sheet1 güncelle
  sheet1.getRange(lRowIdx, 3).setValue("Aktif");
  sheet1.getRange(lRowIdx, 4).setValue(activationDate);
  sheet1.getRange(lRowIdx, 5).setValue(expiryDate);
  sheet1.getRange(lRowIdx, 6).setValue(hwid);

  // Sheet2 güncelle (Cihaz lisanslanıyor, limitler sınırsız yapılıyor ve orijinal tarihler geri yükleniyor)
  var devIdx = findRowIndex(sheet2, 0, hwid);
  if (devIdx < 1) {
    registerNewDevice(sheet2, hwid);
    devIdx = findRowIndex(sheet2, 0, hwid);
  }
  sheet2.getRange(devIdx, 3).setValue("Lisanslı");
  sheet2.getRange(devIdx, 4).setValue(key);
  sheet2.getRange(devIdx, 5).setValue(durationMonths + " Ay");
  sheet2.getRange(devIdx, 6).setValue(activationDate);
  sheet2.getRange(devIdx, 7).setValue(expiryDate);
  sheet2.getRange(devIdx, 8).setValue("Sınırsız");
  sheet2.getRange(devIdx, 9).setValue("Sınırsız");
  sheet2.getRange(devIdx, 10).setValue("Sınırsız");
  sheet2.getRange(devIdx, 11).setValue("Sınırsız");

  return checkStatus(sheet1, sheet2, key, hwid);
}

// ── Lisans Kaldır ──────────────────────────────────────────────────────────
function removeLicense(sheet1, sheet2, key, hwid) {
  // ÖNEMLİ: Lisans anahtarını Sheet1'den temizlemiyoruz (Cihaz Id kalıyor).
  // Böylece lisans tek kullanımlık/cihaza bağlı kalmaya devam ediyor, transfer edilemiyor.

  // Sheet2'deki cihazın durumunu Lisanssız yapıp limitleri 10'a düşürüyoruz
  var devIdx = findRowIndex(sheet2, 0, hwid);
  if (devIdx > 0) {
    sheet2.getRange(devIdx, 3).setValue("Lisanssız");
    sheet2.getRange(devIdx, 4).setValue("");
    sheet2.getRange(devIdx, 5).setValue("-");
    sheet2.getRange(devIdx, 6).setValue("-");
    sheet2.getRange(devIdx, 7).setValue("-");
    sheet2.getRange(devIdx, 8).setValue("Sınırsız");
    sheet2.getRange(devIdx, 9).setValue("Sınırsız");
    sheet2.getRange(devIdx, 10).setValue("Sınırsız");
    sheet2.getRange(devIdx, 11).setValue("Sınırsız");
  }

  return ContentService.createTextOutput("REMOVED");
}

// ── Kullanım Düş ───────────────────────────────────────────────────────────
function consumeUsage(sheet2, hwid, feature) {
  var rowIdx = findRowIndex(sheet2, 0, hwid);
  if (rowIdx <= 0) {
    registerNewDevice(sheet2, hwid);
    rowIdx = findRowIndex(sheet2, 0, hwid);
  }

  var data = sheet2.getRange(rowIdx, 1, 1, 13).getValues()[0];
  if (data[2] == "Lisanslı") return ContentService.createTextOutput("SUCCESS|Sınırsız");

  var colIdx = -1;
  if (feature == "altyazi") colIdx = 8;
  if (feature == "autocut") colIdx = 9;
  if (feature == "video")   colIdx = 10;
  if (colIdx == -1) return ContentService.createTextOutput("INVALID_FEATURE");

  var currentHak = data[colIdx - 1];
  if (currentHak == "Sınırsız") return ContentService.createTextOutput("SUCCESS|Sınırsız");

  var remaining = parseInt(currentHak);
  if (isNaN(remaining) || remaining <= 0) return ContentService.createTextOutput("LIMIT_REACHED");

  remaining--;
  sheet2.getRange(rowIdx, colIdx).setValue(remaining);
  sheet2.getRange(rowIdx, 12).setValue(new Date());

  return ContentService.createTextOutput("SUCCESS|" + remaining);
}

// ── Yeni Cihaz Kaydet ──────────────────────────────────────────────────────
function registerNewDevice(sheet, hwid) {
  var now = new Date();
  var newRow = [
    hwid, now, "Lisanssız", "", "-", "-", "-", "Sınırsız", "Sınırsız", "Sınırsız", "Sınırsız", "-", ""
  ];
  sheet.appendRow(newRow);
  return newRow;
}

// ── Satır Renklendirme ─────────────────────────────────────────────────────
function applyStyles(sheet1, sheet2) {
  if (sheet1) {
    var data1 = sheet1.getDataRange().getValues();
    var now = new Date();
    for (var i = 1; i < data1.length; i++) {
      var rn     = i + 1;
      var status = data1[i][2]; // C = Durum
      var expVal = data1[i][4]; // E = Bitiş Tarihi
      var range  = sheet1.getRange(rn, 1, 1, 8);

      var isExpired = false;
      if (expVal) {
        var expDate = new Date(expVal);
        if (!isNaN(expDate.getTime()) && now > expDate) isExpired = true;
      }

      if (isExpired || status === "Süresi Doldu") {
        range.setBackground("#ffc7ce"); // Kırmızı
      } else if (status === "Aktif") {
        range.setBackground("#c6efce"); // Yeşil
      } else {
        range.setBackground("#ffeb9c"); // Sarı (Kullanan Yok veya boş)
      }
    }
  }

  if (sheet2) {
    var data2 = sheet2.getDataRange().getValues();
    var now2 = new Date();
    for (var j = 1; j < data2.length; j++) {
      var rn2    = j + 1;
      var status2 = data2[j][2]; // C = Durum
      var expVal2 = data2[j][6]; // G = Lisans Bitiş
      var range2  = sheet2.getRange(rn2, 1, 1, 13);

      var isExpired2 = false;
      if (expVal2 && expVal2 !== "-") {
        var expDate2 = new Date(expVal2);
        if (!isNaN(expDate2.getTime()) && now2 > expDate2) isExpired2 = true;
      }

      if (isExpired2 || status2 === "Süresi Doldu") {
        range2.setBackground("#ffc7ce"); // Kırmızı
      } else if (status2 === "Lisanslı") {
        range2.setBackground("#c6efce"); // Yeşil
      } else {
        range2.setBackground("#ffeb9c"); // Sarı (Lisanssız)
      }
    }
  }
}

// ── Yardımcı Fonksiyonlar ──────────────────────────────────────────────────
function findRow(sheet, colIdx, value) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][colIdx] == value) return data[i];
  }
  return null;
}

function findRowIndex(sheet, colIdx, value) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][colIdx] == value) return i + 1;
  }
  return -1;
}

function formatDate(val) {
  if (!val) return "";
  try {
    var d = new Date(val);
    if (isNaN(d.getTime())) return val.toString();
    var dd = d.getDate().toString().padStart(2,"0");
    var mm = (d.getMonth()+1).toString().padStart(2,"0");
    var yyyy = d.getFullYear();
    var hh = d.getHours().toString().padStart(2,"0");
    var min = d.getMinutes().toString().padStart(2,"0");
    return dd+"."+mm+"."+yyyy+" "+hh+":"+min;
  } catch(e) { return val.toString(); }
}
