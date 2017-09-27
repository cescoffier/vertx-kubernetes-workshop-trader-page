import ExamplePage from './ExamplePage.vue';

if (!window.vertxConsoleRoutes) window.vertxConsoleRoutes = [];
window.vertxConsoleRoutes.push({
    path: '/example',
    component: ExamplePage
});
