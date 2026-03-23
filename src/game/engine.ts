import { Vector2, distance, normalize, randomRange } from './utils';

export class FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  vy: number;

  constructor(x: number, y: number, text: string, color: string) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.maxLife = 40;
    this.life = this.maxLife;
    this.vy = -1;
  }

  update() {
    this.y += this.vy;
    this.life--;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 5;
    ctx.shadowColor = this.color;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
  friction: number;

  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = randomRange(2, 10);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = randomRange(1, 4);
    this.color = color;
    this.maxLife = Math.floor(randomRange(20, 60));
    this.life = this.maxLife;
    this.friction = 0.92;
  }

  update() {
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fill();
    ctx.restore();
  }
}

export class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  damage: number;
  life: number;
  pierce: number;
  hitEnemies: Set<Enemy>;

  constructor(x: number, y: number, angle: number, speed: number, damage: number, color: string, pierce: number) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 4;
    this.color = color;
    this.damage = damage;
    this.life = 100;
    this.pierce = pierce;
    this.hitEnemies = new Set();
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    ctx.fill();
    ctx.restore();
  }
}

export class Enemy {
  x: number;
  y: number;
  radius: number;
  color: string;
  speed: number;
  health: number;
  maxHealth: number;
  type: 'basic' | 'fast' | 'tank';
  scoreValue: number;
  angle: number = 0;

  constructor(x: number, y: number, type: 'basic' | 'fast' | 'tank', waveMultiplier: number) {
    this.x = x;
    this.y = y;
    this.type = type;
    
    if (type === 'basic') {
      this.radius = 14;
      this.color = '#ff0055';
      this.speed = randomRange(1.8, 2.5);
      this.maxHealth = 20 * waveMultiplier;
      this.scoreValue = 10;
    } else if (type === 'fast') {
      this.radius = 10;
      this.color = '#00ffcc';
      this.speed = randomRange(3.5, 4.5);
      this.maxHealth = 10 * waveMultiplier;
      this.scoreValue = 15;
    } else {
      this.radius = 24;
      this.color = '#ffaa00';
      this.speed = randomRange(0.8, 1.2);
      this.maxHealth = 80 * waveMultiplier;
      this.scoreValue = 30;
    }
    this.health = this.maxHealth;
  }

  update(playerX: number, playerY: number) {
    const dir = normalize({ x: playerX - this.x, y: playerY - this.y });
    this.x += dir.x * this.speed;
    this.y += dir.y * this.speed;
    this.angle = Math.atan2(dir.y, dir.x);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    
    ctx.beginPath();
    if (this.type === 'basic') {
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    } else if (this.type === 'fast') {
      ctx.moveTo(this.radius, 0);
      ctx.lineTo(-this.radius, this.radius);
      ctx.lineTo(-this.radius, -this.radius);
      ctx.closePath();
    } else {
      ctx.rect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fill();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    ctx.stroke();
    
    ctx.restore();
    
    // Health bar if damaged
    if (this.health < this.maxHealth) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.fillRect(this.x - this.radius, this.y - this.radius - 10, this.radius * 2, 4);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(this.x - this.radius, this.y - this.radius - 10, (this.radius * 2) * (this.health / this.maxHealth), 4);
      ctx.restore();
    }
  }
}

export class Player {
  x: number;
  y: number;
  radius: number;
  color: string;
  speed: number;
  health: number;
  maxHealth: number;
  
  fireRate: number;
  fireTimer: number;
  spread: number;
  damage: number;
  bulletSpeed: number;
  pierce: number;
  
  dashTimer: number = 0;
  dashCooldown: number = 0;
  maxDashCooldown: number = 60;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.radius = 16;
    this.color = '#ffffff';
    this.speed = 5;
    this.maxHealth = 100;
    this.health = this.maxHealth;
    
