// ── AstroSim AI — Core Application Logic (Rank 1 Build) ──

// Constants
const G = 0.8; 
const MASS_SUN = 5000;
const MASS_PLANET = 100;
const MASS_MOON = 5;

// State Variables
let bodies = [];
let particles = [];
let shockwaves = [];
let isPaused = false;
let simSpeed = 1.0;
let spawnType = 'planet';
let spawnMass = 100;
let spawnVelocity = 1.5;
let showTrails = true;
let showVectors = true;
let activeLab = 'kepler';
let geminiApiKey = localStorage.getItem('gemini_api_key') || null;

// Sound & Speech settings
let soundMuted = false;
let voiceEnabled = true;
let audioCtx = null;
let welcomeGreetingPlayed = false;

// Drawing state
let dragStart = null;
let dragCurrent = null;

// Canvas setup
const canvas = document.getElementById('space-canvas');
const ctx = canvas.getContext('2d');

// High-DPI Retina Canvas Resize Handler
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const parentWidth = canvas.parentElement.clientWidth;
    const parentHeight = canvas.parentElement.clientHeight;

    canvas.width = parentWidth * dpr;
    canvas.height = parentHeight * dpr;
    ctx.scale(dpr, dpr);

    canvas.style.width = parentWidth + 'px';
    canvas.style.height = parentHeight + 'px';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- 1. WEB AUDIO API SYNTHESIZER ---
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSynthesizedSound(type) {
    if (soundMuted) return;
    initAudio();
    if (!audioCtx) return;

    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        if (type === 'spawn') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.35);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        } else if (type === 'collision') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
        } else if (type === 'click') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, now);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        }
    } catch (e) {
        console.warn('Audio playback issue:', e);
    }
}

// --- 2. TEXT-TO-SPEECH VOICE ASSISTANT ---
function speakText(text) {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();

    const cleanText = text.replace(/<\/?[^>]+(>|$)/g, "")
                          .replace(/&times;/g, " times ")
                          .replace(/&radic;/g, " square root of ")
                          .replace(/F_g/g, " Force of gravity ")
                          .replace(/v_c/g, " circular velocity ");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05; 
    utterance.pitch = 1.0;
    
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || 
                        voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) {
        utterance.voice = englishVoice;
    }

    window.speechSynthesis.speak(utterance);
}

function playWelcomeGreeting() {
    if (welcomeGreetingPlayed) return;
    welcomeGreetingPlayed = true;
    speakText("Welcome, Mission Commander! I am your AI Lab Partner. We are currently studying Kepler's Elliptic Orbits. Look at the simulator: I have set up a planet orbiting a massive Sun. Observe how the planet speeds up as it gets closer to the Sun. Why do you think that happens? Try asking me or spawn another planet to compare!");
}

