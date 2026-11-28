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
    '2earl uses what you write here only to answer your request. It is deleted a year after the team answers, or when you delete your 2earl account. The check against automated requests is Cloudflare Turnstile.':
      '2earl buraya yazdıklarınızı yalnızca isteğinizi yanıtlamak için kullanır. Ekip yanıtladıktan bir yıl sonra ya da 2earl hesabınızı sildiğinizde silinir. Otomatik isteklere karşı denetim Cloudflare Turnstile ile yapılır.',
    'Complete the check above the button, then send again.':
      'Düğmenin üstündeki denetimi tamamlayın, sonra yeniden gönderin.',
    'The check didn’t pass. Do it again, then send.':
      'Denetim geçilemedi. Yeniden yapın, sonra gönderin.',
    'This form needs JavaScript for a short check against automated requests. Turn it on, or write to <0>iletisim@emanet.dev</0>.':
      'Bu form, otomatik isteklere karşı kısa bir denetim için JavaScript gerektirir. JavaScript’i açın ya da <0>iletisim@emanet.dev</0> adresine yazın.',
    'This form needs JavaScript for a short check against automated requests. Turn it on, or write to iletisim@emanet.dev.':
      'Bu form, otomatik isteklere karşı kısa bir denetim için JavaScript gerektirir. JavaScript’i açın ya da iletisim@emanet.dev adresine yazın.',
    'Requests can’t be checked right now, so they can’t be sent. Try again later, or write to iletisim@emanet.dev.':
      'İstekler şu anda denetlenemiyor, bu yüzden gönderilemiyor. Daha sonra yeniden deneyin ya da iletisim@emanet.dev adresine yazın.',
    'Requests are closed for a moment': 'İstekler kısa süreliğine kapalı',
    'The form can’t check requests right now, so it is closed. Try again later, or write to <0>iletisim@emanet.dev</0>.':
      'Form şu anda istekleri denetleyemiyor, bu yüzden kapalı. Daha sonra yeniden deneyin ya da <0>iletisim@emanet.dev</0> adresine yazın.',
    'Created: <0/>. It belongs to this application and can’t be changed.':
      'Oluşturuldu: <0/>. Bu başvuruya aittir ve değiştirilemez.',
    'Created: the company’s organization. It belongs to this application and can’t be changed.':
      'Oluşturuldu: şirketin kuruluşu. Bu başvuruya aittir ve değiştirilemez.',
    'Emanet always uses a new organization, made for the company now, with you as its only member. An organization you already have can’t be used: its members and settings weren’t part of this application.':
      'Emanet her zaman şirket için şimdi oluşturulan, tek üyesi sizin olduğunuz yeni bir kuruluş kullanır. Mevcut bir kuruluşunuz kullanılamaz: üyeleri ve ayarları bu başvurunun parçası değildi.',
    'This application already has its organization. It can’t be changed.':
      'Bu başvurunun kuruluşu zaten var. Değiştirilemez.',
    '100 to 1,000 vehicles a year': 'Yılda 100 ile 1.000 araç',
    '2earl couldn’t go ahead with your request for <0/> for now. If something has changed, you can ask again.':
      '2earl, <0/> için isteğinizle şimdilik ilerleyemedi. Durum değiştiyse yeniden isteyebilirsiniz.',
    '2earl sent an invitation to <0/>. Open the link in that email while signed in to this account to set up your organization.':
      '2earl, <0/> adresine bir davet gönderdi. Kurumunuzu kurmak için bu hesapla oturum açıkken e-postadaki bağlantıyı açın.',
    '2earl uses what you write here only to answer your request. It is deleted a year after the team answers, or when you delete your 2earl account.':
      '2earl buraya yazdıklarınızı yalnızca isteğinizi yanıtlamak için kullanır. Ekip yanıtladıktan bir yıl sonra ya da 2earl hesabınızı sildiğinizde silinir.',
    '2earl’s team reads your request and answers by email.':
      '2earl ekibi isteğinizi okur ve e-postayla yanıtlar.',
    '2earl’s team will answer by email. You don’t need to do anything until then.':
      '2earl ekibi e-postayla yanıt verecek. O zamana kadar bir şey yapmanız gerekmiyor.',
    'Already on Emanet?': 'Kurumunuz zaten Emanet’te mi?',
    'An address on your 2earl account: the invitation will be sent to it.':
      '2earl hesabınızdaki bir adres: davet bu adrese gönderilir.',
    'Answer goes to': 'Yanıtın gideceği adres',
    'Anything 2earl should know (optional)': '2earl’ün bilmesi gerekenler (isteğe bağlı)',
    'Ask 2earl for an invitation': '2earl’den davet isteyin',
    'Ask again': 'Yeniden iste',
    'Ask for an invitation': 'Davet iste',
    Back: 'Geri',
    Bank: 'Banka',
    'Choose what kind of organization it is.': 'Kurumun türünü seçin.',
    'Choose…': 'Seçin…',
    'Emanet is for organizations that hold seizure orders on vehicles: banks, wealth management companies, law firms and leasing companies. Tell 2earl about yours and the team will answer by email.':
      'Emanet, araçlar üzerinde yakalama şerhi bulunan kurumlar içindir: bankalar, varlık yönetim şirketleri, hukuk büroları ve leasing şirketleri. Kurumunuzu 2earl’e anlatın; ekip e-postayla yanıt verir.',
    'How many vehicles a year, roughly? (optional)': 'Yılda yaklaşık kaç araç? (isteğe bağlı)',
    'If Emanet fits, you get an invitation to set up your organization: company details, documents and the agreement.':
      'Emanet uygunsa kurumunuzu kurmanız için bir davet alırsınız: şirket bilgileri, belgeler ve sözleşme.',
    'If your organization already uses Emanet, ask its administrator to add you to it in your 2earl organization. Then sign in again.':
      'Kurumunuz Emanet’i zaten kullanıyorsa yöneticisinden sizi 2earl kurumuna eklemesini isteyin. Sonra yeniden oturum açın.',
    'Job title (optional)': 'Unvan (isteğe bağlı)',
    'Law firm': 'Hukuk bürosu',
    'Leasing company': 'Leasing şirketi',
    'More than 1,000 vehicles a year': 'Yılda 1.000 araçtan fazla',
    'No email? Look in the spam folder, or write to <0>iletisim@emanet.dev</0>.':
      'E-posta gelmedi mi? İstenmeyen klasörüne bakın ya da <0>iletisim@emanet.dev</0> adresine yazın.',
    'Not sure': 'Emin değilim',
    'Only organizations 2earl has set up can use Emanet. Tell us about yours.':
      'Emanet’i yalnızca 2earl’ün kurduğu kurumlar kullanabilir. Bize kurumunuzu anlatın.',
    'Phone (optional)': 'Telefon (isteğe bağlı)',
    'Request sent. We emailed you a copy.':
      'İstek gönderildi. Bir kopyasını size e-postayla gönderdik.',
    'Send request': 'İsteği gönder',
    Sent: 'Gönderildi',
    'Up to 100 vehicles a year': 'Yılda 100 araca kadar',
    'Use an email address on your 2earl account: the invitation will be sent to it. You can add one in your 2earl account settings.':
      '2earl hesabınızdaki bir e-posta adresini kullanın: davet bu adrese gönderilir. 2earl hesap ayarlarınızdan adres ekleyebilirsiniz.',
    'We have your request': 'İsteğinizi aldık',
    'Asset management company (VYŞ)': 'Varlık yönetim şirketi (VYŞ)',
    'What happens next': 'Sonra ne olur',
    'What kind of organization?': 'Kurumun türü',
    'Your account isn’t part of an organization that uses Emanet.':
      'Hesabınız Emanet’i kullanan bir kurumun üyesi değil.',
    'Your invitation is on its way': 'Davetiniz yolda',
    'Your organization can add vehicles once 2earl approves it.':
      '2earl onayladıktan sonra kurumunuz araç ekleyebilir.',
    'Your organization isn’t on Emanet yet? <0>Ask for an invitation</0>.':
      'Kurumunuz henüz Emanet’te değil mi? <0>Davet isteyin</0>.',
    'Your work email': 'İş e-postanız',
    'Write your organization’s name.': 'Kurumunuzun adını yazın.',
    'Write your full name.': 'Adınızı ve soyadınızı yazın.',
    'Write a valid email address.': 'Geçerli bir e-posta adresi yazın.',
    'Write the phone number with digits only, for example +90 212 555 00 00.':
      'Telefon numarasını yalnızca rakamlarla yazın, örneğin +90 212 555 00 00.',
    'Choose how many vehicles, or leave it empty.': 'Araç sayısını seçin ya da boş bırakın.',
    'You have already sent a request. 2earl’s team will answer it by email.':
      'Zaten bir istek gönderdiniz. 2earl ekibi e-postayla yanıtlayacak.',
    'You have sent three requests in the last 30 days. Try again later.':
      'Son 30 günde üç istek gönderdiniz. Daha sonra yeniden deneyin.',
    'The request couldn’t be sent. Try again.': 'İstek gönderilemedi. Yeniden deneyin.',
    'Attach at most three files.': 'En çok üç dosya ekleyin.',
    'A file is larger than 10 MB.': 'Bir dosya 10 MB’tan büyük.',
    'Attach photos (JPEG, PNG, WebP, HEIC) or PDF files only.':
      'Yalnızca fotoğraf (JPEG, PNG, WebP, HEIC) ya da PDF dosyası ekleyin.',
    'A file couldn’t be read. Choose it again.': 'Bir dosya okunamadı. Yeniden seçin.',
    'This file doesn’t exist.': 'Bu dosya yok.',
    'Photos or PDF files (optional)': 'Fotoğraf ya da PDF dosyaları (isteğe bağlı)',
    'Up to three files, 10 MB each: a screenshot, a document, an export. Never a password or an API key.':
      'En çok üç dosya, her biri 10 MB: ekran görüntüsü, belge, dışa aktarım. Asla parola ya da API anahtarı eklemeyin.',
    'Download this list (CSV)': 'Bu listeyi indir (CSV)',
    Breadcrumb: 'Sayfa yolu',
    'Where this case is': 'Bu dosya hangi aşamada',
    '2earl checks the vehicle': '2earl aracı kontrol eder',
    'Agents are looking': 'Görevliler arıyor',
    'Keep it running': 'Aramayı sürdürün',
    'Agents look for this vehicle until <0/>. Confirm that the seizure order still stands to keep it searchable.':
      'Görevliler bu aracı <0/> tarihine kadar arar. Aranmaya devam etmesi için yakalama şerhinin sürdüğünü onaylayın.',
    'Withdraw this case': 'Bu dosyayı geri çek',
    'When the debt is paid, restructured or the order is lifted, withdraw the case at once: agents stop looking. This can’t be undone; to search again, send the case again.':
      'Borç ödendiğinde, yapılandırıldığında ya da şerh kaldırıldığında dosyayı hemen geri çekin: görevliler aramayı bırakır. Bu geri alınamaz; yeniden aratmak için dosyayı yeniden gönderin.',
    'Most recently changed first.': 'En son değişen en üstte.',
    'Plate, chassis number or your reference': 'Plaka, şasi numarası ya da sizin referansınız',
    'Find a case: plate, chassis number or your reference':
      'Dosya bulun: plaka, şasi numarası ya da sizin referansınız',
    Find: 'Bul',
    Clear: 'Temizle',
    'No case matches. Check the plate or the reference; the search looks for an exact match.':
      'Eşleşen dosya yok. Plakayı ya da referansı kontrol edin; arama tam eşleşme arar.',
    'No cases with this status.': 'Bu durumda dosya yok.',
    Today: 'Bugün',
    Tomorrow: 'Yarın',
    'In <0/> days': '<0/> gün içinde',
    '<0/> Download all invoices (CSV)': '<0/> Tüm faturaları indir (CSV)',
    'Download all invoices (CSV)': 'Tüm faturaları indir (CSV)',
    '{0} open': '{0} açık',
    'Vehicles invoiced': 'Faturalanan araç',
    '<0/> Download the vehicles (CSV)': '<0/> Araçları indir (CSV)',
    'A case or a vehicle': 'Bir dosya ya da araç',
    'An invoice': 'Bir fatura',
    'The API or webhooks': 'API ya da webhook’lar',
    'Our account or team': 'Hesabımız ya da ekibimiz',
    'Something else': 'Başka bir konu',
    'Ask 2earl about a case, an invoice or the integration. We answer here and email whoever asked.':
      '2earl’e bir dosya, fatura ya da entegrasyonla ilgili soru sorun. Yanıtı burada veririz ve soran kişiye e-postayla haber veririz.',
    '2earl answered your message': '2earl mesajınızı yanıtladı',
    'Read the answer': 'Yanıtı okuyun',
    'Ask about this case': 'Bu dosya hakkında soru sor',
    'Ask about this invoice': 'Bu fatura hakkında soru sor',
    'Give your message a title of at least 3 characters.':
      'Mesajınıza en az 3 karakterlik bir başlık verin.',
    'Write your message first.': 'Önce mesajınızı yazın.',
    'Choose what your message is about.': 'Mesajınızın konusunu seçin.',
    'You have five open messages. Wait for an answer or close one first.':
      'Beş açık mesajınız var. Bir yanıt bekleyin ya da birini kapatın.',
    'This message was closed a while ago. Write a new one.':
      'Bu mesaj bir süre önce kapandı. Yeni bir mesaj yazın.',
    'Sent. We answer here and email you when we do.':
      'Gönderildi. Yanıtı burada veririz ve e-postayla haber veririz.',
    'Sent.': 'Gönderildi.',
    'Closed.': 'Kapatıldı.',
    Message: 'Mesaj',
    Subject: 'Başlık',
    Send: 'Gönder',
    Support: 'Destek',
    'New message': 'Yeni mesaj',
    'No messages yet.': 'Henüz mesaj yok.',
    'Never write a password or an API key in a message.':
      'Mesaja parola ya da API anahtarı yazmayın.',
    'This page lists what is invoiced. The official invoice is the e-invoice (e-Fatura) sent to your accounting. If it has not reached you, ask us.':
      'Bu sayfa faturalanan kalemleri listeler. Resmî fatura, muhasebenize gönderilen e-faturadır (e-Fatura). Size ulaşmadıysa bize sorun.',
    'To keep a copy, use your browser’s Print and choose Save as PDF.':
      'Kopyasını saklamak için tarayıcınızın Yazdır seçeneğinde PDF olarak kaydet’i seçin.',
    'What is it about?': 'Konu nedir?',
    '2earl answered': '2earl yanıtladı',
    Solved: 'Çözüldü',
    'Your team': 'Ekibiniz',
    'Your reply': 'Yanıtınız',
    'Write again to reopen this': 'Yeniden açmak için yazın',
    'Close this message, it is solved': 'Bu mesajı kapat, çözüldü',
    'This message doesn’t exist.': 'Bu mesaj yok.',
    About: 'Konu',
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
    'Your account isn’t part of an organization that uses Emanet. Ask your organization’s administrator for an invitation, or write to iletisim@emanet.dev.':
      'Hesabınız Emanet kullanan bir kuruluşa bağlı değil. Kuruluşunuzun yöneticisinden davet isteyin ya da iletisim@emanet.dev adresine yazın.',
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
    'Choose a province': 'İl seçin',
    'Each place needs an address.': 'Her yer için bir adres girin.',
    'The city must be one of Turkey’s 81 provinces.': 'İl, Türkiye’nin 81 ilinden biri olmalı.',
    'That district isn’t in the chosen province. Pick it from the list.':
      'Bu ilçe seçilen ilde değil. Listeden seçin.',
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
    'This organization has as many webhooks as it may. Delete one first.':
      'Bu kurum izin verilen sayıda webhook’a ulaştı. Önce birini silin.',
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
    'Errors are <0/> with status 400, 401, 403, 404, 409 (duplicate_case, case_closed, vin_mismatch, conflict_retry, delivery_in_review), 422 (invalid input) or 429.':
      'Hatalar <0/> biçimindedir; durum kodu 400, 401, 403, 404, 409 (duplicate_case, case_closed, vin_mismatch, conflict_retry, delivery_in_review), 422 (geçersiz girdi) veya 429 olur.',
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

    // Joining Emanet (onboarding)
    'Joining Emanet': 'Emanet’e katılım',
    Invitation: 'Davet',
    '<0/> is invited to Emanet': '<0/> Emanet’e davet edildi',
    '2earl invites you to set up <0/> on Emanet. It takes four steps: your organization, the company’s details, a few documents, and the agreement. 2earl then checks everything and activates your account.':
      '2earl sizi <0/> için Emanet hesabını kurmaya davet ediyor. Dört adım var: kuruluşunuz, şirket bilgileri, birkaç belge ve sözleşme. Ardından 2earl her şeyi kontrol edip hesabınızı etkinleştirir.',
    Invited: 'Davet edilen',
    'Link valid until': 'Bağlantının son geçerlilik tarihi',
    'Sign in, or create your 2earl account, with the address the invitation went to: <0/>.':
      'Davetin gönderildiği adresle giriş yapın veya 2earl hesabı oluşturun: <0/>.',
    'You’re signed in with an account that doesn’t use <0/>. Sign out and sign in with that address, or add it to your account at login.2earl.com.':
      '<0/> adresini kullanmayan bir hesapla giriş yaptınız. Çıkış yapıp o adresle giriş yapın veya adresi login.2earl.com’da hesabınıza ekleyin.',
    Start: 'Başla',
    'Another account has already started this invitation. Ask the person who did to finish it, or write to iletisim@emanet.dev.':
      'Bu daveti başka bir hesap başlattı. Başlatan kişiden tamamlamasını isteyin veya iletisim@emanet.dev adresine yazın.',
    Company: 'Şirket',
    Organization: 'Kuruluş',
    'Company details': 'Şirket bilgileri',
    Documents: 'Belgeler',
    Agreement: 'Sözleşme',
    Done: 'Tamam',
    'To do': 'Yapılacak',
    '2earl asked for a change: <0/>': '2earl bir düzeltme istedi: <0/>',
    'You accepted the agreement on <0/>. 2earl is checking your details and documents and will email you when <1/> is active.':
      'Sözleşmeyi <0/> tarihinde onayladınız. 2earl bilgilerinizi ve belgelerinizi inceliyor; <1/> etkinleştiğinde size e-posta gönderecek.',
    '<0/> is active.': '<0/> etkin.',
    'Go to <0/>': '<0/> sayfasına git',
    '2earl couldn’t approve this application: <0/>': '2earl bu başvuruyu onaylayamadı: <0/>',
    '2earl cancelled this invitation.': '2earl bu daveti iptal etti.',
    'This invitation has expired. Ask 2earl for a new link at iletisim@emanet.dev.':
      'Bu davetin süresi doldu. iletisim@emanet.dev adresinden 2earl’den yeni bir bağlantı isteyin.',
    Continue: 'Devam et',
    'Download the accepted agreement': 'Onaylanan sözleşmeyi indir',
    'Complete the steps by <0/>.': 'Adımları <0/> tarihine kadar tamamlayın.',
    'Thank you. 2earl has been told.': 'Teşekkürler. 2earl’e bildirildi.',
    'Use an organization you already manage': 'Yönettiğiniz bir kuruluşu kullanın',
    'Use this organization': 'Bu kuruluşu kullan',
    'Your organization': 'Kuruluşunuz',
    'Your colleagues sign in to Emanet as members of the company’s 2earl organization. You’ll be its owner and can invite them, give roles and require two-step sign-in, at login.2earl.com.':
      'İş arkadaşlarınız Emanet’e şirketin 2earl kuruluşunun üyeleri olarak giriş yapar. Kuruluşun sahibi siz olursunuz; login.2earl.com’da onları davet edebilir, rol verebilir ve iki adımlı girişi zorunlu kılabilirsiniz.',
    'Linked: <0/>': 'Bağlandı: <0/>',
    'An organization is linked.': 'Bir kuruluş bağlandı.',
    'Create the company’s organization': 'Şirketin kuruluşunu oluşturun',
    'Organization name': 'Kuruluş adı',
    'Create organization': 'Kuruluş oluştur',
    'As on your trade registry and tax records. They go into the agreement and onto 2earl’s invoices.':
      'Ticaret sicili ve vergi kayıtlarınızdaki gibi. Bu bilgiler sözleşmeye ve 2earl’ün faturalarına girer.',
    'Legal name': 'Ticaret unvanı',
    'e.g. Örnek Bankası A.Ş.': 'ör. Örnek Bankası A.Ş.',
    'Tax number (VKN)': 'Vergi kimlik numarası (VKN)',
    'Tax office': 'Vergi dairesi',
    'MERSİS number': 'MERSİS numarası',
    optional: 'isteğe bağlı',
    'KEP address': 'KEP adresi',
    'optional; for formal notices': 'isteğe bağlı; resmî bildirimler için',
    'Registered address': 'Kayıtlı adres',
    'The company is registered for e-invoice (e-Fatura)': 'Şirket e-Fatura mükellefidir',
    'Who signs': 'İmza yetkilisi',
    'Full name': 'Adı soyadı',
    'as on the signature circular': 'imza sirkülerindeki gibi',
    Title: 'Unvanı',
    Contacts: 'İletişim',
    'Invoices to': 'Fatura adresi',
    'Operations contact': 'Operasyon sorumlusu',
    'Operations email': 'Operasyon e-postası',
    'Operations phone': 'Operasyon telefonu',
    'Save and continue': 'Kaydet ve devam et',
    '2earl needs the signature circular (imza sirküleri) of the person who signs and the company’s tax certificate (vergi levhası). Add the Trade Registry Gazette if the signatory’s authority is there. PDF, JPEG or PNG, up to 10 MB each.':
      '2earl’ün imza yetkilisinin imza sirkülerine ve şirketin vergi levhasına ihtiyacı var. İmza yetkisi Ticaret Sicili Gazetesi’nde yer alıyorsa onu da ekleyin. PDF, JPEG veya PNG; her biri en fazla 10 MB.',
    'Still needed:': 'Eksik olanlar:',
    Document: 'Belge',
    File: 'Dosya',
    Added: 'Eklenme',
    'No documents yet.': 'Henüz belge yok.',
    Upload: 'Yükle',
    'Continue to the agreement': 'Sözleşmeye geç',
    'Signature circular': 'İmza sirküleri',
    'Tax certificate': 'Vergi levhası',
    'Trade Registry Gazette': 'Ticaret Sicili Gazetesi',
    'Wet-signed agreement': 'Islak imzalı sözleşme',
    'Other document': 'Diğer belge',
    'In progress': 'Devam ediyor',
    'Waiting for 2earl': '2earl’ün onayı bekleniyor',
    Active: 'Etkin',
    'Not approved': 'Onaylanmadı',
    Cancelled: 'İptal edildi',
    'Your fees (Annex 2)': 'Ücretleriniz (Ek-2)',
    'Any vehicle': 'Tüm araçlar',
    'Charged only for vehicles delivered to a custodian car park, plus VAT.':
      'Yalnızca yediemin otoparkına teslim edilen araçlar için, KDV hariç ücretlendirilir.',
    'Version <0/> · SHA-256 <1/>. The agreement is in Turkish, the language that governs it.':
      'Sürüm <0/> · SHA-256 <1/>. Sözleşme, bağlayıcı dili olan Türkçedir.',
    'Your full name': 'Adınız soyadınız',
    'Your title': 'Unvanınız',
    'I am authorised to bind <0/>, as shown by the signature circular I uploaded.':
      'Yüklediğim imza sirkülerinde görüldüğü üzere <0/> adına bağlayıcı işlem yapmaya yetkiliyim.',
    'I have read the agreement and its annexes and accept them for the company.':
      'Sözleşmeyi ve eklerini okudum; şirket adına kabul ediyorum.',
    'Accept the agreement': 'Sözleşmeyi onayla',
    'To accept, confirm it’s you with your second sign-in step.':
      'Onaylamak için ikinci giriş adımıyla kimliğinizi doğrulayın.',
    'Confirm and continue': 'Doğrula ve devam et',
    'The Emanet service agreement': 'Emanet Hizmet Sözleşmesi',
    'Link your organization and give the company’s details first: the agreement is written with them.':
      'Önce kuruluşunuzu bağlayın ve şirket bilgilerini girin: sözleşme bu bilgilerle hazırlanır.',
    'Accepted by <0/> (<1/>) on <2/>.': '<2/> tarihinde <0/> (<1/>) tarafından onaylandı.',
    'Read it through, with the fees in Annex 2. Accepting here is a binding electronic acceptance; 2earl keeps the exact text, your name, title, time and IP address. If the company also wants a wet-signed copy, download the text, sign it and upload it as a document.':
      'Ek-2’deki ücretlerle birlikte baştan sona okuyun. Buradaki onay bağlayıcı bir elektronik kabuldür; 2earl metnin aynısını, adınızı, unvanınızı, zamanı ve IP adresinizi saklar. Şirket ayrıca ıslak imzalı bir nüsha isterse metni indirip imzalayın ve belge olarak yükleyin.',
    'This invitation link doesn’t work. It may have been replaced by a newer one; use the link in the latest email from 2earl.':
      'Bu davet bağlantısı çalışmıyor. Yerine daha yeni bir bağlantı gönderilmiş olabilir; 2earl’den gelen son e-postadaki bağlantıyı kullanın.',
    'Another account has already started this invitation.': 'Bu daveti başka bir hesap başlattı.',
    'This step can’t be changed any more.': 'Bu adım artık değiştirilemez.',
    'Choose an organization.': 'Bir kuruluş seçin.',
    'That organization is already used by another company’s application.':
      'Bu kuruluş başka bir şirketin başvurusunda kullanılıyor.',
    'That organization already uses Emanet.': 'Bu kuruluş zaten Emanet’i kullanıyor.',
    'A field isn’t valid. Check it and try again.':
      'Bir alan geçersiz. Kontrol edip yeniden deneyin.',
    'Enter a name for the organization.': 'Kuruluş için bir ad girin.',
    'Your account is in as many organizations as it can be. Leave one at login.2earl.com.':
      'Hesabınız olabileceği en fazla sayıda kuruluşta. login.2earl.com’da birinden ayrılın.',
    'Your account doesn’t use the address the invitation went to.':
      'Hesabınız davetin gönderildiği adresi kullanmıyor.',
    'This invitation can’t create an organization. Write to iletisim@emanet.dev.':
      'Bu davetle kuruluş oluşturulamıyor. iletisim@emanet.dev adresine yazın.',
    'Your account isn’t active.': 'Hesabınız etkin değil.',
    'Give the company’s details first.': 'Önce şirket bilgilerini girin.',
    'Link your organization first.': 'Önce kuruluşunuzu bağlayın.',
    'The agreement changed since you opened it (for example, the details were edited). Read it again and accept.':
      'Sözleşme siz açtıktan sonra değişti (örneğin bilgiler düzenlendi). Yeniden okuyup onaylayın.',
    'Confirm that you may bind the company.':
      'Şirket adına bağlayıcı işlem yapmaya yetkili olduğunuzu onaylayın.',
    'Enter your full name and title.': 'Adınızı soyadınızı ve unvanınızı girin.',
    'That’s as many documents as an application can have.':
      'Bir başvuruya eklenebilecek en fazla belge sayısına ulaşıldı.',
    'Upload a PDF, JPEG or PNG.': 'PDF, JPEG veya PNG yükleyin.',
    'The file is larger than 10 MB.': 'Dosya 10 MB’tan büyük.',
    'Choose a file.': 'Bir dosya seçin.',
    'Enter the company’s legal name.': 'Şirketin ticaret unvanını girin.',
    'Enter the registered address.': 'Kayıtlı adresi girin.',
    'Enter the tax office.': 'Vergi dairesini girin.',
    'The tax number has 10 digits (11 for a person).':
      'Vergi kimlik numarası 10 hanelidir (şahıslar için 11).',
    'The MERSİS number has 16 digits.': 'MERSİS numarası 16 hanelidir.',
    'The KEP address isn’t an email address.': 'KEP adresi geçerli bir e-posta adresi değil.',
    'Enter the signatory’s first and last name.': 'İmza yetkilisinin adını ve soyadını girin.',
    'Enter the signatory’s title.': 'İmza yetkilisinin unvanını girin.',
    'The invoice address isn’t an email address.':
      'Fatura adresi geçerli bir e-posta adresi değil.',
    'Enter the operations contact’s name.': 'Operasyon sorumlusunun adını girin.',
    'The operations email isn’t an email address.':
      'Operasyon e-postası geçerli bir e-posta adresi değil.',
    'Enter a phone number with its area code.': 'Alan koduyla birlikte bir telefon numarası girin.',
    'That didn’t work. Try again.': 'Bu işlem olmadı. Yeniden deneyin.',
    'This application doesn’t exist.': 'Bu başvuru yok.',
    'There is no text yet.': 'Henüz metin yok.',
    '2earl is completing its own details in the agreement. You can read it now and accept it once that’s done, usually within a working day.':
      '2earl sözleşmedeki kendi bilgilerini tamamlıyor. Sözleşmeyi şimdi okuyabilir, bu işlem bitince (genellikle bir iş günü içinde) onaylayabilirsiniz.',
    '2earl is completing its own details in the agreement. Try again shortly.':
      '2earl sözleşmedeki kendi bilgilerini tamamlıyor. Kısa süre sonra yeniden deneyin.',

    // Timelines, custody documents, invoices, reports
    'What happened': 'Neler oldu',
    Changed: 'Değiştirildi',
    'Vehicle checked by 2earl': 'Araç 2earl tarafından doğrulandı',
    'Not accepted by 2earl': '2earl tarafından kabul edilmedi',
    'Custody documents': 'Teslim belgeleri',
    'Accepted by 2earl when it confirmed the delivery. Each file’s SHA-256 lets you check that it hasn’t changed since.':
      '2earl teslimi onaylarken kabul etti. Her dosyanın SHA-256 özetiyle, o zamandan beri değişmediğini kontrol edebilirsiniz.',
    Taken: 'Çekilme',
    'SHA-256': 'SHA-256',
    'Custodian’s receipt': 'Yediemin teslim tutanağı',
    'Tow report': 'Çekici tutanağı',
    'Police report': 'Kolluk tutanağı',
    'Vehicle at the custodian': 'Araç yediemin otoparkında',
    'Where it was found': 'Bulunduğu yer',
    Invoices: 'Faturalar',
    Reports: 'Raporlar',
    'To pay': 'Ödenecek',
    Paid: 'Ödendi',
    'One invoice per period for the vehicles that reached custody, due within 15 days. The e-invoice itself comes through the e-Fatura system.':
      'Yediemine ulaşan araçlar için dönem başına bir fatura düzenlenir; 15 gün içinde ödenir. E-faturanın kendisi e-Fatura sistemi üzerinden gelir.',
    'Open: <0/>': 'Açık: <0/>',
    Issued: 'Düzenlenme',
    Number: 'Numara',
    Vehicles: 'Araçlar',
    Net: 'Net',
    VAT: 'KDV',
    Total: 'Toplam',
    'No invoices yet. You pay only for vehicles that reach custody.':
      'Henüz fatura yok. Yalnızca yediemine ulaşan araçlar için ödeme yaparsınız.',
    'All invoices': 'Tüm faturalar',
    'Invoice of <0/>': '<0/> tarihli fatura',
    'Not issued by e-Fatura yet': 'Henüz e-Fatura ile düzenlenmedi',
    Invoice: 'Fatura',
    'Open cases': 'Açık dosyalar',
    'In custody, last 12 months': 'Son 12 ayda yedieminde',
    'Recovery rate': 'Bulunma oranı',
    'Recovery rate: vehicles in custody out of all cases closed in the last 12 months (in custody, withdrawn or expired).':
      'Bulunma oranı: son 12 ayda kapanan tüm dosyalar (yedieminde, geri çekilmiş veya süresi dolmuş) içinde yediemine ulaşanların oranı.',
    'By month': 'Aylara göre',
    Month: 'Ay',
    'Days to custody': 'Yediemine kadar gün',
    Fees: 'Ücretler',
    'Download CSV': 'CSV indir',
    'Nothing in the last 12 months yet.': 'Son 12 ayda henüz bir şey yok.',
    'By city': 'Şehirlere göre',
    Open: 'Açık',
    'No places given yet.': 'Henüz yer bilgisi verilmedi.',
    'This document doesn’t exist.': 'Bu belge yok.',
    'This invoice doesn’t exist.': 'Bu fatura yok.',
    'A case’s states and times': 'Bir dosyanın durumları ve zamanları',
    'Your invoices': 'Faturalarınız',
    'An invoice with its cases': 'Dosyalarıyla birlikte bir fatura',

    // emanet.dev, the overview
    Contact: 'İletişim',
    Cookies: 'Çerezler',
    Integrations: 'Entegrasyon',
    'New to Emanet? <0>See how it works</0>, or write to <1>iletisim@emanet.dev</1>.':
      'Emanet’i yeni mi tanıyorsunuz? <0>Nasıl çalıştığına bakın</0> ya da <1>iletisim@emanet.dev</1> adresine yazın.',
    'See how it works': 'Nasıl çalıştığına bakın',
    'Privacy notice': 'Gizlilik',
    'Skip to content': 'İçeriğe geç',
    'Terms of use': 'Kullanım şartları',
    'format: 2026/12345': 'biçim: 2026/12345',
    'Expiring within three days': 'Üç gün içinde süresi dolacaklar',
    'Agents stop looking when a case expires. Confirm the ones whose seizure order still stands.':
      'Süresi dolan dosyada saha görevlileri aramayı bırakır. Yakalama şerhi hâlâ geçerli olanları onaylayın.',
    Choose: 'Seç',
    'Confirm the chosen cases': 'Seçilen dosyaları onayla',
    'No vehicles yet': 'Henüz araç yok',
    'Add your first vehicle with the form, upload a CSV file, or connect your systems with the <0>API</0>.':
      'İlk aracınızı formla ekleyin, bir CSV dosyası yükleyin ya da sistemlerinizi <0>API</0> ile bağlayın.',
    'Confirmed one case.': 'Bir dosya onaylandı.',
    'Confirmed {0} cases.': '{0} dosya onaylandı.',
    'Not confirmed': 'Onaylanmadı',
    'This vehicle has been reported as delivered to a custodian car park, and 2earl is checking it. The case can’t be changed or withdrawn until that is decided.':
      'Bu aracın yediemin otoparkına teslim edildiği bildirildi ve 2earl bildirimi inceliyor. Karar verilene kadar dosya değiştirilemez veya geri çekilemez.',
    'In the last {0} days, 3 in 4 questions got a first answer within an hour.':
      'Son {0} günde soruların 4’te 3’ü bir saat içinde ilk yanıtını aldı.',
    'In the last {0} days, 3 in 4 questions got a first answer within {1} hours.':
      'Son {0} günde soruların 4’te 3’ü {1} saat içinde ilk yanıtını aldı.',
    'In the last {0} days, 3 in 4 questions got a first answer within {1} days.':
      'Son {0} günde soruların 4’te 3’ü {1} gün içinde ilk yanıtını aldı.',
    'Something went wrong': 'Bir sorun oluştu',
    'That didn’t work, and 2earl has been told. Try again in a moment.':
      'İşlem tamamlanamadı; 2earl’e bildirildi. Biraz sonra yeniden deneyin.',
    'API documentation': 'API belgeleri',
    'Ask 2earl about this case': 'Bu dosyayı 2earl’e sorun',
    Auditor: 'Denetçi',
    'Cases by status': 'Duruma göre dosyalar',
    'Find a case': 'Dosya bul',
    Help: 'Yardım',
    'Many cases at once': 'Tek seferde çok dosya',
    Member: 'Üye',
    Menu: 'Menü',
    Money: 'Para',
    'Nothing expires in the next three days.': 'Önümüzdeki üç günde süresi dolan dosya yok.',
    'One case, with the form': 'Formla tek dosya',
    Owner: 'Sahip',
    'Plate, chassis number or reference': 'Plaka, şasi numarası ya da referans',
    'See all cases': 'Tüm dosyalar',
    'Send vehicles': 'Araç gönderin',
    'Straight from your systems': 'Doğrudan sistemlerinizden',
    'Vehicle and enforcement file': 'Araç ve icra dosyası',
    'Confirm the cases whose seizure order still stands: they stay searchable for another period.':
      'Yakalama şerhi hâlâ geçerli olan dosyaları onaylayın; bir dönem daha aramada kalırlar.',
    'Thank you. It helps us answer better.': 'Teşekkürler. Daha iyi yanıt vermemize yardım eder.',
    'Did our answer help?': 'Yanıtımız işe yaradı mı?',
    'You said it helped.': 'İşe yaradığını söylediniz.',
    'You said it didn’t help. Write below what is still missing.':
      'İşe yaramadığını söylediniz. Eksik kalanı aşağıya yazın.',
    'Yes, it helped': 'Evet, işe yaradı',
  },
};
