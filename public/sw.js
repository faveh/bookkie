
importScripts('assets/js/idb.js');
importScripts('assets/js/utility.js');

var cache_static_name = 'static-v3';
var cache_dynamic_name = 'dynamic-v2';
var cache_file = [
    '/',
    '/index.html',
    '/assets/img/favicons/favicon.png',
    '/assets/css/bootstrap.min.css',
    '/assets/css/oneui.css',
    '/assets/img/avatars/avatar10.jpg',
    '/assets/js/core/jquery.min.js',
    '/assets/js/core/bootstrap.min.js',
    '/assets/js/core/jquery.slimscroll.min.js',
    '/assets/js/core/jquery.scrollLock.min.js',
    '/assets/js/core/jquery.appear.min.js',
    '/assets/js/core/jquery.countTo.min.js',
    '/assets/js/core/jquery.placeholder.min.js',
    '/assets/js/core/js.cookie.min.js',
    '/assets/js/app.js',
    '/assets/js/utility.js',
    '/assets/js/promise.js',
    '/assets/js/fetch.js',
    '/assets/js/idb.js',
    '/assets/js/main.js',
    '/assets/js/book.js'
    
];


self.addEventListener('install', function(event){
    event.waitUntil(
        caches.open(cache_static_name)
            .then(function(cache){
                console.log('[Service WOrker] Precaching App Shell');
                cache.addAll(cache_file);
                
            })
            .catch(function(err){
                console.log('Error from cache...', err)
            })
    )
});
// static updates
self.addEventListener('activate', function(event){
    event.waitUntil(
        caches.keys()
            .then(function(keyList){
                return Promise.all(keyList.map(function(key){
                    if (key !== cache_static_name && key !== cache_dynamic_name){
                        console.log('[Service Worker] Removing an old caching.', key);
                        return caches.delete(key);
                    }
                }));
            })
    );
    return self.clients.claim();
});

function isInArray(string, array) {
    var cachePath;
    if (string.indexOf(self.origin) === 0) { // request targets domain where we serve the page from (i.e. NOT a CDN)
      // console.log('matched ', string); so
      cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
    } else {
      cachePath = string; // store the full request (for CDNs)
    }
    return array.indexOf(cachePath) > -1;
  }

self.addEventListener('fetch', function(event){
  
    var url = 'https://bookie-36a53.firebaseio.com/Books';
  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(fetch(event.request)
            .then(function (res) {
              var cloneRes = res.clone();
              clearAllData('books')
                .then(function(){
                return cloneRes.json();
                }).then(function(data){
                  for (var key in data) {
                      writeData('books', data[key])
                    }
              });
              
              return res;
            })
    );
  } else if (isInArray(event.request.url, cache_file)) {
    event.respondWith(
      caches.match(event.request)
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(function (response) {
          if (response) {
            return response;
          } else {
            return fetch(event.request)
            .then(function (res) {
              return caches.open(cache_dynamic_name)
                .then(function (cache) {
                  // trimCache(CACHE_DYNAMIC_NAME, 3);
                  cache.put(event.request.url, res.clone());
                  return res;
                })
            })
            .catch(function (err) {
              return caches.open(cache_static_name)
                .then(function (cache) {
                  if (event.request.headers.get('accept').includes('text/html')) {
                    return cache.match('/404.html');
                  }
                });
            });
            
          }
        })
    );
  }
}); 

self.addEventListener('sync', function(event){
  console.log('[Service Worker] Background syncing', event);
  if(event.tag === 'sync-new-books'){
    console.log('Syncing new books');
    event.waitUntil(
      readAllData('sync-books')
        .then(function(data){
          for(var dt of data){
            fetch('https://us-central1-bookie-36a53.cloudfunctions.net/storeBookData',{
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                id: dt.id,
                title: dt.title,
                comment: dt.comment,
                read: dt.read,
                reread: dt.reread,
                image: 'https://firebasestorage.googleapis.com/v0/b/bookie-36a53.appspot.com/o/myAvatar%20(2).png?alt=media&token=fa7b5ae6-6fb4-45cd-a714-910eda7f1724',

              })
            })
            .then(function(res){
              console.log('Sent data', res);
                if(res.ok){ 
                  res.json()
                    .then(function(resData){
                        deleteItemFromData('sync-books', resData.id)                        
                    })
                }
            })
            .catch(function(err){
              console.log('Error while sending data', err);
            });
          }
          
        })
    );

  }
});


self.addEventListener('notificationclick', function(event){
  var notification = event.notification;
  var action = event.action;

  console.log(notification);

  if (action === 'confirm'){
    console.log('Confrim was chosen');
    notification.close();
  }else{
    console.log(action);
    event.waitUntil(
      clients.matchAll()
        .then(function(clis){
          var client = clis.find(function(c){
            return c.visibiltyState === 'visible'
          });

          if (client !== undefined){
            client.navigate(notification.data.url);
            client.focus();
          }else{
            clients.openWindow(notification.data.url)
          }
          notification.close();
        })
    );
  }
});

self.addEventListener('notificationclose', function(event){
  console.log('Notification was closed', event);
});


self.addEventListener('push', function(event){
  console.log('Push Notificaion received', event);

  var data = {title: 'New!', Content: 'Something new happened', openUrl: '/'};

  if(event.data){
    data = JSON.parse(event.data.text());
  }

  var options = {
    body: data.content,
    icon: '/assets/img/favicons/apple-touch-icon-76x76.png',
    badge: '/assets/img/favicons/apple-touch-icon-76x76.png',
    data: {
      url: data.openUrl
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});