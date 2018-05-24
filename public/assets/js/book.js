var bookListArea = document.querySelector('#booklist');
var addBook = document.querySelector('#addBook');
var bookTitle = document.querySelector('#bookTitle');
var bookComment = document.querySelector('#bookComment');



function clearCards(){
    while(bookListArea.hasChildNodes()) {
        bookListArea.removeChild(bookListArea.lastChild);
    }
}

function showBooks(data){
    var bookPanel = document.createElement('div');
    bookPanel.className = 'col-sm-6 col-lg-3';
    var bookBlock = document.createElement('div');
    bookBlock.className = 'block';
    bookPanel.appendChild(bookBlock);
    var bookContent = document.createElement('div');
    bookContent.className = 'block-content';
    bookContent.setAttribute('data-toggle', 'modal');
    bookContent.setAttribute('data-target', '#modal-viewbook');
    bookBlock.appendChild(bookContent);
    var bookText = document.createElement('p');
    bookText.textContent = data.title;
    bookContent.appendChild(bookText);
    // componentHandler.upgradeElement(bookPanel);
    bookListArea.appendChild(bookPanel);
}

function dummybook(data){
    clearCards();
    for (var i = 0; i < data.length; i++){
        showBooks(data[i]);
    }
}

var url = 'https://bookie-36a53.firebaseio.com/Books.json';
var networkDataReceived = false;                                      

    fetch(url)
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    networkDataReceived = true;
    console.log('From web', data);
    var dataArray = [];
    for (var key in data) {
      dataArray.push(data[key]);
    }
    dummybook(dataArray);
  });

if ('indexedDB' in window) {
  readAllData('books')
    .then(function(data){
      if(!networkDataReceived){
        console.log('From cache', data);
        dummybook(data)
      }
    })
}

function sendBookData(){
  fetch('https://us-central1-bookie-36a53.cloudfunctions.net/storeBookData',{
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      id: new Date().toISOString(),
      title: bookTitle.value,
      comment: bookComment.value,
      image: 'https://firebasestorage.googleapis.com/v0/b/bookie-36a53.appspot.com/o/myAvatar%20(2).png?alt=media&token=fa7b5ae6-6fb4-45cd-a714-910eda7f1724',
      read: 'No',
      reread: 'No'
    })
  })
  .then(function(res){
    console.log('Sent data', res);
    dummybook();
  })
  .catch(function(err){
    console.log('Error for direct sending of data', err);
  })
}

addBook.addEventListener('submit', function(event){
  event.preventDefault();

  if(bookTitle.value.trim() === '' || bookComment.value.trim() === ''){
    var msg = "Please enter valid data";
    toaster(msg, 4000);
    return;
  }

  if('serviceWorker' in navigator && 'SyncManager' in window){
    navigator.serviceWorker.ready
      .then(function(sw){
        var book = {
          id: new Date().toISOString(),
          title: bookTitle.value,
          comment: bookComment.value, 
          read: 'No',
          reread: 'No',
          image: 'https://firebasestorage.googleapis.com/v0/b/bookie-36a53.appspot.com/o/myAvatar%20(2).png?alt=media&token=fa7b5ae6-6fb4-45cd-a714-910eda7f1724',
        };
        console.log('Form data', book);
        writeData('sync-books', book)
          .then(function(){
            sw.sync.register('sync-new-books');            
            console.log('New Sync registered!...')
          })
          .then(function(){
            var msg = "Your new book has been added";
            toaster(msg, 4000)
          })
          .catch(function(err){
            console.log('Error syncing data',err)
          })
      });
    // sendBookData();
  } else {
    sendBookData()
    // console.log('Not sent');
  }

  // sendBookData();
})

