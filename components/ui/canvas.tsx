"use client";

/* ============================================================
   Canvas hero effect — bunte Linien, die der Maus folgen.
   Originally from Ali Imam (Aceternity-style). Stripped of
   external deps, kept the math identical.
   Use:
     <canvas id="canvas" className="..." />
     useEffect(() => { renderCanvas(); }, []);
   ============================================================ */

interface OscillatorOpts {
  phase?: number;
  offset?: number;
  frequency?: number;
  amplitude?: number;
}

class Oscillator {
  phase: number;
  offset: number;
  frequency: number;
  amplitude: number;
  value = 0;

  constructor(opts: OscillatorOpts = {}) {
    this.phase = opts.phase ?? 0;
    this.offset = opts.offset ?? 0;
    this.frequency = opts.frequency ?? 0.001;
    this.amplitude = opts.amplitude ?? 1;
  }

  update(): number {
    this.phase += this.frequency;
    this.value = this.offset + Math.sin(this.phase) * this.amplitude;
    return this.value;
  }
}

interface Settings {
  debug: boolean;
  friction: number;
  trails: number;
  size: number;
  dampening: number;
  tension: number;
}

const E: Settings = {
  debug: true,
  friction: 0.5,
  trails: 80,
  size: 50,
  dampening: 0.025,
  tension: 0.99,
};

class Node {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
}

interface LineOpts {
  spring: number;
}

class Line {
  spring: number;
  friction: number;
  nodes: Node[];

  constructor(opts: LineOpts, pos: { x: number; y: number }) {
    this.spring = opts.spring + 0.1 * Math.random() - 0.05;
    this.friction = E.friction + 0.01 * Math.random() - 0.005;
    this.nodes = [];
    for (let i = 0; i < E.size; i++) {
      const n = new Node();
      n.x = pos.x;
      n.y = pos.y;
      this.nodes.push(n);
    }
  }

  update(pos: { x: number; y: number }) {
    let spring = this.spring;
    let t = this.nodes[0];
    t.vx += (pos.x - t.x) * spring;
    t.vy += (pos.y - t.y) * spring;
    for (let i = 0, a = this.nodes.length; i < a; i++) {
      t = this.nodes[i];
      if (i > 0) {
        const n = this.nodes[i - 1];
        t.vx += (n.x - t.x) * spring;
        t.vy += (n.y - t.y) * spring;
        t.vx += n.vx * E.dampening;
        t.vy += n.vy * E.dampening;
      }
      t.vx *= this.friction;
      t.vy *= this.friction;
      t.x += t.vx;
      t.y += t.vy;
      spring *= E.tension;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    let n = this.nodes[0].x;
    let i = this.nodes[0].y;
    ctx.beginPath();
    ctx.moveTo(n, i);
    let a: number;
    const o = this.nodes.length - 2;
    let e: Node = this.nodes[0];
    let t: Node = this.nodes[0];
    for (a = 1; a < o; a++) {
      e = this.nodes[a];
      t = this.nodes[a + 1];
      n = 0.5 * (e.x + t.x);
      i = 0.5 * (e.y + t.y);
      ctx.quadraticCurveTo(e.x, e.y, n, i);
    }
    e = this.nodes[a];
    t = this.nodes[a + 1];
    ctx.quadraticCurveTo(e.x, e.y, t.x, t.y);
    ctx.stroke();
    ctx.closePath();
  }
}

interface RunningContext extends CanvasRenderingContext2D {
  running: boolean;
  frame: number;
}

export const renderCanvas = function () {
  const el = document.getElementById("canvas") as HTMLCanvasElement | null;
  if (!el) return;
  const baseCtx = el.getContext("2d");
  if (!baseCtx) return;
  const ctx = baseCtx as RunningContext;
  ctx.running = true;
  ctx.frame = 1;

  const f = new Oscillator({
    phase: Math.random() * 2 * Math.PI,
    amplitude: 85,
    frequency: 0.0015,
    offset: 285,
  });

  const pos = { x: 0, y: 0 };
  let lines: Line[] = [];

  function resetLines() {
    lines = [];
    for (let i = 0; i < E.trails; i++) {
      lines.push(new Line({ spring: 0.45 + (i / E.trails) * 0.025 }, pos));
    }
  }

  function move(e: MouseEvent | TouchEvent) {
    if ("touches" in e) {
      pos.x = e.touches[0].pageX;
      pos.y = e.touches[0].pageY;
    } else {
      pos.x = (e as MouseEvent).clientX;
      pos.y = (e as MouseEvent).clientY;
    }
    e.preventDefault();
  }

  function startTouch(e: TouchEvent) {
    if (e.touches.length === 1) {
      pos.x = e.touches[0].pageX;
      pos.y = e.touches[0].pageY;
    }
  }

  function onFirstMove(e: MouseEvent | TouchEvent) {
    document.removeEventListener("mousemove", onFirstMove as EventListener);
    document.removeEventListener("touchstart", onFirstMove as EventListener);
    document.addEventListener("mousemove", move as EventListener);
    document.addEventListener("touchmove", move as EventListener);
    document.addEventListener("touchstart", startTouch as EventListener);
    move(e);
    resetLines();
    render();
  }

  function render() {
    if (!ctx.running) return;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "hsla(" + Math.round(f.update()) + ",100%,50%,0.025)";
    ctx.lineWidth = 10;
    for (let i = 0; i < E.trails; i++) {
      const line = lines[i];
      line.update(pos);
      line.draw(ctx);
    }
    ctx.frame++;
    window.requestAnimationFrame(render);
  }

  function resizeCanvas() {
    ctx.canvas.width = window.innerWidth - 20;
    ctx.canvas.height = window.innerHeight;
  }

  document.addEventListener("mousemove", onFirstMove as EventListener);
  document.addEventListener("touchstart", onFirstMove as EventListener);
  document.body.addEventListener("orientationchange", resizeCanvas);
  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("focus", () => {
    if (!ctx.running) {
      ctx.running = true;
      render();
    }
  });
  window.addEventListener("blur", () => {
    ctx.running = true;
  });
  resizeCanvas();
};
