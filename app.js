
const ENCODED_DISCORD_WEBHOOK = 'aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3MvMTUzOTQwNTE0NjAwNDUyOTE5My82UENXVFlsaUJ3M29oSkE1R0NBU01faTNGdTBldU00bjluVS1NcWM3VllxOEdELTh5Nk5ZYll3U3lHQ00zNDJoNHY4RQ==';

const XMR_RATE_USD = 168.51;

let DISCORD_WEBHOOK_URL = '';
document.addEventListener('DOMContentLoaded', () => {
  try {
    DISCORD_WEBHOOK_URL = atob(ENCODED_DISCORD_WEBHOOK);
  } catch (e) {
    console.warn('[AIFX] Failed to decode webhook:', e)
  }
});

document.addEventListener('DOMContentLoaded', () => {
  initLucideIcons();
  initCyberMatrixBackground();
  initSpotlightEffect();
  initBillingToggle();
  initPricingCards();
  initCheckoutModal();
  initSpecsModal();
  initRulesModal();
  initCustomSelects();
  initProductPlayground();
  initFaqAccordion();
  initNavbarScroll();
  initSectionMotionBlurReveals();
});

const PRODUCTS = {
  'ambrosia-ow-lite': {
    id: 'ambrosia-ow-lite',
    name: 'Ambrosia OW Lite',
    code: 'ambrosia-ow-lite',
    game: 'Overwatch 2',
    badge: 'Overwatch Lite',
    tagline: 'Lightweight aimbot, triggerbot, flickbot, movement and streamproof visuals.',
    weeklyPrice: 5,
    monthlyPrice: 10,
    lifetimePrice: null,
    available: true,
    os: 'Windows 10 and 11',
    cpu: 'INTEL / AMD',
    notes: 'Lite version of the product with streamproof visuals and movement helpers.',
    addresses: {
      weekly: '89VPPCJ9qhEUnA53bDLPSFbdKm3zS7uxJ7Qewy9mAV23AFb7EnUBBDjfjwzKxE71yRjSADVb6Cs6t22DQ3vKtphnTRaBnZB',
      monthly: '89aFGA5EWqvJUnNacSNW6RGPctm74XKx8Nvz5t45BDm8ZfDWdBH2xJgZsL4mFi47kHaamwu2PcQAT3E1vUJmpPhD15WjkiB'
    },
    featureHighlights: [
      'Aimbot, Triggerbot and Flickbot with Prediction',
      'Multipoint Visualisation and Hitbox Customisation',
      'Movement: Auto Bunnyhop, Null Binding (SnapTap)',
      'Streamproof and Record Proof Rendering',
      '10 Configs, Config Sharing and Keybind Switcher'
    ],
    fullCategories: {
      'Aimbot and Combat': [
        'Aimbot: Prediction, Custom Aim key, Secondary Aim key, Custom FOV, Advanced Smoothing',
        'Triggerbot: Custom Delay, Custom Trigger key',
        'Flickbot: Flickspeed, Prediction, Gravity'
      ],
      'ESP and World': [
        'Rescan interval and Multipoint visualisation',
        'Hitbox customisation and Team Invert (F10)',
        'Loot ESP with Rarity and Distance customisation'
      ],
      'Movement and Helpers': [
        'Auto Bunnyhop',
        'Null Binding (SnapTap)',
        'Keyboard switch (Qwerty and Azerty)',
        'Only in game (Removes aim or trigger when out of the game)'
      ],
      'Misc and Configs': [
        'ESP and Visuals Hard Reset (Misc tab)',
        'Streamproof and Record Proof mode',
        'VSync and Performance mode (FPS impact optimization)',
        'GPU and CPU renderer selection',
        'Config Sharing system (up to 10 configs)',
        'GUI Customisation (Accent, Window Color, Transparency, Logos)'
      ]
    }
  },

  'ambrosia-ow-pro': {
    id: 'ambrosia-ow-pro',
    name: 'Ambrosia OW Pro',
    code: 'ambrosia-ow-pro',
    game: 'Overwatch 2',
    badge: 'Overwatch Pro Full Suite',
    tagline: 'Advanced combat suite with hero scripting, ult shower HUD, and deep customisation.',
    weeklyPrice: 20,
    monthlyPrice: 45,
    lifetimePrice: null,
    available: true,
    os: 'Windows 10 and 11',
    cpu: 'INTEL / AMD',
    notes: 'Full featured edition with hero action scripting, ally targeting, and HUD ult tracker.',
    addresses: {
      weekly: '88MtyMUqqrFbqAtg2g6M5Khi1dwEVyt6UCUi228VLpZNFqX4fepf6ixctZaPtERsP4dA1HSBnFteQhZsHnz8sMsp1Ld5YBH',
      monthly: '8AGpdyaAkKyb8daJ3xksAr9m6y5L6ChND2KHthouN4YcEXMtm5cH72DghMc2ZeMHdP2ewXWxWWRPTUuoMefj1DSg7FVf8kU'
    },
    featureHighlights: [
      'Dual Aim and Trigger Slots with Independent Configs',
      'Hero Action Scripting (Up to 10 simultaneous scripts)',
      'Ult Shower HUD and Ability Cooldown Panel',
      'Player Outline ESP and Skeleton Hitbox Visuals',
      'FOV Changer, Third Person and Streamproof Mode'
    ],
    fullCategories: {
      'Advanced Aimbot and Combat': [
        'Prediction (Auto or manual projectile speed and gravity)',
        'Primary and Secondary Aim Key slots (full independent configs)',
        'Custom FOV with FOV Circle visualisation',
        'Advanced Smoothing (Humanize power and bounciness curve with presets)',
        'Require Visibility, Multipoint Radius, Target Switch Delay, Head Only, Distance based',
        'Secondary Triggerbot and Secondary Flickbot (independent slots)',
        'Target Allies Mode and Low Health Ally targeting',
        'Legit Mode (human like timing between flicks), Auto shoot after flick',
        'Ragebot and No Recoil'
      ],
      'Hero Scripting': [
        'Custom action scripting for any hero (up to 10 simultaneous scripts)',
        'Actions: Ability 1, Ability 2, Melee, Duck, Ult, Jump, Interact, Reload, Custom Key',
        'Conditions: Low or High HP, Enemy Visible, Close or Far, Enemy in FOV, Looking at Ally or Enemy, After Shooting, Low Ammo'
      ],
      'ESP, Outline and Visuals': [
        'Skeleton ESP (Enemy and Ally toggle)',
        'Hitbox visualisation (Sphere and capsule, critical highlight)',
        'Bounding Box ESP (Full or corner only, glow, multiple types)',
        'Health Bar (Position, style, size, color) and Prediction Point',
        'Hero Name and Battletag display',
        'Player Outline ESP (Hero based or static color, HP based opacity, Fade Start and End)',
        'Directional off screen arrows'
      ],
      'Ult Shower HUD and Radar': [
        'Ult Shower HUD: Enemy and Ally ult charge and ability cooldown tracker',
        'Customisable HUD position, scale, style, and colours',
        'Mini map Radar overlay (Style, point style, range, size, glow, custom colors)',
        'Custom Crosshair overlay (Multiple styles, size, thickness, gap, outline)'
      ],
      'Misc and Configs': [
        'FOV Changer and Third Person view',
        'Streamproof and Record proof',
        'Language selection (English and French)',
        'Remote shareable config system with full serialisation per config',
        'GUI Accent Colour, Multiple Logos, Open or Close Keybind'
      ]
    }
  },

  'ambrosia-ow-rbx': {
    id: 'ambrosia-ow-rbx',
    name: 'Ambrosia OW RBX',
    code: 'ambrosia-ow-rbx',
    game: 'Overwatch',
    badge: 'Under Maintenance',
    tagline: 'Developer has not published information yet. Currently unavailable.',
    weeklyPrice: null,
    monthlyPrice: null,
    lifetimePrice: null,
    available: false,
    os: 'To Be Announced',
    cpu: 'To Be Announced',
    notes: 'NOT AVAILABLE AT THE MOMENT. Will be enabled once the developer releases details.',
    addresses: {
      weekly: null,
      monthly: null
    },
    featureHighlights: [
      'Status: Under Development and Maintenance',
      'Unpurchasable until official release',
      'Updates will be announced in Discord'
    ],
    fullCategories: {
      'Status': [
        'Product is not available at the moment.',
        'Details and pricing will be posted once published by the developer.'
      ]
    }
  },

  'ambrosia-cs2-web': {
    id: 'ambrosia-cs2-web',
    name: 'Ambrosia CS2 Web Radar',
    code: 'ambrosia-cs2-web',
    game: 'Counter-Strike 2',
    badge: 'CS2 Web Radar',
    tagline: 'Triggerbot, RCS weapon recoil control and browser based tactical 2D radar.',
    weeklyPrice: 5,
    monthlyPrice: 15,
    lifetimePrice: null,
    available: true,
    os: 'Windows 10 and 11 (Android, iOS and Linux for Web Radar part)',
    cpu: 'INTEL / AMD',
    notes: 'Web radar can be opened on any second monitor, phone, or browser.',
    addresses: {
      weekly: '871MfSycgoc8mhZ7SpUZoZZ1dbS6d5Bq1cde9LmEvcVqUn8fpCgZTvMKN1V2tNGqzBeh4pjgwzQHUf42qAvR71YbEtc59Xz',
      monthly: '8AVUcXxR3ircP1BhpUi3fhczeag4LQjCaJKBe2opbDrKCexzqYAwjk3U63uGeaU4Wk7ztyDtoYEuHXxQ46f27c4AR2c6mQf'
    },
    featureHighlights: [
      'Triggerbot with Custom Delay and Trigger Key',
      'RCS Recoil Control (Weapon Profiles, Humanize, Pattern Preview)',
      'Interactive 2D Tactical Web Radar (Themes, Calibration, Zoom)',
      'Displays Bomb Carrier, Defusing, Flashed and Grenades',
      'Players Info: Name, Health, Teams and Weapons'
    ],
    fullCategories: {
      'Combat (Triggerbot and RCS)': [
        'Triggerbot: Custom Delay and Custom Trigger Key',
        'RCS: Weapon Profile selection',
        'RCS: Humanize and Intensity adjustments',
        'RCS: Pattern preview window',
        'RCS: Phases (Delay, Speed, Angle)'
      ],
      '2D Web Radar': [
        'Appearance (Themes), Map Override and Calibration customisation',
        'Rotate Map, Square Map, Zoom and Radar Size',
        'Show Names and Show Teammates',
        'View Cones and View Lines',
        'Show Grid, Health Rings, Health Bar',
        'Show Weapons, Show Flashed, Show Defusing, Show Bomb Carrier',
        'Show Grenades (Smoke and Fire Molotov)'
      ],
      'Players and Multi-Device': [
        'Player Details: Name, Health, Teams',
        'Web component accessible via any phone, tablet, or secondary PC',
        'Compatible with Windows 10 and 11 (Web part on Android, iOS and Linux)'
      ]
    }
  },

  'ambrosia-fn': {
    id: 'ambrosia-fn',
    name: 'Ambrosia FN',
    code: 'ambrosia-fn',
    game: 'Fortnite',
    badge: 'Fortnite',
    tagline: 'Aimbot, visual ESP, loot distance, on screen radar, and 10 config slots.',
    weeklyPrice: 20,
    monthlyPrice: 45,
    lifetimePrice: null,
    available: true,
    os: 'Windows 11',
    cpu: 'INTEL / AMD',
    notes: 'Full Fortnite client with aimbot, ESP suite, radar and configs.',
    addresses: {
      weekly: '8BMLcSiK1rm7zZ11MPd2U1G4rMfkjTkZyQ9spnY6GAHEYSJVvWJ9wQQPKnNnZxHAmMazApZ2qJ6wKFAnbbR1LsaT5HAFSCK',
      monthly: '84hxPfyebV85yHJi6BuBnnKxBjYRGc1dMURtmv4By4QjNF9Czaho5EPQzeGEeNtVfpCyX1v4dRLac2LWLEnSC4EK7BsKZKc'
    },
    featureHighlights: [
      'Aimbot with Prediction, Visible Check, Custom FOV, Aim Bone Selection',
      'Box, Skeleton, China Hat, Rank, Distance, Ammo, Kills ESP',
      'World Loot ESP with Rarity and Distance customisation',
      'On Screen Radar (Circle or Square styles)',
      'Config Sharing system with up to 10 Configs'
    ],
    fullCategories: {
      'Aimbot': [
        'Visible Check, Prediction, Custom Aim key, Secondary Aim key',
        'Custom FOV, Aim Bone Selection, Ignore Bot/Knocked',
        'Target Switch delay, Distance Based, Advanced Smoothing',
        'Weapon Config, Team Check'
      ],
      'ESP Suite': [
        'Box customisation (Glow/Bloom/Corners, Thickness, Vis color)',
        'Skeleton customisation (Glow/Bloom/Thickness, Vis color)',
        'China Hat customisation (Glow/Bloom)',
        'Name ESP, Rank ESP (Icon), Distance ESP, Ammo/Kills/Level/Weapon/Platform ESP'
      ],
      'World ESP and Radar': [
        'Loot ESP with Rarity and Distance customisation',
        'On Screen Radar: Player Point, Range, Opacity, Enemy Point color, Background, Style, Position'
      ],
      'Indicators and Configs': [
        'FOV Arrows, Target Dot, Target Line, Snaplines',
        'Config Sharing system (share configs with friends)',
        'Up to 10 Configs, Config Keybind switcher'
      ]
    }
  }
};

