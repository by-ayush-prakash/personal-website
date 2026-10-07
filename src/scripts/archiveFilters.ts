// Vanilla search + surprise-me over a static, server-rendered archive.
//
// Markup contract (see /podcast and /writing index pages):
// - a wrapper with [data-archive] scopes one archive block.
// - .tools input is the free-text search box
// - .tools button[data-action="surprise"] jumps to a random visible row
// - [data-count] receives the visible row count
// - each row is an <a class="row" data-search="...">

function initArchive(root: HTMLElement) {
  const rows = Array.from(root.querySelectorAll<HTMLAnchorElement>('.row[data-search]'));
  const searchInput = root.querySelector<HTMLInputElement>('.tools input');
  const surpriseButton = root.querySelector<HTMLButtonElement>('[data-action="surprise"]');
  const countEl = root.querySelector<HTMLElement>('[data-count]');

  function applyFilters() {
    const query = (searchInput?.value ?? '').trim().toLowerCase();
    let visible = 0;

    for (const row of rows) {
      const haystack = (row.dataset.search ?? row.textContent ?? '').toLowerCase();
      const searchMatch = query === '' || haystack.includes(query);

      const show = searchMatch;
      row.style.display = show ? '' : 'none';
      if (show) visible += 1;
    }

    if (surpriseButton) surpriseButton.disabled = visible === 0;

    // Only report a number while the user is actively narrowing. An idle total
    // ("168 items") reads as a claim; a filtered count reads as feedback.
    const narrowing = query !== '';
    if (countEl) {
      countEl.textContent = narrowing ? `${visible} ${visible === 1 ? 'item' : 'items'}` : '';
    }
  }

  searchInput?.addEventListener('input', applyFilters);

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
