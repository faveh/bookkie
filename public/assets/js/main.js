if (!window.Promise) {
  window.Promise = Promise;
}

if ('serviceWorker' in navigator){
    navigator.serviceWorker
        .register('/sw.js')
        .then(function(){
            console.log('Service Worker registered');
        });
}

var toastContainer = document.querySelector('.toast__container');
var notification = document.querySelector('#notify')
// (function (exports) {
    // 'use strict';
  
   
    //To show notification
    function toaster(msg, options) {
      if (!msg) return;
  
      options = options || 3000;
  
      var toastMsg = document.createElement('div');
      
      toastMsg.className = 'toast__msg';
      toastMsg.textContent = msg;
  
      toastContainer.appendChild(toastMsg);
  
      //Show toast for 3secs and hide it
      setTimeout(function () {
        toastMsg.classList.add('toast__msg--hide');
      }, options);
  
      //Remove the element after hiding
      toastMsg.addEventListener('transitionend', function (event) {
        event.target.parentNode.removeChild(event.target);
      });
    }

    function displayConfirmNotification(){
      if ('serviceWorker' in navigator){
        var options = {
          body: 'You successfully subscribed to our Notification service',
          icon: '/assets/img/favicons/apple-touch-icon-76x76.png',
          image: '/assets/img/favicons/apple-touch-icon-76x76.png',
          dir: 'ltr',
          lang: 'en-US',
          vibrate: [100, 50, 200],
          badge: '/assets/img/favicons/apple-touch-icon-76x76.png',
          tag: 'confirm-notification',
          renotify: true,
          actions: [
            { action: 'confirm', title: 'Okay', icon: '/assets/img/favicons/apple-touch-icon-76x76.png'},
            { action: 'cancel', title: 'Cancel', icon: '/assets/img/favicons/apple-touch-icon-76x76.png'},
          ]
        };
        navigator.serviceWorker.ready
          .then(function(swreg){
            swreg.showNotification('Successfully subscribed woow', options);
          });
      }
    }


    function configurePushSub(){
      if (!('serviceWorker' in navigator)){
        return;
      }

      var reg;
      navigator.serviceWorker.ready
        .then(function(swreg){
          reg = swreg
          return swreg.pushManager.getSubscription();
        })
        .then(function(sub){
          if (sub === null){
            // create a new subscription
            var vapidPublicKey = 'BPLve47BdV6lNozC9_aJIBhFtQgkFH0YylXcyZ_wdNu7ydDw5Ahxe4mBMnPCXbvy_hpJbjlv8mNXaplY5RvYN3o';
            var convertVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
            return reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: convertVapidPublicKey
            });
          }else {
            // I already have a subscription
          }
        })
        .then(function(newSub){
          return fetch('https://bookie-36a53.firebaseio.com/subscriptions.json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
                },
              body: JSON.stringify(newSub)
          })
        })
        .then(function(res){
          // return res.json();
          if(res.ok){

          displayConfirmNotification();            
          }
        })
        .catch(function(err){
          console.log(err);
        });
    }

    function askForNotification(){
      Notification.requestPermission(function(result){
        console.log('User Choice', result);
        if (result !== 'granted'){
          console.log('No notification permission');
        } else{
            configurePushSub();
            // displayConfirmNotification()
        }
      });
    }

  if('Notification' in window && 'serviceWorker' in navigator){
    notification.style.display = 'inline-block';
    notification.addEventListener('click', askForNotification)
  } 