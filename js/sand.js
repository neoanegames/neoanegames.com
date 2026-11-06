/*
 * Neoane Games - Efeito de areia/vento (canvas)
 * Uso: <canvas class="sand-canvas" data-sand="1" data-tone="light|dark"></canvas>
 *  - data-sand: intensidade (0.3 = suave, 1 = padrão, 1.5 = tempestade)
 *  - data-tone: "light" (areia marrom, p/ fundos claros) ou "dark" (areia clara, p/ fundos escuros)
 * O efeito pausa quando a aba está oculta ou o hero sai da tela,
 * e respeita "reduzir movimento" do sistema do visitante.
 */
(function () {
    'use strict';

    var canvases = document.querySelectorAll('canvas.sand-canvas');
    if (!canvases.length) return;

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var PALETTES = {
        light: ['176,128,72', '205,160,100', '140,98,56', '224,184,128'],
        dark:  ['240,214,170', '226,190,130', '255,236,205', '210,170,110']
    };

    function SandField(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.intensity = parseFloat(canvas.getAttribute('data-sand')) || 1;
        this.palette = PALETTES[canvas.getAttribute('data-tone')] || PALETTES.light;
        this.particles = [];
        this.running = false;
        this.visible = true;
        this.last = 0;
        this.time = 0;
        this.resize = this.resize.bind(this);
        this.tick = this.tick.bind(this);
        this.resize();
        window.addEventListener('resize', this.resize);

        var self = this;
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
                self.visible = entries[0].isIntersecting;
                self.update();
            }, { threshold: 0 }).observe(canvas);
        }
        document.addEventListener('visibilitychange', function () { self.update(); });
        this.update();
    }

    SandField.prototype.resize = function () {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var rect = this.canvas.getBoundingClientRect();
        this.w = Math.max(1, rect.width);
        this.h = Math.max(1, rect.height);
        this.canvas.width = Math.round(this.w * dpr);
        this.canvas.height = Math.round(this.h * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        var count = Math.round(Math.min(420, Math.max(90, this.w / 3.4)) * this.intensity);
        if (window.innerWidth < 700) count = Math.round(count * 0.6);
        while (this.particles.length < count) this.particles.push(this.spawn(true));
        this.particles.length = count;
    };

    SandField.prototype.spawn = function (anywhere) {
        var depth = Math.random();                // 0 = longe, 1 = perto
        return {
            x: anywhere ? Math.random() * this.w : -20 - Math.random() * 120,
            y: Math.random() * this.h,
            depth: depth,
            size: 0.5 + depth * 1.4,
            speed: 0.5 + depth * 1.6,
            alpha: 0.15 + depth * 0.4,
            phase: Math.random() * Math.PI * 2,
            wobble: 0.3 + Math.random() * 1.2,
            color: this.palette[(Math.random() * this.palette.length) | 0]
        };
    };

    // Vento: base constante + ondas lentas + rajadas ocasionais
    SandField.prototype.wind = function () {
        var t = this.time;
        var base = 55;
        var swell = Math.sin(t * 0.00035) * 22 + Math.sin(t * 0.0011 + 1.7) * 12;
        var gustWave = Math.max(0, Math.sin(t * 0.00018 - 0.6));
        var gust = Math.pow(gustWave, 6) * 160;   // rajada forte de tempos em tempos
        return (base + swell + gust) * this.intensity;
    };

    SandField.prototype.update = function () {
        var shouldRun = this.visible && !document.hidden;
        if (shouldRun && !this.running) {
            this.running = true;
            this.last = performance.now();
            requestAnimationFrame(this.tick);
        } else if (!shouldRun) {
            this.running = false;
        }
    };

    SandField.prototype.tick = function (now) {
        if (!this.running) return;
        var dt = Math.min(0.05, (now - this.last) / 1000);
        this.last = now;
        this.time = now;

        var ctx = this.ctx, w = this.w, h = this.h;
        var wind = this.wind();
        ctx.clearRect(0, 0, w, h);

        for (var i = 0; i < this.particles.length; i++) {
            var p = this.particles[i];
            var vx = wind * p.speed;
            p.x += vx * dt;
            p.phase += dt * p.wobble;
            p.y += Math.sin(p.phase) * 14 * dt + (p.depth * 4) * dt;

            if (p.x > w + 30 || p.y > h + 10) {
                var np = this.spawn(false);
                np.y = Math.random() * h;
                this.particles[i] = p = np;
            }

            // Rastro proporcional à velocidade (dá sensação de vento)
            var streak = Math.min(16, vx * 0.022) * (0.3 + p.depth);
            ctx.strokeStyle = 'rgba(' + p.color + ',' + p.alpha.toFixed(3) + ')';
            ctx.lineWidth = p.size;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(p.x - streak, p.y - Math.sin(p.phase) * 0.6);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
        }
        requestAnimationFrame(this.tick);
    };

    canvases.forEach(function (c) {
        if (reduceMotion) {
            // Sem movimento: apenas deixa a imagem estática
            c.style.display = 'none';
            return;
        }
        new SandField(c);
    });
})();
