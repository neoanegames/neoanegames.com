/*
 * Neoane Games - Galeria de mídia do Forastero
 * - Palco principal com trailer (YouTube só carrega ao clicar) e screenshots
 * - Miniaturas clicáveis, setas, teclado e gesto de arrastar
 * - Lightbox em tela cheia para as screenshots
 */
(function () {
    'use strict';

    var gallery = document.getElementById('media-gallery');
    if (!gallery) return;

    var stage = gallery.querySelector('.stage-view');
    var thumbs = Array.prototype.slice.call(gallery.querySelectorAll('.thumb'));
    var btnPrev = gallery.querySelector('.stage-prev');
    var btnNext = gallery.querySelector('.stage-next');
    var btnFull = gallery.querySelector('.stage-full');
    var counter = gallery.querySelector('.stage-counter');
    var current = 0;

    var items = thumbs.map(function (t) {
        return {
            type: t.getAttribute('data-type'),
            src: t.getAttribute('data-src'),
            poster: t.getAttribute('data-poster') || '',
            alt: t.getAttribute('data-alt') || ''
        };
    });

    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function show(i) {
        current = (i + items.length) % items.length;
        var it = items[current];
        stage.innerHTML = '';

        if (it.type === 'video') {
            var facade = document.createElement('button');
            facade.className = 'video-facade';
            facade.type = 'button';
            facade.setAttribute('aria-label', 'Play trailer');
            facade.innerHTML =
                '<img src="' + it.poster + '" alt="' + it.alt + '">' +
                '<span class="play-btn"><i class="fa-solid fa-play"></i></span>' +
                '<span class="play-label" data-i18n="media-play">Play trailer</span>';
            facade.addEventListener('click', function () {
                stage.innerHTML = '<iframe src="' + it.src + '" title="Forastero trailer" ' +
                    'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" ' +
                    'referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
            });
            // Se a miniatura do YouTube falhar, usa um print do jogo
            var img = facade.querySelector('img');
            img.addEventListener('error', function () { img.src = it.fallback || 'assets/PRINT00.jpg'; }, { once: true });
            stage.appendChild(facade);
            btnFull.style.display = 'none';
            // Reaplica idioma ao texto novo
            if (typeof setLanguage === 'function') setLanguage(localStorage.getItem('neoane-lang') || 'en');
        } else {
            var im = document.createElement('img');
            im.src = it.src;
            im.alt = it.alt;
            im.className = 'stage-img';
            im.addEventListener('click', function () { openLightbox(current); });
            stage.appendChild(im);
            btnFull.style.display = '';
        }

        thumbs.forEach(function (t, idx) {
            var on = idx === current;
            t.classList.toggle('active', on);
            t.setAttribute('aria-current', on ? 'true' : 'false');
        });
        var active = thumbs[current];
        if (active && active.scrollIntoView) {
            var strip = active.parentNode;
            strip.scrollTo({ left: active.offsetLeft - strip.clientWidth / 2 + active.clientWidth / 2, behavior: 'smooth' });
        }
        counter.textContent = pad(current + 1) + ' / ' + pad(items.length);
    }

    thumbs.forEach(function (t, idx) { t.addEventListener('click', function () { show(idx); }); });
    btnPrev.addEventListener('click', function () { show(current - 1); });
    btnNext.addEventListener('click', function () { show(current + 1); });
    btnFull.addEventListener('click', function () { if (items[current].type === 'image') openLightbox(current); });

    // Gesto de arrastar no palco (celular)
    var startX = null;
    stage.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
        if (startX === null) return;
        var dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
        startX = null;
    });

    /* ---------------- Lightbox ---------------- */
    var lb = document.getElementById('lightbox');
    var lbImg = lb.querySelector('.lb-img');
    var lbCount = lb.querySelector('.lb-count');
    var imageIdx = [];
    items.forEach(function (it, i) { if (it.type === 'image') imageIdx.push(i); });
    var lbPos = 0;

    function lbShow(pos) {
        lbPos = (pos + imageIdx.length) % imageIdx.length;
        var it = items[imageIdx[lbPos]];
        lbImg.classList.add('swap');
        setTimeout(function () {
            lbImg.src = it.src;
            lbImg.alt = it.alt;
            lbImg.classList.remove('swap');
        }, 120);
        lbCount.textContent = pad(lbPos + 1) + ' / ' + pad(imageIdx.length);
    }
    function openLightbox(itemIndex) {
        lbPos = Math.max(0, imageIdx.indexOf(itemIndex));
        lbImg.src = items[imageIdx[lbPos]].src;
        lbImg.alt = items[imageIdx[lbPos]].alt;
        lbCount.textContent = pad(lbPos + 1) + ' / ' + pad(imageIdx.length);
        lb.classList.add('open');
        lb.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        lb.querySelector('.lb-close').focus();
    }
    function closeLightbox() {
        lb.classList.remove('open');
        lb.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        // Mantém o palco sincronizado com a última imagem vista
        show(imageIdx[lbPos]);
    }

    lb.querySelector('.lb-close').addEventListener('click', closeLightbox);
    lb.querySelector('.lb-prev').addEventListener('click', function () { lbShow(lbPos - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { lbShow(lbPos + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb-frame')) closeLightbox(); });

    var lbStartX = null;
    lb.addEventListener('touchstart', function (e) { lbStartX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
        if (lbStartX === null) return;
        var dx = e.changedTouches[0].clientX - lbStartX;
        if (Math.abs(dx) > 50) lbShow(lbPos + (dx < 0 ? 1 : -1));
        lbStartX = null;
    });

    document.addEventListener('keydown', function (e) {
        if (lb.classList.contains('open')) {
            if (e.key === 'Escape') closeLightbox();
            else if (e.key === 'ArrowLeft') lbShow(lbPos - 1);
            else if (e.key === 'ArrowRight') lbShow(lbPos + 1);
        }
    });

    show(0);
})();
