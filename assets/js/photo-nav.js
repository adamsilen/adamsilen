(() => {
  // ─── State ───────────────────────────────────────────────────────────────
  let activeTag = null;
  let currentMonthIndex = 0;

  // ─── Elements ────────────────────────────────────────────────────────────
  const photoItems      = Array.from(document.querySelectorAll('.photo-item'));
  const monthNav        = document.getElementById('month-nav');
  const monthLabel      = document.getElementById('month-label');
  const monthLabelText  = document.getElementById('month-label-text');
  const monthDropdown   = document.getElementById('month-dropdown');
  const monthOptions    = Array.from(document.querySelectorAll('.month-option'));
  const tagNav          = document.getElementById('tag-nav');
  const tagLabel        = document.getElementById('tag-label');
  const tagLabelText    = document.getElementById('tag-label-text');
  const tagClear        = document.getElementById('tag-clear');
  const tagDropdown     = document.getElementById('tag-dropdown');
  const tagOptions      = Array.from(document.querySelectorAll('.tag-option'));
  const months          = window.PHOTO_MONTHS;

  const SCROLL_OFFSET = 24;

  // ─── Visible months (respects active tag) ────────────────────────────────

  function visibleMonths() {
    if (!activeTag) return months;
    return months.filter(m =>
      photoItems.some(el =>
        el.dataset.month === m.id &&
        el.dataset.tags.split(',').includes(activeTag)
      )
    );
  }

  // ─── Month label ──────────────────────────────────────────────────────────

  function setMonthLabel(label) {
    monthLabelText.textContent = label;
  }

  // ─── Month dropdown ───────────────────────────────────────────────────────

  function updateMonthDropdown() {
    const vm = visibleMonths();
    const visibleIds = new Set(vm.map(m => m.id));

    monthOptions.forEach(btn => {
      btn.classList.toggle('is-hidden', !visibleIds.has(btn.dataset.month));
    });

    document.querySelectorAll('.month-year-group').forEach(group => {
      const anyVisible = Array.from(group.querySelectorAll('.month-option'))
        .some(btn => !btn.classList.contains('is-hidden'));
      group.classList.toggle('is-hidden', !anyVisible);
    });
  }

  function openMonthDropdown() {
    closeTagDropdown();
    monthDropdown.hidden = false;
    monthLabel.setAttribute('aria-expanded', 'true');
    const active = monthDropdown.querySelector('[aria-selected="true"]:not(.is-hidden)');
    if (active) active.scrollIntoView({ block: 'nearest' });
  }

  function closeMonthDropdown() {
    monthDropdown.hidden = true;
    monthLabel.setAttribute('aria-expanded', 'false');
  }

  monthLabel.addEventListener('click', (e) => {
    e.stopPropagation();
    monthDropdown.hidden ? openMonthDropdown() : closeMonthDropdown();
  });

  monthOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      const monthId = btn.dataset.month;
      closeMonthDropdown();
      scrollToMonth(monthId);
      highlightActiveMonthOption(monthId);
    });
  });

  // ─── Tag dropdown ─────────────────────────────────────────────────────────

  function openTagDropdown() {
    closeMonthDropdown();
    tagDropdown.hidden = false;
    tagLabel.setAttribute('aria-expanded', 'true');
    const active = tagDropdown.querySelector('[aria-selected="true"]');
    if (active) active.scrollIntoView({ block: 'nearest' });
  }

  function closeTagDropdown() {
    tagDropdown.hidden = true;
    tagLabel.setAttribute('aria-expanded', 'false');
  }

  tagLabel.addEventListener('click', (e) => {
    e.stopPropagation();
    tagDropdown.hidden ? openTagDropdown() : closeTagDropdown();
  });

  tagOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.dataset.tag;
      closeTagDropdown();

      const url = new URL(window.location);
      if (tag === activeTag) {
        url.searchParams.delete('tag');
        history.pushState({}, '', url);
        applyTagFilter(null);
      } else {
        url.searchParams.set('tag', tag);
        history.pushState({}, '', url);
        applyTagFilter(tag);
        const vm = visibleMonths();
        if (vm.length > 0) {
          currentMonthIndex = 0;
          scrollToMonth(vm[0].id);
        }
      }
    });
  });

  tagClear.addEventListener('click', (e) => {
    e.stopPropagation();
    const url = new URL(window.location);
    url.searchParams.delete('tag');
    history.pushState({}, '', url);
    applyTagFilter(null);
  });

  // ─── Tag filtering ────────────────────────────────────────────────────────

  function applyTagFilter(tag) {
    activeTag = tag;

    photoItems.forEach(el => {
      const tags = el.dataset.tags ? el.dataset.tags.split(',') : [];
      el.hidden = !!(tag && !tags.includes(tag));
    });

    if (tag) {
      tagLabelText.textContent = tag;
      tagLabel.classList.add('is-active');
      tagClear.hidden = false;
    } else {
      tagLabelText.textContent = 'filtrera';
      tagLabel.classList.remove('is-active');
      tagClear.hidden = true;
    }

    tagOptions.forEach(btn => {
      btn.setAttribute('aria-selected', btn.dataset.tag === tag ? 'true' : 'false');
    });

    document.querySelectorAll('.photo-tag').forEach(el => {
      const elTag = new URL(el.href).searchParams.get('tag');
      el.classList.toggle('is-active', elTag === tag);
    });

    updateMonthDropdown();
    syncMonthIndexToScroll();
  }

  // ─── Month navigation ─────────────────────────────────────────────────────

  function highlightActiveMonthOption(monthId) {
    monthOptions.forEach(btn => {
      btn.setAttribute('aria-selected', btn.dataset.month === monthId ? 'true' : 'false');
    });
  }

  // ─── Scroll to month ──────────────────────────────────────────────────────
  // Images above the target anchor may still be lazy-loading placeholders,
  // making the page shorter than it will be. We do an initial jump, then watch
  // for any images above the anchor that load and inflate the page, correcting
  // the scroll position each time until we're stable.

  function scrollToMonth(monthId) {
    const anchor = document.getElementById('month-' + monthId);
    if (!anchor) return;

    // Instant-jump first (no smooth) so we're in the right neighbourhood and
    // trigger lazy loading of images above the target.
    const getTargetScrollY = () =>
      anchor.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;

    window.scrollTo({ top: getTargetScrollY(), behavior: 'instant' });

    // Now watch images that are above the anchor and not yet loaded.
    // Each time one loads it will push the anchor down, so we re-snap.
    const allImages = Array.from(document.querySelectorAll('.photo-item img'));

    const unloadedAbove = allImages.filter(img => {
      // Only images that are above the anchor in the DOM and still loading
      if (img.complete) return false;
      if (img.closest('[hidden]')) return false;
      return img.compareDocumentPosition(anchor) & Node.DOCUMENT_POSITION_FOLLOWING;
    });

    if (unloadedAbove.length === 0) return;

    let pending = unloadedAbove.length;

    const onLoad = () => {
      // Re-snap to the anchor after each image loads
      window.scrollTo({ top: getTargetScrollY(), behavior: 'instant' });
      pending--;
      if (pending <= 0) cleanup();
    };

    // Safety timeout — stop watching after 10 s regardless
    const timer = setTimeout(cleanup, 10000);

    function cleanup() {
      clearTimeout(timer);
      unloadedAbove.forEach(img => {
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onLoad);
      });
    }

    unloadedAbove.forEach(img => {
      img.addEventListener('load', onLoad, { once: true });
      img.addEventListener('error', onLoad, { once: true });
    });
  }

  // ─── Scroll sync ──────────────────────────────────────────────────────────

  function getMonthIdAtScroll() {
    const vm = visibleMonths();
    if (vm.length === 0) return null;
    const mid = window.innerHeight * 0.2;
    let best = null;
    for (const m of vm) {
      const anchor = document.getElementById('month-' + m.id);
      if (!anchor) continue;
      if (anchor.getBoundingClientRect().top <= mid) best = m.id;
    }
    return best || vm[0].id;
  }

  function syncMonthIndexToScroll() {
    const vm = visibleMonths();
    if (vm.length === 0) return;
    const monthId = getMonthIdAtScroll();
    const idx = vm.findIndex(m => m.id === monthId);
    if (idx === -1) return;
    currentMonthIndex = idx;
    setMonthLabel(vm[idx].label);
    highlightActiveMonthOption(monthId);
  }

  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      syncMonthIndexToScroll();
      scrollTicking = false;
    });
  }, { passive: true });

  // ─── Tag links in captions ────────────────────────────────────────────────

  document.addEventListener('click', (e) => {
    const tagLink = e.target.closest('.photo-tag');
    if (!tagLink) return;
    e.preventDefault();

    const tag = new URL(tagLink.href).searchParams.get('tag');
    if (!tag) return;

    const url = new URL(window.location);
    if (tag === activeTag) {
      url.searchParams.delete('tag');
      history.pushState({}, '', url);
      applyTagFilter(null);
    } else {
      url.searchParams.set('tag', tag);
      history.pushState({}, '', url);
      applyTagFilter(tag);
      const vm = visibleMonths();
      if (vm.length > 0) {
        currentMonthIndex = 0;
        scrollToMonth(vm[0].id);
      }
    }
  });

  // ─── Close dropdowns on outside click / Escape ────────────────────────────

  document.addEventListener('click', (e) => {
    if (!monthNav.contains(e.target)) closeMonthDropdown();
    if (!tagNav.contains(e.target)) closeTagDropdown();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMonthDropdown();
      closeTagDropdown();
    }
  });

  // ─── Browser back/forward ─────────────────────────────────────────────────

  window.addEventListener('popstate', () => {
    const tag = new URLSearchParams(window.location.search).get('tag');
    applyTagFilter(tag || null);
  });

  // ─── Init ─────────────────────────────────────────────────────────────────

  const initialTag = new URLSearchParams(window.location.search).get('tag');
  if (initialTag) {
    applyTagFilter(initialTag);
  } else {
    updateMonthDropdown();
  }

  syncMonthIndexToScroll();

})();