    this.fireRate = 12;
    this.fireTimer = 0;
    this.spread = 1;
    this.damage = 10;
    this.bulletSpeed = 15;
    this.pierce = 1;
  }

  update(keys: Set<string>, width: number, height: number) {
    let dx = 0;
    let dy = 0;
    if (keys.has('w') || keys.has('arrowup')) dy -= 1;
    if (keys.has('s') || keys.has('arrowdown')) dy += 1;
    if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
    if (keys.has('d') || keys.has('arrowright')) dx += 1;

    if (keys.has(' ') && this.dashCooldown <= 0 && (dx !== 0 || dy !== 0)) {
      this.dashTimer = 12;
      this.dashCooldown = this.maxDashCooldown;
    }

    if (this.dashCooldown > 0) this.dashCooldown--;
    
    if (this.dashTimer > 0) {
      this.dashTimer--;
      this.speed = 15;
    } else {
      this.speed = 5;
    }

    const dir = normalize({ x: dx, y: dy });
    this.x += dir.x * this.speed;
    this.y += dir.y * this.speed;

    this.x = Math.max(this.radius, Math.min(width - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(height - this.radius, this.y));
    
    if (this.fireTimer > 0) this.fireTimer--;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00aaff';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#00aaff';
    ctx.fill();
    
    if (this.dashTimer > 0) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    ctx.restore();
  }
}

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  
  player: Player;
  bullets: Bullet[] = [];
  enemies: Enemy[] = [];
  particles: Particle[] = [];
  floatingTexts: FloatingText[] = [];
  
  keys: Set<string> = new Set();
  mouse: Vector2 = { x: 0, y: 0 };
  isMouseDown: boolean = false;
  
  score: number = 0;
  level: number = 1;
  waveMultiplier: number = 1;
  nextUpgradeScore: number = 500;
  
  frameCount: number = 0;
  isGameOver: boolean = false;
  isPaused: boolean = false;
  
  screenShake: number = 0;
  
  onGameOver?: (score: number) => void;
  onScoreUpdate?: (score: number, level: number) => void;
  onUpgradeAvailable?: () => void;
  onTogglePause?: () => void;
  
  animationId: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;
    
    this.player = new Player(this.width / 2, this.height / 2);
    
    this.setupInputs();
  }

  setupInputs() {
    const handleKeyDown = (e: KeyboardEvent) => {
      this.keys.add(e.key.toLowerCase());
      if (e.key === 'Escape') {
        if (!this.isGameOver && this.onTogglePause) {
          this.onTogglePause();
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => this.keys.delete(e.key.toLowerCase());
    const handleMouseMove = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    };
    const handleMouseDown = () => this.isMouseDown = true;
    const handleMouseUp = () => this.isMouseDown = false;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    this.canvas.addEventListener('mousemove', handleMouseMove);
    this.canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    this.cleanupInputs = () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      this.canvas.removeEventListener('mousemove', handleMouseMove);
      this.canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }
  
  cleanupInputs: () => void = () => {};

  start() {
    this.loop();
  }

  stop() {
    cancelAnimationFrame(this.animationId);
    this.cleanupInputs();
  }

  spawnEnemy() {
    const spawnMargin = 50;
    let x, y;
    if (Math.random() > 0.5) {
      x = Math.random() > 0.5 ? -spawnMargin : this.width + spawnMargin;
      y = Math.random() * this.height;
    } else {
      x = Math.random() * this.width;
      y = Math.random() > 0.5 ? -spawnMargin : this.height + spawnMargin;
    }

    const rand = Math.random();
    let type: 'basic' | 'fast' | 'tank' = 'basic';
    if (rand > 0.8) type = 'fast';
    if (rand > 0.95) type = 'tank';

    this.enemies.push(new Enemy(x, y, type, this.waveMultiplier));
  }

  createExplosion(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color));
    }
  }

  createDashTrail(x: number, y: number, color: string) {
    const p = new Particle(x, y, color);
    p.vx *= 0.2;
    p.vy *= 0.2;
    p.maxLife = 15;
    p.life = 15;
    this.particles.push(p);
  }

  update() {
    if (this.isGameOver || this.isPaused) return;

    this.frameCount++;
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    // Difficulty scaling
    if (this.frameCount % 600 === 0) {
      this.waveMultiplier += 0.2;
    }

    // Spawn enemies
    const spawnRate = Math.max(10, 60 - Math.floor(this.waveMultiplier * 5));
    if (this.frameCount % spawnRate === 0) {
      this.spawnEnemy();
    }

    this.player.update(this.keys, this.width, this.height);
    
    if (this.player.dashTimer > 0) {
      this.createDashTrail(this.player.x, this.player.y, '#00ffff');
    }

    // Shooting
    if (this.isMouseDown && this.player.fireTimer <= 0) {
      const angleToMouse = Math.atan2(this.mouse.y - this.player.y, this.mouse.x - this.player.x);
      
      const spreadAngle = 0.15;
      const startAngle = angleToMouse - (spreadAngle * (this.player.spread - 1)) / 2;
      
      for (let i = 0; i < this.player.spread; i++) {
        const angle = startAngle + i * spreadAngle;
        this.bullets.push(new Bullet(
          this.player.x, 
          this.player.y, 
          angle, 
          this.player.bulletSpeed, 
          this.player.damage, 
          '#ffff00',
          this.player.pierce
        ));
      }
      this.player.fireTimer = this.player.fireRate;
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.update();
      if (b.life <= 0 || b.x < 0 || b.x > this.width || b.y < 0 || b.y > this.height) {
        this.bullets.splice(i, 1);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.update();
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    if (this.screenShake > 0) {
      this.screenShake *= 0.9;
      if (this.screenShake < 0.5) this.screenShake = 0;
    }

    // Update enemies and collisions
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(this.player.x, this.player.y);

      // Player collision
      if (distance({ x: e.x, y: e.y }, { x: this.player.x, y: this.player.y }) < e.radius + this.player.radius) {
        this.player.health -= 10;
        this.createExplosion(this.player.x, this.player.y, '#ffffff', 10);
        this.screenShake = 15;
        this.enemies.splice(i, 1);
        
        if (this.player.health <= 0) {
          this.isGameOver = true;
          if (this.onGameOver) this.onGameOver(this.score);
        }
        continue;
      }

      // Bullet collision
      for (let j = this.bullets.length - 1; j >= 0; j--) {
        const b = this.bullets[j];
        if (!b.hitEnemies.has(e) && distance({ x: e.x, y: e.y }, { x: b.x, y: b.y }) < e.radius + b.radius) {
          e.health -= b.damage;
          this.createExplosion(b.x, b.y, e.color, 3);
          
          b.hitEnemies.add(e);
          b.pierce--;
          if (b.pierce <= 0) {
            this.bullets.splice(j, 1);
          }
          
          if (e.health <= 0) {
            this.score += e.scoreValue;
            this.createExplosion(e.x, e.y, e.color, 15);
            this.floatingTexts.push(new FloatingText(e.x, e.y, `+${e.scoreValue}`, e.color));
            this.enemies.splice(i, 1);
            
            if (this.score >= this.nextUpgradeScore) {
              this.level++;
              this.nextUpgradeScore = Math.floor(this.nextUpgradeScore * 1.5);
              this.isPaused = true;
              if (this.onUpgradeAvailable) this.onUpgradeAvailable();
            }
            
            if (this.onScoreUpdate) this.onScoreUpdate(this.score, this.level);
            break;
          }
        }
      }
    }
  }

  draw() {
    // Clear screen with trail effect
    this.ctx.fillStyle = 'rgba(10, 10, 15, 0.3)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    this.ctx.save();
    if (this.screenShake > 0) {
      const dx = (Math.random() - 0.5) * this.screenShake;
      const dy = (Math.random() - 0.5) * this.screenShake;
      this.ctx.translate(dx, dy);
    }
    
    // Draw grid
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    const gridSize = 50;
    for (let x = 0; x < this.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
    this.ctx.restore();

    this.particles.forEach(p => p.draw(this.ctx));
    this.bullets.forEach(b => b.draw(this.ctx));
    this.enemies.forEach(e => e.draw(this.ctx));
    this.floatingTexts.forEach(ft => ft.draw(this.ctx));
    
    if (!this.isGameOver) {
      this.player.draw(this.ctx);
      
      // Draw crosshair
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(this.mouse.x, this.mouse.y, 10, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(this.mouse.x - 15, this.mouse.y);
      this.ctx.lineTo(this.mouse.x + 15, this.mouse.y);
      this.ctx.moveTo(this.mouse.x, this.mouse.y - 15);
      this.ctx.lineTo(this.mouse.x, this.mouse.y + 15);
      this.ctx.stroke();
      this.ctx.restore();
    }
    
    this.ctx.restore(); // Restore screen shake
  }

  loop = () => {
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(this.loop);
  };
}
