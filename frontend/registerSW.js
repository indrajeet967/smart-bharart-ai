if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ ServiceWorker registered successfully with scope: ', registration.scope);
      })
      .catch((error) => {
        console.error('❌ ServiceWorker registration failed: ', error);
      });
  });
}
