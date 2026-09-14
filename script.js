(function () {
  const toggle = document.querySelector('[data-language-toggle]');
  const stored = window.localStorage.getItem('cyj-language');
  const setLanguage = (language) => {
    const isChinese = language === 'zh';
    document.body.classList.toggle('lang-zh', isChinese);
    document.documentElement.lang = isChinese ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-en][data-zh]').forEach((element) => {
      element.textContent = isChinese ? element.dataset.zh : element.dataset.en;
    });
    toggle.textContent = isChinese ? 'EN / 中' : '中 / EN';
    toggle.setAttribute('aria-label', isChinese ? 'Switch to English' : '切换到中文');
    window.localStorage.setItem('cyj-language', language);
  };
  setLanguage(stored === 'zh' ? 'zh' : 'en');
  toggle.addEventListener('click', () => setLanguage(document.body.classList.contains('lang-zh') ? 'en' : 'zh'));
})();
