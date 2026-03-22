/**
 * Canvas-based confetti — no external library.
 * Two cannons fire from the bottom corners, particles arc up and fall with rotation.
 */

const COLORS = [
	"#6366f1", // indigo
	"#f59e0b", // amber
	"#10b981", // emerald
	"#ef4444", // red
	"#8b5cf6", // violet
	"#06b6d4", // cyan
	"#f97316", // orange
	"#ec4899", // pink
	"#84cc16", // lime
	"#14b8a6", // teal
];

interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	color: string;
	w: number;
	h: number;
	rot: number;
	rotV: number;
	alpha: number;
	shape: "rect" | "circle";
}

const GRAVITY = 0.38;
const DRAG = 0.985;
const COUNT = 160;

let canvas: HTMLCanvasElement | null = null;
let raf: number | null = null;
let particles: Particle[] = [];

function createCanvas(): HTMLCanvasElement {
	if (canvas) return canvas;
	canvas = document.createElement("canvas");
	canvas.style.cssText =
		"position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;";
	document.body.appendChild(canvas);
	return canvas;
}

function resize(c: HTMLCanvasElement) {
	c.width = window.innerWidth;
	c.height = window.innerHeight;
}

function spawnCannon(
	list: Particle[],
	cx: number,
	cy: number,
	count: number,
	angleDeg: [number, number],
) {
	for (let i = 0; i < count; i++) {
		const angle =
			((angleDeg[0] + Math.random() * (angleDeg[1] - angleDeg[0])) * Math.PI) /
			180;
		const speed = Math.random() * 13 + 7;
		list.push({
			x: cx + (Math.random() - 0.5) * 30,
			y: cy,
			vx: Math.cos(angle) * speed,
			vy: -Math.sin(angle) * speed,
			color: COLORS[Math.floor(Math.random() * COLORS.length)],
			w: Math.random() * 7 + 5,
			h: Math.random() * 4 + 3,
			rot: Math.random() * Math.PI * 2,
			rotV: (Math.random() - 0.5) * 0.28,
			alpha: 1,
			shape: Math.random() > 0.7 ? "circle" : "rect",
		});
	}
}

function drawParticle(ctx2d: CanvasRenderingContext2D, p: Particle) {
	ctx2d.save();
	ctx2d.globalAlpha = p.alpha;
	ctx2d.fillStyle = p.color;
	ctx2d.translate(p.x, p.y);
	ctx2d.rotate(p.rot);
	if (p.shape === "circle") {
		ctx2d.beginPath();
		ctx2d.arc(0, 0, p.w / 2, 0, Math.PI * 2);
		ctx2d.fill();
	} else {
		ctx2d.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
	}
	ctx2d.restore();
}

function loop(c: HTMLCanvasElement) {
	const ctx2d = c.getContext("2d");
	if (!ctx2d) return;

	ctx2d.clearRect(0, 0, c.width, c.height);

	particles = particles.filter((p) => p.alpha > 0.02 && p.y < c.height + 60);

	for (const p of particles) {
		p.vy += GRAVITY;
		p.vx *= DRAG;
		p.x += p.vx;
		p.y += p.vy;
		p.rot += p.rotV;
		// fade out as they fall past mid-screen or get old
		if (p.y > c.height * 0.6) {
			p.alpha -= 0.016;
		}
		drawParticle(ctx2d, p);
	}

	if (particles.length > 0) {
		raf = requestAnimationFrame(() => loop(c));
	} else {
		cleanup();
	}
}

function cleanup() {
	if (raf !== null) {
		cancelAnimationFrame(raf);
		raf = null;
	}
	if (canvas) {
		canvas.remove();
		canvas = null;
	}
	particles = [];
}

/**
 * Fire a confetti burst. Call this on major success actions.
 * Two cannons launch from the bottom-left and bottom-right corners.
 */
export function burst() {
	// If already running, restart
	if (raf !== null) {
		cancelAnimationFrame(raf);
		raf = null;
	}

	const c = createCanvas();
	resize(c);

	const w = c.width;
	const h = c.height;

	particles = [];
	// Left cannon — angles 35°–80° (upward-right)
	spawnCannon(particles, w * 0.12, h * 0.92, COUNT / 2, [35, 80]);
	// Right cannon — angles 100°–145° (upward-left)
	spawnCannon(particles, w * 0.88, h * 0.92, COUNT / 2, [100, 145]);

	raf = requestAnimationFrame(() => loop(c));
}
