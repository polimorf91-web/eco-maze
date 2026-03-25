// ECO.Renderer — отрисовка на Canvas
ECO.Renderer = {
    canvas: null,
    ctx: null,
    camera: { x: 0, y: 0 },
    tileSize: 40,
    decoMap: null,
    trailMap: null,

    _menuTime: 0,
    _cursorX: 0,
    _cursorY: 0,

    init: function(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.trailMap = {};
        this.resize();

        // Трекинг курсора/тапа для глаз ведёрка
        var self = this;
        canvas.addEventListener('mousemove', function(e) {
            var rect = canvas.getBoundingClientRect();
            self._cursorX = e.clientX - rect.left;
            self._cursorY = e.clientY - rect.top;
        });
        canvas.addEventListener('touchstart', function(e) {
            if (e.touches.length > 0) {
                var rect = canvas.getBoundingClientRect();
                self._cursorX = e.touches[0].clientX - rect.left;
                self._cursorY = e.touches[0].clientY - rect.top;
            }
        }, { passive: true });
        canvas.addEventListener('touchmove', function(e) {
            if (e.touches.length > 0) {
                var rect = canvas.getBoundingClientRect();
                self._cursorX = e.touches[0].clientX - rect.left;
                self._cursorY = e.touches[0].clientY - rect.top;
            }
        }, { passive: true });
    },

    resize: function() {
        var c = this.canvas;
        var dpr = window.devicePixelRatio || 1;
        var w = c.clientWidth;
        var h = c.clientHeight;
        c.width = w * dpr;
        c.height = h * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.width = w;
        this.height = h;
    },

    // Вычислить размер тайла чтобы лабиринт заполнял экран
    calcTileSize: function(mazeCols, mazeRows) {
        var maxW = this.width / mazeCols;
        var maxH = this.height / mazeRows;
        // Без жёсткого потолка — тайл масштабируется под экран, минимум 20px
        this.tileSize = Math.max(20, Math.floor(Math.min(maxW, maxH)));
        return this.tileSize;
    },

    // Обновить камеру (следит за игроком)
    updateCamera: function(playerPixelX, playerPixelY, mazeCols, mazeRows) {
        var ts = this.tileSize;
        var mazeW = mazeCols * ts;
        var mazeH = mazeRows * ts;

        var targetX = playerPixelX - this.width / 2;
        var targetY = playerPixelY - this.height / 2;

        // Если лабиринт меньше экрана — центрировать (без чёрных полей)
        if (mazeW <= this.width) {
            targetX = -(this.width - mazeW) / 2;
        } else {
            targetX = ECO.Utils.clamp(targetX, 0, mazeW - this.width);
        }
        if (mazeH <= this.height) {
            targetY = -(this.height - mazeH) / 2;
        } else {
            targetY = ECO.Utils.clamp(targetY, 0, mazeH - this.height);
        }

        // Плавное следование (frame-rate independent)
        var lerpFactor = 1 - Math.pow(0.9, (this._dt || 16) / 16.67);
        this.camera.x = ECO.Utils.lerp(this.camera.x, targetX, lerpFactor);
        this.camera.y = ECO.Utils.lerp(this.camera.y, targetY, lerpFactor);
    },

    // Добавить след (для зимнего уровня)
    addTrail: function(tileX, tileY, type) {
        var key = tileX + ',' + tileY;
        if (!this.trailMap[key]) {
            this.trailMap[key] = type || 'player';
        }
    },

    clearTrails: function() {
        this.trailMap = {};
    },

    // Основная отрисовка
    draw: function(game) {
        var ctx = this.ctx;
        var ts = this.tileSize;
        var cam = this.camera;
        var theme = game.theme;

        // Фон
        ctx.fillStyle = theme.bgColor;
        ctx.fillRect(0, 0, this.width, this.height);

        var grid = game.maze.grid;
        var cols = game.maze.cols;
        var rows = game.maze.rows;

        // Определить видимые тайлы
        var startCol = Math.max(0, Math.floor(cam.x / ts) - 1);
        var startRow = Math.max(0, Math.floor(cam.y / ts) - 1);
        var endCol = Math.min(cols, Math.ceil((cam.x + this.width) / ts) + 1);
        var endRow = Math.min(rows, Math.ceil((cam.y + this.height) / ts) + 1);

        var key = function(x, y) { return x + ',' + y; };

        // Тайлы
        for (var y = startRow; y < endRow; y++) {
            for (var x = startCol; x < endCol; x++) {
                var px = x * ts - cam.x;
                var py = y * ts - cam.y;

                if (grid[y][x] === 1) {
                    theme.wallPattern(ctx, px, py, ts, x, y);
                } else {
                    theme.floorPattern(ctx, px, py, ts);

                    // Спецтайлы (поверх пола)
                    var stKey = key(x, y);
                    if (this.specialTileMap && this.specialTileMap[stKey]) {
                        ECO.Themes.drawSpecialTile(ctx, px, py, ts, this.specialTileMap[stKey]);
                    }

                    // Следы на снегу
                    if (theme.snowTrails && this.trailMap[key(x, y)]) {
                        var trailType = this.trailMap[key(x, y)];
                        ctx.fillStyle = trailType === 'player' ? 'rgba(150,120,80,0.3)' : 'rgba(100,100,100,0.2)';
                        ctx.beginPath();
                        ctx.arc(px + ts * 0.35, py + ts * 0.5, ts * 0.06, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.beginPath();
                        ctx.arc(px + ts * 0.65, py + ts * 0.5, ts * 0.06, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    // Декорации
                    if (this.decoMap && this.decoMap[key(x, y)]) {
                        theme.drawDeco(ctx, px, py, ts);
                    }
                }
            }
        }

        // Сущности (порядок: пауэрапы → мусор → ведёрко → выход → котик → игрок → крысы)
        var entities = game.entities || [];
        var drawOrder = ['sneakers', 'compass', 'flower', 'cat_powerup', 'trash', 'bucket', 'exit', 'cat_follower', 'player', 'rat'];

        for (var oi = 0; oi < drawOrder.length; oi++) {
            var type = drawOrder[oi];
            for (var ei = 0; ei < entities.length; ei++) {
                var e = entities[ei];
                if (!e.active || e.type !== type) continue;

                var ex = e.pixelX - cam.x;
                var ey = e.pixelY - cam.y;

                // Не рисовать за экраном
                if (ex < -ts || ex > this.width + ts || ey < -ts || ey > this.height + ts) continue;

                e.draw(ctx, ex, ey, ts);
            }
        }

        // Стрелка компаса (если активен)
        if (game.compassActive && game.nearestTrash) {
            var player = game.player;
            var ppx = player.pixelX - cam.x + ts / 2;
            var ppy = player.pixelY - cam.y + ts / 2;
            var angle = ECO.Utils.angleTo(player.pixelX, player.pixelY, game.nearestTrash.pixelX, game.nearestTrash.pixelY);
            ECO.Sprites.drawCompassArrow(ctx, ppx, ppy, angle, ts * 0.4);
        }

        // HUD
        this.drawHUD(ctx, game);
    },

    drawHUD: function(ctx, game) {
        var pad = 10;
        var fontSize = 16;
        ctx.font = 'bold ' + fontSize + 'px sans-serif';
        ctx.textBaseline = 'top';

        // Полупрозрачный фон HUD
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, this.width, 44);

        // Таймер
        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'left';
        ctx.fillText('⏱ ' + ECO.Utils.formatTime(game.elapsedTime), pad, pad);

        // Счётчик мусора
        ctx.textAlign = 'center';
        ctx.fillText('🗑 ' + game.trashCollected + '/' + game.trashTotal, this.width / 2, pad);

        // Уровень
        ctx.textAlign = 'right';
        var levelText = game.endless ? 'Ур. ' + game.level + ' ∞' : 'Ур. ' + game.level + '/' + ECO.Config.STORY_LEVELS;
        ctx.fillText(levelText, this.width - pad, pad);

        // Вторая строка: статусы
        var statuses = [];
        if (game.player && game.player.hasShield) statuses.push('🛡 Щит');
        if (game.freezeTimer > 0) statuses.push('❄ ' + Math.ceil(game.freezeTimer / 1000) + 'с');
        if (game.sneakersTimer > 0) statuses.push('👟 ' + Math.ceil(game.sneakersTimer / 1000) + 'с');
        if (game.compassTimer > 0) statuses.push('🧭 ' + Math.ceil(game.compassTimer / 1000) + 'с');

        if (statuses.length > 0) {
            ctx.textAlign = 'center';
            ctx.font = fontSize - 2 + 'px sans-serif';
            ctx.fillStyle = '#FFD54F';
            ctx.fillText(statuses.join('  |  '), this.width / 2, pad + fontSize + 4);
        }

        // Комбо текст
        if (game.comboCount >= 2) {
            ctx.textAlign = 'center';
            ctx.font = 'bold 24px sans-serif';
            ctx.fillStyle = '#FFEB3B';
            ctx.fillText('Комбо x' + game.comboCount + '!', this.width / 2, 50);
        }
    },

    // Экран меню
    drawMenu: function(totalTrashCollected) {
        var ctx = this.ctx;
        var w = this.width;
        var h = this.height;
        var skinIdx = ECO.Game.selectedSkin || 0;
        var skin = ECO.Config.SKINS[skinIdx];

        ctx.fillStyle = '#E8F5E9';
        ctx.fillRect(0, 0, w, h);

        // Заголовок
        ctx.fillStyle = '#2E7D32';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌿 Эко-Лабиринт', w / 2, h * 0.12);

        // Маскот Ведёрко + Персонаж (справа)
        this._menuTime += 16;
        var bucketSize = 100;
        var bucketX = w / 2 - bucketSize - 5;
        var bucketY = h * 0.15;
        var bucketCX = bucketX + bucketSize / 2;
        var bucketCY = bucketY + bucketSize / 2;

        // Угол от ведёрка к курсору (для глаз)
        var eyeAngle = Math.atan2(this._cursorY - bucketCY, this._cursorX - bucketCX);
        ECO.Sprites.drawBucket(ctx, bucketX, bucketY, bucketSize, false, eyeAngle);


        // Персонаж (справа от ведёрка)
        var menuSkin = ECO.Config.SKINS[skinIdx] || ECO.Config.SKINS[0];
        var charX = w / 2 + 15;
        var charY = bucketY + (bucketSize - 65) / 2;
        if (menuSkin.type === 'chibi') {
            ECO.Sprites.drawChibiPlayer(ctx, charX, charY, 65, ECO.Config.DIR.DOWN, 0, 0, false);
        } else if (menuSkin.gender === 'boy') {
            ECO.Sprites.drawBoy(ctx, charX, charY, 65, ECO.Config.DIR.DOWN, 0, 0, false, skinIdx);
        } else {
            ECO.Sprites.drawGirl(ctx, charX, charY, 65, ECO.Config.DIR.DOWN, 0, 0, false, skinIdx);
        }

        // Описание
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#555';
        ctx.fillText('Собери мусор и спаси природу!', w / 2, h * 0.4);

        // Выбор скина: стрелки + имя
        var arrowY = h * 0.45;
        var arrowSize = 28;
        var nameX = w / 2;

        // Стрелка влево
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold ' + arrowSize + 'px sans-serif';
        ctx.fillText('◄', nameX - 80, arrowY);
        this._skinLeftBtn = { x: nameX - 100, y: arrowY - arrowSize / 2, w: 40, h: arrowSize };

        // Имя персонажа
        ctx.fillStyle = skin.dress || skin.shirt || '#4CAF50';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(skin.name, nameX, arrowY);

        // Стрелка вправо
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold ' + arrowSize + 'px sans-serif';
        ctx.fillText('►', nameX + 80, arrowY);
        this._skinRightBtn = { x: nameX + 60, y: arrowY - arrowSize / 2, w: 40, h: arrowSize };

        // Счётчик
        if (totalTrashCollected > 0) {
            ctx.font = '14px sans-serif';
            ctx.fillStyle = '#4CAF50';
            ctx.fillText('🌍 Мир стал чище: ' + totalTrashCollected + ' мусора собрано!', w / 2, h * 0.58);
        }

        // Кнопка Старт
        var btnW = 200, btnH = 50;
        var btnX = w / 2 - btnW / 2;
        var btnY = h * 0.65;
        ctx.fillStyle = '#4CAF50';
        this._roundRect(ctx, btnX, btnY, btnW, btnH, 12);
        ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('▶ Играть', w / 2, btnY + btnH / 2);

        this._startBtn = { x: btnX, y: btnY, w: btnW, h: btnH };
    },

    // Экран победы уровня
    drawLevelComplete: function(game, stars) {
        var ctx = this.ctx;
        var w = this.width;
        var h = this.height;

        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Уровень пройден!', w / 2, h * 0.3);

        ctx.font = '20px sans-serif';
        ctx.fillText('Отлично! Улица стала чище!', w / 2, h * 0.4);

        // Звёзды
        ctx.font = '36px sans-serif';
        var starStr = '';
        for (var i = 0; i < 3; i++) {
            starStr += i < stars ? '⭐' : '☆';
        }
        ctx.fillText(starStr, w / 2, h * 0.52);

        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#FFD54F';
        ctx.fillText('Следующий уровень...', w / 2, h * 0.65);
    },

    // Экран поражения
    drawGameOver: function() {
        var ctx = this.ctx;
        var w = this.width;
        var h = this.height;

        // Красный vignette
        var grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.8);
        grad.addColorStop(0, 'rgba(0,0,0,0.3)');
        grad.addColorStop(1, 'rgba(200,0,0,0.6)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Крыса поймала!', w / 2, h * 0.35);

        ctx.font = '18px sans-serif';
        ctx.fillText('Попробуй ещё!', w / 2, h * 0.45);

        // Кнопка
        var btnW = 200, btnH = 50;
        var btnX = w / 2 - btnW / 2;
        var btnY = h * 0.58;
        ctx.fillStyle = '#F44336';
        this._roundRect(ctx, btnX, btnY, btnW, btnH, 12);
        ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('🔄 Заново', w / 2, btnY + btnH / 2);

        this._retryBtn = { x: btnX, y: btnY, w: btnW, h: btnH };
    },

    // Финальная победа
    drawVictory: function(game) {
        var ctx = this.ctx;
        var w = this.width;
        var h = this.height;

        // Однократный запуск анимаций
        if (!this._victoryStarted) {
            this._victoryStarted = true;
            this._victoryTime = 0;
            ECO.Animations.spawnConfetti(w / 2, h * 0.3, 60);
            ECO.Audio.playVictory();
        }
        this._victoryTime += 16;

        // Фон
        ctx.fillStyle = '#E8F5E9';
        ctx.fillRect(0, 0, w, h);

        // Деревья
        ctx.fillStyle = '#4CAF50';
        for (var i = 0; i < 8; i++) {
            var tx = (i + 0.5) * w / 8;
            ctx.beginPath();
            ctx.moveTo(tx, h * 0.78);
            ctx.lineTo(tx - 20, h * 0.88);
            ctx.lineTo(tx + 20, h * 0.88);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(tx, h * 0.71);
            ctx.lineTo(tx - 15, h * 0.8);
            ctx.lineTo(tx + 15, h * 0.8);
            ctx.fill();
        }

        // Птицы
        ctx.save();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        for (var b = 0; b < 5; b++) {
            var bx = w * 0.2 + b * w * 0.15 + Math.sin(Date.now() / 1000 + b) * 20;
            var by = h * 0.05 + b * 6;
            ctx.beginPath();
            ctx.moveTo(bx - 8, by + 4);
            ctx.quadraticCurveTo(bx - 4, by, bx, by + 2);
            ctx.quadraticCurveTo(bx + 4, by, bx + 8, by + 4);
            ctx.stroke();
        }
        ctx.restore();

        // Кубок (по центру сверху)
        var trophySize = Math.min(w * 0.35, 120);
        ECO.Sprites.drawTrophy(ctx, w / 2 - trophySize / 2, h * 0.08, trophySize, this._victoryTime);

        // Периодические фейерверки
        if (this._victoryTime % 1500 < 20) {
            var fx = w * (0.15 + Math.random() * 0.7);
            var fy = h * (0.05 + Math.random() * 0.3);
            ECO.Animations.spawnFirework(fx, fy);
        }

        // Заголовок
        ctx.fillStyle = '#2E7D32';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Ты \u2014 настоящий эко-герой!', w / 2, h * 0.32);

        // Статистика
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#333';
        ctx.fillText('Мусора собрано: ' + (game.totalTrashCollected || 0), w / 2, h * 0.39);
        ctx.fillText('Время: ' + ECO.Utils.formatTime(game.totalTime || 0), w / 2, h * 0.44);

        // Звёзды за уровни
        ctx.font = '14px sans-serif';
        var starsY = h * 0.5;
        var starsEndY = h * 0.66;
        var maxStarSpacing = 22;
        var starSpacing = Math.min(maxStarSpacing, (starsEndY - starsY) / Math.max(1, ECO.Config.STORY_LEVELS));
        for (var lv = 0; lv < ECO.Config.STORY_LEVELS; lv++) {
            var stars = game.levelStars ? (game.levelStars[lv + 1] || 0) : 0;
            var starLine = 'Ур.' + (lv + 1) + ': ';
            for (var si = 0; si < 3; si++) starLine += si < stars ? '\u2B50' : '\u2606';
            ctx.fillText(starLine, w / 2, starsY + lv * starSpacing);
        }

        // Кнопки
        var btnW = 200, btnH = 42;
        var y1 = h * 0.72;
        var y2 = h * 0.82;

        ctx.fillStyle = '#4CAF50';
        this._roundRect(ctx, w / 2 - btnW / 2, y1, btnW, btnH, 10);
        ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('\u267E Бесконечный режим', w / 2, y1 + btnH / 2);

        ctx.fillStyle = '#2196F3';
        this._roundRect(ctx, w / 2 - btnW / 2, y2, btnW, btnH, 10);
        ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.fillText('\uD83D\uDD04 Начать заново', w / 2, y2 + btnH / 2);

        this._endlessBtn = { x: w / 2 - btnW / 2, y: y1, w: btnW, h: btnH };
        this._restartBtn = { x: w / 2 - btnW / 2, y: y2, w: btnW, h: btnH };
    },

    _roundRect: function(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    },

    // Проверка клика по кнопке
    hitTest: function(btn, x, y) {
        if (!btn) return false;
        return x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h;
    }
};
