function HTMLActuator() {
  this.tileContainer    = document.querySelector(".tile-container");
  this.scoreContainer   = document.querySelector(".score-container");
  this.bestContainer    = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message");
  this.sharingContainer = document.querySelector(".score-sharing");

  this.score = 0;
}

HTMLActuator.prototype.actuate = function (grid, metadata) {
  var self = this;

  window.requestAnimationFrame(function () {
    self.clearContainer(self.tileContainer);

    grid.cells.forEach(function (column) {
      column.forEach(function (cell) {
        if (cell) {
          self.addTile(cell);
        }
      });
    });

    self.updateScore(metadata.score);
    self.updateBestScore(metadata.bestScore);
    self.updateMaxTileValue(metadata.maxTileValue);

    if (metadata.terminated) {
      if (metadata.over) {
        self.message(false); // You lose
      } else if (metadata.won) {
        self.message(true); // You win!
      }
    }

  });
};

// Continues the game (both restart and keep playing)
HTMLActuator.prototype.continueGame = function () {
  if (typeof ga !== "undefined") {
    ga("send", "event", "game", "restart");
  }

  this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

HTMLActuator.prototype.addTile = function (tile) {
  var self = this;

  var wrapper   = document.createElement("div");
  var inner     = document.createElement("div");
  var position  = tile.previousPosition || { x: tile.x, y: tile.y };
  var positionClass = this.positionClass(position);

  // We can't use classlist because it somehow glitches when replacing classes
  var classes = ["tile", "tile-" + tile.value, positionClass];

  if (tile.value > 2048) classes.push("tile-super");

  this.applyClasses(wrapper, classes);

  inner.classList.add("tile-inner");
  //inner.textContent = tile.value;

  if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
    window.requestAnimationFrame(function () {
      classes[2] = self.positionClass({ x: tile.x, y: tile.y });
      self.applyClasses(wrapper, classes); // Update the position
    });
  } else if (tile.mergedFrom) {
    classes.push("tile-merged");
    this.applyClasses(wrapper, classes);

    // Render the tiles that merged
    tile.mergedFrom.forEach(function (merged) {
      self.addTile(merged);
    });
  } else {
    classes.push("tile-new");
    this.applyClasses(wrapper, classes);
  }

  // Add the inner part of the tile to the wrapper
  wrapper.appendChild(inner);

  // Put the tile on the board
  this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
  return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function (position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function (score) {
  this.clearContainer(this.scoreContainer);

  var difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = this.score;

  if (difference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "+" + difference;

    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.updateMaxTileValue = function(maxTileValue) {
  this.maxTileValue = maxTileValue;
};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
  this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.message = function (won) {
  var type    = won ? "game-won" : "game-over";
  var message = won ? "¡Ganaste!" : "¡Perdiste!";

  if (typeof ga !== "undefined") {
    ga("send", "event", "game", "end", type, this.score);
  }

  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName("p")[0].textContent = message;

  this.clearContainer(this.sharingContainer);
  this.sharingContainer.appendChild(this.scoreTweetButton());
  twttr.widgets.load();
};

HTMLActuator.prototype.clearMessage = function () {
  // IE only takes one value to remove at a time.
  this.messageContainer.classList.remove("game-won");
  this.messageContainer.classList.remove("game-over");
};

HTMLActuator.prototype.scoreTweetButton = function () {
  var tweet = document.createElement("a");
  tweet.classList.add("twitter-share-button");
  tweet.setAttribute("href", "https://twitter.com/share");
  tweet.setAttribute("data-url", "http://mgarciaisaia.github.io/2048dbz/");
  tweet.setAttribute("data-counturl", "http://mgarciaisaia.github.io/2048dbz/");
  tweet.textContent = "Tweet";

  var textosSegunFase = {
    2: '¡Hola, soy Gokú!',
    4: '¡Hola, soy Gokú! ¡Y me convertí en un mono gigante!',
    8: '¡Terminé de entrenar con Kamisama y derrotaré a Piccoro!',
    16: '¡Ya verás Vegeta! ¡Kaioken!',
    32: '¡Yo soy el supersaiyajín Gokú! Por todos los guerreros saiyajin que asesinaste, y también por todos los namekuseijin que mataste, juro que ¡¡TE EXTERMINARE!!',
    64: 'Éste es el que supera al supersaiyajín ordinario, admito que es muy poderoso.',
    128: '¡Prepárate Majin Boo! ¡Soy un supersaiyajín fase 3!',
    256: '¿Qué pasó? ¡Soy un niño otra vez!',
    512: '¡Este cuerpo no puede soportar tanto poder!, soy un supersaiyajín fase 3.',
    1024: '¡Soy Gokú y me convertí en un Ōzaru dorado!',
    2048: '¡Gané! ¡Logré convertirme en supersaiyajín fase 4!'
  };

  var text = textosSegunFase[this.maxTileValue] + " (¡Hice " + this.score + " puntos en 2048DBZ, un juego en que " +
             "unís Gokús para levelearlos!) #2048dbz #2048game #dbz";
  tweet.setAttribute("data-text", text);

  document.getElementById('fb-share').href = 'http://www.facebook.com/sharer.php?s=100&p[title]=2048DBZ&p[url]=http%3A%2F%2Fgit.io%2F2048dbz%2F&p[images][0]=http%3A%2F%2Fmgarciaisaia.github.io%2F2048dbz%2Ffavicon.ico' + encodeURIComponent(text);

  return tweet;
};
