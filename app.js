'use strict';

// ── Constants ──────────────────────────────────────────
const STORAGE_KEY = 'projectMuseum_v1';

// ── State ──────────────────────────────────────────────
let projects    = [];
let editingId   = null;   // id of project being edited, or null for "add"
let uploadedIcon = null;  // base64 data-URL from file upload

// ── DOM refs ───────────────────────────────────────────
const projectsGrid  = document.getElementById('projectsGrid');
const emptyState    = document.getElementById('emptyState');
const modal         = document.getElementById('modal');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalTitle    = document.getElementById('modalTitle');
const projectForm   = document.getElementById('projectForm');
const fName         = document.getElementById('projectName');
const fUrl          = document.getElementById('projectUrl');
const fDesc         = document.getElementById('projectDesc');
const fTags         = document.getElementById('projectTags');
const previewImg    = document.getElementById('previewImg');
const iconPreview   = document.getElementById('iconPreview');
const iconPlaceholder = document.getElementById('iconPlaceholder');
const iconUpload    = document.getElementById('iconUpload');
const searchInput   = document.getElementById('searchInput');

// ── Storage ────────────────────────────────────────────
function loadProjects() {
  try {
    projects = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    projects = [];
  }
}

function saveProjects() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

// ── Utilities ──────────────────────────────────────────
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/** Returns the Google favicon URL for a domain, or null on bad input. */
function faviconUrl(rawUrl) {
  try {
    const { hostname } = new URL(rawUrl);
    if (!hostname) return null;
    return 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(hostname) + '&sz=64';
  } catch {
    return null;
  }
}

/** True only for http(s) URLs — prevents javascript: injection. */
function isSafeUrl(url) {
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

/** Generate a coloured-initial SVG as a data-URL fallback icon. */
function initialSvg(name) {
  const initial = (name || '?').charAt(0).toUpperCase();
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (name.charCodeAt(i) + ((hash << 5) - hash)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  const bg = 'hsl(' + hue + ',50%,40%)';
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">' +
    '<rect width="64" height="64" rx="10" fill="' + bg + '"/>' +
    '<text x="32" y="42" font-family="system-ui,sans-serif" font-size="28" font-weight="700" ' +
    'text-anchor="middle" fill="white">' + escHtml(initial) + '</text>' +
    '</svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/** Escape HTML special characters. */
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Render ─────────────────────────────────────────────
function render(filter) {
  const q = (filter || '').trim().toLowerCase();
  const list = q
    ? projects.filter(function (p) {
        return (
          p.name.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.tags || []).some(function (t) { return t.toLowerCase().includes(q); })
        );
      })
    : projects;

  projectsGrid.innerHTML = '';

  if (list.length === 0) {
    emptyState.classList.add('visible');
  } else {
    emptyState.classList.remove('visible');
    list.forEach(function (p) {
      projectsGrid.appendChild(makeCard(p));
    });
  }
}

function makeCard(p) {
  const safeUrl = isSafeUrl(p.url) ? p.url : '#';
  // Prefer uploaded icon; fall back to Google favicon
  const iconSrc = p.icon || faviconUrl(p.url) || initialSvg(p.name);

  const tags = (p.tags || [])
    .map(function (t) { return '<span class="tag">' + escHtml(t) + '</span>'; })
    .join('');

  const card = document.createElement('article');
  card.className = 'project-card';

  // Build innerHTML using only escaped values
  card.innerHTML =
    '<div class="card-actions">' +
      '<button class="btn-card-action" data-id="' + escHtml(p.id) + '" data-action="edit" title="Edit project" aria-label="Edit ' + escHtml(p.name) + '">✏️</button>' +
      '<button class="btn-card-action delete" data-id="' + escHtml(p.id) + '" data-action="delete" title="Delete project" aria-label="Delete ' + escHtml(p.name) + '">🗑️</button>' +
    '</div>' +
    '<a class="card-link" href="' + escHtml(safeUrl) + '" target="_blank" rel="noopener noreferrer">' +
      '<div class="card-icon">' +
        '<img src="' + escHtml(iconSrc) + '" alt="" data-name="' + escHtml(p.name) + '" data-fallback="pending" />' +
      '</div>' +
      '<div class="card-body">' +
        '<h3 class="card-title">' + escHtml(p.name) + '</h3>' +
        (p.description ? '<p class="card-desc">' + escHtml(p.description) + '</p>' : '') +
        '<p class="card-url">' + escHtml(p.url) + '</p>' +
        (tags ? '<div class="card-tags">' + tags + '</div>' : '') +
      '</div>' +
      '<span class="card-open" aria-hidden="true">Open ↗</span>' +
    '</a>';

  // Image error → show initial avatar
  var img = card.querySelector('img');
  img.addEventListener('error', function () {
    if (this.dataset.fallback === 'pending') {
      this.dataset.fallback = 'done';
      this.src = initialSvg(this.dataset.name || '?');
    }
  });

  // Edit / Delete buttons
  card.querySelector('[data-action="edit"]').addEventListener('click', function (e) {
    e.preventDefault();
    openEdit(p.id);
  });
  card.querySelector('[data-action="delete"]').addEventListener('click', function (e) {
    e.preventDefault();
    deleteProject(p.id);
  });

  return card;
}

// ── Icon preview helpers ───────────────────────────────
function showIconPreview(src) {
  previewImg.src = src;
  previewImg.classList.add('show');
  iconPlaceholder.style.display = 'none';
}

function clearIconPreview() {
  previewImg.src = '';
  previewImg.classList.remove('show');
  iconPlaceholder.style.display = '';
}

// ── Modal open / close ────────────────────────────────
function openModal() {
  modal.classList.add('open');
  modalBackdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(function () { fName.focus(); }, 60);
}

function closeModal() {
  modal.classList.remove('open');
  modalBackdrop.classList.remove('open');
  document.body.style.overflow = '';
  clearValidation();
}

function openAdd() {
  editingId    = null;
  uploadedIcon = null;
  modalTitle.textContent = 'Add Project';
  projectForm.reset();
  clearIconPreview();
  openModal();
}

function openEdit(id) {
  var p = projects.find(function (x) { return x.id === id; });
  if (!p) return;
  editingId    = id;
  uploadedIcon = p.icon || null;   // keep existing uploaded icon (base64)
  modalTitle.textContent = 'Edit Project';
  fName.value  = p.name;
  fUrl.value   = p.url;
  fDesc.value  = p.description || '';
  fTags.value  = (p.tags || []).join(', ');

  // Show preview: custom icon > favicon > nothing
  var preview = p.icon || faviconUrl(p.url);
  if (preview) {
    showIconPreview(preview);
  } else {
    clearIconPreview();
  }
  openModal();
}

// ── CRUD ──────────────────────────────────────────────
function deleteProject(id) {
  if (!confirm('Delete this project?')) return;
  projects = projects.filter(function (p) { return p.id !== id; });
  saveProjects();
  render(searchInput.value);
}

// ── Form validation ───────────────────────────────────
function clearValidation() {
  fName.classList.remove('invalid');
  fUrl.classList.remove('invalid');
}

function validateForm(name, url) {
  var ok = true;
  if (!name) { fName.classList.add('invalid'); ok = false; }
  else         fName.classList.remove('invalid');

  if (!url || !isSafeUrl(url)) {
    fUrl.classList.add('invalid');
    if (!url) {
      fUrl.setCustomValidity('Please enter a URL');
    } else {
      fUrl.setCustomValidity('URL must start with http:// or https://');
    }
    ok = false;
  } else {
    fUrl.classList.remove('invalid');
    fUrl.setCustomValidity('');
  }
  return ok;
}

// ── Event listeners ───────────────────────────────────

// Open add modal
document.getElementById('btnAdd').addEventListener('click', openAdd);

// Close modal
document.getElementById('btnClose').addEventListener('click', closeModal);
document.getElementById('btnCancel').addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
});

