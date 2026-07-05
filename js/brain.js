(function () {
	var wrap = document.querySelector('.brain__wrapper');
	if (!wrap) return;
	var mq = window.matchMedia('(min-width: 768px)');

	var media = wrap.querySelector('.media');
	var brainImg = media && media.querySelector(':scope > img');
	var iconsWrap = media && media.querySelector('.icons__wrapper');
	var icons = iconsWrap ? Array.prototype.slice.call(iconsWrap.querySelectorAll('.icon')) : [];
	var cardTemplates = Array.prototype.slice.call(wrap.querySelectorAll('.mobile-cards .elem__card'));
	if (!media || !brainImg || !icons.length) return;

	var CHARS = '01<>/\\|=+*#%$&{}[]?:;.ABCDEFidox'.split('');
	var CELL = 15;
	var GREEN = '120,255,170';

	var fog = document.createElement('canvas');
	fog.className = 'brain-fog';
	fog.setAttribute('aria-hidden', 'true');
	media.insertBefore(fog, brainImg.nextSibling);
	var fctx = fog.getContext('2d');
	var canvas = document.createElement('canvas');
	canvas.className = 'brain-glyphs';
	canvas.setAttribute('aria-hidden', 'true');
	media.insertBefore(canvas, fog.nextSibling);
	var ctx = canvas.getContext('2d');

	var pop = document.createElement('div');
	pop.className = 'brain-cards-layer';
	media.appendChild(pop);

	var W = 0, H = 0, DPR = 1, COLS = 0, ROWS = 0, CELLX = CELL, CELLY = CELL;
	var cells = null;
	var ready = false;
	var raf = 0, last = 0, t = 0, inView = true;

	var mouse = { tx: -9999, ty: -9999, on: false };
	var msX = -9999, msY = -9999;
	var mouseStrength = 0, iconStrength = 0, iconTarget = 0;
	var MOUSE_R = 135;
	var ICON_R = 175;
	var iconHole = null;
	var openIdx = -1, openCard = null;

	var sampler = document.createElement('canvas');
	var sctx = sampler.getContext('2d');
	var veil = document.createElement('canvas');
	var vctx = veil.getContext('2d');
	var veilData = null;


	function build() {
		var r = brainImg.getBoundingClientRect();
		W = Math.round(r.width); H = Math.round(r.height);
		if (!W || !H) return;
		DPR = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
		var mr = media.getBoundingClientRect();
		canvas.style.width = r.width + 'px';
		canvas.style.height = r.height + 'px';
		canvas.style.left = (r.left - mr.left) + 'px';
		canvas.style.top = (r.top - mr.top) + 'px';
		fog.style.width = canvas.style.width;
		fog.style.height = canvas.style.height;
		fog.style.left = canvas.style.left;
		fog.style.top = canvas.style.top;

		var gw, gh, rgb;
		var inl = window.__BRAIN_RGB;
		if (inl) {
			gw = inl.w; gh = inl.h;
			var bin = atob(inl.b64);
			rgb = new Uint8Array(gw * gh * 3);
			for (var z = 0; z < rgb.length; z++) rgb[z] = bin.charCodeAt(z);
			// denser glyph grid: bilinear-upsample the baked colour grid so the
			// brain carries more, smaller letters
			var SC = 1.4;
			var gw2 = Math.round(gw * SC), gh2 = Math.round(gh * SC);
			var up = new Uint8Array(gw2 * gh2 * 3);
			for (var uy = 0; uy < gh2; uy++) {
				var fy = uy / SC, y0 = Math.min(gh - 1, fy | 0), y1 = Math.min(gh - 1, y0 + 1), wy = fy - y0;
				for (var ux = 0; ux < gw2; ux++) {
					var fx = ux / SC, x0 = Math.min(gw - 1, fx | 0), x1 = Math.min(gw - 1, x0 + 1), wx = fx - x0;
					for (var ch2 = 0; ch2 < 3; ch2++) {
						var v00 = rgb[(y0 * gw + x0) * 3 + ch2], v10 = rgb[(y0 * gw + x1) * 3 + ch2];
						var v01 = rgb[(y1 * gw + x0) * 3 + ch2], v11 = rgb[(y1 * gw + x1) * 3 + ch2];
						up[(uy * gw2 + ux) * 3 + ch2] = (v00 * (1 - wx) + v10 * wx) * (1 - wy) + (v01 * (1 - wx) + v11 * wx) * wy;
					}
				}
			}
			gw = gw2; gh = gh2; rgb = up;
		} else {
			gw = Math.ceil(W / CELL); gh = Math.ceil(H / CELL);
			sampler.width = gw; sampler.height = gh;
			try {
				sctx.drawImage(brainImg, 0, 0, gw, gh);
				var data = sctx.getImageData(0, 0, gw, gh).data;
				rgb = new Uint8Array(gw * gh * 3);
				for (var z2 = 0; z2 < gw * gh; z2++) { rgb[z2 * 3] = data[z2 * 4]; rgb[z2 * 3 + 1] = data[z2 * 4 + 1]; rgb[z2 * 3 + 2] = data[z2 * 4 + 2]; }
			} catch (e) { return; }
		}
		COLS = gw; ROWS = gh;
		CELLX = W / COLS; CELLY = H / ROWS;
		veil.width = COLS; veil.height = ROWS;
		veilData = vctx.createImageData(COLS, ROWS);
		fog.width = 96; fog.height = Math.max(24, Math.round(96 * ROWS / COLS));
		ctx.font = '700 ' + Math.round(Math.max(CELLX, CELLY)) + 'px ui-monospace, Menlo, Consolas, monospace';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		var out = [];
		var bottomCut = ROWS * 0.82;
		for (var j = 0; j < ROWS; j++) {
			if (j > bottomCut) break;
			for (var i = 0; i < COLS; i++) {
				var p = (j * COLS + i) * 3;
				var R = rgb[p], G = rgb[p + 1], B = rgb[p + 2];
				var lum = (R * 0.3 + G * 0.6 + B * 0.1) / 255;
				if (lum < 0.28) continue;
				var boost = 1.7;
				out.push({
					i: i, j: j,
					b: Math.min(1, (lum - 0.22) * 1.9),
					r: Math.min(255, Math.round(R * boost + 30)),
					g: Math.min(255, Math.round(G * boost + 70)),
					bl: Math.min(255, Math.round(B * boost + 30)),
					r0: R, g0: G, b0: B,
					seed: (i * 37 + j * 101 + i * j) % CHARS.length,
					ph: ((i * 13 + j * 29) % 100) / 100 * Math.PI * 2
				});
			}
		}
		cells = out;
		ready = true;
	}

	function holeAt(x, y, hx, hy, R, s) {
		if (s <= 0.01) return 1;
		var d = Math.hypot(x - hx, y - hy);
		var e;
		if (d >= R) e = 1;
		else if (d <= R * 0.55) e = 0;
		else { var u = (d - R * 0.55) / (R * 0.45); e = u * u * (3 - 2 * u); }
		return 1 - (1 - e) * s;
	}

	function frame(ts) {
		if (!inView || document.hidden) { raf = 0; return; }
		raf = requestAnimationFrame(frame);
		if (!ready) return;
		var dt = last ? Math.min(ts - last, 60) : 16;
		if (ts - last < 24) return;
		last = ts;
		t += dt * 0.001;

		if (mouse.on) {
			if (msX < -9000) { msX = mouse.tx; msY = mouse.ty; }
			msX += (mouse.tx - msX) * 0.22;
			msY += (mouse.ty - msY) * 0.22;
		}
		mouseStrength += ((mouse.on ? 1 : 0) - mouseStrength) * 0.12;
		iconStrength += (iconTarget - iconStrength) * 0.12;
		if (iconTarget === 0 && iconStrength < 0.02) iconHole = null;

		var useMouse = mouseStrength > 0.01;
		var n, c, x, y, hf;

		var vd = veilData.data;
		for (n = 0; n < cells.length; n++) {
			c = cells[n];
			x = c.i * CELLX + CELLX / 2;
			y = c.j * CELLY + CELLY / 2;
			hf = 1;
			if (useMouse) hf = holeAt(x, y, msX, msY, MOUSE_R, mouseStrength);
			if (iconHole && iconStrength > 0.01) hf = Math.min(hf, holeAt(x, y, iconHole.x, iconHole.y, ICON_R, iconStrength));
			c.hf = hf;
			var vi = (c.j * COLS + c.i) * 4;
			vd[vi] = c.r0; vd[vi + 1] = c.g0; vd[vi + 2] = c.b0;
			vd[vi + 3] = Math.round(Math.min(1, c.b * 1.1) * hf * 220);
		}
		vctx.putImageData(veilData, 0, 0);

		fctx.clearRect(0, 0, fog.width, fog.height);
		fctx.imageSmoothingEnabled = true;
		fctx.drawImage(veil, 0, 0, COLS, ROWS, 0, 0, fog.width, fog.height);
		ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
		ctx.clearRect(0, 0, W, H);

		ctx.shadowColor = 'rgba(0,255,150,0.9)';
		ctx.shadowBlur = 5;
		for (n = 0; n < cells.length; n++) {
			c = cells[n];
			hf = c.hf;
			if (hf <= 0.04) continue;
			x = c.i * CELLX + CELLX / 2;
			y = c.j * CELLY + CELLY / 2;
			var wave = 0.5 + 0.5 * Math.sin(t * 1.4 + c.ph + c.i * 0.18 + c.j * 0.12);
			var a = c.b * (0.62 + 0.38 * wave) * hf;
			if (a <= 0.04) continue;
			var ch = CHARS[(c.seed + ((t * 0.55 + c.ph) | 0)) % CHARS.length];
			ctx.fillStyle = 'rgba(' + c.r + ',' + c.g + ',' + c.bl + ',' + a.toFixed(3) + ')';
			ctx.fillText(ch, x, y);
		}
		ctx.shadowBlur = 0;
	}

	function start() { if (!raf && inView && !document.hidden) raf = requestAnimationFrame(frame); }
	function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

	media.addEventListener('mousemove', function (e) {
		var r = canvas.getBoundingClientRect();
		var sx = r.width ? W / r.width : 1;
		var sy = r.height ? H / r.height : 1;
		mouse.tx = (e.clientX - r.left) * sx;
		mouse.ty = (e.clientY - r.top) * sy;
		mouse.on = true;
	});
	media.addEventListener('mouseleave', function () { mouse.on = false; });

	function iconCanvasPos(icon) {
		var ir = icon.getBoundingClientRect();
		var cr = canvas.getBoundingClientRect();
		var sx = cr.width ? W / cr.width : 1;
		var sy = cr.height ? H / cr.height : 1;
		return {
			x: (ir.left + ir.width / 2 - cr.left) * sx,
			y: (ir.top + ir.height / 2 - cr.top) * sy
		};
	}

	function closeCard() {
		if (openCard) { openCard.classList.remove('show'); var oc = openCard; setTimeout(function () { if (oc.parentNode) oc.parentNode.removeChild(oc); }, 260); }
		openCard = null; openIdx = -1; iconTarget = 0;
		icons.forEach(function (ic) { ic.classList.remove('active'); });
	}

	function openCardFor(idx) {
		closeCard();
		var tpl = cardTemplates[idx];
		if (!tpl) return;
		var icon = icons[idx];
		var card = tpl.cloneNode(true);
		card.classList.add('brain-card');
		pop.appendChild(card);
		icon.classList.add('active');

		var mr = media.getBoundingClientRect();
		var ir = icon.getBoundingClientRect();
		var iconCX = ir.left + ir.width / 2 - mr.left;
		var iconCY = ir.top + ir.height / 2 - mr.top;
		var cardW = card.offsetWidth || 260;
		var cardH = card.offsetHeight || 120;
		var gap = 18;
		var left, top;
		if (iconCX < mr.width / 2) left = iconCX - ir.width / 2 - gap - cardW;
		else left = iconCX + ir.width / 2 + gap;
		top = iconCY - cardH / 2;
		left = Math.max(10, Math.min(left, mr.width - cardW - 10));
		top = Math.max(10, Math.min(top, mr.height - cardH - 10));
		card.style.left = left + 'px';
		card.style.top = top + 'px';

		iconHole = iconCanvasPos(icon);
		iconTarget = 1;
		openIdx = idx;
		openCard = card;
		requestAnimationFrame(function () { card.classList.add('show'); });
	}

	icons.forEach(function (icon, idx) {
		icon.style.cursor = 'pointer';
		icon.addEventListener('click', function (e) {
			e.stopPropagation();
			if (openIdx === idx) closeCard();
			else openCardFor(idx);
		});
	});
	document.addEventListener('click', function (e) {
		if (openIdx < 0) return;
		if (openCard && openCard.contains(e.target)) return;
		closeCard();
	});
	window.addEventListener('resize', function () {
		closeCard();
		clearTimeout(window.__brainRT);
		window.__brainRT = setTimeout(build, 150);
	});

	if ('IntersectionObserver' in window) {
		new IntersectionObserver(function (es) { inView = es[0].isIntersecting; if (inView) start(); else stop(); }, { rootMargin: '200px' }).observe(wrap);
	}

	function enable() {
		if (brainImg.complete) build(); else brainImg.addEventListener('load', build);
		window.addEventListener('load', build);
		start();
	}
	function disable() { stop(); closeCard(); ctx && ctx.clearRect(0, 0, canvas.width, canvas.height); fctx && fctx.clearRect(0, 0, fog.width, fog.height); }

	if (mq.matches) enable();
	(mq.addEventListener ? mq.addEventListener('change', onMq) : mq.addListener(onMq));
	function onMq() { if (mq.matches) enable(); else disable(); }
})();
