// =============================================
// ORDER BUSINESS - i18n (Internationalization)
// 8 Dil Desteği + GPS Algılama + RTL
// =============================================

export type Language = 'tr' | 'en' | 'it' | 'de' | 'es' | 'ru' | 'ar' | 'fa';

export interface LanguageConfig {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
}

export const languages: LanguageConfig[] = [
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', rtl: false },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', rtl: false },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', rtl: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', rtl: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', rtl: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', rtl: true },
];

// Ülke koduna göre varsayılan dil eşleştirmesi
const countryToLanguage: Record<string, Language> = {
  // Türkçe
  TR: 'tr',
  // İngilizce
  US: 'en', GB: 'en', AU: 'en', CA: 'en', NZ: 'en', IE: 'en',
  // İtalyanca
  IT: 'it', SM: 'it', VA: 'it',
  // Almanca
  DE: 'de', AT: 'de', CH: 'de', LI: 'de',
  // İspanyolca
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es',
  // Rusça
  RU: 'ru', BY: 'ru', KZ: 'ru', KG: 'ru',
  // Arapça
  SA: 'ar', AE: 'ar', EG: 'ar', JO: 'ar', LB: 'ar', KW: 'ar', QA: 'ar', BH: 'ar', OM: 'ar',
  // Farsça
  IR: 'fa', AF: 'fa', TJ: 'fa',
};

// GPS/IP'den konum bazlı dil algılama
export async function detectLanguageFromLocation(): Promise<Language> {
  try {
    const response = await fetch('https://ipapi.co/json/', { 
      signal: AbortSignal.timeout(3000) // 3 saniye timeout
    });
    const data = await response.json();
    const countryCode = data.country_code?.toUpperCase();
    return countryToLanguage[countryCode] || 'en';
  } catch {
    // Hata durumunda tarayıcı diline bak
    return detectBrowserLanguage();
  }
}

// Tarayıcı dilinden algılama
export function detectBrowserLanguage(): Language {
  if (typeof navigator === 'undefined') return 'en';
  
  const browserLang = navigator.language?.split('-')[0]?.toLowerCase();
  const supported = languages.find(l => l.code === browserLang);
  return supported?.code || 'en';
}

// localStorage'dan dil al
export function getSavedLanguage(): Language | null {
  if (typeof localStorage === 'undefined') return null;
  const saved = localStorage.getItem('order-business-language');
  if (saved && languages.some(l => l.code === saved)) {
    return saved as Language;
  }
  return null;
}

// localStorage'a dil kaydet
export function saveLanguage(lang: Language): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('order-business-language', lang);
  }
}

// Dil config'ini al
export function getLanguageConfig(lang: Language): LanguageConfig {
  return languages.find(l => l.code === lang) || languages[1]; // default: English
}

// RTL kontrolü
export function isRTL(lang: Language): boolean {
  return lang === 'ar' || lang === 'fa';
}

// =============================================
// ÇEVİRİLER
// =============================================