// Class definitions
class Body {
    constructor(x, y, vx, vy, mass, type) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.mass = mass;
        this.type = type; // 'sun', 'planet', 'moon'
        this.radius = this.calculateRadius();
        this.color = this.calculateColor();
        this.colorRgb = this.calculateColorRgb();
        this.trail = [];
    }

    calculateRadius() {
        if (this.type === 'sun') return Math.max(16, Math.min(30, 8 + Math.pow(this.mass, 0.25)));
        if (this.type === 'planet') return Math.max(8, Math.min(15, 4 + Math.pow(this.mass, 0.35)));
        return Math.max(4, Math.min(8, 2 + Math.pow(this.mass, 0.4)));
    }

    calculateColor() {
        if (this.type === 'sun') return '#f59e0b';
        if (this.type === 'planet') return '#a855f7';
        return '#38bdf8';
    }

    calculateColorRgb() {
        if (this.type === 'sun') return '245, 158, 11';
        if (this.type === 'planet') return '168, 85, 247';
        return '56, 189, 248';
    }

    update() {
        this.x += this.vx * simSpeed;
        this.y += this.vy * simSpeed;

        // Wall Boundaries Bouncing (Sticky bug resolved by check-direction logic)
        const logicalWidth = canvas.style.width ? parseInt(canvas.style.width) : canvas.width;
        const logicalHeight = canvas.style.height ? parseInt(canvas.style.height) : canvas.height;

        if (this.type !== 'sun') {
            // Bounce Left Wall
            if (this.x - this.radius < 0 && this.vx < 0) {
                this.x = this.radius;
                this.vx *= -0.8;
                playSynthesizedSound('click');
            } 
            // Bounce Right Wall
            else if (this.x + this.radius > logicalWidth && this.vx > 0) {
                this.x = logicalWidth - this.radius;
                this.vx *= -0.8;
                playSynthesizedSound('click');
            }

            // Bounce Top Wall
            if (this.y - this.radius < 0 && this.vy < 0) {
                this.y = this.radius;
                this.vy *= -0.8;
                playSynthesizedSound('click');
            } 
            // Bounce Bottom Wall
            else if (this.y + this.radius > logicalHeight && this.vy > 0) {
                this.y = logicalHeight - this.radius;
                this.vy *= -0.8;
                playSynthesizedSound('click');
            }
        }

        if (showTrails) {
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > 150) {
                this.trail.shift();
            }
        } else {
            this.trail = [];
        }
    }

    draw(ctx) {
        if (showTrails && this.trail.length > 1) {
            for (let i = 1; i < this.trail.length; i++) {
                ctx.beginPath();
                ctx.moveTo(this.trail[i-1].x, this.trail[i-1].y);
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
                const opacity = (i / this.trail.length) * 0.35;
                ctx.strokeStyle = `rgba(${this.colorRgb}, ${opacity.toFixed(3)})`;
                ctx.lineWidth = 1.8;
                ctx.stroke();
            }
        }

        const gradient = ctx.createRadialGradient(this.x, this.y, 1, this.x, this.y, this.radius * 2.8);
        gradient.addColorStop(0, this.color + '88');
        gradient.addColorStop(0.3, this.color + '33');
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff66';
        ctx.lineWidth = 1.2;
        ctx.stroke();
    }
}

// Physics computations
function applyGravity() {
    if (isPaused) return;

    for (let i = 0; i < bodies.length; i++) {
        let fx = 0;
        let fy = 0;
        const b1 = bodies[i];

        for (let j = 0; j < bodies.length; j++) {
            if (i === j) continue;
            const b2 = bodies[j];

            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const distSq = dx * dx + dy * dy + 100;
            const dist = Math.sqrt(distSq);

            const force = (G * b1.mass * b2.mass) / distSq;
            fx += force * (dx / dist);
            fy += force * (dy / dist);
        }

        b1.vx += (fx / b1.mass) * simSpeed;
        b1.vy += (fy / b1.mass) * simSpeed;
    }

    // Accretion
    for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
            const b1 = bodies[i];
            const b2 = bodies[j];

            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < b1.radius + b2.radius) {
                const host = b1.mass >= b2.mass ? b1 : b2;
                const guest = b1.mass < b2.mass ? b1 : b2;

                const totalMass = host.mass + guest.mass;
                host.vx = (host.vx * host.mass + guest.vx * guest.mass) / totalMass;
                host.vy = (host.vy * host.mass + guest.vy * guest.mass) / totalMass;
                
                host.x = (host.x * host.mass + guest.x * guest.mass) / totalMass;
                host.y = (host.y * host.mass + guest.y * guest.mass) / totalMass;
                
                host.mass = totalMass;
                host.radius = host.calculateRadius();

                spawnExplosion(guest.x, guest.y, guest.color);
                
                shockwaves.push({
                    x: guest.x,
                    y: guest.y,
                    radius: host.radius,
                    maxRadius: host.radius * 4,
                    alpha: 1.0,
                    color: host.color
                });

                playSynthesizedSound('collision');

                bodies = bodies.filter(b => b !== guest);
                notifyAIOfterEvent('collision', host, guest);
                return;
            }
        }
    }
}

