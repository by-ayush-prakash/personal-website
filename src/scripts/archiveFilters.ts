// Vanilla theme filter + search + surprise-me over a static, server-rendered
// archive. No client-side framework — just DOM queries and listeners.
//
// Markup contract (see /podcast and /writing index pages):
// - a wrapper with [data-archive] scopes one archive block on the page
// - .filters button[data-theme] toggles the active theme ("all" = no filter)
// - .tools input is the free-text search box
// - .tools button[data-action="surprise"] jumps to a random visible row
// - each row is an <a class="row" data-theme="..." data-search="...">

function initArchive(root: HTMLElement) {
  const filterButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('.filters button'));
  const rows = Array.from(root.querySelectorAll<HTMLAnchorElement>('.row[data-theme]'));
  const searchInput = root.querySelector<HTMLInputElement>('.tools input');
  const surpriseButton = root.querySelector<HTMLButtonElement>('[data-action="surprise"]');

  let activeTheme = 'all';

  function applyFilters() {
    const query = (searchInput?.value ?? '').trim().toLowerCase();
    for (const row of rows) {
      const theme = row.dataset.theme ?? '';
      const themeMatch = activeTheme === 'all' || theme === activeTheme;
      const haystack = (row.dataset.search ?? row.textContent ?? '').toLowerCase();
      const searchMatch = query === '' || haystack.includes(query);
      row.style.display = themeMatch && searchMatch ? '' : 'none';
    }
  }

  for (const button of filterButtons) {
    button.addEventListener('click', () => {
      for (const b of filterButtons) b.classList.remove('on');
      button.classList.add('on');
      activeTheme = button.dataset.theme ?? 'all';
      applyFilters();
    });
  }

  searchInput?.addEventListener('input', applyFilters);

  surpriseButton?.addEventListener('click', () => {
    const visible = rows.filter((row) => row.style.display !== 'none');
    if (visible.length === 0) return;
    const pick = visible[Math.floor(Math.random() * visible.length)];
    const href = pick.getAttribute('href');
    if (href) window.location.href = href;
  });
}

document.querySelectorAll<HTMLElement>('[data-archive]').forEach(initArchive);
