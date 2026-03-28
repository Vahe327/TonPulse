import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import ru from "./ru.json";

const tgLang =
  window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code || "en";
const defaultLang = tgLang === "ru" ? "ru" : "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: defaultLang,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