// Particle System
function spawnExplosion(x, y, color) {
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            radius: Math.random() * 3.5 + 1,
            color: color,
            alpha: 1.0,
            decay: Math.random() * 0.025 + 0.015
        });
    }
}

function updateAndDrawEffects(ctx) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.restore();
    }

    for (let i = shockwaves.length - 1; i >= 0; i--) {
        const s = shockwaves[i];
        s.radius += (s.maxRadius - s.radius) * 0.08;
        s.alpha -= 0.04;

        if (s.alpha <= 0) {
            shockwaves.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
}

// Background Nebula Render
function drawNebula(ctx) {
    ctx.save();
    const logicalWidth = canvas.style.width ? parseInt(canvas.style.width) : canvas.width;
    const logicalHeight = canvas.style.height ? parseInt(canvas.style.height) : canvas.height;

    const g1 = ctx.createRadialGradient(logicalWidth*0.3, logicalHeight*0.3, 50, logicalWidth*0.3, logicalHeight*0.3, 300);
    g1.addColorStop(0, '#581c8710'); 
    g1.addColorStop(1, 'transparent');
    ctx.fillStyle = g1;
    ctx.beginPath();
    ctx.arc(logicalWidth*0.3, logicalHeight*0.3, 300, 0, Math.PI*2);
    ctx.fill();

    const g2 = ctx.createRadialGradient(logicalWidth*0.7, logicalHeight*0.6, 50, logicalWidth*0.7, logicalHeight*0.6, 250);
    g2.addColorStop(0, '#0369a10c'); 
    g2.addColorStop(1, 'transparent');
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.arc(logicalWidth*0.7, logicalHeight*0.6, 250, 0, Math.PI*2);
    ctx.fill();

    ctx.restore();
}

// Vector Render
function drawVectors(ctx) {
    if (!showVectors) return;

    bodies.forEach(b => {
        const vLength = 22;
        drawArrow(ctx, b.x, b.y, b.x + b.vx * vLength, b.y + b.vy * vLength, '#38bdf8', 1.8);

        let fx = 0;
        let fy = 0;
        bodies.forEach(other => {
            if (other === b) return;
            const dx = other.x - b.x;
            const dy = other.y - b.y;
            const distSq = dx * dx + dy * dy + 100;
            const dist = Math.sqrt(distSq);
            const force = (G * b.mass * other.mass) / distSq;
            fx += force * (dx / dist);
            fy += force * (dy / dist);
        });

        const fLength = 4.5;
        if (Math.abs(fx) > 0.01 || Math.abs(fy) > 0.01) {
            drawArrow(ctx, b.x, b.y, b.x + fx * fLength, b.y + fy * fLength, '#ef4444', 1.8);
        }
    });
}

function drawArrow(ctx, fromx, fromy, tox, toy, color, thickness) {
    const headlen = 8;
    const dx = tox - fromx;
    const dy = toy - fromy;
    const angle = Math.atan2(dy, dx);

    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
}

// Guided Labs Presets
function setupLab(labName) {
    activeLab = labName;
    bodies = [];
    particles = [];
    shockwaves = [];
    
    const logicalWidth = canvas.style.width ? parseInt(canvas.style.width) : canvas.width;
    const logicalHeight = canvas.style.height ? parseInt(canvas.style.height) : canvas.height;
    
    const cx = logicalWidth / 2;
    const cy = logicalHeight / 2;
    
    const hudActiveLab = document.getElementById('hud-active-lab');
    playSynthesizedSound('click');
    
    if (labName === 'kepler') {
        hudActiveLab.textContent = "Lab 1: Kepler's Ellipse";
        bodies.push(new Body(cx, cy, 0, 0, MASS_SUN, 'sun'));
        bodies.push(new Body(cx, cy - 140, 5.2, 0, MASS_PLANET, 'planet'));
    } 
    else if (labName === 'slingshot') {
        hudActiveLab.textContent = "Lab 2: Gravity Assist";
        bodies.push(new Body(cx + 60, cy, 0, 0, MASS_SUN, 'sun'));
        bodies.push(new Body(cx + 60, cy - 120, 5.5, 0, MASS_PLANET, 'planet'));
        bodies.push(new Body(50, logicalHeight - 100, 3.8, -1.8, 1, 'moon'));
    } 
    else if (labName === 'binary') {
        hudActiveLab.textContent = "Lab 3: Binary Stars";
        const distance = 120;
        const orbitalVelocity = Math.sqrt((G * 3000) / (2 * distance));
        bodies.push(new Body(cx - distance, cy, 0, orbitalVelocity, 3000, 'sun'));
        bodies.push(new Body(cx + distance, cy, 0, -orbitalVelocity, 3000, 'sun'));
    } 
    else if (labName === 'lagrange') {
        hudActiveLab.textContent = "Lab 4: Lagrange Points";
        const sun = new Body(cx, cy, 0, 0, MASS_SUN, 'sun');
        bodies.push(sun);
        const planetDistance = 160;
        const planetOrbitalVelocity = Math.sqrt((G * MASS_SUN) / planetDistance);
        const planet = new Body(cx, cy - planetDistance, planetOrbitalVelocity, 0, 800, 'planet');
        bodies.push(planet);
        
        const rRatio = 1 - Math.pow(800 / (3 * MASS_SUN), 1/3);
        const l1Distance = planetDistance * rRatio;
        const l1Velocity = Math.sqrt((G * MASS_SUN) / l1Distance);
        bodies.push(new Body(cx, cy - l1Distance, l1Velocity, 0, 0.5, 'moon'));
    }
}

// Math Blackboard Computations
function updateMathBlackboard() {
    if (bodies.length < 2) {
        document.getElementById('calc-fg').textContent = "Need at least 2 bodies to calculate gravitational pull.";
        document.getElementById('calc-g').textContent = "Spawn central Sun and Planet.";
        document.getElementById('calc-v').textContent = "Spawn central Sun and Planet.";
        return;
    }

    const sun = bodies.find(b => b.type === 'sun') || bodies[0];
    const planet = bodies.find(b => b.type === 'planet') || (bodies[1] || bodies[0]);
    
    if (!sun || !planet || sun === planet) return;

    const dx = planet.x - sun.x;
    const dy = planet.y - sun.y;
    const r = Math.sqrt(dx * dx + dy * dy);
    
    const force = (G * sun.mass * planet.mass) / (r * r);
    document.getElementById('calc-fg').innerHTML = `
M₁ (Sun) = ${sun.mass} kg<br>
M₂ (Planet) = ${planet.mass.toFixed(1)} kg<br>
Distance (r) = ${r.toFixed(1)} m<br>
F_g = ${G} &times; (${sun.mass} &times; ${planet.mass.toFixed(1)}) / (${r.toFixed(1)})² = <strong>${force.toFixed(2)} N</strong>
    `;

    const g = (G * sun.mass) / (r * r);
    document.getElementById('calc-g').innerHTML = `
Central Mass = ${sun.mass} kg<br>
g = ${G} &times; ${sun.mass} / (${r.toFixed(1)})² = <strong>${g.toFixed(4)} m/s²</strong>
    `;

    const vCirc = Math.sqrt((G * sun.mass) / r);
    const vActual = Math.sqrt(planet.vx * planet.vx + planet.vy * planet.vy);
    
    document.getElementById('calc-v').innerHTML = `
Theoretical (Circular): v_c = &radic;(${G} &times; ${sun.mass} / ${r.toFixed(1)}) = <strong>${vCirc.toFixed(2)} m/s</strong><br>
Actual Velocity: v = <strong>${vActual.toFixed(2)} m/s</strong><br>
Orbit State: <span class="${Math.abs(vActual - vCirc) < 0.1 ? 'text-green' : 'text-yellow'}">
    ${vActual > vCirc ? 'Elliptical (Eccentric/High Speed)' : 'Decaying / Sub-Circular'}
</span>
    `;
}

// Mouse dragging launcher handlers
canvas.addEventListener('mousedown', (e) => {
    initAudio();
    playWelcomeGreeting(); 
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let clickedBody = null;
    bodies.forEach(b => {
        const dist = Math.sqrt((b.x - x) * (b.x - x) + (b.y - y) * (b.y - y));
        if (dist < b.radius * 2) {
            clickedBody = b;
        }
    });

    if (clickedBody) {
        notifyAIOfterEvent('select', clickedBody);
    } else {
        dragStart = { x: x, y: y };
        dragCurrent = { x: x, y: y };
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (dragStart) {
        const rect = canvas.getBoundingClientRect();
        dragCurrent = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (dragStart) {
        const rect = canvas.getBoundingClientRect();
        const endX = e.clientX - rect.left;
        const endY = e.clientY - rect.top;

        const dx = endX - dragStart.x;
        const dy = endY - dragStart.y;
        
        const scale = 0.05;
        const vx = dx * scale;
        const vy = dy * scale;

        const newBody = new Body(dragStart.x, dragStart.y, vx, vy, spawnMass, spawnType);
        bodies.push(newBody);
        
        playSynthesizedSound('spawn');

        document.getElementById('hud-bodies-count').textContent = bodies.length;
        notifyAIOfterEvent('spawn', newBody);

        dragStart = null;
        dragCurrent = null;
    }
});

// Main Animation Loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawNebula(ctx);

    applyGravity();

    bodies.forEach(b => {
        if (!isPaused) {
            b.update();
        }
        b.draw(ctx);
    });

    if (dragStart && dragCurrent) {
        ctx.beginPath();
        ctx.arc(dragStart.x, dragStart.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
        drawArrow(ctx, dragStart.x, dragStart.y, dragCurrent.x, dragCurrent.y, '#38bdf8', 2.0);
    }

    drawVectors(ctx);

    updateAndDrawEffects(ctx);

    updateMathBlackboard();

    requestAnimationFrame(gameLoop);
}

// Initial Run
resizeCanvas();
setupLab('kepler');
requestAnimationFrame(gameLoop);


// ── UI EVENT LISTENERS ──

// Spawn Buttons
const spawnerButtons = document.querySelectorAll('.btn-spawn');
spawnerButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        playSynthesizedSound('click');
        spawnerButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        spawnType = btn.dataset.type;
        
        const massSlider = document.getElementById('object-mass');
        const massValText = document.getElementById('mass-val');
        if (spawnType === 'sun') {
            spawnMass = MASS_SUN;
            massSlider.value = MASS_SUN;
        } else if (spawnType === 'planet') {
            spawnMass = MASS_PLANET;
            massSlider.value = MASS_PLANET;
        } else {
            spawnMass = MASS_MOON;
            massSlider.value = MASS_MOON;
        }
        massValText.textContent = spawnMass;
    });
});

