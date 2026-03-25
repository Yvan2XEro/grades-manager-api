const RIPPLE_TARGETS =
	'button, [role="button"], [role="tab"], [role="menuitem"], [role="option"]';

function rippleAt(el: HTMLElement, clientX: number, clientY: number) {
	el.classList.add("ripple-host");
	const rect = el.getBoundingClientRect();
	const size = Math.max(rect.width, rect.height) * 2.4;
	const span = document.createElement("span");
	span.className = "click-ripple";
	span.style.cssText = `width:${size}px;height:${size}px;left:${clientX - rect.left - size / 2}px;top:${clientY - rect.top - size / 2}px`;
	el.appendChild(span);
	span.addEventListener("animationend", () => span.remove(), { once: true });
}

function initCursorBurst() {
	const el = document.createElement("div");
	el.id = "cursor-burst";
	document.body.appendChild(el);
	document.addEventListener("mousedown", (e) => {
		el.style.left = `${e.clientX}px`;
		el.style.top = `${e.clientY}px`;
		el.classList.remove("active");
		void el.offsetWidth; // reflow
		el.classList.add("active");
	});
}

export function initClickEffects() {
	Promise.all([import("./sounds"), import("./haptic")]).then(
		([{ sounds }, { haptic }]) => {
			document.addEventListener("mousedown", (e) => {
				const target = (e.target as HTMLElement).closest<HTMLElement>(
					RIPPLE_TARGETS,
				);
				if (target && !target.hasAttribute("disabled")) {
					const pos = getComputedStyle(target).position;
					if (pos !== "absolute" && pos !== "fixed") {
						rippleAt(target, e.clientX, e.clientY);
					}
					sounds.click();
					haptic.light();
				}
			});
		},
	);
	initCursorBurst();
}

/** Active le curseur wait sur toute la page (ex: pendant une mutation longue) */
export function setCursorWait(active: boolean) {
	document.body.classList.toggle("cursor-wait", active);
}
