document.addEventListener('DOMContentLoaded', () => {

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const state = loadState();


  const nav = $('#nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  });


  const dot = $('#cursorDot');
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top = mouseY + 'px';
  });


  const navMenuBtn = $('#navMenuBtn');
  const mobileMenu = $('#mobileMenu');
  const mobileMenuClose = $('#mobileMenuClose');
  navMenuBtn.addEventListener('click', () => mobileMenu.classList.add('open'));
  mobileMenuClose.addEventListener('click', () => mobileMenu.classList.remove('open'));
  $$('.mobile-link').forEach(link => {
    link.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });


  const targets = { years: 6, projects: 0, skills: 0 };
  const statEls = {
    years: $('#statYears .stat-number'),
    projects: $('#statProjects .stat-number'),
    skills: $('#statSkills .stat-number')
  };

  function updateStats() {
    const projectCount = $$('.project-card:not(.placeholder-card)').length + $$('.placeholder-card').length;
    const tagCount = state.tags.length;
    targets.projects = projectCount;
    targets.skills = tagCount;
    targets.years = $$('.timeline-item').length;
  }

  function animateStat(el, target, delay = 0) {
    setTimeout(() => {
      let start = 0;
      const duration = 1200;
      const startTime = performance.now();
      const tick = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
  }

  const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        updateStats();
        animateStat(statEls.years, targets.years, 0);
        animateStat(statEls.projects, targets.projects, 150);
        animateStat(statEls.skills, targets.skills, 300);
        heroObserver.disconnect();
      }
    });
  }, { threshold: 0.4 });
  heroObserver.observe($('.hero'));


  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  function observeCards() {
    $$('.project-card, .timeline-item').forEach(el => {
      scrollObserver.observe(el);
    });
  }
  observeCards();


  const photoInput = $('#photoUpload');
  const aboutPhoto = $('#aboutPhoto');
  const photoPlaceholder = $('.about-photo-placeholder');

  if (state.photo) {
    aboutPhoto.src = state.photo;
    aboutPhoto.style.display = 'block';
    photoPlaceholder.style.display = 'none';
  }

  photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      aboutPhoto.src = ev.target.result;
      aboutPhoto.style.display = 'block';
      photoPlaceholder.style.display = 'none';
      state.photo = ev.target.result;
      saveState();
    };
    reader.readAsDataURL(file);
  });


  const aboutBio = $('#aboutBio');
  const editBioBtn = $('[data-target="aboutBio"]');

  if (state.bio) aboutBio.textContent = state.bio;

  editBioBtn.addEventListener('click', () => {
    const isEditing = aboutBio.getAttribute('contenteditable') === 'true';
    if (isEditing) {
      aboutBio.setAttribute('contenteditable', 'false');
      editBioBtn.textContent = 'Edit Bio';
      editBioBtn.classList.remove('active');
      state.bio = aboutBio.textContent;
      saveState();
    } else {
      aboutBio.setAttribute('contenteditable', 'true');
      aboutBio.focus();
      editBioBtn.textContent = 'Save Bio';
      editBioBtn.classList.add('active');
    }
  });


  const aboutTags = $('#aboutTags');
  const tagInput = $('#tagInput');
  const tagAddBtn = $('#tagAddBtn');

  function renderTags() {
    aboutTags.innerHTML = '';
    if (state.tags.length === 0) {
      const empty = document.createElement('span');
      empty.className = 'tag';
      empty.textContent = 'Add your interests below';
      aboutTags.appendChild(empty);
      return;
    }
    state.tags.forEach((tagText, idx) => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.innerHTML = `${tagText} <button class="tag-remove" data-idx="${idx}">✕</button>`;
      aboutTags.appendChild(span);
    });
    $$('.tag-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        state.tags.splice(parseInt(btn.dataset.idx), 1);
        saveState();
        renderTags();
        updateStats();
      });
    });
  }

  renderTags();

  function addTag() {
    const val = tagInput.value.trim();
    if (!val || state.tags.includes(val)) return;
    state.tags.push(val);
    tagInput.value = '';
    saveState();
    renderTags();
    updateStats();
  }

  tagAddBtn.addEventListener('click', addTag);
  tagInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTag(); });


  const timelineEl = $('#timeline');

  function makeTimelineItem(year, text) {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.dataset.year = year;
    item.innerHTML = `
      <div class="timeline-year">${year}</div>
      <div class="timeline-card">
        <p class="timeline-card-text" contenteditable="false">${text}</p>
        <button class="edit-btn small" data-timeline-edit>Edit</button>
      </div>
    `;
    const editBtn = item.querySelector('[data-timeline-edit]');
    const textEl = item.querySelector('.timeline-card-text');

    editBtn.addEventListener('click', () => {
      const isEditing = textEl.getAttribute('contenteditable') === 'true';
      if (isEditing) {
        textEl.setAttribute('contenteditable', 'false');
        editBtn.textContent = 'Edit';
        editBtn.classList.remove('active');
        saveTimelineState();
      } else {
        textEl.setAttribute('contenteditable', 'true');
        textEl.focus();
        editBtn.textContent = 'Save';
        editBtn.classList.add('active');
      }
    });

    return item;
  }

  function bindExistingTimelineEdits() {
    $$('.timeline-item').forEach(item => {
      const btn = item.querySelector('.edit-btn.small');
      const textEl = item.querySelector('.timeline-card-text');
      if (!btn || btn.dataset.bound) return;
      btn.dataset.bound = 'true';
      btn.addEventListener('click', () => {
        const isEditing = textEl.getAttribute('contenteditable') === 'true';
        if (isEditing) {
          textEl.setAttribute('contenteditable', 'false');
          btn.textContent = 'Edit';
          btn.classList.remove('active');
          saveTimelineState();
        } else {
          textEl.setAttribute('contenteditable', 'true');
          textEl.focus();
          btn.textContent = 'Save';
          btn.classList.add('active');
        }
      });
    });
  }

  function saveTimelineState() {
    state.timeline = [];
    $$('.timeline-item').forEach(item => {
      state.timeline.push({
        year: item.dataset.year,
        text: item.querySelector('.timeline-card-text').textContent
      });
    });
    saveState();
  }

  if (state.timeline && state.timeline.length) {
    timelineEl.innerHTML = '';
    state.timeline.forEach(entry => {
      const item = makeTimelineItem(entry.year, entry.text);
      timelineEl.appendChild(item);
    });
  }

  bindExistingTimelineEdits();

  const addYearBtn = $('#addYearBtn');
  const addYearModal = $('#addYearModal');
  const closeYearModal = $('#closeYearModal');
  const submitYear = $('#submitYear');

  addYearBtn.addEventListener('click', () => addYearModal.classList.add('open'));
  closeYearModal.addEventListener('click', () => addYearModal.classList.remove('open'));
  addYearModal.addEventListener('click', (e) => { if (e.target === addYearModal) addYearModal.classList.remove('open'); });

  submitYear.addEventListener('click', () => {
    const year = $('#newYear').value.trim();
    const text = $('#newYearText').value.trim();
    if (!year || !text) return;
    const item = makeTimelineItem(year, text || 'Add a memory…');
    timelineEl.appendChild(item);
    scrollObserver.observe(item);
    saveTimelineState();
    updateStats();
    addYearModal.classList.remove('open');
    $('#newYear').value = '';
    $('#newYearText').value = '';
  });


  const projectsGrid = $('#projectsGrid');
  const addProjectBtn = $('#addProjectBtn');
  const addProjectModal = $('#addProjectModal');
  const closeProjectModal = $('#closeProjectModal');
  const submitProject = $('#submitProject');

  addProjectBtn.addEventListener('click', () => addProjectModal.classList.add('open'));
  closeProjectModal.addEventListener('click', () => addProjectModal.classList.remove('open'));
  addProjectModal.addEventListener('click', (e) => { if (e.target === addProjectModal) addProjectModal.classList.remove('open'); });

  function buildProjectCard(title, year, category, desc, imgSrc) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.dataset.category = category;

    const icons = {
      art: `<svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 16l4-8H8l4 8z"/><circle cx="12" cy="12" r="10"/></svg>`,
      code: `<svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
      sports: `<svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
      other: `<svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>`
    };

    const imgHTML = imgSrc
      ? `<img src="${imgSrc}" alt="${title}" />`
      : `<div class="project-img-placeholder">${icons[category] || icons.other}</div>`;

    card.innerHTML = `
      <div class="project-img-wrap">${imgHTML}</div>
      <div class="project-info">
        <span class="project-year">${year}</span>
        <h3 class="project-title">${title}</h3>
        <p class="project-desc">${desc}</p>
        <span class="project-tag">${category}</span>
      </div>
    `;
    return card;
  }

  if (state.projects && state.projects.length) {
    state.projects.forEach(p => {
      const card = buildProjectCard(p.title, p.year, p.category, p.desc, p.img);
      projectsGrid.appendChild(card);
    });
    observeCards();
  }

  submitProject.addEventListener('click', () => {
    const title = $('#newProjectTitle').value.trim();
    const year = $('#newProjectYear').value.trim();
    const category = $('#newProjectCategory').value;
    const desc = $('#newProjectDesc').value.trim();
    const imageFile = $('#newProjectImage').files[0];

    if (!title) return;

    const save = (imgSrc) => {
      const card = buildProjectCard(title, year || '—', category, desc || 'No description yet.', imgSrc);
      projectsGrid.appendChild(card);
      scrollObserver.observe(card);
      applyFilter(activeFilter);

      if (!state.projects) state.projects = [];
      state.projects.push({ title, year, category, desc, img: imgSrc });
      saveState();
      updateStats();

      addProjectModal.classList.remove('open');
      $('#newProjectTitle').value = '';
      $('#newProjectYear').value = '';
      $('#newProjectDesc').value = '';
      $('#newProjectImage').value = '';
    };

    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (ev) => save(ev.target.result);
      reader.readAsDataURL(imageFile);
    } else {
      save(null);
    }
  });


  let activeFilter = 'all';
  const filterBtns = $$('.filter-btn');

  function applyFilter(filter) {
    activeFilter = filter;
    $$('.project-card').forEach(card => {
      const match = filter === 'all' || card.dataset.category === filter;
      card.style.display = match ? '' : 'none';
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilter(btn.dataset.filter);
    });
  });


  const editContactBtn = $('#editContactBtn');
  const editContactModal = $('#editContactModal');
  const closeContactModal = $('#closeContactModal');
  const submitContact = $('#submitContact');
  const contactEmail = $('#contactEmail');
  const contactGithub = $('#contactGithub');

  if (state.contact) {
    if (state.contact.email) {
      contactEmail.href = `mailto:${state.contact.email}`;
      contactEmail.childNodes[contactEmail.childNodes.length - 1].textContent = state.contact.email;
    }
    if (state.contact.github) {
      contactGithub.href = state.contact.github;
    }
  }

  editContactBtn.addEventListener('click', () => {
    $('#editEmail').value = state.contact?.email || '';
    $('#editGithub').value = state.contact?.github || '';
    editContactModal.classList.add('open');
  });

  closeContactModal.addEventListener('click', () => editContactModal.classList.remove('open'));
  editContactModal.addEventListener('click', (e) => { if (e.target === editContactModal) editContactModal.classList.remove('open'); });

  submitContact.addEventListener('click', () => {
    const email = $('#editEmail').value.trim();
    const github = $('#editGithub').value.trim();
    if (email) {
      contactEmail.href = `mailto:${email}`;
      contactEmail.childNodes[contactEmail.childNodes.length - 1].textContent = email;
    }
    if (github) {
      contactGithub.href = github;
    }
    state.contact = { email, github };
    saveState();
    editContactModal.classList.remove('open');
  });


  $('#footerYear').textContent = new Date().getFullYear();


  function loadState() {
    try {
      const raw = localStorage.getItem('seanPortfolioState');
      return raw ? JSON.parse(raw) : { tags: [], projects: [], timeline: null, bio: '', photo: null, contact: {} };
    } catch {
      return { tags: [], projects: [], timeline: null, bio: '', photo: null, contact: {} };
    }
  }

  function saveState() {
    try {
      localStorage.setItem('seanPortfolioState', JSON.stringify(state));
    } catch {
    }
  }

});
