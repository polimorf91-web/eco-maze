// ECO.Themes — 12 визуальных тем с тематическими стенами-объектами
ECO.Themes = {
    // Хелпер: рисовать с clip чтобы ничего не вылезло за тайл
    _clipped: function(ctx, x, y, s, fn) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, s, s);
        ctx.clip();
        fn(ctx, x, y, s);
        ctx.restore();
    },

    // Детерминистический хеш по координатам тайла → число 0..n-1
    _tileHash: function(tx, ty, n) {
        var h = ((tx * 7 + ty * 13 + tx * ty * 3) & 0x7FFFFFFF) % n;
        return h;
    },

    list: [
        // ============ 1. ГОРОД ============
        {
            name: 'Город',
            wallColor: '#78909C',
            wallPattern: function(ctx, x, y, s, tx, ty) {
                ECO.Themes._clipped(ctx, x, y, s, function(c, x, y, s) {
                    var v = ECO.Themes._tileHash(tx || 0, ty || 0, 4);
                    // Вариации цвета фасада
                    var facades = ['#78909C', '#8D6E63', '#7E8A95', '#6D8090'];
                    var borders = ['#607D8B', '#6D4C41', '#5F6E78', '#546E7A'];
                    var winColors = ['#BBDEFB', '#FFF9C4', '#C8E6C9', '#FFE0B2'];
                    c.fillStyle = borders[v];
                    c.fillRect(x, y, s, s);
                    c.fillStyle = facades[v];
                    c.fillRect(x + 1, y + 1, s - 2, s - 2);
                    // Окна — разные раскладки
                    c.fillStyle = winColors[v];
                    var ws = s * 0.22;
                    var gap = s * 0.12;
                    if (v === 0 || v === 2) {
                        // 2x2 окна
                        c.fillRect(x + gap, y + gap, ws, ws);
                        c.fillRect(x + s - gap - ws, y + gap, ws, ws);
                        c.fillRect(x + gap, y + s - gap - ws, ws, ws);
                        c.fillRect(x + s - gap - ws, y + s - gap - ws, ws, ws);
                    } else if (v === 1) {
                        // 3 маленьких окна вверху, дверь внизу
                        var sw = s * 0.16;
                        c.fillRect(x + s * 0.08, y + gap, sw, sw);
                        c.fillRect(x + s * 0.42 - sw / 2, y + gap, sw, sw);
                        c.fillRect(x + s - s * 0.08 - sw, y + gap, sw, sw);
                        c.fillStyle = '#5D4037';
                        c.fillRect(x + s * 0.35, y + s * 0.55, s * 0.3, s * 0.42);
                    } else {
                        // Одно большое окно-витрина
                        c.fillRect(x + gap, y + gap, s - gap * 2, s * 0.35);
                        c.fillStyle = '#5D4037';
                        c.fillRect(x + s * 0.3, y + s * 0.6, s * 0.4, s * 0.38);
                    }
                });
            },
            floorColor: '#CFD8DC',
            floorPattern: function(ctx, x, y, s) {
                ECO.Themes._clipped(ctx, x, y, s, function(c, x, y, s) {
                    c.fillStyle = '#CFD8DC';
                    c.fillRect(x, y, s, s);
                    // Дорожная разметка
                    c.fillStyle = '#B0BEC5';
                    c.fillRect(x + s * 0.45, y, s * 0.1, s);
                });
            },
            bgColor: '#90A4AE',
            decoChance: 0.04,
            drawDeco: function(ctx, x, y, s) {
                // Фонарь
                ctx.fillStyle = '#455A64';
                ctx.fillRect(x + s * 0.45, y + s * 0.2, s * 0.1, s * 0.6);
                ctx.fillStyle = '#FFEB3B';
                ctx.beginPath();
                ctx.arc(x + s * 0.5, y + s * 0.18, s * 0.1, 0, Math.PI * 2);
                ctx.fill();
            }
        },
        // ============ 2. ДЕРЕВНЯ ============
        {
            name: 'Деревня',
            wallColor: '#795548',
            wallPattern: function(ctx, x, y, s, tx, ty) {
                ECO.Themes._clipped(ctx, x, y, s, function(c, x, y, s) {
                    var v = ECO.Themes._tileHash(tx || 0, ty || 0, 3);
                    var woodColors = ['#795548', '#8D6E63', '#6D4C41'];
                    var bgColors = ['#8D6E63', '#A1887F', '#7B5B4E'];
                    c.fillStyle = bgColors[v];
                    c.fillRect(x, y, s, s);
                    if (v === 0) {
                        // Забор с вертикальными досками
                        c.fillStyle = woodColors[v];
                        var bw = s / 4;
                        for (var i = 0; i < 4; i++) {
                            c.fillRect(x + i * bw + 1, y + s * 0.05, bw - 2, s * 0.9);
                        }
                        c.fillStyle = '#6D4C41';
                        c.fillRect(x, y + s * 0.25, s, s * 0.06);
                        c.fillRect(x, y + s * 0.7, s, s * 0.06);
                    } else if (v === 1) {
                        // Бревенчатая стена (горизонтальные брёвна)
                        c.fillStyle = woodColors[1];
                        for (var j = 0; j < 4; j++) {
                            c.fillRect(x + 1, y + j * s * 0.25 + 2, s - 2, s * 0.22);
                            c.strokeStyle = '#5D4037';
                            c.lineWidth = 0.5;
                            c.beginPath();
                            c.arc(x + s, y + j * s * 0.25 + s * 0.13, s * 0.1, 0, Math.PI * 2);
                            c.stroke();
                        }
                    } else {
                        // Плетень
                        c.strokeStyle = '#795548';
                        c.lineWidth = 2;
                        for (var k = 0; k < 5; k++) {
                            c.beginPath();
                            c.moveTo(x, y + k * s * 0.2 + s * 0.05);
                            c.quadraticCurveTo(x + s * 0.25, y + k * s * 0.2 - s * 0.05, x + s * 0.5, y + k * s * 0.2 + s * 0.05);
                            c.quadraticCurveTo(x + s * 0.75, y + k * s * 0.2 + s * 0.15, x + s, y + k * s * 0.2 + s * 0.05);
                            c.stroke();
                        }
                        // Колышки
                        c.fillStyle = '#5D4037';
                        c.fillRect(x + s * 0.15, y, s * 0.06, s);
                        c.fillRect(x + s * 0.5, y, s * 0.06, s);
                        c.fillRect(x + s * 0.85, y, s * 0.06, s);
                    }
                });
            },
            floorColor: '#8BC34A',
            floorPattern: function(ctx, x, y, s) {
                ECO.Themes._clipped(ctx, x, y, s, function(c, x, y, s) {
                    c.fillStyle = '#8BC34A';
                    c.fillRect(x, y, s, s);
                    // Травинки
                    c.strokeStyle = '#689F38';
                    c.lineWidth = 1;
                    for (var i = 0; i < 3; i++) {
                        var gx = x + s * (0.2 + i * 0.3);
                        var gy = y + s * 0.7;
                        c.beginPath();
                        c.moveTo(gx, gy + s * 0.2);
                        c.quadraticCurveTo(gx - 3, gy, gx + 2, gy - s * 0.1);
                        c.stroke();
                    }
                });
            },
            bgColor: '#689F38',
            decoChance: 0.05,
            drawDeco: function(ctx, x, y, s) {
                ctx.fillStyle = '#FDD835';
                ctx.beginPath();
                ctx.arc(x + s / 2, y + s * 0.6, s * 0.25, Math.PI, 0);
                ctx.fill();
                ctx.fillStyle = '#F9A825';
                ctx.fillRect(x + s * 0.25, y + s * 0.6, s * 0.5, s * 0.15);
            }
        },
        // ============ 3. ЦЕНТР ГОРОДА ============
        {
            name: 'Центр',
            wallColor: '#90A4AE',
            wallPattern: function(ctx, x, y, s, tx, ty) {
                ECO.Themes._clipped(ctx, x, y, s, function(c, x, y, s) {
                    // Высотное здание со стеклом
                    c.fillStyle = '#78909C';
                    c.fillRect(x, y, s, s);
                    // Стеклянный фасад
                    c.fillStyle = '#B0BEC5';
                    c.fillRect(x + 2, y + 2, s - 4, s - 4);
                    // Стеклянные панели
                    c.fillStyle = '#90CAF9';
                    c.globalAlpha = 0.4;
                    c.fillRect(x + 3, y + 3, s * 0.45 - 3, s * 0.45 - 3);
                    c.fillRect(x + s * 0.52, y + 3, s * 0.45 - 3, s * 0.45 - 3);
                    c.fillRect(x + 3, y + s * 0.52, s * 0.45 - 3, s * 0.45 - 3);
                    c.fillRect(x + s * 0.52, y + s * 0.52, s * 0.45 - 3, s * 0.45 - 3);
                    c.globalAlpha = 1;
                    // Каркас
                    c.strokeStyle = '#546E7A';
                    c.lineWidth = 1;
                    c.beginPath();
                    c.moveTo(x + s * 0.5, y);
                    c.lineTo(x + s * 0.5, y + s);
                    c.moveTo(x, y + s * 0.5);
                    c.lineTo(x + s, y + s * 0.5);
                    c.stroke();
                });
            },
            floorColor: '#ECEFF1',
            floorPattern: function(ctx, x, y, s) {
                ECO.Themes._clipped(ctx, x, y, s, function(c, x, y, s) {
                    // Тротуарная плитка
                    c.fillStyle = '#ECEFF1';
                    c.fillRect(x, y, s, s);
                    c.fillStyle = '#CFD8DC';
                    c.fillRect(x, y, s / 2, s / 2);
                    c.fillRect(x + s / 2, y + s / 2, s / 2, s / 2);
                });
            },
            bgColor: '#B0BEC5',
            decoChance: 0.03,
            drawDeco: function(ctx, x, y, s) {
                ctx.fillStyle = '#42A5F5';
                ctx.beginPath();
                ctx.arc(x + s / 2, y + s / 2, s * 0.2, 0, Math.PI * 2);
                ctx.fill();
            }
        },
        // ============ 4. МЕГАПОЛИС ============
        {
            name: 'Мегаполис',
            wallColor: '#37474F',
            wallPattern: function(ctx, x, y, s, tx, ty) {
                ECO.Themes._clipped(ctx, x, y, s, function(c, x, y, s) {
                    var v = ECO.Themes._tileHash(tx || 0, ty || 0, 4);
                    var baseColors = ['#37474F', '#2C3E50', '#34495E', '#3E2723'];
                    c.fillStyle = '#263238';
                    c.fillRect(x, y, s, s);
                    c.fillStyle = baseColors[v];
                    c.fillRect(x + 2, y, s - 4, s);
                    // Разные раскладки окон с разными неоновыми цветами
                    var palettes = [
                        ['#4FC3F7', '#CE93D8', '#FFD54F', '#80CBC4'],
                        ['#FF7043', '#42A5F5', '#66BB6A', '#AB47BC'],
                        ['#26C6DA', '#EF5350', '#FFA726', '#7E57C2'],
                        ['#EC407A', '#29B6F6', '#FFEE58', '#26A69A']
                    ];
                    var colors = palettes[v];
                    var winHash = ECO.Themes._tileHash(tx || 0, ty || 0, 6);
                    if (v < 2) {
                        // 2x3 окна
                        for (var row = 0; row < 3; row++) {
                            for (var col = 0; col < 2; col++) {
                                c.fillStyle = colors[(row + col + winHash) % colors.length];
                                c.globalAlpha = 0.6;
                                c.fillRect(x + s * 0.15 + col * s * 0.4, y + s * 0.1 + row * s * 0.28, s * 0.25, s * 0.18);
                                c.globalAlpha = 1;
                            }
                        }
                    } else {
                        // 3x2 маленьких окна
                        for (var r2 = 0; r2 < 2; r2++) {
                            for (var c2 = 0; c2 < 3; c2++) {
                                c.fillStyle = colors[(r2 + c2 + winHash) % colors.length];
                                c.globalAlpha = 0.6;
                                c.fillRect(x + s * 0.08 + c2 * s * 0.3, y + s * 0.15 + r2 * s * 0.4, s * 0.2, s * 0.25);
                                c.globalAlpha = 1;
                            }
                        }
                    }
                });
            },
            floorColor: '#455A64',
            floorPattern: function(ctx, x, y, s) {
                ECO.Themes._clipped(ctx, x, y, s, function(c, x, y, s) {
                    c.fillStyle = '#455A64';
                    c.fillRect(x, y, s, s);
                    // Асфальт с трещинами
                    c.strokeStyle = '#37474F';
                    c.lineWidth = 0.5;
                    c.beginPath();
                    c.moveTo(x + s * 0.3, y + s * 0.2);
                    c.lineTo(x + s * 0.6, y + s * 0.8);
                    c.stroke();
                });
            },
            bgColor: '#263238',
            decoChance: 0.04,
            drawDeco: function(ctx, x, y, s) {
                ctx.save();
                var colors = ['#E91E63', '#00BCD4', '#76FF03'];
                // Детерминистичный выбор цвета по позиции (без мерцания)
                var hash = (Math.round(x) * 7 + Math.round(y) * 13) & 0xFFFF;
                ctx.fillStyle = colors[hash % colors.length];
                ctx.globalAlpha = 0.5;
                ctx.fillRect(x + s * 0.15, y + s * 0.35, s * 0.7, s * 0.12);
                ctx.restore();
            }
        },
        // ============ 5. ПУСТЫНЯ ============
        {
            name: 'Пустыня',
            wallColor: '#D7CCC8',
            wallPattern: function(ctx, x, y, s, tx, ty) {
                ECO.Themes._clipped(ctx, x, y, s, function(c, x, y, s) {
                    // Песчаная скала / руины
                    c.fillStyle = '#BCAAA4';
                    c.fillRect(x, y, s, s);
                    // Камни
                    c.fillStyle = '#D7CCC8';
                    c.beginPath();
                    c.arc(x + s * 0.3, y + s * 0.4, s * 0.25, 0, Math.PI * 2);
                    c.fill();
                    c.beginPath();
                    c.arc(x + s * 0.7, y + s * 0.55, s * 0.22, 0, Math.PI * 2);
                    c.fill();
                    // Трещины
                    c.strokeStyle = '#A1887F';
                    c.lineWidth = 0.7;
                    c.beginPath();
                    c.moveTo(x + s * 0.2, y + s * 0.3);
                    c.lineTo(x + s * 0.5, y + s * 0.5);
                    c.lineTo(x + s * 0.4, y + s * 0.8);
                    c.stroke();
                });
            },
            floorColor: '#FFE0B2',
            floorPattern: function(ctx, x, y, s) {
                ECO.Themes._clipped(ctx, x, y, s, function(c, x, y, s) {
                    c.fillStyle = '#FFE0B2';
                    c.fillRect(x, y, s, s);
                    // Песчаные волны
                    c.strokeStyle = '#FFD54F';
                    c.lineWidth = 0.5;
                    c.beginPath();
                    c.moveTo(x, y + s * 0.4);
                    c.quadraticCurveTo(x + s * 0.5, y + s * 0.3, x + s, y + s * 0.45);
                    c.stroke();
                });
            },
            bgColor: '#FFCC80',
            decoChance: 0.04,
            drawDeco: function(ctx, x, y, s) {
                // Кактус
                ctx.fillStyle = '#66BB6A';
                ctx.fillRect(x + s * 0.4, y + s * 0.25, s * 0.2, s * 0.55);
                ctx.fillRect(x + s * 0.22, y + s * 0.35, s * 0.18, s * 0.1);
                ctx.fillRect(x + s * 0.22, y + s * 0.25, s * 0.08, s * 0.2);
                ctx.fillRect(x + s * 0.62, y + s * 0.45, s * 0.15, s * 0.1);
                ctx.fillRect(x + s * 0.7, y + s * 0.32, s * 0.07, s * 0.23);
            }
        },
        // ============ 6. ЗИМА ============
        {
            name: 'Зима',
            wallColor: '#B3E5FC',
            wallPattern: function(ctx, x, y, s, tx, ty) {
                ECO.Themes._clipped(ctx, x, y, s, function(c, x, y, s) {
                    var v = ECO.Themes._tileHash(tx || 0, ty || 0, 3);
                    c.fillStyle = '#E1F5FE';
                    c.fillRect(x, y, s, s);
                    if (v === 0) {
                        // Ёлка (3 яруса)
                        c.fillStyle = '#795548';
                        c.fillRect(x + s * 0.4, y + s * 0.7, s * 0.2, s * 0.25);
                        c.fillStyle = '#2E7D32';
                        c.beginPath(); c.moveTo(x + s * 0.5, y + s * 0.05); c.lineTo(x + s * 0.2, y + s * 0.35); c.lineTo(x + s * 0.8, y + s * 0.35); c.fill();
                        c.beginPath(); c.moveTo(x + s * 0.5, y + s * 0.2); c.lineTo(x + s * 0.15, y + s * 0.52); c.lineTo(x + s * 0.85, y + s * 0.52); c.fill();
                        c.beginPath(); c.moveTo(x + s * 0.5, y + s * 0.35); c.lineTo(x + s * 0.1, y + s * 0.72); c.lineTo(x + s * 0.9, y + s * 0.72); c.fill();
                    } else if (v === 1) {
                        // Снежный сугроб с кустом
                        c.fillStyle = '#FFF';
                        c.beginPath();
                        c.arc(x + s * 0.3, y + s * 0.6, s * 0.3, Math.PI, 0);
                        c.fill();
                        c.beginPath();
                        c.arc(x + s * 0.65, y + s * 0.55, s * 0.28, Math.PI, 0);
                        c.fill();
                        c.fillStyle = '#558B2F';
                        c.beginPath();
                        c.arc(x + s * 0.5, y + s * 0.35, s * 0.15, 0, Math.PI * 2);
                        c.fill();
                    } else {
                        // Берёза зимняя
                        c.fillStyle = '#ECEFF1';
                        c.fillRect(x + s * 0.42, y + s * 0.15, s * 0.16, s * 0.8);
                        c.fillStyle = '#37474F';
                        c.fillRect(x + s * 0.44, y + s * 0.25, s * 0.03, s * 0.06);
                        c.fillRect(x + s * 0.48, y + s * 0.45, s * 0.04, s * 0.05);
                        c.fillRect(x + s * 0.43, y + s * 0.6, s * 0.03, s * 0.04);
                        // Голые ветки
                        c.strokeStyle = '#78909C';
                        c.lineWidth = 1;
                        c.beginPath(); c.moveTo(x + s * 0.5, y + s * 0.3); c.lineTo(x + s * 0.2, y + s * 0.15); c.stroke();
                        c.beginPath(); c.moveTo(x + s * 0.5, y + s * 0.3); c.lineTo(x + s * 0.8, y + s * 0.2); c.stroke();
                        c.beginPath(); c.moveTo(x + s * 0.5, y + s * 0.45); c.lineTo(x + s * 0.25, y + s * 0.35); c.stroke();
                    }
                    // Снег
                    c.fillStyle = '#FFF';
                    c.beginPath();
                    c.arc(x + s * 0.35, y + s * 0.33, s * 0.06, 0, Math.PI * 2);
                    c.fill();
                    c.beginPath();
                    c.arc(x + s * 0.6, y + s * 0.5, s * 0.06, 0, Math.PI * 2);
                    c.fill();
                });
            },
            floorColor: '#FAFAFA',
            floorPattern: function(ctx, x, y, s) {
                ECO.Themes._clipped(ctx, x, y, s, function(c, x, y, s) {
                    c.fillStyle = '#FAFAFA';
                    c.fillRect(x, y, s, s);
                    // Снежные крупинки
                    c.fillStyle = '#E0E0E0';
                    c.beginPath();
                    c.arc(x + s * 0.25, y + s * 0.3, s * 0.015, 0, Math.PI * 2);
                    c.fill();
                    c.beginPath();
                    c.arc(x + s * 0.7, y + s * 0.65, s * 0.02, 0, Math.PI * 2);
                    c.fill();
                });
            },
            bgColor: '#E1F5FE',
            decoChance: 0.04,
            drawDeco: function(ctx, x, y, s) {
                // Снеговик
                ctx.fillStyle = '#FFF';
                ctx.beginPath();
                ctx.arc(x + s / 2, y + s * 0.65, s * 0.18, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + s / 2, y + s * 0.4, s * 0.13, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#FF9800';
                ctx.beginPath();
                ctx.moveTo(x + s * 0.5, y + s * 0.4);
                ctx.lineTo(x + s * 0.65, y + s * 0.42);
                ctx.lineTo(x + s * 0.5, y + s * 0.44);
                ctx.fill();
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.arc(x + s * 0.44, y + s * 0.37, s * 0.02, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + s * 0.56, y + s * 0.37, s * 0.02, 0, Math.PI * 2);
                ctx.fill();
            },
            snowTrails: true
        },
        // ============ 7. КВАРТИРА ============
        {
            name: 'Квартира',
            wallColor: '#EFEBE9',
            wallPattern: function(ctx, x, y, s, tx, ty) {
                ECO.Themes._clipped(ctx, x, y, s, function(c, x, y, s) {
                    var v = ECO.Themes._tileHash(tx || 0, ty || 0, 3);
                    // Разные обои
                    var wallpapers = ['#EFEBE9', '#E8EAF6', '#FFF3E0'];
                    var stripes = ['#D7CCC8', '#C5CAE9', '#FFE0B2'];
                    c.fillStyle = wallpapers[v];
                    c.fillRect(x, y, s, s);
                    c.strokeStyle = stripes[v];
                    c.lineWidth = 1;
                    for (var i = 0; i < 5; i++) {
                        c.beginPath();
                        c.moveTo(x + i * s / 4, y);
                        c.lineTo(x + i * s / 4, y + s);
                        c.stroke();
                    }
                    // Разные картины
                    c.fillStyle = '#8D6E63';
                    c.fillRect(x + s * 0.2, y + s * 0.2, s * 0.6, s * 0.4);
                    if (v === 0) {
                        // Горный пейзаж
                        c.fillStyle = '#A5D6A7';
                        c.fillRect(x + s * 0.25, y + s * 0.25, s * 0.5, s * 0.3);
                        c.fillStyle = '#66BB6A';
                        c.beginPath();
                        c.moveTo(x + s * 0.25, y + s * 0.55);
                        c.lineTo(x + s * 0.45, y + s * 0.3);
                        c.lineTo(x + s * 0.65, y + s * 0.55);
                        c.fill();
                    } else if (v === 1) {
                        // Закат
                        c.fillStyle = '#FFCC80';
                        c.fillRect(x + s * 0.25, y + s * 0.25, s * 0.5, s * 0.3);
                        c.fillStyle = '#FF8A65';
                        c.beginPath();
                        c.arc(x + s * 0.5, y + s * 0.45, s * 0.1, Math.PI, 0);
                        c.fill();
                    } else {
                        // Цветы
                        c.fillStyle = '#C8E6C9';
                        c.fillRect(x + s * 0.25, y + s * 0.25, s * 0.5, s * 0.3);
                        var fl = ['#E91E63', '#FF9800', '#9C27B0'];
                        for (var f = 0; f < 3; f++) {
                            c.fillStyle = fl[f];
                            c.beginPath();
                            c.arc(x + s * 0.33 + f * s * 0.12, y + s * 0.4, s * 0.04, 0, Math.PI * 2);
                            c.fill();
                        }
                    }
                });
            },
            floorColor: '#BCAAA4',
            floorPattern: function(ctx, x, y, s) {
                ECO.Themes._clipped(ctx, x, y, s, function(c, x, y, s) {
                    // Паркет
                    c.fillStyle = '#BCAAA4';
                    c.fillRect(x, y, s, s);
                    c.fillStyle = '#A1887F';
                    c.fillRect(x, y, s / 2, s * 0.15);
                    c.fillRect(x + s / 2, y + s * 0.15, s / 2, s * 0.15);
                    c.fillRect(x, y + s * 0.3, s / 2, s * 0.15);
                    c.fillRect(x + s / 2, y + s * 0.45, s / 2, s * 0.15);
                    c.fillRect(x, y + s * 0.6, s / 2, s * 0.15);
                    c.fillRect(x + s / 2, y + s * 0.75, s / 2, s * 0.15);
                });
            },
            bgColor: '#D7CCC8',
            decoChance: 0.04,
            drawDeco: function(ctx, x, y, s) {
                ctx.save();
                // Коврик
                ctx.fillStyle = '#E91E63';
                ctx.globalAlpha = 0.35;
                ctx.fillRect(x + s * 0.15, y + s * 0.2, s * 0.7, s * 0.6);
                ctx.globalAlpha = 1;
                ctx.strokeStyle = '#C2185B';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x + s * 0.2, y + s * 0.25, s * 0.6, s * 0.5);
                ctx.restore();
            }
        },
        // ============ 8. ПАРК ============
        {
            name: 'Парк',
            wallColor: '#66BB6A',
            wallPattern: function(ctx, x, y, s, tx, ty) {
                ECO.Themes._clipped(ctx, x, y, s, function(c, x, y, s) {
                    // Большой куст / живая изгородь
                    c.fillStyle = '#43A047';
                    c.fillRect(x, y, s, s);
                    // Листья — кружочки
                    c.fillStyle = '#66BB6A';
                    c.beginPath();
                    c.arc(x + s * 0.25, y + s * 0.3, s * 0.22, 0, Math.PI * 2);
                    c.fill();
                    c.beginPath();
                    c.arc(x + s * 0.7, y + s * 0.35, s * 0.24, 0, Math.PI * 2);
                    c.fill();
                    c.beginPath();
                    c.arc(x + s * 0.45, y + s * 0.65, s * 0.25, 0, Math.PI * 2);
                    c.fill();
                    // Блики
                    c.fillStyle = '#81C784';
                    c.beginPath();
                    c.arc(x + s * 0.3, y + s * 0.25, s * 0.1, 0, Math.PI * 2);
                    c.fill();
                });
            },
            floorColor: '#E8D5B7',
            floorPattern: function(ctx, x, y, s) {
                ECO.Themes._clipped(ctx, x, y, s, function(c, x, y, s) {
                    c.fillStyle = '#E8D5B7';
                    c.fillRect(x, y, s, s);
                    c.fillStyle = '#D7C4A6';
                    c.beginPath();
                    c.arc(x + s * 0.3, y + s * 0.5, s * 0.025, 0, Math.PI * 2);
                    c.fill();
                    c.beginPath();
                    c.arc(x + s * 0.7, y + s * 0.3, s * 0.02, 0, Math.PI * 2);
                    c.fill();
                });
            },
            bgColor: '#A5D6A7',
            decoChance: 0.05,
            drawDeco: function(ctx, x, y, s) {
                ctx.fillStyle = '#795548';
                ctx.fillRect(x + s * 0.1, y + s * 0.5, s * 0.8, s * 0.08);
                ctx.fillRect(x + s * 0.15, y + s * 0.5, s * 0.05, s * 0.3);
                ctx.fillRect(x + s * 0.8, y + s * 0.5, s * 0.05, s * 0.3);
            }
        },
        // ============ 9. ПЛЯЖ ============
        {
            name: 'Пляж',
            wallColor: '#8D6E63',
            wallPattern: function(ctx, x, y, s, tx, ty) {
                ECO.Themes._clipped(ctx, x, y, s, function(c, x, y, s) {
                    // Пальма + скала
                    c.fillStyle = '#A1887F';
                    c.fillRect(x, y, s, s);
                    // Скала
                    c.fillStyle = '#8D6E63';
                    c.beginPath();
                    c.arc(x + s * 0.5, y + s * 0.6, s * 0.35, 0, Math.PI * 2);
                    c.fill();
                    c.fillStyle = '#795548';
                    c.beginPath();
                    c.arc(x + s * 0.35, y + s * 0.5, s * 0.2, 0, Math.PI * 2);
                    c.fill();
                    // Блик
                    c.fillStyle = 'rgba(255,255,255,0.15)';
                    c.beginPath();
                    c.arc(x + s * 0.4, y + s * 0.45, s * 0.08, 0, Math.PI * 2);
                    c.fill();
                });
            },
            floorColor: '#FFF9C4',
            floorPattern: function(ctx, x, y, s) {
                ECO.Themes._clipped(ctx, x, y, s, function(c, x, y, s) {
                    c.fillStyle = '#FFF9C4';
                    c.fillRect(x, y, s, s);
                    c.fillStyle = '#FFF176';
                    c.beginPath();
                    c.arc(x + s * 0.2, y + s * 0.7, s * 0.02, 0, Math.PI * 2);
                    c.fill();
                });
            },
            bgColor: '#81D4FA',
            decoChance: 0.04,
            drawDeco: function(ctx, x, y, s) {
                ctx.fillStyle = '#FFAB91';
                ctx.beginPath();
                ctx.arc(x + s / 2, y + s / 2, s * 0.12, 0, Math.PI);
                ctx.fill();
            }
        },
        // ============ 10. ШКОЛА ============
        {
            name: 'Школа',
            wallColor: '#FFECB3',
            wallPattern: function(ctx, x, y, s, tx, ty) {
                ECO.Themes._clipped(ctx, x, y, s, function(c, x, y, s) {
                    var v = ECO.Themes._tileHash(tx || 0, ty || 0, 3);
                    c.fillStyle = '#8D6E63';
                    c.fillRect(x, y, s, s);
                    c.fillStyle = '#A1887F';
                    c.fillRect(x + s * 0.05, y + s * 0.05, s * 0.9, s * 0.9);
                    // Полки
                    c.fillStyle = '#8D6E63';
                    c.fillRect(x + s * 0.05, y + s * 0.33, s * 0.9, s * 0.04);
                    c.fillRect(x + s * 0.05, y + s * 0.63, s * 0.9, s * 0.04);
                    // Книги — разные цветовые наборы
                    var palettes = [
                        ['#F44336', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#00BCD4'],
                        ['#E91E63', '#3F51B5', '#009688', '#FFC107', '#795548', '#607D8B'],
                        ['#FF5722', '#673AB7', '#8BC34A', '#FFEB3B', '#03A9F4', '#E91E63']
                    ];
                    var bookColors = palettes[v];
                    var bw = s * 0.1;
                    var hv = ECO.Themes._tileHash(tx || 0, ty || 0, 5);
                    for (var row = 0; row < 3; row++) {
                        var by = y + s * 0.08 + row * s * 0.3;
                        var numBooks = 4 + (hv + row) % 3; // 4-6 книг на полке
                        var bookW = (s * 0.8) / numBooks;
                        for (var b = 0; b < numBooks; b++) {
                            var bh = s * 0.18 + ((hv + b) % 3) * s * 0.02; // разная высота
                            c.fillStyle = bookColors[(row * 3 + b + hv) % bookColors.length];
                            c.fillRect(x + s * 0.1 + b * bookW, by + (s * 0.22 - bh), bookW - 1, bh);
                        }
                    }
                });
            },
            floorColor: '#D7CCC8',
            floorPattern: function(ctx, x, y, s) {
                ECO.Themes._clipped(ctx, x, y, s, function(c, x, y, s) {
                    c.fillStyle = '#D7CCC8';
                    c.fillRect(x, y, s, s);
                    c.fillStyle = '#C8B8AC';
                    c.fillRect(x, y, s, s * 0.02);
                });
            },
            bgColor: '#FFE082',
            decoChance: 0.04,
            drawDeco: function(ctx, x, y, s) {
                ctx.fillStyle = '#8D6E63';
                ctx.fillRect(x + s * 0.1, y + s * 0.3, s * 0.8, s * 0.06);
                ctx.fillRect(x + s * 0.15, y + s * 0.36, s * 0.06, s * 0.4);
                ctx.fillRect(x + s * 0.79, y + s * 0.36, s * 0.06, s * 0.4);
            }
        },
        // ============ 11. ЛЕС ============
        {
            name: 'Лес',
            wallColor: '#5D4037',
            wallPattern: function(ctx, x, y, s, tx, ty) {
                ECO.Themes._clipped(ctx, x, y, s, function(c, x, y, s) {
                    var v = ECO.Themes._tileHash(tx || 0, ty || 0, 3);
                    c.fillStyle = '#33691E';
                    c.fillRect(x, y, s, s);
                    if (v === 0) {
                        // Дуб — толстый ствол, пышная крона
                        c.fillStyle = '#5D4037';
                        c.fillRect(x + s * 0.35, y + s * 0.5, s * 0.3, s * 0.5);
                        c.fillStyle = '#388E3C';
                        c.beginPath(); c.arc(x + s * 0.5, y + s * 0.35, s * 0.35, 0, Math.PI * 2); c.fill();
                        c.fillStyle = '#43A047';
                        c.beginPath(); c.arc(x + s * 0.35, y + s * 0.28, s * 0.2, 0, Math.PI * 2); c.fill();
                        c.beginPath(); c.arc(x + s * 0.65, y + s * 0.3, s * 0.2, 0, Math.PI * 2); c.fill();
                        c.fillStyle = '#66BB6A';
                        c.beginPath(); c.arc(x + s * 0.4, y + s * 0.25, s * 0.08, 0, Math.PI * 2); c.fill();
                    } else if (v === 1) {
                        // Ель — высокая, треугольная
                        c.fillStyle = '#4E342E';
                        c.fillRect(x + s * 0.43, y + s * 0.65, s * 0.14, s * 0.35);
                        c.fillStyle = '#1B5E20';
                        c.beginPath(); c.moveTo(x + s * 0.5, y + s * 0.05); c.lineTo(x + s * 0.2, y + s * 0.4); c.lineTo(x + s * 0.8, y + s * 0.4); c.fill();
                        c.beginPath(); c.moveTo(x + s * 0.5, y + s * 0.22); c.lineTo(x + s * 0.15, y + s * 0.58); c.lineTo(x + s * 0.85, y + s * 0.58); c.fill();
                        c.beginPath(); c.moveTo(x + s * 0.5, y + s * 0.38); c.lineTo(x + s * 0.1, y + s * 0.72); c.lineTo(x + s * 0.9, y + s * 0.72); c.fill();
                    } else {
                        // Берёза — тонкий белый ствол, мелкая крона
                        c.fillStyle = '#F5F5F5';
                        c.fillRect(x + s * 0.43, y + s * 0.25, s * 0.14, s * 0.75);
                        c.fillStyle = '#212121';
                        c.fillRect(x + s * 0.44, y + s * 0.35, s * 0.04, s * 0.05);
                        c.fillRect(x + s * 0.49, y + s * 0.55, s * 0.05, s * 0.04);
                        c.fillRect(x + s * 0.45, y + s * 0.72, s * 0.03, s * 0.04);
                        c.fillStyle = '#66BB6A';
                        c.beginPath(); c.arc(x + s * 0.5, y + s * 0.22, s * 0.22, 0, Math.PI * 2); c.fill();
                        c.fillStyle = '#81C784';
                        c.beginPath(); c.arc(x + s * 0.38, y + s * 0.15, s * 0.12, 0, Math.PI * 2); c.fill();
                        c.beginPath(); c.arc(x + s * 0.62, y + s * 0.18, s * 0.12, 0, Math.PI * 2); c.fill();
                    }
                });
            },
            floorColor: '#81C784',
            floorPattern: function(ctx, x, y, s) {
                ECO.Themes._clipped(ctx, x, y, s, function(c, x, y, s) {
                    c.fillStyle = '#81C784';
                    c.fillRect(x, y, s, s);
                    // Опавшие листья
                    c.fillStyle = '#A5D6A7';
                    c.beginPath();
                    c.ellipse(x + s * 0.3, y + s * 0.4, s * 0.04, s * 0.02, 0.5, 0, Math.PI * 2);
                    c.fill();
                    c.fillStyle = '#C8E6C9';
                    c.beginPath();
                    c.ellipse(x + s * 0.7, y + s * 0.7, s * 0.03, s * 0.015, -0.3, 0, Math.PI * 2);
                    c.fill();
                });
            },
            bgColor: '#388E3C',
            decoChance: 0.05,
            drawDeco: function(ctx, x, y, s) {
                // Гриб
                ctx.fillStyle = '#EFEBE9';
                ctx.fillRect(x + s * 0.42, y + s * 0.55, s * 0.16, s * 0.25);
                ctx.fillStyle = '#F44336';
                ctx.beginPath();
                ctx.arc(x + s * 0.5, y + s * 0.55, s * 0.18, Math.PI, 0);
                ctx.fill();
                ctx.fillStyle = '#FFF';
                ctx.beginPath();
                ctx.arc(x + s * 0.42, y + s * 0.47, s * 0.035, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + s * 0.58, y + s * 0.45, s * 0.025, 0, Math.PI * 2);
                ctx.fill();
            }
        },
        // ============ 12. ДЕТСКАЯ ПЛОЩАДКА ============
        {
            name: 'Площадка',
            wallColor: '#FF8A65',
            wallPattern: function(ctx, x, y, s, tx, ty) {
                ECO.Themes._clipped(ctx, x, y, s, function(c, x, y, s) {
                    // Яркий заборчик с планками
                    c.fillStyle = '#FFAB91';
                    c.fillRect(x, y, s, s);
                    // Планки забора (разноцветные)
                    var fenceColors = ['#FF7043', '#FFA726', '#FFCA28', '#66BB6A', '#42A5F5'];
                    var pw = s / 5;
                    for (var i = 0; i < 5; i++) {
                        c.fillStyle = fenceColors[i];
                        c.fillRect(x + i * pw + 1, y + s * 0.08, pw - 2, s * 0.84);
                        // Заострённый верх
                        c.beginPath();
                        c.moveTo(x + i * pw + 1, y + s * 0.08);
                        c.lineTo(x + i * pw + pw / 2, y);
                        c.lineTo(x + (i + 1) * pw - 1, y + s * 0.08);
                        c.fill();
                    }
                    // Перекладина
                    c.fillStyle = '#8D6E63';
                    c.fillRect(x, y + s * 0.35, s, s * 0.05);
                    c.fillRect(x, y + s * 0.65, s, s * 0.05);
                });
            },
            floorColor: '#CE93D8',
            floorPattern: function(ctx, x, y, s) {
                ECO.Themes._clipped(ctx, x, y, s, function(c, x, y, s) {
                    // Прорезиненное покрытие
                    c.fillStyle = '#CE93D8';
                    c.fillRect(x, y, s, s);
                    c.fillStyle = '#BA68C8';
                    c.beginPath();
                    c.arc(x + s * 0.3, y + s * 0.3, s * 0.04, 0, Math.PI * 2);
                    c.fill();
                    c.beginPath();
                    c.arc(x + s * 0.7, y + s * 0.7, s * 0.03, 0, Math.PI * 2);
                    c.fill();
                });
            },
            bgColor: '#E1BEE7',
            decoChance: 0.04,
            drawDeco: function(ctx, x, y, s) {
                ctx.strokeStyle = '#795548';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x + s * 0.3, y + s * 0.1);
                ctx.lineTo(x + s * 0.3, y + s * 0.7);
                ctx.moveTo(x + s * 0.7, y + s * 0.1);
                ctx.lineTo(x + s * 0.7, y + s * 0.7);
                ctx.moveTo(x + s * 0.2, y + s * 0.1);
                ctx.lineTo(x + s * 0.8, y + s * 0.1);
                ctx.stroke();
                ctx.fillStyle = '#4CAF50';
                ctx.fillRect(x + s * 0.35, y + s * 0.55, s * 0.3, s * 0.05);
            }
        }
    ],

    _lastIndex: -1,

    getRandom: function() {
        var idx;
        do {
            idx = ECO.Utils.randomInt(0, this.list.length - 1);
        } while (idx === this._lastIndex && this.list.length > 1);
        this._lastIndex = idx;
        return this.list[idx];
    },

    generateDecoMap: function(grid, cols, rows, theme) {
        var decoMap = {};
        var key = function(x, y) { return x + ',' + y; };
        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                if (grid[y][x] === 0 && Math.random() < theme.decoChance) {
                    decoMap[key(x, y)] = true;
                }
            }
        }
        return decoMap;
    },

    // Генерация карты спецтайлов для уровня
    generateSpecialTileMap: function(grid, cols, rows, theme, occupied) {
        var map = {};
        if (!theme.specialTile) return map;
        var key = function(x, y) { return x + ',' + y; };
        var available = [];
        for (var y = 1; y < rows - 1; y++) {
            for (var x = 1; x < cols - 1; x++) {
                if (grid[y][x] === 0 && !occupied[key(x, y)]) {
                    available.push({ x: x, y: y });
                }
            }
        }
        ECO.Utils.shuffleArray(available);
        var count = ECO.Config.SPECIAL_TILE_MIN +
            ECO.Utils.randomInt(0, ECO.Config.SPECIAL_TILE_MAX - ECO.Config.SPECIAL_TILE_MIN);
        count = Math.min(count, available.length);
        for (var i = 0; i < count; i++) {
            map[key(available[i].x, available[i].y)] = theme.specialTile;
        }
        return map;
    },

    // Отрисовка спецтайла
    drawSpecialTile: function(ctx, x, y, s, tile) {
        if (!tile || !tile.draw) return;
        tile.draw(ctx, x, y, s);
    }
};

