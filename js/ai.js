// ECO.AI — поведение крыс (Pac-Man ghost style) и котика
ECO.AI = {
    // Направления: приоритет при тай-брейке (UP > LEFT > DOWN > RIGHT)
    _DIRS: [
        { dir: 1, dx: 0, dy: -1 },  // UP
        { dir: 3, dx: -1, dy: 0 },  // LEFT
        { dir: 2, dx: 0, dy: 1 },   // DOWN
        { dir: 4, dx: 1, dy: 0 }    // RIGHT
    ],

    // Противоположное направление (для запрета разворота)
    _reverse: function(dir) {
        switch (dir) {
            case 1: return 2; // UP → DOWN
            case 2: return 1; // DOWN → UP
            case 3: return 4; // LEFT → RIGHT
            case 4: return 3; // RIGHT → LEFT
            default: return 0;
        }
    },

    // === КРЫСА: Pac-Man ghost AI ===
    // На каждом тайле выбирает направление, минимизирующее расстояние до цели.
    // Никогда не разворачивается (кроме тупиков). Никогда не останавливается.
    chooseRatDirection: function(rat, targetX, targetY, grid) {
        var reverse = this._reverse(rat.direction);
        var bestDir = 0;
        var bestDist = Infinity;
        var options = 0;

        for (var i = 0; i < this._DIRS.length; i++) {
            var d = this._DIRS[i];
            var nx = rat.tileX + d.dx;
            var ny = rat.tileY + d.dy;

            // Пропустить стены
            if (!ECO.Collision.canMoveTo(grid, nx, ny)) continue;

            // Пропустить разворот (кроме тупика)
            if (d.dir === reverse) {
                options++; // считаем как доступный, но пропускаем
                continue;
            }

            options++;

            // Евклидово расстояние до цели
            var ddx = nx - targetX;
            var ddy = ny - targetY;
            var dist = ddx * ddx + ddy * ddy; // без sqrt — для сравнения не нужен

            if (dist < bestDist) {
                bestDist = dist;
                bestDir = d.dir;
            }
        }

        // Тупик: разрешить разворот
        if (bestDir === 0) {
            bestDir = reverse;
        }

        return bestDir;
    },

    // Полный апдейт крысы за кадр
    updateRat: function(rat, dt, grid, playerTileX, playerTileY) {
        if (rat.frozen) return;

        var speed = rat.speed;

        // Если не в движении — выбрать направление и начать двигаться
        if (!rat.moving) {
            var dir = this.chooseRatDirection(rat, playerTileX, playerTileY, grid);
            if (dir === 0) return; // нет хода (невозможно в связном лабиринте)

            // Найти смещение для выбранного направления
            var dx = 0, dy = 0;
            for (var i = 0; i < this._DIRS.length; i++) {
                if (this._DIRS[i].dir === dir) {
                    dx = this._DIRS[i].dx;
                    dy = this._DIRS[i].dy;
                    break;
                }
            }

            var nx = rat.tileX + dx;
            var ny = rat.tileY + dy;

            // Финальная проверка (на всякий случай)
            if (!ECO.Collision.canMoveTo(grid, nx, ny)) return;

            rat.targetTileX = nx;
            rat.targetTileY = ny;
            rat.direction = dir;
            rat.moving = true;
            rat.moveProgress = 0;
        }

        // Продвижение по тайлу
        if (rat.moving) {
            rat.moveProgress += speed * dt / 1000;
            if (rat.moveProgress >= 1) {
                rat.tileX = rat.targetTileX;
                rat.tileY = rat.targetTileY;
                rat.moving = false;
                rat.moveProgress = 0;
                // Сразу выбрать следующее направление (непрерывное движение)
                // Это делается на следующем кадре через !rat.moving выше
            }
        }
    },

    // === КОТИК: BFS к цели (крыса или игрок) ===
    moveCatFollower: function(cat, targetX, targetY, grid, dt) {
        var speed = ECO.Config.CAT_FOLLOW_SPEED;

        // Пересчёт пути
        cat.pathTimer = (cat.pathTimer || 0) + dt;
        if (cat.pathTimer > 300 || !cat.path || cat.path.length === 0) {
            cat.pathTimer = 0;
            var fromX = cat.moving ? cat.targetTileX : cat.tileX;
            var fromY = cat.moving ? cat.targetTileY : cat.tileY;
            var newPath = ECO.Utils.bfs(grid, fromX, fromY, targetX, targetY);
            if (cat.moving) {
                cat._pendingPath = newPath;
            } else {
                cat.path = newPath;
            }
        }

        if ((!cat.path || cat.path.length === 0) && !cat.moving) return;

        if (!cat.moving && cat.path && cat.path.length > 0) {
            var next = cat.path[0];
            var dx = Math.abs(next.x - cat.tileX);
            var dy = Math.abs(next.y - cat.tileY);
            if ((dx + dy) === 1 && ECO.Collision.canMoveTo(grid, next.x, next.y)) {
                cat.targetTileX = next.x;
                cat.targetTileY = next.y;
                cat.moving = true;
                cat.moveProgress = 0;
                cat.path.shift();
                var DIR = ECO.Config.DIR;
                if (next.x > cat.tileX) cat.direction = DIR.RIGHT;
                else if (next.x < cat.tileX) cat.direction = DIR.LEFT;
                else if (next.y > cat.tileY) cat.direction = DIR.DOWN;
                else if (next.y < cat.tileY) cat.direction = DIR.UP;
            } else {
                cat.path = [];
            }
        }

        if (cat.moving) {
            cat.moveProgress += speed * dt / 1000;
            if (cat.moveProgress >= 1) {
                cat.tileX = cat.targetTileX;
                cat.tileY = cat.targetTileY;
                cat.moving = false;
                cat.moveProgress = 0;
                if (cat._pendingPath) {
                    cat.path = cat._pendingPath;
                    cat._pendingPath = null;
                }
            }
        }
    }
};