// Auto-fetch icon
document.getElementById('btnFetchIcon').addEventListener('click', function () {
  var url = fUrl.value.trim();
  if (!url) { fUrl.focus(); fUrl.classList.add('invalid'); return; }
  var src = faviconUrl(url);
  if (!src) { alert('Could not determine domain. Make sure the URL is valid.'); return; }
  uploadedIcon = null;     // clear any uploaded icon
  showIconPreview(src);
});

// Upload icon
iconUpload.addEventListener('change', function (e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (ev) {
    uploadedIcon = ev.target.result;
    showIconPreview(uploadedIcon);
  };
  reader.readAsDataURL(file);
  e.target.value = ''; // allow re-selecting the same file
});

// Clear icon
document.getElementById('btnClearIcon').addEventListener('click', function () {
  uploadedIcon = null;
  clearIconPreview();
});

// Search
searchInput.addEventListener('input', function (e) {
  render(e.target.value);
});

// Clear invalid state on input
fName.addEventListener('input', function () { this.classList.remove('invalid'); });
fUrl.addEventListener('input', function () {
  this.classList.remove('invalid');
  this.setCustomValidity('');
});

// Form submit
projectForm.addEventListener('submit', function (e) {
  e.preventDefault();
  var name = fName.value.trim();
  var url  = fUrl.value.trim();

  if (!validateForm(name, url)) return;

  var tags = fTags.value
    .split(',')
    .map(function (t) { return t.trim(); })
    .filter(Boolean);

  if (editingId) {
    var idx = projects.findIndex(function (p) { return p.id === editingId; });
    if (idx !== -1) {
      projects[idx] = {
        id:          editingId,
        name:        name,
        url:         url,
        description: fDesc.value.trim(),
        tags:        tags,
        icon:        uploadedIcon || null,   // only store base64; favicons re-fetched at render
        createdAt:   projects[idx].createdAt,
        updatedAt:   new Date().toISOString()
      };
    }
  } else {
    projects.unshift({
      id:          uid(),
      name:        name,
      url:         url,
      description: fDesc.value.trim(),
      tags:        tags,
      icon:        uploadedIcon || null,
      createdAt:   new Date().toISOString()
    });
  }

  saveProjects();
  render(searchInput.value);
  closeModal();
});

// ── Init ──────────────────────────────────────────────
loadProjects();
render();
