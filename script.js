const fgCanvas = document.getElementById('fg-canvas');
const bgCanvas = document.getElementById('bg-canvas');
const fctx = fgCanvas.getContext('2d');
const bctx = bgCanvas.getContext('2d');
const installer = document.getElementById('installer');

let sparks = [];
let fireworks = [];
let isBurning = false;
let currentPct = 0;
let fireworkMode = false;

const goldenPalette = ['#ffffff', '#fffacd', '#ffeb3b', '#ffca28', '#ff9f43'];

// Canvas එක Screen එකට ගැලපෙන විදිහට සකස් කිරීම
function resize() {
    fgCanvas.width = bgCanvas.width = window.innerWidth;
    fgCanvas.height = bgCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// --- Flash කිරීම ආරම්භ කරන ප්‍රධාන Function එක ---
function initiateFlash() {
    // Hidden වී ඇති Web Tools වල "Connect" බොත්තම JavaScript මගින් එබීම
    const root = installer.shadowRoot;
    const button = root.querySelector('button');
    if (button) {
        button.click();
    }
}

// 1. පෝට් එක තෝරා "Connect" කළ සැනින් ක්‍රියාත්මක වන කොටස
installer.addEventListener('install-all-visible', () => {
    // මෙනු එක හංගලා නිලා කූර පෙන්වීම
    document.getElementById('menu-box').style.display = 'none';
    document.getElementById('sparkler-stage').style.display = 'flex';
    
    // වැදගත්: කිසිම දෙයක් අහන්නේ නැතිව Flash කිරීම ආරම්භ කිරීම
    // මෙය "One-Click" අත්දැකීම ලබා දෙයි
    isBurning = true;
    animateSparkler();
});

// 2. Firmware එක Upload වන විට Progress එක ලබා ගැනීම
installer.addEventListener('install-progress', (e) => {
    currentPct = e.detail.progress;
    document.getElementById('pct').innerText = currentPct + "%";
});

// 3. සාර්ථකව අවසන් වූ විට නිලා කූර නවතා අහස් කූරු පෙන්වීම
installer.addEventListener('install-success', () => {
    isBurning = false;
    startFireworksShow();
});

// --- නිලා කූරේ Sparks (ගිනි පුපුරු) නිර්මාණය කරන හැටි ---
class Spark {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.color = goldenPalette[Math.floor(Math.random() * goldenPalette.length)];
        const angle = Math.random() * Math.PI * 2;
        const force = Math.random() * 15 + 10;
        this.vx = Math.cos(angle) * force;
        this.vy = Math.sin(angle) * force;
        this.life = 1.0; 
        this.gravity = 0.35; 
        this.friction = 0.94;
    }
    update() {
        this.vx *= this.friction; 
        this.vy += this.gravity;
        this.x += this.vx; 
        this.y += this.vy; 
        this.life -= 0.045;
    }
    draw() {
        if (this.life <= 0) return;
        fctx.globalAlpha = this.life; 
        fctx.strokeStyle = this.color;
        fctx.lineWidth = 2.5; 
        fctx.lineCap = 'round';
        fctx.beginPath();
        fctx.moveTo(this.x, this.y);
        fctx.lineTo(this.x - this.vx * 2.5, this.y - this.vy * 2.5);
        fctx.stroke();
    }
}

// --- නිලා කූරේ Animation එක පාලනය කිරීම ---
function animateSparkler() {
    fctx.clearRect(0, 0, fgCanvas.width, fgCanvas.height);
    
    if (isBurning) {
        const fuel = document.getElementById('fuel');
        const residue = document.getElementById('residue');
        const igniter = document.getElementById('igniter');

        // Progress එක අනුව නිලා කූරේ උස වෙනස් කිරීම
        let visualPos = 100 - currentPct;
        fuel.style.height = visualPos + "%";
        residue.style.height = (100 - visualPos) + "%";

        // Igniter එක (දැවෙන තැන) ඇති ස්ථානය සොයා Sparks පිට කිරීම
        const rect = igniter.getBoundingClientRect();
        for(let j=0; j<12; j++) {
            sparks.push(new Spark(rect.left + rect.width/2, rect.top + rect.height/2));
        }
    }

    sparks.forEach((s, i) => {
        s.update();
        s.draw();
        if (s.life <= 0) sparks.splice(i, 1);
    });

    if (isBurning || sparks.length > 0) {
        requestAnimationFrame(animateSparkler);
    }
}

// --- අහස් කූරු සහ අවසාන පණිවිඩය ---
function startFireworksShow() {
    // නිලා කූර හංගන්න
    document.getElementById('sparkler-stage').style.transition = 'opacity 0.6s';
    document.getElementById('sparkler-stage').style.opacity = '0';
    
    setTimeout(() => {
        document.getElementById('sparkler-stage').style.display = 'none';
        fireworkMode = true;
        renderFireworks();
        showFinalUI();
    }, 600);
}

function renderFireworks() {
    bctx.fillStyle = 'rgba(1, 1, 3, 0.2)'; // අහස් කූරු වල පාර (Trail) පෙන්වීමට
    bctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
    // මෙතනට ඔයාගේ පරණ Fireworks Logic එක දාන්න පුළුවන්
    if (fireworkMode) requestAnimationFrame(renderFireworks);
}

function showFinalUI() {
    const st = document.getElementById('success-text');
    st.style.display = 'block';
    setTimeout(() => st.classList.add('active'), 100);

    // සාර්ථක පණිවිඩයෙන් පසු WiFi Button එක පෙන්වීම
    setTimeout(() => {
        st.classList.remove('active');
        setTimeout(() => {
            st.style.display = 'none';
            const wc = document.getElementById('wifi-container');
            // සැබෑ WiFi Button එක මෙතනට ගෙන ඒම
            const realBtn = installer.shadowRoot.querySelector('button[slot="show-wifi"]');
            if (realBtn) {
                wc.appendChild(realBtn);
            }
            wc.style.display = 'block';
            setTimeout(() => wc.classList.add('move-up'), 100);
        }, 700);
    }, 3000);
}
