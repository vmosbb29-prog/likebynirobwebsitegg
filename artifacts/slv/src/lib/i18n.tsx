import { createContext, useContext, useState, type ReactNode } from "react";

type Lang = "en" | "bn";

const translations = {
  en: {
    home: "Home", checkKey: "Check Key", like: "Like", visit: "Visit", priceList: "Price List",
    autoLike: "Auto Like", adminLogin: "Admin",
    heroTitle: "Free Fire Boost Platform",
    heroSub: "Send likes & profile visits to any Free Fire account instantly",
    enterKey: "Enter your access key", enterUid: "Enter UID", selectRegion: "Select Region",
    submit: "Submit", sendLike: "Send Like", sendVisit: "Send Visit",
    checkKeyBtn: "Check Key", validKey: "Valid Key", expiredKey: "Expired",
    notFound: "Key Not Found", expiresAt: "Expires", usedCount: "Used",
    likeUsed: "Like Used", visitUsed: "Visit Used", success: "Success!", error: "Error",
    loading: "Processing…", maintenance: "Under Maintenance",
    support: "Support", channel: "Channel", group: "Group", contact: "Contact",
    currency: "Price", priceListTitle: "Price List", likeTitle: "Like Service", visitTitle: "Visit Service",
    password: "Password", login: "Login", adminDashboard: "Admin Dashboard", logout: "Logout",
    keys: "Keys", logs: "Activity Logs", settings: "Settings", stats: "Statistics",
    totalKeys: "Total Keys", activeKeys: "Active Keys", totalLikes: "Total Likes",
    totalVisits: "Total Visits", onlineUsers: "Online Users", bannedIps: "Banned IPs",
    createKey: "Create Key", deleteKey: "Delete", validityDays: "Validity (days)",
    useLimit: "Use Limit", unlimited: "Unlimited", customKey: "Custom Key (optional)",
    likeEnabled: "Like Enabled", visitEnabled: "Visit Enabled",
    likeApiUrl: "Like API URL", visitApiUrl: "Visit API URL",
    telegramBotToken: "Telegram Bot Token", telegramChatId: "Telegram Chat ID",
    testTelegram: "Test Telegram", saveSettings: "Save Settings",
    changePassword: "Change Password", oldPassword: "Old Password", newPassword: "New Password",
    banIp: "Ban IP", unban: "Unban",
    regions: {
      IND: "India", BD: "Bangladesh", PK: "Pakistan", SG: "Singapore", TH: "Thailand",
      VN: "Vietnam", ID: "Indonesia", MY: "Malaysia", BR: "Brazil", US: "United States",
      EU: "Europe", ME: "Middle East",
    },
  },
  bn: {
    home: "হোম", checkKey: "কী চেক", like: "লাইক", visit: "ভিজিট", priceList: "মূল্য তালিকা",
    autoLike: "অটো লাইক", adminLogin: "অ্যাডমিন",
    heroTitle: "ফ্রি ফায়ার বুস্ট প্ল্যাটফর্ম",
    heroSub: "যেকোনো ফ্রি ফায়ার অ্যাকাউন্টে তাৎক্ষণিক লাইক ও ভিজিট পাঠান",
    enterKey: "অ্যাক্সেস কী দিন", enterUid: "UID দিন", selectRegion: "রিজিয়ন নির্বাচন করুন",
    submit: "জমা দিন", sendLike: "লাইক পাঠান", sendVisit: "ভিজিট পাঠান",
    checkKeyBtn: "কী চেক করুন", validKey: "বৈধ কী", expiredKey: "মেয়াদ শেষ",
    notFound: "কী পাওয়া যায়নি", expiresAt: "মেয়াদ শেষ", usedCount: "ব্যবহার",
    likeUsed: "লাইক ব্যবহৃত", visitUsed: "ভিজিট ব্যবহৃত", success: "সফল!", error: "ত্রুটি",
    loading: "প্রক্রিয়া চলছে…", maintenance: "রক্ষণাবেক্ষণ চলছে",
    support: "সাপোর্ট", channel: "চ্যানেল", group: "গ্রুপ", contact: "যোগাযোগ",
    currency: "মূল্য", priceListTitle: "মূল্য তালিকা", likeTitle: "লাইক সার্ভিস", visitTitle: "ভিজিট সার্ভিস",
    password: "পাসওয়ার্ড", login: "লগইন", adminDashboard: "অ্যাডমিন ড্যাশবোর্ড", logout: "লগআউট",
    keys: "কী সমূহ", logs: "কার্যক্রম লগ", settings: "সেটিংস", stats: "পরিসংখ্যান",
    totalKeys: "মোট কী", activeKeys: "সক্রিয় কী", totalLikes: "মোট লাইক",
    totalVisits: "মোট ভিজিট", onlineUsers: "অনলাইন ব্যবহারকারী", bannedIps: "নিষিদ্ধ আইপি",
    createKey: "কী তৈরি করুন", deleteKey: "মুছুন", validityDays: "মেয়াদ (দিন)",
    useLimit: "ব্যবহার সীমা", unlimited: "সীমাহীন", customKey: "কাস্টম কী (ঐচ্ছিক)",
    likeEnabled: "লাইক সক্রিয়", visitEnabled: "ভিজিট সক্রিয়",
    likeApiUrl: "লাইক API URL", visitApiUrl: "ভিজিট API URL",
    telegramBotToken: "টেলিগ্রাম বট টোকেন", telegramChatId: "টেলিগ্রাম চ্যাট আইডি",
    testTelegram: "টেলিগ্রাম পরীক্ষা", saveSettings: "সেটিংস সংরক্ষণ",
    changePassword: "পাসওয়ার্ড পরিবর্তন", oldPassword: "পুরনো পাসওয়ার্ড", newPassword: "নতুন পাসওয়ার্ড",
    banIp: "আইপি নিষিদ্ধ করুন", unban: "নিষেধ উঠান",
    regions: {
      IND: "ভারত", BD: "বাংলাদেশ", PK: "পাকিস্তান", SG: "সিঙ্গাপুর", TH: "থাইল্যান্ড",
      VN: "ভিয়েতনাম", ID: "ইন্দোনেশিয়া", MY: "মালয়েশিয়া", BR: "ব্রাজিল", US: "আমেরিকা",
      EU: "ইউরোপ", ME: "মধ্যপ্রাচ্য",
    },
  },
};

export type Translations = typeof translations.en;
const LanguageContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Translations }>({ lang: "en", setLang: () => {}, t: translations.en });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const stored = (localStorage.getItem("slv_lang") as Lang) ?? "en";
  const [lang, setLangState] = useState<Lang>(stored);
  function setLang(l: Lang) { localStorage.setItem("slv_lang", l); setLangState(l); }
  return <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>{children}</LanguageContext.Provider>;
}

export function useLang() { return useContext(LanguageContext); }

export const REGIONS = ["IND", "BD", "PK", "SG", "TH", "VN", "ID", "MY", "BR", "US", "EU", "ME"] as const;
