// ECO.Game — основной модуль игры
ECO.Game = {
    // Состояние
    state: 'menu',
    level: 1,
    endless: false,
    theme: null,
    maze: null,
    entities: [],
    player: null,

    // Таймеры
    elapsedTime: 0,
    totalTime: 0,
    idleTimer: 0,
    idleExtraCount: 0,
    freezeTimer: 0,
    sneakersTimer: 0,
    compassTimer: 0,
    comboTimer: 0,
    comboCount: 0,
    levelCompleteTimer: 0,
    gameOverTimer: 0,
    wateringTimer: 0,

    // Счётчики
    trashCollected: 0,
    trashTotal: 0,
    totalTrashCollected: 0,
    compassActive: false,
    nearestTrash: null,
    levelStars: {},

    // Скин персонажа
    selectedSkin: 0,

    // Базовая скорость игрока (до бустов)
    _basePlayerSpeed: 0,

    init: function() {
        var canvas = document.getElementById('game-canvas');
        ECO.Renderer.init(canvas);
        ECO.Input.init();
        ECO.Audio.init();
        ECO.Facts.init();
        ECO.Sprites.initChibi();
        this._initLegend();

        // Загрузить сохранённые данные
        try {
            var t = parseInt(localStorage.getItem('eco_total_trash') || '0', 10);
            var s = parseInt(localStorage.getItem('eco_skin') || '0', 10);
            this.totalTrashCollected = isNaN(t) ? 0 : t;
            this.selectedSkin = isNaN(s) ? 0 : s;
        } catch(e) {}

        this.state = 'menu';

        // Обработка кликов
        var self = this;
        canvas.addEventListener('click', function(e) { self._handleClick(e); });
        canvas.addEventListener('touchend', function(e) {
            e.preventDefault(); // предотвратить ghost click
            var touch = e.changedTouches[0];
            if (touch) {
                self._handleClick({
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
            }
        });

        window.addEventListener('resize', function() {
            ECO.Renderer.resize();
            // Пересчитать tileSize и камеру если есть активный лабиринт
            if (self.maze) {
                ECO.Renderer.calcTileSize(self.maze.cols, self.maze.rows);
                if (self.player) {
                    var ts = ECO.Renderer.tileSize;
                    ECO.Renderer.camera.x = self.player.tileX * ts - ECO.Renderer.width / 2;
                    ECO.Renderer.camera.y = self.player.tileY * ts - ECO.Renderer.height / 2;
                }
            }
        });

        this._lastTime = performance.now();
        var self = this;

        // Единая функция обновления — вызывается из любого источника
        function doTick() {
            var now = performance.now();
            var dt = now - self._lastTime;
            if (dt < 4) return; // слишком часто — пропустить
            self._lastTime = now;
            try {
                if (!document.hidden) {
                    if (dt > 200) dt = 16;
                    if (dt < 1) dt = 1;
                    self._updateSplit(dt, Math.min(dt, ECO.Config.DT_CAP));
                    ECO.Renderer._dt = dt;
                    self._draw();
                }
            } catch (e) {
                console.error('Game loop error:', e);
                self._lastTime = performance.now();
            }
        }

        // Один game loop через requestAnimationFrame (оптимально для мобильных)
        function rafLoop() {
            doTick();
            requestAnimationFrame(rafLoop);
        }
        requestAnimationFrame(rafLoop);

        // Источник 3: вызов из input events (когда и setTimeout и rAF заблокированы)
        this._inputTick = doTick;
    },

    // rawDt = реальное время (для таймеров), physicsDt = capped (для движения)
    _updateSplit: function(rawDt, physicsDt) {
        if (this.state === 'playing') {
            this._updatePlaying(rawDt, physicsDt);
        } else if (this.state === 'watering') {
            this._updateWatering(rawDt, physicsDt);
        } else if (this.state === 'level_complete') {
            this.levelCompleteTimer -= rawDt;
            if (this.levelCompleteTimer <= 0) {
                this._nextLevel();
            }
        } else if (this.state === 'game_over') {
            this.gameOverTimer -= rawDt;
        }

        ECO.Animations.update(physicsDt);
    },

    _updatePlaying: function(rawDt, physicsDt) {
        // Таймер всегда считает реальное время (не троттлится)
        this.elapsedTime += rawDt;

        // Факты
        ECO.Facts.update(this.elapsedTime);

        // Обновить игрока (физика — capped dt)
        this.player.update(physicsDt, this.maze.grid);

        // Звук шагов при движении
        if (this.player.moving) {
            ECO.Audio.playStep(performance.now());
        }

        // Следы на снегу
        if (this.theme.snowTrails) {
            ECO.Renderer.addTrail(this.player.tileX, this.player.tileY, 'player');
        }

        // Обновить все сущности (физика — capped dt)
        for (var i = 0; i < this.entities.length; i++) {
            var e = this.entities[i];
            if (!e.active) continue;

            if (e.type === 'rat') {
                e.update(physicsDt, this.maze.grid, this.player.tileX, this.player.tileY);
                if (this.theme.snowTrails) {
                    ECO.Renderer.addTrail(e.tileX, e.tileY, 'rat');
                }
            } else if (e.type === 'cat_follower') {
                e.update(physicsDt, this.maze.grid, this.player.tileX, this.player.tileY);
            } else if (e.type === 'bucket' && e._hintCooldown > 0) {
                e._hintCooldown -= physicsDt;
            } else if (e.update) {
                e.update(physicsDt);
            }
        }

        // Таймеры пауэрапов (реальное время)
        if (this.freezeTimer > 0) {
            this.freezeTimer -= rawDt;
            if (this.freezeTimer <= 0) {
                this._unfreezeRats();
            }
        }
        if (this.sneakersTimer > 0) {
            this.sneakersTimer -= rawDt;
            if (this.sneakersTimer <= 0) {
                this.player.speed = this._basePlayerSpeed;
            }
        }
        if (this.compassTimer > 0) {
            this.compassTimer -= rawDt;
            if (this.compassTimer <= 0) {
                this.compassActive = false;
                this.nearestTrash = null;
            }
        }
        if (this.comboTimer > 0) {
            this.comboTimer -= rawDt;
            if (this.comboTimer <= 0) {
                this.comboCount = 0;
            }
        }

        // Компас — найти ближайший мусор
        if (this.compassActive) {
            this._updateNearestTrash();
        }

        // Idle penalty (реальное время)
        this.idleTimer += rawDt;
        if (this.idleTimer >= ECO.Config.IDLE_PENALTY_MS) {
            // Бесплатная подсказка: включить компас на 10 сек
            if (!this.compassActive) {
                this.compassActive = true;
                this.compassTimer = 10000;
                this._updateNearestTrash();
                ECO.Animations.spawnFloatingText(
                    this.player.pixelX + ECO.Renderer.tileSize / 2,
                    this.player.pixelY,
                    '🧭 Подсказка!', '#795548'
                );
            }
            // Дополнительный мусор
            if (this.idleExtraCount < ECO.Config.IDLE_MAX_EXTRA_TRASH) {
                this._spawnExtraTrash();
                this.idleExtraCount++;
            }
            this.idleTimer = 0;
        }

        // Проверка коллизий с сущностями
        this._checkCollisions();
    },

    _updateWatering: function(rawDt, physicsDt) {
        this.wateringTimer -= rawDt;

        // Крысы продолжают двигаться во время полива
        for (var i = 0; i < this.entities.length; i++) {
            var e = this.entities[i];
            if (e.active && e.type === 'rat') {
                e.update(physicsDt, this.maze.grid, this.player.tileX, this.player.tileY);
                // Проверить коллизию крысы с игроком
                if (!e.frozen && ECO.Collision.overlapPixel(this.player, e, ECO.Renderer.tileSize * 0.35)) {
                    this._hitByRat(e);
                    return;
                }
            }
        }

        // Анимация капель
        if (Math.random() < 0.3) {
            var ts = ECO.Renderer.tileSize;
            ECO.Animations.spawnWaterDrops(this.player.pixelX + ts / 2, this.player.pixelY);
        }
        if (this.wateringTimer <= 0) {
            // Цветок замораживает крыс
            this.freezeTimer = ECO.Config.CAT_FREEZE_DURATION;
            this._freezeRats();
            this.state = 'playing';
            ECO.Audio.playFreeze();
            ECO.Animations.spawnFloatingText(
                this.player.pixelX + ECO.Renderer.tileSize / 2,
                this.player.pixelY,
                '❄ Заморозка!', '#42A5F5'
            );
        }
    },

    _checkCollisions: function() {
        var player = this.player;
        var ts = ECO.Renderer.tileSize;
        var threshold = ts * 0.6;

        for (var i = 0; i < this.entities.length; i++) {
            var e = this.entities[i];
            if (!e.active || e === player) continue;

            // Крысы: только пиксельное перекрытие с жёстким порогом
            if (e.type === 'rat' && !e.frozen) {
                if (ECO.Collision.overlapPixel(player, e, ts * 0.35)) {
                    this._hitByRat(e);
                }
                continue;
            }

            if (!ECO.Collision.overlapPixel(player, e, threshold)) continue;

            switch (e.type) {
                case 'trash':
                    this._collectTrash(e);
                    break;
                case 'bucket':
                    this._depositTrash(e);
                    break;
                case 'exit':
                    if (e.isOpen) this._completeLevel();
                    break;
                case 'rat':
                    if (!e.frozen) this._hitByRat(e);
                    break;
                case 'cat_powerup':
                    this._collectCat(e);
                    break;
                case 'flower':
                    if (!e.watered) this._waterFlower(e);
                    break;
                case 'sneakers':
                    this._collectSneakers(e);
                    break;
                case 'compass':
                    this._collectCompass(e);
                    break;
            }
        }
    },

    _collectTrash: function(trash) {
        trash.active = false;
        this.trashCollected++;
        this.totalTrashCollected++;
        this.player.bagSize = this.trashCollected;

        // Скорость
        this._basePlayerSpeed += ECO.Config.SPEED_BOOST_PER_TRASH;
        this.player.speed = this._basePlayerSpeed;
        if (this.sneakersTimer > 0) {
            this.player.speed = this._basePlayerSpeed * ECO.Config.SNEAKERS_MULTIPLIER;
        }

        // Комбо
        if (this.comboTimer > 0) {
            this.comboCount++;
            if (this.comboCount >= 2) {
                ECO.Audio.playCombo();
                var ts = ECO.Renderer.tileSize;
                ECO.Animations.spawnFloatingText(
                    this.player.pixelX + ts / 2,
                    this.player.pixelY - ts * 0.3,
                    'Комбо x' + this.comboCount + '!', '#FFEB3B'
                );
                ECO.Animations.spawnSpeedFlash(this.player.pixelX + ts / 2, this.player.pixelY + ts / 2);
            }
        } else {
            this.comboCount = 1;
        }
        this.comboTimer = ECO.Config.COMBO_WINDOW;

        // Сброс idle
        this.idleTimer = 0;

        ECO.Audio.playPickup();

        // Сохранить
        try { localStorage.setItem('eco_total_trash', this.totalTrashCollected); } catch(e) {}
    },

    _depositTrash: function(bucket) {
        if (this.trashCollected < this.trashTotal) {
            var remaining = this.trashTotal - this.trashCollected;
            if (remaining <= 3 && !bucket._hintCooldown) {
                bucket.bounceTimer = 400;
                ECO.Animations.spawnFloatingText(
                    bucket.pixelX + ECO.Renderer.tileSize / 2,
                    bucket.pixelY - ECO.Renderer.tileSize * 0.3,
                    'Собери ещё ' + remaining + '!', '#FFB300'
                );
                bucket._hintCooldown = 2000; // не спамить
            }
            return;
        }
        if (bucket.isFull) return;

        bucket.isFull = true;
        bucket.bounceTimer = 600;
        this.player.bagSize = 0;

        // Показать и открыть выход
        for (var i = 0; i < this.entities.length; i++) {
            if (this.entities[i].type === 'exit') {
                this.entities[i].visible = true;
                this.entities[i].isOpen = true;
                this.entities[i].openProgress = 0; // запуск анимации
            }
        }

        // Дать щит игроку — награда за сдачу мусора
        this.player.hasShield = true;

        ECO.Audio.playExitOpen();
        var ts = ECO.Renderer.tileSize;
        ECO.Animations.spawnConfetti(bucket.pixelX + ts / 2, bucket.pixelY, 20);
        ECO.Animations.spawnFloatingText(
            bucket.pixelX + ts / 2, bucket.pixelY - ts * 0.3,
            '🛡 Щит + Выход открыт!', '#4CAF50'
        );
    },

    _completeLevel: function() {
        if (this.state !== 'playing') return;

        // Звёзды
        var levelDef = ECO.Levels.get(this.level, this.endless);
        var baseTime = levelDef.baseTime;
        var stars = 1;
        if (this.elapsedTime < baseTime * ECO.Config.STAR_3_TIME_MULTIPLIER) stars = 3;
        else if (this.elapsedTime < baseTime * ECO.Config.STAR_2_TIME_MULTIPLIER) stars = 2;

        this.levelStars[this.level] = Math.max(this.levelStars[this.level] || 0, stars);
        this.totalTime += this.elapsedTime;

        ECO.Audio.playLevelComplete();
        var ts = ECO.Renderer.tileSize;
        ECO.Animations.spawnConfetti(this.player.pixelX + ts / 2, this.player.pixelY, 40);

        this.state = 'level_complete';
        this.levelCompleteTimer = ECO.Config.LEVEL_COMPLETE_DELAY;
        this._currentStars = stars;
    },

    _hitByRat: function(rat) {
        if (this.state !== 'playing') return;
        if (this.player.hasShield) {
            // Щит отражает крысу
            rat.active = false;
            this.player.hasShield = false;
            ECO.Animations.spawnFloatingText(
                this.player.pixelX + ECO.Renderer.tileSize / 2,
                this.player.pixelY,
                'Щит спас!', '#FFEB3B'
            );
            return;
        }

        ECO.Audio.playGameOver();
        ECO.Audio.stopMusic();
        this.state = 'game_over';
        this.gameOverTimer = ECO.Config.GAME_OVER_DELAY;
    },

    _collectCat: function(catPowerup) {
        catPowerup.active = false;

        // Создать котика-охотника (бежит к крысам)
        var follower = ECO.Entities.createCatFollower(
            this.player.tileX, this.player.tileY,
            catPowerup.tileX, catPowerup.tileY
        );
        this.entities.push(follower);

        ECO.Audio.playPickup();
        ECO.Animations.spawnFloatingText(
            this.player.pixelX + ECO.Renderer.tileSize / 2,
            this.player.pixelY,
            '🐱 Охота!', '#FF9800'
        );
    },

    _freezeRats: function() {
        for (var i = 0; i < this.entities.length; i++) {
            if (this.entities[i].type === 'rat' && this.entities[i].active) {
                this.entities[i].frozen = true;
            }
        }
    },

    _unfreezeRats: function() {
        for (var i = 0; i < this.entities.length; i++) {
            if (this.entities[i].type === 'rat') {
                this.entities[i].frozen = false;
            }
        }
    },

    _waterFlower: function(flower) {
        if (this.state !== 'playing') return;
        flower.watered = true;
        this.state = 'watering';
        this.wateringTimer = ECO.Config.FLOWER_WATER_DURATION;
        ECO.Audio.playWater();
    },

    _collectSneakers: function(sneakers) {
        sneakers.active = false;
        this.sneakersTimer = ECO.Config.SNEAKERS_DURATION;
        this.player.speed = this._basePlayerSpeed * ECO.Config.SNEAKERS_MULTIPLIER;

        ECO.Audio.playPickup();
        ECO.Animations.spawnSpeedFlash(
            this.player.pixelX + ECO.Renderer.tileSize / 2,
            this.player.pixelY + ECO.Renderer.tileSize / 2
        );
        ECO.Animations.spawnFloatingText(
            this.player.pixelX + ECO.Renderer.tileSize / 2,
            this.player.pixelY,
            '👟 Скорость!', '#2196F3'
        );
    },

    _collectCompass: function(compass) {
        compass.active = false;
        this.compassTimer = ECO.Config.COMPASS_DURATION;
        this.compassActive = true;

        ECO.Audio.playPickup();
        ECO.Animations.spawnFloatingText(
            this.player.pixelX + ECO.Renderer.tileSize / 2,
            this.player.pixelY,
            '🧭 Компас!', '#795548'
        );
    },

    _updateNearestTrash: function() {
        var minDist = Infinity;
        this.nearestTrash = null;
        for (var i = 0; i < this.entities.length; i++) {
            var e = this.entities[i];
            if (e.type === 'trash' && e.active) {
                var d = ECO.Utils.euclidean(this.player.pixelX, this.player.pixelY, e.pixelX, e.pixelY);
                if (d < minDist) {
                    minDist = d;
                    this.nearestTrash = e;
                }
            }
        }
    },

    _spawnExtraTrash: function() {
        var key = function(x, y) { return x + ',' + y; };
        var occupied = {};
        for (var i = 0; i < this.entities.length; i++) {
            var e = this.entities[i];
            if (e.active) occupied[key(e.tileX, e.tileY)] = true;
        }
        occupied[key(this.player.tileX, this.player.tileY)] = true;

        var positions = ECO.Maze.findRandomFloorTiles(
            this.maze.grid, 1, occupied, this.maze.cols, this.maze.rows, 3, this.maze.distances
        );

        if (positions.length > 0) {
            var trash = ECO.Entities.createTrash(positions[0].x, positions[0].y);
            this.entities.push(trash);
            this.trashTotal++;
            ECO.Animations.spawnFloatingText(
                positions[0].x * ECO.Renderer.tileSize + ECO.Renderer.tileSize / 2,
                positions[0].y * ECO.Renderer.tileSize,
                'Мусор появился!', '#FF9800'
            );
        }
    },

    // ========= Управление уровнями =========

    startGame: function(endless) {
        ECO.Renderer._victoryStarted = false;
        this.endless = endless || false;
        this.level = 1;
        this.totalTime = 0;
        this.totalTrashCollected = parseInt(localStorage.getItem('eco_total_trash') || '0', 10);
        this.levelStars = {};
        this._loadLevel();
    },

    _nextLevel: function() {
        if (!this.endless && this.level >= ECO.Config.STORY_LEVELS) {
            // Финальная победа
            ECO.Audio.playVictory();
            ECO.Audio.stopMusic();
            this.state = 'victory';
            return;
        }
        this.level++;
        this._loadLevel();
    },

    _restartLevel: function() {
        if (!ECO.Audio.musicPlaying) ECO.Audio.startMusic(this._themeIndex);
        this._loadLevel();
    },

    _loadLevel: function() {
        var key = function(x, y) { return x + ',' + y; };

        var levelDef = ECO.Levels.get(this.level, this.endless);
        this.theme = ECO.Themes.getRandom();
        this._themeIndex = ECO.Themes._lastIndex;
        ECO.Audio.startMusic(this._themeIndex);
        var mazeDef = ECO.Maze.generate(levelDef.mazeCells, levelDef.mazeCells);

        this.maze = mazeDef;
        ECO.Renderer.calcTileSize(mazeDef.cols, mazeDef.rows);
        ECO.Renderer.decoMap = ECO.Themes.generateDecoMap(mazeDef.grid, mazeDef.cols, mazeDef.rows, this.theme);
        ECO.Renderer.clearTrails();

        // Спецтайлы — занять позиции спавна/ведёрка/выхода
        var stOccupied = {};
        stOccupied[key(mazeDef.spawn.x, mazeDef.spawn.y)] = true;
        stOccupied[key(mazeDef.bucket.x, mazeDef.bucket.y)] = true;
        stOccupied[key(mazeDef.exit.x, mazeDef.exit.y)] = true;
        this.specialTileMap = ECO.Themes.generateSpecialTileMap(
            mazeDef.grid, mazeDef.cols, mazeDef.rows, this.theme, stOccupied
        );
        ECO.Renderer.specialTileMap = this.specialTileMap;

        // Обновить подсказку спецтайла
        this._updateSpecialTileHint();

        this.entities = [];
        ECO.Animations.clear();

        // Игрок
        this.player = ECO.Entities.createPlayer(mazeDef.spawn.x, mazeDef.spawn.y);
        this._basePlayerSpeed = ECO.Config.PLAYER_BASE_SPEED;
        this.player.speed = this._basePlayerSpeed;
        this.entities.push(this.player);

        // Ведёрко
        var bucket = ECO.Entities.createBucket(mazeDef.bucket.x, mazeDef.bucket.y);
        this.entities.push(bucket);

        // Выход
        var exit = ECO.Entities.createExit(mazeDef.exit.x, mazeDef.exit.y);
        this.entities.push(exit);
        var occupied = {};
        occupied[key(mazeDef.spawn.x, mazeDef.spawn.y)] = true;
        occupied[key(mazeDef.bucket.x, mazeDef.bucket.y)] = true;
        occupied[key(mazeDef.exit.x, mazeDef.exit.y)] = true;

        // Мусор
        var trashPositions = ECO.Maze.findRandomFloorTiles(
            mazeDef.grid, levelDef.trash, occupied, mazeDef.cols, mazeDef.rows, 3, mazeDef.distances
        );
        for (var t = 0; t < trashPositions.length; t++) {
            var trash = ECO.Entities.createTrash(trashPositions[t].x, trashPositions[t].y);
            this.entities.push(trash);
            occupied[key(trashPositions[t].x, trashPositions[t].y)] = true;
        }

        // Крысы
        var ratSpeedMult = levelDef.ratSpeedMult || 1;
        if (levelDef.rats > 0) {
            var maxDist = 0;
            for (var dk in mazeDef.distances) {
                if (mazeDef.distances[dk] > maxDist) maxDist = mazeDef.distances[dk];
            }
            var minDist = Math.floor(maxDist * ECO.Config.MIN_RAT_SPAWN_DISTANCE);
            var ratPositions = ECO.Maze.findRandomFloorTiles(
                mazeDef.grid, levelDef.rats, occupied, mazeDef.cols, mazeDef.rows, minDist, mazeDef.distances
            );
            for (var r = 0; r < ratPositions.length; r++) {
                var rat = ECO.Entities.createRat(ratPositions[r].x, ratPositions[r].y, ratSpeedMult);
                this.entities.push(rat);
                occupied[key(ratPositions[r].x, ratPositions[r].y)] = true;
            }
        }

        // Пауэр-апы
        var powerupCount = 0;
        if (levelDef.cat) powerupCount++;
        if (levelDef.flower) powerupCount++;
        if (levelDef.sneakers) powerupCount++;
        if (levelDef.compass) powerupCount++;

        var puPositions = ECO.Maze.findRandomFloorTiles(
            mazeDef.grid, powerupCount, occupied, mazeDef.cols, mazeDef.rows, 2, mazeDef.distances
        );
        var pi = 0;
        if (levelDef.cat && pi < puPositions.length) {
            this.entities.push(ECO.Entities.createCatPowerup(puPositions[pi].x, puPositions[pi].y));
            occupied[key(puPositions[pi].x, puPositions[pi].y)] = true;
            pi++;
        }
        if (levelDef.flower && pi < puPositions.length) {
            this.entities.push(ECO.Entities.createFlower(puPositions[pi].x, puPositions[pi].y));
            occupied[key(puPositions[pi].x, puPositions[pi].y)] = true;
            pi++;
        }
        if (levelDef.sneakers && pi < puPositions.length) {
            this.entities.push(ECO.Entities.createSneakers(puPositions[pi].x, puPositions[pi].y));
            occupied[key(puPositions[pi].x, puPositions[pi].y)] = true;
            pi++;
        }
        if (levelDef.compass && pi < puPositions.length) {
            this.entities.push(ECO.Entities.createCompass(puPositions[pi].x, puPositions[pi].y));
            pi++;
        }

        // Сбросить таймеры
        this.trashCollected = 0;
        this.trashTotal = trashPositions.length;
        this.elapsedTime = 0;
        this.idleTimer = 0;
        this.idleExtraCount = 0;
        this.freezeTimer = 0;
        this.sneakersTimer = 0;
        this.compassTimer = 0;
        this.compassActive = false;
        this.comboTimer = 0;
        this.comboCount = 0;

        // Камера
        var ts = ECO.Renderer.tileSize;
        ECO.Renderer.camera.x = this.player.tileX * ts - ECO.Renderer.width / 2;
        ECO.Renderer.camera.y = this.player.tileY * ts - ECO.Renderer.height / 2;

        ECO.Facts.showFirst();
        ECO.Input.reset();

        this.state = 'playing';
    },

    // ========= Отрисовка =========

    _draw: function() {
        var STATE = ECO.Config.STATE;

        // Показывать подсказку спецтайла только в игре
        if (!this._stBar) this._stBar = document.getElementById('special-tile-bar');
        if (this._stBar) this._stBar.style.display = (this.state !== 'menu' && this.state !== 'victory') ? 'flex' : 'none';

        switch (this.state) {
            case 'menu':
                ECO.Renderer.drawMenu(this.totalTrashCollected);
                break;

            case 'playing':
            case 'watering':
                ECO.Renderer.updateCamera(
                    this.player.pixelX + ECO.Renderer.tileSize / 2,
                    this.player.pixelY + ECO.Renderer.tileSize / 2,
                    this.maze.cols, this.maze.rows
                );
                ECO.Renderer.draw(this);
                ECO.Animations.draw(ECO.Renderer.ctx, ECO.Renderer.camera.x, ECO.Renderer.camera.y);
                break;

            case 'level_complete':
                ECO.Renderer.updateCamera(
                    this.player.pixelX + ECO.Renderer.tileSize / 2,
                    this.player.pixelY + ECO.Renderer.tileSize / 2,
                    this.maze.cols, this.maze.rows
                );
                ECO.Renderer.draw(this);
                ECO.Animations.draw(ECO.Renderer.ctx, ECO.Renderer.camera.x, ECO.Renderer.camera.y);
                ECO.Renderer.drawLevelComplete(this, this._currentStars);
                break;

            case 'game_over':
                ECO.Renderer.updateCamera(
                    this.player.pixelX + ECO.Renderer.tileSize / 2,
                    this.player.pixelY + ECO.Renderer.tileSize / 2,
                    this.maze.cols, this.maze.rows
                );
                ECO.Renderer.draw(this);
                ECO.Renderer.drawGameOver();
                break;

            case 'victory':
                ECO.Renderer.drawVictory(this);
                break;
        }
    },

    // ========= Обработка кликов =========

    _handleClick: function(e) {
        var canvas = document.getElementById('game-canvas');
        var rect = canvas.getBoundingClientRect();
        var x = (e.clientX - rect.left);
        var y = (e.clientY - rect.top);

        switch (this.state) {
            case 'menu':
                // Запустить музыку меню при первом взаимодействии (AudioContext требует жест)
                ECO.Audio._resume();
                if (!ECO.Audio.musicPlaying) ECO.Audio.startMenuMusic();
                if (ECO.Renderer.hitTest(ECO.Renderer._startBtn, x, y)) {
                    this.startGame(false);
                } else if (ECO.Renderer.hitTest(ECO.Renderer._skinLeftBtn, x, y)) {
                    this.selectedSkin = (this.selectedSkin - 1 + ECO.Config.SKINS.length) % ECO.Config.SKINS.length;
                    try { localStorage.setItem('eco_skin', this.selectedSkin); } catch(e) {}
                } else if (ECO.Renderer.hitTest(ECO.Renderer._skinRightBtn, x, y)) {
                    this.selectedSkin = (this.selectedSkin + 1) % ECO.Config.SKINS.length;
                    try { localStorage.setItem('eco_skin', this.selectedSkin); } catch(e) {}
                }
                break;

            case 'game_over':
                if (this.gameOverTimer <= 0 && ECO.Renderer.hitTest(ECO.Renderer._retryBtn, x, y)) {
                    this._restartLevel();
                }
                break;

            case 'victory':
                if (ECO.Renderer.hitTest(ECO.Renderer._endlessBtn, x, y)) {
                    this.endless = true;
                    this.level = ECO.Config.STORY_LEVELS;
                    this.totalTime = 0;
                    this._nextLevel();
                } else if (ECO.Renderer.hitTest(ECO.Renderer._restartBtn, x, y)) {
                    this.startGame(false);
                }
                break;
        }
    },

    // Обновить подсказку спецтайла текущего уровня
    _updateSpecialTileHint: function() {
        var bar = document.getElementById('special-tile-bar');
        var hint = document.getElementById('special-tile-hint');
        if (!bar || !hint) return;

        if (this.theme && this.theme.specialTile) {
            var st = this.theme.specialTile;
            var effects = { 'slow': 'замедляет', 'boost': 'ускоряет', 'ice': 'скольжение' };

            // Рисуем спрайт спецтайла на мини-canvas
            var iconCanvas = document.getElementById('special-tile-icon');
            if (!iconCanvas) {
                iconCanvas = document.createElement('canvas');
                iconCanvas.id = 'special-tile-icon';
                iconCanvas.width = 28;
                iconCanvas.height = 28;
                iconCanvas.style.cssText = 'vertical-align:middle;margin-right:6px;border-radius:4px;background:rgba(255,255,255,0.08);flex-shrink:0;';
                bar.insertBefore(iconCanvas, hint);
            }
            var ictx = iconCanvas.getContext('2d');
            ictx.clearRect(0, 0, 28, 28);
            try { st.draw(ictx, 2, 2, 24); } catch(e) {}

            hint.textContent = st.name + ' — ' + (effects[st.type] || st.type);
            bar.style.display = 'flex';
        } else {
            // Убираем иконку если нет спецтайла
            var oldIcon = document.getElementById('special-tile-icon');
            if (oldIcon) oldIcon.parentNode.removeChild(oldIcon);
            bar.style.display = 'none';
        }
    },

    // Инициализация легенды предметов
    _initLegend: function() {
        // Кнопка toggle
        var bar = document.getElementById('legend-bar');
        var toggle = document.getElementById('legend-toggle');
        if (toggle && bar) {
            // На маленьких экранах скрыть по умолчанию
            if (window.innerWidth <= 420) {
                bar.classList.add('collapsed');
            }
            toggle.addEventListener('click', function(e) {
                e.stopPropagation();
                bar.classList.toggle('collapsed');
                toggle.textContent = bar.classList.contains('collapsed') ? '?' : '✕';
            });
        }

        // Рисуем мини-иконки
        var icons = {
            'icon-trash': function(c) {
                // Банановая кожура
                c.fillStyle = '#FDD835';
                c.beginPath();
                c.moveTo(8, 18);
                c.quadraticCurveTo(6, 10, 14, 6);
                c.quadraticCurveTo(22, 10, 20, 18);
                c.quadraticCurveTo(14, 14, 8, 18);
                c.fill();
                c.fillStyle = '#A68B00';
                c.beginPath();
                c.arc(12, 12, 2, 0, Math.PI * 2);
                c.fill();
            },
            'icon-bucket': function(c) {
                // Ведёрко
                c.fillStyle = '#78909C';
                c.beginPath();
                c.moveTo(6, 8);
                c.lineTo(8, 24);
                c.lineTo(20, 24);
                c.lineTo(22, 8);
                c.closePath();
                c.fill();
                c.fillStyle = '#FFF';
                c.beginPath();
                c.arc(11, 14, 2, 0, Math.PI * 2);
                c.fill();
                c.beginPath();
                c.arc(17, 14, 2, 0, Math.PI * 2);
                c.fill();
            },
            'icon-exit': function(c) {
                // Дверь
                c.fillStyle = '#4CAF50';
                c.fillRect(8, 4, 12, 20);
                c.fillStyle = '#FFF';
                c.fillRect(10, 6, 8, 16);
                c.fillStyle = '#FFD54F';
                c.beginPath();
                c.arc(16, 14, 1.5, 0, Math.PI * 2);
                c.fill();
            },
            'icon-cat': function(c) {
                // Котик
                c.fillStyle = '#FF9800';
                c.beginPath();
                c.arc(14, 16, 7, 0, Math.PI * 2);
                c.fill();
                c.beginPath();
                c.moveTo(8, 11);
                c.lineTo(7, 4);
                c.lineTo(12, 9);
                c.fill();
                c.beginPath();
                c.moveTo(20, 11);
                c.lineTo(21, 4);
                c.lineTo(16, 9);
                c.fill();
                c.fillStyle = '#333';
                c.beginPath();
                c.arc(11, 14, 1.5, 0, Math.PI * 2);
                c.fill();
                c.beginPath();
                c.arc(17, 14, 1.5, 0, Math.PI * 2);
                c.fill();
            },
            'icon-flower': function(c) {
                // Цветок
                c.fillStyle = '#4CAF50';
                c.fillRect(13, 14, 2, 12);
                var colors = ['#FF5722', '#FF9800', '#FFEB3B', '#E91E63', '#FF5722'];
                for (var i = 0; i < 5; i++) {
                    var a = i * Math.PI * 2 / 5 - Math.PI / 2;
                    c.fillStyle = colors[i];
                    c.beginPath();
                    c.arc(14 + Math.cos(a) * 5, 10 + Math.sin(a) * 5, 3, 0, Math.PI * 2);
                    c.fill();
                }
                c.fillStyle = '#FFC107';
                c.beginPath();
                c.arc(14, 10, 3, 0, Math.PI * 2);
                c.fill();
            },
            'icon-sneakers': function(c) {
                // Кроссовок
                c.fillStyle = '#2196F3';
                c.beginPath();
                c.moveTo(5, 18);
                c.lineTo(5, 12);
                c.lineTo(18, 10);
                c.lineTo(24, 12);
                c.lineTo(24, 18);
                c.closePath();
                c.fill();
                c.fillStyle = '#FFF';
                c.fillRect(8, 14, 8, 2);
            },
            'icon-rat': function(c) {
                // Крыса
                c.fillStyle = '#616161';
                c.beginPath();
                c.ellipse(14, 16, 8, 6, 0, 0, Math.PI * 2);
                c.fill();
                c.beginPath();
                c.arc(9, 11, 3, 0, Math.PI * 2);
                c.fill();
                c.beginPath();
                c.arc(19, 11, 3, 0, Math.PI * 2);
                c.fill();
                c.fillStyle = '#F44336';
                c.beginPath();
                c.arc(10, 13, 1, 0, Math.PI * 2);
                c.fill();
                c.beginPath();
                c.arc(18, 13, 1, 0, Math.PI * 2);
                c.fill();
                // Хвост
                c.strokeStyle = '#9E9E9E';
                c.lineWidth = 1.5;
                c.beginPath();
                c.moveTo(22, 16);
                c.quadraticCurveTo(26, 12, 24, 8);
                c.stroke();
            }
        };

        for (var id in icons) {
            var el = document.getElementById(id);
            if (!el) continue;
            var c = el.getContext('2d');
            icons[id](c);
        }
    }
};

// ========= Запуск =========
document.addEventListener('DOMContentLoaded', function() {
    ECO.Game.init();
});