// Назначить спецтайлы каждой теме
(function() {
    var themes = ECO.Themes.list;
    // 1. Город — лужа (slow)
    themes[0].specialTile = { type: 'slow', name: 'Лужа', draw: function(ctx, x, y, s) {
        ctx.fillStyle = 'rgba(66,165,245,0.35)';
        ctx.beginPath();
        ctx.ellipse(x + s * 0.5, y + s * 0.55, s * 0.35, s * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(144,202,249,0.4)';
        ctx.beginPath();
        ctx.ellipse(x + s * 0.4, y + s * 0.5, s * 0.12, s * 0.08, 0.3, 0, Math.PI * 2);
        ctx.fill();
    }};
    // 2. Деревня — грязь (slow)
    themes[1].specialTile = { type: 'slow', name: 'Грязь', draw: function(ctx, x, y, s) {
        ctx.fillStyle = '#8D6E63';
        ctx.beginPath();
        ctx.ellipse(x + s * 0.5, y + s * 0.5, s * 0.35, s * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#6D4C41';
        ctx.beginPath();
        ctx.arc(x + s * 0.35, y + s * 0.45, s * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + s * 0.6, y + s * 0.55, s * 0.05, 0, Math.PI * 2);
        ctx.fill();
    }};
    // 3. Центр — эскалатор/стрелка (boost)
    themes[2].specialTile = { type: 'boost', name: 'Эскалатор', draw: function(ctx, x, y, s) {
        ctx.fillStyle = 'rgba(76,175,80,0.3)';
        ctx.fillRect(x + s * 0.15, y + s * 0.1, s * 0.7, s * 0.8);
        ctx.fillStyle = '#4CAF50';
        // Стрелка вверх
        ctx.beginPath();
        ctx.moveTo(x + s * 0.5, y + s * 0.2);
        ctx.lineTo(x + s * 0.7, y + s * 0.5);
        ctx.lineTo(x + s * 0.55, y + s * 0.5);
        ctx.lineTo(x + s * 0.55, y + s * 0.8);
        ctx.lineTo(x + s * 0.45, y + s * 0.8);
        ctx.lineTo(x + s * 0.45, y + s * 0.5);
        ctx.lineTo(x + s * 0.3, y + s * 0.5);
        ctx.closePath();
        ctx.fill();
    }};
    // 4. Мегаполис — неоновая стрелка (boost)
    themes[3].specialTile = { type: 'boost', name: 'Неон', draw: function(ctx, x, y, s) {
        var t = Date.now() / 500;
        var alpha = 0.4 + 0.2 * Math.sin(t);
        ctx.fillStyle = 'rgba(0,255,200,' + alpha + ')';
        ctx.beginPath();
        ctx.moveTo(x + s * 0.5, y + s * 0.15);
        ctx.lineTo(x + s * 0.75, y + s * 0.5);
        ctx.lineTo(x + s * 0.58, y + s * 0.5);
        ctx.lineTo(x + s * 0.58, y + s * 0.85);
        ctx.lineTo(x + s * 0.42, y + s * 0.85);
        ctx.lineTo(x + s * 0.42, y + s * 0.5);
        ctx.lineTo(x + s * 0.25, y + s * 0.5);
        ctx.closePath();
        ctx.fill();
    }};
    // 5. Пустыня — зыбучий песок (slow)
    themes[4].specialTile = { type: 'slow', name: 'Зыбучий песок', draw: function(ctx, x, y, s) {
        ctx.fillStyle = '#D7CCC8';
        ctx.beginPath();
        ctx.ellipse(x + s * 0.5, y + s * 0.5, s * 0.38, s * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        // Спираль
        ctx.strokeStyle = '#BCAAA4';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x + s * 0.5, y + s * 0.5, s * 0.1, 0, Math.PI * 3);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + s * 0.5, y + s * 0.5, s * 0.2, 0.5, Math.PI * 2.5);
        ctx.stroke();
    }};
    // 6. Зима — лёд (ice)
    themes[5].specialTile = { type: 'ice', name: 'Лёд', draw: function(ctx, x, y, s) {
        ctx.fillStyle = 'rgba(144,202,249,0.45)';
        ctx.fillRect(x + s * 0.05, y + s * 0.05, s * 0.9, s * 0.9);
        // Блики
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + s * 0.2, y + s * 0.3);
        ctx.lineTo(x + s * 0.5, y + s * 0.15);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + s * 0.6, y + s * 0.7);
        ctx.lineTo(x + s * 0.8, y + s * 0.55);
        ctx.stroke();
        // Снежинка
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = Math.floor(s * 0.25) + 'px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('❄', x + s * 0.5, y + s * 0.5);
    }};
    // 7. Квартира — мокрый пол (ice)
    themes[6].specialTile = { type: 'ice', name: 'Мокрый пол', draw: function(ctx, x, y, s) {
        ctx.fillStyle = 'rgba(100,181,246,0.25)';
        ctx.beginPath();
        ctx.ellipse(x + s * 0.5, y + s * 0.5, s * 0.4, s * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.ellipse(x + s * 0.4, y + s * 0.4, s * 0.1, s * 0.06, 0.5, 0, Math.PI * 2);
        ctx.fill();
    }};
    // 8. Парк — грязь (slow)
    themes[7].specialTile = { type: 'slow', name: 'Грязь', draw: function(ctx, x, y, s) {
        ctx.fillStyle = '#A1887F';
        ctx.beginPath();
        ctx.ellipse(x + s * 0.5, y + s * 0.5, s * 0.35, s * 0.25, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8D6E63';
        ctx.beginPath();
        ctx.arc(x + s * 0.4, y + s * 0.5, s * 0.05, 0, Math.PI * 2);
        ctx.fill();
    }};
    // 9. Пляж — волна (boost)
    themes[8].specialTile = { type: 'boost', name: 'Волна', draw: function(ctx, x, y, s) {
        ctx.fillStyle = 'rgba(3,169,244,0.3)';
        ctx.fillRect(x, y, s, s);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y + s * 0.4);
        ctx.quadraticCurveTo(x + s * 0.25, y + s * 0.2, x + s * 0.5, y + s * 0.4);
        ctx.quadraticCurveTo(x + s * 0.75, y + s * 0.6, x + s, y + s * 0.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y + s * 0.7);
        ctx.quadraticCurveTo(x + s * 0.25, y + s * 0.5, x + s * 0.5, y + s * 0.7);
        ctx.quadraticCurveTo(x + s * 0.75, y + s * 0.9, x + s, y + s * 0.7);
        ctx.stroke();
    }};
    // 10. Школа — скользкий линолеум (ice)
    themes[9].specialTile = { type: 'ice', name: 'Скользкий пол', draw: function(ctx, x, y, s) {
        ctx.fillStyle = 'rgba(255,235,59,0.3)';
        ctx.fillRect(x + s * 0.1, y + s * 0.1, s * 0.8, s * 0.8);
        ctx.strokeStyle = 'rgba(255,193,7,0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + s * 0.15, y + s * 0.15, s * 0.7, s * 0.7);
        // Значок скользко
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.font = Math.floor(s * 0.3) + 'px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚠', x + s * 0.5, y + s * 0.5);
    }};
    // 11. Лес — корни (slow)
    themes[10].specialTile = { type: 'slow', name: 'Корни', draw: function(ctx, x, y, s) {
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x + s * 0.1, y + s * 0.3);
        ctx.quadraticCurveTo(x + s * 0.5, y + s * 0.5, x + s * 0.9, y + s * 0.35);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + s * 0.2, y + s * 0.7);
        ctx.quadraticCurveTo(x + s * 0.5, y + s * 0.55, x + s * 0.85, y + s * 0.65);
        ctx.stroke();
        ctx.strokeStyle = '#795548';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + s * 0.4, y + s * 0.4);
        ctx.quadraticCurveTo(x + s * 0.3, y + s * 0.6, x + s * 0.5, y + s * 0.65);
        ctx.stroke();
    }};
    // 12. Площадка — батут (boost)
    themes[11].specialTile = { type: 'boost', name: 'Батут', draw: function(ctx, x, y, s) {
        ctx.fillStyle = 'rgba(255,87,34,0.3)';
        ctx.beginPath();
        ctx.ellipse(x + s * 0.5, y + s * 0.5, s * 0.4, s * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FF5722';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x + s * 0.5, y + s * 0.5, s * 0.4, s * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
        // Пружинки
        ctx.strokeStyle = '#BF360C';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + s * 0.3, y + s * 0.5);
        ctx.quadraticCurveTo(x + s * 0.35, y + s * 0.35, x + s * 0.4, y + s * 0.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + s * 0.6, y + s * 0.5);
        ctx.quadraticCurveTo(x + s * 0.65, y + s * 0.35, x + s * 0.7, y + s * 0.5);
        ctx.stroke();
    }};
})();
