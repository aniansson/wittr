import idb from 'idb';

// https://github.com/jakearchibald/idb <-- more info
// Create a DB, .open returns a promise hich we can store inside an object
// dbPromise == an object, to get and set items in the DB
var dbPromise = idb.open('test-db', 1, function(upgradeDb) {
  // Create an object store called keyVal
  var keyValStore = upgradeDb.createObjectStore('keyval');
  // Add item and key to store
  keyValStore.put("world", "hello");
});

// Read from the DB
// read "hello" in "keyval"
dbPromise.then(function(db) {
  var tx = db.transaction('keyval');
  var keyValStore = tx.objectStore('keyval');
  return keyValStore.get('hello');
}).then(function(val) {
  console.log('The value of "hello" is:', val);
});

// set "foo" to be "bar" in "keyval"
dbPromise.then(function(db) {
  var tx = db.transaction('keyval', 'readwrite');
  var keyValStore = tx.objectStore('keyval');
  keyValStore.put('bar', 'foo');
  return tx.complete;
}).then(function() {
  console.log('Added foo:bar to keyval');
});

dbPromise.then(function(db) {
  // 4.3
  // TODO: in the keyval store, set
  // "favoriteAnimal" to your favourite animal
  // eg "cat" or "dog"
  var tx = db.transaction('keyval', 'readwrite');
  var keyValStore = tx.objectStore('keyval');
  // Add item and key to DB
  keyValStore.put('cat', 'favoriteAnimal');
  // Return the key
  return keyValStore.get('favoriteAnimal');
}).then(function(val) {
  // console.log the item for the key
  console.log('My "favoriteAnimal" is', val);
});