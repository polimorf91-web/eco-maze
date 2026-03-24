// ECO.Animations — визуальные эффекты
ECO.Animations = {
    particles: [],
    texts: [],

    update: function(dt) {
        // Обновить частицы
        for (var i = this.particles.length - 1; i >= 0; i--) {
            var p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            p.x += p.vx * dt / 1000;
            p.y += p.vy * dt / 1000;
            p.vy += (p.gravity || 0) * dt / 1000;
            p.alpha = Math.max(0, p.life / p.maxLife);
        }

        // Обновить тексты
        for (var j = this.texts.length - 1; j >= 0; j--) {
            var t = this.texts[j];
            t.life -= dt;
            if (t.life <= 0) {
                this.texts.splice(j, 1);
                continue;
            }
            t.y -= 30 * dt / 1000;
            t.alpha = Math.max(0, t.life / t.maxLife);
        }
    },

    draw: function(ctx, camX, camY) {
        // Частицы
        for (var i = 0; i < this.particles.length; i++) {
            var p = this.particles[i];
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            if (p.shape === 'leaf') {
                ctx.save();
                ctx.translate(p.x - camX, p.y - camY);
                ctx.rotate(p.rotation || 0);
                ctx.beginPath();
                ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                p.rotation = (p.rotation || 0) + 2 * (p.life / p.maxLife) * 0.05;
            } else if (p.shape === 'drop') {
                ctx.beginPath();
                ctx.arc(p.x - camX, p.y - camY, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(p.x - camX - p.size / 2, p.y - camY - p.size / 2, p.size, p.size);
            }
        }
        ctx.globalAlpha = 1;

        // Плавающие тексты
        ctx.save();
        for (var j = 0; j < this.texts.length; j++) {
            var t = this.texts[j];
            ctx.globalAlpha = t.alpha;
            ctx.fillStyle = t.color;
            ctx.font = t.font || 'bold 18px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(t.text, t.x - camX, t.y - camY);
        }
        ctx.restore();
    },

    // Конфетти при победе
    spawnConfetti: function(x, y, count) {
        var colors = ['#4CAF50', '#FFEB3B', '#E91E63', '#2196F3', '#FF9800', '#9C27B0'];
        for (var i = 0; i < (count || 30); i++) {
            var lifeVal = 2000 + Math.random() * 1000;
            this.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 200,
                vy: -Math.random() * 200 - 50,
                gravity: 150,
                size: 4 + Math.random() * 4,
                color: ECO.Utils.randomChoice(colors),
                shape: Math.random() > 0.5 ? 'leaf' : 'rect',
                life: lifeVal,
                maxLife: lifeVal,
                alpha: 1,
                rotation: Math.random() * Math.PI * 2
            });
        }
    },

    // Капли воды при поливе цветка
    spawnWaterDrops: function(x, y) {
        for (var i = 0; i < 8; i++) {
            var lifeVal = 800 + Math.random() * 400;
            this.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y - 10,
                vx: (Math.random() - 0.5) * 40,
                vy: -Math.random() * 60 - 20,
                gravity: 120,
                size: 2 + Math.random() * 2,
                color: '#42A5F5',
                shape: 'drop',
                life: lifeVal,
                maxLife: lifeVal,
                alpha: 1
            });
        }
    },

    // Вспышка при скоростном бусте
    spawnSpeedFlash: function(x, y) {
        for (var i = 0; i < 6; i++) {
            this.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100,
                gravity: 0,
                size: 3,
                color: '#FFEB3B',
                shape: 'rect',
                life: 500,
                maxLife: 500,
                alpha: 1
            });
        }
    },

    // Плавающий текст
    spawnFloatingText: function(x, y, text, color) {
        this.texts.push({
            x: x, y: y,
            text: text,
            color: color || '#FFF',
            font: 'bold 18px sans-serif',
            life: 1500,
            maxLife: 1500,
            alpha: 1
        });
    },

    clear: function() {
        this.particles = [];
        this.texts = [];
    }
};
