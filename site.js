(() => {
  'use strict';

  const root = document.documentElement;
  const themeKey = 'cyj-hashtag.theme';
  const languageKey = 'cyj-hashtag.language';
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  const read = key => {
    try { return localStorage.getItem(key); } catch { return null; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(key, value); } catch { /* Controls still work without storage. */ }
  };
  const validTheme = value => value === 'dark' || value === 'light';
  const validLanguage = value => value === 'zh' || value === 'en';
  const browserLanguage = () => /^zh(?:-|$)/i.test(navigator.language) ? 'zh' : 'en';
  let savedTheme = read(themeKey);
  let theme = validTheme(savedTheme) ? savedTheme : systemTheme.matches ? 'dark' : 'light';
  let language = validLanguage(read(languageKey)) ? read(languageKey) : browserLanguage();

  const apply = () => {
    root.dataset.theme = theme;
    root.dataset.language = language;
    root.lang = language === 'zh' ? 'zh-CN' : 'en';
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = theme === 'dark' ? '#000000' : '#ffffff';
    const title = document.querySelector('title[data-title-en]');
    if (title) document.title = title.getAttribute(`data-title-${language}`);
    const description = document.querySelector('meta[name="description"][data-description-en]');
    if (description) description.content = description.getAttribute(`data-description-${language}`);
    document.querySelectorAll('[data-label-en]').forEach(element => {
      element.setAttribute('aria-label', element.getAttribute(`data-label-${language}`));
    });

    const themeButton = document.querySelector('[data-theme-toggle]');
    const languageButton = document.querySelector('[data-language-toggle]');
    if (themeButton) {
      const nextTheme = theme === 'dark' ? 'light' : 'dark';
      const names = language === 'zh' ? { dark: '夜间', light: '日间' } : { dark: 'Night', light: 'Day' };
      themeButton.querySelector('.theme-name').textContent = names[theme];
      themeButton.setAttribute('aria-pressed', String(theme === 'dark'));
      const label = language === 'zh' ? `切换至${names[nextTheme]}模式` : `Switch to ${nextTheme === 'light' ? 'day' : 'night'} mode`;
      themeButton.setAttribute('aria-label', label);
      themeButton.title = label;
    }
    if (languageButton) {
      const label = language === 'zh' ? '切换为英文' : 'Switch to Chinese';
      languageButton.setAttribute('aria-label', label);
      languageButton.setAttribute('aria-pressed', String(language === 'zh'));
      languageButton.title = label;
    }
  };

  // Run before the stylesheet so a saved theme or language never flashes its fallback.
  root.dataset.enhanced = '';
  apply();

  const ready = () => {
    const controls = document.querySelector('.site-controls');
    if (!controls) return;
    const themeButton = controls.querySelector('[data-theme-toggle]');
    themeButton.addEventListener('click', () => {
      // A clicked theme control joins the page palette until the pointer leaves.
      if (themeButton.matches(':hover')) themeButton.dataset.hoverSuppressed = '';
      theme = theme === 'dark' ? 'light' : 'dark';
      savedTheme = theme;
      write(themeKey, theme);
      apply();
    });
    themeButton.addEventListener('pointerleave', () => { delete themeButton.dataset.hoverSuppressed; });
    const languageButton = controls.querySelector('[data-language-toggle]');
    languageButton.addEventListener('click', () => {
      // Page loads start in place; only a language selection moves the underline.
      languageButton.dataset.localeAnimate = '';
      language = language === 'zh' ? 'en' : 'zh';
      write(languageKey, language);
      apply();
    });
    controls.hidden = false;
    apply();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
  else ready();

  systemTheme.addEventListener('change', event => {
    if (!validTheme(savedTheme)) {
      theme = event.matches ? 'dark' : 'light';
      apply();
    }
  });
  window.addEventListener('storage', event => {
    if (event.key === themeKey || event.key === null) {
      savedTheme = read(themeKey);
      theme = validTheme(savedTheme) ? savedTheme : systemTheme.matches ? 'dark' : 'light';
    }
    if (event.key === languageKey || event.key === null) {
      const savedLanguage = read(languageKey);
      language = validLanguage(savedLanguage) ? savedLanguage : browserLanguage();
    }
    if (event.key === themeKey || event.key === languageKey || event.key === null) apply();
  });
})();
