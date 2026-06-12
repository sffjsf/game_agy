export function addAoeMeleeEffect(effectSystem, x, y, color, radius) {
  // Ring of particles expanding outward in a circle
  for (var i = 0; i < 25; i++) {
    var angle = i / 25 * Math.PI * 2;
    var speed = 100 + Math.random() * 60;
    effectSystem.addParticle({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.4 + Math.random() * 0.2,
      maxLife: 0.6,
      color: color,
      size: 3 + Math.random() * 3,
      gravity: 0,
      friction: 0.9,
      type: 'spark'
    });
  }
  // Expanding ring
  // Expanding ring
  effectSystem.addParticle({
    x: x,
    y: y,
    vx: 0,
    vy: 0,
    life: 0.5,
    maxLife: 0.5,
    color: color,
    size: radius,
    gravity: 0,
    friction: 1.0,
    type: 'ring'
  });
  
}

export function addMultiShotEffect(effectSystem, x, y, color, radius) {
  // Burst of small particles in a forward cone
  for (var i = 0; i < 15; i++) {
    var angle = (Math.random() - 0.5) * Math.PI * 0.6;
    var speed = 150 + Math.random() * 100;
    effectSystem.addParticle({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.3,
      maxLife: 0.3,
      color: color,
      size: 2 + Math.random() * 2,
      gravity: 0,
      friction: 0.95,
      type: 'circle'
    });
  }
  
}

export function addMeteorEffect(effectSystem, x, y, color, radius) {
  // Large ring + shower of sparks falling downward
  effectSystem.addParticle({
    x: x,
    y: y,
    vx: 0,
    vy: 0,
    life: 0.8,
    maxLife: 0.8,
    color: '#FF6F00',
    size: radius,
    gravity: 0,
    friction: 1.0,
    type: 'ring'
  });
  for (var i = 0; i < 30; i++) {
    var angle = Math.random() * Math.PI * 2;
    var dist = Math.random() * radius * 0.5;
    effectSystem.addParticle({
      x: x + Math.cos(angle) * dist,
      y: y - 40 - Math.random() * 60,
      // Start above
      vx: (Math.random() - 0.5) * 60,
      vy: 100 + Math.random() * 150,
      // Fall downward
      life: 0.5 + Math.random() * 0.3,
      maxLife: 0.8,
      color: i % 3 === 0 ? '#FF6F00' : i % 3 === 1 ? '#FF8F00' : '#FFAB00',
      size: 2 + Math.random() * 4,
      gravity: 200,
      friction: 0.98,
      type: 'spark'
    });
  }
  
}

export function addBombEffect(effectSystem, x, y, color, radius) {
  // Compact fiery explosion for ordinary bomber skills
  effectSystem.addParticle({
    x: x,
    y: y,
    vx: 0,
    vy: 0,
    life: 0.45,
    maxLife: 0.45,
    color: '#FF7043',
    size: radius,
    gravity: 0,
    friction: 1.0,
    type: 'ring'
  });
  for (var i = 0; i < 24; i++) {
    var angle = Math.random() * Math.PI * 2;
    var speed = 80 + Math.random() * 170;
    effectSystem.addParticle({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.35 + Math.random() * 0.25,
      maxLife: 0.6,
      color: i % 3 === 0 ? '#FFCA28' : i % 3 === 1 ? '#FF7043' : '#6D4C41',
      size: 3 + Math.random() * 5,
      gravity: 80,
      friction: 0.9,
      type: 'spark'
    });
  }
  
}

export function addPoisonCloudEffect(effectSystem, x, y, color, radius) {
  // Subtle green cloud dots spreading around the target
  effectSystem.addParticle({
    x: x,
    y: y,
    vx: 0,
    vy: 0,
    life: 0.45,
    maxLife: 0.45,
    color: '#66BB6A',
    size: radius * 0.65,
    gravity: 0,
    friction: 1.0,
    type: 'ring'
  });
  for (var i = 0; i < 12; i++) {
    var angle = Math.random() * Math.PI * 2;
    var dist = Math.random() * radius * 0.38;
    effectSystem.addParticle({
      x: x + Math.cos(angle) * dist,
      y: y + Math.sin(angle) * dist * 0.55,
      vx: (Math.random() - 0.5) * 25,
      vy: -10 - Math.random() * 18,
      life: 0.45 + Math.random() * 0.25,
      maxLife: 0.7,
      color: i % 2 === 0 ? '#8BC34A' : '#2E7D32',
      size: 3 + Math.random() * 4,
      gravity: -10,
      friction: 0.94,
      type: 'circle'
    });
  }
  
}

