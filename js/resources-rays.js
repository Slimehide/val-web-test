/*
 * Resources hero rays.
 * White translucent lines fan out to the floating pills. A bright green ball
 * runs down each line trailing a fading green comet; when it slides off the
 * bottom the loop restarts. Everything is drawn on one canvas from a single
 * set of polylines, so the ball can never drift off its line.
 */
(function () {
	var box = document.querySelector('.hero__resources .bottom__float');
	if (!box) return;
	var canvas = box.querySelector('.rays-canvas');
	if (!canvas) return;
	var ctx = canvas.getContext('2d');
	if (!ctx) return;

	var DESIGN_W = 720, DESIGN_H = 230;

	// Desktop: bent circuit traces. The start point is read from the pill at
	// runtime (edge it faces), then the trace routes to a vertical lane and drops
	// off-screen. Reading the pill means the line always touches it — no gap —
	// whatever the pill's exact position. laneX/bendY are in 720x230 design space.
	var DESKTOP = [
		{ sel: '.work-flow-1', edge: 'right',  type: 'ortho', laneX: 276 },
		{ sel: '.work-flow-2', edge: 'right',  type: 'diag',  laneX: 318, bendY: 140 },
		{ sel: '.work-flow-3', edge: 'bottom', type: 'down',  laneX: 360 },
		{ sel: '.work-flow-4', edge: 'left',   type: 'diag',  laneX: 402, bendY: 140 },
		{ sel: '.work-flow-5', edge: 'left',   type: 'ortho', laneX: 444 }
	];

	// Mobile: a clean central spine. The top pill drops straight down it; the
	// side pills branch horizontally into it. Everything converges to a single
	// green ball at the centre-bottom. Geometry is read from the pills so it
	// always lines up.
	// lane = horizontal offset (in lane-steps) from centre, so the verticals run
	// as a tight bundle of parallel lines instead of merging into one trunk.
	var MOBILE = [
		{ sel: '.work-flow-1', side: 'left', lane: -2 },
		{ sel: '.work-flow-2', side: 'left', lane: -1 },
		{ sel: '.work-flow-3', side: 'top', lane: 0 },
		{ sel: '.work-flow-4', side: 'right', lane: 1 },
		{ sel: '.work-flow-5', side: 'right', lane: 2 }
	];

	var mq = window.matchMedia('(max-width: 767px)');
	var DUR = 3.2;     // seconds per loop
	var TRAIL = 0.34;  // tail length as a fraction of the path

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
			var exitY = H * 1.1;                           // off-screen bottom
			var step = Math.max(5, W * 0.018);             // lane spacing
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
			var dExitY = 300 * ky;                         // off-screen bottom
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
				else conn = { x: (left + right) / 2, y: bottom };   // bottom-centre
				var laneX = m.laneX * kx;
				var pts;
				if (m.type === 'down') {
					pts = [conn, { x: conn.x, y: dExitY }];
				} else if (m.type === 'ortho') {
					pts = [conn, { x: laneX, y: conn.y }, { x: laneX, y: dExitY }];
				} else {                                            // diag then drop
					pts = [conn, { x: laneX, y: m.bendY * ky }, { x: laneX, y: dExitY }];
				}
				paths.push(buildPath(pts));
			});
		}
	}

	function comet(p, head, tail, lw) {
		var STEP = 4, start = Math.max(0, head - tail);
		var prev = pointAt(p, head);
		for (var d = head - STEP; d > start; d -= STEP) {
			var cur = pointAt(p, d);
			var a = (d - start) / tail;               // 0 at tail end -> 1 at head
			ctx.beginPath();
			ctx.moveTo(prev.x, prev.y);
			ctx.lineTo(cur.x, cur.y);
			ctx.strokeStyle = 'rgba(0,255,138,' + (a * a * 0.9).toFixed(3) + ')';
			ctx.lineWidth = lw * (0.55 + a * 0.75);
			ctx.stroke();
			prev = cur;
		}
		// connect down to the exact tail end so there is no gap
		var endP = pointAt(p, start);
		ctx.beginPath();
		ctx.moveTo(prev.x, prev.y);
		ctx.lineTo(endP.x, endP.y);
		ctx.strokeStyle = 'rgba(0,255,138,0.02)';
		ctx.lineWidth = lw * 0.55;
		ctx.stroke();

		var b = pointAt(p, head);
		var g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, lw * 3.4);
		g.addColorStop(0, 'rgba(0,255,138,0.9)');
		g.addColorStop(1, 'rgba(0,255,138,0)');
		ctx.fillStyle = g;
		ctx.beginPath();
		ctx.arc(b.x, b.y, lw * 3.4, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#b7ffdc';
		ctx.beginPath();
		ctx.arc(b.x, b.y, lw * 1.05, 0, Math.PI * 2);
		ctx.fill();
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

		// All balls leave in sync: one shared phase, no per-line offset.
		var t = (now / 1000 / DUR) % 1;
		for (var k = 0; k < paths.length; k++) {
			var pa = paths[k];
			comet(pa, t * pa.len, TRAIL * pa.len, lw);
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

	// Lightweight introspection hook used by the test harness; harmless in prod.
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
