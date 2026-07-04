(function () {
	var box = document.querySelector('.hero__resources .bottom__float');
	if (!box) return;
	var canvas = box.querySelector('.rays-canvas');
	if (!canvas) return;
	var ctx = canvas.getContext('2d');
	if (!ctx) return;

	var DESIGN_W = 720, DESIGN_H = 230;

	var DESKTOP = [
		{ sel: '.work-flow-1', edge: 'right',  type: 'ortho', laneX: 276 },
		{ sel: '.work-flow-2', edge: 'right',  type: 'diag',  laneX: 318, bendY: 140 },
		{ sel: '.work-flow-3', edge: 'bottom', type: 'down',  laneX: 360 },
		{ sel: '.work-flow-4', edge: 'left',   type: 'diag',  laneX: 402, bendY: 140 },
		{ sel: '.work-flow-5', edge: 'left',   type: 'ortho', laneX: 444 }
	];

	var MOBILE = [
		{ sel: '.work-flow-1', side: 'left', lane: -2 },
		{ sel: '.work-flow-2', side: 'left', lane: -1 },
		{ sel: '.work-flow-3', side: 'top', lane: 0 },
		{ sel: '.work-flow-4', side: 'right', lane: 1 },
		{ sel: '.work-flow-5', side: 'right', lane: 2 }
	];

	var mq = window.matchMedia('(max-width: 767px)');
	var DUR = 3.2;
	var TRAIL = 0.34;

	var W = 0, H = 0, dpr = 1, paths = [], raf = 0;

	function buildPath(raw) {
		var pts = raw, seg = [], len = 0;
		for (var i = 1; i < pts.length; i++) {
			var a = pts[i - 1], b = pts[i];
			var d = Math.hypot(b.x - a.x, b.y - a.y);
			seg.push({ a: a, b: b, d: d, acc: len });
			len += d;
		}
		return { pts: pts, seg: seg, len: len || 1 };
	}

	function pointAt(p, dist) {
		var pts = p.pts;
		if (dist <= 0) return { x: pts[0].x, y: pts[0].y };
		if (dist >= p.len) { var e = pts[pts.length - 1]; return { x: e.x, y: e.y }; }
		for (var i = 0; i < p.seg.length; i++) {
			var s = p.seg[i];
			if (dist <= s.acc + s.d) {
				var t = (dist - s.acc) / s.d;
				return { x: s.a.x + (s.b.x - s.a.x) * t, y: s.a.y + (s.b.y - s.a.y) * t };
			}
		}
		var l = pts[pts.length - 1];
		return { x: l.x, y: l.y };
	}

	function layout() {
		var r = box.getBoundingClientRect();
		W = r.width; H = r.height;
		if (!W || !H) return;
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		canvas.width = Math.round(W * dpr);
		canvas.height = Math.round(H * dpr);

		paths = [];
		if (mq.matches) {
			var cx = W / 2;
			var exitY = H * 1.1;
			var step = Math.max(5, W * 0.018);
			MOBILE.forEach(function (m) {
				var el = box.querySelector(m.sel);
				if (!el) return;
				var er = el.getBoundingClientRect();
				var top = er.top - r.top, bottom = er.bottom - r.top;
				var left = er.left - r.left, right = er.right - r.left;
				var midY = (top + bottom) / 2;
				var laneX = cx + m.lane * step;
				var pts;
				if (m.side === 'top') {
					pts = [{ x: laneX, y: bottom }, { x: laneX, y: exitY }];
				} else if (m.side === 'left') {
					pts = [{ x: right, y: midY }, { x: laneX, y: midY }, { x: laneX, y: exitY }];
				} else {
					pts = [{ x: left, y: midY }, { x: laneX, y: midY }, { x: laneX, y: exitY }];
				}
				paths.push(buildPath(pts));
			});
		} else {
			var kx = W / DESIGN_W, ky = H / DESIGN_H;
			var dExitY = 300 * ky;
			DESKTOP.forEach(function (m) {
				var el = box.querySelector(m.sel);
				if (!el) return;
				var er = el.getBoundingClientRect();
				var top = er.top - r.top, bottom = er.bottom - r.top;
				var left = er.left - r.left, right = er.right - r.left;
				var midY = (top + bottom) / 2;
				var conn;
				if (m.edge === 'right') conn = { x: right, y: midY };
				else if (m.edge === 'left') conn = { x: left, y: midY };
				else conn = { x: (left + right) / 2, y: bottom };
				var laneX = m.laneX * kx;
				var pts;
				if (m.type === 'down') {
					pts = [conn, { x: conn.x, y: dExitY }];
				} else if (m.type === 'ortho') {
					pts = [conn, { x: laneX, y: conn.y }, { x: laneX, y: dExitY }];
				} else {
					pts = [conn, { x: laneX, y: m.bendY * ky }, { x: laneX, y: dExitY }];
				}
				paths.push(buildPath(pts));
			});
		}
	}

	function runner(p, a, b, lw) {
		if (b <= 0 || a >= p.len || b <= a) return;
		a = Math.max(0, a); b = Math.min(p.len, b);
		var from = pointAt(p, a);
		ctx.beginPath();
		ctx.moveTo(from.x, from.y);
		for (var i = 0; i < p.seg.length; i++) {
			var s = p.seg[i];
			var vEnd = s.acc + s.d;
			if (vEnd <= a) continue;
			if (vEnd >= b) break;
			ctx.lineTo(s.b.x, s.b.y);
		}
		var to = pointAt(p, b);
		ctx.lineTo(to.x, to.y);
		ctx.strokeStyle = '#00FF8A';
		ctx.lineWidth = lw * 1.3;
		ctx.stroke();
	}

	function draw(now) {
		raf = requestAnimationFrame(draw);
		if (!paths.length) return;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, W, H);
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';

		var lw = Math.max(1.2, W / 520);

		for (var i = 0; i < paths.length; i++) {
			var p = paths[i];
			ctx.beginPath();
			ctx.moveTo(p.pts[0].x, p.pts[0].y);
			for (var j = 1; j < p.pts.length; j++) ctx.lineTo(p.pts[j].x, p.pts[j].y);
			ctx.strokeStyle = 'rgba(255,255,255,0.42)';
			ctx.lineWidth = lw;
			ctx.stroke();
		}

		var t = (now / 1000 / DUR) % 1;
		for (var k = 0; k < paths.length; k++) {
			var pa = paths[k];
			var seg = pa.len * TRAIL;
			var head = t * (pa.len + seg);
			runner(pa, head - seg, head, lw);
		}
	}

	function start() {
		layout();
		cancelAnimationFrame(raf);
		raf = requestAnimationFrame(draw);
	}

	var rt = 0;
	window.addEventListener('resize', function () {
		clearTimeout(rt);
		rt = setTimeout(layout, 120);
	});
	if (mq.addEventListener) mq.addEventListener('change', layout);
	else if (mq.addListener) mq.addListener(layout);

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', start);
	} else {
		start();
	}

	window.__resourcesRays = {
		state: function () { return { W: W, H: H, mobile: mq.matches, paths: paths }; },
		ballsAt: function (now) {
			var t = (now / 1000 / DUR) % 1;
			return paths.map(function (p) {
				return pointAt(p, t * p.len);
			});
		}
	};
})();