// Controls
document.getElementById('object-mass').addEventListener('input', (e) => {
    spawnMass = parseInt(e.target.value);
    document.getElementById('mass-val').textContent = spawnMass;
});

document.getElementById('spawn-velocity').addEventListener('input', (e) => {
    spawnVelocity = parseFloat(e.target.value);
    document.getElementById('velocity-val').textContent = spawnVelocity;
});

document.getElementById('sim-speed').addEventListener('input', (e) => {
    simSpeed = parseFloat(e.target.value);
    document.getElementById('speed-val').textContent = simSpeed.toFixed(1);
});

// Simulation Actions
document.getElementById('btn-play-pause').addEventListener('click', () => {
    playSynthesizedSound('click');
    playWelcomeGreeting(); 
    isPaused = !isPaused;
    const btn = document.getElementById('btn-play-pause');
    if (isPaused) {
        btn.innerHTML = `<i class="fa-solid fa-play"></i> Resume Simulation`;
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
    } else {
        btn.innerHTML = `<i class="fa-solid fa-pause"></i> Pause Simulation`;
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary');
    }
});

document.getElementById('btn-clear').addEventListener('click', () => {
    playSynthesizedSound('click');
    bodies = [];
    particles = [];
    shockwaves = [];
    document.getElementById('hud-bodies-count').textContent = 0;
});

