(() => {
  'use strict';
  const photos = window.PHOTOGRAPHS || [];
  const galleries = document.querySelector('#galleries');
  const work = document.querySelector('#work');
  const status = document.querySelector('#filter-status');
  const dialog = document.querySelector('#lightbox');
  const largeImage = document.querySelector('#lightbox-image');
  const filters = [...document.querySelectorAll('[data-filter]')];
  let active = 'all';
  let currentId = '';
  let lastTrigger = null;
  const categories = [
    {name:'still-life', label:'Still life', description:'Small details. Quiet places. Everyday light.', css:'still'},
    {name:'portraits', label:'Portraits', description:'People met. Moments kept.', css:'portrait'}
  ];
  const categoryLabels = Object.fromEntries(categories.map(cat => [cat.name, cat.label]));
  filters.forEach(button => {
    button.querySelector('span').textContent = photos.filter(photo => button.dataset.filter === 'all' || photo.category === button.dataset.filter).length;
  });

  function figure(photo) {
    const el = document.createElement('figure');
    el.className = 'photo';
    const link = document.createElement('a');
    link.href = photo.large.src;
    link.dataset.photo = photo.id;
    link.setAttribute('aria-label', `View photograph: ${photo.title}`);
    const img = document.createElement('img');
    img.src = photo.display.src;
    img.srcset = `${photo.small.src} ${photo.small.width}w, ${photo.display.src} ${photo.display.width}w`;
    img.sizes = '(max-width: 760px) 90vw, 50vw';
    img.alt = photo.alt;
    img.width = photo.width;
    img.height = photo.height;
    img.loading = 'lazy';
    img.decoding = 'async';
    const caption = document.createElement('figcaption');
    const title = document.createElement('span');
    title.textContent = photo.title;
    const cat = document.createElement('span');
    cat.textContent = categoryLabels[photo.category].toUpperCase();
    caption.append(title, cat);
    link.append(img);
    el.append(link, caption);
    return el;
  }

  for (const cat of categories) {
    const section = document.createElement('section');
    section.className = `collection ${cat.css}-collection`;
    section.dataset.category = cat.name;
    section.setAttribute('aria-labelledby', `${cat.css}-title`);
    const heading = document.createElement('div');
    heading.className = 'collection-heading';
    const title = document.createElement('h3');
    title.id = `${cat.css}-title`;
    title.textContent = cat.label;
    const description = document.createElement('p');
    description.textContent = cat.description;
    heading.append(title, description);
    const grid = document.createElement('div');
    grid.className = `${cat.css}-grid`;
    photos.filter(photo => photo.category === cat.name).forEach(photo => grid.append(figure(photo)));
    section.append(heading, grid);
    galleries.append(section);
  }

  function visiblePhotos() {
    return photos.filter(photo => active === 'all' || photo.category === active);
  }

  function setFilter(value, updateUrl = true) {
    active = categories.some(cat => cat.name === value) ? value : 'all';
    work.dataset.active = active;
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === active)));
    document.querySelectorAll('.collection').forEach(section => {
      section.hidden = active !== 'all' && section.dataset.category !== active;
    });
    const count = visiblePhotos().length;
    status.textContent = `Showing ${active === 'all' ? 'all' : categoryLabels[active].toLowerCase()}: ${count} photographs.`;
    if (updateUrl) {
      const url = new URL(window.location.href);
      if (active === 'all') url.searchParams.delete('collection');
      else url.searchParams.set('collection', active);
      history.replaceState(null, '', url);
    }
  }
  filters.forEach(button => button.addEventListener('click', () => setFilter(button.dataset.filter)));
  const initial = new URLSearchParams(location.search).get('collection');
  setFilter(initial, false);

  function currentSequence() {
    const list = visiblePhotos();
    return list.some(photo => photo.id === currentId) ? list : photos;
  }
  function showPhoto(id) {
    const photo = photos.find(item => item.id === id);
    if (!photo) return;
    currentId = photo.id;
    largeImage.src = photo.large.src;
    largeImage.alt = photo.alt;
    document.querySelector('#lightbox-title').textContent = photo.title;
    document.querySelector('#lightbox-category').textContent = `${categoryLabels[photo.category]} · Xiao Tu`;
    const list = currentSequence();
    document.querySelector('#lightbox-counter').textContent = `${String(list.findIndex(item => item.id === id) + 1).padStart(2,'0')} / ${String(list.length).padStart(2,'0')}`;
    if (!dialog.open) dialog.showModal();
  }
  document.addEventListener('click', event => {
    const trigger = event.target.closest('a[data-photo]');
    if (!trigger || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    lastTrigger = trigger;
    showPhoto(trigger.dataset.photo);
  });
  function step(direction) {
    const list = currentSequence();
    const index = list.findIndex(photo => photo.id === currentId);
    showPhoto(list[(index + direction + list.length) % list.length].id);
  }
  dialog.querySelector('.prev').addEventListener('click', () => step(-1));
  dialog.querySelector('.next').addEventListener('click', () => step(1));
  dialog.querySelector('.close-lightbox').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => { if (lastTrigger) lastTrigger.focus({preventScroll:true}); });
  let startX = 0;
  largeImage.addEventListener('touchstart', event => { startX = event.changedTouches[0].clientX; }, {passive:true});
  largeImage.addEventListener('touchend', event => {
    const distance = event.changedTouches[0].clientX - startX;
    if (Math.abs(distance) > 60) step(distance < 0 ? 1 : -1);
  }, {passive:true});
  document.querySelector('#year').textContent = new Date().getFullYear();
})();
