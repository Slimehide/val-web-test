$(document).ready(function(){

	if ($('.shorts-portfolio').length) {
		var $shorts = $('.shorts-portfolio .slider-shorts');
		function sizeShorts(){
			$shorts.css({ marginLeft: '', width: '' });
			var off = $shorts.offset().left;
			$shorts.css({ marginLeft: (-off) + 'px', width: window.innerWidth + 'px' });
			if ($shorts.hasClass('slick-initialized')) $shorts.slick('setPosition');
		}
		sizeShorts();
		$shorts.slick({
			variableWidth:true,
			centerMode:true,
			centerPadding:'0px',
			infinite:true,
			dots:true,
			swipe:true,
			swipeToSlide:false,
			touchThreshold:15,
			waitForAnimate:false,
			arrows:false,
			appendDots:$('.shorts-controls'),
			responsive: [
				{
					breakpoint: 991,
					settings: {
						variableWidth:true,
						centerMode:true,
						centerPadding:'0px'
					}
				}
			]
		});
		sizeShorts();
		$shorts.on('setPosition', function(){ });
		var shortsRT;
		$(window).on('resize', function(){
			clearTimeout(shortsRT);
			shortsRT = setTimeout(sizeShorts, 120);
		});

		(function(){
			var VIDS = ['video/ball.mp4','video/gradient.mp4','video/butterfly.mp4','video/atmosphere.mp4','video/speed.mp4','video/about-back.mp4'];
			var auto = true, advTimer = 0;
			var PAUSE_SVG = '<svg class="pause-ic" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="4" width="4.5" height="16" rx="2" fill="currentColor"/><rect x="13.5" y="4" width="4.5" height="16" rx="2" fill="currentColor"/></svg>';
			var SND_ON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 010 7M18.8 6a8 8 0 010 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
			var SND_OFF = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 9l6 6M22 9l-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

			$shorts.find('.inn').each(function(i){
				if (this.querySelector('video')) return;
				var media = this.querySelector('.media');
				if (!media) return;
				var v = document.createElement('video');
				v.dataset.src = VIDS[i % VIDS.length];
				v.muted = true;
				v.playsInline = true;
				v.setAttribute('playsinline', '');
				v.preload = 'none';
				v.className = 'shorts-video';
				media.appendChild(v);
				var bar = document.createElement('span');
				bar.className = 'vp-progress';
				bar.innerHTML = '<i></i>';
				this.appendChild(bar);
				var pb = this.querySelector('.play-btn');
				if (pb && !pb.querySelector('.pause-ic')) pb.insertAdjacentHTML('beforeend', PAUSE_SVG);
				var snd = document.createElement('button');
				snd.className = 'vc-sound';
				snd.type = 'button';
				snd.setAttribute('aria-label', 'toggle sound');
				snd.innerHTML = SND_ON;
				this.appendChild(snd);
			});

			function resetControls(){
				$shorts.find('.inn').removeClass('user-mode is-playing');
				$shorts.find('.vc-sound').each(function(){ this.innerHTML = SND_ON; });
			}
			function ensureSrc(v){
				if (v && !v.getAttribute('src') && v.dataset.src) v.setAttribute('src', v.dataset.src);
			}
			function stopAll(){
				clearTimeout(advTimer);
				$shorts.find('video.shorts-video').each(function(){
					this.ontimeupdate = null; this.onended = null;
					try {
						this.pause();
						this.muted = true;
						/* drop the media buffers of every parked clip — with 20+
						   <video> in the strip Chrome otherwise keeps a decoder
						   per element and the page slowly grinds down */
						if (this.getAttribute('src')){ this.removeAttribute('src'); this.load(); }
					} catch (e) {}
				});
				$shorts.find('.vp-progress>i').css('width', '0');
			}
			function bindProgress(v, bar){
				v.ontimeupdate = function(){
					if (bar && v.duration) bar.style.width = Math.min(100, v.currentTime / v.duration * 100) + '%';
				};
			}
			function next(){ clearTimeout(advTimer); $shorts.slick('slickNext'); }
			var pendingUser = -1;
			function userPlay(inn, v){
				inn.classList.add('user-mode');
				ensureSrc(v);
				try { v.currentTime = 0; } catch (err) {}
				v.muted = false;
				var snd = inn.querySelector('.vc-sound');
				if (snd) snd.innerHTML = SND_ON;
				bindProgress(v, inn.querySelector('.vp-progress>i'));
				v.onended = null;
				var p = v.play();
				if (p && p.catch) p.catch(function(){});
				inn.classList.add('is-playing');
			}
			function playCurrent(){
				stopAll();
				resetControls();
				var cur = $shorts.find('.slick-current .inn')[0];
				if (!cur) return;
				var v = cur.querySelector('video.shorts-video');
				var bar = cur.querySelector('.vp-progress>i');
				if (v && pendingUser === $shorts.slick('slickCurrentSlide')){
					pendingUser = -1;
					clearTimeout(advTimer);
					userPlay(cur, v);
					return;
				}
				pendingUser = -1;
				if (auto) advTimer = setTimeout(next, 12000);
				if (!v){ if (auto){ clearTimeout(advTimer); advTimer = setTimeout(next, 5000); } return; }
				ensureSrc(v);
				v.muted = true;
				var p = v.play();
				if (p && p.catch) p.catch(function(){});
				bindProgress(v, bar);
				v.onended = function(){ if (auto) next(); };
			}
			$shorts.on('afterChange', function(){ playCurrent(); });

			$shorts.on('click', '.play-btn', function(e){
				e.preventDefault();
				var inn = $(this).closest('.inn')[0];
				var v = inn && inn.querySelector('video.shorts-video');
				if (!v) return;
				auto = false;
				clearTimeout(advTimer);
				// clicking play on a side slide swipes it to the centre first
				// (and parks every other clip)
				var $slide = $(this).closest('.slick-slide');
				var rawIdx = parseInt($slide.attr('data-slick-index'), 10);
				if (!isNaN(rawIdx)){
					var count = $shorts.slick('getSlick').slideCount;
					var realIdx = ((rawIdx % count) + count) % count;
					if (realIdx !== $shorts.slick('slickCurrentSlide')){
						stopAll();
						resetControls();
						pendingUser = realIdx;
						$shorts.slick('slickGoTo', realIdx);
						return;
					}
				}
				if (!inn.classList.contains('user-mode')){
					clearTimeout(advTimer);
					userPlay(inn, v);
					return;
				}
				if (inn.classList.contains('is-playing')){
					v.pause();
					inn.classList.remove('is-playing');
				} else {
					ensureSrc(v);
					var p2 = v.play();
					if (p2 && p2.catch) p2.catch(function(){});
					inn.classList.add('is-playing');
				}
			});
			$shorts.on('click', '.vc-sound', function(e){
				e.preventDefault();
				e.stopPropagation();
				var inn = $(this).closest('.inn')[0];
				var v = inn && inn.querySelector('video.shorts-video');
				if (!v) return;
				v.muted = !v.muted;
				this.innerHTML = v.muted ? SND_OFF : SND_ON;
			});
			$shorts.on('click', '.vp-progress', function(e){
				var inn = $(this).closest('.inn')[0];
				var v = inn && inn.querySelector('video.shorts-video');
				if (!v || !v.duration) return;
				var r = this.getBoundingClientRect();
				var x = (e.clientX != null ? e.clientX : (e.originalEvent && e.originalEvent.touches ? e.originalEvent.touches[0].clientX : r.left)) - r.left;
				try { v.currentTime = Math.max(0, Math.min(1, x / r.width)) * v.duration; } catch (err) {}
			});
			var sliderVisible = true;
			if (window.IntersectionObserver){
				new IntersectionObserver(function(es){
					sliderVisible = es[0].isIntersecting;
					if (!sliderVisible){ clearTimeout(advTimer); $shorts.find('video.shorts-video').each(function(){ try{ this.pause(); }catch(e){} }); }
					else { playCurrent(); }
				}, { rootMargin: '60px' }).observe($('.shorts-portfolio')[0]);
			}
			setTimeout(function(){ if (sliderVisible) playCurrent(); }, 600);
		})();
	}

	$('.switcher__plans').each(function(){
		var $sw = $(this);
		$sw.on('click', 'a', function(e){
			e.preventDefault();
			var $a = $(this);
			if ($a.hasClass('current')) return;
			$sw.find('a').removeClass('current');
			$a.addClass('current');
			var mode = /annual/i.test($a.text()) ? 'annually' : 'monthly';
			var root = $sw.closest('.hero__plans, .outer__hero, body');
			root.find('[data-monthly][data-annually]').each(function(){
				var v = $(this).attr(mode === 'annually' ? 'data-annually' : 'data-monthly');
				if (v != null) $(this).text(v);
			});
		});
	});

	(function(){
		var cmp = document.querySelector('.compare__plans');
		if (!cmp) return;
		var bottom = cmp.querySelector('.bottom__part');
		var subs = bottom ? [].slice.call(bottom.querySelectorAll(':scope > .subtitle')) : [];
		if (subs.length < 2) return;
		var HEAD = 163;
		var bar = document.createElement('div');
		bar.className = 'compare-cat-fixed';
		bar.setAttribute('aria-hidden', 'true');
		bar.innerHTML = '<p></p>';
		var barP = bar.querySelector('p');
		cmp.appendChild(bar);
		var mq = window.matchMedia('(max-width: 767px)');
		var ticking = false, lastText = '';
		function update(){
			ticking = false;
			if (!mq.matches){ if (bar.style.display !== 'none') bar.style.display = 'none'; return; }
			var br = bottom.getBoundingClientRect();
			var cur = null;
			for (var i = 0; i < subs.length; i++){
				if (subs[i].getBoundingClientRect().top - HEAD <= 1) cur = subs[i];
			}
			if (cur && br.top < HEAD && br.bottom > HEAD + 30){
				var t = cur.querySelector('p') ? cur.querySelector('p').textContent : '';
				if (t !== lastText){ barP.textContent = t; lastText = t; }
				if (bar.style.display !== 'flex') bar.style.display = 'flex';
			} else if (bar.style.display !== 'none'){ bar.style.display = 'none'; }
		}
		function onScroll(){ if (!ticking){ ticking = true; requestAnimationFrame(update); } }
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		update();
	})();

	if ($('.hero__funnel').length) {
		$('.hero__funnel .outer__funnel>img').addClass('revealed');
		setTimeout(function(){
			$('.hero__funnel .desc').addClass('revealed');
		}, 550);
	}

	if ($('.ticker__tags').length) {
		$('.ticker__tags .ticker').each(function(index, elem){
			var ul = $(elem).find('ul');
			if (!ul.length || ul.data('marquee-ready')) return;
			var items = ul.children('li');
			if (!items.length) return;
			ul.data('marquee-ready', true);
			var ulEl = ul[0];
			ulEl.style.animation = 'none';
			var reverse = elem.classList.contains('reverse');
			var half = 0, x = 0, speed = 32, factor = 1, target = 1, raf = null, lastTs = 0, inV = true;
			function fill(){
				var kids = Array.prototype.slice.call(ulEl.children);
				var base = 0;
				for (var k = 0; k < items.length; k++) base += items[k].getBoundingClientRect().width + 15;
				if (!base) return;
				var need = Math.max(2, Math.ceil((window.innerWidth + 200) / base) + 1);
				var copies = Math.round(kids.length / items.length);
				for (var c = copies; c < need * 2; c++){
					for (var m = 0; m < items.length; m++) ulEl.appendChild(items[m].cloneNode(true));
				}
				half = 0;
				var all = ulEl.children;
				for (var q = 0; q < all.length / 2; q++) half += all[q].getBoundingClientRect().width + 15;
			}
			function tick(ts){
				raf = requestAnimationFrame(tick);
				if (!inV || document.hidden || !half) { lastTs = ts; return; }
				var dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 0.016;
				lastTs = ts;
				factor += (target - factor) * Math.min(1, dt * 5);
				x += speed * factor * dt;
				if (x >= half) x -= half;
				var tx = reverse ? (x - half) : -x;
				ulEl.style.transform = 'translate3d(' + tx.toFixed(2) + 'px,0,0)';
			}
			fill();
			var rT;
			window.addEventListener('resize', function(){ clearTimeout(rT); rT = setTimeout(fill, 200); });
			window.addEventListener('load', fill);
			elem.addEventListener('mouseenter', function(){ target = 0.18; });
			elem.addEventListener('mouseleave', function(){ target = 1; });
			if ('IntersectionObserver' in window){
				new IntersectionObserver(function(es){ inV = es[0].isIntersecting; }, { rootMargin: '80px' }).observe(elem);
			}
			raf = requestAnimationFrame(tick);
		});
	}

	if ($('.our__team--slider').length) {
		$('.team__inner--slider').css("width" ,"auto");
		$('.team__inner--slider').css("width" , $('.team__inner--slider').outerWidth() + $('.team__inner--slider').offset().left);

		$(window).on("resize" ,function(){
			$('.team__inner--slider').css("width" ,"auto");
			$('.team__inner--slider').css("width" , $('.team__inner--slider').outerWidth() + $('.team__inner--slider').offset().left);
		});
		$('.our__team--slider .team__inner--slider').slick({
			slidesToShow:1,
			variableWidth:true,
			arrows:false,
			swipe:true,
			swipeToSlide:true
		});
	}

	$('.faq__wrapper .content>.elem').on('click', function(e){
		e.preventDefault();
		if ($(this).hasClass('opened')) {
			$(this).removeClass('opened');
			$(this).find('.content-faq').slideUp(300);
		} else {
			$('.faq__wrapper .content>.elem').removeClass('opened');
			$('.faq__wrapper .content>.elem .content-faq').slideUp(300);
			$(this).addClass('opened');
			$(this).find('.content-faq').slideDown(300);
		}
	});

	(function(){
		var box = document.querySelector('.process__wrapper .circle__process');
		if (!box) return;
		var ring = box.querySelector('.proc-ring');
		var svg = box.querySelector('svg');
		var dots = Array.prototype.slice.call(box.querySelectorAll('.dot'));
		var nd = dots.length;
		if (!nd || !ring || !svg) return;

		var CX = 256, CY = 256, R = 254.5;
		var angles = [], ua = [];

		function measure(){
			var sr = svg.getBoundingClientRect();
			var cx = sr.x + sr.width / 2, cy = sr.y + sr.height / 2;
			angles = dots.map(function(d){
				var r = d.getBoundingClientRect();
				var x = r.x + r.width / 2 - cx, y = r.y + r.height / 2 - cy;
				var a = Math.atan2(x, -y) * 180 / Math.PI;
				return (a < 0) ? a + 360 : a;
			});
			ua = [angles[0]];
			for (var i = 1; i < nd; i++){
				var v = angles[i];
				while (v <= ua[i - 1]) v += 360;
				ua.push(v);
			}
			ua.push(angles[0] + 360);
		}
		function pt(a){
			var r = a * Math.PI / 180;
			return [CX + R * Math.sin(r), CY - R * Math.cos(r)];
		}
		function arc(a, b){
			if (b - a < 0.05) return '';
			var p0 = pt(a), p1 = pt(b), large = (b - a) > 180 ? 1 : 0;
			return 'M' + p0[0].toFixed(2) + ' ' + p0[1].toFixed(2) +
			       ' A' + R + ' ' + R + ' 0 ' + large + ' 1 ' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2);
		}

		var SEG = 1.5, HOLD = 0.55, ENDHOLD = 0.5, SWEEP = 0.9, FULL = 359.9;
		var startT = null, raf = null, inView = true;
		function ease(t){ return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2; }

		function tick(ts){
			if (!inView || document.hidden){ raf = null; return; }
			raf = requestAnimationFrame(tick);
			if (startT == null){ startT = ts; measure(); }
			var base = ua[0];
			var segTotal = nd * (SEG + HOLD);
			var CYCLE = segTotal + ENDHOLD + SWEEP;
			var elapsed = ((ts - startT) / 1000) % CYCLE;
			var head, tail = base;
			if (elapsed < segTotal){
				var k = Math.floor(elapsed / (SEG + HOLD));
				var t = elapsed - k * (SEG + HOLD);
				var from = ua[k], to = ua[Math.min(k + 1, ua.length - 1)];
				head = (t < SEG) ? from + (to - from) * ease(t / SEG) : to;
				if (head > base + FULL) head = base + FULL;
			} else if (elapsed < segTotal + ENDHOLD){
				head = base + FULL;
			} else {
				head = base + FULL;
				tail = base + ease((elapsed - segTotal - ENDHOLD) / SWEEP) * 360;
				if (tail > head) tail = head;
			}
			ring.setAttribute('d', arc(tail, head));
			for (var i = 0; i < nd; i++){
				dots[i].classList.toggle('active', ua[i] <= head + 0.5 && ua[i] >= tail - 0.5);
			}
		}
		function start(){ if (raf == null && inView && !document.hidden){ startT = null; raf = requestAnimationFrame(tick); } }
		if ('IntersectionObserver' in window){
			new IntersectionObserver(function(es){ inView = es[0].isIntersecting; if (inView) start(); }, { rootMargin: '120px' }).observe(box);
		}
		document.addEventListener('visibilitychange', start);
		window.addEventListener('resize', function(){ startT = null; });
		start();
	})();

	(function(){
		var wrap = document.querySelector('.avatar__wrapper');
		var media = wrap && wrap.querySelector('.avatar__media');
		if (!media) return;
		var floats = Array.prototype.slice.call(media.querySelectorAll('.avatar-float'));
		if (!floats.length) return;
		if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
			floats.forEach(function(f){ f.classList.add('revealed'); });
			return;
		}
		wrap.classList.add('av-pin');
		wrap.style.minHeight = (100 + floats.length * 45) + 'vh';
		var cont = wrap.querySelector(':scope > .container');
		var ell = wrap.querySelector(':scope > img');
		if (cont && ell){
			ell.classList.add('av-ellipse');
			cont.insertBefore(ell, cont.firstChild);
		}
		function update(){
			var r = wrap.getBoundingClientRect();
			var vh = window.innerHeight || 800;
			var scrollable = r.height - vh;
			var p = scrollable > 0 ? Math.min(1, Math.max(0, -r.top / scrollable)) : 1;
			// scrub, don't trigger: each float gets a 0..1 slice of the pin
			// scroll, so the reveal advances/rewinds with the scroll itself
			var seg = 1 / (floats.length + 0.7);
			for (var i = 0; i < floats.length; i++){
				var q = (p - (i + 0.15) * seg) / (seg * 0.85);
				if (q < 0) q = 0; else if (q > 1) q = 1;
				floats[i].style.setProperty('--rv', q.toFixed(3));
			}
		}
		var ticking = false;
		function onScroll(){ if (!ticking){ ticking = true; requestAnimationFrame(function(){ ticking = false; update(); }); } }
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		update();
	})();

	(function(){
		var topEl = document.querySelector('.compare__plans .top-absolute>.inner');
		var bottomEl = document.querySelector('.compare__plans .bottom__part');
		if (!topEl || !bottomEl) return;
		var lock = false;
		function mirror(src, dst){
			return function(){
				if (lock) return;
				lock = true;

				dst.scrollLeft = src.scrollLeft;
				lock = false;
			};
		}
		topEl.addEventListener('scroll', mirror(topEl, bottomEl), { passive: true });
		bottomEl.addEventListener('scroll', mirror(bottomEl, topEl), { passive: true });
	})();

	if ($('.reviews__hero .hero-fx .particles').length) {
		var canvas = $('.reviews__hero .hero-fx .particles')[0];
		var fx = $('.reviews__hero .hero-fx')[0];
		var ctx = canvas.getContext('2d');
		var particles = [];
		var W = 0, H = 0;

		function resizeParticles(){
			W = canvas.width = fx.offsetWidth;
			H = canvas.height = fx.offsetHeight;
			var count = Math.max(28, Math.min(70, Math.round(W * H / 26000)));
			particles = [];
			for (var i = 0; i < count; i++){
				particles.push({
					x: Math.random() * W,
					y: Math.random() * H,
					r: Math.random() * 1.8 + 0.6,
					vx: (Math.random() - 0.5) * 0.25,
					vy: -(Math.random() * 0.35 + 0.1),
					a: Math.random() * 0.5 + 0.15
				});
			}
		}

		function drawParticles(){
			ctx.clearRect(0, 0, W, H);
			for (var i = 0; i < particles.length; i++){
				var p = particles[i];
				p.x += p.vx;
				p.y += p.vy;
				p.a += (Math.random() - 0.5) * 0.02;
				if (p.a < 0.1) p.a = 0.1;
				if (p.a > 0.7) p.a = 0.7;
				if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
				if (p.x < -5) p.x = W + 5;
				if (p.x > W + 5) p.x = -5;

				ctx.beginPath();
				ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
				ctx.fillStyle = 'rgba(0,255,138,' + p.a + ')';
				ctx.fill();
			}
			requestAnimationFrame(drawParticles);
		}

		resizeParticles();
		$(window).on('resize', resizeParticles);
		requestAnimationFrame(drawParticles);
	}

	if ($('.single__review--wrapper .single__review--slider').length) {
		var $rWrap = $('.single__review--wrapper');
		var $rSlider = $rWrap.find('.single__review--slider');
		var $rSlides = $rSlider.find('.slide');
		var rCount = $rSlides.length;
		var rCurrent = 0;
		var rAnimating = false;
		var rTimer = null;

		var $rUp = $rWrap.find('.controls>a').eq(0);
		var $rDown = $rWrap.find('.controls>a').eq(1);

		function rRandDelay(){ return 5000 + Math.random() * 2000; }

		var SLIDER_CHROME = 42;
		var slideHeights = [];

		function rMeasure(){
			slideHeights = [];
			$rSlides.each(function(){ slideHeights.push(this.offsetHeight); });
		}
		function rApplyHeight(){

			$rSlider.css('height', (slideHeights[rCurrent] + SLIDER_CHROME) + 'px');
		}

		function rGo(target, dir){
			target = (target + rCount) % rCount;
			if (rAnimating || target === rCurrent) return;
			rAnimating = true;
			var $out = $rSlides.eq(rCurrent);
			var $in = $rSlides.eq(target);

			$in.css('transform', 'translateY(' + (dir > 0 ? 40 : -40) + 'px)').addClass('is-active');
			$in[0].offsetHeight;
			$in.css({ opacity: 1, transform: 'translateY(0)' });
			$out.removeClass('is-active').css({ opacity: 0, transform: 'translateY(' + (dir > 0 ? -40 : 40) + 'px)' });
			rCurrent = target;
			rApplyHeight();
			setTimeout(function(){ rAnimating = false; }, 700);
		}

		function rNext(){ rGo(rCurrent + 1, 1); }
		function rPrev(){ rGo(rCurrent - 1, -1); }

		var rVisible = true, rHover = false;
		function rStart(){ rStop(); if (rVisible && !rHover){ rTimer = setTimeout(function(){ rNext(); rStart(); }, rRandDelay()); } }
		function rStop(){ if (rTimer){ clearTimeout(rTimer); rTimer = null; } }

		$rSlides.removeClass('is-active').css({ opacity: '', transform: '' });
		$rSlides.eq(0).addClass('is-active').css({ opacity: 1, transform: 'translateY(0)' });

		$rDown.on('click', function(e){ e.preventDefault(); rNext(); rStart(); });
		$rUp.on('click', function(e){ e.preventDefault(); rPrev(); rStart(); });

		$rSlider.on('mouseenter', function(){ rHover = true; rStop(); })
		        .on('mouseleave', function(){ rHover = false; rStart(); });

		if ('IntersectionObserver' in window){
			var rIO = new IntersectionObserver(function(entries){
				var e = entries[0];
				var vh = window.innerHeight || document.documentElement.clientHeight;
				rVisible = e.isIntersecting &&
					(e.intersectionRatio >= 0.99 || e.boundingClientRect.height > vh);
				if (rVisible) rStart(); else rStop();
			}, { threshold: [0, 0.5, 0.99, 1] });
			rIO.observe($rWrap[0]);
		}

		rMeasure();
		rApplyHeight();
		rStart();

		$(window).on('load', function(){ rMeasure(); rApplyHeight(); });
		$(window).on('resize', function(){ rMeasure(); rApplyHeight(); });
	}

	(function(){
		var $header = $('header');
		var $outer = $header.find('.outer__header');
		if (!$header.length || !$outer.length) return;

		var $btn = $('<button class="menu-btn" type="button" aria-label="Toggle menu" aria-expanded="false"><span></span><span></span><span></span></button>');
		var $backdrop = $('<div class="nav-backdrop"></div>');
		$outer.append($btn);
		$header.append($backdrop);

		function closeNav(){
			$header.removeClass('nav-open');
			$('body').removeClass('nav-lock');
			$btn.attr('aria-expanded', 'false');

			$header.find('.menu>ul>li.open').removeClass('open')
				.children('.header__dropdown').stop(true, true).slideUp(200);
		}
		function toggleNav(){
			var open = !$header.hasClass('nav-open');
			$header.toggleClass('nav-open', open);
			$('body').toggleClass('nav-lock', open);
			$btn.attr('aria-expanded', open ? 'true' : 'false');
		}

		$btn.on('click', toggleNav);
		$backdrop.on('click', closeNav);

		$header.find('.menu>ul>li').each(function(){
			var $li = $(this);
			var $dd = $li.children('.header__dropdown');
			if (!$dd.length) return;
			$li.children('a').on('click', function(e){
				if (window.matchMedia('(max-width: 1200px)').matches){
					e.preventDefault();
					$li.toggleClass('open');
					$dd.stop(true, true).slideToggle(250);
				}
			});
		});

		$(window).on('resize', function(){
			if (window.innerWidth > 1200){
				closeNav();
				$header.find('.menu>ul>li').removeClass('open');
				$header.find('.header__dropdown').stop(true, true).css('display', '');
			}
		});
	})();

	if ($('.hero__contact .float').length) {
		var $cFloats = $('.hero__contact .float');
		var cHero = $('.hero__contact')[0];
		var pTX = 0, pTY = 0, pX = 0, pY = 0, pRAF = null;
		var pFine = window.matchMedia('(hover: hover) and (pointer: fine)');

		function pTick(){
			pX += (pTX - pX) * 0.08;
			pY += (pTY - pY) * 0.08;
			$cFloats.each(function(){
				var depth = $(this).hasClass('float-1') ? 1 : -1.7;
				this.style.translate = (pX * depth).toFixed(1) + 'px ' + (pY * depth).toFixed(1) + 'px';
			});
			if (Math.abs(pTX - pX) > 0.1 || Math.abs(pTY - pY) > 0.1){
				pRAF = requestAnimationFrame(pTick);
			} else { pRAF = null; }
		}
		function pKick(){ if (pRAF === null) pRAF = requestAnimationFrame(pTick); }

		$(cHero).on('mousemove', function(e){
			if (!pFine.matches) return;
			var r = cHero.getBoundingClientRect();
			pTX = ((e.clientX - r.left) / r.width - 0.5) * 42;
			pTY = ((e.clientY - r.top) / r.height - 0.5) * 42;
			pKick();
		}).on('mouseleave', function(){ pTX = 0; pTY = 0; pKick(); });

		function pReset(){
			if (!pFine.matches){
				pTX = pTY = pX = pY = 0;
				$cFloats.each(function(){ this.style.translate = ''; });
			}
		}
		if (pFine.addEventListener) pFine.addEventListener('change', pReset);
		else if (pFine.addListener) pFine.addListener(pReset);
	}

	function initAsciiBg(canvas, opts){
		var host = canvas.parentNode;
		var ctx = canvas.getContext('2d');
		var CELL = opts.cell || 16;
		var COLOR = opts.color || '120,255,180';
		var place = opts.place || 'cover-bottom';

		var FLOOR = (opts.floor != null) ? opts.floor : 0.35;
		var GAIN = (opts.gain != null) ? opts.gain : 0.5;
		var CONTRAST = opts.contrast || 1;

		var TW = (opts.twinkle != null) ? opts.twinkle : 0.22;

		var STEADY = !!opts.steadyBright;
		var DOTSCALE = (opts.dotScale != null) ? opts.dotScale : 1;
		var W = 0, H = 0, COLS = 0, ROWS = 0;
		var t = 0;
		var TMX = -9999, TMY = -9999, MX = -9999, MY = -9999;
		var base = null, phase = null;
		var inView = true, rafId = null;
		var fine = window.matchMedia('(hover: hover) and (pointer: fine)');

		var parsed = null, pdots = null;

		var img = new Image();
		var ready = false;
		img.onload = function(){ ready = true; resize(); };
		if (opts.src) img.src = opts.src;

		function num(s, k){ var mm = new RegExp(k + '="([\\d.\\-]+)"').exec(s); return mm ? parseFloat(mm[1]) : null; }
		function parseSvgDots(txt){
			var vb = /viewBox="([\d.\-]+)\s+([\d.\-]+)\s+([\d.\-]+)\s+([\d.\-]+)"/.exec(txt);
			var vw = vb ? parseFloat(vb[3]) : (img.naturalWidth || 1410);
			var vh = vb ? parseFloat(vb[4]) : (img.naturalHeight || 633);
			var dots = [], re = /<circle\b([^>]*)>/g, m;
			while ((m = re.exec(txt))){
				var a = m[1], cx = num(a, 'cx') || 0, cy = num(a, 'cy') || 0, rr = num(a, 'r');
				if (rr == null) continue;
				var op = num(a, 'fill-opacity'); if (op == null) op = 1;
				var x = cx, y = cy, rad = rr;
				var tm = /transform="matrix\(([^)]+)\)"/.exec(a);
				if (tm){
					var p = tm[1].split(/[\s,]+/).map(parseFloat);
					x = p[0] * cx + p[2] * cy + p[4];
					y = p[1] * cx + p[3] * cy + p[5];
					rad = rr * (Math.hypot(p[0], p[1]) + Math.hypot(p[2], p[3])) / 2;
				}
				dots.push({ x: x, y: y, r: rad, op: op });
			}
			return dots.length ? { vw: vw, vh: vh, dots: dots } : null;
		}
		if (opts.svgDots){
			var inl = window.__SVG_DOTS && window.__SVG_DOTS[opts.src];
			if (inl){
				parsed = { vw: inl.vw, vh: inl.vh, dots: inl.dots.map(function (d){ return { x: d[0], y: d[1], r: d[2], op: d[3] }; }) };
			} else if (window.fetch){
				fetch(opts.src).then(function(r){ return r.text(); }).then(function(txt){
					parsed = parseSvgDots(txt);
					if (parsed){ W = 0; H = 0; resize(); start(); }
				}).catch(function(){});
			}
		}

		function placement(iw, ih){
			if (place === 'auto-topleft'){
				return { dx: 0, dy: 0, dw: iw, dh: ih };
			}
			if (place === 'auto-center'){
				return { dx: (W - iw) / 2, dy: (H - ih) / 2, dw: iw, dh: ih };
			}
			if (place === 'auto-topright'){
				return { dx: W - iw, dy: 0, dw: iw, dh: ih };
			}
			if (place === 'fit-topright'){

				var fs = Math.min(W / iw, H / ih);
				var fw = iw * fs, fh = ih * fs;
				return { dx: W - fw, dy: 0, dw: fw, dh: fh };
			}
			if (place === 'fit-bottomleft'){
				var bls = Math.min(W / iw, H / ih);
				var blw = iw * bls, blh = ih * bls;
				return { dx: 0, dy: H - blh, dw: blw, dh: blh };
			}
			if (place === 'fit-center'){
				var fcs = Math.min(W / iw, H / ih);
				var fcw = iw * fcs, fch = ih * fcs;
				return { dx: (W - fcw) / 2, dy: (H - fch) / 2, dw: fcw, dh: fch };
			}
			var scale = Math.max(W / iw, H / ih);
			var dw = iw * scale, dh = ih * scale;
			return { dx: (W - dw) / 2, dy: H - dh, dw: dw, dh: dh };
		}

		function trySVG(){
			if (!ready) return false;
			try {
				var off = document.createElement('canvas');
				off.width = W;
				off.height = H;
				var octx = off.getContext('2d');
				var iw = img.naturalWidth || 1440, ih = img.naturalHeight || 855;
				var p = placement(iw, ih);
				octx.drawImage(img, p.dx, p.dy, p.dw, p.dh);
				var data = octx.getImageData(0, 0, W, H).data;
				var b = new Float32Array(COLS * ROWS);
				var ph = new Float32Array(COLS * ROWS);
				var lit = 0;
				for (var j = 0; j < ROWS; j++){
					for (var i = 0; i < COLS; i++){
						var x0 = i * CELL, y0 = j * CELL, mx = 0;
						for (var sy = 0; sy < CELL; sy += 2){
							var yy = y0 + sy;
							if (yy >= H) break;
							var rowOff = yy * W;
							for (var sx = 0; sx < CELL; sx += 2){
								var xx = x0 + sx;
								if (xx >= W) break;
								var idx = (rowOff + xx) * 4;
								var lum = Math.max(data[idx], data[idx + 1], data[idx + 2]) / 255;
								var val = lum * (data[idx + 3] / 255);
								if (val > mx) mx = val;
							}
						}
						var k = j * COLS + i;
						var v = Math.min(1, mx * 1.8);
						b[k] = v;
						ph[k] = Math.random() * Math.PI * 2;
						if (v > 0.1) lit++;
					}
				}
				if (lit < COLS * ROWS * 0.01) return false;
				base = b; phase = ph;
				return true;
			} catch (err) {
				return false;
			}
		}

		function buildProcedural(){
			var isTR = (place === 'auto-topright' || place === 'fit-topright');
			var cx = (place === 'auto-topleft') ? 0 : isTR ? W : W / 2;
			var cy = (place === 'auto-topleft' || isTR) ? 0 : (place === 'auto-center') ? H / 2 : H;
			var R = (place === 'auto-center') ? Math.max(W, H) / 2
				: (place === 'auto-topleft' || isTR) ? Math.max(W, H) : 450 * Math.max(W / 1440, H / 855);
			base = new Float32Array(COLS * ROWS);
			phase = new Float32Array(COLS * ROWS);
			for (var j = 0; j < ROWS; j++){
				for (var i = 0; i < COLS; i++){
					var k = j * COLS + i;
					if ((i & 1) || (j & 1)){ base[k] = 0; continue; }
					var x = i * CELL + CELL / 2, y = j * CELL + CELL / 2;
					var dx = x - cx, dy = y - cy;
					var nd = Math.sqrt(dx * dx + dy * dy) / R;
					if (nd > 1){ base[k] = 0; continue; }
					base[k] = 0.5 + 0.5 * (1 - nd);
					phase[k] = Math.random() * Math.PI * 2;
				}
			}
		}

		function buildParsed(){
			var S = W / parsed.vw;
			pdots = parsed.dots.map(function(d){
				return {
					x: d.x * S,
					y: H - (parsed.vh - d.y) * S,
					r: Math.max(0.6, d.r * S * DOTSCALE),
					op: d.op,
					ph: Math.random() * Math.PI * 2
				};
			});
		}

		function buildFill(){
			base = new Float32Array(COLS * ROWS);
			phase = new Float32Array(COLS * ROWS);
			for (var k = 0; k < COLS * ROWS; k++){
				base[k] = 0.3 + 0.7 * Math.random();
				phase[k] = Math.random() * Math.PI * 2;
			}
		}
		function buildDisc(){
			base = new Float32Array(COLS * ROWS);
			phase = new Float32Array(COLS * ROWS);
			var dcx = W / 2, dcy = H / 2, R = Math.min(W, H) / 2 - CELL * 0.35;
			for (var j = 0; j < ROWS; j++){
				for (var i = 0; i < COLS; i++){
					var x = i * CELL + CELL / 2;
					var y = j * CELL + CELL / 2;
					if (Math.hypot(x - dcx, y - dcy) > R) continue;
					var k = j * COLS + i;
					base[k] = 0.45 + 0.55 * Math.random();
					phase[k] = Math.random() * Math.PI * 2;
				}
			}
		}
		function resize(){
			if ((base || pdots) && W === host.offsetWidth && H === host.offsetHeight) return;
			W = host.offsetWidth;
			H = host.offsetHeight;
			canvas.width = W;
			canvas.height = H;
			COLS = Math.ceil(W / CELL);
			ROWS = Math.ceil(H / CELL);
			ctx.font = CELL + 'px ui-monospace, Menlo, Consolas, monospace';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			if (opts.fill){ buildFill(); return; }
			if (opts.disc){ buildDisc(); return; }
			if (parsed){ buildParsed(); return; }
			if (!trySVG()) buildProcedural();
		}

		var pHost = opts.pointerHost || host;
		$(pHost).on('mousemove', function(e){
			if (!fine.matches) return;
			var r = host.getBoundingClientRect();
			var sx = host.offsetWidth ? (r.width / host.offsetWidth) : 1;
			var sy = host.offsetHeight ? (r.height / host.offsetHeight) : 1;
			TMX = (e.clientX - r.left) / (sx || 1);
			TMY = (e.clientY - r.top) / (sy || 1);
		}).on('mouseleave', function(){ TMX = -9999; TMY = -9999; });

		function frame(){
			if (!inView || document.hidden){ rafId = null; return; }
			rafId = requestAnimationFrame(frame);
			t += 0.05;

			if (pdots){
				if (TMX > -9000){
					MX = (MX < -9000) ? TMX : MX + (TMX - MX) * 0.35;
					MY = (MY < -9000) ? TMY : MY + (TMY - MY) * 0.35;
				} else { MX = -9999; MY = -9999; }
				var pHas = MX > -9000;
				ctx.clearRect(0, 0, W, H);
				for (var pi = 0; pi < pdots.length; pi++){
					var pd = pdots[pi];
					var pv = pd.op * ((1 - TW) + TW * Math.sin(t + pd.ph));
					var pox = 0, poy = 0, pr = pd.r;
					if (pHas){
						var pdx = pd.x - MX, pdy = pd.y - MY;
						var pd2 = pdx * pdx + pdy * pdy;
						var pinf = Math.exp(-pd2 / 6000);
						pv += 0.7 * pinf;
						var pmd = Math.sqrt(pd2) || 1;
						var ppush = 14 * pinf;
						pox = (pdx / pmd) * ppush;
						poy = (pdy / pmd) * ppush;
						pr = pd.r * (1 + 0.6 * pinf);
					}
					if (pv <= 0.02) continue;
					if (pv > 1) pv = 1;
					ctx.beginPath();
					ctx.arc(pd.x + pox, pd.y + poy, pr, 0, Math.PI * 2);
					ctx.fillStyle = 'rgba(' + COLOR + ',' + (FLOOR + pv * GAIN).toFixed(3) + ')';
					ctx.fill();
				}
				return;
			}

			if (!base) return;

			if (TMX > -9000){

				MX = (MX < -9000) ? TMX : MX + (TMX - MX) * 0.35;
				MY = (MY < -9000) ? TMY : MY + (TMY - MY) * 0.35;
			} else { MX = -9999; MY = -9999; }
			var hasM = MX > -9000;

			ctx.clearRect(0, 0, W, H);
			for (var j = 0; j < ROWS; j++){
				for (var i = 0; i < COLS; i++){
					var k = j * COLS + i;
					var bv = base[k];
					if (bv < 0.06) continue;
					var x = i * CELL + CELL / 2;
					var y = j * CELL + CELL / 2;
					var tw = STEADY ? TW * (1 - bv) : TW;
					var v = bv * ((1 - tw) + tw * Math.sin(t + phase[k]));

					var ox = 0, oy = 0;
					if (hasM){
						var mdx = x - MX, mdy = y - MY;
						var md2 = mdx * mdx + mdy * mdy;
						var infl = Math.exp(-md2 / 6000);
						v += 0.7 * infl;
						var md = Math.sqrt(md2) || 1;
						var push = 14 * infl;
						ox = (mdx / md) * push;
						oy = (mdy / md) * push;
					}

					if (v <= 0.06) continue;
					if (v > 1) v = 1;

					var vc = (CONTRAST !== 1) ? Math.pow(v, CONTRAST) : v;

					var r = (CELL * 0.18 * DOTSCALE) * (0.55 + vc * 0.9);
					ctx.beginPath();
					ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
					ctx.fillStyle = 'rgba(' + COLOR + ',' + (FLOOR + vc * GAIN).toFixed(3) + ')';
					ctx.fill();
				}
			}
		}

		resize();
		/* rebuilding the field re-rasterises the SVG + getImageData — far too
		   heavy to run on every resize event, so coalesce the bursts */
		var rzT = null;
		function queueResize(){ clearTimeout(rzT); rzT = setTimeout(resize, 150); }
		$(window).on('resize', queueResize);
		$(window).on('load', resize);
		if ('ResizeObserver' in window){ new ResizeObserver(queueResize).observe(host); }

		function start(){ if (rafId == null && inView && !document.hidden) rafId = requestAnimationFrame(frame); }
		if ('IntersectionObserver' in window){
			new IntersectionObserver(function(es){ inView = es[0].isIntersecting; start(); }, { rootMargin: '200px' }).observe(host);
		}
		document.addEventListener('visibilitychange', start);
		start();
	}

	if ($('.hero__contact .ascii-qr').length){
		initAsciiBg($('.hero__contact .ascii-qr')[0], { src: 'img/gr.svg', place: 'cover-bottom' });
	}
	if ($('.hero__contact .ascii-contact').length){
		initAsciiBg($('.hero__contact .ascii-contact')[0], {
			src: 'img/contact-svg.svg', place: 'cover-bottom',
			color: '255,255,255', cell: 24, floor: 0.16, gain: 0.5, twinkle: 0.3,
			pointerHost: document.querySelector('.hero__contact')
		});
	}
	if ($('.team__hero .ascii-team').length){
		initAsciiBg($('.team__hero .ascii-team')[0], { src: 'img/team-back.svg', place: 'auto-topleft' });
	}
	if ($('.reviews__wrapper .ascii-dots').length){
		initAsciiBg($('.reviews__wrapper .ascii-dots')[0], { src: 'img/reviews-dots.svg', place: 'auto-center' });
	}
	if ($('.features .ascii-features').length){
		initAsciiBg($('.features .ascii-features')[0], {
			src: 'img/dots-features.svg', place: 'auto-center',
			pointerHost: document.querySelector('.features')
		});
	}

	(function(){
		var wrap = document.querySelector('.integrations__wrapper');
		if (!wrap) return;
		var host = wrap.querySelector('.circle-integration');
		var orbit = wrap.querySelector('.orbit');
		var box = wrap.querySelector('.outlined-box');
		var valiant = wrap.querySelector('.valiant-icon');
		if (!host || !orbit || !box) return;

		var SRC = 9;
		var N = 12;
		var R = 268;
		var DOCK = 180;   // recalibrated to the pill slot by measureSlot()
		var nodes = [];
		for (var i = 0; i < N; i++){
			var nd = document.createElement('div');
			nd.className = 'orbit-node';
			var im = document.createElement('img');
			im.src = 'img/integration-logo-' + (i % SRC) + '.svg';
			nd.appendChild(im);
			orbit.appendChild(nd);
			nodes.push(nd);
		}
		var STEP = 360 / N;
		var rot = 0, inView = false, timer = null;

		function norm(a){ return ((a % 360) + 360) % 360; }
		// the pill sits in normal flow, so measure where its right slot
		// actually is and park the docked ball exactly in it
		var slot = null;
		function measureSlot(){
			var bb = box.getBoundingClientRect();
			if (!bb.width || !nodes.length){ slot = null; return; }
			// ancestors may flip/scale the orbit — derive the local->viewport
			// matrix empirically with probe transforms, then invert it
			var probe = nodes[0];
			var keepTr = probe.style.transform;
			probe.style.transition = 'none';
			probe.style.transform = 'translate(0px,0px)';
			var r0 = probe.getBoundingClientRect();
			probe.style.transform = 'translate(100px,0px)';
			var rx = probe.getBoundingClientRect();
			probe.style.transform = 'translate(0px,100px)';
			var ry = probe.getBoundingClientRect();
			probe.style.transform = keepTr;
			void probe.offsetWidth;
			probe.style.transition = '';
			var m00 = (rx.left - r0.left) / 100, m10 = (rx.top - r0.top) / 100;
			var m01 = (ry.left - r0.left) / 100, m11 = (ry.top - r0.top) / 100;
			var det = m00 * m11 - m01 * m10;
			if (!det){ slot = null; return; }
			var sx = (bb.right - bb.height / 2) - (r0.left + r0.width / 2);
			var sy = (bb.top + bb.height / 2) - (r0.top + r0.height / 2);
			slot = { x: (m11 * sx - m01 * sy) / det, y: (m00 * sy - m10 * sx) / det };
			DOCK = Math.round(norm(Math.atan2(slot.y, slot.x) * 180 / Math.PI) / STEP) * STEP;
		}
		function render(){
			for (var i = 0; i < N; i++){
				var a = i * STEP + rot;
				var d = Math.abs(((norm(a - DOCK) + 180) % 360) - 180);
				var docked = d < STEP / 2;
				if (docked && slot){
					nodes[i].style.transform = 'translate(' + slot.x.toFixed(1) + 'px,' + slot.y.toFixed(1) + 'px) scale(1.5)';
				} else {
					var sc = 1 + 0.18 * Math.pow(1 - d / 180, 3);
					nodes[i].style.transform = 'rotate(' + a + 'deg) translate(' + R + 'px) rotate(' + (-a) + 'deg) scale(' + sc.toFixed(3) + ')';
				}
				nodes[i].classList.toggle('docked', docked);
			}
		}
		function placeBox(){
			box.style.margin = '0';
			var pp = box.offsetParent || host.offsetParent;
			var hb = host.getBoundingClientRect();
			var pb = pp.getBoundingClientRect();
			var ob = orbit.getBoundingClientRect();
			var ocx = ob.left - pb.left + ob.width / 2;
			var ocy = ob.top - pb.top + ob.height / 2;
			var dx = ocx + R * Math.cos(DOCK * Math.PI / 180);
			var dy = ocy + R * Math.sin(DOCK * Math.PI / 180);
			var bw = box.offsetWidth, bh = box.offsetHeight;
			var left = dx - bw + bh / 2;
			var maxLeft = pb.width - bw - 6;
			if (left < 6) left = 6; else if (left > maxLeft) left = maxLeft;
			box.style.left = Math.round(left) + 'px';
			box.style.top = Math.round(dy - bh / 2) + 'px';
		}
		function tick(){
			if (!inView || document.hidden) return;
			rot -= STEP;
			render();
			if (valiant){ valiant.classList.remove('pulse'); void valiant.offsetWidth; valiant.classList.add('pulse'); }
		}
		measureSlot();
		render();
		placeBox();
		function relayout(){ placeBox(); measureSlot(); render(); }
		window.addEventListener('resize', relayout);
		window.addEventListener('load', relayout);
		if ('IntersectionObserver' in window){
			new IntersectionObserver(function(es){ inView = es[0].isIntersecting; }, { rootMargin: '0px' }).observe(wrap);
		} else { inView = true; }
		timer = setInterval(tick, 2800);
	})();
	if ($('.case__hero .ascii-dots').length){
		initAsciiBg($('.case__hero .ascii-dots')[0], { src: 'img/case-back.svg', place: 'auto-topleft' });
	}
	if ($('.more__case--studies .ascii-dots').length){
		initAsciiBg($('.more__case--studies .ascii-dots')[0], { src: 'img/case-back.svg', place: 'auto-topleft' });
	}
	if ($('.voyage__wrapper .ascii-dots').length){
		initAsciiBg($('.voyage__wrapper .ascii-dots')[0], {
			src: 'img/voyage-dots.svg', svgDots: true,
			color: '255,255,255', floor: 0, gain: 1,
			pointerHost: document.querySelector('.voyage__wrapper')
		});
	}
	if ($('.hero__analytics .dots-analytics .ascii-dots').length){
		initAsciiBg($('.hero__analytics .dots-analytics .ascii-dots')[0], {
			src: 'img/analytic-dots.svg', svgDots: true,
			color: '255,255,255', floor: 0, gain: 1,
			pointerHost: document.querySelector('.hero__analytics')
		});
	}
	if ($('.how__works--graph .inner>.right .dots canvas').length){
		initAsciiBg($('.how__works--graph .inner>.right .dots canvas')[0], {
			src: 'img/dots-how-works.svg', svgDots: true,
			color: '255,255,255', floor: 0, gain: 1,
			pointerHost: document.querySelector('.how__works--graph')
		});
	}
	if ($('.our__team--slider .ascii-dots').length){
		initAsciiBg($('.our__team--slider .ascii-dots')[0], { src: 'img/team-ellipses.svg', place: 'fit-topright' });
	}
	if ($('.our__values .values-dots canvas').length){
		initAsciiBg($('.our__values .values-dots canvas')[0], {
			src: 'img/values-dots.svg', place: 'fit-topright',
			pointerHost: document.querySelector('.our__values')
		});
	}
	if ($('.our__team--slider .team-dots canvas').length){
		initAsciiBg($('.our__team--slider .team-dots canvas')[0], {
			src: 'img/team-dots-back.svg', svgDots: true,
			color: '255,255,255', floor: 0, gain: 1,
			pointerHost: document.querySelector('.our__team--slider')
		});
	}
	if ($('.workflows__wrapper .dots-corner canvas').length){
		initAsciiBg($('.workflows__wrapper .dots-corner canvas')[0], {
			src: 'img/workflows-dots.svg', svgDots: true,
			color: '255,255,255', floor: 0, gain: 1,
			pointerHost: document.querySelector('.workflows__wrapper')
		});
	}
	$('.faq__wrapper .faq-field canvas').each(function(){
		initAsciiBg(this, {
			fill: true, cell: 24, dotScale: 0.6,
			color: '255,255,255', floor: 0.12, gain: 0.3, twinkle: 0.4,
			pointerHost: this.closest('.faq__wrapper')
		});
	});
	$('.shorts-portfolio .dots-float canvas').each(function(){
		initAsciiBg(this, {
			src: 'img/dots-reviews.svg', svgDots: true,
			color: '255,255,255', floor: 0, gain: 1,
			pointerHost: this.closest('.shorts-portfolio')
		});
	});
	if ($('.outer__integrations>.dots canvas').length){
		initAsciiBg($('.outer__integrations>.dots canvas')[0], {
			src: 'img/dots-integrations.svg', svgDots: true,
			color: '255,255,255', floor: 0, gain: 1,
			pointerHost: document.querySelector('.integrations__wrapper')
		});
	}
	if ($('.markets__dead .dots-fx .ascii-dots').length){
		initAsciiBg($('.markets__dead .dots-fx .ascii-dots')[0], {
			src: 'img/dots-markets.svg', place: 'fit-center', cell: 14,
			color: '170,220,195', floor: 0.05, gain: 0.22,
			pointerHost: document.querySelector('.markets__dead')
		});
	}

	if (window.HERO_ERO_DOTS && $('.hero__plans .ascii-ero').length){
		var hcv = $('.hero__plans .ascii-ero')[0];
		var hctx = hcv.getContext('2d');
		var HW = HERO_ERO_DOTS.w, HH = HERO_ERO_DOTS.h, hd = HERO_ERO_DOTS.d;
		var hph = new Float32Array(hd.length);
		for (var hi = 0; hi < hd.length; hi++) hph[hi] = Math.random() * Math.PI * 2;
		var hHost = $('.hero__plans')[0];
		var hFine = window.matchMedia('(hover: hover) and (pointer: fine)');
		var hTMX = -9999, hTMY = -9999, hMX = -9999, hMY = -9999;

		function hResize(){
			var dpr = Math.min(2, window.devicePixelRatio || 1);
			hcv.width = HW * dpr;
			hcv.height = HH * dpr;
			hctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		}
		$(hHost).on('mousemove', function(e){
			if (!hFine.matches) return;
			var r = hcv.getBoundingClientRect();
			hTMX = (e.clientX - r.left) / r.width * HW;
			hTMY = (e.clientY - r.top) / r.height * HH;
		}).on('mouseleave', function(){ hTMX = -9999; hTMY = -9999; });

		var ht = 0;
		function hFrame(){
			requestAnimationFrame(hFrame);
			ht += 0.05;
			if (hTMX > -9000){
				hMX = (hMX < -9000) ? hTMX : hMX + (hTMX - hMX) * 0.35;
				hMY = (hMY < -9000) ? hTMY : hMY + (hTMY - hMY) * 0.35;
			} else { hMX = -9999; hMY = -9999; }
			var hasM = hMX > -9000;
			hctx.clearRect(0, 0, HW, HH);
			for (var i = 0; i < hd.length; i++){
				var d = hd[i], x = d[0], y = d[1], base = d[2] / 100;
				var v = base * (0.78 + 0.22 * Math.sin(ht + hph[i]));
				var ox = 0, oy = 0;
				if (hasM){
					var mdx = x - hMX, mdy = y - hMY, md2 = mdx * mdx + mdy * mdy;
					var infl = Math.exp(-md2 / 6000);
					v += 0.6 * infl;
					var md = Math.sqrt(md2) || 1, push = 12 * infl;
					ox = (mdx / md) * push; oy = (mdy / md) * push;
				}
				if (v <= 0.02) continue;
				if (v > 1) v = 1;
				hctx.beginPath();
				hctx.arc(x + ox, y + oy, 2, 0, Math.PI * 2);
				hctx.fillStyle = 'rgba(120,255,180,' + (0.2 + v * 0.6).toFixed(3) + ')';
				hctx.fill();
			}
		}
		hResize();
		$(window).on('resize', hResize);
		requestAnimationFrame(hFrame);
	}

	(function(){
		var section = document.querySelector('.how__works');
		if (!section) return;
		var outer = section.querySelector('.outer__how');
		var floatEl = section.querySelector('.float__section');
		var elems = Array.prototype.slice.call(section.querySelectorAll('.side__list>.elem'));
		var progress = section.querySelector('.progress');
		var ring = section.querySelector('.progress-ring');
		var imgBase = section.querySelector('.box-screen .media-box>.screen-base');
		var imgTop = section.querySelector('.box-screen .media-box>.screen-top');
		var n = elems.length;
		if (!n || !outer || !floatEl) return;
		// the whole block — title, copy and the steps — pins as one stack, so
		// the section sticks from its title instead of just the steps
		var stack = outer.querySelector(':scope > .pin-stack');
		if (!stack){
			stack = document.createElement('div');
			stack.className = 'pin-stack';
			while (outer.firstChild) stack.appendChild(outer.firstChild);
			outer.appendChild(stack);
		}
		floatEl = stack;

		var C = 2 * Math.PI * 14;
		if (ring) ring.style.strokeDasharray = C.toFixed(2);
		var defaultSrc = imgBase ? imgBase.getAttribute('src') : '';
		var targetP = 0, activeIdx = -1;
		var curY = 0, curRing = 0;
		var mq = window.matchMedia('(max-width: 991px)');
		function clamp(v){ return v < 0 ? 0 : v > 1 ? 1 : v; }

		function setImage(idx){
			if (!imgBase || !imgTop) return;
			var src = elems[idx].getAttribute('data-screen') || defaultSrc;
			imgTop.style.transition = 'none';
			imgTop.style.opacity = '0';
			imgTop.style.transform = 'translateY(22px)';
			if (imgTop.getAttribute('src') !== src) imgTop.setAttribute('src', src);
			requestAnimationFrame(function(){ requestAnimationFrame(function(){
				imgTop.style.transition = 'opacity .7s cubic-bezier(.22,.61,.36,1), transform .7s cubic-bezier(.22,.61,.36,1)';
				imgTop.style.opacity = '1';
				imgTop.style.transform = 'translateY(0)';
			}); });
		}
		if (imgTop){
			imgTop.addEventListener('transitionend', function(e){
				if (e.propertyName !== 'opacity' || imgTop.style.opacity !== '1') return;
				imgBase.setAttribute('src', imgTop.getAttribute('src'));
				imgTop.style.transition = 'none';
				imgTop.style.opacity = '0';
			});
		}
		function setActive(idx){
			if (idx === activeIdx) return;
			activeIdx = idx;
			for (var k = 0; k < n; k++) elems[k].classList.toggle('active', k === idx);
			setImage(idx);
		}

		var travelPx = 0, holdPx = 0, fOT = 0, pinTop = 80;
		function computeTarget(){

			var or = outer.getBoundingClientRect();
			targetP = travelPx > 0 ? clamp((pinTop - fOT - or.top) / travelPx) : 0;
		}

		var stIn = true, stRaf = null;
		function frame(){
			if (!stIn || document.hidden){ stRaf = null; return; }
			stRaf = requestAnimationFrame(frame);
			computeTarget();

			var idx = Math.min(n - 1, Math.max(0, Math.floor(targetP * n + 1e-6)));
			setActive(idx);

			if (progress && !mq.matches){
				var ty = elems[idx].offsetTop - 3;
				curY += (ty - curY) * 0.06;
				progress.style.transform = 'translateY(' + curY.toFixed(1) + 'px)';
			}
			if (ring){
				var tr = (idx + 1) / n;
				curRing += (tr - curRing) * 0.07;
				ring.style.strokeDashoffset = (C * (1 - curRing)).toFixed(2);
			}
		}

		function layout(){
			pinTop = mq.matches ? 0 : 80;
			section.classList.remove('is-pinned');
			outer.style.height = '';
			fOT = floatEl.offsetTop;
			var fH = floatEl.offsetHeight;
			section.classList.add('is-pinned');
			var perStep = window.innerHeight * (mq.matches ? 0.85 : 0.9);
			travelPx = n * Math.round(perStep);
			holdPx = Math.round(window.innerHeight * (mq.matches ? 0.45 : 0.6));
			outer.style.height = (fOT + fH + travelPx + holdPx) + 'px';
		}
		function applyMode(){
			section.classList.add('is-pinned');
			layout();
		}

		applyMode();
		function stStart(){ if (stRaf == null && stIn && !document.hidden) stRaf = requestAnimationFrame(frame); }
		if ('IntersectionObserver' in window){
			new IntersectionObserver(function(es){ stIn = es[0].isIntersecting; stStart(); }, { rootMargin: '120px' }).observe(section);
		}
		document.addEventListener('visibilitychange', stStart);
		stStart();
		window.addEventListener('resize', applyMode);
		window.addEventListener('load', applyMode);
	})();

	(function(){
		var section = document.querySelector('.campaign__wrapper');
		if (!section) return;
		var outer = section.querySelector('.container');
		var floatEl = section.querySelector('.inn');
		var elems = Array.prototype.slice.call(section.querySelectorAll('.inner__steps>.elem'));
		var screenBox = section.querySelector('.screen__image');
		var backBox = section.querySelector('.float__back');
		var n = elems.length;
		if (!n || !outer || !floatEl) return;
		var topEl = outer.querySelector(':scope > .top');
		var stack = outer.querySelector(':scope > .pin-stack');
		if (!stack){
			stack = document.createElement('div');
			stack.className = 'pin-stack';
			outer.insertBefore(stack, topEl || floatEl);
			if (topEl) stack.appendChild(topEl);
			stack.appendChild(floatEl);
		}
		var mq = window.matchMedia('(max-width: 991px)');
		function clamp(v){ return v < 0 ? 0 : v > 1 ? 1 : v; }

		function makeFader(container){
			var a = container.querySelector('.lyr-base');
			var b = container.querySelector('.lyr-top');
			if (!a || !b) return function(){};
			[a, b].forEach(function(l){
				l.style.animation = 'none';
				l.style.transition = 'opacity .5s linear';
			});
			a.style.opacity = '1';
			b.style.opacity = '0';
			container.classList.remove('swap');
			var front = a, back = b, current = a.getAttribute('src');
			return function(src){
				if (current === src) return;
				current = src;
				if (back.getAttribute('src') !== src) back.setAttribute('src', src);
				void back.offsetWidth;
				back.style.opacity = '1';
				front.style.opacity = '0';
				var t = front; front = back; back = t;
			};
		}
		var fadeShot = makeFader(screenBox);
		var fadeBack = makeFader(backBox);

		var preload = [];
		elems.forEach(function(el){
			var s = el.getAttribute('data-shot');
			var bg = el.querySelector('.media__full img');
			if (s) preload.push(s);
			if (bg) preload.push(bg.getAttribute('src'));
		});
		preload.forEach(function(src){ var im = new Image(); im.src = src; });

		var activeIdx = -1;
		function setActive(idx){
			if (idx === activeIdx) return;
			activeIdx = idx;
			for (var k = 0; k < n; k++){
				var on = k === idx;
				elems[k].classList.toggle('opened', on);
				elems[k].classList.toggle('minified', !on);
			}
			var shot = elems[idx].getAttribute('data-shot');
			var bgImg = elems[idx].querySelector('.media__full img');
			var bg = bgImg ? bgImg.getAttribute('src') : shot;
			if (shot) fadeShot(shot);
			if (bg) fadeBack(bg);
			screenBox.classList.add('shown');
		}

		var travelPx = 0, fOT = 0, pinTop = 90;
		var stIn = true, stRaf = null;
		var displayStep = -1, lockUntil = 0;
		var STEP_DUR = 560;
		function nowMs(){ return (window.performance && performance.now) ? performance.now() : Date.now(); }
		var backLyrs = backBox ? Array.prototype.slice.call(backBox.querySelectorAll('.back-lyr')) : [];
		var dotsLyr = backBox ? backBox.querySelector('.dots') : null;
		var lastLift = '';
		function frame(){
			if (!stIn || document.hidden || mq.matches){ stRaf = null; return; }
			stRaf = requestAnimationFrame(frame);
			var or = outer.getBoundingClientRect();
			var p = travelPx > 0 ? clamp((pinTop - fOT - or.top) / travelPx) : 0;
			var vhh = window.innerHeight || 800;
			var stR = stack.getBoundingClientRect();
			var rel = clamp((40 - stR.top) / (vhh * 0.6));
			var lift = '0px ' + (-(rel * vhh * 0.65)).toFixed(1) + 'px';
			if (lift !== lastLift){
				lastLift = lift;
				for (var bl = 0; bl < backLyrs.length; bl++){
					backLyrs[bl].style.translate = lift;
				}
				if (dotsLyr) dotsLyr.style.translate = lift;
			}
			var target = Math.min(n - 1, Math.max(0, Math.floor(p * n + 1e-6)));
			if (displayStep === -1){ displayStep = target; setActive(displayStep); return; }
			if (nowMs() < lockUntil) return;
			if (displayStep !== target){
				displayStep += (target > displayStep) ? 1 : -1;
				setActive(displayStep);
				lockUntil = nowMs() + STEP_DUR;
			}
		}
		var bgTimer = null, bgI = 0;
		function bgSrc(i){
			var im = elems[i].querySelector('.media__full img');
			return im ? im.getAttribute('src') : elems[i].getAttribute('data-shot');
		}
		function stopBgLoop(){ if (bgTimer){ clearInterval(bgTimer); bgTimer = null; } }
		function startBgLoop(){
			stopBgLoop();
			bgI = 0;
			var s0 = bgSrc(0); if (s0) fadeBack(s0);
			bgTimer = setInterval(function(){
				if (document.hidden) return;
				bgI = (bgI + 1) % n;
				var s = bgSrc(bgI); if (s) fadeBack(s);
			}, 3600);
		}
		function applyMobile(){
			section.classList.remove('is-pinned');
			outer.style.height = '';
			activeIdx = -1;
			for (var k = 0; k < n; k++){
				elems[k].classList.add('opened');
				elems[k].classList.remove('minified');
			}
			startBgLoop();
		}
		function layout(){
			if (mq.matches){ applyMobile(); return; }
			stopBgLoop();
			pinTop = 40 + (floatEl.offsetTop - stack.offsetTop);
			section.classList.remove('is-pinned');
			outer.style.height = '';
			fOT = floatEl.offsetTop;
			var fH = floatEl.offsetHeight;
			section.classList.add('is-pinned');
			var perStep = window.innerHeight * 0.85;
			travelPx = n * Math.round(perStep);
			var holdPx = Math.round(window.innerHeight * 0.15);
			outer.style.height = (fOT + fH + travelPx + holdPx) + 'px';
			activeIdx = -1;
			stStart();
		}
		layout();
		function stStart(){ if (stRaf == null && stIn && !document.hidden && !mq.matches) stRaf = requestAnimationFrame(frame); }
		if ('IntersectionObserver' in window){
			new IntersectionObserver(function(es){ stIn = es[0].isIntersecting; stStart(); }, { rootMargin: '160px' }).observe(section);
		}
		document.addEventListener('visibilitychange', stStart);
		stStart();
		window.addEventListener('resize', layout);
		window.addEventListener('load', layout);
	})();

	if ($('.campaign__wrapper .ascii-dots').length){
		initAsciiBg($('.campaign__wrapper .ascii-dots')[0], {
			src: 'img/bg-dots-campaign.svg', place: 'auto-topleft', cell: 26,
			dotScale: 0.6, floor: 0.16, gain: 0.3,
			pointerHost: document.querySelector('.campaign__wrapper')
		});
	}

	if ($('.circle__process .ascii-dots').length){
		initAsciiBg($('.circle__process .ascii-dots')[0], {
			src: 'img/rocket-dots.svg', disc: true, cell: 14,
			dotScale: 0.8, floor: 0.42, gain: 0.75, twinkle: 0.55,
			pointerHost: document.querySelector('.process__wrapper')
		});
	}

	if ($('.how__works .ascii-dots').length){
		initAsciiBg($('.how__works .ascii-dots')[0], {
			src: 'img/dots-background.svg', place: 'auto-center',
			pointerHost: document.querySelector('.how__works')
		});
	}

	$('.how__scheme .media .dots .ascii-dots').each(function(){
		initAsciiBg(this, { src: 'img/dots-back-media.svg', place: 'auto-center',
			dotScale: 0.6, floor: 0.16, gain: 0.3,
			pointerHost: this.closest('.media') });
	});

	if ($('.testimonial__wrapper .dots .ascii-dots').length){
		initAsciiBg($('.testimonial__wrapper .dots .ascii-dots')[0], {
			src: 'img/dots-testimonials.svg', place: 'auto-center',
			pointerHost: document.querySelector('.testimonial__wrapper')
		});
	}

	if ($('.brain__wrapper .dots .ascii-dots').length){
		initAsciiBg($('.brain__wrapper .dots .ascii-dots')[0], {
			src: 'img/dots-brain.svg', svgDots: true, floor: 0.2, gain: 0.45,
			pointerHost: document.querySelector('.brain__wrapper')
		});
	}

	if ($('.team__members .member-dots .ascii-dots').length){
		initAsciiBg($('.team__members .member-dots .ascii-dots')[0], {
			src: 'img/dots-team.svg', place: 'auto-center',
			pointerHost: document.querySelector('.team__members')
		});
	}

	function initFaqDots(fcv){
		var fctx = fcv.getContext('2d');
		var FW = FAQ_DOTS.w, FH = FAQ_DOTS.h, fd = FAQ_DOTS.d;
		var fph = new Float32Array(fd.length);
		for (var fi = 0; fi < fd.length; fi++) fph[fi] = Math.random() * Math.PI * 2;

		function fResize(){
			var dpr = Math.min(2, window.devicePixelRatio || 1);
			fcv.width = FW * dpr;
			fcv.height = FH * dpr;
			fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		}
		var ft = 0;
		function fFrame(){
			requestAnimationFrame(fFrame);
			ft += 0.045;
			fctx.clearRect(0, 0, FW, FH);
			for (var i = 0; i < fd.length; i++){
				var d = fd[i], o = d[2], a;
				if (o >= 100){
					a = 0.92;
				} else {
					var tw = 0.5 + 0.5 * Math.sin(ft + fph[i]);
					a = (o / 100) * 0.32 * (0.12 + 0.88 * tw);
				}
				if (a <= 0.01) continue;
				fctx.beginPath();
				fctx.arc(d[0], d[1], 2, 0, Math.PI * 2);
				fctx.fillStyle = 'rgba(0,255,138,' + a.toFixed(3) + ')';
				fctx.fill();
			}
		}
		fResize();
		$(window).on('resize', fResize);
		requestAnimationFrame(fFrame);
	}
	if (window.FAQ_DOTS){
		$('.ascii-faq').each(function(){ initFaqDots(this); });
	}

	if ($('.case__feed .float-left').length){
		var $csLinks = $('.case__feed .float-left a');
		var csTargets = [];
		$csLinks.each(function(){
			var href = $(this).attr('href') || '';
			csTargets.push(href.charAt(0) === '#' ? document.getElementById(href.slice(1)) : null);
		});

		var CS_OFFSET = 120;

		function csUpdate(){
			var line = (window.innerHeight || document.documentElement.clientHeight) * 0.5;
			var active = 0;
			for (var i = 0; i < csTargets.length; i++){
				var el = csTargets[i];
				if (el && el.getBoundingClientRect().top - line <= 0) active = i;
			}
			$csLinks.removeClass('current').eq(active).addClass('current');
		}

		$csLinks.on('click', function(e){
			var href = $(this).attr('href') || '';
			var el = href.charAt(0) === '#' ? document.getElementById(href.slice(1)) : null;
			if (!el) return;
			e.preventDefault();
			var y = window.pageYOffset + el.getBoundingClientRect().top - CS_OFFSET;
			window.scrollTo({ top: y < 0 ? 0 : y, behavior: 'smooth' });
		});

		csUpdate();
		$(window).on('scroll', csUpdate);
		$(window).on('resize', csUpdate);
	}

	if ($('.team__hero .person-float').length){
		var tHero = $('.team__hero')[0];
		var chips = $('.team__hero .person-float').toArray();
		var TW = 0, TH = 0, exclude = null;
		var SPEED = 0.26;
		var tState = [];

		function rndR(a, b){ return a + Math.random() * (b - a); }
		function rectHit(x, y, w, h, r){
			return !(x + w < r.x || x > r.x + r.w || y + h < r.y || y > r.y + r.h);
		}

		function measureTeam(){
			TW = tHero.clientWidth;
			TH = tHero.clientHeight;
			var hr = tHero.getBoundingClientRect();
			var descEl = tHero.querySelector('.outer__team .desc');
			if (descEl){
				var dr = descEl.getBoundingClientRect();
				var pad = 36;
				exclude = { x: dr.left - hr.left - pad, y: dr.top - hr.top - pad,
				            w: dr.width + pad * 2, h: dr.height + pad * 2 };
			} else { exclude = null; }
		}

		function initTeamChips(){
			measureTeam();
			tState = chips.map(function(el){
				var size = el.offsetWidth || 60;
				var x, y, tries = 0;
				do {
					x = rndR(0, Math.max(1, TW - size));
					y = rndR(0, Math.max(1, TH - size));
					tries++;
				} while (exclude && tries < 50 && rectHit(x, y, size, size, exclude));
				var ang = rndR(0, Math.PI * 2);
				return { el: el, img: el.querySelector('.person-image'), size: size,
				         x: x, y: y, vx: Math.cos(ang) * SPEED, vy: Math.sin(ang) * SPEED,
				         disp: ang, wander: rndR(0, 1000) };
			});
		}

		function teamStep(){
			requestAnimationFrame(teamStep);
			if (!tState.length) return;

			for (var a = 0; a < tState.length; a++){
				var s = tState[a];

				s.wander += 0.0035;
				var turn = Math.sin(s.wander) * 0.010;
				var cs = Math.cos(turn), sn = Math.sin(turn);
				var rvx = s.vx * cs - s.vy * sn;
				var rvy = s.vx * sn + s.vy * cs;
				s.vx = rvx; s.vy = rvy;

				var cx = s.x + s.size / 2, cy = s.y + s.size / 2;

				var m = 48;
				if (s.x < m) s.vx += 0.022;
				if (s.x > TW - s.size - m) s.vx -= 0.022;
				if (s.y < m) s.vy += 0.022;
				if (s.y > TH - s.size - m) s.vy -= 0.022;

				if (exclude &&
				    cx > exclude.x - s.size / 2 && cx < exclude.x + exclude.w + s.size / 2 &&
				    cy > exclude.y - s.size / 2 && cy < exclude.y + exclude.h + s.size / 2){
					var ex = exclude.x + exclude.w / 2, ey = exclude.y + exclude.h / 2;
					var dx = cx - ex, dy = cy - ey, d = Math.sqrt(dx * dx + dy * dy) || 1;
					s.vx += (dx / d) * 0.08; s.vy += (dy / d) * 0.08;
				}

				for (var b = 0; b < tState.length; b++){
					if (b === a) continue;
					var o = tState[b];
					var dx2 = cx - (o.x + o.size / 2), dy2 = cy - (o.y + o.size / 2);
					var dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);
					var minD = (s.size + o.size) / 2 + 14;
					if (dist < minD && dist > 0){
						var f = (minD - dist) / minD * 0.10;
						s.vx += (dx2 / dist) * f; s.vy += (dy2 / dist) * f;
					}
				}

				var sp = Math.sqrt(s.vx * s.vx + s.vy * s.vy) || 0.0001;
				s.vx = s.vx / sp * SPEED;
				s.vy = s.vy / sp * SPEED;

				s.x += s.vx; s.y += s.vy;
				if (s.x < 0) s.x = 0; else if (s.x > TW - s.size) s.x = TW - s.size;
				if (s.y < 0) s.y = 0; else if (s.y > TH - s.size) s.y = TH - s.size;

				var targetAng = Math.atan2(s.vy, s.vx) + Math.PI / 2;
				var da = targetAng - s.disp;
				while (da > Math.PI) da -= Math.PI * 2;
				while (da < -Math.PI) da += Math.PI * 2;
				s.disp += da * 0.035;
				var deg = s.disp * 180 / Math.PI;

				s.el.style.transform = 'translate(' + s.x.toFixed(1) + 'px,' + s.y.toFixed(1) + 'px) rotate(' + deg.toFixed(1) + 'deg)';
				if (s.img) s.img.style.transform = 'rotate(' + (-deg).toFixed(1) + 'deg)';
			}
		}

		initTeamChips();
		$(window).on('resize', initTeamChips);
		$(window).on('load', initTeamChips);
		requestAnimationFrame(teamStep);
	}

	if ($('.quote__wall').length) {
		var $wall = $('.quote__wall').isotope({
			itemSelector: '.elem',
			percentPosition: true,
			masonry: {
				columnWidth: '.grid-sizer',
				gutter: 20
			}
		});

		(function(){
			var wall = document.querySelector('.reviews__wrapper .quote__wall');
			if (!wall) return;
			if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
			var items = Array.prototype.slice.call(wall.querySelectorAll('.elem'));
			if (!items.length) return;
			wall.classList.add('qp-anim');
			if (window.IntersectionObserver){
				var io = new IntersectionObserver(function(entries, ob){
					entries.forEach(function(e){
						if (e.isIntersecting){ e.target.classList.add('qp-in'); ob.unobserve(e.target); }
					});
				}, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' });
				items.forEach(function(el){ io.observe(el); });
			} else {
				items.forEach(function(el){ el.classList.add('qp-in'); });
			}
		})();

	}

	(function(){
		var desktop = window.matchMedia('(min-width: 992px)');
		var $right = $('header .right');
		var $links = $('header .right .menu>ul>li>a, header .right .btns>a');

		function activate($link){
			if (!desktop.matches) return;
			$links.removeClass('nav-active');
			$link.addClass('nav-active');
			$right.addClass('nav-muted');
		}
		function deactivate(){
			$links.removeClass('nav-active');
			$right.removeClass('nav-muted');
		}
		function inside(node, el){ return !!node && !!el && (node === el || node.contains(el)); }

		$('header .right .menu>ul>li').each(function(){
			var $a = $(this).children('a');
			var $dd = $(this).children('.header__dropdown');
			var a = $a[0], dd = $dd[0];

			$a.add($dd).on('mouseenter', function(){ activate($a); });
			$a.add($dd).on('mouseleave', function(e){
				var to = e.relatedTarget;
				if (inside(a, to) || inside(dd, to)) return;
				deactivate();
			});
		});

		$('header .right .btns>a')
			.on('mouseenter', function(){ activate($(this)); })
			.on('mouseleave', function(){ deactivate(); });
	})();

	if ($('.more__case--studies').length) {
		if ($('.cases-slider').length) {
			$('.cases-slider').css('width' , "auto");
			$('.cases-slider').css('width' , $('.cases-slider').outerWidth() + $('.cases-slider').offset().left);
			$(window).on('resize' , function(){
				$('.cases-slider').css('width' , "auto");
				$('.cases-slider').css('width' , $('.cases-slider').outerWidth() + $('.cases-slider').offset().left);
			});
		}
		(function(){
			var $cs = $('.more__case--studies .cases-slider');
			if (!$cs.length || $cs.hasClass('slick-initialized')) return;
			$cs.find('.slide').removeClass('long').addClass('short');
			$cs.slick({
				slidesToShow:1,
				variableWidth:true,
				dots:true,
				arrows:true,
				appendDots:$('.cases-controls .dots'),
				 responsive: [
				    {
				      breakpoint: 991,
				      settings: {
				        variableWidth:false,
				        adaptiveHeight:true
				      }
				    }
				  ]
			});
			var lock = 0, posRaf = null, posUntil = 0;
			function pumpPositions(){
				posUntil = Date.now() + 750;
				if (posRaf) return;
				(function step(){
					$cs.slick('setPosition');
					if (Date.now() < posUntil) posRaf = requestAnimationFrame(step);
					else posRaf = null;
				})();
			}
			function openSlide(idx, go){
				var slick = $cs.slick('getSlick');
				var count = slick.slideCount;
				var real = ((idx % count) + count) % count;
				$cs.find('.slick-slide').each(function(){
					var di = parseInt(this.getAttribute('data-slick-index'), 10);
					var on = ((di % count) + count) % count === real;
					this.classList.toggle('cs-open', on);
				});
				if (go) $cs.slick('slickGoTo', real);
				pumpPositions();
			}
			$cs.on('mouseenter', '.slick-slide', function(){
				if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
				if (window.innerWidth <= 991) return;
				if (this.classList.contains('cs-open')) return;
				if (Date.now() < lock) return;
				lock = Date.now() + 700;
				openSlide(parseInt(this.getAttribute('data-slick-index'), 10), true);
			});
			$cs.on('afterChange', function(e, slick, cur){ openSlide(cur, false); });
		})();

		$(window).on('resize' ,function(){
			$('.more__case--studies .cases-slider').css("width" ,"auto")
			$('.more__case--studies .cases-slider').css("width" , $('.cases-slider').offset().left + $('.cases-slider').outerWidth());
		});
	}

	if ($('.elem__article--case .slider').length) {
		$(window).on('resize' ,function(){
			$('.elem__article--case .slider').each(function(index,elem){
				$(elem).css('width', $(elem).closest('.elem__article--case').outerWidth());
			});
		});
		$('.elem__article--case .slider').each(function(index,elem){
			$(elem).css('width', $(elem).closest('.elem__article--case').outerWidth());
			$(elem).slick({
				variableWidth:true,
				swipe:true,
				arrows:true,
				swipeToSlide:true
			});
		});
	}

	if ($('.marquee__wrapper').length) {
		$('.marquee__wrapper ul').webTicker({
			startEmpty:false,
			hoverpause:false,
			duplicate:true,
		})
	}

	 const $ta = $('.ta');
	  const $handle = $('.custom-resize');

	  let isResizing = false;
	  let startY, startH;

	  $handle.on('mousedown', function(e) {
	    isResizing = true;
	    startY = e.clientY;
	    startH = $ta.outerHeight();
	    e.preventDefault();
	  });

	  $(document).on('mousemove', function(e) {
	    if (!isResizing) return;
	    const newH = startH + (e.clientY - startY);
	    $ta.height(Math.max(50, newH));
	  });

	  $(document).on('mouseup', function() {
	    isResizing = false;
	  });

	(function(){
		var story = document.querySelector('.our__story');
		if (!story) return;

		var txt = story.querySelector('.desc .txt');
		var words = [];
		if (txt){
			var ps = txt.querySelectorAll('p');
			Array.prototype.forEach.call(ps, function(p){
				var parts = p.textContent.split(/(\s+)/);
				p.textContent = '';
				parts.forEach(function(tok){
					if (tok === '' ) return;
					if (/^\s+$/.test(tok)){
						p.appendChild(document.createTextNode(tok));
					} else {
						var s = document.createElement('span');
						s.className = 'hl-word';
						s.textContent = tok;
						p.appendChild(s);
						words.push(s);
					}
				});
			});
		}

		var icons = Array.prototype.slice.call(story.querySelectorAll('.icon-float'));
		var logoPin = story.querySelector('.story-logo-pin');
		var amps = [70, 120, 45];
		var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		var pinned = !reduce;
		if (pinned) story.classList.add('story-pin');

		var ticking = false;
		function update(){
			ticking = false;
			var rect = story.getBoundingClientRect();
			var vh = window.innerHeight || document.documentElement.clientHeight;
			var prog;

			if (pinned){
				var scrollable = rect.height - vh;
				prog = scrollable > 0 ? (-rect.top) / scrollable : 0;
			} else if (txt){
				var trect = txt.getBoundingClientRect();
				var startLine = vh * 0.85, endLine = vh * 0.30;
				var span = trect.height + (startLine - endLine);
				prog = (startLine - trect.top) / span;
			} else {
				prog = 0;
			}
			if (prog < 0) prog = 0; else if (prog > 1) prog = 1;

			if (words.length){
				var readProg = Math.min(1, prog / 0.86);
				var litCount = Math.round(readProg * words.length);
				for (var i = 0; i < words.length; i++){
					var on = i < litCount;
					if (on !== words[i]._lit){
						words[i].classList.toggle('lit', on);
						words[i]._lit = on;
					}
				}
			}

			var vw = window.innerWidth || 1440;
			var ampScale = vw <= 767 ? 0.3 : (vw <= 1200 ? 0.55 : 1);
			for (var j = 0; j < icons.length; j++){
				var dir = (j % 2 === 0) ? 1 : -1;
				var y = (prog - 0.5) * amps[j % amps.length] * 1.6 * dir * ampScale;
				var x = Math.sin(prog * Math.PI + j * 1.3) * 16 * dir * ampScale;
				icons[j].style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
			}

			if (logoPin){
				if (prog >= 0.86) logoPin.classList.add('reached');
				else logoPin.classList.remove('reached');
			}
		}
		function onScroll(){ if (!ticking){ ticking = true; requestAnimationFrame(update); } }
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		update();
	})();

	(function(){
		var sec = document.querySelector('.double__fade--section');
		if (!sec) return;
		var elems = Array.prototype.slice.call(sec.querySelectorAll(':scope > .elem'));
		if (elems.length < 2) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		sec.classList.add('fade-ready');
		var a = elems[0], b = elems[1];
		function parts(el){ return { desc: el.querySelector('.desc'), media: el.querySelector('.media') }; }
		var A = parts(a), B = parts(b);
		function clamp(v){ return v < 0 ? 0 : v > 1 ? 1 : v; }
		function smooth(v){ return v * v * (3 - 2 * v); }
		function set(node, o, y){ if (!node) return; node.style.opacity = o.toFixed(3); node.style.transform = 'translateY(' + y.toFixed(1) + 'px)'; }
		var ticking = false;
		function update(){
			ticking = false;
			var r = sec.getBoundingClientRect();
			var vh = window.innerHeight || document.documentElement.clientHeight;
			var total = sec.offsetHeight - vh;
			var p = total > 0 ? clamp(-r.top / total) : 0;
			var aTitleIn  = smooth(clamp((p - 0.02) / 0.12));
			var aImgIn    = smooth(clamp((p - 0.09) / 0.13));
			var aTitleOut = smooth(clamp((p - 0.40) / 0.11));
			var aImgOut   = smooth(clamp((p - 0.46) / 0.11));
			var bTitleIn  = smooth(clamp((p - 0.58) / 0.12));
			var bImgIn    = smooth(clamp((p - 0.65) / 0.13));

			var aDesc  = aTitleIn * (1 - aTitleOut);
			var aMedia = aImgIn   * (1 - aImgOut);
			var bDesc  = bTitleIn;
			var bMedia = bImgIn;

			var aEnv = Math.max(aDesc, aMedia);
			a.style.opacity = aEnv.toFixed(3);
			set(A.desc,  aEnv > 0.001 ? aDesc  / aEnv : 0, (1 - aTitleIn) * 28 - aTitleOut * 30);
			set(A.media, aEnv > 0.001 ? aMedia / aEnv : 0, (1 - aImgIn)   * 44 - aImgOut   * 30);
			var bEnv = Math.max(bDesc, bMedia);
			b.style.opacity = bEnv.toFixed(3);
			set(B.desc,  bEnv > 0.001 ? bDesc  / bEnv : 0, (1 - bTitleIn) * 28);
			set(B.media, bEnv > 0.001 ? bMedia / bEnv : 0, (1 - bImgIn)   * 44);
		}
		function onScroll(){ if (!ticking){ ticking = true; requestAnimationFrame(update); } }
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		window.addEventListener('load', update);
		update();
	})();

	(function(){
		var wrap = document.querySelector('.matrix_wrapper');
		if (!wrap) return;
		var img = wrap.querySelector('img.mask-back');
		if (!img) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		var TOKENS = ['group_info', 'NGROUPS_PER_BLOCK', 'count', 'nblocks', 'sizeof', 'stride',
			'bsearch', 'init_groups', 'EFAULT', 'return', 'kmalloc', 'GROUP_AT', 'struct', 'const',
			'void', 'right', 'left', 'blocks[i]', 'pointer', 'for', 'while', 'if', 'int', '0x1f',
			'user', 'per_block', 'copy_from_user', '->ngroups', 'gid_t', 'set_groups', 'usage',
			'head', 'node', 'max', 'must', 'search', 'group_info->blocks', '0', '1', '01', '42', '99'];
		function tok(){ return TOKENS[(Math.random() * TOKENS.length) | 0]; }

		var W = 1440, H = 712, SVGNS = 'http://www.w3.org/2000/svg';
		var svg = document.createElementNS(SVGNS, 'svg');
		svg.setAttribute('class', 'mask-back matrix-glyphs');
		svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
		svg.setAttribute('preserveAspectRatio', 'xMaxYMin slice');
		svg.setAttribute('aria-hidden', 'true');

		var cells = [], y, x;
		for (y = 12; y < H; y += 26){
			for (x = 6; x < W; x += 92 + Math.random() * 46){
				var pr = (x / W) * 0.62 + ((H - y) / H) * 0.55;
				if (Math.random() > pr) continue;
				var t = document.createElementNS(SVGNS, 'text');
				t.setAttribute('x', x.toFixed(0));
				t.setAttribute('y', y.toFixed(0));
				t.textContent = tok();
				var base = 0.06 + Math.random() * 0.06;
				t.style.opacity = base.toFixed(3);
				svg.appendChild(t);
				cells.push({ t: t, base: base });
			}
		}
		img.parentNode.replaceChild(svg, img);

		function flip(c){
			c.t.textContent = tok();
			c.t.style.opacity = (0.4 + Math.random() * 0.4).toFixed(3);
			setTimeout(function(){ c.t.style.opacity = c.base.toFixed(3); }, 300);
		}

		var raf = 0, last = 0, inView = true;
		function frame(ts){
			raf = requestAnimationFrame(frame);
			if (!inView || document.hidden || !cells.length) return;
			if (ts - last < 90) return;
			last = ts;
			var flips = Math.max(3, (cells.length * 0.05) | 0);
			for (var k = 0; k < flips; k++) flip(cells[(Math.random() * cells.length) | 0]);
		}
		raf = requestAnimationFrame(frame);
		if ('IntersectionObserver' in window){
			new IntersectionObserver(function(e){ inView = e[0].isIntersecting; }, { rootMargin: '120px' }).observe(wrap);
		}
	})();

	(function(){
		var stack = document.querySelector('.hero__analytics .stat-stack');
		if (!stack) return;
		var cards = Array.prototype.slice.call(stack.querySelectorAll('.stat-card'));
		var n = cards.length;
		if (n < 2) return;
		var DEPTH = [
			{ y: 0,   s: 1,     o: 1    },
			{ y: -34, s: 0.857, o: 0.85 },
			{ y: -64, s: 0.714, o: 0.6  }
		];
		function depth(p){ return DEPTH[Math.min(p, DEPTH.length - 1)]; }
		var pos = cards.map(function(_, i){ return i; });
		function place(card, p, withTransition){
			var d = depth(p);
			if (!withTransition){ card.style.transition = 'none'; }
			card.style.transform = 'translateY(' + d.y + 'px) scale(' + d.s + ')';
			card.style.opacity = d.o;
			card.style.zIndex = String(100 - p);
			if (!withTransition){ void card.offsetWidth; card.style.transition = ''; }
		}
		cards.forEach(function(c, i){ place(c, pos[i], false); });

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		var timer = null, stopped = false;
		function rand(a, b){ return a + Math.random() * (b - a); }
		function tick(){
			var frontI = pos.indexOf(0);
			var card = cards[frontI];
			var dy = rand(100, 165), sc = rand(0.86, 0.95), dx = rand(-30, 30), rot = rand(-7, 7);
			card.style.zIndex = '200';
			card.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + sc.toFixed(3) + ') rotate(' + rot.toFixed(1) + 'deg)';
			card.style.opacity = '0';
			setTimeout(function(){
				for (var i = 0; i < n; i++) pos[i] = (pos[i] - 1 + n) % n;
				var d = depth(pos[frontI]);
				card.style.transition = 'none';
				card.style.transform = 'translateY(' + d.y + 'px) scale(' + d.s + ')';
				card.style.opacity = '0';
				card.style.zIndex = String(100 - pos[frontI]);
				void card.offsetWidth;
				card.style.transition = '';
				card.style.opacity = d.o;
				for (var k = 0; k < n; k++){ if (k !== frontI) place(cards[k], pos[k], true); }
			}, 480);
			schedule();
		}
		function schedule(){ if (stopped) return; timer = setTimeout(tick, rand(1500, 2500)); }
		function run(){ stopped = false; if (timer == null) schedule(); }
		function stop(){ stopped = true; if (timer != null){ clearTimeout(timer); timer = null; } }
		document.addEventListener('visibilitychange', function(){ if (document.hidden) stop(); else run(); });
		run();
	})();

	(function(){
		var trace = document.querySelector('.how__works--graph .hiw-trace');
		var graph = document.getElementById('hiwGraph');
		var right = document.querySelector('.how__works--graph .inner>.right');
		if (!trace || !graph || !right) return;
		if (window.innerWidth <= 767) return;
		var persist = trace.querySelector('.hiw-trunk-persist');
		var tip = trace.querySelector('.hiw-trunk-tip');
		var head = trace.querySelector('.hiw-trunk-head');
		if (!persist || !tip || !head) return;

		var Y0 = 58, Y1 = 2095, SPAN = Y1 - Y0;
		var L = SPAN, TIP = 64;
		try { L = persist.getTotalLength() || SPAN; } catch (e) {}
		persist.style.strokeDasharray = L + ' ' + L;
		tip.style.strokeDasharray = TIP + ' ' + (L + TIP);

		var EASE = 'cubic-bezier(.21,.7,.28,1)';

		var STEPS = [
			{ y0: 150, y1: 222, trigger: 150, byX: true },
			{ y0: 410, y1: 772, trigger: 360 },
			{ y0: 962, y1: 1430, trigger: 912 },
			{ y0: 1620, y1: 1936, trigger: 1560 },
			{ y0: 2088, y1: 2156, trigger: 2090 }
		];

		function cy(b){ return b.y + b.height / 2; }
		function cx(b){ return b.x + b.width / 2; }
		var nodes = graph.querySelectorAll('path,rect,circle,ellipse,line,text');
		var items = [];
		for (var n = 0; n < nodes.length; n++){
			var el = nodes[n];
			if (el.closest('defs,mask,clipPath,filter,pattern')) continue;
			var b; try { b = el.getBBox(); } catch (e) { continue; }
			if (!b || !b.width || !b.height) continue;
			var c = cy(b), x = cx(b);
			if (b.width < 9 && x > 198 && x < 222 && b.height > 26) continue;
			var s = -1;
			for (var i = 0; i < STEPS.length; i++){ if (c >= STEPS[i].y0 && c < STEPS[i].y1){ s = i; break; } }
			if (s < 0) continue;
			var strokeAttr = el.getAttribute('stroke');
			var act = (strokeAttr === '#5f8473') || (el.getAttribute('data-line') === 'node');
			items.push({ el: el, step: s, isFrame: b.width > 360, x: x, y: c, act: act, fillAct: el.getAttribute('data-line') === 'node' });
		}

		var steps = STEPS.map(function(){ return { frame: [], rows: [], act: [], revealed: false }; });
		items.forEach(function(it){
			if (it.isFrame) steps[it.step].frame.push(it);
			if (it.act) steps[it.step].act.push(it);
		});
		STEPS.forEach(function(def, si){
			var content = items.filter(function(it){ return it.step === si && !it.isFrame; });
			if (def.byX){ content.sort(function(a,b){ return a.x - b.x; }); }
			else { content.sort(function(a,b){ return a.y - b.y; }); }
			var rows = [], cur = null, key = def.byX ? 'x' : 'y', gap = def.byX ? 60 : 13;
			content.forEach(function(it){
				if (!cur || Math.abs(it[key] - cur.k) > gap){ cur = { k: it[key], els: [] }; rows.push(cur); }
				cur.k = it[key]; cur.els.push(it.el);
			});
			steps[si].rows = rows;
		});

		function prime(el, frame){
			el.style.transition = 'opacity .55s ' + EASE + ', transform .65s ' + EASE + ', stroke .5s ease, fill .5s ease';
			el.style.opacity = '0';
			if (frame){
				el.style.transformBox = 'fill-box';
				el.style.transformOrigin = 'center';
				el.style.transform = 'scale(.93)';
			} else {
				el.style.transform = 'translateY(16px)';
			}
		}
		steps.forEach(function(st){
			st.frame.forEach(function(it){ prime(it.el, true); });
			st.rows.forEach(function(row){ row.els.forEach(function(el){ prime(el, false); }); });
		});

		var nodeAnim = (function(){
			var NS = 'http://www.w3.org/2000/svg';
			var NODE_X = 45, CYS = [538, 628, 718], checkTpl = null, glassTpl = null, toHide = [];
			graph.querySelectorAll('path').forEach(function(el){
				if (el.closest('defs,mask,clipPath,filter')) return;
				var b; try { b = el.getBBox(); } catch(e){ return; }
				var cx = b.x + b.width/2, cy = b.y + b.height/2;
				if (cx >= 95 || b.width < 3 || b.height > 45) return;
				if (el.getAttribute('data-line')) return;
				var onNode = CYS.some(function(ny){ return Math.abs(cy - ny) < 24; });
				if (!onNode) return;
				if (el.getAttribute('fill') === 'black' && Math.abs(cy - 538) < 14) checkTpl = el;
				if (el.getAttribute('fill') === 'white' && Math.abs(cy - 628) < 14 && !glassTpl) glassTpl = el;
				toHide.push(el);
			});
			if (!checkTpl || !glassTpl) return null;
			toHide.forEach(function(el){ el.style.display = 'none'; });
			function disc(cy, r, fill, stroke){
				var c = document.createElementNS(NS, 'circle');
				c.setAttribute('cx', NODE_X); c.setAttribute('cy', cy); c.setAttribute('r', r);
				c.setAttribute('fill', fill || 'none');
				if (stroke){ c.setAttribute('stroke', stroke); c.setAttribute('stroke-width', '1'); }
				return c;
			}
			var nodes = CYS.map(function(cy){
				var proc = document.createElementNS(NS, 'g');
				proc.appendChild(disc(cy, 19.5, '#091811', '#5f8473'));
				var glass = glassTpl.cloneNode(true);
				glass.removeAttribute('style');
				glass.setAttribute('transform', 'translate(0,' + (cy - 628) + ')');
				proc.appendChild(glass);
				var pub = document.createElementNS(NS, 'g');
				pub.appendChild(disc(cy, 20, '#00FF8A', null));
				var ck = checkTpl.cloneNode(true);
				ck.removeAttribute('style');
				ck.setAttribute('transform', 'translate(0,' + (cy - 538) + ')');
				pub.appendChild(ck);
				proc.style.transition = 'opacity .45s ease';
				pub.style.transition = 'opacity .5s cubic-bezier(.2,.8,.2,1)';
				proc.style.opacity = '0'; pub.style.opacity = '0';
				graph.appendChild(proc); graph.appendChild(pub);
				return { cy: cy, proc: proc, pub: pub, on: false };
			});
			return {
				appear: function(){ nodes.forEach(function(nd){ if (!nd.on) nd.proc.style.opacity = '1'; }); },
				update: function(hy){
					nodes.forEach(function(nd){
						if (nd.on || hy < nd.cy - 4) return;
						nd.on = true; nd.proc.style.opacity = '0'; nd.pub.style.opacity = '1';
					});
				}
			};
		})();

		function show(el, delay){
			el.style.transitionDelay = delay + 'ms';
			el.style.opacity = '1';
			el.style.transform = 'none';
		}
		function revealStep(si){
			var st = steps[si];
			if (st.revealed) return; st.revealed = true;
			st.frame.forEach(function(it){ show(it.el, 0); });
			st.rows.forEach(function(row, ri){ var d = 130 + ri * 80; row.els.forEach(function(el){ show(el, d); }); });
			setTimeout(function(){
				st.act.forEach(function(it){
					if (it.fillAct) it.el.style.fill = '#00FF8A';
					else it.el.style.stroke = '#00FF8A';
				});
			}, 360);
			if (si === 1 && nodeAnim) setTimeout(function(){ nodeAnim.appear(); }, 200);
		}

		var latched = 0, shown = -1, target = 0, raf = 0;
		function render(p){
			persist.style.strokeDashoffset = (L * (1 - p)).toFixed(2);
			tip.style.strokeDashoffset = (TIP - L * p).toFixed(2);
			tip.style.opacity = (p > 0.001 && p < 0.999) ? '1' : '0';
			var hy = Y0 + SPAN * p;
			head.setAttribute('cy', hy.toFixed(1));
			head.style.opacity = (p > 0.004 && p < 0.997) ? '1' : '0';
			for (var i = 0; i < STEPS.length; i++){ if (hy >= STEPS[i].trigger) revealStep(i); }
			if (nodeAnim) nodeAnim.update(hy);
		}
		function loop(){
			raf = 0;
			shown += (target - shown) * 0.16;
			if (Math.abs(target - shown) < 0.0015) shown = target;
			render(shown);
			if (shown !== target) raf = requestAnimationFrame(loop);
		}
		function onScroll(){
			var r = right.getBoundingClientRect();
			if (!r.height) return;
			var ref = window.innerHeight * 0.6;
			var p = (ref - r.top) / r.height;
			if (p < 0) p = 0; else if (p > 1) p = 1;
			if (p > latched) latched = p;
			target = latched;
			if (shown < 0) shown = target;
			if (!raf) raf = requestAnimationFrame(loop);
		}

		render(0);
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll, { passive: true });
		onScroll();
	})();

	(function(){
		var box = document.querySelector('.portfolio--box');
		if (!box) return;
		var rows = [].slice.call(box.querySelectorAll('.phone__rows .row'));
		var mid = box.querySelector(':scope > img');
		if (!rows.length) return;
		rows.forEach(function(row, i){ row._spd = 140 + ((i * 53) % 200); row._cur = 0; });
		var midSpd = 80, midCur = 0, target = 0, raf = 0;

		function measure(){
			var r = box.getBoundingClientRect();
			var vh = window.innerHeight;
			var t = (vh - r.top) / (vh + r.height);
			if (t < 0) t = 0; else if (t > 1) t = 1;
			target = t - 0.5;
		}
		function tick(){
			raf = 0;
			var moving = false;
			for (var i = 0; i < rows.length; i++){
				var goal = -target * rows[i]._spd * 2;
				rows[i]._cur += (goal - rows[i]._cur) * 0.1;
				rows[i].style.transform = 'translate3d(0,' + rows[i]._cur.toFixed(1) + 'px,0)';
				if (Math.abs(goal - rows[i]._cur) > 0.15) moving = true;
			}
			if (mid){
				var mg = -target * midSpd * 2;
				midCur += (mg - midCur) * 0.1;
				mid.style.transform = 'translate(-50%, calc(-50% + ' + midCur.toFixed(1) + 'px))';
				if (Math.abs(mg - midCur) > 0.15) moving = true;
			}
			if (moving) raf = requestAnimationFrame(tick);
		}
		function onScroll(){ measure(); if (!raf) raf = requestAnimationFrame(tick); }
		measure();
		rows.forEach(function(row){ row._cur = -target * row._spd * 2; });
		midCur = -target * midSpd * 2;
		tick();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll, { passive: true });
	})();

	(function(){
		var grid = document.querySelector('.hero__grid--video .grid-float');
		if (!grid) return;
		var rows = [].slice.call(grid.querySelectorAll('.row'));
		if (!rows.length) return;
		var SPEED = 38;
		function build(){
			rows.forEach(function(row){
				if (row.querySelector('.vmarq')) return;
				var track = document.createElement('div');
				track.className = 'vmarq';
				var els = [].slice.call(row.children);
				els.forEach(function(e){ track.appendChild(e); });
				els.forEach(function(e){ track.appendChild(e.cloneNode(true)); });
				row.appendChild(track);
			});
		}
		function measure(){
			rows.forEach(function(row, idx){
				var track = row.querySelector('.vmarq');
				if (!track) return;
				var gap = parseFloat(getComputedStyle(track).rowGap) || 15;
				var kids = track.children, half = kids.length / 2, setH = 0;
				for (var k = 0; k < half; k++) setH += kids[k].offsetHeight;
				setH += half * gap;
				if (setH < 1) return;
				track.style.setProperty('--seth', setH + 'px');
				var dur = (setH / SPEED).toFixed(2);
				var dir = (idx % 2 === 0) ? 'down' : 'up';
				track.style.animation = 'vmarq-' + dir + ' ' + dur + 's linear infinite';
			});
		}
		build();
		if (document.readyState === 'complete') measure();
		else window.addEventListener('load', measure);
		var mT;
		window.addEventListener('resize', function(){ clearTimeout(mT); mT = setTimeout(measure, 200); });
	})();

	(function(){
		var sec = document.querySelector('.why__us');
		if (!sec) return;
		var pin = sec.querySelector('.why__pin');
		var ow = sec.querySelector('.outer__why');
		var elems = [].slice.call(sec.querySelectorAll('.why__grid>.elem'));
		var n = elems.length;
		if (!pin || !ow || !n) return;
		var step = 0, active = -1;
		function setPull(){
			var pad = parseFloat(getComputedStyle(pin).paddingTop) || 0;
			sec.style.setProperty('--why-pull', Math.round(pad + ow.offsetHeight) + 'px');
		}
		function setActive(idx){
			if (idx === active) return;
			active = idx;
			elems.forEach(function(e, i){
				e.classList.toggle('active', i === idx);
				e.classList.toggle('is-past', i < idx);
			});
		}
		function layout(){
			setPull();
			step = Math.round(window.innerHeight * 0.85);
			sec.style.height = (window.innerHeight + n * step) + 'px';
		}
		function update(){
			ticking = false;
			if (!step) return;
			var top = sec.getBoundingClientRect().top;
			var idx = Math.round((-top) / step);
			if (idx < 0) idx = 0; else if (idx > n - 1) idx = n - 1;
			setActive(idx);
		}
		var ticking = false;
		function onScroll(){
			if (!ticking){ ticking = true; requestAnimationFrame(update); }
		}
		function relayout(){ layout(); update(); }
		layout();
		setActive(0);
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', relayout);
		window.addEventListener('load', relayout);
		if (window.ResizeObserver){
			new ResizeObserver(relayout).observe(ow);
		}
		if (document.fonts && document.fonts.ready){
			document.fonts.ready.then(relayout);
		}
	})();

	(function(){
		var hero = document.querySelector('.hero__template');
		if (!hero) return;
		var pin = hero.querySelector('.hero__pin');
		var main = hero.querySelector('.inn');
		if (!pin || !main) return;
		var content = main.querySelector('.desc') || main.querySelector('.outer__template');
		var scatters = [].slice.call(pin.children).filter(function(c){ return c.tagName === 'IMG'; });

		var END = [-280, -400, -220, -360, -300, -250, -420, -240];

		function clamp(v, a, b){ return v < a ? a : (v > b ? b : v); }
		function seg(p, a, b){ return clamp((p - a) / (b - a), 0, 1); }

		function render(p){
			var ms = seg(p, 0, 0.22);
			main.style.transform = 'scale(' + (1 - ms * 0.75).toFixed(4) + ')';
			main.style.borderRadius = (ms * 45).toFixed(1) + 'px';

			if (content){
				var cp = seg(p, 0.02, 0.10);
				content.style.opacity = (1 - cp).toFixed(3);
				content.style.transform = 'translateY(' + (-60 * cp).toFixed(1) + 'px)';
				content.style.visibility = cp >= 1 ? 'hidden' : '';
				content.style.pointerEvents = cp >= 1 ? 'none' : '';
			}

			var op = seg(p, 0.06, 0.14);
			for (var i = 0; i < scatters.length; i++){
				var start = 400 + i * 30;
				var end = END[i] != null ? END[i] : -300;
				scatters[i].style.opacity = op.toFixed(3);
				scatters[i].style.transform = 'translate3d(0,' + (start + (end - start) * p).toFixed(1) + 'px,0)';
			}
		}

		var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		var target = 0, cur = -1, pEnd = 0.6;
		function measure(){
			var H = hero.offsetHeight;
			if (H > 0){
				target = clamp(-hero.getBoundingClientRect().top / H, 0, 1);
				var vh = window.innerHeight || document.documentElement.clientHeight || 800;
				pEnd = Math.max(0.3, 1 - vh / H);
			}
		}
		function tick(){
			requestAnimationFrame(tick);
			measure();
			if (cur < 0) cur = target;
			var gate = seg(Math.max(cur, target), pEnd * 0.7, pEnd * 0.97);
			var k = reduce ? 1 : (0.09 + 0.91 * gate * gate);
			cur += (target - cur) * k;
			if (Math.abs(target - cur) < 0.0004) cur = target;
			render(cur);
		}
		window.addEventListener('resize', measure);
		window.addEventListener('load', measure);
		measure();
		requestAnimationFrame(tick);
	})();

	(function(){
		var sec = document.querySelector('.markets__dead');
		if (!sec) return;
		var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		var played = false;
		function play(){
			if (played) return; played = true;
			if (reduce){ sec.className += ' m-skull m-bones m-title'; return; }
			sec.classList.add('m-skull');
			setTimeout(function(){ sec.classList.add('m-bones'); }, 700);
			setTimeout(function(){ sec.classList.add('m-title'); }, 1500);
			setTimeout(function(){ sec.classList.add('m-video'); $('.markets__dead .dots-fx').css("opacity" ,"0"); $('.markets__dead .circle').css("opacity" ,"0"); }, 4800);
		}
		if (window.IntersectionObserver){
			var io = new IntersectionObserver(function(es){
				if (es[0].isIntersecting){ play(); io.disconnect(); }
			}, { threshold: 0.35 });
			io.observe(sec);
		} else { play(); }
	})();

	(function(){
		var hero = document.querySelector('.hero__graphic--design');
		if (!hero) return;
		var stage = hero.querySelector('.tickets-orbit');
		if (!stage) return;
		var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		var IMGS = ['img/design-ticket-1.webp','img/design-ticket-2.webp','img/design-ticket-3.webp',
			'img/design-ticket-4.webp','img/design-ticket-5.webp','img/design-ticket-6.webp','img/design-ticket-7.webp'];
		var SPEED = 0.045;
		var TILT = 9;
		var RINGS = [
			{ rf: 0.30, size: 74,  count: 9  },
			{ rf: 0.55, size: 96,  count: 13 },
			{ rf: 0.82, size: 120, count: 17 },
			{ rf: 1.10, size: 146, count: 21 }
		];

		var content = hero.querySelector('.outer__graphic') || hero.querySelector('.container');
		var W = 0, H = 0, cx = 0, cy = 0, baseR = 0, scale = 1;
		function measure(){
			W = hero.offsetWidth; H = hero.offsetHeight;
			cx = W / 2; cy = H / 2;
			if (content){
				var hr = hero.getBoundingClientRect();
				var head = content.querySelector('.h2-title, h1, h2');
				var btns = content.querySelector('.btns');
				var a = (head || content).getBoundingClientRect();
				var z = (btns || head || content).getBoundingClientRect();
				cx = (a.left + a.right) / 2 - hr.left;
				cy = (a.top + z.bottom) / 2 - hr.top;
			}
			hero.style.setProperty('--hero-fx', cx + 'px');
			hero.style.setProperty('--hero-fy', cy + 'px');
			var block = Math.max(W, 940);
			baseR = block / 2;
			scale = Math.max(0.83, Math.min(1.05, block / 1440));
		}
		measure();
		var fewer = W < 1000;

		var cards = [], imgIdx = 0;
		RINGS.forEach(function(ring, ri){
			var n = fewer ? Math.max(4, Math.round(ring.count * 0.66)) : ring.count;
			for (var k = 0; k < n; k++){
				var el = document.createElement('div'); el.className = 'ticket';
				var im = document.createElement('img'); im.src = IMGS[imgIdx % IMGS.length]; im.alt = ''; imgIdx++;
				el.appendChild(im); stage.appendChild(el);
				var a0 = (k / n) * Math.PI * 2 + ri * (Math.PI / n);
				cards.push({ el: el, ring: ri, a0: a0, tilt: Math.round(Math.sin(a0 * 1.6 + ri) * TILT) });
			}
		});
		function sizeAll(){
			for (var i = 0; i < cards.length; i++){
				cards[i].el.firstChild.style.width = Math.round(RINGS[cards[i].ring].size * scale) + 'px';
			}
		}
		sizeAll();
		(function preloadTickets(){
			var left = IMGS.length, shown = false;
			function reveal(){ if (shown) return; shown = true; for (var i = 0; i < cards.length; i++) cards[i].el.style.opacity = '1'; }
			IMGS.forEach(function(src){ var im = new Image(); im.onload = im.onerror = function(){ if (--left <= 0) reveal(); }; im.src = src; });
			setTimeout(reveal, 1500);
		})();

		function place(elapsed){
			var rot = SPEED * elapsed;
			for (var i = 0; i < cards.length; i++){
				var c = cards[i], ring = RINGS[c.ring];
				var a = c.a0 + rot;
				var R = ring.rf * baseR;
				var x = cx + Math.cos(a) * R;
				var y = cy + Math.sin(a) * R;
				var deg = a * 180 / Math.PI + 90;
				c.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + deg.toFixed(1) + 'deg)';
			}
		}

		var last = 0, elapsed = 0, raf = 0, running = false;
		function frame(ts){ if (!last) last = ts; elapsed += (ts - last) / 1000; last = ts; place(elapsed); if (running) raf = requestAnimationFrame(frame); }
		function start(){ if (running) return; running = true; last = 0; raf = requestAnimationFrame(frame); }
		function stop(){ running = false; cancelAnimationFrame(raf); }

		window.addEventListener('resize', function(){ var pw = W; measure(); if (W !== pw) sizeAll(); place(elapsed); });

		place(0);
		if (reduce) return;
		if (window.IntersectionObserver){
			new IntersectionObserver(function(es){ es[0].isIntersecting ? start() : stop(); }).observe(hero);
		} else { start(); }
	})();

	(function(){
    var host = document.querySelector('.testimonial__wrapper .outer__testimonial .comment>p');
    if (!host) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce){ host.style.visibility = 'visible'; return; }
    var full = host.textContent;
    host.style.minHeight = host.offsetHeight + 'px';
    var typed = document.createElement('span');
    var caret = document.createElement('span');
    caret.className = 'type-caret';
    caret.setAttribute('aria-hidden', 'true');
    host.textContent = '';
    host.appendChild(typed);
    host.appendChild(caret);
    host.style.visibility = 'visible';
    var i = 0, started = false;

    function rand(a, b){ return a + Math.random() * (b - a); }

    function delayAfter(ch){
        if (ch === '.' || ch === '!' || ch === '?') return rand(140, 210);
        if (ch === ',' || ch === ';' || ch === ':') return rand(85, 125);
        if (ch === ' ') return rand(32, 55);
        return rand(26, 46);
    }

    function step(){
        if (i >= full.length){
            setTimeout(function(){ if (caret.parentNode) caret.parentNode.removeChild(caret); }, 1000);
            return;
        }
        var ch = full.charAt(i++);
        typed.textContent += ch;
        setTimeout(step, delayAfter(ch));
    }

    function start(){ if (started) return; started = true; setTimeout(step, 200); }

    if (window.IntersectionObserver){
        new IntersectionObserver(function(es, ob){ if (es[0].isIntersecting){ start(); ob.disconnect(); } }, { threshold: 0.35 }).observe(host);
    } else { start(); }
})();

	(function(){
		var link = document.querySelector('a[href="#contact-form"]');
		var target = document.getElementById('contact-form');
		if (!link || !target) return;
		link.addEventListener('click', function(e){
			e.preventDefault();
			target.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
	})();

	(function(){
		var road = document.querySelector('.roadmap');
		if (!road) return;
		var box = road.querySelector('.map__box');
		if (!box) return;
		if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		var steps = box.querySelectorAll('.step');
		road.classList.add('roadmap-anim');
		var done = false;
		function reveal(){
			if (done) return; done = true;
			road.classList.add('roadmap-in');
			Array.prototype.forEach.call(steps, function(st, i){
				setTimeout(function(){ st.classList.add('rm-in'); }, 180 * i);
			});
		}
		if (window.IntersectionObserver){
			new IntersectionObserver(function(es, ob){ if (es[0].isIntersecting){ reveal(); ob.disconnect(); } }, { threshold: 0.3 }).observe(box);
		} else { reveal(); }
	})();

	(function(){
		var tiles = document.querySelectorAll('.case__feed .services__grid > .elem');
		if (!tiles.length) return;
		Array.prototype.forEach.call(tiles, function(t){
			t.addEventListener('pointermove', function(e){
				var r = t.getBoundingClientRect();
				t.style.setProperty('--mx', (e.clientX - r.left) + 'px');
				t.style.setProperty('--my', (e.clientY - r.top) + 'px');
			});
		});
	})();

	(function(){
		var FADE = 1.0;
		var vids = document.querySelectorAll('.cta__wrapper.cta-team video[loop], .hero__middle.hero-typing video[loop]');
		Array.prototype.forEach.call(vids, function(v){
			if (v.__seam || !v.muted && !v.hasAttribute('muted')) return;
			v.__seam = true;

			var baseOp = parseFloat(getComputedStyle(v).opacity) || 1;
			var clone = v.cloneNode(true);
			clone.removeAttribute('autoplay');
			clone.removeAttribute('loop');
			clone.setAttribute('aria-hidden', 'true');
			clone.muted = true;
			clone.preload = 'auto';
			v.removeAttribute('loop');
			v.style.transition = 'opacity ' + FADE + 's ease';
			clone.style.transition = 'opacity ' + FADE + 's ease';
			clone.style.opacity = '0';
			v.parentNode.insertBefore(clone, v.nextSibling);
			try { clone.pause(); } catch (e) {}

			if (getComputedStyle(clone).position === 'static'){
				var par = v.parentNode;
				if (getComputedStyle(par).position === 'static') par.style.position = 'relative';
				clone.style.position = 'absolute';
				var place = function(){
					clone.style.left = v.offsetLeft + 'px';
					clone.style.top = v.offsetTop + 'px';
					clone.style.width = v.clientWidth + 'px';
					clone.style.height = v.clientHeight + 'px';
				};
				place();
				window.addEventListener('resize', place);
			}

			var A = v, B = clone, fading = false;
			function check(){
				if (this !== A || fading) return;
				var d = A.duration;
				if (!d || !isFinite(d) || d <= FADE * 2) return;
				if (d - A.currentTime <= FADE){
					fading = true;
					try { B.currentTime = 0; } catch (e) {}
					var p = B.play();
					if (p && p.catch) p.catch(function(){});
					B.style.opacity = String(baseOp);
					A.style.opacity = '0';
					setTimeout(function(){
						try { A.pause(); } catch (e) {}
						var t = A; A = B; B = t;
						fading = false;
					}, FADE * 1000 + 120);
				}
			}
			v.addEventListener('timeupdate', check);
			clone.addEventListener('timeupdate', check);
			function onEnd(){ if (this === A){ try { this.currentTime = 0; } catch (e) {} this.play(); } }
			v.addEventListener('ended', onEnd);
			clone.addEventListener('ended', onEnd);
		});
	})();

	function initLightRays(wrap){
		var canvas = wrap && wrap.querySelector('.light-rays');
		if (!canvas) return;
		var ctx = canvas.getContext('2d');
		if (!ctx) return;
		var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		var COLOR = '0,255,138';
		var N = 26;
		var rays = [];
		for (var i = 0; i < N; i++){
			var wide = i % 3 === 0;
			rays.push({
				p: N === 1 ? 0.5 : i / (N - 1),
				w: wide ? 0.09 + Math.random() * 0.16
				        : 0.016 + Math.random() * 0.052,
				amp: 0.015 + Math.random() * 0.035,
				sp: 0.03 + Math.random() * 0.06,
				ph: Math.random() * Math.PI * 2,
				ip: (wide ? 0.35 : 0.5) + Math.random() * 0.5,
				ips: 0.05 + Math.random() * 0.09,
				iph: Math.random() * Math.PI * 2,
				d: 0.35 + Math.random() * 0.65
			});
		}

		var W = 0, H = 0, dpr = 1, raf = 0, inView = true;
		function layout(){
			var r = wrap.getBoundingClientRect();
			W = r.width;
			H = r.height;
			dpr = Math.min(window.devicePixelRatio || 1, H > 2200 ? 1 : 2);
			canvas.width = Math.round(W * dpr);
			canvas.height = Math.round(H * dpr);
		}

		function frame(t){
			var rect = wrap.getBoundingClientRect();
			var vh = window.innerHeight || 800;
			var par = Math.max(-1, Math.min(1, -rect.top / vh));
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, W, H);
			ctx.globalCompositeOperation = 'lighter';
			var L = Math.hypot(W, H) * 1.15;
			var spread = 1.05;
			var down = Math.PI / 2 + 0.55;
			for (var i = 0; i < rays.length; i++){
				var ry = rays[i];
				var ox = W + 120 - par * W * 0.07 * ry.d;
				var oy = -W * 0.12 + par * 180 * ry.d;
				var a = down + (ry.p - 0.5) * spread
					+ Math.sin(t * ry.sp + ry.ph) * ry.amp
					+ Math.sin(t * 0.025 * ry.d + ry.iph) * 0.05 * ry.d;
				var al = ry.ip * (0.6 + 0.4 * Math.sin(t * ry.ips + ry.iph));
				var g = ctx.createLinearGradient(ox, oy, ox + Math.cos(a) * L, oy + Math.sin(a) * L);
				g.addColorStop(0, 'rgba(' + COLOR + ',' + (0.22 * al).toFixed(3) + ')');
				g.addColorStop(0.65, 'rgba(' + COLOR + ',' + (0.085 * al).toFixed(3) + ')');
				g.addColorStop(1, 'rgba(' + COLOR + ',0)');
				ctx.fillStyle = g;
				ctx.beginPath();
				ctx.moveTo(ox, oy);
				ctx.lineTo(ox + Math.cos(a - ry.w) * L, oy + Math.sin(a - ry.w) * L);
				ctx.lineTo(ox + Math.cos(a + ry.w) * L, oy + Math.sin(a + ry.w) * L);
				ctx.closePath();
				ctx.fill();
			}
		}

		function loop(now){
			raf = requestAnimationFrame(loop);
			if (!W || !H || !inView) return;
			frame(now / 1000);
		}

		layout();
		var rt;
		window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(layout, 120); });
		if (reduce){ frame(0); return; }
		if (window.IntersectionObserver){
			new IntersectionObserver(function(es){ inView = es[0].isIntersecting; }).observe(wrap.closest('.how__works') || wrap);
		}
		raf = requestAnimationFrame(loop);
	}
	Array.prototype.forEach.call(document.querySelectorAll('.reviews__wrapper, .how__works .how-fx'), initLightRays);
});