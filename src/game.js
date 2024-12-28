import * as PIXI from "pixi.js";
import { root } from "postcss";
import { loadAssets } from "./common/assets";
import appConstants from "./common/constants";
import { bulletTick, clearBullets, destroyBullet, initBullets } from "./sprites/bullets";
import {
  addPlayer,
  getPlayer,
  lockPlayer,
  playerShoots,
  playerTick,
} from "./sprites/player";
import {
  initEnemies,
  addEnemy,
  enemyTick,
  destroyEnemy,
} from "./sprites/enemy.js";
import { bombTick, clearBombs, destroyBomb, initBombs } from "./sprites/bombs.js";
import { checkCollision, destroySprite } from "./common/utils.js";
import { explosionTick, initExplosions } from "./sprites/explosions.js";
import { initInfo, initTimer } from "./sprites/infoPanel.js";
import { EventHub, gameOver, resetUfo, resetShootCountAndTime } from "./common/eventHub.js";
import { play } from "./common/sound";
import { getYouWin, getGameOver } from "./sprites/messages.js";
import { initShootCounter, updateTimerDisplay } from './sprites/infoPanel'
import { asteroidTick, initAsteroids, addAsteroid } from "./sprites/asteroids.js";


const WIDTH = appConstants.size.WIDTH;
const HEIGHT = appConstants.size.HEIGHT;

const gameState = {
  stopped: false,
  moveLeftActive: false,
  moveRightActive: false,
};

let rootContainer;

const createScene = () => {
  const app = new PIXI.Application({
    background: "#000000",
    antialias: true,
    width: WIDTH,
    height: HEIGHT,
  });
  app.view.id = "gameCanvas";
  document.body.appendChild(app.view);
  gameState.app = app;
  rootContainer = app.stage;
  rootContainer.interactive = true;
  rootContainer.hitArea = app.screen;

  const backgroundTexture = PIXI.Texture.from(
    "/assets/sprites/ui/space.jpg"
  );
  const background = new PIXI.Sprite(backgroundTexture);

  background.width = WIDTH;
  background.height = HEIGHT;

  rootContainer.addChild(background);

  initInfo(app, rootContainer);
  initShootCounter(app, rootContainer);
  initTimer(app, rootContainer)
  updateTimerDisplay(gameState);

  const bullets = initBullets(app, rootContainer);
  rootContainer.addChild(bullets);

  const player = addPlayer(app, rootContainer);
  rootContainer.addChild(player);

  const enemies = initEnemies(app, rootContainer);
  addEnemy();
  rootContainer.addChild(enemies);

  const bombs = initBombs(app, rootContainer);
  rootContainer.addChild(bombs);

  const asteroids = initAsteroids(app, rootContainer);
  rootContainer.addChild(asteroids)
  for (let i = 0; i < 10; i++) {
  addAsteroid();
  }
  

  initExplosions(app, rootContainer);

  return app;
};

const checkAllCollisions = () => {
  // Функція для перевірки колізій обєктів
  const enemies = rootContainer.getChildByName(appConstants.containers.enemies); // Отримуємо контейнери
  const bullets = rootContainer.getChildByName(appConstants.containers.bullets);
  const bombs = rootContainer.getChildByName(appConstants.containers.bombs);
  const player = rootContainer.getChildByName(appConstants.containers.player);
  const asteroids = rootContainer.getChildByName(appConstants.containers.asteroids)

  if (enemies && bullets) {
    // Перевіряємо чи зіткнулися обєкти противника та кулі
    const toRemove = [];
    bullets.children.forEach((b) => {
      enemies.children.forEach((e) => {
        if (e && b) {
          if (checkCollision(e, b)) {
            toRemove.push(b);
            toRemove.push(e);
            //    destroyBullet(b); // Видаляємо кулю
            //    destroyEnemy(e); // Видаляємо ворога
          }
        }
      });
    });
    toRemove.forEach((sprite) => {
      sprite.destroyMe()
    });
  }
  if (bombs && bullets) {
      // Перевіряємо чи зіткнулися обєкти пострілу противника та пострілу гравця
      const toRemove = [];
    bombs.children.forEach((bomb) => {
      bullets.children.forEach((b) => {
          if (checkCollision(bomb, b)) {
              toRemove.push(b)
              toRemove.push(bomb)
        //  destroyBullet(b); // Видаляємо кулю
        //  destroyBomb(bomb); // Видаляємо ворога
        }
      });
    });
      toRemove.forEach((sprite) => {
      sprite.destroyMe()
    });
  }
  if (player && bombs) {
    // Перевіряємо чи зіткнулися обєкти пострілу противника та гравця
    const toRemuve = [];
    bombs.children.forEach((b) => {
      if (checkCollision(b, player)) {
        toRemuve.push(b); // Видаляємо кулю
        lockPlayer();
        // Тут потрібно буде додати лічилькик потраплянь по прибульцю
      }
    });
    toRemuve.forEach((b) => {
      destroyBomb(b);
    });
  }
  if (bullets && asteroids) {
    const toRemove = [];
    bullets.children.forEach((b) => {
      asteroids.children.forEach((asteroid) => {
        if (asteroid && b) {
          if (checkCollision(asteroid, b)) {
            toRemove.push(b);
            toRemove.push(asteroid);
          }
        }
      });
    });
    toRemove.forEach((sprite) => {
      sprite.destroyMe()
    });
  }
};

const initInteraction = () => {
  gameState.mousePosition = getPlayer().position.x;

  gameState.app.stage.addEventListener("pointermove", (e) => {
    gameState.mousePosition = e.global.x;
  });

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      playerShoots();
    }
  });

  gameState.app.ticker.add((delta) => {
    // Даний код оновлює те, що відбвається на екрані
    playerTick(gameState);
    bulletTick();
    enemyTick();
    bombTick();
    explosionTick();
    asteroidTick();
    checkAllCollisions();
  });
};

export const initGame = () => {
  loadAssets((progress) => {
    if (progress === "all") {
      createScene();
      initInteraction();
    }
  });
};


const restartGame = () => {
  clearBombs()
  clearBullets() 
  resetUfo()
  resetShootCountAndTime()
}

EventHub.on(appConstants.events.youWin, () => {
  gameState.app.ticker.stop()
  rootContainer.addChild(getYouWin())
  setTimeout(()=>play(appConstants.sounds.youWin), 1000)
})

EventHub.on(appConstants.events.gameOver, () => {
  gameState.app.ticker.stop()
  rootContainer.addChild(getGameOver())
  setTimeout(()=>play(appConstants.sounds.gameOver), 1000)
})

EventHub.on(appConstants.events.restartGame, (event) => {
  
  restartGame()
  if(event === appConstants.events.gameOver){
    rootContainer.removeChild(getGameOver())

  }
  if(event === appConstants.events.youWin){
    rootContainer.removeChild(getYouWin())
  }
  gameState.app.ticker.start()
})