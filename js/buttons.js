(function () {
	var ARROW_SVG = '<svg viewBox="0 0 11 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.40909 9.64475L4.38494 8.63055L7.45242 5.56308H0V4.08154H7.45242L4.38494 1.01904L5.40909 -0.000133395L10.2315 4.82231L5.40909 9.64475Z" fill="currentColor"/></svg>';
	function enhance(btn) {
		if (btn.__enh) return;
		btn.__enh = true;

		var inner = document.createElement('span');
		inner.className = 'btn-inner';
		while (btn.firstChild) inner.appendChild(btn.firstChild);

		var halo = document.createElement('span');
		halo.className = 'btn-halo';
		halo.setAttribute('aria-hidden', 'true');

		btn.appendChild(halo);
		btn.appendChild(inner);

		if (btn.classList.contains('outline-btn') && !inner.querySelector('img')) {
			var arrow = document.createElement('span');
			arrow.className = 'btn-arrow';
			arrow.setAttribute('aria-hidden', 'true');
			arrow.innerHTML = ARROW_SVG;
			inner.appendChild(arrow);
		}

		btn.addEventListener('pointermove', function (e) {
			var r = btn.getBoundingClientRect();
			btn.style.setProperty('--mx', (e.clientX - r.left) + 'px');
			btn.style.setProperty('--my', (e.clientY - r.top) + 'px');
		});
	}

	function enhanceFilled(btn) {
		if (btn.__fenh) return;
		var span = btn.querySelector('span');
		var img = span && span.querySelector('img');
		if (!img) return;
		btn.__fenh = true;
		span.classList.add('fb-out');
		var inn = document.createElement('span');
		inn.className = 'fb-in';
		inn.setAttribute('aria-hidden', 'true');
		inn.innerHTML = '<svg class="fb-arrow" width="23" height="10" viewBox="0 0 23 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.40909 9.64475L16.38494 8.63055L19.45242 5.56308H0V4.08154H19.45242L16.38494 1.01904L17.40909 -0.000133395L22.2315 4.82231L17.40909 9.64475Z" fill="currentColor"/></svg>';
		btn.appendChild(inn);
	}

	function run() {
		var list = document.querySelectorAll('.regular-btn, .outline-btn');
		Array.prototype.forEach.call(list, enhance);
		Array.prototype.forEach.call(document.querySelectorAll('.filled-btn'), enhanceFilled);
	}

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
	else run();
})();
