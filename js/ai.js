// ECO.AI — патфайндинг крыс и поведение котика
ECO.AI = {
    // Обновить путь крысы к игроку
    updateRatPath: function(rat, playerTileX, playerTileY, grid) {
        if (rat.frozen) return;
        // Считать путь от точки назначения (если в движении) чтобы не телепортироваться
        var fromX = rat.moving ? rat.targetTileX : rat.tileX;
        var fromY = rat.moving ? rat.targetTileY : rat.tileY;
        rat._pendingPath = ECO.Utils.bfs(grid, fromX, fromY, playerTileX, playerTileY);
        // Применить сразу если не в движении
        if (!rat.moving) {
            rat.path = rat._pendingPath;
            rat._pendingPath = null;
        }
    },

    // Двигать крысу по пути
    moveRat: function(rat, dt, grid, speed) {
        if (rat.frozen || !rat.path || rat.path.length === 0) return;

        if (!rat.moving) {
            var next = rat.path[0];
            // Проверить что шаг на соседнюю клетку (не телепорт)
            var dx = Math.abs(next.x - rat.tileX);
            var dy = Math.abs(next.y - rat.tileY);
            if ((dx + dy) !== 1 || !ECO.Collision.canMoveTo(grid, next.x, next.y)) {
                // Путь устарел — пересчитать
                rat.path = [];
                return;
            }
            rat.targetTileX = next.x;
            rat.targetTileY = next.y;
            rat.moving = true;
            rat.moveProgress = 0;
            rat.path.shift();
            // Обновить направление спрайта
            var DIR = ECO.Config.DIR;
            if (next.x > rat.tileX) rat.direction = DIR.RIGHT;
            else if (next.x < rat.tileX) rat.direction = DIR.LEFT;
            else if (next.y > rat.tileY) rat.direction = DIR.DOWN;
            else if (next.y < rat.tileY) rat.direction = DIR.UP;
        }

        if (rat.moving) {
            rat.moveProgress += speed * dt / 1000;
            if (rat.moveProgress >= 1) {
                rat.tileX = rat.targetTileX;
                rat.tileY = rat.targetTileY;
                rat.moving = false;
                rat.moveProgress = 0;
                // Применить отложенный путь (пересчитанный во время движения)
                if (rat._pendingPath) {
                    rat.path = rat._pendingPath;
                    rat._pendingPath = null;
                }
            }
        }
    },

    // Котик следует за игроком
    moveCatFollower: function(cat, playerTileX, playerTileY, grid, dt) {
        if (cat.state === 'sleeping') return;

        var targetX, targetY;
        var speed;

        if (cat.state === 'following') {
            targetX = playerTileX;
            targetY = playerTileY;
            speed = ECO.Config.CAT_FOLLOW_SPEED;
        } else if (cat.state === 'returning') {
            targetX = cat.homeTileX;
            targetY = cat.homeTileY;
            speed = ECO.Config.CAT_RETURN_SPEED;
        } else {
            return;
        }

        // Пересчёт пути — от точки назначения если в движении
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

        if ((!cat.path || cat.path.length === 0) && !cat.moving) {
            if (cat.state === 'returning') {
                cat.state = 'sleeping';
            }
            return;
        }

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
                // Обновить направление спрайта
                var DIR = ECO.Config.DIR;
                if (next.x > cat.tileX) cat.direction = DIR.RIGHT;
                else if (next.x < cat.tileX) cat.direction = DIR.LEFT;
                else if (next.y > cat.tileY) cat.direction = DIR.DOWN;
                else if (next.y < cat.tileY) cat.direction = DIR.UP;
            } else {
                cat.path = []; // путь устарел
            }
        }

        if (cat.moving) {
            cat.moveProgress += speed * dt / 1000;
            if (cat.moveProgress >= 1) {
                cat.tileX = cat.targetTileX;
                cat.tileY = cat.targetTileY;
                cat.moving = false;
                cat.moveProgress = 0;
                // Применить отложенный путь
                if (cat._pendingPath) {
                    cat.path = cat._pendingPath;
                    cat._pendingPath = null;
                }
                // Проверка: вернулся домой?
                if (cat.state === 'returning' && cat.tileX === cat.homeTileX && cat.tileY === cat.homeTileY) {
                    cat.state = 'sleeping';
                }
            }
        }
    }
};
