# AstroSim AI — Interactive Gravitational Sandbox & AI STEM Tutor

AstroSim AI is an interactive 2D orbital mechanics simulator and a voice-guided AI STEM tutor designed to teach students orbital physics, Kepler's laws, and Newtonian gravitation in an immersive and gamified dashboard environment.

🌌 **Live Demo:** [Insert your Vercel Link Here]

---

## 🛰️ Core Features

* **Real-time 2D Physics Simulator:** A canvas-based sandbox where students can launch planets, suns, and moons. It computes real gravitational pull vectors between all objects dynamically ($F_g = G \frac{M_1 \cdot M_2}{r^2}$).
* **Dynamic Math Blackboard:** A panel translating sandbox states into LaTeX math in real-time. As planets orbit, the chalkboard displays active formulas with live values substituted in.
* **Interactive AI STEM Tutor:** An AI Lab Partner (powered by Google Gemini / local rule engine) that tracks the sandbox state, explains orbital physics, reacts to collisions, and assigns interactive missions. Features a text-to-speech assistant.
* **Accretion & Collisions:** Colliding bodies merge using conservation of momentum, generating expanding shockwaves and synthesized audio crunches.
* **Guided Physics Labs:** Pre-configured scenarios designed to teach core curriculum points:
  1. *Kepler's Ellipse:* Understand velocity acceleration at perihelion vs aphelion.
  2. *Gravity Assist:* Use a massive sun's gravitational pull to slingshot a satellite.
  3. *Binary Stars:* Watch two equal masses orbit a shared barycenter.
  4. *Lagrange Points:* Explore points where gravitational forces cancel out.
* **Responsive Space Glassmorphism UI:** A modern dark-mode interface styled with thin glowing borders, CSS glassmorphism, and responsive grids for tablets/mobile screens.

---

## 🛠️ Tech Stack & Design

* **Core Engine:** HTML5 Canvas & Javascript (60 FPS rendering loop)
* **Styling:** CSS variables, HSL color tokens, and Backdrop blur filters
* **Audio FX:** Web Audio API (Synthesized sound waves)
* **Speech Synthesis:** Web Speech API (Robotic assistant voice guide)
* **Math Typography:** MathJax (LaTeX compilation)
* **AI Intelligence:** Gemini 1.5 Flash API client connector

---

## 🚀 How to Run Locally

Since this is a zero-dependency project, you don't need any complex installation steps:
1. Clone this repository: `git clone https://github.com/your-username/astrosim-ai.git`
2. Navigate to the project directory.
3. Double-click `index.html` to open it in any modern web browser (Chrome, Safari, Edge, Firefox).
