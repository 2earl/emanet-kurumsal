import type { Catalog } from '../i18n';

/** Turkish for Emanet Kurumsal. Keys are the English sentences exactly as the pages write them. */
export const tr: Catalog = {
  months: [
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık',
  ],
  monthsShort: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
  messages: {
    // Titles
    '{0} · Emanet Kurumsal': '{0} · Emanet Kurumsal',
    'Vehicle recovery for creditors': 'Alacaklılar için araç bulma',
    Organizations: 'Kuruluşlar',
    Case: 'Dosya',
    API: 'API',

    // Layout
    Sections: 'Bölümler',
    Overview: 'Genel bakış',
    Cases: 'Dosyalar',
    'Add a vehicle': 'Araç ekle',
    'Upload CSV': 'CSV yükle',
    'API keys': 'API anahtarları',
    Webhooks: 'Webhook’lar',
    'Switch organization': 'Kuruluş değiştir',
    'Sign in': 'Giriş yap',
    'Sign out': 'Çıkış yap',
    'Emanet is a private service of 2earl, not a public authority.':
      'Emanet, 2earl’ün özel bir hizmetidir; kamu kurumu değildir.',
    Privacy: 'Gizlilik',
    Terms: 'Koşullar',
    Language: 'Dil',
    'Back to the start': 'Başa dön',

    // Start
    'Find vehicles that carry your seizure orders.': 'Yakalama şerhi koyduğunuz araçları bulun.',
    'Add the vehicles your enforcement files allow you to take. Verified field agents look for them, report them to the police, and follow them to a custodian car park. You see each step, and you pay only for vehicles that reach custody.':
      'İcra dosyalarınızın el koymanıza izin verdiği araçları ekleyin. Kimliği doğrulanmış saha görevlileri araçları arar, polise bildirir ve yediemin otoparkına kadar takip eder. Her adımı görürsünüz; yalnızca yediemine ulaşan araçlar için ödersiniz.',
    'Sign in with 2earl': '2earl ile giriş yap',
    'Upload by form, CSV or API. Get notified by webhook.':
      'Form, CSV veya API ile yükleyin. Webhook ile haber alın.',
    'Agents never see a debtor’s name or debt.':
      'Görevliler borçlunun adını veya borcunu hiçbir zaman görmez.',
    'Access only for organizations set up by 2earl.':
      'Yalnızca 2earl’ün tanımladığı kuruluşlar erişebilir.',

    // Organizations
    'No organization yet': 'Henüz kuruluş yok',
    'Your account isn’t part of an organization that uses Emanet. Ask your organization’s administrator for an invitation, or write to legal@2earl.com.':
      'Hesabınız Emanet kullanan bir kuruluşa bağlı değil. Kuruluşunuzun yöneticisinden davet isteyin ya da legal@2earl.com adresine yazın.',
    'Choose an organization': 'Bir kuruluş seçin',
    'Not active yet': 'Henüz etkin değil',
    '2earl hasn’t activated this organization in Emanet yet.':
      '2earl bu kuruluşu Emanet’te henüz etkinleştirmedi.',
    'This organization doesn’t exist or you aren’t a member.':
      'Bu kuruluş yok ya da üyesi değilsiniz.',

    // Statuses
    Searching: 'Aranıyor',
    'Waiting for review': 'İncelemede',
    'In custody': 'Yedieminde',
    Withdrawn: 'Geri çekildi',
    Expired: 'Süresi doldu',

    // Overview and lists
    'Cases stay searchable for as long as you confirm them. Confirm them again, or send them again, before they expire.':
      'Dosyalar, siz onayladıkça aranmaya devam eder. Süreleri dolmadan yeniden onaylayın ya da yeniden gönderin.',
    'Recently changed': 'Son değişenler',
    'No cases here yet.': 'Burada henüz dosya yok.',
    Plate: 'Plaka',
    Vehicle: 'Araç',
    'Your reference': 'Referansınız',
    Status: 'Durum',
    Fee: 'Ücret',
    Expires: 'Süre sonu',
    All: 'Tümü',
    'Next page': 'Sonraki sayfa',

    // Case
    '2earl staff are checking this vehicle’s identity (chassis number or plate). Agents don’t see it until then.':
      '2earl ekibi bu aracın kimliğini (şasi numarası veya plaka) kontrol ediyor. O zamana kadar görevliler aracı görmez.',
    'Chassis number (VIN)': 'Şasi numarası (VIN)',
    'Year and colour': 'Yıl ve renk',
    'Enforcement office': 'İcra dairesi',
    'File number': 'Dosya numarası',
    'Seizure order date': 'Şerh tarihi',
    'Legal basis': 'Dayanak',
    'Pledge (rehin)': 'Rehin',
    'Attachment (haciz)': 'Haciz',
    'Last confirmed': 'Son onay',
    Closed: 'Kapanış',
    'Where to look': 'Nerede aranmalı',
    'No places. Agents can only look for this vehicle in traffic.':
      'Adres yok. Görevliler bu aracı yalnızca trafikte arayabilir.',
    Kind: 'Tür',
    Address: 'Adres',
    District: 'İlçe',
    City: 'İl',
    Home: 'Ev',
    Work: 'İş',
    'Last seen': 'Son görüldüğü yer',
    Other: 'Diğer',
    Withdraw: 'Geri çek',
    'When the debt is paid, restructured or the order is lifted, withdraw the case at once: agents stop looking.':
      'Borç ödendiğinde, yapılandırıldığında ya da şerh kaldırıldığında dosyayı hemen geri çekin: görevliler aramayı bırakır.',
    Reason: 'Gerekçe',
    'Withdraw case': 'Dosyayı geri çek',
    'Confirm it is still enforceable': 'Hâlâ geçerli olduğunu onayla',
    'Saved.': 'Kaydedildi.',
    'Withdrawn. Agents no longer look for this vehicle.':
      'Geri çekildi. Görevliler artık bu aracı aramıyor.',
    'Confirmed. The case stays searchable for another period.':
      'Onaylandı. Dosya bir dönem daha aranmaya devam edecek.',
    'Not withdrawn': 'Geri çekilmedi',

    // Add a vehicle
    'Only vehicles with an active seizure order (yakalama şerhi) on your enforcement file. Sending the same reference again updates the case.':
      'Yalnızca icra dosyanızda geçerli yakalama şerhi bulunan araçlar. Aynı referansı yeniden göndermek dosyayı günceller.',
    'e.g. 34 ABC 123': 'ör. 34 ABC 123',
    '17 characters; without it, staff check the vehicle first':
      '17 karakter; girilmezse ekip aracı önce kontrol eder',
    Make: 'Marka',
    Model: 'Model',
    Year: 'Yıl',
    Colour: 'Renk',
    'Enforcement file': 'İcra dosyası',
    'unique in your organization': 'kuruluşunuzda benzersiz',
    'e.g. İstanbul 5. İcra Dairesi': 'ör. İstanbul 5. İcra Dairesi',
    'e.g. 2026/12345': 'ör. 2026/12345',
    'Agents see the street address only while they hold the vehicle, and never your customer’s name.':
      'Görevliler sokak adresini yalnızca aracı üstlendikleri süre boyunca görür; müşterinizin adını hiçbir zaman görmez.',
    'Add vehicle': 'Aracı ekle',
    Yes: 'Evet',
    No: 'Hayır',

    // Errors from the core
    'The plate isn’t a Turkish plate (e.g. 34 ABC 123).':
      'Plaka geçerli bir Türk plakası değil (ör. 34 ABC 123).',
    'The chassis number must be 17 letters and digits, without I, O or Q.':
      'Şasi numarası I, O ve Q içermeyen 17 harf ve rakamdan oluşmalı.',
    'Enter the make and model.': 'Marka ve modeli girin.',
    'The year isn’t valid.': 'Yıl geçerli değil.',
    'Enter the enforcement office and the file number.':
      'İcra dairesini ve dosya numarasını girin.',
    'The seizure order date isn’t valid.': 'Şerh tarihi geçerli değil.',
    'Each place needs an address, a district and a city.':
      'Her yer için adres, ilçe ve il gerekli.',
    'Enter your reference.': 'Referansınızı girin.',
    'You already have an open case for this vehicle under another reference.':
      'Bu araç için başka bir referansla açık bir dosyanız zaten var.',
    'This case is closed.': 'Bu dosya kapandı.',
    'This reference was created with another chassis number.':
      'Bu referans başka bir şasi numarasıyla oluşturulmuş.',
    'Someone changed this vehicle at the same moment. Send it again.':
      'Bu araç aynı anda değiştirildi. Yeniden gönderin.',
    'Your organization has no price list yet. Ask 2earl to set it up.':
      'Kuruluşunuzun henüz fiyat listesi yok. 2earl’den tanımlamasını isteyin.',
    'Your organization isn’t active in Emanet.': 'Kuruluşunuz Emanet’te etkin değil.',
    'A field has a value that isn’t allowed.': 'Bir alanın değeri izin verilenlerden değil.',
    'A field isn’t known for your organization.': 'Bir alan kuruluşunuz için tanımlı değil.',
    'That didn’t work.': 'Bu işlem yapılamadı.',
    'A field has a value that isn’t allowed. ({0})':
      'Bir alanın değeri izin verilenlerden değil. ({0})',
    'A field isn’t known for your organization. ({0})':
      'Bir alan kuruluşunuz için tanımlı değil. ({0})',

    // Upload
    'One row per place; rows with the same reference are one case. Column names in English or Turkish, separated by semicolons or commas, saved as UTF-8. Dates as 2026-10-01 or 01.10.2026.':
      'Her yer bir satır; aynı referanslı satırlar tek dosyadır. Sütun adları İngilizce veya Türkçe, noktalı virgül ya da virgülle ayrılmış, UTF-8 olarak kaydedilmiş olmalı. Tarihler 2026-10-01 veya 01.10.2026 biçiminde.',
    'Download the template': 'Şablonu indir',
    'Imported <0/> cases.': '<0/> dosya içe aktarıldı.',
    'Not imported': 'İçe aktarılamayanlar',
    Reference: 'Referans',
    Problem: 'Sorun',
    'Problems in the file': 'Dosyadaki sorunlar',
    'Fix these and upload again. Nothing was imported.':
      'Bunları düzeltip yeniden yükleyin. Hiçbir şey içe aktarılmadı.',
    Row: 'Satır',
    'The file is ready: <0/> cases.': 'Dosya hazır: <0/> kayıt.',
    Import: 'İçe aktar',
    'Check a file': 'Dosya kontrol et',
    'CSV file': 'CSV dosyası',
    'Check file': 'Dosyayı kontrol et',
    'Choose a CSV file.': 'Bir CSV dosyası seçin.',
    'The file is larger than 2 MB. Split it.': 'Dosya 2 MB’tan büyük. Bölün.',
    'This upload expired. Check the file again.':
      'Bu yüklemenin süresi doldu. Dosyayı yeniden kontrol edin.',
    'The file is not UTF-8. In Excel, save it as “CSV UTF-8”.':
      'Dosya UTF-8 değil. Excel’de “CSV UTF-8” olarak kaydedin.',
    'The file has no rows below the header.': 'Dosyada başlığın altında satır yok.',
    'At most {0} rows per file.': 'Bir dosyada en fazla {0} satır olabilir.',
    'At most {0} cases per file.': 'Bir dosyada en fazla {0} dosya kaydı olabilir.',
    'Unknown column “{0}” (column {1}).': 'Bilinmeyen sütun “{0}” ({1}. sütun).',
    '“{0}” is not a valid {1}.': '“{0}”, {1} için geçerli bir değer değil.',
    'The reference (external_ref) is empty.': 'Referans (external_ref) boş.',
    '“{0}” is not a kind of place.': '“{0}” geçerli bir yer türü değil.',
    'Latitude and longitude must be numbers.': 'Enlem ve boylam sayı olmalı.',
    'Reference {0} has two different plates.': '{0} referansında iki farklı plaka var.',
    '“{0}” is not a date.': '“{0}” bir tarih değil.',
    'The legal basis must be rehin or haciz.': 'Dayanak rehin veya haciz olmalı.',
    '“{0}” is not a year.': '“{0}” bir yıl değil.',

    // API keys
    'A key acts for the whole organization. Keep it in your systems’ secret store; it is shown only once.':
      'Bir anahtar tüm kuruluş adına işlem yapar. Sistemlerinizin gizli bilgi deposunda saklayın; yalnızca bir kez gösterilir.',
    'Copy the key now. It won’t be shown again.':
      'Anahtarı şimdi kopyalayın. Bir daha gösterilmeyecek.',
    Name: 'Ad',
    Key: 'Anahtar',
    Permissions: 'İzinler',
    'Last used': 'Son kullanım',
    Revoked: 'İptal edildi',
    Revoke: 'İptal et',
    'No API keys yet.': 'Henüz API anahtarı yok.',
    'New key': 'Yeni anahtar',
    'Core banking export': 'Ana bankacılık aktarımı',
    'After 90 days': '90 gün sonra',
    'After a year': 'Bir yıl sonra',
    Never: 'Hiçbir zaman',
    'Create key': 'Anahtar oluştur',
    'Creating a key needs a recent second factor. <0>Verify it now</0>.':
      'Anahtar oluşturmak için yakın zamanda ikinci adım doğrulaması gerekir. <0>Şimdi doğrulayın</0>.',
    'How to use it: <0>API reference</0>.': 'Nasıl kullanılır: <0>API başvurusu</0>.',
    'Give the key a name of up to 60 characters.': 'Anahtara en fazla 60 karakterlik bir ad verin.',
    'Choose at least one permission.': 'En az bir izin seçin.',
    'A key expires after 1 to 730 days, or never.':
      'Bir anahtarın süresi 1 ile 730 gün arasında dolar ya da hiç dolmaz.',
    'This organization has 25 keys. Revoke one first.':
      'Bu kuruluşun 25 anahtarı var. Önce birini iptal edin.',

    // Webhooks
    'We call your address when a vehicle reaches custody, a case expires, 2earl rejects a case it couldn’t identify, or an invoice is issued. Each call is signed: check the <0/> header with the secret.':
      'Bir araç yedieminde teslim alındığında, bir dosyanın süresi dolduğunda, 2earl kimliğini doğrulayamadığı bir dosyayı reddettiğinde ya da fatura kesildiğinde adresinizi çağırırız. Her çağrı imzalıdır: <0/> başlığını gizli anahtarla doğrulayın.',
    'Copy the signing secret now. It won’t be shown again.':
      'İmza anahtarını şimdi kopyalayın. Bir daha gösterilmeyecek.',
    Events: 'Olaylar',
    State: 'Durum',
    On: 'Açık',
    'Switched off after repeated failures': 'Tekrarlanan hatalar nedeniyle kapatıldı',
    'Switch on': 'Aç',
    Delete: 'Sil',
    'No webhooks yet.': 'Henüz webhook yok.',
    'New webhook': 'Yeni webhook',
    'Add webhook': 'Webhook ekle',
    'Adding a webhook needs a recent second factor. <0>Verify it now</0>.':
      'Webhook eklemek için yakın zamanda ikinci adım doğrulaması gerekir. <0>Şimdi doğrulayın</0>.',
    'Recent deliveries': 'Son gönderimler',
    'Nothing sent yet.': 'Henüz bir şey gönderilmedi.',
    Time: 'Zaman',
    Event: 'Olay',
    Result: 'Sonuç',
    Delivered: 'Teslim edildi',
    'Gave up': 'Vazgeçildi',
    Retrying: 'Yeniden deneniyor',
    'Enter a full https:// address.': 'Tam bir https:// adresi girin.',
    'The address must use https://.': 'Adres https:// kullanmalı.',
    'The address must not contain a user name or password.':
      'Adres kullanıcı adı veya parola içermemeli.',
    'Use the standard https port.': 'Standart https bağlantı noktasını kullanın.',
    'Use a public host name, not an IP address or a local name.':
      'IP adresi veya yerel ad değil, herkese açık bir alan adı kullanın.',
    'The address is too long.': 'Adres çok uzun.',
    'Choose at least one event.': 'En az bir olay seçin.',
    'This organization has 5 webhooks. Delete one first.':
      'Bu kuruluşun 5 webhook’u var. Önce birini silin.',

    // API documentation
    'JSON over HTTPS, one organization per key. Create keys under API keys (owners and admins).':
      'HTTPS üzerinden JSON; her anahtar tek bir kuruluş içindir. Anahtarları API anahtarları bölümünde oluşturun (sahipler ve yöneticiler).',
    Authentication: 'Kimlik doğrulama',
    'Send the key as a Bearer token: <0/>. Limit: 300 requests a minute per key.':
      'Anahtarı Bearer belirteci olarak gönderin: <0/>. Sınır: anahtar başına dakikada 300 istek.',
    Endpoints: 'Uç noktalar',
    Request: 'İstek',
    Permission: 'İzin',
    'What it does': 'Ne yapar',
    'Your custom fields': 'Size özel alanlar',
    'Add a case, or update the one with the same external_ref':
      'Dosya ekler ya da aynı external_ref ile olanı günceller',
    'List your cases': 'Dosyalarınızı listeler',
    'One case': 'Tek bir dosya',
    'Confirm cases are still enforceable': 'Dosyaların hâlâ geçerli olduğunu onaylar',
    'Withdraw a case': 'Bir dosyayı geri çeker',
    'Events, oldest first, if you poll instead of using webhooks':
      'Webhook yerine sorgulama yapıyorsanız olaylar, en eskiden başlayarak',
    'A case': 'Bir dosya',
    Errors: 'Hatalar',
    'Errors are <0/> with status 400, 401, 403, 404, 409 (duplicate_case, case_closed, vin_mismatch, conflict_retry), 422 (invalid input) or 429.':
      'Hatalar <0/> biçimindedir; durum kodu 400, 401, 403, 404, 409 (duplicate_case, case_closed, vin_mismatch, conflict_retry), 422 (geçersiz girdi) veya 429 olur.',
    'Webhook signatures': 'Webhook imzaları',
    'Each call carries <0/>, where the hex is HMAC-SHA256 of <1/> with the webhook’s secret. Refuse calls more than five minutes old, and use <2/> to ignore repeats.':
      'Her çağrı <0/> başlığını taşır; buradaki onaltılık değer, webhook’un gizli anahtarıyla <1/> üzerinden hesaplanan HMAC-SHA256’dır. Beş dakikadan eski çağrıları reddedin, tekrarları ayıklamak için <2/> başlığını kullanın.',

    // Problems
    'Not found': 'Bulunamadı',
    'This page doesn’t exist.': 'Bu sayfa yok.',
    'This case doesn’t exist.': 'Bu dosya yok.',
    'That page doesn’t exist.': 'O sayfa yok.',
    'Not allowed': 'İzin verilmiyor',
    'Your role in this organization doesn’t allow this.':
      'Bu kuruluştaki rolünüz buna izin vermiyor.',
    'This form must be sent from Emanet Kurumsal.':
      'Bu form Emanet Kurumsal üzerinden gönderilmeli.',
    'Too many attempts': 'Çok fazla deneme',
    'Wait a minute and try again.': 'Bir dakika bekleyip yeniden deneyin.',
    'Not signed in': 'Giriş yapılmadı',
    'Sign-in was cancelled or not allowed.': 'Giriş iptal edildi ya da izin verilmedi.',
    'Sign-in didn’t complete. Start again.': 'Giriş tamamlanmadı. Yeniden başlayın.',
  },
};
