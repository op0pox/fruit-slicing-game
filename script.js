const game = document.querySelector('.game');
const templates = document.querySelectorAll('.item');
const scoreBoard = document.getElementById('scoreBoard');
const livesBoard = document.getElementById('livesBoard');

let score = 0;
let lives = 3;
let gameOver = false;

let mouse = { x: 0, y: 0 };
let lastMouse = { x: 0, y: 0 };

let itemSpawner;

// 실제 과일/폭탄 클래스 정의
const GOOD_FRUITS = ['apple'];
const BAD_FRUITS = ['strawberry', 'grape'];
const BOMB = 'bomb';

// 사과 확률을 높이기 위한 템플릿 목록 재구성
const appleTemplate = document.querySelector('.apple');
const weightedTemplates = Array.from(templates); 
weightedTemplates.push(appleTemplate, appleTemplate, appleTemplate);
// (사과 4, 다른 아이템 각 1)

// ⭐️⭐️ 물리 상수 정의 ⭐️⭐️
const GRAVITY = 0.4; // 중력 가속도
const INITIAL_Y_SPEED = 14; // 초기 수직 속도
const MAX_X_SPEED = 4; // 최대 수평 속도


// 마우스 움직임 이벤트 (충돌 로직 유지)
document.addEventListener('mousemove', e => {
    if (gameOver) return;

    lastMouse.x = mouse.x;
    lastMouse.y = mouse.y;
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    drawSliceLine(lastMouse.x, lastMouse.y, mouse.x, mouse.y);

    const items = game.querySelectorAll('.item');
    if (items.length === 0) return;

    // 충돌 체크
    items.forEach(item => {
        if (!item.parentElement || item.style.opacity == 0) return; 
        
        const rect = item.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 아이템 크기 120px에 맞춰 충돌 허용 범위 90px 유지
        const distance = pointLineDistance(centerX, centerY, lastMouse.x, lastMouse.y, mouse.x, mouse.y); 

        if (distance < 90) { 
            
            let isProcessed = true; 

            if (item.classList.contains(BOMB)) {
                lives--;
            } else if (GOOD_FRUITS.some(c => item.classList.contains(c))) {
                score=score+50;
            } else if (BAD_FRUITS.some(c => item.classList.contains(c))) {
                score=score-10;
            } else {
                isProcessed = false;
            }

            if (!isProcessed) return;

            // 게임 오버 체크 및 상태 업데이트
            if (lives <= 0) {
                gameOver = true;
                if (itemSpawner) clearInterval(itemSpawner); 
                alert(`게임 오버! 점수: ${score}`);
            }

            scoreBoard.textContent = `점수: ${score}`;
            livesBoard.textContent = `목숨: ${lives}`;
            
            // 베인 효과 및 제거
            item.style.transition = 'transform 0.2s, opacity 0.2s';
            item.style.transform = "scale(1.5) rotate(20deg)";
            item.style.opacity = 0;
            setTimeout(() => item.remove(), 200);
        }
    });
});

document.addEventListener('touchmove', e => {
    // 터치 이벤트는 touches 배열을 사용합니다. 첫 번째 터치만 사용합니다.
    const touch = e.touches[0];
    if (!touch) return; 

    // 마우스 이벤트와 동일한 로직을 수행합니다.
    if (gameOver) return;

    // lastMouse와 mouse 객체를 터치 좌표로 업데이트합니다.
    lastMouse.x = mouse.x;
    lastMouse.y = mouse.y;
    mouse.x = touch.clientX;
    mouse.y = touch.clientY;

    drawSliceLine(lastMouse.x, lastMouse.y, mouse.x, mouse.y);

    // 충돌 체크 로직은 mousemove와 동일하게 유지
    const items = game.querySelectorAll('.item');
    if (items.length === 0) return;

    items.forEach(item => {
        if (!item.parentElement || item.style.opacity == 0) return; 
        
        const rect = item.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const distance = pointLineDistance(centerX, centerY, lastMouse.x, lastMouse.y, mouse.x, mouse.y); 

        if (distance < 90) { // 충돌 범위 90px 유지
            // ... (기존 충돌 처리 로직)

            let isProcessed = true; 
            if (item.classList.contains(BOMB)) { lives--; } 
            else if (GOOD_FRUITS.some(c => item.classList.contains(c))) { score++; } 
            else if (BAD_FRUITS.some(c => item.classList.contains(c))) { score--; } 
            else { isProcessed = false; }
            if (!isProcessed) return;

            if (lives <= 0) {
                gameOver = true;
                if (itemSpawner) clearInterval(itemSpawner); 
                alert(`게임 오버! 점수: ${score}`);
            }

            scoreBoard.textContent = `점수: ${score}`;
            livesBoard.textContent = `목숨: ${lives}`;
            
            item.style.transition = 'transform 0.2s, opacity 0.2s';
            item.style.transform = "scale(1.5) rotate(20deg)";
            item.style.opacity = 0;
            setTimeout(() => item.remove(), 200);
        }
    });
    
    // 모바일에서 스크롤을 방지합니다.
    e.preventDefault(); 
}, { passive: false }); // passive: false를 사용하여 preventDefault()가 작동하게 함

