(function () {
	var wrapper = document.querySelector('.resources__list--wrapper');
	if (!wrapper) return;
	var list = wrapper.querySelector('.resources__list');
	var tabs = list ? Array.prototype.slice.call(list.querySelectorAll('a')) : [];
	var blocks = Array.prototype.slice.call(wrapper.querySelectorAll('.resource__el'));
	if (!blocks.length) return;

	var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
		entries.forEach(function (en) {
			if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
		});
	}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }) : null;

	blocks.forEach(function (b, i) {
		if (!b.id) b.id = 'resource-sec-' + (i + 1);
		b.classList.add('js-reveal');
		if (io) io.observe(b);
		else b.classList.add('is-visible');
	});

	function blockFor(i) { return blocks[Math.min(i, blocks.length - 1)]; }
	var spyLock = 0;

	var bar = wrapper.querySelector(':scope > .container');
	var barH = 120;
	function measureBar() {
		if (bar) barH = bar.offsetHeight || 120;
		blocks.forEach(function (b) { b.style.scrollMarginTop = (barH + 16) + 'px'; });
	}
	measureBar();
	window.addEventListener('resize', measureBar);

	var lastIdx = -1;
	function setCurrent(idx) {
		if (idx === lastIdx) return;
		lastIdx = idx;
		tabs.forEach(function (t, k) { t.classList.toggle('current', k === idx); });
		var t = tabs[idx];
		if (t && list && list.scrollWidth > list.clientWidth + 4) {
			var left = t.getBoundingClientRect().left - list.getBoundingClientRect().left + list.scrollLeft;
			list.scrollTo({ left: left + t.offsetWidth / 2 - list.clientWidth / 2, behavior: 'smooth' });
		}
	}

	tabs.forEach(function (tab, i) {
		var target = blockFor(i);
		tab.setAttribute('href', '#' + target.id);
		tab.addEventListener('click', function (e) {
			e.preventDefault();
			setCurrent(i);
			spyLock = Date.now() + 1100;
			target.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
	});

	function spy() {
		if (Date.now() < spyLock) return;
		var line = barH + 60;
		var idx = 0;
		for (var i = 0; i < blocks.length; i++) {
			if (blocks[i].getBoundingClientRect().top <= line) idx = i;
		}
		setCurrent(Math.min(idx, tabs.length - 1));
	}
	var ticking = false;
	window.addEventListener('scroll', function () {
		if (ticking) return;
		ticking = true;
		requestAnimationFrame(function () { ticking = false; spy(); });
	}, { passive: true });
	spy();
})();
