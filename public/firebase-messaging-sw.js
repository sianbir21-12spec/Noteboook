self.addEventListener('push', event => {
  const data = event.data.json();
  const title = data.title || 'New Message';
  const options = {
    body: data.body,
    icon: '/favicon.ico',
    tag: data.tag,
  };
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});