// 선-점 거리 계산 함수 (유지)
function pointLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = (len_sq !== 0) ? dot / len_sq : -1;
    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }
    const dx = px - xx, dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

// 아이템 생성 (⭐️⭐️ 포물선 운동 로직 적용 ⭐️⭐️)
function spawnItem() {
    if (gameOver) return;

    // 가중치가 적용된 템플릿에서 선택
    const randomTemplate = weightedTemplates[Math.floor(Math.random() * weightedTemplates.length)];
    const newItem = randomTemplate.cloneNode(true); 

    // 스타일 초기화
    newItem.removeAttribute('style');
    newItem.style.transition = 'none'; 
    newItem.style.opacity = '0.9';

    // 필요한 스타일 재설정
    newItem.style.display = 'flex';
    newItem.style.position = 'absolute';
    
    // 초기 위치
    let posX = Math.random() * (window.innerWidth - 120); // 120px은 아이템 크기
    let posY = 0; // bottom 위치 (화면 아래)
    newItem.style.left = `${posX}px`;
    newItem.style.bottom = `${posY}px`;
    game.appendChild(newItem);

    // ⭐️⭐️ 포물선 운동 변수 초기화 ⭐️⭐️
    // 수직 속도는 일정하게 위로 쏘고, 수평 속도는 랜덤하게 좌우로 설정
    let velocityY = INITIAL_Y_SPEED + Math.random() * 6; 
    let velocityX = (Math.random() - 0.5) * MAX_X_SPEED * 2; // -MAX_X_SPEED 에서 +MAX_X_SPEED 사이

    // move interval
    const move = setInterval(() => {
        if (gameOver) { 
            clearInterval(move);
            return;
        }
        
        // 1. 위치 업데이트
        posX += velocityX;
        posY += velocityY;
        
        // 2. 중력 적용 (수직 속도 감소)
        velocityY -= GRAVITY;
        
        // 3. 화면 경계 체크 (벽에 부딪힐 경우 반사)
        if (posX <= 0 || posX >= window.innerWidth - newItem.clientWidth) {
            velocityX *= -1; // 수평 속도 반전 (튕기기)
            // 화면 경계에 정확히 맞추기
            posX = Math.max(0, Math.min(posX, window.innerWidth - newItem.clientWidth));
        }

        // 4. CSS 반영
        newItem.style.left = `${posX}px`;
        newItem.style.bottom = `${posY}px`;
        
        // 5. 화면 밖으로 나가면 제거 (화면 아래로 완전히 떨어지거나, 너무 위로 올라가 수직 속도가 음수일 때)
        if (posY < -100) { // 화면 아래로 100px 더 내려가면 제거
            clearInterval(move);
            newItem.remove();
        }
        
        // *참고: 이 로직에서는 아이템이 수직으로 상승 후 하강하며 제거되므로, 화면 상단 밖으로 나갈 때 제거할 필요는 없습니다.
        
    }, 16); // 약 60FPS
}

// 랜덤 아이템 생성 반복 (유지)
itemSpawner = setInterval(() => {
    if (gameOver) return;
    const count = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < count; i++) spawnItem();
}, 800);

// 슬라이스 선 표시 (유지)
function drawSliceLine(x1, y1, x2, y2) {
    const line = document.createElement('div');
    line.className = 'slice-line';
    const length = Math.hypot(x2 - x1, y2 - y1);
    line.style.width = length + 'px';
    line.style.left = x1 + 'px';
    line.style.top = y1 + 'px';
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    line.style.transform = `rotate(${angle}deg)`;
    document.body.appendChild(line);
    setTimeout(() => line.remove(), 100); 
}

// 화면 크기 변경 시 대응 (유지)
window.addEventListener('resize', () => {
    // window.innerHeight 사용 → 자동 적용
});