let currentBillingCycle = 'weekly'; 
let selectedCheckoutProduct = 'ambrosia-ow-pro';
let selectedCheckoutCycle = 'monthly';
let selectedSpecsProduct = 'ambrosia-ow-pro';
let activePlaygroundProduct = 'ambrosia-ow-pro';

function initLucideIcons() {
  if (window.lucide) {
    lucide.createIcons();
  }
}

function initCyberMatrixBackground() {
  const canvas = document.getElementById('cyber-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let time = 0;
  let mouse = { x: null, y: null, targetX: null, targetY: null, speed: 0 };
  let prevMouseX = 0;
  let prevMouseY = 0;

  let nodes = [];
  const nodeCount = window.innerWidth < 768 ? 30 : 65;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  resize();
  window.addEventListener('resize', resize);

  window.addEventListener('mousemove', e => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
    const dx = e.clientX - prevMouseX;
    const dy = e.clientY - prevMouseY;
    mouse.speed = Math.min(Math.sqrt(dx * dx + dy * dy), 40);
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouse.targetX = null;
    mouse.targetY = null;
  });

  class HoloNode {
    constructor() {
      this.reset(true);
    }

    reset(init = false) {
      this.x = Math.random() * width;
      this.y = init ? Math.random() * height : height + 20;
      this.z = Math.random() * 0.8 + 0.2; 
      this.vx = (Math.random() - 0.5) * 0.4 * this.z;
      this.vy = -(Math.random() * 0.5 + 0.2) * this.z;
      this.size = (Math.random() * 2.5 + 1.2) * this.z;
      this.baseAlpha = (Math.random() * 0.4 + 0.2) * this.z;
      this.alpha = this.baseAlpha;
      this.pulseSpeed = Math.random() * 0.03 + 0.01;
      this.pulseOffset = Math.random() * Math.PI * 2;
      this.type = Math.random() > 0.6 ? 'diamond' : 'circle';

      const hues = [
        '59, 130, 246',   
        '6, 182, 212',    
        '99, 102, 241',   
        '139, 92, 246'    
      ];
      this.color = hues[Math.floor(Math.random() * hues.length)];
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      this.alpha = this.baseAlpha + Math.sin(time * this.pulseSpeed + this.pulseOffset) * 0.15;

      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const repelRadius = 180;
        if (dist < repelRadius) {
          const force = (repelRadius - dist) / repelRadius;
          this.x -= (dx / dist) * force * 2.5;
          this.y -= (dy / dist) * force * 2.5;
          this.alpha = Math.min(0.9, this.alpha + 0.3);
        }
      }

      if (this.y < -30 || this.x < -30 || this.x > width + 30) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.fillStyle = `rgba(${this.color}, ${Math.max(0.04, this.alpha)})`;
      ctx.strokeStyle = `rgba(${this.color}, ${Math.max(0.08, this.alpha * 1.2)})`;
      ctx.lineWidth = 1;

      if (this.type === 'diamond') {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size * 1.4);
        ctx.lineTo(this.x + this.size * 1.4, this.y);
        ctx.lineTo(this.x, this.y + this.size * 1.4);
        ctx.lineTo(this.x - this.size * 1.4, this.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  for (let i = 0; i < nodeCount; i++) {
    nodes.push(new HoloNode());
  }

  function render() {
    time += 0.035;

    if (mouse.targetX !== null) {
      if (mouse.x === null) {
        mouse.x = mouse.targetX;
        mouse.y = mouse.targetY;
      } else {
        mouse.x += (mouse.targetX - mouse.x) * 0.08;
        mouse.y += (mouse.targetY - mouse.y) * 0.08;
      }
    } else {
      mouse.x = null;
      mouse.y = null;
    }

    ctx.clearRect(0, 0, width, height);

    const plasma1X = width * 0.25 + Math.sin(time * 0.4) * 120;
    const plasma1Y = height * 0.35 + Math.cos(time * 0.3) * 80;
    const grad1 = ctx.createRadialGradient(plasma1X, plasma1Y, 20, plasma1X, plasma1Y, width * 0.45);
    grad1.addColorStop(0, 'rgba(37, 99, 235, 0.09)');
    grad1.addColorStop(0.6, 'rgba(59, 130, 246, 0.03)');
    grad1.addColorStop(1, 'transparent');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, width, height);

    const plasma2X = width * 0.75 + Math.cos(time * 0.35) * 140;
    const plasma2Y = height * 0.65 + Math.sin(time * 0.45) * 90;
    const grad2 = ctx.createRadialGradient(plasma2X, plasma2Y, 20, plasma2X, plasma2Y, width * 0.5);
    grad2.addColorStop(0, 'rgba(99, 102, 241, 0.07)');
    grad2.addColorStop(0.6, 'rgba(139, 92, 246, 0.02)');
    grad2.addColorStop(1, 'transparent');
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, width, height);

    const horizonY = height * 0.62;
    const vanishX = width * 0.5 + (mouse.x !== null ? (mouse.x - width * 0.5) * 0.15 : 0);
    const gridLines = 18;

    ctx.save();
    ctx.lineWidth = 0.8;

    for (let i = -gridLines; i <= gridLines; i++) {
      const bottomX = width * 0.5 + (i * width * 0.075);
      const gradLine = ctx.createLinearGradient(vanishX, horizonY, bottomX, height);
      gradLine.addColorStop(0, 'rgba(59, 130, 246, 0.0)');
      gradLine.addColorStop(0.4, 'rgba(59, 130, 246, 0.04)');
      gradLine.addColorStop(1, 'rgba(6, 182, 212, 0.1)');

      ctx.strokeStyle = gradLine;
      ctx.beginPath();
      ctx.moveTo(vanishX, horizonY);
      ctx.lineTo(bottomX, height);
      ctx.stroke();
    }

    const horizontalCount = 10;
    for (let j = 0; j < horizontalCount; j++) {
      const progress = ((j / horizontalCount) + (time * 0.15) % 1) % 1;
      const py = horizonY + Math.pow(progress, 2.2) * (height - horizonY);
      const alpha = Math.sin(progress * Math.PI) * 0.1;

      ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();
    }
    ctx.restore();

    if (mouse.x !== null && mouse.y !== null) {
      const mouseHalo = ctx.createRadialGradient(mouse.x, mouse.y, 5, mouse.x, mouse.y, 220);
      mouseHalo.addColorStop(0, 'rgba(56, 189, 248, 0.14)');
      mouseHalo.addColorStop(0.4, 'rgba(59, 130, 246, 0.05)');
      mouseHalo.addColorStop(1, 'transparent');
      ctx.fillStyle = mouseHalo;
      ctx.fillRect(0, 0, width, height);
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 115) {
          const alpha = (1 - dist / 115) * 0.12 * Math.min(nodes[i].alpha, nodes[j].alpha);
          ctx.strokeStyle = `rgba(147, 197, 253, ${alpha})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    nodes.forEach(n => {
      n.update();
      n.draw();
    });

    requestAnimationFrame(render);
  }

  render();
}

function initSectionMotionBlurReveals() {
  const reveals = document.querySelectorAll('.motion-reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  reveals.forEach(el => observer.observe(el));
}

function initSpotlightEffect() {
  const cards = document.querySelectorAll('.spotlight-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

function initBillingToggle() {
  const weeklyBtn = document.getElementById('billing-weekly-btn');
  const monthlyBtn = document.getElementById('billing-monthly-btn');
  const pillSlider = document.getElementById('billing-pill-slider');

  if (!weeklyBtn || !monthlyBtn || !pillSlider) return;

  function updateToggleUI(cycle) {
    if (currentBillingCycle === cycle) return;
    currentBillingCycle = cycle;

    if (cycle === 'weekly') {
      weeklyBtn.classList.add('text-white');
      weeklyBtn.classList.remove('text-slate-400');
      monthlyBtn.classList.add('text-slate-400');
      monthlyBtn.classList.remove('text-white');
      pillSlider.style.transform = 'translateX(0%)';
    } else {
      monthlyBtn.classList.add('text-white');
      monthlyBtn.classList.remove('text-slate-400');
      weeklyBtn.classList.add('text-slate-400');
      weeklyBtn.classList.remove('text-white');
      pillSlider.style.transform = 'translateX(100%)';
    }

    animatePriceChange();
  }

  weeklyBtn.addEventListener('click', () => updateToggleUI('weekly'));
  monthlyBtn.addEventListener('click', () => updateToggleUI('monthly'));
}

function animatePriceChange() {
  const priceElements = document.querySelectorAll('.price-val');

  priceElements.forEach(el => {
    el.classList.add('price-animating');
  });

  setTimeout(() => {
    updatePricingCardDisplays();
    setTimeout(() => {
      priceElements.forEach(el => {
        el.classList.remove('price-animating');
      });
    }, 150);
  }, 120);
}

function updatePricingCardDisplays() {
  Object.keys(PRODUCTS).forEach(key => {
    const product = PRODUCTS[key];
    const priceEl = document.getElementById(`price-${key}`);
    const cycleEl = document.getElementById(`cycle-${key}`);
    if (priceEl && cycleEl) {
      if (!product.available) {
        priceEl.textContent = 'Unavailable';
        cycleEl.textContent = '';
      } else {
        const price = currentBillingCycle === 'weekly' ? product.weeklyPrice : product.monthlyPrice;
        priceEl.textContent = `$${price}`;
        cycleEl.textContent = currentBillingCycle === 'weekly' ? '/ week' : '/ month';
      }
    }
  });
}

function initPricingCards() {
  updatePricingCardDisplays();
}

function initCustomSelects() {
  const wrappers = document.querySelectorAll('.custom-select-wrapper');

  wrappers.forEach(wrapper => {
    const trigger = wrapper.querySelector('.custom-select-trigger');
    const options = wrapper.querySelectorAll('.custom-select-option');
    const hiddenInput = wrapper.querySelector('input[type="hidden"]');
    const labelSpan = wrapper.querySelector('.custom-select-label');

    if (!trigger) return;

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      wrappers.forEach(other => {
        if (other !== wrapper) other.classList.remove('open');
      });
      wrapper.classList.toggle('open');
    });

    options.forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const value = opt.dataset.value;
        const text = opt.dataset.label || opt.textContent.trim();

        if (hiddenInput) {
          hiddenInput.value = value;
          hiddenInput.dispatchEvent(new Event('change'));
        }

        if (labelSpan) {
          labelSpan.textContent = text;
        }

        options.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        wrapper.classList.remove('open');

        if (wrapper.id === 'modal-product-custom-select') {
          selectedCheckoutProduct = value;
          renderCheckoutDetails();
        }
      });
    });
  });

  document.addEventListener('click', () => {
    wrappers.forEach(w => w.classList.remove('open'));
  });
}

function initProductPlayground() {
  const tabs = document.querySelectorAll('.playground-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const productId = tab.dataset.product;
      activePlaygroundProduct = productId;

      tabs.forEach(t => {
        if (t.dataset.product === productId) {
          t.classList.add('bg-blue-600/25', 'border-blue-500/50', 'text-white');
          t.classList.remove('bg-transparent', 'border-white/5', 'text-slate-400');
        } else {
          t.classList.remove('bg-blue-600/25', 'border-blue-500/50', 'text-white');
          t.classList.add('bg-transparent', 'border-white/5', 'text-slate-400');
        }
      });

      renderPlaygroundContent(productId);
    });
  });

  renderPlaygroundContent('ambrosia-ow-pro');
}

function renderPlaygroundContent(productId) {
  const product = PRODUCTS[productId] || PRODUCTS['ambrosia-ow-pro'];
  const titleEl = document.getElementById('playground-title');
  const badgeEl = document.getElementById('playground-badge');
  const osEl = document.getElementById('playground-os');
  const cpuEl = document.getElementById('playground-cpu');
  const listEl = document.getElementById('playground-features-list');
  const ctaBtn = document.getElementById('playground-cta-btn');

  if (titleEl) titleEl.textContent = product.name;
  if (badgeEl) badgeEl.textContent = product.badge;
  if (osEl) osEl.textContent = product.os;
  if (cpuEl) cpuEl.textContent = product.cpu;

  if (listEl) {
    listEl.innerHTML = product.featureHighlights.map(f => `
      <div class="flex items-start gap-2.5 p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs text-slate-300">
        <i data-lucide="check" class="w-4 h-4 text-blue-400 shrink-0 mt-0.5"></i>
        <span>${f}</span>
      </div>
    `).join('');
    initLucideIcons();
  }

  if (ctaBtn) {
    if (!product.available) {
      ctaBtn.className = 'w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-500 text-xs font-semibold cursor-not-allowed text-center';
      ctaBtn.innerHTML = `<span>Currently Unavailable</span>`;
      ctaBtn.onclick = null;
    } else {
      ctaBtn.className = 'w-full btn-glow-primary py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2';
      ctaBtn.innerHTML = `<span>Get ${product.name}</span> <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>`;
      ctaBtn.onclick = () => openCheckoutModal(product.id, currentBillingCycle);
      initLucideIcons();
    }
  }
}

function initSpecsModal() {
  const modal = document.getElementById('specs-modal');
  const closeBtn = document.getElementById('close-specs-btn');
  const backdrop = document.getElementById('specs-backdrop');

  if (!modal) return;

  window.openSpecsModal = function (productId = 'ambrosia-ow-pro') {
    selectedSpecsProduct = productId;
    renderSpecsDetails();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeSpecsModal = function () {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (closeBtn) closeBtn.addEventListener('click', closeSpecsModal);
  if (backdrop) backdrop.addEventListener('click', closeSpecsModal);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeSpecsModal();
    }
  });
}

function renderSpecsDetails() {
  const product = PRODUCTS[selectedSpecsProduct] || PRODUCTS['ambrosia-ow-pro'];

  const titleEl = document.getElementById('specs-product-title');
  const tagEl = document.getElementById('specs-product-tag');
  const osEl = document.getElementById('specs-product-os');
  const cpuEl = document.getElementById('specs-product-cpu');
  const notesEl = document.getElementById('specs-product-notes');
  const contentEl = document.getElementById('specs-categories-container');
  const buyBtn = document.getElementById('specs-buy-btn');

  if (titleEl) titleEl.textContent = product.name;
  if (tagEl) tagEl.textContent = product.badge;
  if (osEl) osEl.textContent = product.os;
  if (cpuEl) cpuEl.textContent = product.cpu;
  if (notesEl) notesEl.textContent = product.notes;

  if (buyBtn) {
    if (!product.available) {
      buyBtn.disabled = true;
      buyBtn.className = 'w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-500 text-xs font-semibold cursor-not-allowed text-center';
      buyBtn.innerHTML = `<span>Currently Unavailable</span>`;
    } else {
      buyBtn.disabled = false;
      buyBtn.className = 'w-full btn-glow-primary py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5';
      buyBtn.innerHTML = `<span>Purchase with Monero (XMR)</span> <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>`;
      buyBtn.onclick = () => {
        closeSpecsModal();
        openCheckoutModal(product.id, currentBillingCycle);
      };
    }
  }

  if (contentEl) {
    contentEl.innerHTML = '';
    Object.keys(product.fullCategories).forEach(categoryName => {
      const items = product.fullCategories[categoryName];
      const categoryCard = document.createElement('div');
      categoryCard.className = 'p-3.5 rounded-xl bg-black/40 border border-white/5';

      let itemsListHtml = items.map(item => `
        <li class="flex items-start gap-2 text-xs text-slate-300">
          <i data-lucide="check" class="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0"></i>
          <span>${item}</span>
        </li>
      `).join('');

      categoryCard.innerHTML = `
        <h4 class="text-xs font-bold text-white uppercase tracking-wider mb-2.5 text-blue-300">${categoryName}</h4>
        <ul class="space-y-1.5">
          ${itemsListHtml}
        </ul>
      `;
      contentEl.appendChild(categoryCard);
    });
    initLucideIcons();
  }
}

function initRulesModal() {
  const modal = document.getElementById('rules-modal');
  const closeBtn = document.getElementById('close-rules-btn');
  const backdrop = document.getElementById('rules-backdrop');

  if (!modal) return;

  window.openRulesModal = function () {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeRulesModal = function () {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (closeBtn) closeBtn.addEventListener('click', closeRulesModal);
  if (backdrop) backdrop.addEventListener('click', closeRulesModal);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeRulesModal();
    }
  });
}

function initCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  const closeBtn = document.getElementById('close-modal-btn');
  const backdrop = document.getElementById('modal-backdrop');
  const cycleRadios = document.querySelectorAll('input[name="modal-cycle"]');
  const copyBtn = document.getElementById('copy-xmr-btn');
  const copyTicketBtn = document.getElementById('copy-ticket-info-btn');

  if (!modal) return;

  window.openCheckoutModal = function (productId = 'ambrosia-ow-pro', cycle = 'monthly') {
    const product = PRODUCTS[productId];
    if (product && !product.available) {
      showToast(`${product.name} is currently unavailable for purchase.`, 'error');
      return;
    }

    selectedCheckoutProduct = productId;
    selectedCheckoutCycle = cycle || currentBillingCycle;

    const selectWrapper = document.getElementById('modal-product-custom-select');
    if (selectWrapper) {
      const label = selectWrapper.querySelector('.custom-select-label');
      const opt = selectWrapper.querySelector(`.custom-select-option[data-value="${selectedCheckoutProduct}"]`);
      if (opt && label) {
        label.textContent = opt.dataset.label || opt.textContent.trim();
        selectWrapper.querySelectorAll('.custom-select-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
      }
    }

    cycleRadios.forEach(radio => {
      if (radio.value === selectedCheckoutCycle) {
        radio.checked = true;
      }
    });

    renderCheckoutDetails();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeCheckoutModal = function () {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (closeBtn) closeBtn.addEventListener('click', closeCheckoutModal);
  if (backdrop) backdrop.addEventListener('click', closeCheckoutModal);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeCheckoutModal();
    }
  });

  cycleRadios.forEach(radio => {
    radio.addEventListener('change', e => {
      selectedCheckoutCycle = e.target.value;
      renderCheckoutDetails();
    });
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const addressText = document.getElementById('modal-xmr-address').textContent.trim();
      navigator.clipboard.writeText(addressText).then(() => {
        showToast('Monero Address Copied to Clipboard!', 'success');
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-emerald-400"></i> Copied!`;
        initLucideIcons();
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
          initLucideIcons();
        }, 2000);
      }).catch(() => {
        showToast('Failed to copy. Please manually select the address.', 'error');
      });
    });
  }

  if (copyTicketBtn) {
    copyTicketBtn.addEventListener('click', () => {
      const discordInput = document.getElementById('modal-discord-input');
      const discordTag = discordInput ? discordInput.value.trim() : 'Anonymous';
      const product = PRODUCTS[selectedCheckoutProduct] || PRODUCTS['ambrosia-ow-pro'];
      const price = selectedCheckoutCycle === 'weekly' ? product.weeklyPrice : product.monthlyPrice;
      const address = product.addresses[selectedCheckoutCycle];
      const xmrAmount = (price / XMR_RATE_USD).toFixed(5);
      const ticketRef = 'AMB-' + Math.floor(1000 + Math.random() * 9000);

      const ticketText = `Order Ticket #${ticketRef}\nDiscord: ${discordTag}\nProduct: ${product.name}\nDuration: ${selectedCheckoutCycle.toUpperCase()}\nPrice: $${price} USD (~${xmrAmount} XMR)\nAddress: ${address}`;

      navigator.clipboard.writeText(ticketText).then(() => {
        showToast('Ticket Info Copied! Paste into your Discord Ticket.', 'success');
      });
    });
  }

  const submitTxBtn = document.getElementById('submit-tx-btn');
  if (submitTxBtn) {
    submitTxBtn.addEventListener('click', () => {
      const discordIdInput = document.getElementById('modal-discord-id-input');
      const discordUserId = discordIdInput ? discordIdInput.value.trim() : '';

      if (!discordUserId || discordUserId.length < 17) {
        showToast('Discord User ID is MANDATORY! Right-click your profile \u2192 Copy User ID.', 'error');
        if (discordIdInput) discordIdInput.focus();
        return;
      }

      const product = PRODUCTS[selectedCheckoutProduct] || PRODUCTS['ambrosia-ow-pro'];
      const price = selectedCheckoutCycle === 'weekly' ? product.weeklyPrice : product.monthlyPrice;
      const xmrAmount = (price / XMR_RATE_USD).toFixed(5);

      document.getElementById('confirm-product').textContent = product.name;
      document.getElementById('confirm-duration').textContent = selectedCheckoutCycle.toUpperCase();
      document.getElementById('confirm-price').textContent = `$${price} USD (~${xmrAmount} XMR)`;
      document.getElementById('confirm-discord').textContent = discordUserId;

      const idRow = document.getElementById('confirm-id-row');
      idRow.style.display = 'none';

      document.getElementById('confirm-modal').classList.add('active');
    });
  }

  const confirmSubmitBtn = document.getElementById('confirm-submit-btn');
  if (confirmSubmitBtn) {
    confirmSubmitBtn.addEventListener('click', () => {
      document.getElementById('confirm-modal').classList.remove('active');
      handleOrderSubmission();
    });
  }

  const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
  if (confirmCancelBtn) {
    confirmCancelBtn.addEventListener('click', () => {
      document.getElementById('confirm-modal').classList.remove('active');
    });
  }

  const confirmBackdrop = document.getElementById('confirm-modal-backdrop');
  if (confirmBackdrop) {
    confirmBackdrop.addEventListener('click', () => {
      document.getElementById('confirm-modal').classList.remove('active');
    });
  }
}