export const translations: Record<Language, {
  common: Record<string, string>;
  login: Record<string, string>;
  roles: Record<string, string>;
  owner: Record<string, string>;
  staff: Record<string, string>;
  errors: Record<string, string>;
}> = {
  // 🇹🇷 TÜRKÇE
  tr: {
    common: {
      language: 'Dil',
      settings: 'Ayarlar',
      back: 'Geri',
      next: 'İleri',
      submit: 'Gönder',
      cancel: 'İptal',
      save: 'Kaydet',
      loading: 'Yükleniyor...',
      or: 'veya',
    },
    login: {
      title: 'ORDER Business',
      subtitle: 'Restoran Yönetim Sistemi',
      ownerTitle: 'İşletme Sahibi',
      ownerDesc: 'İşletmenizi yönetin, personel ekleyin',
      staffTitle: 'Personel Girişi',
      staffDesc: 'PIN kodunuzla giriş yapın',
      ownerLogin: 'Giriş Yap',
      ownerRegister: 'Yeni Kayıt',
      staffLogin: 'PIN ile Giriş',
    },
    roles: {
      owner: 'Yönetici',
      manager: 'Müdür',
      cashier: 'Kasiyer',
      waiter: 'Garson',
      kitchen: 'Mutfak',
      reception: 'Resepsiyon',
    },
    owner: {
      loginTitle: 'İşletme Sahibi Girişi',
      registerTitle: 'Yeni İşletme Kaydı',
      email: 'E-posta',
      password: 'Şifre',
      confirmPassword: 'Şifre Tekrar',
      phone: 'Telefon',
      venueName: 'İşletme Adı',
      venueType: 'İşletme Türü',
      city: 'Şehir',
      address: 'Adres',
      loginButton: 'Giriş Yap',
      registerButton: 'Kayıt Ol',
      hasAccount: 'Zaten hesabınız var mı?',
      noAccount: 'Hesabınız yok mu?',
      forgotPassword: 'Şifremi Unuttum',
    },
    staff: {
      title: 'Personel Girişi',
      enterCode: 'İşletme Kodunu Girin',
      codePlaceholder: 'Örn: ORD-A3X9',
      scanQR: 'QR Kod Tara',
      selectStaff: 'Personel Seçin',
      enterPin: 'PIN Kodunuzu Girin',
      noStaff: 'Henüz personel kaydı yok',
      wrongCode: 'Geçersiz işletme kodu',
      wrongPin: 'Yanlış PIN kodu',
    },
    errors: {
      required: 'Bu alan zorunludur',
      invalidEmail: 'Geçersiz e-posta adresi',
      passwordMin: 'Şifre en az 6 karakter olmalı',
      passwordMatch: 'Şifreler eşleşmiyor',
      networkError: 'Bağlantı hatası',
      unknownError: 'Bir hata oluştu',
    },
  },

  // 🇬🇧 ENGLISH
  en: {
    common: {
      language: 'Language',
      settings: 'Settings',
      back: 'Back',
      next: 'Next',
      submit: 'Submit',
      cancel: 'Cancel',
      save: 'Save',
      loading: 'Loading...',
      or: 'or',
    },
    login: {
      title: 'ORDER Business',
      subtitle: 'Restaurant Management System',
      ownerTitle: 'Business Owner',
      ownerDesc: 'Manage your business, add staff',
      staffTitle: 'Staff Login',
      staffDesc: 'Login with your PIN code',
      ownerLogin: 'Login',
      ownerRegister: 'Register',
      staffLogin: 'Login with PIN',
    },
    roles: {
      owner: 'Owner',
      manager: 'Manager',
      cashier: 'Cashier',
      waiter: 'Waiter',
      kitchen: 'Kitchen',
      reception: 'Reception',
    },
    owner: {
      loginTitle: 'Business Owner Login',
      registerTitle: 'New Business Registration',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      phone: 'Phone',
      venueName: 'Business Name',
      venueType: 'Business Type',
      city: 'City',
      address: 'Address',
      loginButton: 'Login',
      registerButton: 'Register',
      hasAccount: 'Already have an account?',
      noAccount: "Don't have an account?",
      forgotPassword: 'Forgot Password',
    },
    staff: {
      title: 'Staff Login',
      enterCode: 'Enter Business Code',
      codePlaceholder: 'e.g. ORD-A3X9',
      scanQR: 'Scan QR Code',
      selectStaff: 'Select Staff',
      enterPin: 'Enter Your PIN',
      noStaff: 'No staff registered yet',
      wrongCode: 'Invalid business code',
      wrongPin: 'Wrong PIN code',
    },
    errors: {
      required: 'This field is required',
      invalidEmail: 'Invalid email address',
      passwordMin: 'Password must be at least 6 characters',
      passwordMatch: 'Passwords do not match',
      networkError: 'Connection error',
      unknownError: 'An error occurred',
    },
  },

  // 🇮🇹 ITALIANO
  it: {
    common: {
      language: 'Lingua',
      settings: 'Impostazioni',
      back: 'Indietro',
      next: 'Avanti',
      submit: 'Invia',
      cancel: 'Annulla',
      save: 'Salva',
      loading: 'Caricamento...',
      or: 'o',
    },
    login: {
      title: 'ORDER Business',
      subtitle: 'Sistema di Gestione Ristorante',
      ownerTitle: 'Proprietario',
      ownerDesc: 'Gestisci la tua attività, aggiungi personale',
      staffTitle: 'Accesso Personale',
      staffDesc: 'Accedi con il tuo PIN',
      ownerLogin: 'Accedi',
      ownerRegister: 'Registrati',
      staffLogin: 'Accedi con PIN',
    },
    roles: {
      owner: 'Proprietario',
      manager: 'Manager',
      cashier: 'Cassiere',
      waiter: 'Cameriere',
      kitchen: 'Cucina',
      reception: 'Reception',
    },
    owner: {
      loginTitle: 'Accesso Proprietario',
      registerTitle: 'Nuova Registrazione Attività',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Conferma Password',
      phone: 'Telefono',
      venueName: 'Nome Attività',
      venueType: 'Tipo Attività',
      city: 'Città',
      address: 'Indirizzo',
      loginButton: 'Accedi',
      registerButton: 'Registrati',
      hasAccount: 'Hai già un account?',
      noAccount: 'Non hai un account?',
      forgotPassword: 'Password Dimenticata',
    },
    staff: {
      title: 'Accesso Personale',
      enterCode: 'Inserisci Codice Attività',
      codePlaceholder: 'Es: ORD-A3X9',
      scanQR: 'Scansiona QR',
      selectStaff: 'Seleziona Personale',
      enterPin: 'Inserisci il tuo PIN',
      noStaff: 'Nessun personale registrato',
      wrongCode: 'Codice attività non valido',
      wrongPin: 'PIN errato',
    },
    errors: {
      required: 'Campo obbligatorio',
      invalidEmail: 'Email non valida',
      passwordMin: 'La password deve avere almeno 6 caratteri',
      passwordMatch: 'Le password non corrispondono',
      networkError: 'Errore di connessione',
      unknownError: 'Si è verificato un errore',
    },
  },

  // 🇩🇪 DEUTSCH
  de: {
    common: {
      language: 'Sprache',
      settings: 'Einstellungen',
      back: 'Zurück',
      next: 'Weiter',
      submit: 'Absenden',
      cancel: 'Abbrechen',
      save: 'Speichern',
      loading: 'Laden...',
      or: 'oder',
    },
    login: {
      title: 'ORDER Business',
      subtitle: 'Restaurant-Management-System',
      ownerTitle: 'Geschäftsinhaber',
      ownerDesc: 'Verwalten Sie Ihr Geschäft, fügen Sie Personal hinzu',
      staffTitle: 'Personal-Login',
      staffDesc: 'Melden Sie sich mit Ihrer PIN an',
      ownerLogin: 'Anmelden',
      ownerRegister: 'Registrieren',
      staffLogin: 'Mit PIN anmelden',
    },
    roles: {
      owner: 'Inhaber',
      manager: 'Manager',
      cashier: 'Kassierer',
      waiter: 'Kellner',
      kitchen: 'Küche',
      reception: 'Empfang',
    },
    owner: {
      loginTitle: 'Inhaber-Login',
      registerTitle: 'Neue Geschäftsregistrierung',
      email: 'E-Mail',
      password: 'Passwort',
      confirmPassword: 'Passwort bestätigen',
      phone: 'Telefon',
      venueName: 'Geschäftsname',
      venueType: 'Geschäftstyp',
      city: 'Stadt',
      address: 'Adresse',
      loginButton: 'Anmelden',
      registerButton: 'Registrieren',
      hasAccount: 'Haben Sie bereits ein Konto?',
      noAccount: 'Kein Konto?',
      forgotPassword: 'Passwort vergessen',
    },
    staff: {
      title: 'Personal-Login',
      enterCode: 'Geschäftscode eingeben',
      codePlaceholder: 'z.B. ORD-A3X9',
      scanQR: 'QR-Code scannen',
      selectStaff: 'Personal auswählen',
      enterPin: 'PIN eingeben',
      noStaff: 'Noch kein Personal registriert',
      wrongCode: 'Ungültiger Geschäftscode',
      wrongPin: 'Falsche PIN',
    },
    errors: {
      required: 'Pflichtfeld',
      invalidEmail: 'Ungültige E-Mail-Adresse',
      passwordMin: 'Passwort muss mindestens 6 Zeichen haben',
      passwordMatch: 'Passwörter stimmen nicht überein',
      networkError: 'Verbindungsfehler',
      unknownError: 'Ein Fehler ist aufgetreten',
    },
  },

  // 🇪🇸 ESPAÑOL
  es: {
    common: {
      language: 'Idioma',
      settings: 'Configuración',
      back: 'Volver',
      next: 'Siguiente',
      submit: 'Enviar',
      cancel: 'Cancelar',
      save: 'Guardar',
      loading: 'Cargando...',
      or: 'o',
    },
    login: {
      title: 'ORDER Business',
      subtitle: 'Sistema de Gestión de Restaurantes',
      ownerTitle: 'Propietario',
      ownerDesc: 'Administre su negocio, agregue personal',
      staffTitle: 'Acceso Personal',
      staffDesc: 'Ingrese con su PIN',
      ownerLogin: 'Iniciar Sesión',
      ownerRegister: 'Registrarse',
      staffLogin: 'Acceder con PIN',
    },
    roles: {
      owner: 'Propietario',
      manager: 'Gerente',
      cashier: 'Cajero',
      waiter: 'Mesero',
      kitchen: 'Cocina',
      reception: 'Recepción',
    },
    owner: {
      loginTitle: 'Acceso Propietario',
      registerTitle: 'Registro de Nuevo Negocio',
      email: 'Correo electrónico',
      password: 'Contraseña',
      confirmPassword: 'Confirmar Contraseña',
      phone: 'Teléfono',
      venueName: 'Nombre del Negocio',
      venueType: 'Tipo de Negocio',
      city: 'Ciudad',
      address: 'Dirección',
      loginButton: 'Iniciar Sesión',
      registerButton: 'Registrarse',
      hasAccount: '¿Ya tiene una cuenta?',
      noAccount: '¿No tiene cuenta?',
      forgotPassword: 'Olvidé mi Contraseña',
    },
    staff: {
      title: 'Acceso Personal',
      enterCode: 'Ingrese Código del Negocio',
      codePlaceholder: 'Ej: ORD-A3X9',
      scanQR: 'Escanear QR',
      selectStaff: 'Seleccionar Personal',
      enterPin: 'Ingrese su PIN',
      noStaff: 'No hay personal registrado',
      wrongCode: 'Código de negocio inválido',
      wrongPin: 'PIN incorrecto',
    },
    errors: {
      required: 'Campo requerido',
      invalidEmail: 'Correo electrónico inválido',
      passwordMin: 'La contraseña debe tener al menos 6 caracteres',
      passwordMatch: 'Las contraseñas no coinciden',
      networkError: 'Error de conexión',
      unknownError: 'Ocurrió un error',
    },
  },

  // 🇷🇺 РУССКИЙ
  ru: {
    common: {
      language: 'Язык',
      settings: 'Настройки',
      back: 'Назад',
      next: 'Далее',
      submit: 'Отправить',
      cancel: 'Отмена',
      save: 'Сохранить',
      loading: 'Загрузка...',
      or: 'или',
    },
    login: {
      title: 'ORDER Business',
      subtitle: 'Система Управления Рестораном',
      ownerTitle: 'Владелец',
      ownerDesc: 'Управляйте бизнесом, добавляйте персонал',
      staffTitle: 'Вход Персонала',
      staffDesc: 'Войдите с PIN-кодом',
      ownerLogin: 'Войти',
      ownerRegister: 'Регистрация',
      staffLogin: 'Войти с PIN',
    },
    roles: {
      owner: 'Владелец',
      manager: 'Менеджер',
      cashier: 'Кассир',
      waiter: 'Официант',
      kitchen: 'Кухня',
      reception: 'Ресепшн',
    },
    owner: {
      loginTitle: 'Вход Владельца',
      registerTitle: 'Регистрация Нового Бизнеса',
      email: 'Эл. почта',
      password: 'Пароль',
      confirmPassword: 'Подтвердите Пароль',
      phone: 'Телефон',
      venueName: 'Название Бизнеса',
      venueType: 'Тип Бизнеса',
      city: 'Город',
      address: 'Адрес',
      loginButton: 'Войти',
      registerButton: 'Зарегистрироваться',
      hasAccount: 'Уже есть аккаунт?',
      noAccount: 'Нет аккаунта?',
      forgotPassword: 'Забыли Пароль',
    },
    staff: {
      title: 'Вход Персонала',
      enterCode: 'Введите Код Бизнеса',
      codePlaceholder: 'Напр: ORD-A3X9',
      scanQR: 'Сканировать QR',
      selectStaff: 'Выберите Сотрудника',
      enterPin: 'Введите PIN',
      noStaff: 'Персонал не зарегистрирован',
      wrongCode: 'Неверный код бизнеса',
      wrongPin: 'Неверный PIN',
    },
    errors: {
      required: 'Обязательное поле',
      invalidEmail: 'Неверный адрес эл. почты',
      passwordMin: 'Пароль должен содержать минимум 6 символов',
      passwordMatch: 'Пароли не совпадают',
      networkError: 'Ошибка соединения',
      unknownError: 'Произошла ошибка',
    },
  },

  // 🇸🇦 العربية (RTL)
  ar: {
    common: {
      language: 'اللغة',
      settings: 'الإعدادات',
      back: 'رجوع',
      next: 'التالي',
      submit: 'إرسال',
      cancel: 'إلغاء',
      save: 'حفظ',
      loading: 'جار التحميل...',
      or: 'أو',
    },
    login: {
      title: 'ORDER Business',
      subtitle: 'نظام إدارة المطاعم',
      ownerTitle: 'صاحب العمل',
      ownerDesc: 'أدر عملك، أضف الموظفين',
      staffTitle: 'دخول الموظفين',
      staffDesc: 'سجل الدخول برمز PIN',
      ownerLogin: 'تسجيل الدخول',
      ownerRegister: 'تسجيل جديد',
      staffLogin: 'الدخول برمز PIN',
    },
    roles: {
      owner: 'المالك',
      manager: 'المدير',
      cashier: 'أمين الصندوق',
      waiter: 'نادل',
      kitchen: 'المطبخ',
      reception: 'الاستقبال',
    },
    owner: {
      loginTitle: 'دخول صاحب العمل',
      registerTitle: 'تسجيل عمل جديد',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      confirmPassword: 'تأكيد كلمة المرور',
      phone: 'الهاتف',
      venueName: 'اسم العمل',
      venueType: 'نوع العمل',
      city: 'المدينة',
      address: 'العنوان',
      loginButton: 'تسجيل الدخول',
      registerButton: 'تسجيل',
      hasAccount: 'لديك حساب بالفعل؟',
      noAccount: 'ليس لديك حساب؟',
      forgotPassword: 'نسيت كلمة المرور',
    },
    staff: {
      title: 'دخول الموظفين',
      enterCode: 'أدخل رمز العمل',
      codePlaceholder: 'مثال: ORD-A3X9',
      scanQR: 'مسح QR',
      selectStaff: 'اختر الموظف',
      enterPin: 'أدخل رمز PIN',
      noStaff: 'لا يوجد موظفين مسجلين',
      wrongCode: 'رمز العمل غير صالح',
      wrongPin: 'رمز PIN خاطئ',
    },
    errors: {
      required: 'هذا الحقل مطلوب',
      invalidEmail: 'بريد إلكتروني غير صالح',
      passwordMin: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل',
      passwordMatch: 'كلمات المرور غير متطابقة',
      networkError: 'خطأ في الاتصال',
      unknownError: 'حدث خطأ',
    },
  },

  // 🇮🇷 فارسی (RTL)
  fa: {
    common: {
      language: 'زبان',
      settings: 'تنظیمات',
      back: 'بازگشت',
      next: 'بعدی',
      submit: 'ارسال',
      cancel: 'لغو',
      save: 'ذخیره',
      loading: 'در حال بارگذاری...',
      or: 'یا',
    },
    login: {
      title: 'ORDER Business',
      subtitle: 'سیستم مدیریت رستوران',
      ownerTitle: 'صاحب کسب‌وکار',
      ownerDesc: 'کسب‌وکار خود را مدیریت کنید، کارمند اضافه کنید',
      staffTitle: 'ورود کارکنان',
      staffDesc: 'با کد PIN وارد شوید',
      ownerLogin: 'ورود',
      ownerRegister: 'ثبت‌نام',
      staffLogin: 'ورود با PIN',
    },
    roles: {
      owner: 'مالک',
      manager: 'مدیر',
      cashier: 'صندوقدار',
      waiter: 'پیشخدمت',
      kitchen: 'آشپزخانه',
      reception: 'پذیرش',
    },
    owner: {
      loginTitle: 'ورود صاحب کسب‌وکار',
      registerTitle: 'ثبت کسب‌وکار جدید',
      email: 'ایمیل',
      password: 'رمز عبور',
      confirmPassword: 'تأیید رمز عبور',
      phone: 'تلفن',
      venueName: 'نام کسب‌وکار',
      venueType: 'نوع کسب‌وکار',
      city: 'شهر',
      address: 'آدرس',
      loginButton: 'ورود',
      registerButton: 'ثبت‌نام',
      hasAccount: 'حساب کاربری دارید؟',
      noAccount: 'حساب کاربری ندارید؟',
      forgotPassword: 'رمز عبور را فراموش کردم',
    },
    staff: {
      title: 'ورود کارکنان',
      enterCode: 'کد کسب‌وکار را وارد کنید',
      codePlaceholder: 'مثال: ORD-A3X9',
      scanQR: 'اسکن QR',
      selectStaff: 'کارمند را انتخاب کنید',
      enterPin: 'PIN خود را وارد کنید',
      noStaff: 'کارمندی ثبت نشده',
      wrongCode: 'کد کسب‌وکار نامعتبر',
      wrongPin: 'PIN اشتباه',
    },
    errors: {
      required: 'این فیلد الزامی است',
      invalidEmail: 'ایمیل نامعتبر',
      passwordMin: 'رمز عبور باید حداقل 6 کاراکتر باشد',
      passwordMatch: 'رمزهای عبور مطابقت ندارند',
      networkError: 'خطای اتصال',
      unknownError: 'خطایی رخ داد',
    },
  },
};

// Çeviri al
export function getTranslation(lang: Language) {
  return translations[lang] || translations.en;
}

// Hook için helper
export function useTranslation(lang: Language) {
  const t = getTranslation(lang);
  const config = getLanguageConfig(lang);
  const rtl = isRTL(lang);
  
  return { t, config, rtl, dir: rtl ? 'rtl' : 'ltr' };
}
