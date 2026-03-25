// ECO.Config — все игровые константы
var ECO = window.ECO || {};

ECO.Config = {
    // Размер тайла (базовый, масштабируется под экран)
    TILE_SIZE: 40,

    // Игрок
    PLAYER_BASE_SPEED: 2.5,       // тайлов/сек
    SPEED_BOOST_PER_TRASH: 0.15,  // прибавка за каждый мусор
    PLAYER_MOVE_LERP: 0.15,       // плавность интерполяции

    // Крысы
    RAT_BASE_SPEED: 2.0,          // тайлов/сек
    RAT_PATH_UPDATE_MS: 500,      // пересчёт пути
    RAT_SPEED_SCALE_PER_LEVEL: 0.05, // +5% за уровень в бесконечном

    // Котик
    CAT_FREEZE_DURATION: 15000,   // 15 сек заморозка
    CAT_FOLLOW_SPEED: 5.0,        // скорость следования
    CAT_RETURN_SPEED: 5.0,        // скорость возврата

    // Цветочек
    FLOWER_WATER_DURATION: 1000,  // 1 сек анимация полива

    // Кроссовки
    SNEAKERS_DURATION: 5000,      // 5 сек x2 скорость
    SNEAKERS_MULTIPLIER: 2.0,

    // Компас
    COMPASS_DURATION: 10000,      // 10 сек стрелка

    // Комбо
    COMBO_WINDOW: 3000,           // 3 сек окно комбо
    COMBO_SPEED_BOOST: 0.5,       // доп скорость при комбо
    COMBO_BOOST_DURATION: 2000,   // длительность буста комбо

    // Простой
    IDLE_PENALTY_MS: 30000,       // 30 сек без сбора → доп мусор
    IDLE_MAX_EXTRA_TRASH: 3,      // макс доп мусор за уровень

    // Мусор "воняет"
    TRASH_STINK_DELAY: 20000,     // через 20 сек начинает вонять

    // Эко-факты
    FACT_ROTATE_MS: 15000,        // смена факта каждые 15 сек

    // Звёзды
    STAR_3_TIME_MULTIPLIER: 1.0,  // базовое время * множитель
    STAR_2_TIME_MULTIPLIER: 1.5,
    STAR_1_TIME_MULTIPLIER: 999,  // всё что больше

    // Лабиринт
    WALL_REMOVAL_PERCENT: 0.15,   // 15% стен удалять для петель
    MIN_BUCKET_DISTANCE: 0.6,     // мин дистанция ведёрка (% от макс)
    MIN_RAT_SPAWN_DISTANCE: 0.6,  // мин дистанция спавна крысы

    // UI
    DPAD_SIZE: 60,                // мин размер кнопки D-pad (px)
    LEVEL_COMPLETE_DELAY: 3000,   // задержка перед следующим уровнем
    GAME_OVER_DELAY: 2000,        // задержка перед рестартом

    // Спецтайлы
    SPECIAL_TILE_MIN: 3,          // мин спецтайлов за уровень
    SPECIAL_TILE_MAX: 7,          // макс спецтайлов за уровень
    SLOW_TILE_MULT: 0.45,         // множитель скорости на замедляющих тайлах
    ICE_SLIDE_SPEED: 6.0,         // скорость скольжения по льду (тайлов/сек)
    BOOST_TILE_MULT: 2.5,         // множитель скорости на ускоряющих тайлах

    // Анимация
    DT_CAP: 50,                   // макс dt (мс) — предотвращает телепортацию

    // Режимы
    STORY_LEVELS: 5,              // количество сюжетных уровней

    // Направления
    DIR: {
        NONE: 0,
        UP: 1,
        DOWN: 2,
        LEFT: 3,
        RIGHT: 4
    },

    // Скины персонажа
    SKINS: [
        { name: 'Эко', type: 'chibi', gender: 'girl', dress: '#4CAF50' },
        { name: 'Маша', gender: 'girl', hair: '#5D4037', hairBase: '#4E342E', dress: '#4CAF50', dressAccent: '#388E3C', ribbon: '#E91E63', shoes: '#5D4037' },
        { name: 'Алиса', gender: 'girl', hair: '#FFD54F', hairBase: '#FFC107', dress: '#E91E63', dressAccent: '#C2185B', ribbon: '#9C27B0', shoes: '#4E342E' },
        { name: 'Лиза', gender: 'girl', hair: '#D84315', hairBase: '#BF360C', dress: '#2196F3', dressAccent: '#1565C0', ribbon: '#FF9800', shoes: '#3E2723' },
        { name: 'Коля', gender: 'boy', hair: '#5D4037', hairBase: '#4E342E', shirt: '#2196F3', shirtAccent: '#1565C0', pants: '#37474F', shoes: '#5D4037' },
        { name: 'Дима', gender: 'boy', hair: '#212121', hairBase: '#111', shirt: '#4CAF50', shirtAccent: '#388E3C', pants: '#455A64', shoes: '#3E2723' },
        { name: 'Саша', gender: 'boy', hair: '#8D6E63', hairBase: '#6D4C41', shirt: '#FF9800', shirtAccent: '#E65100', pants: '#546E7A', shoes: '#4E342E' }
    ],

    // Состояния игры
    STATE: {
        MENU: 'menu',
        PLAYING: 'playing',
        LEVEL_COMPLETE: 'level_complete',
        GAME_OVER: 'game_over',
        VICTORY: 'victory',
        WATERING: 'watering'
    }
};
