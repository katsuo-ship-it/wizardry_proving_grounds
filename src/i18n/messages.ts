export const MESSAGES = {
  en: {
    'title.subtitle': 'Proving Grounds of the Mad Overlord',
    'title.menu.newGame': 'New Game',
    'title.menu.continue': 'Continue',
    'title.menu.settings': 'Settings',
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.language.en': 'English',
    'settings.language.ja': '日本語',
    'settings.back': 'Back to Title',
    'common.press.enter': 'PRESS ENTER',
  },
  ja: {
    'title.subtitle': 'きょうきのまおうの しれん',
    'title.menu.newGame': 'はじめから',
    'title.menu.continue': 'つづきから',
    'title.menu.settings': 'せってい',
    'settings.title': 'せってい',
    'settings.language': 'げんご',
    'settings.language.en': 'English',
    'settings.language.ja': '日本語',
    'settings.back': 'タイトルに もどる',
    'common.press.enter': 'ENTER をおしてください',
  },
} as const;

export type MessageKey = keyof (typeof MESSAGES)['en'];
