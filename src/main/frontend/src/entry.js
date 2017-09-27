import TraderVue from './TraderVue.vue';

if (!window.vertxConsoleRoutes) window.vertxConsoleRoutes = [];
window.vertxConsoleRoutes.push({
    path: '/trader',
    component: TraderVue
});
