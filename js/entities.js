// ECO.Entities — все игровые сущности
ECO.Entities = {
    // Создать игрока
    createPlayer: function(tileX, tileY) {
        return {
            type: 'player',
            active: true,
            tileX: tileX,
            tileY: tileY,
            pixelX: 0,
            pixelY: 0,
            targetTileX: tileX,
            targetTileY: tileY,
            moving: false,
            moveProgress: 0,
            direction: ECO.Config.DIR.DOWN,
            speed: ECO.Config.PLAYER_BASE_SPEED,
            bagSize: 0,
            hasShield: false,
            frame: 0,
            frameTimer: 0,
            _wallBlockedDir: 0,
            _bufferedDir: 0,
            _onSpecialTile: false,
            _iceSliding: false,

            update: function(dt, grid) {
                var ts = ECO.Renderer.tileSize;

                // Анимация ходьбы
                this.frameTimer += dt;
                if (this.frameTimer > 200) {
                    this.frameTimer = 0;
                    this.frame++;
                }

                // Движение
                if (this.moving) {
                    // Буферизация ввода: запомнить направление для поворота
                    var inputDir = ECO.Input.direction;
                    if (inputDir !== ECO.Config.DIR.NONE && inputDir !== this.direction) {
                        this._bufferedDir = inputDir;
                    }

                    var moveSpeed = this.speed;
                    // Спецтайлы влияют на скорость
                    if (this._onSpecialTile === 'slow') {
                        moveSpeed *= ECO.Config.SLOW_TILE_MULT;
                    } else if (this._onSpecialTile === 'boost') {
                        moveSpeed *= ECO.Config.BOOST_TILE_MULT;
                    } else if (this._iceSliding) {
                        moveSpeed = ECO.Config.ICE_SLIDE_SPEED;
                    }
                    var advance = moveSpeed * dt / 1000;
                    this.moveProgress += advance;

                    // Защита от застревания: если движение не прогрессирует
                    if (advance === 0) {
                        this._stuckTimer = (this._stuckTimer || 0) + 1;
                        if (this._stuckTimer > 5) {
                            // Принудительно завершить движение
                            this.tileX = this.targetTileX;
                            this.tileY = this.targetTileY;
                            this.moving = false;
                            this.moveProgress = 0;
                            this._stuckTimer = 0;
                        }
                    } else {
                        this._stuckTimer = 0;
                    }

                    if (this.moveProgress >= 1) {
                        this.tileX = this.targetTileX;
                        this.tileY = this.targetTileY;
                        this.moving = false;
                        this.moveProgress = 0;
                        this._onSpecialTile = false;

                        // Проверить спецтайл на новой позиции
                        var stMap = ECO.Game.specialTileMap;
                        var stKey = this.tileX + ',' + this.tileY;
                        if (stMap && stMap[stKey]) {
                            var tile = stMap[stKey];
                            this._onSpecialTile = tile.type;
                            if (tile.type === 'ice') {
                                // Скольжение — продолжить в том же направлении
                                this._iceSliding = true;
                            }
                        }

                        // Потребить буфер: попробовать повернуть сразу
                        if (this._bufferedDir && this._bufferedDir !== ECO.Config.DIR.NONE && !this._iceSliding) {
                            var bNext = ECO.Collision.getNextTile(this.tileX, this.tileY, this._bufferedDir);
                            if (ECO.Collision.canMoveTo(grid, bNext.x, bNext.y)) {
                                this.direction = this._bufferedDir;
                                this.targetTileX = bNext.x;
                                this.targetTileY = bNext.y;
                                this.moving = true;
                                this.moveProgress = 0;
                                this._stuckTimer = 0;
                                this._wallBlockedDir = 0;
                                this._bumpDir = 0;
                                this._bumpTimer = 0;
                            }
                            this._bufferedDir = 0;
                        }
                    }
                }

                if (!this.moving) {
                    // Лёд: автоматически скользить в текущем направлении
                    if (this._iceSliding && this.direction !== ECO.Config.DIR.NONE) {
                        var iceNext = ECO.Collision.getNextTile(this.tileX, this.tileY, this.direction);
                        if (ECO.Collision.canMoveTo(grid, iceNext.x, iceNext.y)) {
                            this.targetTileX = iceNext.x;
                            this.targetTileY = iceNext.y;
                            this.moving = true;
                            this.moveProgress = 0;
                            this._stuckTimer = 0;
                        } else {
                            this._iceSliding = false; // Стена — стоп
                        }
                    }
                }

                if (!this.moving && !this._iceSliding) {
                    this._bufferedDir = 0;
                    var dir = ECO.Input.direction;
                    if (dir !== ECO.Config.DIR.NONE) {
                        if (dir === this._wallBlockedDir) {
                            // Та же стена — просто пропускаем, не трогаем ввод
                        } else {
                            this._wallBlockedDir = 0;
                            this.direction = dir;
                            var next = ECO.Collision.getNextTile(this.tileX, this.tileY, dir);
                            if (ECO.Collision.canMoveTo(grid, next.x, next.y)) {
                                this.targetTileX = next.x;
                                this.targetTileY = next.y;
                                this.moving = true;
                                this.moveProgress = 0;
                                this._stuckTimer = 0;
                                this._bumpDir = 0;
                                this._bumpTimer = 0;
                            } else {
                                // Стена — блокируем это направление
                                this._wallBlockedDir = dir;
                                if (this._bumpTimer <= 0) {
                                    this._bumpDir = dir;
                                    this._bumpTimer = 150;
                                }
                            }
                        }
                    } else {
                        this._wallBlockedDir = 0;
                    }
                }

                // Bump-таймер
                if (this._bumpTimer > 0) {
                    this._bumpTimer -= dt;
                    if (this._bumpTimer < 0) this._bumpTimer = 0;
                }

                // Пиксельная позиция (интерполяция)
                if (this.moving) {
                    this.pixelX = ECO.Utils.lerp(this.tileX * ts, this.targetTileX * ts, this.moveProgress);
                    this.pixelY = ECO.Utils.lerp(this.tileY * ts, this.targetTileY * ts, this.moveProgress);
                } else {
                    this.pixelX = this.tileX * ts;
                    this.pixelY = this.tileY * ts;
                    // Bump-смещение: небольшой толчок в сторону стены и обратно
                    if (this._bumpTimer > 0) {
                        var bumpAmount = Math.sin(this._bumpTimer / 150 * Math.PI) * ts * 0.1;
                        var DIR = ECO.Config.DIR;
                        if (this._bumpDir === DIR.UP) this.pixelY -= bumpAmount;
                        else if (this._bumpDir === DIR.DOWN) this.pixelY += bumpAmount;
                        else if (this._bumpDir === DIR.LEFT) this.pixelX -= bumpAmount;
                        else if (this._bumpDir === DIR.RIGHT) this.pixelX += bumpAmount;
                    }
                }
            },

            draw: function(ctx, x, y, ts) {
                var skinIdx = ECO.Game.selectedSkin || 0;
                var skin = ECO.Config.SKINS[skinIdx] || ECO.Config.SKINS[0];
                if (skin.gender === 'boy') {
                    ECO.Sprites.drawBoy(ctx, x, y, ts, this.direction, this.bagSize, this.frame, this.hasShield, skinIdx);
                } else {
                    ECO.Sprites.drawGirl(ctx, x, y, ts, this.direction, this.bagSize, this.frame, this.hasShield, skinIdx);
                }
            }
        };
    },

    // Мусор
    createTrash: function(tileX, tileY, trashType) {
        return {
            type: 'trash',
            active: true,
            tileX: tileX,
            tileY: tileY,
            pixelX: tileX * (ECO.Renderer.tileSize || 40),
            pixelY: tileY * (ECO.Renderer.tileSize || 40),
            trashType: trashType || ECO.Utils.randomChoice(['banana', 'apple', 'can', 'plasticbag', 'paper', 'bottle']),
            spawnTime: Date.now(),
            stinkLevel: 0,

            update: function(dt) {
                var ts = ECO.Renderer.tileSize;
                this.pixelX = this.tileX * ts;
                this.pixelY = this.tileY * ts;
                // Вонь
                var age = Date.now() - this.spawnTime;
                if (age > ECO.Config.TRASH_STINK_DELAY) {
                    this.stinkLevel = Math.min(1, (age - ECO.Config.TRASH_STINK_DELAY) / 10000);
                }
            },

            draw: function(ctx, x, y, ts) {
                ECO.Sprites.drawTrash(ctx, x, y, ts, this.trashType, this.stinkLevel);
            }
        };
    },

    // Ведёрко
    createBucket: function(tileX, tileY) {
        return {
            type: 'bucket',
            active: true,
            tileX: tileX,
            tileY: tileY,
            pixelX: tileX * (ECO.Renderer.tileSize || 40),
            pixelY: tileY * (ECO.Renderer.tileSize || 40),
            isFull: false,
            bounceTimer: 0,

            update: function(dt) {
                var ts = ECO.Renderer.tileSize;
                this.pixelX = this.tileX * ts;
                this.pixelY = this.tileY * ts;
                if (this.bounceTimer > 0) {
                    this.bounceTimer -= dt;
                }
            },

            draw: function(ctx, x, y, ts) {
                var bounceY = 0;
                if (this.bounceTimer > 0) {
                    bounceY = -Math.sin(this.bounceTimer / 300 * Math.PI) * 5;
                }
                var playerAngle = 0;
                if (ECO.Game && ECO.Game.player) {
                    playerAngle = ECO.Utils.angleTo(this.pixelX, this.pixelY, ECO.Game.player.pixelX, ECO.Game.player.pixelY);
                }
                ECO.Sprites.drawBucket(ctx, x, y + bounceY, ts, this.isFull, playerAngle);
            }
        };
    },

    // Выход
    createExit: function(tileX, tileY) {
        return {
            type: 'exit',
            active: true,
            tileX: tileX,
            tileY: tileY,
            pixelX: tileX * (ECO.Renderer.tileSize || 40),
            pixelY: tileY * (ECO.Renderer.tileSize || 40),
            isOpen: false,
            visible: false, // не показывать до сдачи мусора
            openProgress: 0, // 0..1 анимация открытия дверей

            update: function(dt) {
                var ts = ECO.Renderer.tileSize;
                this.pixelX = this.tileX * ts;
                this.pixelY = this.tileY * ts;
                // Плавная анимация открытия
                if (this.isOpen && this.openProgress < 1) {
                    this.openProgress = Math.min(1, this.openProgress + dt / 600);
                }
            },

            draw: function(ctx, x, y, ts) {
                if (!this.visible) return; // скрыт до сдачи мусора
                ECO.Sprites.drawExit(ctx, x, y, ts, this.isOpen, this.openProgress);
            }
        };
    },

    // Крыса
    createRat: function(tileX, tileY, speedMult) {
        return {
            type: 'rat',
            active: true,
            tileX: tileX,
            tileY: tileY,
            pixelX: tileX * (ECO.Renderer.tileSize || 40),
            pixelY: tileY * (ECO.Renderer.tileSize || 40),
            targetTileX: tileX,
            targetTileY: tileY,
            moving: false,
            moveProgress: 0,
            direction: ECO.Config.DIR.DOWN,
            speed: ECO.Config.RAT_BASE_SPEED * (speedMult || 1),
            frozen: false,
            path: [],
            pathTimer: 0,
            frame: 0,

            update: function(dt, grid, playerTileX, playerTileY) {
                var ts = ECO.Renderer.tileSize;
                if (!this.frozen) this.frame++;

                // Детекция застревания: если крыса не двигается > 800мс
                if (!this.frozen && !this.moving) {
                    this._ratStuck = (this._ratStuck || 0) + dt;
                    if (this._ratStuck > 800) {
                        this._ratStuck = 0;
                        this.path = [];
                        this._pendingPath = null;
                        this.pathTimer = 9999; // форсировать пересчёт
                    }
                } else {
                    this._ratStuck = 0;
                }

                // Пересчёт пути (чаще вблизи игрока)
                this.pathTimer += dt;
                var dist = Math.abs(this.tileX - playerTileX) + Math.abs(this.tileY - playerTileY);
                var interval = dist <= 2 ? 50 : ECO.Config.RAT_PATH_UPDATE_MS;
                if (this.pathTimer >= interval) {
                    this.pathTimer = 0;
                    ECO.AI.updateRatPath(this, playerTileX, playerTileY, grid);
                }

                // Движение
                ECO.AI.moveRat(this, dt, grid, this.speed);

                // Пиксельная позиция
                if (this.moving) {
                    this.pixelX = ECO.Utils.lerp(this.tileX * ts, this.targetTileX * ts, this.moveProgress);
                    this.pixelY = ECO.Utils.lerp(this.tileY * ts, this.targetTileY * ts, this.moveProgress);
                } else {
                    this.pixelX = this.tileX * ts;
                    this.pixelY = this.tileY * ts;
                }
            },

            draw: function(ctx, x, y, ts) {
                ECO.Sprites.drawRat(ctx, x, y, ts, this.direction, this.frozen, this.frame);
            }
        };
    },

    // Котик (пауэр-ап на земле)
    createCatPowerup: function(tileX, tileY) {
        return {
            type: 'cat_powerup',
            active: true,
            tileX: tileX,
            tileY: tileY,
            pixelX: tileX * (ECO.Renderer.tileSize || 40),
            pixelY: tileY * (ECO.Renderer.tileSize || 40),
            frame: 0,

            update: function(dt) {
                var ts = ECO.Renderer.tileSize;
                this.pixelX = this.tileX * ts;
                this.pixelY = this.tileY * ts;
                this.frame++;
            },

            draw: function(ctx, x, y, ts) {
                ECO.Sprites.drawCat(ctx, x, y, ts, this.frame, false);
            }
        };
    },

    // Котик-охотник (бежит к крысам и убивает их)
    createCatFollower: function(tileX, tileY, homeTileX, homeTileY) {
        return {
            type: 'cat_follower',
            active: true,
            tileX: tileX,
            tileY: tileY,
            pixelX: tileX * (ECO.Renderer.tileSize || 40),
            pixelY: tileY * (ECO.Renderer.tileSize || 40),
            homeTileX: homeTileX,
            homeTileY: homeTileY,
            targetTileX: tileX,
            targetTileY: tileY,
            direction: ECO.Config.DIR.DOWN,
            moving: false,
            moveProgress: 0,
            path: [],
            pathTimer: 0,
            state: 'hunting', // hunting, returning, sleeping
            targetRat: null,
            timer: ECO.Config.CAT_FREEZE_DURATION,
            frame: 0,

            _findNearestRat: function() {
                var entities = ECO.Game.entities;
                var minDist = Infinity;
                var nearest = null;
                for (var i = 0; i < entities.length; i++) {
                    var e = entities[i];
                    if (e.type === 'rat' && e.active && !e.frozen) {
                        var d = Math.abs(e.tileX - this.tileX) + Math.abs(e.tileY - this.tileY);
                        if (d < minDist) {
                            minDist = d;
                            nearest = e;
                        }
                    }
                }
                return nearest;
            },

            update: function(dt, grid, playerTileX, playerTileY) {
                var ts = ECO.Renderer.tileSize;
                this.frame++;

                if (this.state === 'hunting') {
                    this.timer -= dt;
                    if (this.timer <= 0) {
                        this.state = 'returning';
                        this.path = [];
                        this.targetRat = null;
                    }
                }

                // Найти цель
                if (this.state === 'hunting') {
                    if (!this.targetRat || !this.targetRat.active) {
                        this.targetRat = this._findNearestRat();
                        this.path = [];
                    }
                    if (!this.targetRat) {
                        this.state = 'returning';
                        this.path = [];
                    }
                }

                // Определить координаты цели
                var targetX, targetY;
                if (this.state === 'hunting' && this.targetRat) {
                    targetX = this.targetRat.tileX;
                    targetY = this.targetRat.tileY;
                } else {
                    targetX = this.homeTileX;
                    targetY = this.homeTileY;
                }

                ECO.AI.moveCatFollower(this, targetX, targetY, grid, dt);

                // Проверка: кот поймал крысу?
                if (this.state === 'hunting' && this.targetRat && this.targetRat.active) {
                    if (this.tileX === this.targetRat.tileX && this.tileY === this.targetRat.tileY) {
                        this.targetRat.active = false;
                        ECO.Animations.spawnConfetti(this.targetRat.pixelX + ts / 2, this.targetRat.pixelY, 15);
                        ECO.Animations.spawnFloatingText(
                            this.targetRat.pixelX + ts / 2, this.targetRat.pixelY,
                            'Мяу!', '#FF9800'
                        );
                        ECO.Audio.playPickup();
                        this.targetRat = null;
                        this.path = [];
                    }
                }

                // Пиксельная позиция
                if (this.moving) {
                    this.pixelX = ECO.Utils.lerp(this.tileX * ts, this.targetTileX * ts, this.moveProgress);
                    this.pixelY = ECO.Utils.lerp(this.tileY * ts, this.targetTileY * ts, this.moveProgress);
                } else {
                    this.pixelX = this.tileX * ts;
                    this.pixelY = this.tileY * ts;
                }
            },

            draw: function(ctx, x, y, ts) {
                ECO.Sprites.drawCat(ctx, x, y, ts, this.frame, this.state === 'sleeping');
            }
        };
    },

    // Цветочек
    createFlower: function(tileX, tileY) {
        return {
            type: 'flower',
            active: true,
            tileX: tileX,
            tileY: tileY,
            pixelX: tileX * (ECO.Renderer.tileSize || 40),
            pixelY: tileY * (ECO.Renderer.tileSize || 40),
            watered: false,

            update: function(dt) {
                var ts = ECO.Renderer.tileSize;
                this.pixelX = this.tileX * ts;
                this.pixelY = this.tileY * ts;
            },

            draw: function(ctx, x, y, ts) {
                ECO.Sprites.drawFlower(ctx, x, y, ts, this.watered);
            }
        };
    },

    // Кроссовки
    createSneakers: function(tileX, tileY) {
        return {
            type: 'sneakers',
            active: true,
            tileX: tileX,
            tileY: tileY,
            pixelX: tileX * (ECO.Renderer.tileSize || 40),
            pixelY: tileY * (ECO.Renderer.tileSize || 40),

            update: function(dt) {
                var ts = ECO.Renderer.tileSize;
                this.pixelX = this.tileX * ts;
                this.pixelY = this.tileY * ts;
            },

            draw: function(ctx, x, y, ts) {
                ECO.Sprites.drawSneakers(ctx, x, y, ts);
            }
        };
    },

    // Компас
    createCompass: function(tileX, tileY) {
        return {
            type: 'compass',
            active: true,
            tileX: tileX,
            tileY: tileY,
            pixelX: tileX * (ECO.Renderer.tileSize || 40),
            pixelY: tileY * (ECO.Renderer.tileSize || 40),

            update: function(dt) {
                var ts = ECO.Renderer.tileSize;
                this.pixelX = this.tileX * ts;
                this.pixelY = this.tileY * ts;
            },

            draw: function(ctx, x, y, ts) {
                ECO.Sprites.drawCompass(ctx, x, y, ts);
            }
        };
    }
};
