// ECO.Utils — вспомогательные функции
ECO.Utils = {
    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    shuffleArray: function(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
        return arr;
    },

    clamp: function(val, min, max) {
        return Math.max(min, Math.min(max, val));
    },

    distance: function(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    },

    euclidean: function(x1, y1, x2, y2) {
        var dx = x1 - x2, dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    },

    // BFS на тайловой сетке, возвращает путь [{x,y}, ...]
    bfs: function(grid, startX, startY, goalX, goalY) {
        var rows = grid.length;
        var cols = grid[0].length;
        if (startX === goalX && startY === goalY) return [];

        var queue = [[startX, startY]];
        var visited = {};
        var parent = {};
        var key = function(x, y) { return x + ',' + y; };
        visited[key(startX, startY)] = true;

        var dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];

        while (queue.length > 0) {
            var curr = queue.shift();
            var cx = curr[0], cy = curr[1];

            for (var d = 0; d < dirs.length; d++) {
                var nx = cx + dirs[d][0];
                var ny = cy + dirs[d][1];
                var nk = key(nx, ny);

                if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
                if (visited[nk]) continue;
                if (grid[ny][nx] === 1) continue; // стена

                visited[nk] = true;
                parent[nk] = key(cx, cy);
                queue.push([nx, ny]);

                if (nx === goalX && ny === goalY) {
                    // восстановить путь
                    var path = [];
                    var cur = key(goalX, goalY);
                    while (cur !== key(startX, startY)) {
                        var parts = cur.split(',');
                        path.unshift({ x: parseInt(parts[0]), y: parseInt(parts[1]) });
                        cur = parent[cur];
                    }
                    return path;
                }
            }
        }
        return []; // путь не найден
    },

    // BFS для нахождения расстояний от точки до всех клеток
    bfsDistances: function(grid, startX, startY) {
        var rows = grid.length;
        var cols = grid[0].length;
        var dist = {};
        var key = function(x, y) { return x + ',' + y; };
        var queue = [[startX, startY, 0]];
        dist[key(startX, startY)] = 0;
        var dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];

        while (queue.length > 0) {
            var curr = queue.shift();
            var cx = curr[0], cy = curr[1], cd = curr[2];

            for (var d = 0; d < dirs.length; d++) {
                var nx = cx + dirs[d][0];
                var ny = cy + dirs[d][1];
                var nk = key(nx, ny);

                if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
                if (dist[nk] !== undefined) continue;
                if (grid[ny][nx] === 1) continue;

                dist[nk] = cd + 1;
                queue.push([nx, ny, cd + 1]);
            }
        }
        return dist;
    },

    // Найти все тупики (клетки с 3 стенами вокруг)
    findDeadEnds: function(grid) {
        var deadEnds = [];
        var rows = grid.length;
        var cols = grid[0].length;
        var dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];

        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                if (grid[y][x] === 1) continue;
                var walls = 0;
                for (var d = 0; d < dirs.length; d++) {
                    var nx = x + dirs[d][0];
                    var ny = y + dirs[d][1];
                    if (nx < 0 || nx >= cols || ny < 0 || ny >= rows || grid[ny][nx] === 1) {
                        walls++;
                    }
                }
                if (walls === 3) {
                    deadEnds.push({ x: x, y: y });
                }
            }
        }
        return deadEnds;
    },

    // Получить случайный элемент массива
    randomChoice: function(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

    // Форматировать время mm:ss
    formatTime: function(ms) {
        var secs = Math.floor(ms / 1000);
        var m = Math.floor(secs / 60);
        var s = secs % 60;
        return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    },

    // Линейная интерполяция
    lerp: function(a, b, t) {
        return a + (b - a) * t;
    },

    // Угол от точки a к точке b
    angleTo: function(ax, ay, bx, by) {
        return Math.atan2(by - ay, bx - ax);
    }
};
