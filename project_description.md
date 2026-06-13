# AstroSim AI — One Page Project Description

## 1. Project Purpose & Pedagogy
Physics education often suffers from a "visualization gap." Abstract formulas such as Newton’s Law of Universal Gravitation ($F_g = G \frac{m_1 m_2}{r^2}$) or Kepler's Laws of Planetary Motion are memorized by students without true intuitive understanding. 

**AstroSim AI** is an interactive, gamified orbital mechanics simulator combined with a real-time **AI STEM Tutor (Mission Control)**. It allows students to visually build solar systems, test orbital limits, and observe Keplerian acceleration in real-time. By bridging the gap between mathematical equations and dynamic visual simulations, AstroSim AI transforms physics from static textbook text into an active, immersive sandbox.

---

## 2. Key Features

* **Real-time 2D Physics Simulator:** A canvas-based sandbox where students can click, drag, and launch custom planets, suns, and moons. It computes real gravitational pull vectors between all objects dynamically.
* **Dynamic Math Blackboard:** A panel that translates sandbox states into math in real-time. As planets move, the blackboard displays the active formulas with live values substituted in, showing how velocity and force change at every coordinate.
* **Interactive AI STEM Tutor:** An AI Lab Partner that sits next to the simulation. It dynamically reads the simulation state (e.g., number of bodies, positions, masses) and explains Kepler’s laws, gravity, or barycenters based on what the student is seeing. It can also assign custom challenge missions.
* **Guided Physics Labs:** Pre-configured scenarios designed to teach core curriculum points:
  1. *Kepler’s Ellipse:* Visualizes aphelion/perihelion velocity acceleration.
  2. *Gravity Assist (Slingshot):* Teaches planetary swing-by mechanics used by NASA.
  3. *Binary Stars:* Examines the 2-body problem and shared barycenters.
  4. *Lagrange Points:* Demonstrates orbital balance and L1 stability.
* **Accretion & Collision Mechanics:** When bodies collide, they don't just disappear; they merge into a single entity, dynamically updating mass, radius, and conservation of momentum.

---

## 3. Technical Architecture & Design
* **Frontend UI/UX:** Built with a premium, space-themed dark mode using CSS glassmorphism, responsive grids, Lucide/FontAwesome vector iconography, and micro-animations to ensure maximum student engagement.
* **Physics Engine:** Written in pure, high-performance vanilla JavaScript utilizing a `requestAnimationFrame` loop at 60 FPS, ensuring zero lag during complex gravitational calculations.
* **AI Integration:** Implements a client-side API connector linking directly to the **Gemini 1.5 Flash API** for dynamic contextual tutoring. It features a fallback rule-based education engine for offline functionality, making it completely robust.
* **Math Rendering:** Uses **MathJax** to compile and render clean, high-fidelity LaTeX equations directly within the browser interface.

---

## 4. Alignment with SDGs & Educational Impact
AstroSim AI directly addresses **UN Sustainable Development Goal 4 (Quality Education)** by democratizing advanced physics instruction. By providing an interactive, free tool that runs instantly on any device, it lowers the socioeconomic and computational barriers to high-quality science education, making STEM learning accessible to students worldwide.
