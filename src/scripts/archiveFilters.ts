// Vanilla search over a static, server-rendered archive.
//
// Markup contract (see /podcast and /writing index pages):
// - a wrapper with [data-archive] scopes one archive block.
// - .tools input is the free-text search box
// - [data-count] receives the visible row count
// - each row is an <a class="row" data-search="...">

function initArchive(root: HTMLElement) {
  const rows = Array.from(root.querySelectorAll<HTMLAnchorElement>('.row[data-search]'));
  const searchInput = root.querySelector<HTMLInputElement>('.tools input');
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

    // Only report a number while the user is actively narrowing. An idle total
    // ("168 items") reads as a claim; a filtered count reads as feedback.
    const narrowing = query !== '';
    if (countEl) {
      countEl.textContent = narrowing ? `${visible} ${visible === 1 ? 'item' : 'items'}` : '';
    }
  }

  searchInput?.addEventListener('input', applyFilters);

  applyFilters();
}

document.querySelectorAll<HTMLElement>('[data-archive]').forEach(initArchive);