document.getElementById('show-trails').addEventListener('change', (e) => {
    showTrails = e.target.checked;
    if (!showTrails) {
        bodies.forEach(b => b.trail = []);
    }
});

document.getElementById('show-vectors').addEventListener('change', (e) => {
    showVectors = e.target.checked;
});

// Guided Labs Presets
const labCards = document.querySelectorAll('.lab-card');
labCards.forEach(card => {
    card.addEventListener('click', () => {
        labCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        setupLab(card.dataset.lab);
        notifyAILabChange(card.dataset.lab);
    });
});

// Tabs Switches
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        playSynthesizedSound('click');
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active-content'));

        btn.classList.add('active');
        const activeTabId = 'tab-' + btn.dataset.tab;
        document.getElementById(activeTabId).classList.add('active-content');
        
        if (btn.dataset.tab === 'math-board') {
            if (typeof MathJax !== 'undefined') {
                MathJax.typeset();
            }
        }
    });
});

// Toolbar Actions
document.getElementById('btn-toggle-sound').addEventListener('click', () => {
    soundMuted = !soundMuted;
    const btn = document.getElementById('btn-toggle-sound');
    if (soundMuted) {
        btn.innerHTML = `<i class="fa-solid fa-volume-xmark"></i> Sound: OFF`;
        btn.classList.add('btn-danger');
        btn.classList.remove('btn-secondary');
    } else {
        btn.innerHTML = `<i class="fa-solid fa-music"></i> Sound: ON`;
        btn.classList.remove('btn-danger');
        btn.classList.add('btn-secondary');
        playSynthesizedSound('click');
    }
});