function renderCheckoutDetails() {
  const product = PRODUCTS[selectedCheckoutProduct] || PRODUCTS['ambrosia-ow-pro'];

  if (!product.available) {
    showToast('This product is currently unavailable.', 'error');
    closeCheckoutModal();
    return;
  }

  const price = selectedCheckoutCycle === 'weekly' ? product.weeklyPrice : product.monthlyPrice;
  const address = product.addresses[selectedCheckoutCycle] || product.addresses['monthly'];
  const xmrAmount = (price / XMR_RATE_USD).toFixed(5);

  const titleEl = document.getElementById('modal-title');
  const priceEl = document.getElementById('modal-usd-price');
  const xmrAmountEl = document.getElementById('modal-xmr-amount');
  const addressEl = document.getElementById('modal-xmr-address');
  const qrContainer = document.getElementById('modal-qr-code');

  if (titleEl) titleEl.textContent = `${product.name} (${selectedCheckoutCycle.toUpperCase()})`;
  if (priceEl) priceEl.textContent = `$${price}.00 USD`;
  if (xmrAmountEl) xmrAmountEl.textContent = `~ ${xmrAmount} XMR`;
  if (addressEl) addressEl.textContent = address;

  if (qrContainer) {
    qrContainer.innerHTML = '';
    const moneroUri = `monero:${address}?tx_amount=${xmrAmount}&recipient_name=Ambrosia_Reseller`;

    if (window.QRCode) {
      new QRCode(qrContainer, {
        text: moneroUri,
        width: 140,
        height: 140,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    } else {
      qrContainer.innerHTML = `
        <div class="w-full h-full flex flex-col items-center justify-center bg-white/10 rounded-lg p-2 text-center text-xs font-mono text-slate-300">
          <i data-lucide="qr-code" class="w-12 h-12 text-blue-400 mb-1"></i>
          <span>XMR Scan Ready</span>
        </div>
      `;
      initLucideIcons();
    }
  }
}

async function handleOrderSubmission() {
  const discordIdInput = document.getElementById('modal-discord-id-input');
  const txInput = document.getElementById('modal-txid-input');
  const discordUserId = discordIdInput ? discordIdInput.value.trim() : '';
  const txHash = txInput ? txInput.value.trim() : 'Payment in Discord Ticket';

  if (!discordUserId || discordUserId.length < 17) {
    showToast('Discord User ID is MANDATORY!', 'error');
    if (discordIdInput) discordIdInput.focus();
    return;
  }

  const product = PRODUCTS[selectedCheckoutProduct] || PRODUCTS['ambrosia-ow-pro'];
  const price = selectedCheckoutCycle === 'weekly' ? product.weeklyPrice : product.monthlyPrice;
  const address = product.addresses[selectedCheckoutCycle];
  const ticketRef = 'AMB-' + Math.floor(1000 + Math.random() * 9000);
  const xmrAmount = (price / XMR_RATE_USD).toFixed(5);

  const now = new Date();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localTime = now.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone
  });

  const orderPayload = {
    discordUserId: discordUserId,
    product: product.name,
    duration: selectedCheckoutCycle.toUpperCase(),
    price: price,
    xmrAmount: xmrAmount,
    address: address,
    txHash: txHash,
    ticketRef: ticketRef,
    timezone: timezone,
    localTime: localTime
  };

  console.log('[Ambrosia] Sending order to serverless function:', JSON.stringify(orderPayload, null, 2));

  try {
    const resp = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      let parsed;
      try { parsed = JSON.parse(errBody); } catch (e) { parsed = {}; }
      console.error('[Ambrosia] Order API error ' + resp.status + ': ' + errBody);
      if (parsed.error === 'not_member') {
        showToast('You must join our Discord server first. Redirecting...', 'error');
        setTimeout(() => {
          closeCheckoutModal();
          window.open('https://discord.gg/jrnByjkNaw', '_blank');
        }, 2000);
      } else {
        showToast('Failed to send order (' + resp.status + '). Check console.', 'error');
      }
      return;
    }

    console.log('[Ambrosia] Order sent successfully!');
  } catch (e) {
    console.error('[Ambrosia] Order API fetch failed:', e);
    showToast('Order request failed. Check console.', 'error');
    return;
  }

  showToast(`Ticket #${ticketRef} created! Redirecting to Discord...`, 'success');

  setTimeout(() => {
    closeCheckoutModal();
    window.open('https://discord.gg/jrnByjkNaw', '_blank');
  }, 1400);
}

