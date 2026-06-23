#define MyAppName "Editor App"
#define MyAppVersion "5.0.4"
#define MyAppPublisher "Editor App"
#define MyAppExeName "EditorApp_v5.0.4_Setup.exe"
#define ExtensionId "com.editor.v1"
#define SourceDir "."
#define OutputDir "D:\Editör\Output"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} v{#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={userappdata}\Adobe\CEP\extensions\{#ExtensionId}
DisableDirPage=yes
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir={#OutputDir}
OutputBaseFilename=EditorApp_v5.0.4_Final_UsageBased
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
UninstallDisplayName={#MyAppName} v{#MyAppVersion}
UninstallDisplayIcon={userappdata}\Adobe\CEP\extensions\{#ExtensionId}\icon.ico
CreateUninstallRegKey=yes
ShowLanguageDialog=no
LanguageDetectionMethod=none

[Languages]
Name: "turkish"; MessagesFile: "compiler:Languages\Turkish.isl"

[CustomMessages]
turkish.FinishedHeadingLabel=Kurulum Tamamlandı
turkish.ClickFinish=Editor App v5.0.4 başarıyla kuruldu. Lütfen Premiere Pro'yu yeniden başlatın.

[Messages]
WelcomeLabel1=Editor App v5.0.4 Kurulumu
WelcomeLabel2=Bu sihirbaz, [name/ver] uygulamasını bilgisayarınıza kuracaktır.%n%nDevam etmeden önce Adobe Premiere Pro'nun kapalı olduğundan emin olun.
ClickNext=Kuruluma başlamak için kur üzerine tıklayın.
ReadyLabel1=Editor App 5.0.4%nOtomatik altyazı, auto cut, video indir gibi özelikleri şimdi kullan.
ReadyLabel2a= 
ReadyLabel2b=%nKuruluma başlamak için kur üzerine tıklayın.
FinishedHeadingLabel=Kurulum Başarıyla Tamamlandı!
FinishedLabel=Premier Proyu yeniden başlatmayı unutmayın. Premier Pro eklentiler kısmından eklentiyi kullanabilirsiniz.
FinishedLabelNoIcons=Premier Proyu yeniden başlatmayı unutmayın. Premier Pro eklentiler kısmından eklentiyi kullanabilirsiniz.
ClickFinish=Bitir ve Kapat
ButtonNext=Kur
ButtonBack=< Geri
ButtonInstall=Kur
ButtonCancel=İptal
ButtonFinish=Bitir

[Dirs]
Name: "{userappdata}\Adobe\CEP\extensions\{#ExtensionId}"
Name: "{userappdata}\Adobe\CEP\extensions\{#ExtensionId}\CSXS"
Name: "{userappdata}\Adobe\CEP\extensions\{#ExtensionId}\css"
Name: "{userappdata}\Adobe\CEP\extensions\{#ExtensionId}\js"
Name: "{userappdata}\Adobe\CEP\extensions\{#ExtensionId}\jsx"

[Files]
; Ana dosyalar
Source: "{#SourceDir}\index.html"; DestDir: "{userappdata}\Adobe\CEP\extensions\{#ExtensionId}"; Flags: ignoreversion
; CSXS
Source: "{#SourceDir}\CSXS\manifest.xml"; DestDir: "{userappdata}\Adobe\CEP\extensions\{#ExtensionId}\CSXS"; Flags: ignoreversion
; CSS
Source: "{#SourceDir}\css\style.css"; DestDir: "{userappdata}\Adobe\CEP\extensions\{#ExtensionId}\css"; Flags: ignoreversion
; JS
Source: "{#SourceDir}\js\CSInterface.js"; DestDir: "{userappdata}\Adobe\CEP\extensions\{#ExtensionId}\js"; Flags: ignoreversion
Source: "{#SourceDir}\js\main.js"; DestDir: "{userappdata}\Adobe\CEP\extensions\{#ExtensionId}\js"; Flags: ignoreversion
; JSX
Source: "{#SourceDir}\jsx\hostscript.jsx"; DestDir: "{userappdata}\Adobe\CEP\extensions\{#ExtensionId}\jsx"; Flags: ignoreversion

[Registry]
; CEP Debug modu - Eklentinin imzasız çalışabilmesi için tüm sürümlere izin ver
Root: HKCU; Subkey: "Software\Adobe\CSXS.5"; ValueType: string; ValueName: "PlayerDebugMode"; ValueData: "1"; Flags: uninsdeletevalue
Root: HKCU; Subkey: "Software\Adobe\CSXS.6"; ValueType: string; ValueName: "PlayerDebugMode"; ValueData: "1"; Flags: uninsdeletevalue
Root: HKCU; Subkey: "Software\Adobe\CSXS.7"; ValueType: string; ValueName: "PlayerDebugMode"; ValueData: "1"; Flags: uninsdeletevalue
Root: HKCU; Subkey: "Software\Adobe\CSXS.8"; ValueType: string; ValueName: "PlayerDebugMode"; ValueData: "1"; Flags: uninsdeletevalue
Root: HKCU; Subkey: "Software\Adobe\CSXS.9"; ValueType: string; ValueName: "PlayerDebugMode"; ValueData: "1"; Flags: uninsdeletevalue
Root: HKCU; Subkey: "Software\Adobe\CSXS.10"; ValueType: string; ValueName: "PlayerDebugMode"; ValueData: "1"; Flags: uninsdeletevalue
Root: HKCU; Subkey: "Software\Adobe\CSXS.11"; ValueType: string; ValueName: "PlayerDebugMode"; ValueData: "1"; Flags: uninsdeletevalue
Root: HKCU; Subkey: "Software\Adobe\CSXS.12"; ValueType: string; ValueName: "PlayerDebugMode"; ValueData: "1"; Flags: uninsdeletevalue
Root: HKCU; Subkey: "Software\Adobe\CSXS.13"; ValueType: string; ValueName: "PlayerDebugMode"; ValueData: "1"; Flags: uninsdeletevalue

[Code]
function InitializeSetup(): Boolean;
begin
  Result := True;
end;