document.getElementById('btn-toggle-voice').addEventListener('click', () => {
    voiceEnabled = !voiceEnabled;
    const btn = document.getElementById('btn-toggle-voice');
    if (!voiceEnabled) {
        btn.innerHTML = `<i class="fa-solid fa-volume-xmark"></i> Voice: OFF`;
        btn.classList.add('btn-danger');
        btn.classList.remove('btn-secondary');
        window.speechSynthesis.cancel();
    } else {
        btn.innerHTML = `<i class="fa-solid fa-volume-high"></i> Voice: ON`;
        btn.classList.remove('btn-danger');
        btn.classList.add('btn-secondary');
        playSynthesizedSound('click');
    }
});

document.getElementById('btn-replay-tour').addEventListener('click', () => {
    playSynthesizedSound('click');
    welcomeGreetingPlayed = false; 
    
    // Show static tour overlay
    const tourOverlay = document.getElementById('onboarding-tour-overlay');
    if (tourOverlay) {
        tourOverlay.style.display = 'flex';
    }
});

// Modal Actions
const modal = document.getElementById('api-modal');
document.getElementById('btn-api-settings').addEventListener('click', () => {
    playSynthesizedSound('click');
    modal.classList.add('show');
    if (geminiApiKey) {
        document.getElementById('gemini-key').value = geminiApiKey;
    }
});

document.getElementById('btn-close-modal').addEventListener('click', () => {
    playSynthesizedSound('click');
    modal.classList.remove('show');
});

document.getElementById('btn-save-api').addEventListener('click', () => {
    playSynthesizedSound('click');
    const key = document.getElementById('gemini-key').value.trim();
    if (key) {
        geminiApiKey = key;
        localStorage.setItem('gemini_api_key', key);
        alert("Gemini API Key Saved Successfully!");
    } else {
        geminiApiKey = null;
        localStorage.removeItem('gemini_api_key');
    }
    modal.classList.remove('show');
});

document.getElementById('btn-clear-api').addEventListener('click', () => {
    playSynthesizedSound('click');
    geminiApiKey = null;
    localStorage.removeItem('gemini_api_key');
    document.getElementById('gemini-key').value = '';
    alert("Switched to Offline STEM Tutor Engine.");
    modal.classList.remove('show');
});


// ── CONVERSATIONAL AI STEM TUTOR ENGINE ──

const chatThread = document.getElementById('chat-messages');

