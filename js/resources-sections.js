/*
 * Resources page — switcher with per-tab content panels + fade reveal.
 * Each tab owns its own copy of the content blocks. Switching hides the other
 * panels entirely and the chosen one's blocks appear with a fade (in view
 * straight away, the rest as they scroll into view).
 */
(function () {
	var wrapper = document.querySelector('.resources__list--wrapper');
	if (!wrapper) return;
	var list = wrapper.querySelector('.resources__list');
	var tabs = list ? Array.prototype.slice.call(list.querySelectorAll('a')) : [];
	var origBlocks = Array.prototype.slice.call(wrapper.querySelectorAll('.resource__el'));
	if (!origBlocks.length) return;

	var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
		entries.forEach(function (en) {
			if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
		});
	}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }) : null;

	// Move the original blocks into the first panel, then clone one panel per tab.
	var panelsWrap = document.createElement('div');
	panelsWrap.className = 'resource__panels';
	var firstPanel = document.createElement('div');
	firstPanel.className = 'resource__panel is-active';
	origBlocks.forEach(function (b) { firstPanel.appendChild(b); });
	panelsWrap.appendChild(firstPanel);
	wrapper.appendChild(panelsWrap);

	var panels = [firstPanel];
	var count = Math.max(tabs.length, 1);
	for (var i = 1; i < count; i++) {
		var clone = firstPanel.cloneNode(true);
		clone.classList.remove('is-active');
		panelsWrap.appendChild(clone);
		panels.push(clone);
	}

	function revealPanel(panel) {
		var els = panel.querySelectorAll('.resource__el');
		Array.prototype.forEach.call(els, function (el) {
			el.classList.add('js-reveal');
			el.classList.remove('is-visible');
			if (io) io.observe(el);
			else el.classList.add('is-visible');
		});
	}

	function activate(idx) {
		if (!panels[idx]) return;
		panels.forEach(function (p, i) {
			if (i === idx) return;
			p.classList.remove('is-active');
			if (io) Array.prototype.forEach.call(p.querySelectorAll('.resource__el'), function (el) { io.unobserve(el); });
		});
		panels[idx].classList.add('is-active');
		revealPanel(panels[idx]);
	}

	tabs.forEach(function (tab, i) {
		tab.addEventListener('click', function (e) {
			e.preventDefault();
			tabs.forEach(function (t) { t.classList.remove('current'); });
			tab.classList.add('current');
			activate(i);
		});
	});

	// initial reveal of the active panel
	revealPanel(firstPanel);
})();
