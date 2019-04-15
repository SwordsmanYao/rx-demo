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
  context.clearRect(0, canvas.height - PADDLE_HEIGHT, canvas.width, canvas.height);
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
    brick.x - brick.width / 2,
    brick.y - brick.height/ 2,
    brick.width,
    brick.height
  );
  context.fill();
  context.closePath();
}

function drawBricks(bricks) {
  bricks.forEach(brick => drawBrick(brick));
}

const TICKER_INTERVAL = Math.ceil(1000 / 60);

// 时钟输入
const ticker$ = Rx.Observable.interval(TICKER_INTERVAL, Rx.Scheduler.requestAnimationFrame)
  .map(() => ({
    time: Date.now(),
    deltaTime: null
  }))
  .scan((previous, current) => ({
    time: current.time,
    deltaTime: (current.time - previous.time) / 1000  // 时间差值，用于计算小球和木板的具体位置（js中的定时器并不能保证时间间隔准确）
  }));

const PADDLE_CONTROLS = {
  ArrowLeft: -1,
  ArrowRight: 1
};

// 键盘输入
const key$ = Rx.Observable.merge(
  Rx.Observable.fromEvent(document, 'keydown').map(event => PADDLE_CONTROLS[event.key] || 0),
  Rx.Observable.fromEvent(document, 'keyup').map(event => 0)
)
  .distinctUntilChanged(); // 保险起见，做一下去重

const PADDLE_SPEED = 240;

// 产生球拍位置的流
const createPaddle$ = ticker$ => ticker$
  .withLatestFrom(key$)
  .scan((position, [ticker, direction]) => {
    const nextPosition = position + direction * ticker.deltaTime * PADDLE_SPEED;
    return Math.max(
      Math.min(nextPosition, canvas.width - PADDLE_WIDTH / 2),
      PADDLE_WIDTH / 2
    );
  }, canvas.width / 2)
  .distinctUntilChanged();

// 判断球和木板是否碰撞
function isHit(paddle, ball) {
  return ball.position.x > paddle - PADDLE_WIDTH / 2
    && ball.position.x < paddle + PADDLE_WIDTH / 2
    && ball.position.y > canvas.height - PADDLE_HEIGHT - BALL_RADIUS / 2;
}

// 判断球和砖块是否碰撞
function isCollision(brick, ball) {
  return ball.position.x + ball.direction.x > brick.x - brick.width / 2
    && ball.position.x + ball.direction.x < brick.x  + brick.width / 2
    && ball.position.y + ball.direction.y > brick.y - brick.height / 2
    && ball.position.y + ball.direction.y < brick.y + brick.height / 2;
}

// 初始化状态
const initState = () => ({
  ball: {
    position: {
      x: canvas.width / 2,
      y: canvas.height / 2
    },
    direction: {
      x: 2,
      y: 2
    }
  },
  bricks: createBricks(),
  score: 0
});

// 初始化砖块
function createBricks() {
  let width = (canvas.width - BRICK_GAP - BRICK_GAP * BRICK_COLUMNS) / BRICK_COLUMNS;
  let bricks = [];
  for (let i = 0; i < BRICK_ROWS; i++) {
    for(let j = 0; j < BRICK_COLUMNS; j++) {
      bricks.push({
        x: j * (width + BRICK_GAP) + width / 2 + BRICK_GAP,
        y: i * (BRICK_HEIGHT + BRICK_GAP) + BRICK_HEIGHT / 2 + BRICK_GAP + 20,
        width: width,
        height: BRICK_HEIGHT
      });
    }
  }
  return bricks;
}

const BALL_SPEED = 60;

const createState$ = (ticker$, paddle$) =>
  ticker$
  .withLatestFrom(paddle$)
  .scan(({ ball, bricks, score}, [ticker, paddle]) => {
    let remainingBricks = [];
    const collisions = {
      paddle: false,
      floor: false,
      wall: false,
      ceiling: false,
      brick: false
    };

    ball.position.x = ball.position.x + ball.direction.x * ticker.deltaTime * BALL_SPEED;
    ball.position.y = ball.position.y + ball.direction.y * ticker.deltaTime * BALL_SPEED;

    bricks.forEach(brick => {
      if (!isCollision(brick, ball)) {
        remainingBricks.push(brick);
      } else {
        collisions.brick = true;
        score = score + 10;
      }
    });

    collisions.paddle = isHit(paddle, ball);

    if (ball.position.x < BALL_RADIUS || ball.position.x > canvas.width - BALL_RADIUS) {
      ball.direction.x = - ball.direction.x;
      collisions.wall = true;
    }

    collisions.ceiling = ball.position.y < BALL_RADIUS;

    if (collisions.brick || collisions.paddle || collisions.ceiling) {
      ball.direction.y = - ball.direction.y;
    }

    return {
      ball: ball,
      bricks: remainingBricks,
      collisions: collisions,
      score: score
    };
  }, initState());

function updateView([ticker, paddle, state]) {
  context.clearRect(0, 0, canvas.width, canvas.height);

  drawPaddle(paddle);
  drawBall(state.ball);
  drawBricks(state.bricks);
  drawScore(state.score);

  if (state.ball.position.y > canvas.height - BALL_RADIUS) {
    drawGameOver('GAME OVER');
    restart.error('game over');
  }

  if (state.bricks.length === 0) {
    drawGameOver('Congradulations');
    restart.error('cong');
  }
}

let restart;

(function (){
  const game$ = Rx.Observable.create(observer => {
    drawIntro();

    restart = new Rx.Subject();

    const paddle$ = createPaddle$(ticker$);
    const state$ = createState$(ticker$,  paddle$);
  
    ticker$.withLatestFrom(paddle$, state$)
      .merge(restart)
      .subscribe(observer);
  });

  game$.retryWhen(err$ => {
    return err$.delay(1000);
  }).subscribe(updateView);
})();