function appendMessage(sender, text, isAI) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.classList.add(isAI ? 'message-ai' : 'message-user');

    const icon = isAI ? '<i class="fa-solid fa-satellite-dish"></i>' : '<i class="fa-solid fa-user"></i>';
    msgDiv.innerHTML = `
        <div class="message-sender">${icon} ${sender}</div>
        <div class="message-text">${text}</div>
    `;

    chatThread.appendChild(msgDiv);
    chatThread.scrollTop = chatThread.scrollHeight;

    if (isAI) {
        speakText(text);
    }
}

document.getElementById('chat-send-btn').addEventListener('click', handleUserSendMessage);
document.getElementById('chat-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUserSendMessage();
});

const suggestionBtns = document.querySelectorAll('.suggestion-btn');
suggestionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const query = btn.textContent;
        appendMessage("Commander", query, false);
        processAIResponse(query);
    });
});

function handleUserSendMessage() {
    const input = document.getElementById('chat-input');
    const query = input.value.trim();
    if (!query) return;

    appendMessage("Commander", query, false);
    input.value = '';

    processAIResponse(query);
}

const localTutorResponses = {
    'default': "That's a fascinating observation! Gravity behaves as a centripetal force holding the bodies in coordinate positions ($F_c = m v^2 / r$). Try adjustments using our panel sliders, or spawn some moons to compare orbital speeds!",
    'speed': "As the planet orbits closer to the Sun (at <strong>perihelion</strong>), the central gravitational pull becomes significantly stronger because gravity is inversely proportional to distance squared ($F_g \\propto 1/r^2$). According to Kepler's Second Law and conservation of angular momentum, the planet must speed up to cover equal orbital sweeps in equal time intervals.",
    'kepler': "Kepler's Laws of Planetary Motion are:<br><br>1. <strong>Law of Ellipses:</strong> Planets sweep out elliptical orbits with the central star at one focus.<br>2. <strong>Law of Equal Areas:</strong> A line segment joining a planet and the central star sweeps out equal areas during equal intervals of time.<br>3. <strong>Harmonic Law:</strong> The square of orbital period ($T^2$) is directly proportional to the cube of its distance ($a^3$).",
    'challenge': "<strong>AI Mission Challenge:</strong> Try to launch a small Moon into a stable orbit around the Purple Planet. Spawn a Moon with a mass of 5 and drag-launch it near the Planet, aiming perpendicular to its pull. Can you set it into circular orbit without colliding?",
    'binary': "In a Binary Star scenario, both stars orbit around a shared center of mass (the <strong>barycenter</strong>). Since their masses are equal, they loop around a point exactly halfway between them. Try placing a third planet in their barycenter to see chaotic physics!",
    'lagrange': "Lagrange points are spots in space where the gravity of a Central Star and a Planet balances out the centrifugal force. A satellite placed at L1 (between them) remains stable and orbits in lockstep with the Planet. Observe the small blue satellite orbiting at L1 right now."
};

function processAIResponse(query) {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message message-ai typing-indicator';
    typingDiv.innerHTML = `<div class="message-sender"><i class="fa-solid fa-satellite-dish"></i> Mission Control AI</div>
                           <div class="message-text"><i class="fa-solid fa-circle-notch fa-spin"></i> Analyzing physics state...</div>`;
    chatThread.appendChild(typingDiv);
    chatThread.scrollTop = chatThread.scrollHeight;

    setTimeout(async () => {
        chatThread.removeChild(typingDiv);

        if (geminiApiKey) {
            try {
                const responseText = await callGeminiAPI(query);
                appendMessage("Mission Control AI", responseText, true);
            } catch (err) {
                console.error(err);
                const reply = evaluateLocalRuleQuery(query);
                appendMessage("Mission Control AI", "<em>[Offline Failover Mode]</em> " + reply, true);
            }
        } else {
            const reply = evaluateLocalRuleQuery(query);
            appendMessage("Mission Control AI", reply, true);
        }
    }, 800);
}

