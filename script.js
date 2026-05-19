const signals = [
  "C++17 request pipelines reduced data-processing latency by 35%",
  "lock-free queues and condition variables sustained 10k+ concurrent requests",
  "gRPC and Protobuf pub/sub cut serialized payload size by 40%",
  "Valgrind, perf, and sanitizers eliminated 12+ memory and CPU defects",
  "CMake, Ninja, and clang-tidy cut compile time by 45%",
  "embedded diagnostics reduced unplanned downtime by 28%"
];

const dynamicSignal = document.querySelector("#dynamic-signal");
let signalIndex = 0;
let charIndex = 0;
let deleting = false;

function typeSignal() {
  const phrase = signals[signalIndex];
  dynamicSignal.textContent = phrase.slice(0, charIndex) || "\u00a0";

  if (!deleting && charIndex < phrase.length) {
    charIndex += 1;
    setTimeout(typeSignal, 34);
    return;
  }

  if (!deleting && charIndex === phrase.length) {
    deleting = true;
    setTimeout(typeSignal, 1500);
    return;
  }

  if (deleting && charIndex > 0) {
    charIndex -= 1;
    setTimeout(typeSignal, 18);
    return;
  }

  deleting = false;
  signalIndex = (signalIndex + 1) % signals.length;
  setTimeout(typeSignal, 240);
}

if (dynamicSignal) typeSignal();

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });

document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const metricObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const target = entry.target;
    const finalValue = Number(target.dataset.count);
    const duration = 980;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      target.textContent = Math.round(finalValue * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
    metricObserver.unobserve(target);
  });
}, { threshold: 0.4 });

document.querySelectorAll("[data-count]").forEach((metric) => metricObserver.observe(metric));

const canvas = document.querySelector("#kernel-canvas");
const ctx = canvas.getContext("2d");
let width = 0;
let height = 0;
let deviceScale = Math.min(window.devicePixelRatio || 1, 2);
let nodes = [];
let traces = [];

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  deviceScale = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(width * deviceScale);
  canvas.height = Math.floor(height * deviceScale);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(deviceScale, 0, 0, deviceScale, 0, 0);

  const nodeCount = width < 640 ? 42 : 82;
  const traceCount = width < 640 ? 10 : 20;
  nodes = Array.from({ length: nodeCount }, () => createNode(true));
  traces = Array.from({ length: traceCount }, () => createTrace());
}

function createNode(randomizeY = false) {
  return {
    x: Math.random() * width,
    y: randomizeY ? Math.random() * height : height + Math.random() * 120,
    vx: 0.12 + Math.random() * 0.44,
    vy: -0.09 - Math.random() * 0.24,
    size: 1 + Math.random() * 2.6,
    phase: Math.random() * Math.PI * 2,
    hue: Math.random() > 0.66 ? "246, 178, 79" : Math.random() > 0.42 ? "102, 242, 170" : "98, 214, 255"
  };
}

function createTrace() {
  return {
    x: -140 - Math.random() * width,
    y: height * (0.16 + Math.random() * 0.7),
    length: 100 + Math.random() * 260,
    speed: 0.7 + Math.random() * 1.4,
    height: 8 + Math.random() * 32,
    alpha: 0.08 + Math.random() * 0.16,
    hue: Math.random() > 0.5 ? "98, 214, 255" : "102, 242, 170"
  };
}

function drawCanvas(time) {
  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = 1;

  traces.forEach((trace, index) => {
    trace.x += trace.speed;
    if (trace.x > width + 180) traces[index] = createTrace();

    ctx.beginPath();
    for (let i = 0; i < 11; i += 1) {
      const x = trace.x + (trace.length / 10) * i;
      const y = trace.y + Math.sin(time * 0.002 + i * 0.8) * trace.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(${trace.hue}, ${trace.alpha})`;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(trace.x + trace.length, trace.y, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${trace.hue}, ${trace.alpha + 0.22})`;
    ctx.fill();
  });

  nodes.forEach((node, index) => {
    const wave = Math.sin(time * 0.001 + node.phase) * 0.3;
    node.x += node.vx + wave;
    node.y += node.vy;

    if (node.x > width + 24 || node.y < -24) {
      nodes[index] = createNode(false);
      nodes[index].x = -24;
      nodes[index].y = height * (0.14 + Math.random() * 0.76);
      return;
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${node.hue}, 0.45)`;
    ctx.fill();

    const neighbor = nodes[index + 1];
    if (neighbor) {
      const dx = node.x - neighbor.x;
      const dy = node.y - neighbor.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 150) {
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(neighbor.x, neighbor.y);
        ctx.strokeStyle = `rgba(${node.hue}, ${0.13 * (1 - distance / 150)})`;
        ctx.stroke();
      }
    }
  });

  requestAnimationFrame(drawCanvas);
}

resizeCanvas();
requestAnimationFrame(drawCanvas);
window.addEventListener("resize", resizeCanvas, { passive: true });