export function addFireBurstEffect(effectSystem, x, y, color, radius) {
  effectSystem.addParticle({
    x: x,
    y: y,
    vx: 0,
    vy: 0,
    life: 0.5,
    maxLife: 0.5,
    color: '#FF5722',
    size: radius,
    gravity: 0,
    friction: 1.0,
    type: 'ring'
  });
  for (var i = 0; i < 26; i++) {
    var angle = Math.random() * Math.PI * 2;
    var speed = 90 + Math.random() * 190;
    effectSystem.addParticle({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.35 + Math.random() * 0.25,
      maxLife: 0.6,
      color: i % 3 === 0 ? '#FFD54F' : i % 3 === 1 ? '#FF5722' : '#D84315',
      size: 3 + Math.random() * 5,
      gravity: -20,
      friction: 0.9,
      type: 'spark'
    });
  }
  
}

export function addFireConeEffect(effectSystem, x, y, color, radius) {
  for (var i = 0; i < 30; i++) {
    var spread = (Math.random() - 0.5) * Math.PI * 0.75;
    var speed = 120 + Math.random() * 180;
    effectSystem.addParticle({
      x: x,
      y: y,
      vx: Math.cos(spread) * speed,
      vy: Math.sin(spread) * speed,
      life: 0.25 + Math.random() * 0.25,
      maxLife: 0.5,
      color: i % 2 === 0 ? '#FFAB00' : '#FF5722',
      size: 3 + Math.random() * 5,
      gravity: -15,
      friction: 0.92,
      type: 'spark'
    });
  }
  
}

export function addDashEffect(effectSystem, x, y, color, radius) {
  // Trail of particles along a line
  for (var i = 0; i < 20; i++) {
    effectSystem.addParticle({
      x: x + (Math.random() - 0.5) * 30,
      y: y + (Math.random() - 0.5) * 30,
      vx: (Math.random() - 0.5) * 80,
      vy: (Math.random() - 0.5) * 80,
      life: 0.3 + Math.random() * 0.2,
      maxLife: 0.5,
      color: color,
      size: 3 + Math.random() * 3,
      gravity: 0,
      friction: 0.9,
      type: 'circle'
    });
  }
  
}

export function addCloneEffect(effectSystem, x, y, color, radius) {
  // Puff of smoke particles
  for (var i = 0; i < 15; i++) {
    var angle = Math.random() * Math.PI * 2;
    var speed = 30 + Math.random() * 50;
    effectSystem.addParticle({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.4 + Math.random() * 0.3,
      maxLife: 0.7,
      color: '#90A4AE',
      size: 4 + Math.random() * 5,
      gravity: -20,
      // Float upward slightly
      friction: 0.93,
      type: 'circle'
    });
  }
  
}

export function addStunEffect(effectSystem, x, y, color, radius) {
  // Stars in a circle above target
  for (var i = 0; i < 8; i++) {
    var angle = i / 8 * Math.PI * 2;
    effectSystem.addParticle({
      x: x + Math.cos(angle) * 20,
      y: y - 20 + Math.sin(angle) * 10,
      vx: Math.cos(angle) * 15,
      vy: Math.sin(angle) * 15 - 10,
      life: 1.0,
      maxLife: 1.0,
      color: '#FFD700',
      size: 3,
      gravity: 0,
      friction: 0.98,
      type: 'spark'
    });
  }
  
}

export function addBackstabEffect(effectSystem, x, y, color, radius) {
  // Quick burst behind target
  for (var i = 0; i < 12; i++) {
    var angle = Math.random() * Math.PI * 2;
    var speed = 60 + Math.random() * 80;
    effectSystem.addParticle({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.2 + Math.random() * 0.15,
      maxLife: 0.35,
      color: '#B71C1C',
      size: 2 + Math.random() * 3,
      gravity: 0,
      friction: 0.9,
      type: 'spark'
    });
  }
  
}

export function addSlowEffect(effectSystem, x, y, color, radius) {
  // Blue/white particles spreading on ground
  for (var i = 0; i < 15; i++) {
    var angle = Math.random() * Math.PI * 2;
    var speed = 20 + Math.random() * 40;
    effectSystem.addParticle({
      x: x + (Math.random() - 0.5) * radius,
      y: y + (Math.random() - 0.5) * radius * 0.5,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed * 0.3,
      // Mostly horizontal
      life: 0.5 + Math.random() * 0.3,
      maxLife: 0.8,
      color: i % 2 === 0 ? '#42A5F5' : '#BBDEFB',
      size: 3 + Math.random() * 3,
      gravity: 0,
      friction: 0.92,
      type: 'circle'
    });
  }
  
}

