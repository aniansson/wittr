import PostsView from './views/Posts';
import ToastsView from './views/Toasts';
import idb from 'idb';

export default function IndexController(container) {
  this._container = container;
  this._postsView = new PostsView(this._container);
  this._toastsView = new ToastsView(this._container);
  this._lostConnectionToast = null;
  this._openSocket();
  this._registerServiceWorker();
}

IndexController.prototype._registerServiceWorker = function() {
  if (!navigator.serviceWorker) return;

  var indexController = this;

  navigator.serviceWorker.register('/sw.js').then(function(reg) {
    // 3.21
    // TODO: if there's no controller, this page wasn't loaded
    // via a service worker, so they're looking at the latest version.
    // In that case, exit early

    // There is no controller and therefore the page will be loaded through the network;
    if (!navigator.serviceWorker.controller) {
      return;
    }

    // 3.21
    // TODO: if there's an updated worker already waiting, call
    // indexController._updateReady()

    // There is an update ready and waiting call the private method _updateReady in the indexController
    if (reg.waiting) {
      indexController._updateReady();
      return;
    }

    // 3.21
    // TODO: if there's an updated worker installing, track its
    // progress. If it becomes "installed", call
    // indexController._updateReady()

    // Track the progress of the updated worker in the private method _trackInstalling
    if (reg.installing) {
      indexController._trackInstalling(reg.installing);
      return;
    }

    // 3.21
    // TODO: otherwise, listen for new installing workers arriving.
    // If one arrives, track its progress.
    // If it becomes "installed", call
    // indexController._updateReady()

    // Registrating an eventListener to see if there are any updates found. 
    // If there is it should track its progress in the private method _trackInstalling
    reg.addEventListener('updatefound', function() {
      indexController._trackInstalling(reg.installing);
    })
  });
};

// Create a joint method for tracking the progress of workers
IndexController.prototype._trackInstalling = function(worker) {
  var indexController = this;

  // Event listener checking if the SW state is == installed, if it, is it should call the method indexController._updateReady()
  worker.addEventListener('stateChange', function() {
    if (worker.state == 'installed') {
      indexController._updateReady();
    }
  })
}

IndexController.prototype._updateReady = function() {
  var toast = this._toastsView.show("New version available", {
    buttons: ['whatever']
  });
};

// open a connection to the server for live updates
IndexController.prototype._openSocket = function() {
  var indexController = this;
  var latestPostDate = this._postsView.getLatestPostDate();

  // create a url pointing to /updates with the ws protocol
  var socketUrl = new URL('/updates', window.location);
  socketUrl.protocol = 'ws';

  if (latestPostDate) {
    socketUrl.search = 'since=' + latestPostDate.valueOf();
  }

  // this is a little hack for the settings page's tests,
  // it isn't needed for Wittr
  socketUrl.search += '&' + location.search.slice(1);

  var ws = new WebSocket(socketUrl.href);

  // add listeners
  ws.addEventListener('open', function() {
    if (indexController._lostConnectionToast) {
      indexController._lostConnectionToast.hide();
    }
  });

  ws.addEventListener('message', function(event) {
    requestAnimationFrame(function() {
      indexController._onSocketMessage(event.data);
    });
  });

  ws.addEventListener('close', function() {
    // tell the user
    if (!indexController._lostConnectionToast) {
      indexController._lostConnectionToast = indexController._toastsView.show("Unable to connect. Retrying…");
    }

    // try and reconnect in 5 seconds
    setTimeout(function() {
      indexController._openSocket();
    }, 5000);
  });
};

// called when the web socket sends message data
IndexController.prototype._onSocketMessage = function(data) {
  var messages = JSON.parse(data);
  this._postsView.addPosts(messages);
};