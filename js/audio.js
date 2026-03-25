// ECO.Audio — звуки через Web Audio API (без файлов)
ECO.Audio = {
    ctx: null,
    enabled: true,
    musicPlaying: false,
    _musicNodes: null,
    _stepTimer: 0,
    _stepInterval: 280, // мс между шагами

    init: function() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            this.enabled = false;
        }
    },

    _resume: function() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    // === ФОНОВАЯ МУЗЫКА (процедурная петля) ===
    // 5 разных мелодий для разнообразия уровней
    _melodies: [
        { // 0: Весёлая (город, площадка)
            notes: [523,587,659,587,523,494,440,494, 523,659,784,659,523,587,659,523,
                    440,494,523,587,659,784,659,523, 392,440,494,523,587,523,494,440,
                    494,523,587,659,784,659,587,523, 440,494,523,494,440,392,440,494,
                    523,587,659,784,880,784,659,523, 440,494,587,523,494,440,392,440],
            bass:    [262,262,330,330,349,349,262,262, 220,220,262,262,349,349,262,262],
            harmony: [392,392,494,494,523,523,392,392, 330,330,392,392,523,523,392,392],
            tempo: 0.22, type: 'sine', bassType: 'triangle'
        },
        { // 1: Таинственная (лес, пустыня)
            notes: [330,392,440,392,330,294,262,294, 330,294,262,294,330,392,440,392,
                    262,294,330,349,392,349,330,294, 262,330,392,330,294,262,294,330,
                    349,392,440,494,440,392,349,330, 294,330,349,330,294,262,294,349,
                    330,349,392,440,392,349,330,294, 262,294,330,294,262,330,349,330],
            bass:    [131,131,165,165,175,175,131,131, 165,165,131,131,175,175,165,131],
            harmony: [196,196,247,247,262,262,196,196, 247,247,196,196,262,262,247,196],
            tempo: 0.3, type: 'sine', bassType: 'sine'
        },
        { // 2: Энергичная (мегаполис, центр)
            notes: [659,784,880,784,659,784,880,1047, 880,784,659,587,523,587,659,784,
                    880,784,659,587,523,659,784,880, 1047,880,784,659,784,880,784,659,
                    587,659,784,880,1047,880,784,659, 587,523,587,659,784,880,784,659,
                    523,587,659,784,880,1047,880,784, 659,784,880,784,659,587,523,587],
            bass:    [330,330,392,392,440,440,330,330, 262,262,330,330,440,440,392,330],
            harmony: [494,494,587,587,659,659,494,494, 392,392,494,494,659,659,587,494],
            tempo: 0.18, type: 'square', bassType: 'triangle'
        },
        { // 3: Спокойная (деревня, парк, квартира)
            notes: [392,440,494,523,494,440,392,349, 330,349,392,440,494,440,392,349,
                    262,330,392,440,392,330,262,294, 330,392,440,392,349,330,294,262,
                    349,392,440,494,523,494,440,392, 349,330,349,392,440,392,349,330,
                    294,330,392,440,494,440,392,349, 330,349,392,349,330,294,262,294],
            bass:    [196,196,220,220,262,262,196,196, 175,175,196,196,262,262,220,196],
            harmony: [294,294,330,330,392,392,294,294, 262,262,294,294,392,392,330,294],
            tempo: 0.28, type: 'sine', bassType: 'triangle'
        },
        { // 4: Зимняя (зима, школа, пляж)
            notes: [523,659,784,659,523,440,523,659, 784,880,784,659,523,659,784,1047,
                    880,784,659,523,440,523,659,784, 659,523,440,392,440,523,659,523,
                    440,523,659,784,880,784,659,523, 440,392,440,523,659,784,659,523,
                    392,440,523,659,784,880,784,659, 523,659,784,659,523,440,392,440],
            bass:    [262,262,220,220,175,175,262,262, 220,220,262,262,175,175,220,262],
            harmony: [392,392,330,330,262,262,392,392, 330,330,392,392,262,262,330,392],
            tempo: 0.25, type: 'sine', bassType: 'sine'
        }
    ],

    // Маппинг тем → мелодия (по индексу темы)
    _themeMelodyMap: [0, 3, 2, 2, 1, 4, 3, 3, 4, 4, 1, 0],

    // Музыка для стартового экрана (спокойная, тише)
    startMenuMusic: function() {
        if (!this.enabled || !this.ctx) return;
        if (this.musicPlaying && this._currentMelodyIdx === 3) return; // уже играет меню
        this._resume();
        this.stopMusic();
        // Используем спокойную мелодию (индекс 3) с пониженной громкостью
        this._startMusicInternal(3, 0.12);
    },

    _startMusicInternal: function(melIdx, volume) {
        if (!this.enabled || !this.ctx) return;
        this.musicPlaying = true;
        this._currentMelodyIdx = melIdx;

        var melDef = this._melodies[melIdx];
        var ctx = this.ctx;
        var masterGain = ctx.createGain();
        masterGain.gain.value = volume || 0.25;
        masterGain.connect(ctx.destination);

        var melody = melDef.notes;
        var noteLen = melDef.tempo;
        var loopLen = melody.length * noteLen;
        var melType = melDef.type;
        var bassType = melDef.bassType;

        var self = this;
        var nextLoopStart = ctx.currentTime;

        function scheduleLoop() {
            if (!self.musicPlaying) return;
            var now = nextLoopStart;

            for (var i = 0; i < melody.length; i++) {
                var osc = ctx.createOscillator();
                var noteGain = ctx.createGain();
                osc.type = melType;
                osc.frequency.value = melody[i];
                var t = now + i * noteLen;
                noteGain.gain.setValueAtTime(0.25, t);
                noteGain.gain.exponentialRampToValueAtTime(0.001, t + noteLen * 0.9);
                osc.connect(noteGain);
                noteGain.connect(masterGain);
                osc.start(t);
                osc.stop(t + noteLen);
            }

            var bass = melDef.bass;
            var bassLen = loopLen / bass.length;
            for (var j = 0; j < bass.length; j++) {
                var bOsc = ctx.createOscillator();
                var bGain = ctx.createGain();
                bOsc.type = bassType;
                bOsc.frequency.value = bass[j];
                var bt = now + j * bassLen;
                bGain.gain.setValueAtTime(0.12, bt);
                bGain.gain.exponentialRampToValueAtTime(0.001, bt + bassLen * 0.8);
                bOsc.connect(bGain);
                bGain.connect(masterGain);
                bOsc.start(bt);
                bOsc.stop(bt + bassLen);
            }

            var harmony = melDef.harmony;
            if (harmony && harmony.length > 0) {
                var harmLen = loopLen / harmony.length;
                for (var h = 0; h < harmony.length; h++) {
                    var hOsc = ctx.createOscillator();
                    var hGain = ctx.createGain();
                    hOsc.type = 'sine';
                    hOsc.frequency.value = harmony[h];
                    var ht = now + h * harmLen;
                    hGain.gain.setValueAtTime(0.07, ht);
                    hGain.gain.exponentialRampToValueAtTime(0.001, ht + harmLen * 0.7);
                    hOsc.connect(hGain);
                    hGain.connect(masterGain);
                    hOsc.start(ht);
                    hOsc.stop(ht + harmLen);
                }
            }

            nextLoopStart += loopLen;
            var delay = (nextLoopStart - ctx.currentTime - 0.1) * 1000;
            self._musicTimeout = setTimeout(scheduleLoop, Math.max(0, delay));
        }

        scheduleLoop();
        this._musicNodes = { masterGain: masterGain };
    },

    startMusic: function(themeIndex) {
        if (!this.enabled || !this.ctx) return;
        var melIdx = 0;
        if (themeIndex !== undefined && themeIndex >= 0) {
            melIdx = this._themeMelodyMap[themeIndex % this._themeMelodyMap.length] || 0;
        }
        if (this.musicPlaying && this._currentMelodyIdx === melIdx) return;
        if (this.musicPlaying) this.stopMusic();
        this._resume();
        this._startMusicInternal(melIdx, 0.25);
    },

    stopMusic: function() {
        this.musicPlaying = false;
        if (this._musicTimeout) {
            clearTimeout(this._musicTimeout);
            this._musicTimeout = null;
        }
        if (this._musicNodes) {
            this._musicNodes.masterGain.gain.value = 0;
            this._musicNodes.masterGain.disconnect(); // освободить ресурсы
            this._musicNodes = null;
        }
    },

    // === ЗВУК ШАГОВ ===
    playStep: function(now) {
        if (!this.enabled || !this.ctx) return;
        if (now - this._stepTimer < this._stepInterval) return;
        this._stepTimer = now;

        try {
            this._resume();
            var ctx = this.ctx;
            // Мягкий шаг — короткий шум
            var dur = 0.06;
            var bufferSize = Math.floor(ctx.sampleRate * dur);
            var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            var data = buffer.getChannelData(0);
            for (var i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / bufferSize * 6) * 0.3;
            }
            var source = ctx.createBufferSource();
            source.buffer = buffer;
            // Фильтр — убрать высокие частоты
            var filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 800;
            var gain = ctx.createGain();
            gain.gain.value = 0.12;
            source.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            source.start();
        } catch(e) { /* audio error — не критично */ }
    },

    _playTone: function(freq, duration, type, volume) {
        if (!this.enabled || !this.ctx) return;
        this._resume();
        var osc = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.value = freq;
        var vol = volume || 0.15;
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },

    _playNotes: function(notes, type, volume) {
        if (!this.enabled || !this.ctx) return;
        this._resume();
        var self = this;
        var time = this.ctx.currentTime;
        var vol = volume || 0.12;
        for (var i = 0; i < notes.length; i++) {
            (function(note, t) {
                try {
                    var osc = self.ctx.createOscillator();
                    var gain = self.ctx.createGain();
                    osc.type = type || 'sine';
                    osc.frequency.value = note.freq;
                    gain.gain.setValueAtTime(vol, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + note.dur);
                    osc.connect(gain);
                    gain.connect(self.ctx.destination);
                    osc.start(t);
                    osc.stop(t + note.dur);
                } catch(e) { /* audio error — не критично */ }
            })(notes[i], time);
            time += notes[i].dur * 0.8;
        }
    },

    playPickup: function() {
        this._playNotes([
            { freq: 523, dur: 0.08 },
            { freq: 659, dur: 0.08 },
            { freq: 784, dur: 0.12 }
        ], 'sine', 0.1);
    },

    playDeposit: function() {
        this._playNotes([
            { freq: 523, dur: 0.1 },
            { freq: 659, dur: 0.1 },
            { freq: 784, dur: 0.1 },
            { freq: 1047, dur: 0.2 }
        ], 'sine', 0.12);
    },

    playExitOpen: function() {
        this._playNotes([
            { freq: 392, dur: 0.12 },
            { freq: 523, dur: 0.12 },
            { freq: 659, dur: 0.12 },
            { freq: 784, dur: 0.12 },
            { freq: 1047, dur: 0.25 }
        ], 'triangle', 0.1);
    },

    playLevelComplete: function() {
        this._playNotes([
            { freq: 523, dur: 0.1 },
            { freq: 659, dur: 0.1 },
            { freq: 784, dur: 0.1 },
            { freq: 1047, dur: 0.15 },
            { freq: 784, dur: 0.08 },
            { freq: 1047, dur: 0.3 }
        ], 'triangle', 0.15);
    },

    playGameOver: function() {
        this._playNotes([
            { freq: 392, dur: 0.2 },
            { freq: 349, dur: 0.2 },
            { freq: 330, dur: 0.2 },
            { freq: 262, dur: 0.4 }
        ], 'sawtooth', 0.08);
    },

    playCombo: function() {
        this._playNotes([
            { freq: 880, dur: 0.06 },
            { freq: 1047, dur: 0.06 },
            { freq: 1319, dur: 0.1 }
        ], 'sine', 0.1);
    },

    playFreeze: function() {
        if (!this.enabled || !this.ctx) return;
        this._resume();
        // Шум заморозки
        var dur = 0.3;
        var bufferSize = Math.floor(this.ctx.sampleRate * dur);
        var buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        var data = buffer.getChannelData(0);
        for (var i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / bufferSize * 5);
        }
        var source = this.ctx.createBufferSource();
        source.buffer = buffer;
        var gain = this.ctx.createGain();
        gain.gain.value = 0.08;
        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start();
    },

    playWater: function() {
        this._playNotes([
            { freq: 600, dur: 0.15 },
            { freq: 700, dur: 0.1 },
            { freq: 500, dur: 0.15 },
            { freq: 650, dur: 0.1 }
        ], 'sine', 0.06);
    },

    playVictory: function() {
        this._playNotes([
            { freq: 523, dur: 0.1 },
            { freq: 659, dur: 0.1 },
            { freq: 784, dur: 0.1 },
            { freq: 1047, dur: 0.15 },
            { freq: 784, dur: 0.08 },
            { freq: 1047, dur: 0.12 },
            { freq: 1319, dur: 0.15 },
            { freq: 1047, dur: 0.1 },
            { freq: 1175, dur: 0.1 },
            { freq: 1319, dur: 0.1 },
            { freq: 1568, dur: 0.25 },
            { freq: 1319, dur: 0.1 },
            { freq: 1568, dur: 0.35 }
        ], 'triangle', 0.15);
    }
};
