import { useApp } from '@/state/AppContext';

export type Lang = 'en' | 'hi' | 'te';

export const LANGUAGES: { id: Lang; label: string; native: string }[] = [
  { id: 'en', label: 'English', native: 'English' },
  { id: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { id: 'te', label: 'Telugu', native: 'తెలుగు' },
];

const en = {
  'tab.home': 'Home',
  'tab.catalog': 'Catalog',
  'tab.scan': 'Scan',
  'tab.orders': 'Orders',
  'tab.account': 'Account',
  'login.title': 'Welcome back',
  'login.subtitle': 'Sign in to your business account',
  'login.email': 'Business email',
  'login.password': 'Password',
  'login.remember': 'Remember me',
  'login.forgot': 'Forgot password?',
  'login.submit': 'Sign in',
  'login.biometric': 'Sign in with biometrics',
  'login.noAccount': 'New to StockPilot?',
  'login.register': 'Request access',
  'otp.title': 'Verify it’s you',
  'otp.verify': 'Verify & continue',
  'home.greeting': 'Good day',
  'home.credit': 'Available credit',
  'home.quick': 'Quick actions',
  'home.deals': 'Deals of the day',
  'home.recent': 'Recent orders',
  'home.viewAll': 'View all',
  'common.add': 'ADD',
  'common.addToCart': 'Add to cart',
  'common.buyNow': 'Buy now',
  'common.checkout': 'Proceed to checkout',
  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',
  'common.save': 'Save',
  'common.retry': 'Retry',
  'common.search': 'Search products, brands, SKU…',
  'settings.title': 'Settings',
  'settings.appearance': 'Appearance',
  'settings.language': 'Language',
  'settings.notifications': 'Notifications',
  'settings.security': 'Security',
  'account.logout': 'Log out',
};

type Dict = typeof en;
type Key = keyof Dict;

const hi: Partial<Dict> = {
  'tab.home': 'होम',
  'tab.catalog': 'कैटलॉग',
  'tab.scan': 'स्कैन',
  'tab.orders': 'ऑर्डर',
  'tab.account': 'खाता',
  'login.title': 'वापसी पर स्वागत है',
  'login.subtitle': 'अपने व्यापार खाते में साइन इन करें',
  'login.email': 'व्यापार ईमेल',
  'login.password': 'पासवर्ड',
  'login.remember': 'मुझे याद रखें',
  'login.forgot': 'पासवर्ड भूल गए?',
  'login.submit': 'साइन इन',
  'login.biometric': 'बायोमेट्रिक से साइन इन',
  'login.noAccount': 'StockPilot पर नए हैं?',
  'login.register': 'एक्सेस का अनुरोध करें',
  'otp.title': 'पुष्टि करें कि यह आप हैं',
  'otp.verify': 'सत्यापित करें',
  'home.greeting': 'नमस्ते',
  'home.credit': 'उपलब्ध क्रेडिट',
  'home.quick': 'त्वरित कार्य',
  'home.deals': 'आज के सौदे',
  'home.recent': 'हाल के ऑर्डर',
  'home.viewAll': 'सभी देखें',
  'common.add': 'जोड़ें',
  'common.addToCart': 'कार्ट में जोड़ें',
  'common.buyNow': 'अभी खरीदें',
  'common.checkout': 'चेकआउट करें',
  'common.cancel': 'रद्द करें',
  'common.confirm': 'पुष्टि करें',
  'common.save': 'सहेजें',
  'common.retry': 'फिर से कोशिश करें',
  'common.search': 'उत्पाद, ब्रांड, SKU खोजें…',
  'settings.title': 'सेटिंग्स',
  'settings.appearance': 'दिखावट',
  'settings.language': 'भाषा',
  'settings.notifications': 'सूचनाएँ',
  'settings.security': 'सुरक्षा',
  'account.logout': 'लॉग आउट',
};

const te: Partial<Dict> = {
  'tab.home': 'హోమ్',
  'tab.catalog': 'కేటలాగ్',
  'tab.scan': 'స్కాన్',
  'tab.orders': 'ఆర్డర్లు',
  'tab.account': 'ఖాతా',
  'login.title': 'తిరిగి స్వాగతం',
  'login.subtitle': 'మీ వ్యాపార ఖాతాలోకి సైన్ ఇన్ చేయండి',
  'login.email': 'వ్యాపార ఇమెయిల్',
  'login.password': 'పాస్‌వర్డ్',
  'login.remember': 'నన్ను గుర్తుంచుకో',
  'login.forgot': 'పాస్‌వర్డ్ మర్చిపోయారా?',
  'login.submit': 'సైన్ ఇన్',
  'login.biometric': 'బయోమెట్రిక్‌తో సైన్ ఇన్',
  'login.noAccount': 'StockPilot కి కొత్తవారా?',
  'login.register': 'యాక్సెస్ అభ్యర్థించండి',
  'otp.title': 'ఇది మీరేనని ధృవీకరించండి',
  'otp.verify': 'ధృవీకరించండి',
  'home.greeting': 'నమస్కారం',
  'home.credit': 'అందుబాటులో ఉన్న క్రెడిట్',
  'home.quick': 'త్వరిత చర్యలు',
  'home.deals': 'ఈరోజు ఆఫర్లు',
  'home.recent': 'ఇటీవలి ఆర్డర్లు',
  'home.viewAll': 'అన్నీ చూడండి',
  'common.add': 'చేర్చు',
  'common.addToCart': 'కార్ట్‌కు చేర్చండి',
  'common.buyNow': 'ఇప్పుడే కొనండి',
  'common.checkout': 'చెక్అవుట్ చేయండి',
  'common.cancel': 'రద్దు',
  'common.confirm': 'నిర్ధారించు',
  'common.save': 'సేవ్',
  'common.retry': 'మళ్ళీ ప్రయత్నించండి',
  'common.search': 'ఉత్పత్తులు, బ్రాండ్లు, SKU వెతకండి…',
  'settings.title': 'సెట్టింగ్‌లు',
  'settings.appearance': 'రూపం',
  'settings.language': 'భాష',
  'settings.notifications': 'నోటిఫికేషన్లు',
  'settings.security': 'భద్రత',
  'account.logout': 'లాగ్ అవుట్',
};

const DICTS: Record<Lang, Partial<Dict>> = { en, hi, te };

export function translate(lang: Lang, key: Key): string {
  return DICTS[lang][key] ?? en[key];
}

export function useT() {
  const { state } = useApp();
  return (key: Key) => translate(state.settings.language, key);
}