function evaluateLocalRuleQuery(query) {
    const q = query.toLowerCase();
    if (q.includes('speed') || q.includes('fast') || q.includes('slow')) return localTutorResponses['speed'];
    if (q.includes('kepler') || q.includes('three laws') || q.includes('law')) return localTutorResponses['kepler'];
    if (q.includes('challenge') || q.includes('mission') || q.includes('quest')) return localTutorResponses['challenge'];
    if (q.includes('binary') || q.includes('double star')) return localTutorResponses['binary'];
    if (q.includes('lagrange') || q.includes('l1') || q.includes('balance')) return localTutorResponses['lagrange'];
    return localTutorResponses['default'];
}

function notifyAIOfterEvent(eventType, body1, body2) {
    if (eventType === 'collision') {
        appendMessage("Mission Control AI", `⚠️ <strong>Accretion Warning!</strong> A collision was detected. The bodies merged into a single system. Total combined mass is now <strong>${body1.mass} kg</strong>. Conservation of momentum is applied.`, true);
    } 
    else if (eventType === 'spawn') {
        const text = `Launched a new <strong>${body1.type}</strong> at (${body1.x.toFixed(0)}, ${body1.y.toFixed(0)}) with mass ${body1.mass} kg. Let's observe its trajectory trail!`;
        appendMessage("Mission Control AI", text, true);
    }
    else if (eventType === 'select') {
        appendMessage("Mission Control AI", `Selected <strong>${body1.type}</strong>. Gravitational dynamics are mapped onto the Math Blackboard panel. Switch tabs to see active equations.`, true);
    }
}

function notifyAILabChange(labName) {
    let labMsg = "";
    if (labName === 'kepler') {
        labMsg = "Observe how orbital velocity speeds up near perihelion.";
    } else if (labName === 'slingshot') {
        labMsg = "Launch the blue satellite to observe gravity assists swing around.";
    } else if (labName === 'binary') {
        labMsg = "Observe two stars orbiting a shared barycenter.";
    } else {
        labMsg = "Observe L1 Lagrange point stability.";
    }
    appendMessage("Mission Control AI", `Preset Loaded: <strong>${labName.toUpperCase()}</strong>. ${labMsg}`, true);
}

async function callGeminiAPI(userQuery) {
    let sandboxContext = `The user is running a gravitational physics sandbox simulator.
- Active Lab: ${activeLab}
- Active bodies: ${bodies.length}
- Gravity constant G: ${G}
- Bodies coordinates:
`;
    bodies.forEach((b, i) => {
        sandboxContext += `  * ${b.type}: Mass ${b.mass}, Position (${b.x.toFixed(1)}, ${b.y.toFixed(1)}), Velocity (${b.vx.toFixed(2)}, ${b.vy.toFixed(2)})\n`;
    });

    const systemPrompt = `You are a helpful SANS SIFT/DSH NASA-style Mission Control AI STEM tutor inside an orbital physics simulator app.
Your task is to teach students physics, Kepler's laws, and Newtonian orbital mechanics in a friendly, encouraging way.
Keep answers concise (max 3-4 short paragraphs), and explain equations clearly when asked.
Refer to the current sandbox state coordinates/mass/velocity context provided.
Context:
${sandboxContext}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
    const requestBody = {
        contents: [{
            role: "user",
            parts: [{ text: `${systemPrompt}\n\nStudent Query: ${userQuery}` }]
        }]
    };

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) throw new Error("API call failed");
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}


// ── ONBOARDING INTERACTIVE MISSION OVERLAY CONTROLLERS ──

// Wire up the static tour overlay from index.html
const tourOverlay = document.getElementById('onboarding-tour-overlay');
const btnCloseTour = document.getElementById('btn-close-tour');

if (tourOverlay && btnCloseTour) {
    // Show static overlay on page load
    tourOverlay.style.display = 'flex';

    btnCloseTour.addEventListener('click', () => {
        playSynthesizedSound('click');
        tourOverlay.style.display = 'none'; // hide static overlay
        playWelcomeGreeting(); // Speak introductory welcome text
    });
}
