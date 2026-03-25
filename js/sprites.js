// ECO.Sprites — процедурная отрисовка всех спрайтов на Canvas
ECO.Sprites = {
    // Анимированный спрайт-шит девочки чиби (4 направления x 4 кадра, сетка 4x4)
    // Ряды: 0=DOWN, 1=UP, 2=RIGHT, 3=LEFT. Столбцы: 4 кадра анимации бега.
    _chibiImg: null,
    _chibiLoaded: false,
    // Спрайт ведёрка чиби
    _bucketImg: null,
    _bucketLoaded: false,
    initChibi: function() {
        var self = this;
        this._chibiImg = new Image();
        this._chibiImg.onload = function() { self._chibiLoaded = true; };
        this._chibiImg.src = 'chibi_spritesheet.png';

        this._bucketImg = new Image();
        this._bucketImg.onload = function() { self._bucketLoaded = true; };
        this._bucketImg.src = 'bucket_chibi.png';
    },

    // Отрисовка анимированного персонажа из спрайт-шита
    drawChibiPlayer: function(ctx, x, y, size, direction, bagSize, frame, hasShield) {
        var s = size;
        var cx = x + s / 2;
        var cy = y + s / 2;
        var DIR = ECO.Config.DIR;

        ctx.save();

        // Щит
        if (hasShield) {
            var pulse = 0.2 + Math.sin(Date.now() / 400) * 0.1;
            ctx.beginPath();
            ctx.arc(cx, cy, s * 0.52, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(76, 175, 80, ' + pulse + ')';
            ctx.fill();
            ctx.strokeStyle = 'rgba(56, 142, 60, 0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        if (!this._chibiLoaded || !this._chibiImg) {
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.arc(cx, cy, s * 0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
        }

        var img = this._chibiImg;
        var frameSize = img.naturalWidth / 4; // 4 столбца

        // Ряд по направлению: 0=DOWN, 1=UP, 2=RIGHT, 3=LEFT
        var row = 0;
        switch (direction) {
            case DIR.DOWN:  row = 0; break;
            case DIR.UP:    row = 1; break;
            case DIR.RIGHT: row = 2; break;
            case DIR.LEFT:  row = 3; break;
            default:        row = 0; break;
        }

        // Кадр анимации (0-3), переключение по frame counter
        var animFrame = (Math.floor(frame / 2)) % 4;
        // Если стоит — показать кадр 0 (idle)
        if (direction === DIR.NONE) animFrame = 0;

        var sx = animFrame * frameSize;
        var sy = row * frameSize;

        // Рисуем чуть крупнее тайла
        var drawSize = s * 1.1;
        var dx = cx - drawSize / 2;
        var dy = cy - drawSize / 2 - s * 0.05;

        ctx.drawImage(img, sx, sy, frameSize, frameSize, dx, dy, drawSize, drawSize);

        // Индикатор мусора
        if (bagSize > 0) {
            ctx.fillStyle = '#795548';
            ctx.font = 'bold ' + Math.round(s * 0.25) + 'px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(bagSize + '', x + s * 0.95, y + s * 0.25);
        }

        ctx.restore();
    },

    // Девочка-школьница (чиби-стиль: большая голова, выразительные глаза)
    drawGirl: function(ctx, x, y, size, direction, bagSize, frame, hasShield, skinIndex) {
        var s = size;
        var cx = x + s / 2;
        var cy = y + s / 2;
        var DIR = ECO.Config.DIR;
        var skin = ECO.Config.SKINS[skinIndex || 0] || ECO.Config.SKINS[0];

        // Покачивание при ходьбе
        var walking = (direction !== DIR.NONE);
        var bounce = walking ? Math.sin(frame * 0.6) * s * 0.02 : 0;
        var legPhase = walking ? Math.sin(frame * 0.6) : 0;

        ctx.save();

        // Щит (пульсирующее зелёное свечение)
        if (hasShield) {
            var pulse = 0.2 + Math.sin(Date.now() / 400) * 0.1;
            ctx.beginPath();
            ctx.arc(cx, cy, s * 0.52, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(76, 175, 80, ' + pulse + ')';
            ctx.fill();
            ctx.strokeStyle = 'rgba(56, 142, 60, 0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // === ТЕНЬ ===
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + s * 0.44, s * 0.22, s * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();

        // === НОЖКИ (с обувью) ===
        var legOff = legPhase * s * 0.08;
        // Левая нога
        ctx.fillStyle = '#FFCC80'; // кожа
        ctx.fillRect(cx - s * 0.1 + legOff, cy + s * 0.28 + bounce, s * 0.08, s * 0.1);
        ctx.fillStyle = skin.shoes;
        ctx.beginPath();
        ctx.ellipse(cx - s * 0.06 + legOff, cy + s * 0.39 + bounce, s * 0.06, s * 0.035, 0, 0, Math.PI * 2);
        ctx.fill();
        // Правая нога
        ctx.fillStyle = '#FFCC80';
        ctx.fillRect(cx + s * 0.02 - legOff, cy + s * 0.28 + bounce, s * 0.08, s * 0.1);
        ctx.fillStyle = skin.shoes;
        ctx.beginPath();
        ctx.ellipse(cx + s * 0.06 - legOff, cy + s * 0.39 + bounce, s * 0.06, s * 0.035, 0, 0, Math.PI * 2);
        ctx.fill();

        // === ТЕЛО (платье) ===
        ctx.fillStyle = skin.dress;
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.17, cy - s * 0.02 + bounce);
        ctx.lineTo(cx - s * 0.2, cy + s * 0.3 + bounce);
        ctx.lineTo(cx + s * 0.2, cy + s * 0.3 + bounce);
        ctx.lineTo(cx + s * 0.17, cy - s * 0.02 + bounce);
        ctx.closePath();
        ctx.fill();
        // Воротничок
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.1, cy - s * 0.02 + bounce);
        ctx.lineTo(cx, cy + s * 0.06 + bounce);
        ctx.lineTo(cx + s * 0.1, cy - s * 0.02 + bounce);
        ctx.closePath();
        ctx.fill();
        // Пуговица
        ctx.fillStyle = skin.dressAccent;
        ctx.beginPath();
        ctx.arc(cx, cy + s * 0.1 + bounce, s * 0.025, 0, Math.PI * 2);
        ctx.fill();

        // === РУКИ ===
        ctx.fillStyle = '#FFCC80';
        // Левая рука (покачивается)
        ctx.beginPath();
        ctx.ellipse(cx - s * 0.22, cy + s * 0.1 + bounce - legOff * 0.5, s * 0.05, s * 0.08, 0.2, 0, Math.PI * 2);
        ctx.fill();
        // Правая рука
        ctx.beginPath();
        ctx.ellipse(cx + s * 0.22, cy + s * 0.1 + bounce + legOff * 0.5, s * 0.05, s * 0.08, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // === ПАКЕТ С МУСОРОМ (в правой руке) ===
        if (bagSize > 0) {
            var bagW = s * 0.12 + Math.min(bagSize, 10) * s * 0.02;
            var bagH = s * 0.14 + Math.min(bagSize, 10) * s * 0.025;
            bagW = Math.min(bagW, s * 0.35);
            bagH = Math.min(bagH, s * 0.35);
            var bagX = cx + s * 0.18;
            var bagY = cy + s * 0.02 + bounce;
            // Пакет
            ctx.fillStyle = '#8D6E63';
            ctx.beginPath();
            ctx.moveTo(bagX, bagY);
            ctx.lineTo(bagX + bagW * 0.15, bagY + bagH);
            ctx.lineTo(bagX + bagW, bagY + bagH * 0.9);
            ctx.lineTo(bagX + bagW * 0.85, bagY - bagH * 0.1);
            ctx.closePath();
            ctx.fill();
            // Завязка
            ctx.fillStyle = '#6D4C41';
            ctx.beginPath();
            ctx.arc(bagX + bagW * 0.4, bagY - bagH * 0.05, bagW * 0.15, 0, Math.PI * 2);
            ctx.fill();
            // Торчащий мусор
            if (bagSize >= 3) {
                ctx.fillStyle = '#4CAF50';
                ctx.fillRect(bagX + bagW * 0.3, bagY - bagH * 0.2, s * 0.04, s * 0.08);
            }
        }

        // === ГОЛОВА (большая, чиби) ===
        // Волосы задние (тёмные, основа)
        ctx.fillStyle = skin.hairBase;
        ctx.beginPath();
        ctx.arc(cx, cy - s * 0.16 + bounce, s * 0.24, 0, Math.PI * 2);
        ctx.fill();

        // Лицо (кожа)
        ctx.fillStyle = '#FFCC80';
        ctx.beginPath();
        ctx.arc(cx, cy - s * 0.13 + bounce, s * 0.21, 0, Math.PI * 2);
        ctx.fill();

        // Волосы верхние (чёлка)
        ctx.fillStyle = skin.hair;
        ctx.beginPath();
        ctx.arc(cx, cy - s * 0.2 + bounce, s * 0.22, Math.PI + 0.4, -0.4);
        ctx.fill();
        // Чёлка — зубчики
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.18, cy - s * 0.12 + bounce);
        ctx.lineTo(cx - s * 0.12, cy - s * 0.06 + bounce);
        ctx.lineTo(cx - s * 0.04, cy - s * 0.13 + bounce);
        ctx.lineTo(cx + s * 0.04, cy - s * 0.06 + bounce);
        ctx.lineTo(cx + s * 0.12, cy - s * 0.12 + bounce);
        ctx.lineTo(cx + s * 0.18, cy - s * 0.07 + bounce);
        ctx.lineTo(cx + s * 0.22, cy - s * 0.15 + bounce);
        ctx.lineTo(cx + s * 0.22, cy - s * 0.25 + bounce);
        ctx.arc(cx, cy - s * 0.2 + bounce, s * 0.22, -0.3, Math.PI + 0.3, true);
        ctx.fill();

        // Хвостики (два)
        ctx.fillStyle = skin.hair;
        ctx.beginPath();
        ctx.ellipse(cx - s * 0.22, cy - s * 0.22 + bounce, s * 0.06, s * 0.1, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + s * 0.22, cy - s * 0.22 + bounce, s * 0.06, s * 0.1, 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Резинки для хвостиков
        ctx.fillStyle = skin.ribbon;
        ctx.beginPath();
        ctx.arc(cx - s * 0.2, cy - s * 0.18 + bounce, s * 0.03, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + s * 0.2, cy - s * 0.18 + bounce, s * 0.03, 0, Math.PI * 2);
        ctx.fill();

        // === ГЛАЗА (большие, аниме-стиль) ===
        var eyeOffX = 0, eyeOffY = 0;
        if (direction === DIR.LEFT) eyeOffX = -s * 0.03;
        if (direction === DIR.RIGHT) eyeOffX = s * 0.03;
        if (direction === DIR.UP) eyeOffY = -s * 0.02;
        if (direction === DIR.DOWN) eyeOffY = s * 0.02;

        var eyeY = cy - s * 0.12 + bounce;
        var eyeSpacing = s * 0.09;

        // Белки глаз
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.ellipse(cx - eyeSpacing + eyeOffX, eyeY + eyeOffY, s * 0.065, s * 0.075, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + eyeSpacing + eyeOffX, eyeY + eyeOffY, s * 0.065, s * 0.075, 0, 0, Math.PI * 2);
        ctx.fill();

        // Радужка (тёмно-коричневая)
        ctx.fillStyle = '#4E342E';
        ctx.beginPath();
        ctx.arc(cx - eyeSpacing + eyeOffX * 1.3, eyeY + eyeOffY * 1.3 + s * 0.01, s * 0.045, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + eyeSpacing + eyeOffX * 1.3, eyeY + eyeOffY * 1.3 + s * 0.01, s * 0.045, 0, Math.PI * 2);
        ctx.fill();

        // Зрачки
        ctx.fillStyle = '#1A1A1A';
        ctx.beginPath();
        ctx.arc(cx - eyeSpacing + eyeOffX * 1.5, eyeY + eyeOffY * 1.5 + s * 0.015, s * 0.025, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + eyeSpacing + eyeOffX * 1.5, eyeY + eyeOffY * 1.5 + s * 0.015, s * 0.025, 0, Math.PI * 2);
        ctx.fill();

        // Блики в глазах (2 на каждый глаз)
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(cx - eyeSpacing + eyeOffX + s * 0.02, eyeY + eyeOffY - s * 0.02, s * 0.018, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx - eyeSpacing + eyeOffX - s * 0.01, eyeY + eyeOffY + s * 0.02, s * 0.008, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + eyeSpacing + eyeOffX + s * 0.02, eyeY + eyeOffY - s * 0.02, s * 0.018, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + eyeSpacing + eyeOffX - s * 0.01, eyeY + eyeOffY + s * 0.02, s * 0.008, 0, Math.PI * 2);
        ctx.fill();

        // Румянец
        ctx.fillStyle = 'rgba(244, 143, 177, 0.4)';
        ctx.beginPath();
        ctx.ellipse(cx - s * 0.14, eyeY + s * 0.06, s * 0.04, s * 0.025, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + s * 0.14, eyeY + s * 0.06, s * 0.04, s * 0.025, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ротик (маленькая улыбка)
        ctx.beginPath();
        ctx.arc(cx + eyeOffX * 0.5, cy - s * 0.04 + bounce, s * 0.04, 0.15, Math.PI - 0.15);
        ctx.strokeStyle = '#C62828';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.restore();
    },

    // Мальчик-школьник (чиби-стиль: короткие волосы, футболка, штаны)
    drawBoy: function(ctx, x, y, size, direction, bagSize, frame, hasShield, skinIndex) {
        var s = size;
        var cx = x + s / 2;
        var cy = y + s / 2;
        var DIR = ECO.Config.DIR;
        var skin = ECO.Config.SKINS[skinIndex || 0] || ECO.Config.SKINS[0];

        var walking = (direction !== DIR.NONE);
        var bounce = walking ? Math.sin(frame * 0.6) * s * 0.02 : 0;
        var legPhase = walking ? Math.sin(frame * 0.6) : 0;

        ctx.save();

        // Щит
        if (hasShield) {
            var pulse = 0.2 + Math.sin(Date.now() / 400) * 0.1;
            ctx.beginPath();
            ctx.arc(cx, cy, s * 0.52, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(76, 175, 80, ' + pulse + ')';
            ctx.fill();
            ctx.strokeStyle = 'rgba(56, 142, 60, 0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Тень
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + s * 0.44, s * 0.22, s * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ножки (штаны + обувь)
        var legOff = legPhase * s * 0.08;
        ctx.fillStyle = skin.pants;
        ctx.fillRect(cx - s * 0.11 + legOff, cy + s * 0.2 + bounce, s * 0.1, s * 0.15);
        ctx.fillRect(cx + s * 0.01 - legOff, cy + s * 0.2 + bounce, s * 0.1, s * 0.15);
        ctx.fillStyle = skin.shoes;
        ctx.beginPath();
        ctx.ellipse(cx - s * 0.06 + legOff, cy + s * 0.39 + bounce, s * 0.06, s * 0.035, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + s * 0.06 - legOff, cy + s * 0.39 + bounce, s * 0.06, s * 0.035, 0, 0, Math.PI * 2);
        ctx.fill();

        // Тело (футболка — прямоугольник)
        ctx.fillStyle = skin.shirt;
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.17, cy - s * 0.02 + bounce);
        ctx.lineTo(cx - s * 0.17, cy + s * 0.22 + bounce);
        ctx.lineTo(cx + s * 0.17, cy + s * 0.22 + bounce);
        ctx.lineTo(cx + s * 0.17, cy - s * 0.02 + bounce);
        ctx.closePath();
        ctx.fill();
        // Воротничок
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(cx, cy - s * 0.02 + bounce, s * 0.08, 0.3, Math.PI - 0.3);
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = s * 0.03;
        ctx.stroke();
        // Полоска на футболке
        ctx.fillStyle = skin.shirtAccent;
        ctx.fillRect(cx - s * 0.15, cy + s * 0.12 + bounce, s * 0.3, s * 0.03);

        // Руки
        ctx.fillStyle = '#FFCC80';
        ctx.beginPath();
        ctx.ellipse(cx - s * 0.22, cy + s * 0.1 + bounce - legOff * 0.5, s * 0.05, s * 0.08, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + s * 0.22, cy + s * 0.1 + bounce + legOff * 0.5, s * 0.05, s * 0.08, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Пакет с мусором
        if (bagSize > 0) {
            var bagW = s * 0.12 + Math.min(bagSize, 10) * s * 0.02;
            var bagH = s * 0.14 + Math.min(bagSize, 10) * s * 0.025;
            bagW = Math.min(bagW, s * 0.35);
            bagH = Math.min(bagH, s * 0.35);
            var bagX = cx + s * 0.18;
            var bagY = cy + s * 0.02 + bounce;
            ctx.fillStyle = '#8D6E63';
            ctx.beginPath();
            ctx.moveTo(bagX, bagY);
            ctx.lineTo(bagX + bagW * 0.15, bagY + bagH);
            ctx.lineTo(bagX + bagW, bagY + bagH * 0.9);
            ctx.lineTo(bagX + bagW * 0.85, bagY - bagH * 0.1);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#6D4C41';
            ctx.beginPath();
            ctx.arc(bagX + bagW * 0.4, bagY - bagH * 0.05, bagW * 0.15, 0, Math.PI * 2);
            ctx.fill();
            if (bagSize >= 3) {
                ctx.fillStyle = '#4CAF50';
                ctx.fillRect(bagX + bagW * 0.3, bagY - bagH * 0.2, s * 0.04, s * 0.08);
            }
        }

        // Голова
        ctx.fillStyle = skin.hairBase;
        ctx.beginPath();
        ctx.arc(cx, cy - s * 0.16 + bounce, s * 0.24, 0, Math.PI * 2);
        ctx.fill();

        // Лицо
        ctx.fillStyle = '#FFCC80';
        ctx.beginPath();
        ctx.arc(cx, cy - s * 0.13 + bounce, s * 0.21, 0, Math.PI * 2);
        ctx.fill();

        // Волосы (короткие — шапочка сверху)
        ctx.fillStyle = skin.hair;
        ctx.beginPath();
        ctx.arc(cx, cy - s * 0.2 + bounce, s * 0.22, Math.PI + 0.3, -0.3);
        ctx.fill();
        // Чёлка — прямая
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.2, cy - s * 0.1 + bounce);
        ctx.lineTo(cx - s * 0.16, cy - s * 0.07 + bounce);
        ctx.lineTo(cx - s * 0.06, cy - s * 0.1 + bounce);
        ctx.lineTo(cx + s * 0.06, cy - s * 0.07 + bounce);
        ctx.lineTo(cx + s * 0.16, cy - s * 0.1 + bounce);
        ctx.lineTo(cx + s * 0.2, cy - s * 0.12 + bounce);
        ctx.lineTo(cx + s * 0.22, cy - s * 0.25 + bounce);
        ctx.arc(cx, cy - s * 0.2 + bounce, s * 0.22, -0.2, Math.PI + 0.2, true);
        ctx.fill();

        // Глаза (аниме-стиль, как у девочки)
        var eyeOffX = 0, eyeOffY = 0;
        if (direction === DIR.LEFT) eyeOffX = -s * 0.03;
        if (direction === DIR.RIGHT) eyeOffX = s * 0.03;
        if (direction === DIR.UP) eyeOffY = -s * 0.02;
        if (direction === DIR.DOWN) eyeOffY = s * 0.02;

        var eyeY = cy - s * 0.12 + bounce;
        var eyeSpacing = s * 0.09;

        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.ellipse(cx - eyeSpacing + eyeOffX, eyeY + eyeOffY, s * 0.06, s * 0.07, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + eyeSpacing + eyeOffX, eyeY + eyeOffY, s * 0.06, s * 0.07, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#4E342E';
        ctx.beginPath();
        ctx.arc(cx - eyeSpacing + eyeOffX * 1.3, eyeY + eyeOffY * 1.3 + s * 0.01, s * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + eyeSpacing + eyeOffX * 1.3, eyeY + eyeOffY * 1.3 + s * 0.01, s * 0.04, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1A1A1A';
        ctx.beginPath();
        ctx.arc(cx - eyeSpacing + eyeOffX * 1.5, eyeY + eyeOffY * 1.5 + s * 0.015, s * 0.022, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + eyeSpacing + eyeOffX * 1.5, eyeY + eyeOffY * 1.5 + s * 0.015, s * 0.022, 0, Math.PI * 2);
        ctx.fill();

        // Блики
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(cx - eyeSpacing + eyeOffX + s * 0.02, eyeY + eyeOffY - s * 0.02, s * 0.015, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + eyeSpacing + eyeOffX + s * 0.02, eyeY + eyeOffY - s * 0.02, s * 0.015, 0, Math.PI * 2);
        ctx.fill();

        // Ротик
        ctx.beginPath();
        ctx.arc(cx + eyeOffX * 0.5, cy - s * 0.04 + bounce, s * 0.035, 0.2, Math.PI - 0.2);
        ctx.strokeStyle = '#C62828';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.restore();
    },

    // Маскот Ведёрко (чиби-спрайт из картинки)
    drawBucket: function(ctx, x, y, size, isFull, playerAngle) {
        var s = size;
        var cx = x + s / 2;
        var cy = y + s / 2;

        ctx.save();

        if (this._bucketLoaded && this._bucketImg) {
            var drawSize = s * 1.15;
            var dx = cx - drawSize / 2;
            var dy = cy - drawSize / 2 - s * 0.05;
            ctx.drawImage(this._bucketImg, dx, dy, drawSize, drawSize);
        } else {
            // Fallback пока картинка грузится
            ctx.fillStyle = '#9E9E9E';
            ctx.fillRect(x + s * 0.2, y + s * 0.2, s * 0.6, s * 0.6);
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(cx - s * 0.1, cy, s * 0.06, 0, Math.PI * 2);
            ctx.arc(cx + s * 0.1, cy, s * 0.06, 0, Math.PI * 2);
            ctx.fill();
        }

        // Если полное — мусор торчит сверху
        if (isFull) {
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.arc(cx - s * 0.08, y + s * 0.1, s * 0.05, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FF9800';
            ctx.beginPath();
            ctx.arc(cx + s * 0.1, y + s * 0.07, s * 0.04, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    },

    // Крыса
    drawRat: function(ctx, x, y, size, direction, frozen, frame) {
        var s = size;
        var cx = x + s / 2;
        var cy = y + s / 2;

        ctx.save();

        if (frozen) {
            ctx.globalAlpha = 0.7;
        }

        // Тело (серый овал)
        ctx.fillStyle = frozen ? '#90CAF9' : '#757575';
        ctx.beginPath();
        ctx.ellipse(cx, cy, s * 0.2, s * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Уши
        ctx.fillStyle = frozen ? '#64B5F6' : '#616161';
        ctx.beginPath();
        ctx.arc(cx - s * 0.15, cy - s * 0.2, s * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + s * 0.15, cy - s * 0.2, s * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Внутри ушей
        ctx.fillStyle = '#E91E63';
        ctx.beginPath();
        ctx.arc(cx - s * 0.15, cy - s * 0.2, s * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + s * 0.15, cy - s * 0.2, s * 0.04, 0, Math.PI * 2);
        ctx.fill();

        // Глаза (красные)
        ctx.fillStyle = frozen ? '#FFF' : '#FF1744';
        ctx.beginPath();
        ctx.arc(cx - s * 0.07, cy - s * 0.05, s * 0.035, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + s * 0.07, cy - s * 0.05, s * 0.035, 0, Math.PI * 2);
        ctx.fill();

        // Нос
        ctx.fillStyle = '#E91E63';
        ctx.beginPath();
        ctx.arc(cx, cy + s * 0.08, s * 0.03, 0, Math.PI * 2);
        ctx.fill();

        // Хвост
        ctx.strokeStyle = frozen ? '#90CAF9' : '#9E9E9E';
        ctx.lineWidth = 2;
        ctx.beginPath();
        var tailWag = Math.sin(frame * 0.5) * s * 0.1;
        ctx.moveTo(cx, cy + s * 0.25);
        ctx.quadraticCurveTo(cx + tailWag, cy + s * 0.35, cx + tailWag + s * 0.1, cy + s * 0.4);
        ctx.stroke();

        // Снежинки если заморожена
        if (frozen) {
            ctx.fillStyle = '#FFF';
            ctx.font = Math.floor(s * 0.2) + 'px serif';
            ctx.fillText('❄', cx - s * 0.3, cy - s * 0.25);
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    },

    // Мусор — 6 узнаваемых типов
    drawTrash: function(ctx, x, y, size, trashType, stinkLevel) {
        var s = size;
        var cx = x + s / 2;
        var cy = y + s / 2;

        ctx.save();

        // Увеличиваем предметы на 40% от центра тайла для видимости
        var sc = 1.4;
        ctx.translate(cx, cy);
        ctx.scale(sc, sc);
        ctx.translate(-cx, -cy);

        switch (trashType) {
            case 'banana':
                // Банановая кожура
                ctx.fillStyle = '#FDD835';
                ctx.beginPath();
                ctx.moveTo(cx - s * 0.2, cy + s * 0.15);
                ctx.quadraticCurveTo(cx - s * 0.25, cy - s * 0.15, cx, cy - s * 0.25);
                ctx.quadraticCurveTo(cx + s * 0.25, cy - s * 0.15, cx + s * 0.2, cy + s * 0.15);
                ctx.quadraticCurveTo(cx, cy + s * 0.05, cx - s * 0.2, cy + s * 0.15);
                ctx.fill();
                // Тёмные пятна
                ctx.fillStyle = '#A68B00';
                ctx.beginPath();
                ctx.arc(cx - s * 0.08, cy - s * 0.05, s * 0.04, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(cx + s * 0.1, cy - s * 0.1, s * 0.03, 0, Math.PI * 2);
                ctx.fill();
                // Кончик
                ctx.fillStyle = '#795548';
                ctx.beginPath();
                ctx.arc(cx, cy - s * 0.27, s * 0.04, 0, Math.PI * 2);
                ctx.fill();
                // Раскрытые половинки
                ctx.fillStyle = '#FFE082';
                ctx.beginPath();
                ctx.moveTo(cx - s * 0.22, cy + s * 0.15);
                ctx.quadraticCurveTo(cx - s * 0.3, cy + s * 0.25, cx - s * 0.15, cy + s * 0.3);
                ctx.lineTo(cx - s * 0.1, cy + s * 0.15);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(cx + s * 0.22, cy + s * 0.15);
                ctx.quadraticCurveTo(cx + s * 0.3, cy + s * 0.25, cx + s * 0.15, cy + s * 0.3);
                ctx.lineTo(cx + s * 0.1, cy + s * 0.15);
                ctx.fill();
                break;

            case 'apple':
                // Огрызок яблока
                ctx.fillStyle = '#E8D5B7';
                ctx.beginPath();
                ctx.moveTo(cx - s * 0.08, cy - s * 0.15);
                ctx.lineTo(cx + s * 0.08, cy - s * 0.15);
                ctx.lineTo(cx + s * 0.06, cy + s * 0.2);
                ctx.lineTo(cx - s * 0.06, cy + s * 0.2);
                ctx.closePath();
                ctx.fill();
                // Красная кожура по бокам
                ctx.fillStyle = '#E53935';
                ctx.beginPath();
                ctx.moveTo(cx - s * 0.08, cy - s * 0.15);
                ctx.quadraticCurveTo(cx - s * 0.22, cy, cx - s * 0.08, cy + s * 0.2);
                ctx.lineTo(cx - s * 0.06, cy + s * 0.2);
                ctx.quadraticCurveTo(cx - s * 0.12, cy, cx - s * 0.08, cy - s * 0.15);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(cx + s * 0.08, cy - s * 0.15);
                ctx.quadraticCurveTo(cx + s * 0.22, cy, cx + s * 0.08, cy + s * 0.2);
                ctx.lineTo(cx + s * 0.06, cy + s * 0.2);
                ctx.quadraticCurveTo(cx + s * 0.12, cy, cx + s * 0.08, cy - s * 0.15);
                ctx.fill();
                // Семечки
                ctx.fillStyle = '#5D4037';
                ctx.beginPath();
                ctx.ellipse(cx - s * 0.02, cy, s * 0.02, s * 0.04, 0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(cx + s * 0.02, cy + s * 0.03, s * 0.02, s * 0.04, -0.3, 0, Math.PI * 2);
                ctx.fill();
                // Черенок
                ctx.strokeStyle = '#5D4037';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(cx, cy - s * 0.15);
                ctx.lineTo(cx + s * 0.03, cy - s * 0.28);
                ctx.stroke();
                // Листик
                ctx.fillStyle = '#66BB6A';
                ctx.beginPath();
                ctx.ellipse(cx + s * 0.08, cy - s * 0.26, s * 0.06, s * 0.03, 0.5, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'can':
                // Мятая алюминиевая банка (на боку)
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(0.4);
                ctx.translate(-cx, -cy);
                // Тело банки
                ctx.fillStyle = '#E53935';
                ctx.beginPath();
                ctx.moveTo(cx - s * 0.12, cy - s * 0.18);
                ctx.lineTo(cx + s * 0.12, cy - s * 0.18);
                ctx.quadraticCurveTo(cx + s * 0.15, cy, cx + s * 0.12, cy + s * 0.18);
                ctx.lineTo(cx - s * 0.12, cy + s * 0.18);
                ctx.quadraticCurveTo(cx - s * 0.15, cy, cx - s * 0.12, cy - s * 0.18);
                ctx.closePath();
                ctx.fill();
                // Верх банки (крышка)
                ctx.fillStyle = '#BDBDBD';
                ctx.beginPath();
                ctx.ellipse(cx, cy - s * 0.18, s * 0.12, s * 0.04, 0, 0, Math.PI * 2);
                ctx.fill();
                // Низ
                ctx.fillStyle = '#9E9E9E';
                ctx.beginPath();
                ctx.ellipse(cx, cy + s * 0.18, s * 0.12, s * 0.04, 0, 0, Math.PI * 2);
                ctx.fill();
                // Этикетка (белая полоса)
                ctx.fillStyle = '#FFF';
                ctx.fillRect(cx - s * 0.11, cy - s * 0.04, s * 0.22, s * 0.08);
                // Вмятина
                ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cx - s * 0.08, cy + s * 0.06);
                ctx.quadraticCurveTo(cx, cy + s * 0.12, cx + s * 0.08, cy + s * 0.06);
                ctx.stroke();
                // Блик
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fillRect(cx + s * 0.06, cy - s * 0.15, s * 0.03, s * 0.2);
                ctx.restore();
                break;

            case 'plasticbag':
                // Пластиковый пакет
                ctx.fillStyle = 'rgba(200,230,255,0.7)';
                ctx.beginPath();
                ctx.moveTo(cx - s * 0.05, cy - s * 0.3);
                ctx.quadraticCurveTo(cx - s * 0.25, cy - s * 0.1, cx - s * 0.2, cy + s * 0.15);
                ctx.quadraticCurveTo(cx, cy + s * 0.3, cx + s * 0.2, cy + s * 0.15);
                ctx.quadraticCurveTo(cx + s * 0.25, cy - s * 0.1, cx + s * 0.05, cy - s * 0.3);
                ctx.closePath();
                ctx.fill();
                // Обводка
                ctx.strokeStyle = 'rgba(100,150,200,0.5)';
                ctx.lineWidth = 1;
                ctx.stroke();
                // Ручки
                ctx.beginPath();
                ctx.moveTo(cx - s * 0.05, cy - s * 0.3);
                ctx.quadraticCurveTo(cx - s * 0.15, cy - s * 0.4, cx - s * 0.1, cy - s * 0.3);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx + s * 0.05, cy - s * 0.3);
                ctx.quadraticCurveTo(cx + s * 0.15, cy - s * 0.4, cx + s * 0.1, cy - s * 0.3);
                ctx.stroke();
                // Складки
                ctx.strokeStyle = 'rgba(100,150,200,0.3)';
                ctx.beginPath();
                ctx.moveTo(cx - s * 0.1, cy);
                ctx.quadraticCurveTo(cx, cy + s * 0.05, cx + s * 0.1, cy);
                ctx.stroke();
                break;

            case 'paper':
                // Мятая бумага / комок
                ctx.fillStyle = '#EFEBE9';
                ctx.beginPath();
                ctx.moveTo(cx, cy - s * 0.22);
                ctx.lineTo(cx + s * 0.18, cy - s * 0.1);
                ctx.lineTo(cx + s * 0.2, cy + s * 0.1);
                ctx.lineTo(cx + s * 0.08, cy + s * 0.22);
                ctx.lineTo(cx - s * 0.1, cy + s * 0.2);
                ctx.lineTo(cx - s * 0.2, cy + s * 0.05);
                ctx.lineTo(cx - s * 0.15, cy - s * 0.12);
                ctx.closePath();
                ctx.fill();
                // Тень/складки
                ctx.strokeStyle = '#BDBDBD';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx - s * 0.08, cy - s * 0.08);
                ctx.lineTo(cx + s * 0.05, cy + s * 0.05);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx + s * 0.05, cy - s * 0.12);
                ctx.lineTo(cx - s * 0.05, cy + s * 0.1);
                ctx.stroke();
                // Текст (полоски как текст)
                ctx.strokeStyle = '#90A4AE';
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(cx - s * 0.06, cy - s * 0.02);
                ctx.lineTo(cx + s * 0.1, cy - s * 0.02);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(cx - s * 0.04, cy + s * 0.06);
                ctx.lineTo(cx + s * 0.08, cy + s * 0.06);
                ctx.stroke();
                break;

            case 'bottle':
                // Пластиковая бутылка (мятая, на боку)
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(0.5); // наклон
                ctx.translate(-cx, -cy);
                ctx.fillStyle = '#81D4FA';
                ctx.beginPath();
                ctx.moveTo(cx - s * 0.06, cy - s * 0.3);
                ctx.lineTo(cx + s * 0.06, cy - s * 0.3);
                ctx.lineTo(cx + s * 0.12, cy - s * 0.15);
                ctx.lineTo(cx + s * 0.12, cy + s * 0.2);
                ctx.quadraticCurveTo(cx, cy + s * 0.28, cx - s * 0.12, cy + s * 0.2);
                ctx.lineTo(cx - s * 0.12, cy - s * 0.15);
                ctx.closePath();
                ctx.fill();
                // Крышка
                ctx.fillStyle = '#1565C0';
                ctx.fillRect(cx - s * 0.05, cy - s * 0.36, s * 0.1, s * 0.08);
                // Этикетка
                ctx.fillStyle = '#FFF';
                ctx.fillRect(cx - s * 0.1, cy - s * 0.05, s * 0.2, s * 0.1);
                // Блик
                ctx.fillStyle = 'rgba(255,255,255,0.35)';
                ctx.fillRect(cx + s * 0.06, cy - s * 0.2, s * 0.03, s * 0.25);
                // Вмятина
                ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cx - s * 0.08, cy + s * 0.08);
                ctx.quadraticCurveTo(cx, cy + s * 0.02, cx + s * 0.08, cy + s * 0.08);
                ctx.stroke();
                ctx.restore();
                break;
        }

        // Пульсирующий ореол — всегда видно, усиливается со временем
        var t = Date.now();
        var pulse = 0.5 + 0.5 * Math.sin(t / 400);
        var baseGlow = 0.12 + stinkLevel * 0.2;
        var glowAlpha = baseGlow + pulse * 0.08;
        var glowR = s * (0.35 + stinkLevel * 0.1 + pulse * 0.05);
        var glowGrad = ctx.createRadialGradient(cx, cy, s * 0.1, cx, cy, glowR);
        glowGrad.addColorStop(0, 'rgba(139,195,74,' + glowAlpha + ')');
        glowGrad.addColorStop(1, 'rgba(139,195,74,0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(cx - glowR, cy - glowR, glowR * 2, glowR * 2);

        // Испарения — усиливаются с stinkLevel
        if (stinkLevel > 0) {
            var numClouds = 3 + Math.floor(stinkLevel * 3);
            ctx.globalAlpha = Math.min(stinkLevel, 1) * 0.55;
            ctx.fillStyle = '#8BC34A';
            for (var j = 0; j < numClouds; j++) {
                var phase = t / (600 - j * 40) + j * 2.1;
                var rise = (phase % (Math.PI * 2)) / (Math.PI * 2); // 0..1 цикл подъёма
                var sx = cx - s * 0.25 + (j % 3) * s * 0.25 + Math.sin(phase * 1.3) * s * 0.08;
                var sy = cy - s * 0.3 - rise * s * 0.35;
                var sr = s * (0.05 + 0.04 * Math.sin(phase));
                ctx.globalAlpha = Math.min(stinkLevel, 1) * 0.55 * (1 - rise); // затухание при подъёме
                ctx.beginPath();
                ctx.arc(sx, sy, sr, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        ctx.restore();
    },

    // Котик
    drawCat: function(ctx, x, y, size, frame, sleeping) {
        var s = size;
        var cx = x + s / 2;
        var cy = y + s / 2;

        ctx.save();
        // Увеличиваем для видимости
        var sc = 1.25;
        ctx.translate(cx, cy);
        ctx.scale(sc, sc);
        ctx.translate(-cx, -cy);

        if (sleeping) {
            // Свернувшийся котик
            ctx.fillStyle = '#FF9800';
            ctx.beginPath();
            ctx.arc(cx, cy + s * 0.05, s * 0.22, 0, Math.PI * 2);
            ctx.fill();
            // Хвост обёрнут
            ctx.strokeStyle = '#F57C00';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy + s * 0.05, s * 0.18, 0.5, Math.PI + 0.5);
            ctx.stroke();
            // ZZZ
            ctx.fillStyle = '#FFF';
            ctx.font = Math.floor(s * 0.18) + 'px sans-serif';
            ctx.fillText('z', cx + s * 0.15, cy - s * 0.15);
            ctx.font = Math.floor(s * 0.22) + 'px sans-serif';
            ctx.fillText('Z', cx + s * 0.25, cy - s * 0.25);
        } else {
            // Тело
            ctx.fillStyle = '#FF9800';
            ctx.beginPath();
            ctx.ellipse(cx, cy + s * 0.05, s * 0.18, s * 0.22, 0, 0, Math.PI * 2);
            ctx.fill();

            // Голова
            ctx.beginPath();
            ctx.arc(cx, cy - s * 0.18, s * 0.15, 0, Math.PI * 2);
            ctx.fill();

            // Уши (треугольники)
            ctx.beginPath();
            ctx.moveTo(cx - s * 0.15, cy - s * 0.22);
            ctx.lineTo(cx - s * 0.1, cy - s * 0.38);
            ctx.lineTo(cx - s * 0.02, cy - s * 0.22);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx + s * 0.02, cy - s * 0.22);
            ctx.lineTo(cx + s * 0.1, cy - s * 0.38);
            ctx.lineTo(cx + s * 0.15, cy - s * 0.22);
            ctx.fill();

            // Глаза
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(cx - s * 0.06, cy - s * 0.2, s * 0.04, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + s * 0.06, cy - s * 0.2, s * 0.04, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(cx - s * 0.06, cy - s * 0.2, s * 0.02, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + s * 0.06, cy - s * 0.2, s * 0.02, 0, Math.PI * 2);
            ctx.fill();

            // Усы
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx - s * 0.05, cy - s * 0.13);
            ctx.lineTo(cx - s * 0.25, cy - s * 0.16);
            ctx.moveTo(cx - s * 0.05, cy - s * 0.11);
            ctx.lineTo(cx - s * 0.25, cy - s * 0.1);
            ctx.moveTo(cx + s * 0.05, cy - s * 0.13);
            ctx.lineTo(cx + s * 0.25, cy - s * 0.16);
            ctx.moveTo(cx + s * 0.05, cy - s * 0.11);
            ctx.lineTo(cx + s * 0.25, cy - s * 0.1);
            ctx.stroke();

            // Хвост (виляет)
            ctx.strokeStyle = '#F57C00';
            ctx.lineWidth = 3;
            var tailWag = Math.sin(frame * 0.3) * s * 0.1;
            ctx.beginPath();
            ctx.moveTo(cx, cy + s * 0.25);
            ctx.quadraticCurveTo(cx + s * 0.2, cy + s * 0.15 + tailWag, cx + s * 0.25, cy + s * 0.05);
            ctx.stroke();
        }

        ctx.restore();
    },

    // Цветочек
    drawFlower: function(ctx, x, y, size, watered) {
        var s = size;
        var cx = x + s / 2;
        var cy = y + s / 2;

        ctx.save();
        // Увеличиваем для видимости
        var sc = 1.3;
        ctx.translate(cx, cy);
        ctx.scale(sc, sc);
        ctx.translate(-cx, -cy);

        // Стебель
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy + s * 0.3);
        ctx.lineTo(cx, cy - s * 0.05);
        ctx.stroke();

        // Листья
        ctx.fillStyle = '#66BB6A';
        ctx.beginPath();
        ctx.ellipse(cx - s * 0.1, cy + s * 0.15, s * 0.08, s * 0.04, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + s * 0.1, cy + s * 0.08, s * 0.08, s * 0.04, 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Лепестки
        var petalColors = watered ? ['#F06292', '#EC407A', '#E91E63', '#D81B60', '#C2185B'] :
                                     ['#FFEB3B', '#FFC107', '#FF9800', '#FFEB3B', '#FFC107'];
        for (var i = 0; i < 5; i++) {
            var angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
            var px = cx + Math.cos(angle) * s * 0.12;
            var py = (cy - s * 0.12) + Math.sin(angle) * s * 0.12;
            ctx.fillStyle = petalColors[i];
            ctx.beginPath();
            ctx.arc(px, py, s * 0.08, 0, Math.PI * 2);
            ctx.fill();
        }

        // Центр
        ctx.fillStyle = '#FF5722';
        ctx.beginPath();
        ctx.arc(cx, cy - s * 0.12, s * 0.06, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    // Выход — двустворчатые двери с анимацией открытия
    drawExit: function(ctx, x, y, size, isOpen, openProgress) {
        var s = size;
        var cx = x + s / 2;
        var cy = y + s / 2;
        var p = openProgress || 0; // 0 = закрыто, 1 = полностью открыто

        ctx.save();
        // Увеличиваем для видимости
        var sc = 1.2;
        ctx.translate(cx, cy);
        ctx.scale(sc, sc);
        ctx.translate(-cx, -cy);

        // Арка/портал (фон)
        ctx.fillStyle = '#5D4037';
        ctx.beginPath();
        ctx.moveTo(x + s * 0.08, y + s * 0.92);
        ctx.lineTo(x + s * 0.08, y + s * 0.25);
        ctx.arc(cx, y + s * 0.25, s * 0.42, Math.PI, 0);
        ctx.lineTo(x + s * 0.92, y + s * 0.92);
        ctx.closePath();
        ctx.fill();

        // Внутренность (свет за дверьми — виден когда двери открываются)
        if (p > 0) {
            var grd = ctx.createRadialGradient(cx, cy - s * 0.05, 0, cx, cy - s * 0.05, s * 0.4);
            grd.addColorStop(0, 'rgba(255, 248, 225, ' + (0.9 * p) + ')');
            grd.addColorStop(0.5, 'rgba(76, 175, 80, ' + (0.6 * p) + ')');
            grd.addColorStop(1, 'rgba(46, 125, 50, ' + (0.3 * p) + ')');
            ctx.fillStyle = grd;
        } else {
            ctx.fillStyle = '#3E2723';
        }
        ctx.beginPath();
        ctx.moveTo(x + s * 0.14, y + s * 0.88);
        ctx.lineTo(x + s * 0.14, y + s * 0.3);
        ctx.arc(cx, y + s * 0.3, s * 0.36, Math.PI, 0);
        ctx.lineTo(x + s * 0.86, y + s * 0.88);
        ctx.closePath();
        ctx.fill();

        // Левая створка двери
        var doorWidth = s * 0.34;
        var leftOpen = doorWidth * p * 0.85; // сколько открыто
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(x + s * 0.14 + leftOpen * 0.1, y + s * 0.3, doorWidth - leftOpen, s * 0.58);
        // Панели на двери
        if (doorWidth - leftOpen > s * 0.08) {
            ctx.fillStyle = '#795548';
            var dlx = x + s * 0.14 + leftOpen * 0.1;
            var dlw = doorWidth - leftOpen;
            ctx.fillRect(dlx + dlw * 0.1, y + s * 0.35, dlw * 0.8, s * 0.18);
            ctx.fillRect(dlx + dlw * 0.1, y + s * 0.6, dlw * 0.8, s * 0.22);
        }

        // Правая створка двери
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(cx + leftOpen, y + s * 0.3, doorWidth - leftOpen, s * 0.58);
        if (doorWidth - leftOpen > s * 0.08) {
            ctx.fillStyle = '#795548';
            var drx = cx + leftOpen;
            var drw = doorWidth - leftOpen;
            ctx.fillRect(drx + drw * 0.1, y + s * 0.35, drw * 0.8, s * 0.18);
            ctx.fillRect(drx + drw * 0.1, y + s * 0.6, drw * 0.8, s * 0.22);
        }

        // Ручки дверей (если двери не полностью открыты)
        if (p < 0.9) {
            ctx.fillStyle = '#FFD54F';
            ctx.beginPath();
            ctx.arc(cx - s * 0.04 - leftOpen * 0.3, cy + s * 0.12, s * 0.03, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + s * 0.04 + leftOpen * 0.3, cy + s * 0.12, s * 0.03, 0, Math.PI * 2);
            ctx.fill();
        }

        // Декоративная арка сверху
        ctx.strokeStyle = '#4E342E';
        ctx.lineWidth = s * 0.04;
        ctx.beginPath();
        ctx.arc(cx, y + s * 0.25, s * 0.42, Math.PI, 0);
        ctx.stroke();

        // Замковый камень арки
        ctx.fillStyle = '#A1887F';
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.06, y + s * 0.05);
        ctx.lineTo(cx + s * 0.06, y + s * 0.05);
        ctx.lineTo(cx + s * 0.04, y + s * 0.15);
        ctx.lineTo(cx - s * 0.04, y + s * 0.15);
        ctx.closePath();
        ctx.fill();

        // Пульсирующее свечение когда открыт
        if (isOpen && p > 0.3) {
            var pulse = 0.15 + Math.sin(Date.now() / 400) * 0.1;
            ctx.beginPath();
            ctx.arc(cx, cy, s * 0.5, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(76, 175, 80, ' + (pulse * p) + ')';
            ctx.lineWidth = 3;
            ctx.stroke();
            // Лучи света из дверей
            if (p > 0.5) {
                ctx.globalAlpha = 0.15 * p;
                ctx.fillStyle = '#FFEB3B';
                ctx.beginPath();
                ctx.moveTo(cx - s * 0.1, cy);
                ctx.lineTo(cx - s * 0.5, cy + s * 0.7);
                ctx.lineTo(cx + s * 0.5, cy + s * 0.7);
                ctx.lineTo(cx + s * 0.1, cy);
                ctx.closePath();
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }

        // Ступеньки внизу
        ctx.fillStyle = '#6D4C41';
        ctx.fillRect(x + s * 0.1, y + s * 0.88, s * 0.8, s * 0.06);
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(x + s * 0.06, y + s * 0.93, s * 0.88, s * 0.05);

        ctx.restore();
    },

    // Кроссовки
    drawSneakers: function(ctx, x, y, size) {
        var s = size;
        var cx = x + s / 2;
        var cy = y + s / 2;

        ctx.save();
        // Увеличиваем для видимости
        var sc = 1.3;
        ctx.translate(cx, cy);
        ctx.scale(sc, sc);
        ctx.translate(-cx, -cy);
        ctx.fillStyle = '#2196F3';
        // Левая
        ctx.beginPath();
        ctx.ellipse(cx - s * 0.12, cy + s * 0.05, s * 0.15, s * 0.1, -0.2, 0, Math.PI * 2);
        ctx.fill();
        // Правая
        ctx.beginPath();
        ctx.ellipse(cx + s * 0.12, cy - s * 0.05, s * 0.15, s * 0.1, 0.2, 0, Math.PI * 2);
        ctx.fill();
        // Полоски
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.2, cy + s * 0.03);
        ctx.lineTo(cx - s * 0.05, cy + s * 0.08);
        ctx.moveTo(cx + s * 0.03, cy - s * 0.08);
        ctx.lineTo(cx + s * 0.2, cy - s * 0.03);
        ctx.stroke();
        // Молнии (скорость)
        ctx.fillStyle = '#FFEB3B';
        ctx.font = Math.floor(s * 0.2) + 'px sans-serif';
        ctx.fillText('⚡', cx - s * 0.35, cy - s * 0.15);
        ctx.restore();
    },

    // Компас
    drawCompass: function(ctx, x, y, size) {
        var s = size;
        var cx = x + s / 2;
        var cy = y + s / 2;

        ctx.save();
        // Увеличиваем для видимости
        var sc = 1.3;
        ctx.translate(cx, cy);
        ctx.scale(sc, sc);
        ctx.translate(-cx, -cy);
        // Корпус
        ctx.fillStyle = '#795548';
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.3, 0, Math.PI * 2);
        ctx.fill();
        // Внутренность
        ctx.fillStyle = '#FFF8E1';
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.24, 0, Math.PI * 2);
        ctx.fill();
        // Стрелка
        ctx.fillStyle = '#F44336';
        ctx.beginPath();
        ctx.moveTo(cx, cy - s * 0.2);
        ctx.lineTo(cx - s * 0.05, cy);
        ctx.lineTo(cx + s * 0.05, cy);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#2196F3';
        ctx.beginPath();
        ctx.moveTo(cx, cy + s * 0.2);
        ctx.lineTo(cx - s * 0.05, cy);
        ctx.lineTo(cx + s * 0.05, cy);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    },

    // Стрелка компаса (HUD указатель к мусору)
    drawCompassArrow: function(ctx, x, y, angle, size) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = 'rgba(255, 235, 59, 0.8)';
        ctx.beginPath();
        ctx.moveTo(size, 0);
        ctx.lineTo(-size * 0.5, -size * 0.4);
        ctx.lineTo(-size * 0.3, 0);
        ctx.lineTo(-size * 0.5, size * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 152, 0, 0.8)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    },

    // Кубок победы
    drawTrophy: function(ctx, x, y, size, time) {
        var s = size;
        var cx = x + s / 2;
        var cy = y + s / 2;
        var bounce = Math.sin((time || 0) / 300) * s * 0.03;
        var scale = 1 + Math.sin((time || 0) / 500) * 0.04;

        ctx.save();
        ctx.translate(cx, cy + bounce);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);

        // Основание
        ctx.fillStyle = '#8D6E63';
        this._roundRect(ctx, cx - s * 0.15, cy + s * 0.25, s * 0.3, s * 0.08, 3);
        ctx.fill();
        ctx.fillStyle = '#6D4C41';
        ctx.fillRect(cx - s * 0.08, cy + s * 0.18, s * 0.16, s * 0.08);

        // Чаша кубка
        var grad = ctx.createLinearGradient(cx - s * 0.25, cy, cx + s * 0.25, cy);
        grad.addColorStop(0, '#FFC107');
        grad.addColorStop(0.3, '#FFEE58');
        grad.addColorStop(0.5, '#FFF9C4');
        grad.addColorStop(0.7, '#FFEE58');
        grad.addColorStop(1, '#FFC107');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.25, cy - s * 0.2);
        ctx.quadraticCurveTo(cx - s * 0.28, cy + s * 0.1, cx - s * 0.08, cy + s * 0.18);
        ctx.lineTo(cx + s * 0.08, cy + s * 0.18);
        ctx.quadraticCurveTo(cx + s * 0.28, cy + s * 0.1, cx + s * 0.25, cy - s * 0.2);
        ctx.closePath();
        ctx.fill();

        // Ручки
        ctx.strokeStyle = '#FFC107';
        ctx.lineWidth = s * 0.04;
        ctx.beginPath();
        ctx.arc(cx - s * 0.28, cy - s * 0.05, s * 0.1, -1.2, 1.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + s * 0.28, cy - s * 0.05, s * 0.1, Math.PI - 1.2, Math.PI + 1.2);
        ctx.stroke();

        // Звезда на кубке
        ctx.fillStyle = '#FF6F00';
        var starCx = cx, starCy = cy - s * 0.02;
        var outerR = s * 0.08, innerR = s * 0.035;
        ctx.beginPath();
        for (var i = 0; i < 10; i++) {
            var r = i % 2 === 0 ? outerR : innerR;
            var angle = -Math.PI / 2 + (Math.PI * 2 / 10) * i;
            if (i === 0) ctx.moveTo(starCx + r * Math.cos(angle), starCy + r * Math.sin(angle));
            else ctx.lineTo(starCx + r * Math.cos(angle), starCy + r * Math.sin(angle));
        }
        ctx.closePath();
        ctx.fill();

        // Блик
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.ellipse(cx - s * 0.1, cy - s * 0.1, s * 0.04, s * 0.12, -0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    _roundRect: function(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }
};
