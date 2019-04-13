'use strict';

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
context.fillStyle='green';

// 木板
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 20;
// 球
const BALL_RADIUS = 10;
// 砖块
const BRICK_ROWS = 5;
const BRICK_COLUMNS = 7;
const BRICK_WIDTH = 80;
const BRICK_HEIGHT = 20;
const BRICK_GAP = 3;

// 开始界面
function drawIntro () {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.textAlign='center';
  context.font = '24px Courier New';
  context.fillText('Start', canvas.width / 2, canvas.height / 2);
}

// 结束界面
function drawGameOver (text) {
  context.clearRect(canvas.width / 4, canvas.height / 3, canvas.width / 2, canvas.height / 3);
  context.textAlign='center';
  context.font = '24px Courier New';
  context.fillText(text, canvas.width / 2, canvas.height / 2);
}

// 分数
function drawScore (score) {
  context.textAlign = 'left';
  context.font = '16px Courier New';
  context.fillText(score, BRICK_GAP, 16);  
}

// 球拍
function drawPaddle (position) {
  context.beginPath();
  context.rect(
    position - PADDLE_WIDTH / 2,
    context.canvas.height - PADDLE_HEIGHT,
    PADDLE_WIDTH,
    PADDLE_HEIGHT
  );
  context.fill();
  context.closePath();
}

// 球
function drawBall (ball) {
  context.beginPath();
  context.arc(ball.position.x, ball.position.y, BALL_RADIUS, 0, Math.PI * 2);
  context.fill();
  context.closePath();
}

// 砖块
function drawBrick(brick) {
  context.beginPath();
  context.rect(
    brick.x - BRICK_WIDTH / 2,
    brick.y - BRICK_HEIGHT/ 2,
    BRICK_WIDTH,
    BRICK_HEIGHT
  );
  context.fill();
  context.closePath();
}

function drawBricks(bricks) {
  bricks.forEach(brick => drawBrick(brick));
}



(function (){
  drawIntro();
  drawGameOver('Game Over');
  drawScore(16);
  drawPaddle(100);
  drawBall({position: { x: 100, y: 100 }});

  drawBricks([{
    x: 50,
    y: 50
  }])
})();


