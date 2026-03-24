// ECO.Levels — таблица прогрессии уровней
ECO.Levels = {
    table: [
        null, // индекс 0 не используется
        { mazeCells: 7,  trash: 4,  rats: 0, cat: false, flower: false, sneakers: false, compass: false, baseTime: 60000 },
        { mazeCells: 9,  trash: 6,  rats: 1, cat: true,  flower: true,  sneakers: false, compass: false, baseTime: 90000 },
        { mazeCells: 9,  trash: 8,  rats: 1, cat: true,  flower: true,  sneakers: true,  compass: false, baseTime: 100000 },
        { mazeCells: 11, trash: 10, rats: 2, cat: true,  flower: true,  sneakers: true,  compass: true,  baseTime: 120000 },
        { mazeCells: 13, trash: 12, rats: 2, cat: true,  flower: true,  sneakers: true,  compass: true,  baseTime: 150000 }
    ],

    get: function(level, endless) {
        if (!endless && level <= ECO.Config.STORY_LEVELS) {
            return this.table[level];
        }

        // Бесконечный режим
        var n = level - ECO.Config.STORY_LEVELS;
        var mazeCells = Math.min(15, 13 + Math.floor(n / 3) * 2);
        return {
            mazeCells: mazeCells,
            trash: Math.min(12 + n * 2, Math.floor(mazeCells * mazeCells * 0.3)),
            rats: Math.min(4, 2 + Math.floor(n / 2)),
            cat: true,
            flower: n % 2 === 0,
            sneakers: true,
            compass: true,
            baseTime: 150000 + n * 15000,
            ratSpeedMult: 1 + n * ECO.Config.RAT_SPEED_SCALE_PER_LEVEL
        };
    }
};
