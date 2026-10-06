// O'zbekcha lug'at — bu fayl lug'at shaklining manbai (ru.ts undan nusxa oladi).
export const uz = {
  // ——— Umumiy ———
  common: {
    back: "Orqaga",
    next: "Keyingi",
    prev: "Oldingi",
    cancel: "Bekor qilish",
    cancelShort: "Bekor",
    close: "Yopish",
    save: "Saqlash",
    send: "Yuborish",
    sendArrow: "Yuborish →",
    sending: "Yuborilmoqda...",
    loading: "Yuklanmoqda...",
    saving: "Saqlanmoqda...",
    confirm: "Tasdiqlash",
    confirming: "Tasdiqlanmoqda...",
    yes: "Ha",
    no: "Yo'q",
    copy: "Nusxalash",
    copied: "Nusxalandi",
    download: "Yuklab olish",
    retry: "Qayta urinish",
    open: "Ochish",
    details: "Batafsil",
    error: "Xato yuz berdi",
    required: "majburiy",
    optional: "ixtiyoriy",
    notSpecified: "—",
    sum: "so'm",
    usd: "USD",
    pcs: "ta",
    day: "kun",
    days: "kun",
    month: "oy",
    search: "Qidirish",
    all: "Barchasi",
    step: (current: number, total: number) => `Qadam ${current} / ${total}`,
  },

  // ——— Navigatsiya / header ———
  nav: {
    brand: "UMD GROUP",
    brandSub: "Mijoz portali",
    pricing: "Xizmat narxlari",
    terms: "Foydalanish shartlari",
    login: "Kirish",
    logout: "Chiqish",
    cabinet: "Kabinet",
    home: "Bosh sahifa",
  },

  // ——— Meta (layout) ———
  meta: {
    title: "UMD GROUP — Mijoz portali",
    description:
      "App Store va Google Play Market uchun ilova joylashtirish va transfer xizmatlari",
  },

  // ——— Bosh sahifa ———
  home: {
    badge: "Onlayn ariza tizimi",
    titlePre: "Xizmat turini",
    titleAccent: "tanlang",
    subtitle:
      "Kerakli xizmatni tanlang va formani to'ldiring. Barcha ma'lumotlar avtomatik ravishda jamoamizga yuboriladi.",
    footer: (year: number) => `© ${year} UMD GROUP. Barcha huquqlar himoyalangan.`,
    badgeSteps: (n: number) => `${n} qadam`,
    badgeNew: "Yangi",
    badgeSubscription: "Obunali",
    catalogFallbackDesc: "Batafsil ma'lumot uchun ariza qoldiring",
    cards: {
      playMarket: {
        title: "Play Market — Joylashtirish",
        description:
          "Android ilovangizni Google Play Market-ga chiqarish uchun kerakli ma'lumot va fayllarni yuboring",
      },
      appStore: {
        title: "App Store — Joylashtirish",
        description:
          "iOS ilovangizni Apple App Store-ga chiqarish uchun sertifikatlar va materiallarni yuboring",
      },
      googleTransfer: {
        title: "Google Play — App Transfer",
        description:
          "Google Play developer akkauntingizdan ilovani bizning akkauntga o'tkazish",
      },
      appleTransfer: {
        title: "Apple App Store — App Transfer",
        description:
          "App Store Connect akkauntingizdan ilovani bizning akkauntga o'tkazish",
      },
      account: {
        title: "Developer akkaunt ochish",
        description:
          "Google Play yoki App Store uchun rasmiy developer akkaunt ochib beramiz (shaxsiy yoki korporativ)",
      },
      duns: {
        title: "DUNS raqami ochish",
        description:
          "Biznesingiz uchun DUNS (Dun & Bradstreet) raqamini rasmiylashtirib beramiz",
      },
    },
  },

  // ——— Portfolio karuseli ———
  showcase: {
    badge: "Portfolio",
    title: "Biz chiqargan ilovalar",
    subtitle: (count: number) => `Google Play'da faol ${count}+ ilovamiz`,
  },

  // ——— Sharhlar bo'limi ———
  reviews: {
    badge: "Sharhlar",
    title: "Mijozlar sharhlari",
    count: (n: number) => `(${n} sharh)`,
    rateButton: "Baho berish",
    thanks: "Rahmat! Sharh muvaffaqiyatli yuborildi.",
    emptyTitle: "Hali sharh yo'q",
    emptySubtitle: "Birinchi bo'lib fikr bildiring!",
    inStore: "Store'da",
  },

  // ——— Sharh modali ———
  reviewModal: {
    title: "Baho bering",
    subtitle: "Xizmatimiz haqida fikringizni bildiring",
    namePlaceholder: "Ismingiz",
    commentPlaceholder: "Fikringizni yozing...",
    errRating: "Reyting tanlang",
    errName: "Ismingizni kiriting",
    errComment: "Izoh yozing",
    stars: ["", "Yomon", "Past", "O'rtacha", "Yaxshi", "Ajoyib!"],
  },

  // ——— Xizmat turlari ———
  service: {
    full: {
      "play-market": "Play Market — Joylashtirish",
      "app-store": "App Store — Joylashtirish",
      "google-transfer": "Google Play — Transfer",
      "apple-transfer": "Apple App Store — Transfer",
      account: "Developer akkaunt ochish",
      duns: "DUNS raqami ochish",
      custom: "Maxsus xizmat",
      other: "Qo'shimcha xizmat",
    },
    short: {
      "play-market": "Play Market",
      "app-store": "App Store",
      "google-transfer": "Google Transfer",
      "apple-transfer": "Apple Transfer",
      account: "Akkaunt ochish",
      duns: "DUNS raqami",
      custom: "Maxsus xizmat",
      other: "Qo'shimcha",
    },
    accountPlatform: {
      google: "Google Play",
      apple: "App Store",
    },
    accountType: {
      personal: "Shaxsiy",
      corporate: "Korporativ",
    },
    appPlaceholder: "Ilova",
  },

  // ——— Ariza holatlari ———
  status: {
    submitted: {
      label: "Yuborildi",
      desc: "Arizangiz qabul qilindi. Tez orada ko'rib chiqamiz.",
    },
    review: {
      label: "Ko'rib chiqilmoqda",
      desc: "Ma'lumot va materiallaringiz jamoamiz tomonidan tekshirilmoqda.",
    },
    payment_pending: {
      label: "To'lov kutilmoqda",
      desc: "Xizmatni davom ettirish uchun to'lov kutilmoqda.",
    },
    preparing: {
      label: "Tayyorlanmoqda",
      desc: "Ilova store talablariga moslab tayyorlanmoqda.",
    },
    store_review: {
      label: "Store ko'rigida",
      desc: "Ilova rasmiy store (Google/Apple) ko'rigiga yuborildi.",
    },
    published: {
      label: "Chiqarildi",
      desc: "Ilova store'da muvaffaqiyatli chiqarildi! 🎉",
    },
    transferring: {
      label: "O'tkazilmoqda",
      desc: "Akkaunt o'tkazish jarayoni ketmoqda.",
    },
    processing: {
      label: "Rasmiylashtirilmoqda",
      desc: "DUNS raqamingiz rasmiylashtirilmoqda.",
    },
    completed: {
      label: "Yakunlandi",
      desc: "Muvaffaqiyatli yakunlandi! 🎉",
    },
    rejected: {
      label: "Rad etildi",
      desc: "Ariza rad etildi. Batafsil ma'lumot uchun biz bilan bog'laning.",
    },
    cancelled: {
      label: "Bekor qilindi",
      desc: "Ariza bekor qilindi.",
    },
    transferred: {
      label: "Transfer qilingan",
      desc: "Ilova boshqa akkauntga o'tkazildi.",
    },
    stage1: {
      label: "Bosqich 1",
      desc: "",
    },
    stage2: {
      label: "Bosqich 2",
      desc: "",
    },
    stage3: {
      label: "Bosqich 3",
      desc: "",
    },
    stage4: {
      label: "Bosqich 4",
      desc: "",
    },
    stage5: {
      label: "Bosqich 5",
      desc: "",
    },
    stage6: {
      label: "Bosqich 6",
      desc: "",
    },
    stage7: {
      label: "Bosqich 7",
      desc: "",
    },
    stage8: {
      label: "Bosqich 8",
      desc: "",
    },
    subscription_ended: {
      label: "Obuna to'xtatildi",
      desc: "Obuna to'xtatildi — ilova store'dan olib tashlandi.",
    },
  },

  // ——— Kirish / ro'yxatdan o'tish ———
  auth: {
    loginMeta: "Kirish — UMD GROUP",
    registerMeta: "Ro'yxatdan o'tish — UMD GROUP",
    loginTitle: "Xush kelibsiz",
    loginSubtitle: "Hisobingizga kiring",
    noAccount: "Hisobingiz yo'qmi?",
    registerTitle: "Ro'yxatdan o'tish",
    registerSubtitle: "Yangi hisob yarating",
    hasAccount: "Hisobingiz bormi?",
    registerLink: "Ro'yxatdan o'tish",
    loginLink: "Kirish",
    email: "Email",
    password: "Parol",
    passwordPlaceholder: "••••••••",
    passwordMinPlaceholder: "Kamida 6 belgi",
    fullName: "To'liq ism",
    fullNamePlaceholder: "Sardor Abdullayev",
    telegram: "Telegram username",
    telegramPlaceholder: "@username",
    submitLogin: "Kirish",
    submitRegister: "Ro'yxatdan o'tish",
    errFullName: "To'liq ismni kiriting",
    errTelegram: "Telegram username: @ bilan, 5–32 belgi (harf, raqam, _)",
    errPasswordShort: "Parol kamida 6 belgi bo'lishi kerak",
    miniAppSigningIn: "Kabinetga kirilyapti…",
    miniAppFailed: "Avtomatik kirish bo'lmadi — quyida qo'lda kiring.",
    errors: {
      emailInUse: "Bu email allaqachon ro'yxatdan o'tgan",
      invalidEmail: "Email format noto'g'ri",
      weakPassword: "Parol juda oddiy (kamida 6 belgi)",
      invalidCredential: "Email yoki parol noto'g'ri",
      tooManyRequests: "Juda ko'p urinish. Birozdan keyin qayta urining",
      networkFailed: "Tarmoq xatosi. Internetni tekshiring",
      sessionFailed: "Sessiya yaratilmadi",
      generic: "Xatolik yuz berdi. Qayta urining",
    },
  },

  // ——— Fayl / rasm yuklash ———
  upload: {
    pickFile: "Fayl tanlash",
    orDrag: " yoki sudrab tashlang",
    pickImage: "Rasm tanlash",
    orDragImage: " yoki sudrab tashlang",
    imageHint: (maxMB: number) => `PNG, JPEG • max ${maxMB}MB`,
    tooLarge: (maxMB: number) => `Fayl hajmi ${maxMB}MB dan oshmasligi kerak`,
    wrongSize: (w: number, h: number, gw: number, gh: number) =>
      `Rasm o'lchami ${w}×${h} px bo'lishi kerak. Siz ${gw}×${gh} px yubordingiz.`,
    recommendedSize: (w: number, h: number, gw: number, gh: number) =>
      `Tavsiya etilgan o'lcham: ${w}×${h} px. Siz ${gw}×${gh} px yubordingiz.`,
    readError: "Rasm faylini o'qishda xato",
  },

  // ——— Yuborish jarayoni (overlay) ———
  submitOverlay: {
    stage1: "Ma'lumotlar yuklanmoqda...",
    stage2: "Serverga yuborilmoqda...",
    stage3: "Telegramga yuborilmoqda...",
    stage4: "Yakunlanmoqda...",
    errorTitle: "Xato yuz berdi",
    retry: "Qayta urinib ko'ring",
    doneTitle: "Muvaffaqiyatli yuborildi!",
    doneSubtitle: "Sahifa yuklanmoqda...",
    dontClose: "Iltimos, sahifani yopmang",
  },

  // ——— Shartlarni tasdiqlash modali ———
  termsConfirm: {
    title: "Foydalanish shartlari",
    agreePre: "Yuqoridagi foydalanish shartlarini",
    agreeStrong: "to'liq o'qib chiqdim",
    agreePost: "va roziman.",
    submit: "O'qidim, so'rovni yuborish",
    submitting: "Yuborilmoqda…",
  },

  // ——— Submit sahifalari sarlavhalari ———
  submitPage: {
    playMarket: {
      meta: "Play Market Joylashtirish — UMD GROUP",
      title: "Play Market — Ilova Joylashtirish",
      subtitle: "Android ilovangizni Google Play Market-ga chiqarish",
    },
    appStore: {
      meta: "App Store Joylashtirish — UMD GROUP",
      title: "App Store — Ilova Joylashtirish",
      subtitle: "iOS ilovangizni Apple App Store-ga chiqarish",
    },
    googleTransfer: {
      meta: "Google Play Transfer — UMD GROUP",
      title: "Google Play — App Transfer",
      subtitle: "Ilovani developer akkauntdan bizning akkauntga o'tkazish",
    },
    appleTransfer: {
      meta: "Apple App Store Transfer — UMD GROUP",
      title: "Apple App Store — App Transfer",
      subtitle: "Ilovani App Store Connect akkauntdan bizning akkauntga o'tkazish",
    },
    account: {
      meta: "Developer akkaunt ochish — UMD GROUP",
      title: "Developer akkaunt ochish",
      subtitle: "Google Play yoki App Store uchun rasmiy developer akkaunt",
    },
    duns: {
      meta: "DUNS Raqami Ochish — UMD GROUP",
      title: "DUNS Raqami Ochish",
      subtitle: "Biznesingiz uchun DUNS raqamini rasmiylashtirish",
    },
  },

  // ——— Formalarda umumiy ———
  form: {
    continue: "Davom etish →",
    backArrow: "← Orqaga",
    submitCheck: "Yuborish ✓",
    change: "← O'zgartirish",
    // Umumiy maydonlar
    fullName: "To'liq ism",
    fullNamePlaceholder: "Sardor Abdullayev",
    phone: "Telefon",
    phoneNumber: "Telefon raqami",
    phonePlaceholder: "+998901234567",
    email: "Email",
    emailPlaceholder: "email@example.com",
    telegram: "Telegram username",
    telegramPlaceholder: "@username",
    telegramHint: "Ixtiyoriy — tezkor bog'lanish uchun",
    password: "Parol",
    note: "Izoh",
    noteWithExtra: "Izoh / Qo'shimcha ma'lumot",
    notePlaceholder: "Qo'shimcha ma'lumot...",
    // Bo'lim sarlavhalari
    sectionClient: "Mijoz ma'lumotlari",
    sectionApp: "Ilova tafsilotlari",
    sectionGraphics: "Grafik materiallar",
    sectionExtra: "Qo'shimcha ma'lumotlar",
    sectionContact: "Aloqa ma'lumotlari",
    // Qadam nomlari
    stepClient: "Mijoz",
    stepApp: "Ilova",
    stepGraphics: "Grafika",
    stepExtra: "Qo'shimcha",
    stepFile: "Fayl",
    stepGithub: "GitHub",
    // Xatolar
    unexpectedError: "Kutilmagan xato",
    networkError: "Tarmoq xatosi yuz berdi",
    timeoutError: "So'rov vaqti tugadi (3 daqiqa)",
    serverError: (status: number) => `Server xatosi (${status}). Qayta urinib ko'ring.`,
    // Test akkaunt bloki
    testAccountTitle: "⚠️ Test akkaunt majburiy",
    testLogin: "Test login",
    testLoginPlaceholder: "test@example.com",
    testLoginHint: "Ixtiyoriy — login talab qilinmasa bo'sh qoldiring",
    testPassword: "Test parol",
  },

  // ——— Zod validatsiya xabarlari ———
  validation: {
    fullNameMin: "To'liq ism kamida 2 belgi bo'lishi kerak",
    phoneRequired: "Telefon raqami majburiy",
    phoneFormat: "Format: +998XXXXXXXXX",
    emailInvalid: "Noto'g'ri email format",
    appNameRequired: "Ilova nomi majburiy",
    appNameMax: "Ilova nomi max 30 belgi",
    packageNameRequired: "Package name majburiy",
    packageNameFormat: "Format: com.company.appname",
    shortDescRequired: "Qisqa tavsif majburiy",
    shortDescMax: "Qisqa tavsif max 80 belgi",
    subtitleRequired: "Subtitle majburiy",
    subtitleMax: "Subtitle max 30 belgi",
    fullDescRequired: "To'liq tavsif majburiy",
    fullDescMax: "To'liq tavsif max 4000 belgi",
    urlInvalid: "To'g'ri URL kiriting",
    urlHttps: "URL HTTPS bo'lishi shart",
    githubUrlInvalid: "To'g'ri GitHub URL kiriting",
    teamIdRequired: "App Store Connect Team ID majburiy",
    appleEmailInvalid: "Noto'g'ri Apple Developer Account email",
    devAccountIdRequired: "Developer Account ID majburiy",
    transactionIdRequired: "Transaction ID majburiy",
    companyNameRequired: "Kompaniya nomi majburiy",
    legalAddressRequired: "Yuridik manzil majburiy",
    companyPhoneRequired: "Kompaniya telefoni majburiy",
    contactNameRequired: "Kontakt shaxs F.I.O. majburiy",
  },

  // ——— Play Market formasi ———
  playMarketForm: {
    appName: "Ilova nomi",
    appNamePlaceholder: "MyApp",
    max30: "Max 30 belgi",
    packageName: "Package name",
    packageNamePlaceholder: "com.company.appname",
    packageNameHint: "Misol: com.umdgroup.myapp",
    shortDesc: "Qisqa tavsif",
    shortDescPlaceholder: "Eng zo'r ilova",
    max80: "Max 80 belgi",
    fullDesc: "To'liq tavsif",
    fullDescPlaceholder: "Ilovangiz haqida batafsil ma'lumot...",
    privacyUrl: "Privacy Policy URL",
    privacyUrlPlaceholder: "https://yourapp.com/privacy",
    httpsHint: "HTTPS bilan boshlanishi shart",
    icon: "Ilova ikonasi",
    banner: "Feature Graphic / Banner",
    screenshots: "Skrinshotlar (kamida 2 ta, max 8 ta)",
    iconRequired: "Ilova ikonasi majburiy",
    bannerRequired: "Feature Graphic majburiy",
    screenshotsRequired: "Kamida 2 ta skrinshot talab qilinadi",
    testAccountBody:
      "Ilovangizda login yoki ro'yxatdan o'tish talab qilinsa, Google Play moderatorlari ilovani tekshirish uchun test akkaunt ma'lumotlarini talab qiladi. Aks holda ariza rad etilishi mumkin.",
    readyTitle: "Yuborishga tayyor",
    aabTitle: "AAB faylni Telegram orqali yuboring",
    aabBodyPre: "Ariza yuborilgandan keyin",
    aabBodyFile: ".aab",
    aabBodyPost: "faylni quyidagi Telegram akkauntga yuboring:",
  },

  // ——— App Store formasi ———
  appStoreForm: {
    appName: "Ilova nomi",
    appNamePlaceholder: "MyApp",
    max30: "Max 30 belgi",
    subtitle: "Subtitle (qisqa tavsif)",
    subtitlePlaceholder: "Best app for...",
    fullDesc: "To'liq tavsif",
    fullDescPlaceholder: "Ilovangiz haqida batafsil...",
    privacyUrl: "Privacy Policy URL",
    privacyUrlPlaceholder: "https://yourapp.com/privacy",
    httpsHint: "HTTPS bilan boshlanishi shart",
    supportUrl: "Support URL",
    supportUrlPlaceholder: "https://yourapp.com/support",
    supportUrlHint: "Foydalanuvchilar murojaat qiladigan sahifa (HTTPS)",
    githubTitle: "GitHub Repository",
    collaboratorTitle: "Muhim: Collaborator qo'shing",
    collaboratorPre: "Repo-ga",
    collaboratorPost: "ni collaborator sifatida qo'shing:",
    collaboratorPath: "Settings → Collaborators → Add people → ahadjonovss",
    repoUrl: "GitHub repo URL",
    repoUrlPlaceholder: "https://github.com/username/repo",
    iphoneTitle: "iPhone skrinshotlari",
    iphoneHint: 'Kamida 3 ta • iPhone 6.9": 1320×2868 px yoki 6.5": 1242×2688 px',
    iphoneLabel: "iPhone skrinshotlari (kamida 3 ta, max 10 ta)",
    iphoneRequired: "Kamida 3 ta iPhone skrinshot talab qilinadi",
    ipadTitle: "iPad skrinshotlari (ixtiyoriy)",
    ipadHint: 'iPad 12.9": 2048×2732 px yoki 11": 1668×2388 px',
    ipadLabel: "iPad skrinshotlari",
    testAccountBody:
      "Ilovangizda login yoki ro'yxatdan o'tish talab qilinsa, App Store ko'rib chiquvchilari ilovani tekshirish uchun test akkaunt ma'lumotlarini talab qiladi. Aks holda ariza rad etilishi mumkin.",
  },

  // ——— Google Play transfer formasi ———
  googleTransferForm: {
    heading: "Google Play — App Transfer",
    sub: "Ilovani bizning akkauntga o'tkazish uchun ma'lumotlar",
    sectionAccount: "Developer akkaunt",
    whereToFind: "ℹ️ Developer Account ID ni qayerdan topish:",
    whereToFindPath: "Play Console → Settings → Developer account → Account details",
    devAccountId: "Developer Account ID",
    devAccountIdPlaceholder: "12345678901234567890",
    txTitlePre: "ℹ️",
    txTitleStrong: "Transaction ID",
    txTitlePost: "ni qanday olish mumkin:",
    txStep1Pre: "1. Akkauntga",
    txStep1Amount: "$25",
    txStep1Post: "to'lov qiling (Google Play developer to'lovi).",
    txStep2: "2. Transaction ID ni quyidagilardan toping:",
    txStep2a: "email xabaridan",
    txStep2aPre: "• To'lovdan keyin Google yuborgan",
    txStep2aPost: ", yoki",
    txStep2b: "Google Payments profili → Payment history (to'lovlar tarixi)",
    txStep2bPost: "dan.",
    transactionId: "Transaction ID",
    transactionIdPlaceholder: "0.G.1234-5678-9012-3456",
    transactionIdHint: "$25 to'lovdan keyin email xabari yoki Google profil → Payment history",
  },

  // ——— Apple transfer formasi ———
  appleTransferForm: {
    heading: "Apple App Store — App Transfer",
    sub: "Ilovani bizning akkauntga o'tkazish uchun ma'lumotlar",
    sectionAccount: "Apple akkaunt",
    whereToFind: "ℹ️ Team ID ni qayerdan topish:",
    whereToFindPath: "App Store Connect → Users and Access → Team ID",
    teamId: "App Store Connect Team ID",
    teamIdPlaceholder: "1A2B3C4D5E",
    devEmail: "Apple Developer Account Email",
    devEmailPlaceholder: "example@company.com",
    devEmailHint: "Apple Developer akkauntingizga ulangan email",
  },

  // ——— DUNS formasi ———
  dunsForm: {
    heading: "DUNS raqami ochish",
    sub: "Biznesingiz uchun DUNS (Dun & Bradstreet) raqamini rasmiylashtirib beramiz",
    infoStrong: "DUNS raqami",
    infoBody:
      "— Dun & Bradstreet tomonidan beriladigan, biznesni xalqaro miqyosda tasdiqlaydigan noyob identifikator. Apple Developer Enterprise akkaunt va boshqa xalqaro xizmatlar uchun talab qilinadi.",
    sectionCompany: "Kompaniya ma'lumotlari",
    companyName: "Kompaniya nomi (yuridik)",
    companyNamePlaceholder: "Masalan: MCHJ Umd Group",
    legalAddress: "Yuridik manzil",
    legalAddressPlaceholder: "Shahar, ko'cha, uy raqami",
    companyPhone: "Kompaniya telefoni",
    phonePlaceholder: "+998 90 123 45 67",
    website: "Veb-sayt (ixtiyoriy)",
    websitePlaceholder: "https://...",
    sectionContact: "Kontakt shaxs",
    cpName: "F.I.O.",
    cpNamePlaceholder: "Kontakt shaxs to'liq ismi",
    cpPhone: "Telefon (ixtiyoriy)",
  },

  // ——— Developer akkaunt formasi ———
  accountForm: {
    introTitle: "Developer akkaunt ochish",
    introSub:
      "Google Play yoki App Store uchun rasmiy developer akkauntni siz uchun ochib, sozlab beramiz.",
    pickPlatform: "1. Platformani tanlang",
    pickType: "2. Akkaunt turini tanlang",
    googleConsole: "Google Play Console",
    appStoreConnect: "App Store Connect",
    personal: "Shaxsiy",
    personalSub: "Jismoniy shaxs nomiga",
    corporate: "Korporativ",
    corporateSub: "Tashkilot / yuridik shaxs",
    ourFee: "Bizning xizmat haqimiz",
    paymentOrder: "To'lov tartibi:",
    advance: (pct: number) => `Avans (${pct}%) — ariza tasdiqlangach`,
    remaining: (pct: number) => `Qolgan (${pct}%) — akkaunt topshirilgach`,
    includesTitle: "Xizmat haqi nimani o'z ichiga oladi?",
    include1: "Akkauntni ro'yxatdan o'tkazish va to'g'ri sozlash",
    include2: "Ma'lumotlarni kiritish va tasdiqlash jarayonini kuzatish",
    include3Apple: "D-U-N-S raqami va yuridik hujjatlarni rasmiylashtirishda ko'maklashish",
    include3Google: "Yuridik shaxs ma'lumotlarini to'g'ri sozlash",
    warnPre: "Bu narx",
    warnStrong: "platformaning rasmiy to'lovini o'z ichiga olmaydi",
    warnMid: "to'lovi",
    warnPost: (who: string) => `to'g'ridan-to'g'ri ${who}ga alohida to'lanadi.`,
    appleFee: "$99/yil",
    googleFee: "$25 (bir marta)",
    appleLogin: "Apple ID (email)",
    googleLogin: "Google akkaunt (Gmail)",
    priceLine: (base: number, advance: number) => `Xizmat narxi: $${base} · Avans: $${advance}`,
    sectionAppleId: "Apple ID",
    sectionGoogleAccount: "Google akkaunt",
    loginPasswordPlaceholder: "Akkaunt paroli",
    applePlaceholder: "apple-id@icloud.com",
    googlePlaceholder: "example@gmail.com",
    sectionOrg: "Tashkilot ma'lumotlari",
    legalCompanyName: "Yuridik kompaniya nomi",
    legalCompanyPlaceholder: "MChJ «Namuna»",
    legalAddress: "Yuridik manzil",
    legalAddressPlaceholder: "Ko'cha, shahar, pochta indeksi, mamlakat",
    companyPhone: "Kompaniya telefoni",
    companyEmail: "Kompaniya email",
    website: "Veb-sayt",
    companyType: "Kompaniya turi",
    companyTypePlaceholder: "MChJ, AJ, LLC...",
    activityType: "Faoliyat turi",
    activityTypePlaceholder: "IT, savdo, ta'lim...",
    sectionSignatory: "Legal Signatory (imzolovchi)",
    sectionContactPerson: "Kontakt shaxs",
    cpName: "F.I.O.",
    cpNamePlaceholder: "To'liq ism",
    cpPosition: "Lavozim",
    cpPositionPlaceholder: "Direktor, menejer...",
    certLabel: "Guvohnoma scan (ixtiyoriy)",
    certHint: "Kompaniya ro'yxatdan o'tganlik guvohnomasi (rasm yoki PDF)",
    sectionHolder: "Akkaunt egasi",
    holderNameApple: "To'liq ism familiya (pasportdagi)",
    holderName: "To'liq ism familiya",
    country: "Mamlakat",
    countryPlaceholder: "O'zbekiston",
    extraNote: "Qo'shimcha izoh (ixtiyoriy)",
    errContact: "Aloqa ma'lumotlarini to'ldiring",
    errLogin: (label: string) => `${label} va parolni kiriting`,
    errCompanyName: "Yuridik kompaniya nomini kiriting",
    errLegalAddress: "Yuridik manzilni kiriting",
    errHolderName: "Akkaunt egasining to'liq ismini kiriting",
  },

  // ——— Foydalanish shartlari sahifasi ———
  termsPage: {
    meta: "Foydalanish shartlari — UMD GROUP",
    title: "Foydalanish shartlari",
    subtitle: "UMD GROUP xizmatlaridan foydalanish qoidalari",
    noticeTitle: "Diqqat",
    noticeBody:
      "2026-yildan boshlab **UMD GROUP rasmiy faoliyat yuritishni boshlaganligi** sababli, barcha to'lovlar **P2P (shaxsiy karta orqali) emas**, balki **maxsus to'lov havolasi** orqali (to'lov ilovalari yordamida) amalga oshiriladi. Har bir to'lov bo'yicha mijozga **Soliq idorasidan elektron chek** taqdim etiladi.",
    questionsTitle: "Savollaringiz bormi?",
    questionsSub: "Shartlar bo'yicha qo'shimcha ma'lumot olish uchun murojaat qiling",
    telegramCta: "Telegram orqali yozing",
    lastUpdate: "Oxirgi yangilanish: Yanvar 2026 · UMD GROUP",
    tabs: {
      publish: "Store'ga chiqarish",
      transfer: "Transfer",
      update: "Update",
      renewal: "Obunani uzaytirish",
      account: "Akkaunt ochish",
      push_certificate: "Push sertifikat",
      duns: "DUNS raqami",
    },
  },

  // ——— Shartlar matni ———
  terms: {
    publish: {
      s1Title: "Xizmat narxi va muddati",
      s1Body:
        "Mobil ilovani App Store va Google Play Market platformalariga joylashtirish bo'yicha xizmat narxi va muddati ilova funksionalligiga ko'ra **individual** belgilanadi.",
      s2Title: "To'lov tartibi",
      s2Intro: (advance: number, rest: number) =>
        `To'lov **${advance}/${rest} formatida** amalga oshiriladi:`,
      s2Advance: "Xizmat boshlanishidan oldin — **oldindan to'lov**",
      s2Rest: "Ilova joylashtirilgach **1 soat ichida**",
      s3Title: "Jarima va kechikishlar",
      s3a: (rest: number) =>
        `${rest}% qolgan to'lov 1 soatdan kechiksa — qolgan summaga **30% jarima**.`,
      s3b: "To'lov 24 soatdan oshsa — ilova **ogohlantirishsiz** platformadan olib tashlanadi.",
      s3c: "Qo'shimcha 24 soat beriladi. Shunda ham to'lanmasa — ilova **butunlay o'chiriladi**, mablag' qaytarilmaydi.",
      s4Title: "Kafolat muddati",
      s4Badge: "9 oy",
      s4Note: "Ilova platformada joylashtirilgan kundan boshlab kafolatlanadi.",
      s4Body:
        "9 oy tugagach, mijoz shartnomani **chegirmali narxda yangilashi** lozim. Aks holda ilova olib tashlanishi mumkin.",
      s5Title: "Voz kechish va mablag' qaytarilishi",
      s5ClientTitle: "Mijoz voz kechsa:",
      s5ClientBody: (fee: number) =>
        `Umumiy xizmat narxining **${fee}%**i bajarilgan ish va soliq xarajatlari uchun ushlab qolinadi, to'langandan qolgani qaytariladi.`,
      s5UsTitle: "UMD GROUP voz kechsa:",
      s5UsBody: "Komissiyasiz, to'langan summa **3 ish kuni ichida** to'liq qaytariladi.",
      s6Title: "Yakuniy qoidalar",
      s6a: "UMD GROUP ilovaning texnik va dizayn talablariga muvofiqligini ta'minlaydi.",
      s6b: "Qoidalarga zid yoki noqonuniy kontentli ilovalarga xizmat ko'rsatishdan bosh tortish huquqi saqlanadi.",
    },
    transfer: {
      s1Title: "Xizmat mohiyati",
      s1Body:
        "Chiqarilgan ilovani **developer akkauntlar o'rtasida o'tkazish** (Google Play yoki App Store).",
      s2Title: "Narx va to'lov",
      s2Body: (advance: number) =>
        `Narx ilova platformasiga qarab belgilanadi va so'rov yaratilganda ko'rsatiladi. To'lov **${advance}% oldindan**.`,
      s3Title: "Jarayon va muddat",
      s3a: "Transfer platforma qoidasiga ko'ra bir necha ish kuni davom etadi.",
      s3b: "Jarayon to'lov tasdiqlangach boshlanadi.",
      s4Title: "Muhim",
      s4a: "Transferdan so'ng ilova **UMD GROUP obunasida bo'lmaydi** — egalik mijozga o'tadi.",
      s5Title: "Voz kechish",
      s5Body:
        "Jarayon boshlanmasidan bekor qilinsa — mablag' qaytariladi. Transfer boshlangach qaytarilmaydi.",
    },
    update: {
      s1Title: "Xizmat mohiyati",
      s1Body: "Chiqarilgan ilovaning **yangi versiyasini** store'ga chiqarish.",
      s2Title: "Shartlar",
      s2a: "Ilova store'da **chiqarilgan** va asosiy to'lovi **yakunlangan** bo'lishi kerak.",
      s3Title: "Narx va to'lov",
      s3Body: (android: number, ios: number, advance: number) =>
        `Android — **$${android}**, iOS — **$${ios}**. To'lov **${advance}% oldindan**.`,
      s4Title: "Jarayon",
      s4a: "**Android:** yangi **.aab** faylni Telegram orqali topshirasiz.",
      s4b: "**iOS:** yangi kodni **GitHub**ga push qilasiz.",
    },
    renewal: {
      s1Title: "Xizmat mohiyati",
      s1Body: "Ilovaning **9 oylik muddatini** yana **+9 oyga** uzaytirish.",
      s2Title: "Narx",
      s2Body: "Uzaytirish narxi — ilova **chiqarilgan paytdagi narxning 50%**i.",
      s3Title: "To'lov va muddat",
      s3a: "To'lov **100% oldindan**.",
      s3b: "To'lovdan so'ng muddat **+9 oyga** uzaytiriladi.",
      s4Title: "Muhim",
      s4a: "Muddat o'z vaqtida uzaytirilmasa — ilova store'dan **olib tashlanishi** mumkin.",
    },
    pushCertificate: {
      s1Title: "Xizmat mohiyati",
      s1Body:
        "Apple ilovalari uchun **push notification (APNs) sertifikati**ni tayyorlab berish.",
      s2Title: "Shartlar",
      s2a: "Faqat **Apple (App Store)** ilovalari uchun.",
      s2b: "Ilova store'da **chiqarilgan** va asosiy to'lovi **yakunlangan** bo'lishi kerak.",
      s3Title: "Narx va to'lov",
      s3Body: (price: number) => `Narx — **$${price}**. To'lov **100% oldindan**.`,
      s4Title: "Jarayon",
      s4a: "So'rov yaratasiz va to'lovni amalga oshirasiz.",
      s4b: "To'lov tasdiqlangach sertifikat **Telegram orqali** yuboriladi.",
      s5Title: "Muhim",
      s5a: "Bu **bir martalik** xizmat. APNs sertifikati Apple tomonidan vaqti-vaqti bilan yangilanishi mumkin — kerak bo'lganda qayta so'rov yaratasiz.",
    },
    duns: {
      s1Title: "Xizmat mohiyati",
      s1Body:
        "Biznesingiz uchun **DUNS (Dun & Bradstreet) raqami**ni rasmiylashtirib berish — Apple Developer Enterprise akkaunt va boshqa xalqaro xizmatlar uchun talab qilinadigan noyob biznes identifikatori.",
      s2Title: "Narx va to'lov",
      s2Body: (price: number) =>
        `Narx — **$${price}**. To'lov **100% oldindan** amalga oshiriladi.`,
      s3Title: "Jarayon va muddat",
      s3a: "Kompaniya va kontakt shaxs ma'lumotlarini yuborasiz, to'lovni amalga oshirasiz.",
      s3b: "Dun & Bradstreet tomonidan tasdiqlash **bir necha kundan bir necha haftagacha** cho'zilishi mumkin — bu muddat UMD GROUP'ga bog'liq emas.",
      s4Title: "Muhim",
      s4a: "Bu **bir martalik** xizmat — DUNS raqami umrbod amal qiladi.",
    },
    account: {
      s1Title: "Xizmat mohiyati",
      s1Body:
        "Sizning nomingizga **Google Play Console** yoki **App Store Connect** developer akkauntini rasmiy ravishda ochish va sozlash.",
      s2Title: "Narx — faqat xizmat haqi",
      googlePersonal: "Google — shaxsiy",
      googleCorporate: "Google — korporativ",
      applePersonal: "Apple — shaxsiy",
      appleCorporate: "Apple — korporativ",
      s2Payment: (advance: number) => `To'lov **${advance}% oldindan**`,
      s2PaymentRest: (rest: number) => `, ${rest}% akkaunt topshirilgach`,
      s3Title: "Platforma to'lovi alohida",
      s3Body:
        "Narx **faqat bizning xizmat haqimiz**. Platformaning rasmiy to'lovi narxga **kirmaydi**: Google — **$25**, Apple — **$99/yil**. To'g'ridan-to'g'ri Google/Apple'ga to'lanadi.",
      s4Title: "Kerakli ma'lumotlar",
      s4a: "Akkaunt logini (Gmail / Apple ID) va paroli.",
      s4b: "**Korporativ:** yuridik kompaniya ma'lumotlari; Apple uchun **D-U-N-S raqami**.",
      s5Title: "Jarayon va muddat",
      s5a: "Ma'lumotlar to'g'ri bo'lsa — bir necha ish kunida.",
      s5b: "Korporativ (ayniqsa Apple D-U-N-S) tasdiqlash **1–2 haftagacha** cho'zilishi mumkin.",
      s6Title: "Mas'uliyat",
      s6a: "Akkaunt **mijoz nomiga** ochiladi; login ma'lumotlari mijozga topshiriladi.",
      s7Title: "Voz kechish",
      s7ClientTitle: "Mijoz voz kechsa:",
      s7ClientBody: (fee: number) =>
        `Jarayon boshlangan bo'lsa, umumiy xizmat narxining **${fee}%**i ushlab qolinadi. Platforma to'lovi qilingach yoki akkaunt ochilgach — qaytarilmaydi.`,
    },
  },

  // ——— Ariza qabul qilindi sahifasi ———
  success: {
    meta: "Ariza Qabul Qilindi — UMD GROUP",
    title: "Ariza qabul qilindi!",
    bodyPost: "bo'yicha arizangiz muvaffaqiyatli yuborildi.",
    contactSoon: "Jamoamiz tez orada siz bilan bog'lanadi.",
    defaultService: "Xizmat",
    paymentNeeded: "Davom etish uchun to'lov kerak",
    goToPayment: "To'lovga o'tish",
    nextSteps: "Keyingi qadamlar",
    stepPay: "To'lovni amalga oshiring va chekni yuklang",
    stepReview: "Jamoamiz arizangizni ko'rib chiqadi (1-2 ish kuni)",
    stepContact: "Email yoki telefon orqali siz bilan bog'lanamiz",
    stepNotify: "Ilovangiz joylashtirilishi haqida xabar beramiz",
    aabTelegram: "faylni Telegram orqali yuboring:",
    backHome: "Bosh sahifaga qaytish",
    serviceNames: {
      "play-market": "Play Market Joylashtirish",
      "app-store": "App Store Joylashtirish",
      "google-transfer": "Google Play Transfer",
      "apple-transfer": "Apple App Store Transfer",
      duns: "DUNS Raqami Ochish",
      account: "Developer Akkaunt Ochish",
      custom: "Maxsus Xizmat",
    },
  },

  // ——— Xizmat narxlari sahifasi ———
  pricingPage: {
    meta: "Xizmat narxlari — UMD GROUP",
    title: "Xizmat narxlari",
    subtitle: "UMD GROUP taklif etadigan xizmatlar va narxlar",

    s1Title: "Ilovani Store-ga chiqarish",
    appStoreIos: "App Store (iOS)",
    googlePlayAndroid: "Google Play (Android)",
    feature9m: "9 oylik kafolat muddati",
    featurePayment: (advance: number, rest: number) =>
      `To'lov: ${advance}% oldindan, ${rest}% chiqarilgandan keyin`,
    featureRenew: "9 oy tugasa chegirmali yangilash imkoni",
    s1Note:
      "270 kunlik muddat ilova store'ga rasmiy chiqqan kundan boshlab hisoblanadi. Muddat tugagach obunani **50% chegirma** bilan uzaytirish mumkin.",

    s2Title: "Yangilanish (Update) chiqarish",
    androidEach: "Android (har bir update)",
    iosEach: "iOS (har bir update)",
    s2Note: "⚠️ Update chiqarish ilovaning store'da turish muddatini uzaytirmaydi.",

    s3Title: "Oylik update paketlari",
    androidPkg: "Android — oyiga 5 tagacha",
    iosPkg: "iOS — oyiga 5 tagacha",
    perMonth: "/ oy",
    s3Note: "5 tadan oshgan yangilanishlar oddiy narxlarda davom etadi.",

    s4Title: "Ilovani transfer qilish",
    s4Sub: "Google Play va App Store uchun",
    googlePlay: "Google Play",
    appStore: "App Store",
    s4Note: (advance: number) => `To'lov **${advance}% oldindan**`,
    s4NoteRest: (rest: number) => `, ${rest}% keyin`,
    s4NoteEnd: " amalga oshiriladi.",

    s5Title: "Developer akkaunt ochish",
    s5Sub: "Google Play va App Store uchun (shaxsiy / korporativ)",
    googlePersonal: "Google Play — shaxsiy",
    googleCorporate: "Google Play — korporativ",
    applePersonal: "App Store — shaxsiy",
    appleCorporate: "App Store — korporativ",
    s5NoteStart: (advance: number) =>
      `Bu — **bizning xizmat haqimiz**. To'lov **${advance}% oldindan**`,
    s5NoteRest: (rest: number) => `, ${rest}% akkaunt ochilgach`,
    s5NoteEnd:
      ". Platformaning rasmiy to'lovi (Google $25, Apple $99/yil) narxga **kirmaydi** — u to'g'ridan-to'g'ri Google/Apple'ga alohida to'lanadi.",

    s6Title: "DUNS raqami ochish",
    s6Sub: "Biznesingiz uchun Dun & Bradstreet raqami",
    dunsLabel: "DUNS raqami",
    s6Note:
      "To'lov **100% oldindan** amalga oshiriladi. Tasdiqlash muddati Dun & Bradstreet tomonidan belgilanadi (bir necha kundan bir necha haftagacha).",

    s7Title: "Obunani uzaytirish (+9 oy)",
    s7Body:
      "Obunani uzaytirish narxi ilova **chiqarilgan paytdagi narxning 50%**i.",
    androidPlay: "Android (Play Market)",
    iosAppStore: "iOS (App Store)",
    s7a: "Obuna tugamasidan oldin yangilansa — keyingi obuna uchun **10% gacha chegirma** beriladi.",
    s7b: "Yangilash uchun **3 kunlik muddat** beriladi. 3 kun ichida to'lov bo'lmasa, chegirma bekor qilinadi.",

    s8Title: "To'lov bo'yicha umumiy qoida",
    attention: "⚠️ Diqqat",
    s8a: (advance: number, rest: number) =>
      `Faqat **"Ilovani Store-ga chiqarish"** xizmatida avans (${advance}/${rest}) qo'llaniladi.`,
    s8b: "Boshqa barcha xizmatlarda to'lov **100% oldindan** amalga oshiriladi.",

    customTitle: "Maxsus xizmatlar",
    customOneTime: "Bir martalik:",
    customAdvance: (pct: number) => ` (avans ${pct}%)`,
    customRecurring: "Davriy:",
    customPeriod: (months: number) => (months === 1 ? " / oy" : ` / ${months} oy`),
    customEta: (days: number) => `Muddat: ${days} ish kuni`,

    s9Title: "Valyuta kursi bo'yicha hisob-kitob",
    s9Body:
      'Dollar ($) ko\'rinishidagi narxlar so\'mga (UZS) konvertatsiya qilinayotganda to\'lov amalga oshirilayotgan kundagi **Kapital bank ilovasidagi "Sotish" kursi** asos qilib olinadi.',
    exampleTitle: "Misol:",
    exampleLine1: "Xizmat narxi: **$10**",
    exampleLine2: 'Kapital bank "Sotish" kursi: **1$ = 12 800 so\'m**',
    exampleLine3: "To'lov miqdori: **10 × 12 800 = 128 000 so'm**",

    footerNote:
      "ℹ️ Barcha narx va shartlar UMD GROUP tomonidan belgilanadi va o'zgarishi mumkin.",
    footerUpdate: "Oxirgi yangilanish: Yanvar 2026",
  },

  // ——— So'rov turlari va holatlari ———
  requestType: {
    transfer: "Transfer",
    update: "Update",
    subscription_renewal: "Obuna uzaytirish",
    push_certificate: "Push sertifikat",
    custom: "Qo'shimcha to'lov",
    recurring: "Davriy to'lov",
  },
  requestInProgress: {
    transfer: "O'tkazilmoqda",
    update: "Tayyorlanmoqda",
    subscription_renewal: "Uzaytirilmoqda",
    push_certificate: "Tayyorlanmoqda",
    custom: "Jarayonda",
    recurring: "To'lov kutilmoqda",
  },
  requestStatus: {
    requested: "So'rov yuborildi",
    review: "Ko'rib chiqilmoqda",
    payment_pending: "To'lov kutilmoqda",
    in_progress: "Jarayonda",
    store_review: "Store ko'rigida",
    completed: "Yakunlandi",
    rejected: "Rad etildi",
    cancelled: "Bekor qilindi",
  },
  discountService: {
    publish: "Store'ga chiqarish",
    account: "Akkaunt ochish",
    transfer: "Transfer",
    update: "Update",
    renewal: "Obuna uzaytirish",
    push_certificate: "Push sertifikat",
  },

  // ——— Kabinet ———
  panel: {
    meta: "Kabinet — UMD GROUP",
    admin: "Admin",
    greeting: (name: string) => `Salom, ${name} 👋`,
    greetingSub: "Ilovalaringiz, holati va obuna muddati",
    newRequest: "Yangi ariza",
    pickService: "Xizmatni tanlang",
    draftAdding: "Qo'shilmoqda…",
    draftButton: "+ Draft ariza",
    emptyTitle: "Hali ariza yubormagansiz.",
    emptyCta: "Birinchi arizani yuborish",
    myApps: "Ilovalarim",
    appsCount: (n: number) => `· ${n} ta`,

    // Statistika
    statAll: "Jami ilovalar",
    statActive: "Faol",
    statProgress: "Jarayonda",
    statAction: "Amal kerak",
    filter: {
      all: "Barchasi",
      action: "Amal kerak",
      active: "Faol",
      progress: "Jarayonda",
      closed: "Yopilgan",
    },
    emptyFilter: "Bu bo'limda ilova yo'q.",
    showAll: "Barchasini ko'rsatish",

    // Yangi ariza menyusi
    services: {
      playMarket: { label: "Play Market", sub: "Joylashtirish" },
      appStore: { label: "App Store", sub: "Joylashtirish" },
      googleTransfer: { label: "Google Play", sub: "Transfer" },
      appleTransfer: { label: "Apple App Store", sub: "Transfer" },
      account: { label: "Developer akkaunt", sub: "Ochish" },
    },

    // Hamyon
    walletTitle: "Mening hamyonim",
    walletAria: "Hamyon haqida",
    walletHowTitle: "Hamyon qanday to'ladi?",
    walletHow1:
      "To'lov qilganingizda ba'zan summadan **ortiqroq** o'tkazasiz. Masalan to'lov **12,300 so'm** bo'lsa va siz **13,000 so'm** yuborsangiz — ortiqcha **700 so'm** hamyoningizga tushadi.",
    walletHow2:
      "Hamyondagi pul **keyingi to'lovingizdan avtomatik ayiriladi** — ya'ni kamroq to'laysiz. Pulingiz yo'qolmaydi.",

    // Telegram
    tgLinkMore: "Yana Telegram akkaunt ulash",
    tgLinkedCount: (n: number) => `(${n} ta ulangan)`,
    tgTitle: "Telegramga ulaning",
    tgSub:
      "Ilovalaringiz bo'yicha barcha yangiliklarni — status, to'lov, so'rovlar — Telegramda olib turing",
    tgCta: "Ulash",

    // Chegirma
    discountMessage: (service: string, pct: number) =>
      `Sizga **${service}** xizmatiga **−${pct}%** chegirma berilgan!`,
    discountAuto: "To'lov qilganingizda avtomatik qo'llanadi",
    discountUntil: (date: string) => ` · ${date} gacha amal qiladi`,

    // Paket tugashi
    pkgExpiring: (days: number) => `update paketi **${days} kun**dan so'ng tugaydi`,
    pkgRemaining: (left: number) => `Qolgan updatelar: ${left} ta · paketni yangilash mumkin`,

    // Baholash
    rateServiceTitle: "Xizmatni baholang",
    rateUnreviewed: (n: number) => `${n} ta baholanmagan xizmat`,
    rateSub: "Xizmatimizni baholab, fikringizni qoldiring.",
    rateCta: "Baholash",
    rated: "Baholangan",
    doneAccount: "developer akkauntingiz tayyor bo'ldi",
    doneTransfer: "transferi yakunlandi",
    donePublish: "store'ga chiqdi",
    reviewModalTitle: "Xizmatni baholang",
    reviewModalSub: "Tajribangiz haqida fikr bildiring",
    alreadyRatedTitle: "Allaqachon baholangan",
    alreadyRatedDesc: (label: string) => `"${label}" xizmati allaqachon baholangan. Rahmat!`,
    cannotRateTitle: "Baholab bo'lmaydi",
    cannotRateDesc: "Bu ariza topilmadi yoki hali baholashga tayyor emas.",

    // Ilova kartochkasi
    paymentPending: "To'lov kutilmoqda",
    transferredOn: (date: string) => `${date} da transfer qilingan`,
    subStartsAfter: "Obuna: ilova chiqarilgach boshlanadi (9 oy)",
    submittedOn: (date: string) => `Yuborilgan: ${date}`,
    inStoreOn: (date: string) => `· Store'da: ${date}`,
    moreDetails: "Batafsil →",

    // To'lov eslatmalari
    alertsTitle: "To'lov kutilmoqda",
    alertsCount: (n: number) => `${n} ta to'lov`,
    alertsApps: (n: number) => ` · ${n} ta ilova`,
    payAllTitle: "💳 Hammasini birga to'lash",
    payAllCount: (n: number) => `(${n} ta)`,
    payAllLabel: (n: number) => `Hammasi — ${n} ta to'lov`,
    multiPay: (n: number, labels: string) => `${n} ta to'lov: ${labels}`,
    clickToPay: " · to'lash uchun bosing",
    advanceLabel: "Avans to'lovi",
    paymentLabel: "To'lov",
    finalLabel: "Yakuniy to'lov",
    requestPayLabel: (type: string) => `${type} to'lovi`,
    renewalLabel: "Obunani uzaytirish",
    recurringPayLabel: "Davriy to'lov",
    invoiceLabel: "Hisob-faktura",
    renewalPayLabel: "Obunani uzaytirish (+9 oy)",
    renewalStarting: "Boshlanmoqda…",
    renewalPay: (usd: number) => `To'lash — $${usd}`,

    // Invoice
    invoiceState: {
      due: "To'lanmagan",
      partial: "Qisman to'langan",
      rejected: "Rad etilgan — qayta yuboring",
      submitted: "Yuborildi — tekshiruvda",
      confirmed: "To'langan",
      locked: "Keyinroq",
    },
    invoicePartial: (total: number, paid: number, left: number) =>
      `Jami $${total} · to'langan $${paid} · qoldi $${left}`,
    payFull: "To'liq to'lash",
    payFullLabel: "To'liq to'lov",

    // To'lov oynasi
    payDefaultLabel: "Avans (oldindan)",
    paySent: "Chek yuborildi",
    paySentSub: "Admin tasdiqlashini kuting.",
    payServicePrice: "Xizmat narxi",
    payDiscount: (pct: number) => `Chegirma (−${pct}%)`,
    payFromWallet: "🪙 Hamyondan",
    payToPay: "To'lash kerak",
    payRate: (rate: string) => ` · 1$=${rate} so'm`,
    payStep1: "Ushbu kartaga o'tkazing",
    payCopy: "Nusxa",
    payNoCard: "Karta raqami hali sozlanmagan. Admin bilan bog'laning.",
    payPhone: "Telefon raqami",
    payPhoneHint: "Soliqdan elektron chekni SMS orqali yuborish uchun",
    payUploadReceipt: "To'lov chekini (skrinshot) yuklang",
    payImageSelected: "✓ Rasm tanlandi",
    payRemove: "O'chirish",
    payPickImage: "Rasm tanlash",
    paySubmit: "Chekni jo'natish",
    paySending: "Yuborilmoqda…",
    payErrNoReceipt: "Chek rasmini yuklang",
    payErrNoAmount: "To'layotgan summangizni kiriting",

    // Qisman to'lash
    payAlreadyPaid: "Avval to'langan",
    payPartialLink: "Hammasini to'lay olmayapsizmi? Qisman to'lash →",
    payPartialTitle: "Shu safar qancha to'laysiz?",
    payPartialRemaining: (sum: string) => `Qolgan summa: ${sum} so'm`,
    payPartialLeftAfter: (sum: string) => `To'lovdan keyin qoladi: ${sum} so'm`,
    payPartialCovers: "Qoldiq to'liq yopiladi ✓",
    payPartialSummary: (approx: number, total: number) => `~$${approx} · jami qoldiq $${total}`,

    // Davriy to'lovni oldindan to'lash
    // Davriy to'lov bo'limi
    recurringPeriod: (months: number) => (months === 1 ? "oylik" : months === 12 ? "yillik" : `${months} oyda bir`),
    recurringTitle: (period: string) => `${period.replace(/^./, (c) => c.toUpperCase())} to'lov`,
    recurringStatus: {
      pending: "Kutilmoqda",
      active: "Faol",
      past_due: "Qarzdor",
      cancelled: "Bekor qilingan",
    },
    recurringStartsOnDelivery: "Ish topshirilgach boshlanadi",
    recurringOverdue: (days: number) => `${days} kun kechikdi`,
    recurringNextCharge: (date: string) => `Keyingi hisob: ${date}`,
    recurringPaidPeriods: (n: number) => `To'langan davrlar: ${n} ta`,
    recurringInvoiceNo: (no: number) => `Davriy to'lov${no ? ` #${no}` : ""}`,
    recurringHistory: (n: number) => `To'lov tarixi (${n})`,

    prepayTitle: "Oldindan to'lash",
    prepayHint: (date: string) => `Keyingi davr ${date} da boshlanadi — xohlasangiz hoziroq yopib qo'ysangiz bo'ladi.`,
    prepayButton: (period: string, usd: number) => `Keyingi ${period} to'lovni to'lash · $${usd}`,
    prepayLoading: "Tayyorlanmoqda…",
    payErrPhone: "Telefon raqamini to'liq kiriting: +998 va 9 ta raqam",

    // Chek
    receiptButton: "Chek",
    receiptTitle: "Soliq cheki",
    receiptNewWindow: "Yangi oynada ↗",

    // Amaliyotlar
    activityEmpty: "Hali amaliyotlar yo'q.",
    activityYou: "Siz",
    activityUs: "UMD GROUP",

    // Tablar
    tabInfo: "Ma'lumot",
    tabPayment: "To'lov",
    tabActivity: "Amaliyotlar tarixi",
  },

  // ——— Ilova bo'limlari (panel) ———
  sections: {
    renewalCta: "Obunani uzaytirish (+9 oy)",
    renewalTitle: "Obunani uzaytirish (+9 oy)",
    renewalDone: "To'lov tasdiqlandi. Obuna muddati tez orada uzaytiriladi.",

    pushCta: "Push sertifikat olish",
    pushTitle: "Push sertifikat",
    pushDone: "To'lov tasdiqlandi. Sertifikat tayyorlanib, Telegram orqali yuboriladi.",

    rejectedApp: "Ariza rad etildi",
    cancelledApp: "Ariza bekor qilindi",
    stage: (current: number, total: number) => `Bosqich ${current}/${total}`,

    subPeriod: "Obuna muddati",
    subExpired: "Muddati tugagan",
    subLeft: (pct: number, days: number) => `${pct}% · ${days} kun qoldi`,
    subRenewed: (n: number) => ` · ${n}× uzaytirilgan`,

    transferDone: "Transfer yakunlandi",
    transferCta: "Transferga so'rov yuborish",
    transferTitle: "Transfer so'rovi",

    updateCtaFree: "Update chiqarish (paketdan, bepul)",
    updateCta: "Update chiqarish",
    updateTitle: "Update so'rovi",
    updateHintIos:
      "Yangi kodni **GitHub** repozitoriyangizga **push** qiling — jamoamiz App Store'ga yuklaydi.",
    updateHintAndroid: (handle: string) =>
      `Yangi **.aab** faylni Telegram **${handle}** ga yuboring.`,

    pkgActive: "Update paketi faol",
    pkgDaysLeft: (days: number) => `${days} kun qoldi`,
    pkgUsed: "Ishlatilgan updatelar",
    pkgNote:
      "Paket amal qilar ekan, updatelar bepul chiqariladi. Kvota yoki muddat tugasa — yangi paket olishingiz mumkin.",
    pkgExpiredTitle: "Update paketi tugadi — yangilash",
    pkgTitle: "Update paketi",
    pkgSub: (quota: number) => `1 oy · ${quota} ta update bepul`,
    pkgBuyNote: (quota: number, price: string) =>
      `Paket faollashgach, **1 oy** davomida **${quota} tagacha** update qo'shimcha to'lovsiz chiqariladi. Har bir alohida update ${price} bo'ladi.`,
    pkgPayLabel: "Update paketi",

    customDefaultTitle: "Qo'shimcha to'lov",
  },

  // ——— Ilova tafsilot sahifasi ———
  appDetail: {
    meta: "Ilova — UMD GROUP",
    backToPanel: "Kabinet",

    cardRecurring: "Davriy to'lov",
    cardCustomInvoices: "Qo'shimcha hisob-fakturalar",
    cardRestoreSub: "Obunani tiklash",
    cardActions: "Amallar",
    cardAppInfo: "Ilova ma'lumotlari",
    cardRequests: "So'rovlar",
    cardInStore: "Store'da",
    cardReview: "Xizmatni baholash",
    cardInvoices: "Hisob-fakturalar",
    cardPaymentHistory: "To'lovlar tarixi",

    subStartsAfter: "Obuna ilova chiqarilgach boshlanadi (9 oy)",
    groupGeneral: "Umumiy",
    groupContact: "Aloqa",
    groupSubmission: "Yuborilgan ma'lumotlar",
    noExtraInfo: "Qo'shimcha ma'lumot yo'q.",

    publishedOn: "Chiqarilgan sana:",
    storeLink: "Store havolasi ↗",

    reviewPublished: "E'lon qilingan",
    reviewPending: "Tekshiruvda",
    reviewPrompt: "Xizmatimiz haqidagi fikringiz biz uchun muhim.",

    noPaymentsYet: "Hozircha to'lov amali yo'q.",
    payConfirmed: "Tasdiqlangan",
    payRejected: "Rad etilgan",
    payPending: "Kutilmoqda",
    payUzsSuffix: (uzs: string) => ` · ~${uzs} so'm`,

    invoiceAdvance: "Avans",
    invoicePayment: "To'lov",
    invoiceFinal: "Yakuniy",

    // Umumiy ma'lumot qatorlari
    rowAppName: "Ilova nomi",
    rowServiceType: "Xizmat turi",
    rowStatus: "Holati",
    rowSubmittedAt: "Yuborilgan sana",
    rowPublishedAt: "Store'ga chiqarilgan",
    rowPublishedPrice: "Chiqarilgan narx",
    rowTaxPhone: "Soliq cheki telefoni",
    rowSubStart: "Obuna boshlangan",
    rowSubEnd: "Obuna tugashi",
    rowSubStatus: "Obuna holati",
    rowSubActive: "Faol",
    rowSubInactive: "Faol emas",
    rowRenewed: "Uzaytirilgan",
    rowRenewedTimes: (n: number) => `${n} marta`,
    rowTransferredAt: "Transfer qilingan",
    rowFullName: "To'liq ism",
    rowPhone: "Telefon",
    rowEmail: "Email",
  },

  // ——— Forma maydonlari yorliqlari (tafsilotda ko'rsatiladi) ———
  fieldLabels: {
    fullName: "To'liq ism",
    phone: "Telefon",
    email: "Email",
    telegram: "Telegram",
    appName: "Ilova nomi",
    packageName: "Package name",
    shortDescription: "Qisqa tavsif",
    fullDescription: "To'liq tavsif",
    privacyPolicyUrl: "Privacy Policy",
    subtitle: "Subtitle",
    supportUrl: "Support URL",
    githubRepoUrl: "GitHub repo",
    githubUsername: "GitHub username",
    bundleId: "Bundle ID",
    certificatePassword: "Sertifikat paroli",
    keystorePassword: "Keystore paroli",
    keyAlias: "Key alias",
    keyPassword: "Key paroli",
    testLogin: "Test login",
    testPassword: "Test parol",
    note: "Izoh",
    developerAccountId: "Developer Account ID",
    googlePaymentsProfileId: "Payments Profile ID",
    transactionId: "Transaction ID",
    appStoreConnectTeamId: "App Store Connect Team ID",
    appleDevAccountEmail: "Apple Dev akkaunt email",
    releaseNotes: "Relizdagi o'zgarishlar",
    months: "Muddat (oy)",
    platform: "Platforma",
    accountType: "Akkaunt turi",
    login: "Akkaunt login",
    loginPassword: "Akkaunt paroli",
    holderName: "Akkaunt egasi (F.I.O.)",
    holderPhone: "Telefon",
    country: "Mamlakat",
    companyName: "Yuridik kompaniya nomi",
    legalAddress: "Yuridik manzil",
    companyPhone: "Kompaniya telefoni",
    companyEmail: "Kompaniya email",
    website: "Veb-sayt",
    companyType: "Kompaniya turi",
    activityType: "Faoliyat turi",
    cpName: "Kontakt/Signatory F.I.O.",
    cpPosition: "Lavozim",
    cpPhone: "Kontakt telefon",
    cpEmail: "Kontakt email",
  },

  // ——— To'lov turlari ———
  paymentKind: {
    advance: "Avans (oldindan)",
    final: "Qolgan to'lov",
    full: "To'liq to'lov",
    transfer: "Transfer to'lovi",
    update: "Update to'lovi",
    renewal: "Obuna uzaytirish",
    push_certificate: "Push sertifikat",
    update_package: "Update paketi",
    custom: "Qo'shimcha to'lov",
  },

  // ——— So'rov sahifalari va formalari ———
  requestPage: {
    backToPanel: "Kabinetga qaytish",
    backToApp: "Ilovaga qaytish",
    submit: "So'rov yuborish",
    accepted: "So'rov qabul qilindi!",
    priceLabel: (usd: number) => `Narx: $${usd}`,
    priceUzs: (uzs: string, rate: string | null) =>
      ` (~${uzs} so'm${rate ? `, 1$=${rate}` : ""})`,
    discountApplied: (pct: number) => `🎉 Chegirma qo'llandi: −${pct}%`,
    noteOptional: "Izoh (ixtiyoriy)",

    transferMeta: "Transfer so'rovi — UMD GROUP",
    transferTitle: "Transferga so'rov",
    transferHeading: (appName: string) => `${appName} — Transfer`,
    transferSub: (store: string) =>
      `Ilovani UMD GROUP akkauntidan sizning ${store} akkauntingizga o'tkazish — shundan so'ng ilova to'liq sizniki bo'ladi.`,
    transferErrGoogle: "Developer Account ID va Transaction ID majburiy",
    transferErrRequired: "Majburiy maydonni to'ldiring",
    devAccountId: "Developer Account ID",
    devAccountIdHint: "Sizning akkauntingiz: Play Console → Settings → Developer account → Account details",
    txInfo:
      "ℹ️ **Transaction ID**: ilovani qabul qiluvchi — ya'ni **sizning akkauntingiz** Google'ga **$25** to'lagandan so'ng kelgan **email xabaridan** yoki **Google profil → Payment history** dan topasiz.",
    transactionId: "Transaction ID",
    transactionIdHint: "$25 to'lovdan keyingi email yoki Payment history",
    teamId: "App Store Connect Team ID (sizning akkauntingiz)",
    appleEmail: "Apple Developer akkaunt email (sizniki)",

    renewalMeta: "Obunani uzaytirish — UMD GROUP",
    renewalTitle: "Obunani uzaytirish",
    renewalHeading: (appName: string) => `${appName} — obunani uzaytirish`,
    renewalSub: "Obuna muddati **+9 oy (270 kun)** ga uzaytiriladi.",
    renewalCurrentEnd: (date: string) => `Joriy tugash sanasi: ${date}`,
    renewalDoneText:
      "Admin so'rovni ko'rib chiqib, to'lov uchun taqdim etadi. To'lovdan so'ng obuna muddati **+9 oyga** uzaytiriladi.",
    backToAppCta: "Ilovaga qaytish",

    pushMeta: "Push sertifikat — UMD GROUP",
    pushTitle: "Push sertifikat",
    pushHeading: (appName: string) => `${appName} — Push sertifikat`,
    pushSub:
      "Apple push notification (APNs) sertifikatini tayyorlab beramiz. To'lov tasdiqlangach sertifikat Telegram orqali sizga yuboriladi.",

    updateMeta: "Update chiqarish — UMD GROUP",
    updateTitle: "Update chiqarish",
    updateHeading: (appName: string) => `${appName} — Update chiqarish`,
    updateFree: "🎁 Update paketi ichida — bepul",
    releaseNotes: "Relizdagi o'zgarishlar",
    releaseNotesPlaceholder:
      "Ushbu yangilanishda nima o'zgardi? (yangi funksiyalar, tuzatishlar...)",
    releaseNotesErr: "Relizdagi o'zgarishlarni yozing",
    updateDoneAndroidTitle: "Endi yangi .aab faylni yuboring",
    updateDoneAndroidBody:
      "Ilovaning yangi **.aab** faylini Telegram orqali quyidagi akkauntga yuboring:",
    updateDoneIosTitle: "Endi yangi kodni push qiling",
    updateDoneIosBody:
      "Ilovaning yangi versiyasini **GitHub** repozitoriyangizga **push** qiling. Jamoamiz build qilib App Store'ga yuklaydi.",
  },
};
