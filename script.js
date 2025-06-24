// Zmienne globalne
let ball; // Obiekt piłki
let platforms = []; // Tablica platform
let gravity = 0.5; // Grawitacja
let jumpForce = -10; // Siła skoku
let isJumping = false; // Czy piłka skacze

function setup() {
  createCanvas(800, 400); // Utwórz płótno o wymiarach 800x400 pikseli
  ball = new Ball(width / 2, height - 50, 20); // Utwórz piłkę (x, y, promień)
  
  // Utwórz kilka platform
  platforms.push(new Platform(0, height - 20, width, 20)); // Podłoga
  platforms.push(new Platform(200, 300, 100, 20)); // Platforma 1
  platforms.push(new Platform(400, 250, 100, 20)); // Platforma 2
  platforms.push(new Platform(600, 200, 100, 20)); // Platforma 3
}

function draw() {
  background(220); // Tło (szare)
  
  // Aktualizuj i wyświetl piłkę
  ball.update();
  ball.show();
  
  // Wyświetl platformy
  for (let platform of platforms) {
    platform.show();
    ball.checkCollision(platform); // Sprawdzaj kolizje z platformami
  }
  
  // Sterowanie
  if (keyIsDown(LEFT_ARROW)) {
    ball.move(-5); // Ruch w lewo
  }
  if (keyIsDown(RIGHT_ARROW)) {
    ball.move(5); // Ruch w prawo
  }
}

// Skok po naciśnięciu spacji
function keyPressed() {
  if (keyCode === 32 && !isJumping) { // Spacja
    ball.jump();
    isJumping = true;
  }
}

// Klasa reprezentująca piłkę
class Ball {
  constructor(x, y, r) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.vx = 0; // Prędkość pozioma
    this.vy = 0; // Prędkość pionowa
  }
  
  update() {
    // Zastosuj grawitację
    this.vy += gravity;
    this.x += this.vx;
    this.y += this.vy;
    
    // Ograniczenia ekranu (żeby piłka nie wypadła poza ekran)
    if (this.x - this.r < 0) this.x = this.r;
    if (this.x + this.r > width) this.x = width - this.r;
    if (this.y + this.r > height) {
      this.y = height - this.r;
      this.vy = 0;
      isJumping = false; // Piłka wylądowała
    }
  }
  
  show() {
    fill(255, 0, 0); // Czerwony kolor piłki
    ellipse(this.x, this.y, this.r * 2);
  }
  
  move(speed) {
    this.vx = speed;
  }
  
  jump() {
    this.vy = jumpForce;
  }
  
  checkCollision(platform) {
    // Sprawdź, czy piłka dotyka platformy
    if (this.x > platform.x && this.x < platform.x + platform.w &&
        this.y + this.r > platform.y && this.y + this.r < platform.y + platform.h &&
        this.vy > 0) {
      this.y = platform.y - this.r; // Ustaw piłkę na platformie
      this.vy = 0; // Zatrzymaj ruch w dół
      isJumping = false; // Piłka wylądowała
    }
  }
}

// Klasa reprezentująca platformę
class Platform {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
  
  show() {
    fill(0, 255, 0); // Zielony kolor platformy
    rect(this.x, this.y, this.w, this.h);
  }
}
