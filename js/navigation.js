// Navigation management
const pageModules = {};

function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));

  const page = document.getElementById(`page-${pageId}`);
  const link = document.querySelector(`[data-page="${pageId}"]`);

  if (page) page.classList.remove('hidden');
  if (link) link.classList.add('active');

  // Load module data when navigating
  if (pageModules[pageId]) {
    pageModules[pageId].load();
  }
}

document.querySelectorAll('[data-page]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo(link.dataset.page);
  });
});

function registerPageModule(pageId, module) {
  pageModules[pageId] = module;
}
