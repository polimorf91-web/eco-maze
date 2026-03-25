// ECO.Input — управление (D-pad тач + клавиатура)
ECO.Input = {
    direction: 0, // ECO.Config.DIR.*
    _pressed: {},
    _keyMap: {},
    _activeTouches: {}, // touchId → dir
    _dpadButtons: {},   // dir → DOM element

    init: function() {
        var self = this;
        var DIR = ECO.Config.DIR;

        // Маппинг клавиш → направление (EN + RU раскладки)
        this._keyMap = {
            'ArrowUp': DIR.UP, 'w': DIR.UP, 'W': DIR.UP, 'ц': DIR.UP, 'Ц': DIR.UP,
            'ArrowDown': DIR.DOWN, 's': DIR.DOWN, 'S': DIR.DOWN, 'ы': DIR.DOWN, 'Ы': DIR.DOWN,
            'ArrowLeft': DIR.LEFT, 'a': DIR.LEFT, 'A': DIR.LEFT, 'ф': DIR.LEFT, 'Ф': DIR.LEFT,
            'ArrowRight': DIR.RIGHT, 'd': DIR.RIGHT, 'D': DIR.RIGHT, 'в': DIR.RIGHT, 'В': DIR.RIGHT
        };

        // Маппинг по коду клавиши (работает независимо от раскладки)
        this._codeMap = {
            'KeyW': DIR.UP, 'KeyS': DIR.DOWN, 'KeyA': DIR.LEFT, 'KeyD': DIR.RIGHT
        };

        // Клавиатура
        // ВАЖНО: preventDefault() только на первом нажатии, НЕ на repeat!
        // Повторные keydown с preventDefault() забивают event queue и блокируют таймеры/рендер.
        document.addEventListener('keydown', function(e) {
            var dir = self._keyMap[e.key] !== undefined ? self._keyMap[e.key] : self._codeMap[e.code];
            if (dir !== undefined) {
                if (e.repeat) return;
                e.preventDefault();
                // Resume AudioContext on first user gesture (iOS fix)
                if (ECO.Audio._resume) ECO.Audio._resume();
                var k = e.code || e.key; // используем code как ключ (стабилен между раскладками)
                self._pressed[k] = dir;
                self.direction = dir;
                if (ECO.Game._inputTick) ECO.Game._inputTick();
            }
        });
        document.addEventListener('keyup', function(e) {
            var k = e.code || e.key;
            if (self._pressed[k] !== undefined) {
                delete self._pressed[k];
                self._resolveDirection();
            }
        });

        // D-pad тач — отслеживание через touch ID
        this._setupDpad('btn-up', DIR.UP);
        this._setupDpad('btn-down', DIR.DOWN);
        this._setupDpad('btn-left', DIR.LEFT);
        this._setupDpad('btn-right', DIR.RIGHT);

        // Запрет контекстного меню и жестов на D-pad
        var dpad = document.getElementById('dpad');
        if (dpad) {
            dpad.addEventListener('contextmenu', function(e) { e.preventDefault(); });
            // touchmove: блокировать жесты + использовать как источник game tick
            dpad.addEventListener('touchmove', function(e) {
                e.preventDefault();
                if (ECO.Game._inputTick) ECO.Game._inputTick();
            }, { passive: false });
        }

        // Глобальный safety net: если все тачи кончились — сбросить направление
        document.addEventListener('touchend', function(e) {
            self._cleanupTouches(e.touches);
        });
        document.addEventListener('touchcancel', function(e) {
            self._cleanupTouches(e.touches);
        });

        // Кнопка mute
        var muteBtn = document.getElementById('btn-mute');
        if (muteBtn) {
            var updateMuteIcon = function() {
                muteBtn.textContent = ECO.Audio.enabled ? '\uD83D\uDD0A' : '\uD83D\uDD07';
            };
            muteBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (ECO.Audio.enabled) {
                    ECO.Audio.enabled = false;
                    ECO.Audio.stopMusic();
                } else {
                    ECO.Audio.enabled = true;
                    if (ECO.Game.state === 'playing') {
                        ECO.Audio.startMusic(ECO.Game._themeIndex);
                    } else if (ECO.Game.state === 'menu') {
                        ECO.Audio.startMenuMusic();
                    }
                }
                updateMuteIcon();
            });
            muteBtn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                muteBtn.click();
            }, { passive: false });
            updateMuteIcon();
        }
    },

    // Определить текущее направление из оставшихся нажатых клавиш/тачей
    _resolveDirection: function() {
        var DIR = ECO.Config.DIR;

        // Сначала проверить тачи (приоритет последнего)
        var touchKeys = Object.keys(this._activeTouches);
        if (touchKeys.length > 0) {
            this.direction = this._activeTouches[touchKeys[touchKeys.length - 1]];
            return;
        }

        // Потом клавиатуру
        var keys = Object.keys(this._pressed);
        if (keys.length > 0) {
            this.direction = this._pressed[keys[keys.length - 1]];
            return;
        }

        this.direction = DIR.NONE;
    },

    // Удалить тачи, которых больше нет в списке активных
    _cleanupTouches: function(activeTouchList) {
        // Собрать ID всех ещё живых тачей
        var alive = {};
        if (activeTouchList) {
            for (var i = 0; i < activeTouchList.length; i++) {
                alive[activeTouchList[i].identifier] = true;
            }
        }

        // Удалить мёртвые тачи из нашего трекинга
        var changed = false;
        for (var id in this._activeTouches) {
            if (!alive[id]) {
                delete this._activeTouches[id];
                changed = true;
            }
        }

        if (changed) {
            // Снять подсветку со всех кнопок, у которых нет активного тача
            var activeDirs = {};
            for (var tid in this._activeTouches) {
                activeDirs[this._activeTouches[tid]] = true;
            }
            for (var dir in this._dpadButtons) {
                if (!activeDirs[dir]) {
                    this._dpadButtons[dir].classList.remove('active');
                }
            }

            this._resolveDirection();
        }
    },

    _setupDpad: function(id, dir) {
        var el = document.getElementById(id);
        if (!el) return;
        var self = this;

        this._dpadButtons[dir] = el;

        el.addEventListener('touchstart', function(e) {
            e.preventDefault();
            // Регистрируем каждый палец
            for (var i = 0; i < e.changedTouches.length; i++) {
                self._activeTouches[e.changedTouches[i].identifier] = dir;
            }
            self.direction = dir;
            el.classList.add('active');
        }, { passive: false });

        el.addEventListener('touchend', function(e) {
            e.preventDefault();
            for (var i = 0; i < e.changedTouches.length; i++) {
                delete self._activeTouches[e.changedTouches[i].identifier];
            }
            self._resolveDirection();
            // Снять подсветку только если нет других тачей на этой кнопке
            var hasTouch = false;
            for (var tid in self._activeTouches) {
                if (self._activeTouches[tid] === dir) { hasTouch = true; break; }
            }
            if (!hasTouch) el.classList.remove('active');
        }, { passive: false });

        el.addEventListener('touchcancel', function(e) {
            e.preventDefault();
            for (var i = 0; i < e.changedTouches.length; i++) {
                delete self._activeTouches[e.changedTouches[i].identifier];
            }
            self._resolveDirection();
            var hasTouch = false;
            for (var tid in self._activeTouches) {
                if (self._activeTouches[tid] === dir) { hasTouch = true; break; }
            }
            if (!hasTouch) el.classList.remove('active');
        }, { passive: false });

        // Mouse events для десктопа
        el.addEventListener('mousedown', function(e) {
            e.preventDefault();
            self._mouseDir = dir;
            self.direction = dir;
            el.classList.add('active');
        });
        el.addEventListener('mouseup', function(e) {
            e.preventDefault();
            if (self._mouseDir === dir) {
                self._mouseDir = null;
                self._resolveDirection();
            }
            el.classList.remove('active');
        });
        el.addEventListener('mouseleave', function(e) {
            if (self._mouseDir === dir) {
                self._mouseDir = null;
                self._resolveDirection();
            }
            el.classList.remove('active');
        });
    },

    reset: function() {
        this.direction = ECO.Config.DIR.NONE;
        this._pressed = {};
        this._activeTouches = {};
        this._mouseDir = null;
        // Снять подсветку со всех кнопок
        for (var dir in this._dpadButtons) {
            this._dpadButtons[dir].classList.remove('active');
        }
    }
};
