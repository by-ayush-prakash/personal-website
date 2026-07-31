// Vanilla theme filter + search + surprise-me over a static, server-rendered
// archive. No client-side framework — just DOM queries and listeners.
//
// Markup contract (see /podcast and /writing index pages):
// - a wrapper with [data-archive] scopes one archive block. It must CONTAIN the
//   filters, the tools and the rows — putting it on .filters alone finds no rows.
// - .filters button[data-theme] toggles the active theme ("all" = no filter)
// - .tools input is the free-text search box
// - .tools button[data-action="surprise"] jumps to a random visible row
// - [data-action="show-all"] reveals rows marked data-untagged
// - [data-count] receives the visible row count
// - each row is an <a class="row" data-theme="..." data-search="..."> and may
//   carry data-untagged when it has no research theme.

function initArchive(root: HTMLElement) {
  const filterButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('.filters button'));
  const rows = Array.from(root.querySelectorAll<HTMLAnchorElement>('.row[data-search]'));
  const searchInput = root.querySelector<HTMLInputElement>('.tools input');
  const surpriseButton = root.querySelector<HTMLButtonElement>('[data-action="surprise"]');
  const showAllButton = root.querySelector<HTMLButtonElement>('[data-action="show-all"]');
  const countEl = root.querySelector<HTMLElement>('[data-count]');

  let activeTheme = 'all';
  let showAll = false;

  function applyFilters() {
    const query = (searchInput?.value ?? '').trim().toLowerCase();
    let visible = 0;

    for (const row of rows) {
      const theme = row.dataset.theme ?? '';
      const untagged = row.dataset.untagged === 'true';

      // Untagged rows stay out of the default view, but a search or an explicit
      // "show everything" always reaches them.
      const inDefaultView = showAll || query !== '' || !untagged;
      const themeMatch = activeTheme === 'all' || theme === activeTheme;
      const haystack = (row.dataset.search ?? row.textContent ?? '').toLowerCase();
      const searchMatch = query === '' || haystack.includes(query);

      const show = inDefaultView && themeMatch && searchMatch;
      row.style.display = show ? '' : 'none';
      if (show) visible += 1;
    }

    // Only report a number while the user is actively narrowing. An idle total
    // ("168 items") reads as a claim; a filtered count reads as feedback.
    const narrowing = query !== '' || activeTheme !== 'all';
    if (countEl) {
      countEl.textContent = narrowing ? `${visible} ${visible === 1 ? 'item' : 'items'}` : '';
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

  showAllButton?.addEventListener('click', () => {
    showAll = !showAll;
    showAllButton.textContent = showAll ? 'Show research archive only' : 'Show the full archive';
    applyFilters();
  });

  surpriseButton?.addEventListener('click', () => {
    const visible = rows.filter((row) => row.style.display !== 'none');
    if (visible.length === 0) return;
    const pick = visible[Math.floor(Math.random() * visible.length)];
    const href = pick.getAttribute('href');
    if (href) window.location.href = href;
  });

  applyFilters();
}

document.querySelectorAll<HTMLElement>('[data-archive]').forEach(initArchive);
