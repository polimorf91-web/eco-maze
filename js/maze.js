// ECO.Maze — генерация лабиринта (Recursive Backtracker)
ECO.Maze = {
    // Генерирует лабиринт и возвращает { grid, spawn, entities }
    generate: function(cellCols, cellRows) {
        // Шаг 1: Recursive Backtracker
        var cells = this._createCells(cellCols, cellRows);
        this._carve(cells, cellCols, cellRows);

        // Шаг 2: Expand to tile grid (each cell → 3x3 tiles)
        var grid = this._expandToTiles(cells, cellCols, cellRows);
        var tileCols = cellCols * 2 + 1;
        var tileRows = cellRows * 2 + 1;

        // Шаг 3: Remove extra walls for loops
        this._removeWalls(grid, tileCols, tileRows);

        // Шаг 4: Find placement positions
        var spawn = { x: 1, y: 1 }; // верхний левый проход

        // Найти тупики для размещения ведёрка
        var deadEnds = ECO.Utils.findDeadEnds(grid);
        var distances = ECO.Utils.bfsDistances(grid, spawn.x, spawn.y);
        var key = function(x, y) { return x + ',' + y; };

        // Ведёрко: самый дальний тупик от спавна
        var bucket = null;
        var maxDist = 0;
        for (var i = 0; i < deadEnds.length; i++) {
            var de = deadEnds[i];
            var d = distances[key(de.x, de.y)] || 0;
            if (d > maxDist && !(de.x === spawn.x && de.y === spawn.y)) {
                maxDist = d;
                bucket = { x: de.x, y: de.y };
            }
        }
        // Фоллбэк: если тупиков нет, ставим в дальнюю точку
        if (!bucket) {
            bucket = this._farthestFloor(grid, distances, tileCols, tileRows, spawn);
        }

        // Выход: на границе, далеко от ведёрка
        var bucketDist = ECO.Utils.bfsDistances(grid, bucket.x, bucket.y);
        var exit = this._findBorderExit(grid, bucketDist, tileCols, tileRows, bucket, spawn);

        return {
            grid: grid,
            cols: tileCols,
            rows: tileRows,
            spawn: spawn,
            bucket: bucket,
            exit: exit,
            distances: distances
        };
    },

    _createCells: function(cols, rows) {
        var cells = [];
        for (var y = 0; y < rows; y++) {
            cells[y] = [];
            for (var x = 0; x < cols; x++) {
                cells[y][x] = {
                    visited: false,
                    walls: { N: true, S: true, E: true, W: true }
                };
            }
        }
        return cells;
    },

    _carve: function(cells, cols, rows) {
        var stack = [];
        var sx = 0, sy = 0;
        cells[sy][sx].visited = true;
        stack.push({ x: sx, y: sy });

        var dirs = [
            { dx: 0, dy: -1, wall: 'N', opposite: 'S' },
            { dx: 0, dy: 1, wall: 'S', opposite: 'N' },
            { dx: 1, dy: 0, wall: 'E', opposite: 'W' },
            { dx: -1, dy: 0, wall: 'W', opposite: 'E' }
        ];

        while (stack.length > 0) {
            var current = stack[stack.length - 1];
            var neighbors = [];

            for (var d = 0; d < dirs.length; d++) {
                var nx = current.x + dirs[d].dx;
                var ny = current.y + dirs[d].dy;
                if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !cells[ny][nx].visited) {
                    neighbors.push(dirs[d]);
                }
            }

            if (neighbors.length === 0) {
                stack.pop();
            } else {
                var chosen = ECO.Utils.randomChoice(neighbors);
                var nx2 = current.x + chosen.dx;
                var ny2 = current.y + chosen.dy;

                cells[current.y][current.x].walls[chosen.wall] = false;
                cells[ny2][nx2].walls[chosen.opposite] = false;
                cells[ny2][nx2].visited = true;
                stack.push({ x: nx2, y: ny2 });
            }
        }
    },

    _expandToTiles: function(cells, cellCols, cellRows) {
        var tileCols = cellCols * 2 + 1;
        var tileRows = cellRows * 2 + 1;
        var grid = [];

        // Заполнить всё стенами
        for (var y = 0; y < tileRows; y++) {
            grid[y] = [];
            for (var x = 0; x < tileCols; x++) {
                grid[y][x] = 1; // стена
            }
        }

        // Прорезать проходы
        for (var cy = 0; cy < cellRows; cy++) {
            for (var cx = 0; cx < cellCols; cx++) {
                var tx = cx * 2 + 1;
                var ty = cy * 2 + 1;
                grid[ty][tx] = 0; // центр клетки = пол

                if (!cells[cy][cx].walls.E && cx + 1 < cellCols) {
                    grid[ty][tx + 1] = 0; // проход вправо
                }
                if (!cells[cy][cx].walls.S && cy + 1 < cellRows) {
                    grid[ty + 1][tx] = 0; // проход вниз
                }
            }
        }

        return grid;
    },

    _removeWalls: function(grid, cols, rows) {
        var removable = [];
        for (var y = 1; y < rows - 1; y++) {
            for (var x = 1; x < cols - 1; x++) {
                if (grid[y][x] === 1) {
                    // Проверяем: не угловой ли это тайл (чтобы не создать 2x2 пустоты)
                    var floorNeighbors = 0;
                    if (grid[y - 1][x] === 0) floorNeighbors++;
                    if (grid[y + 1][x] === 0) floorNeighbors++;
                    if (grid[y][x - 1] === 0) floorNeighbors++;
                    if (grid[y][x + 1] === 0) floorNeighbors++;

                    // Удаляем только стены между двумя проходами (ровно 2 соседних пола напротив)
                    if (floorNeighbors === 2) {
                        var horizontal = (grid[y][x - 1] === 0 && grid[y][x + 1] === 0);
                        var vertical = (grid[y - 1][x] === 0 && grid[y + 1][x] === 0);
                        if (horizontal || vertical) {
                            removable.push({ x: x, y: y });
                        }
                    }
                }
            }
        }

        ECO.Utils.shuffleArray(removable);
        var count = Math.floor(removable.length * ECO.Config.WALL_REMOVAL_PERCENT);
        for (var i = 0; i < count; i++) {
            grid[removable[i].y][removable[i].x] = 0;
        }
    },

    _farthestFloor: function(grid, distances, cols, rows, exclude) {
        var key = function(x, y) { return x + ',' + y; };
        var best = null, maxD = 0;
        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                if (grid[y][x] === 0 && !(x === exclude.x && y === exclude.y)) {
                    var d = distances[key(x, y)] || 0;
                    if (d > maxD) {
                        maxD = d;
                        best = { x: x, y: y };
                    }
                }
            }
        }
        return best || { x: cols - 2, y: rows - 2 };
    },

    _findBorderExit: function(grid, bucketDist, cols, rows, bucket, spawn) {
        var key = function(x, y) { return x + ',' + y; };
        var best = null, maxD = 0;

        // Ищем проходимую клетку на границе, далёкую от ведёрка
        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                if (grid[y][x] !== 0) continue;
                if (x === spawn.x && y === spawn.y) continue;
                if (x === bucket.x && y === bucket.y) continue;

                var isBorder = (x === 0 || x === cols - 1 || y === 0 || y === rows - 1);
                // Также принимаем клетки рядом с границей
                if (!isBorder) {
                    isBorder = (x === 1 || x === cols - 2 || y === 1 || y === rows - 2);
                }
                if (!isBorder) continue;

                var d = bucketDist[key(x, y)] || 0;
                if (d > maxD) {
                    maxD = d;
                    best = { x: x, y: y };
                }
            }
        }
        return best || { x: cols - 2, y: rows - 2 };
    },

    // Найти случайные проходимые позиции, не занятые другими сущностями
    findRandomFloorTiles: function(grid, count, occupied, cols, rows, minDistFromSpawn, spawnDistances) {
        var key = function(x, y) { return x + ',' + y; };
        var available = [];

        for (var y = 1; y < rows - 1; y++) {
            for (var x = 1; x < cols - 1; x++) {
                if (grid[y][x] !== 0) continue;
                if (occupied[key(x, y)]) continue;
                if (spawnDistances && minDistFromSpawn) {
                    var d = spawnDistances[key(x, y)] || 0;
                    if (d < minDistFromSpawn) continue;
                }
                available.push({ x: x, y: y });
            }
        }

        ECO.Utils.shuffleArray(available);
        return available.slice(0, count);
    }
};
