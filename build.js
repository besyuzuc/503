const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

console.log('--- KOD KORUMA VE SIKIŞTIRMA SİSTEMİ BAŞLATILDI ---');

// 1. JAVASCRIPT OBFUSCATION
const inputJS = path.join(__dirname, 'js', 'main.js');
const outputJS = path.join(__dirname, 'js', 'main.dist.js');
console.log('Kaynak JS:', inputJS);

try {
    const sourceCode = fs.readFileSync(inputJS, 'utf8');
    console.log('JS karartılıyor (Obfuscating)...');
    
    const obfuscationResult = JavaScriptObfuscator.obfuscate(sourceCode, {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        debugProtection: true,
        debugProtectionInterval: 2000,
        disableConsoleOutput: false,
        identifierNamesGenerator: 'hexadecimal',
        log: false,
        numbersToExpressions: true,
        renameGlobals: false,
        selfDefending: true,
        simplify: true,
        splitStrings: true,
        splitStringsChunkLength: 10,
        stringArray: true,
        stringArrayCallsTransform: true,
        stringArrayCallsTransformThreshold: 0.75,
        stringArrayEncoding: ['base64'],
        stringArrayThreshold: 0.75,
        unicodeEscapeSequence: false
    });

    fs.writeFileSync(outputJS, obfuscationResult.getObfuscatedCode());
    console.log('✅ JS Karartıldı:', outputJS);
} catch (err) {
    console.error('❌ JS HATA:', err.message);
    process.exit(1);
}

// 2. CSS SIKIŞTIRMA (Minify)
const inputCSS = path.join(__dirname, 'css', 'style.css');
const outputCSS = path.join(__dirname, 'css', 'style.dist.css');
console.log('Kaynak CSS:', inputCSS);

try {
    let css = fs.readFileSync(inputCSS, 'utf8');
    console.log('CSS Sıkıştırılıyor...');
    
    css = css.replace(/\/\*[\s\S]*?\*\//g, '') // Yorumları sil
             .replace(/\s+/g, ' ') // Boşlukları tek boşluğa indir
             .replace(/\s*([\{\}\:\;\,])\s*/g, '$1') // Sözdizimi etrafındaki boşlukları sil
             .trim();
             
    fs.writeFileSync(outputCSS, css);
    console.log('✅ CSS Sıkıştırıldı:', outputCSS);
} catch (err) {
    console.error('❌ CSS HATA:', err.message);
    process.exit(1);
}

// 3. HTML SIKIŞTIRMA (Minify)
const inputHTML = path.join(__dirname, 'index.html');
const outputHTML = path.join(__dirname, 'index.dist.html');
console.log('Kaynak HTML:', inputHTML);

try {
    let html = fs.readFileSync(inputHTML, 'utf8');
    console.log('HTML Sıkıştırılıyor...');
    
    // Geçici olarak <script> ve <style> etiketlerini çıkarıyoruz (eğer inline varsa diye)
    // index.html'imizde sadece src="js/main.js" var, script içeriği yok ama güvene alalım
    html = html.replace(/<!--[\s\S]*?-->/g, '') // Yorumları sil
               .replace(/\s+/g, ' ') // Boşlukları tek boşluğa indir
               .replace(/>\s+</g, '><') // Etiketler arası boşlukları sil
               .trim();
    
    // JS dosyasını dist versiyonu olarak güncelle (aslında ISS paketliyor ama olsun)
    // ISS paketinde main.dist.js main.js olarak adlandırılıyor, o yüzden HTML içindeki js/main.js'yi değiştirmeye GEREK YOK.
             
    fs.writeFileSync(outputHTML, html);
    console.log('✅ HTML Sıkıştırıldı:', outputHTML);
} catch (err) {
    console.error('❌ HTML HATA:', err.message);
    process.exit(1);
}

console.log('--------------------------------------');
