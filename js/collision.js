// ECO.Collision — проверка коллизий
ECO.Collision = {
    // Можно ли встать на тайл
    canMoveTo: function(grid, tileX, tileY) {
        if (tileY < 0 || tileY >= grid.length) return false;
        if (tileX < 0 || tileX >= grid[0].length) return false;
        return grid[tileY][tileX] === 0;
    },

    // Проверка перекрытия двух сущностей (по тайловым координатам)
    overlap: function(a, b) {
        return a.tileX === b.tileX && a.tileY === b.tileY;
    },

    // Проверка перекрытия по пиксельным координатам с порогом
    overlapPixel: function(a, b, threshold) {
        var dx = a.pixelX - b.pixelX;
        var dy = a.pixelY - b.pixelY;
        return (dx * dx + dy * dy) < (threshold * threshold);
    },

    // Найти сущность на тайле
    findAt: function(entities, tileX, tileY, type) {
        for (var i = 0; i < entities.length; i++) {
            var e = entities[i];
            if (!e.active) continue;
            if (type && e.type !== type) continue;
            if (e.tileX === tileX && e.tileY === tileY) return e;
        }
        return null;
    },

    // Получить следующий тайл по направлению
    getNextTile: function(tileX, tileY, direction) {
        var DIR = ECO.Config.DIR;
        switch (direction) {
            case DIR.UP:    return { x: tileX, y: tileY - 1 };
            case DIR.DOWN:  return { x: tileX, y: tileY + 1 };
            case DIR.LEFT:  return { x: tileX - 1, y: tileY };
            case DIR.RIGHT: return { x: tileX + 1, y: tileY };
            default: return { x: tileX, y: tileY };
        }
    }
};
