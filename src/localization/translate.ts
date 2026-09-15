import { createIntl, createIntlCache } from 'react-intl';
import moment from 'moment';
import _ from 'lodash';
import { calendarLocales } from './calendarLocales';

const supportedLocales = [
  'ar',
  'bg',
  'cs',
  'cy',
  'da',
  'de',
  'en-us',
  'en-gb',
  'es',
  'es-mx',
  'fi',
  'fr',
  'fr-ca',
  'he',
  'is',
  'it',
  'ja',
  'ko',
  'nb',
  'nl',
  'no',
  'nn-no',
  'pl',
  'pt-br',
  'pt-pt',
  'ru',
  'sv',
  'th',
  'tr',
  'zh-cn',
  'zh-tw'
];

export function getUserLocale() {
  let locale = [];
  const url = new URL(document.location.href);
  let paramlocale = url.searchParams.get('locale');

  if (paramlocale && !_.includes(supportedLocales, paramlocale)) {
    if (paramlocale.indexOf("_") > -1) {
      paramlocale = paramlocale.split('_')[0];
    } else if (paramlocale.indexOf("-") > -1) {
      paramlocale = paramlocale.split('-')[0];
    }

  }

  if (paramlocale && _.includes(supportedLocales, paramlocale)) {
    locale.push(paramlocale);
  } else if (navigator.languages) {
    locale.push(navigator.languages[0].toLocaleLowerCase());
  } else if (navigator.language) {
    locale.push(navigator.language.toLocaleLowerCase());
  } else {
    locale.push('en-us');
  }

  return locale[0];
}

const userLocale = getUserLocale();
const translationsStorageKey = `translatedStrings_${userLocale}`;

// Vite bundles moment's own locale files (moment/locale/*.js,
// moment/min/locales.min.js) in a way that never registers their data onto
// the running moment instance, so moment.locale() silently stays on 'en' no
// matter what is requested. Registering the locale ourselves from data
// extracted ahead of time (see calendarLocales.ts) works around that.
export function applyMomentLocale() {
  const calendarLocale = calendarLocales[userLocale] ?? calendarLocales['en-us'];
  moment.defineLocale(userLocale, calendarLocale);
  moment.locale(userLocale);
}

applyMomentLocale();

async function loadTranslations() {
  let translations;

  if (_.includes(supportedLocales, userLocale)) {
    translations = await import(`../translations/${userLocale}/strings.json`);
  } else {
    translations = await import(`../translations/en-us/strings.json`);
  }

  return translations;
}

loadTranslations().then((translatedStrings: any) => {
  sessionStorage.setItem(
    translationsStorageKey,
    JSON.stringify(translatedStrings.default)
  );
});

let storedTranslations = sessionStorage.getItem(translationsStorageKey);

export let messages: any = storedTranslations
  ? JSON.parse(storedTranslations)
  : {};

const cache = createIntlCache();
let int = createIntl(
  {
    locale: userLocale,
    messages: messages
  },
  cache
);

export async function getMessages(): Promise<any>
{
  if (!!storedTranslations)
  {
    return JSON.parse(storedTranslations);
  }
  console.log("Translation not cached, loading...");
  const translatedStrings = await loadTranslations();
  storedTranslations = JSON.stringify(translatedStrings.default);
  sessionStorage.setItem(translationsStorageKey, storedTranslations);

  if (!storedTranslations)
  {
    console.error("Unable to load translations");
    return {};
  }

  messages = JSON.parse(storedTranslations);
  int = createIntl(
    {
      locale: userLocale,
      messages: messages
    },
    cache
  );
  
  return messages;
}

export const translate = (id: string, values?: {}) => {
  return int.formatMessage({ id }, values);
};