function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const isSuccess = type === 'success';
  toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border ${isSuccess
    ? 'bg-slate-900/95 border-emerald-500/30 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
    : 'bg-slate-900/95 border-rose-500/30 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
    } backdrop-blur-md text-sm font-medium transform transition-all duration-300 translate-y-4 opacity-0`;

  toast.innerHTML = `
    <i data-lucide="${isSuccess ? 'check-circle' : 'alert-circle'}" class="w-4 h-4 shrink-0"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  initLucideIcons();

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function initFaqAccordion() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    const content = item.querySelector('.faq-content');
    const icon = item.querySelector('.faq-icon');

    if (!trigger || !content) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      items.forEach(other => {
        if (other !== item && other.classList.contains('open')) {
          other.classList.remove('open');
          const otherContent = other.querySelector('.faq-content');
          const otherIcon = other.querySelector('.faq-icon');
          if (otherContent) otherContent.style.maxHeight = '0px';
          if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
        }
      });

      if (isOpen) {
        item.classList.remove('open');
        content.style.maxHeight = '0px';
        if (icon) icon.style.transform = 'rotate(0deg)';
      } else {
        item.classList.add('open');
        content.style.maxHeight = content.scrollHeight + 'px';
        if (icon) icon.style.transform = 'rotate(180deg)';
      }
    });
  });
}

function initNavbarScroll() {
  const navbar = document.getElementById('main-navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('bg-black/75', 'shadow-[0_8px_32px_rgba(0,0,0,0.6)]');
      navbar.classList.remove('bg-black/35');
    } else {
      navbar.classList.remove('bg-black/75', 'shadow-[0_8px_32px_rgba(0,0,0,0.6)]');
      navbar.classList.add('bg-black/35');
    }
  });
}
