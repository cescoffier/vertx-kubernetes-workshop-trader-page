import TraderPage from './TraderPage.vue';

if (!window.vertxConsoleRoutes) window.vertxConsoleRoutes = [];
window.vertxConsoleRoutes.push({
    path: '/trader',
    component: TraderPage
});
