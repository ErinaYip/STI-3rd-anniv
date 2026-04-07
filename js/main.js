
/* ------------------------------------------------
    1. 实时时钟功能
------------------------------------------------ */
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false });
    const dateString = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    document.getElementById('clock').innerText = `${dateString} ${timeString}`;
}
setInterval(updateClock, 1000);
updateClock();

/* ------------------------------------------------
    2. Matrix 背景特效
------------------------------------------------ */
const canvas = document.getElementById('matrix-bg');
const ctx = canvas.getContext('2d');

// 设置全屏
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const fontSize = 14;
const columns = canvas.width / fontSize;
const drops = Array(Math.floor(columns)).fill(1);

function drawMatrix() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; // 拖影效果
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0F0'; // 绿色文字
    ctx.font = fontSize + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}
setInterval(drawMatrix, 50);

// 窗口大小改变时重置 Canvas
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

/* ------------------------------------------------
    3. 窗口拖拽功能
------------------------------------------------ */
const terminal = document.getElementById('terminal');
const header = document.getElementById('drag-header');

// 移除初始的 transform，改用 top/left 定位，防止拖拽计算冲突
// 在JS初始化时固定位置
terminal.style.left = (window.innerWidth / 2 - 350) + 'px';
terminal.style.top = (window.innerHeight / 2 - 225) + 'px';
terminal.style.transform = 'none';

let isDragging = false;
let offsetX, offsetY;

header.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - terminal.offsetLeft;
    offsetY = e.clientY - terminal.offsetTop;
    header.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        terminal.style.left = (e.clientX - offsetX) + 'px';
        terminal.style.top = (e.clientY - offsetY) + 'px';
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    header.style.cursor = 'move';
});

/* ------------------------------------------------
    4. 窗口调整大小功能
------------------------------------------------ */

const resizer = terminal.querySelector('.term-resizer');
let isResizing = false;
let startWidth, startHeight, startX, startY;
resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    startWidth = terminal.offsetWidth;
    startHeight = terminal.offsetHeight;
    startX = e.clientX;
    startY = e.clientY;
    e.preventDefault(); // 防止选中文本
});
document.addEventListener('mousemove', (e) => {
    if (isResizing) {
        const newWidth = startWidth + (e.clientX - startX);
        const newHeight = startHeight + (e.clientY - startY);
        terminal.style.width = newWidth + 'px';
        terminal.style.height = newHeight + 'px';
    }
});
document.addEventListener('mouseup', () => {
    isResizing = false;
});

/* ------------------------------------------------
    5. 终端逻辑与命令解析
------------------------------------------------ */
const input = document.getElementById('cmd-input');
const historyDiv = document.getElementById('history');
const termBody = document.getElementById('term-body');

// ASCII Art Logo
const fastfetchArt = `
<span class="c-cyan">         __ </span>  <span class="c-green">root@stier</span>
<span class="c-cyan">        / / </span>  --------------
<span class="c-cyan">       / /  </span>  <span class="c-yellow">OS</span>: HTML5 Web Desktop
<span class="c-cyan">      / /   </span>  <span class="c-yellow">Kernel</span>: Browser Engine
<span class="c-cyan">     / /    </span>  <span class="c-yellow">Uptime</span>: Just now
<span class="c-cyan">    /  \\    </span>  <span class="c-yellow">Shell</span>: JS-Bash
<span class="c-cyan">   /    \\   </span>  <span class="c-yellow">Resolution</span>: ${window.innerWidth}x${window.innerHeight}
<span class="c-cyan">  / | |\\ \\  </span>  <span class="c-yellow">Memory</span>: Simulated 100%
<span class="c-cyan"> / /| | \\ \\ </span>
<span class="c-cyan">| | | | / / </span>
<span class="c-cyan">| | | |/ /  </span>
<span class="c-cyan">| | |   /   </span>
<span class="c-cyan">| | | | \\   </span>
<span class="c-cyan">| | | |\\ \\  </span>
<span class="c-cyan">| | | | \\ \\  </span>
<span class="c-cyan">| | | |  \\_\\</span>
<span class="c-cyan">| | | |     </span>
<span class="c-cyan">| | |_|     </span>
<span class="c-cyan">| |         </span>
<span class="c-cyan">|_|         </span>
`;

input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const cmd = this.value.trim();
        
        // 1. 添加用户的输入历史
        const userLine = document.createElement('div');
        userLine.className = 'output-line';
        userLine.innerHTML = `<span class="prompt">root@stier:~$</span> ${cmd}`;
        historyDiv.appendChild(userLine);

        // 2. 处理命令
        processCommand(cmd.toLowerCase());

        // 3. 清空输入框并滚动到底部
        this.value = '';
        termBody.scrollTop = termBody.scrollHeight;
    }
});

function processCommand(cmd) {
    let output = '';

    switch(cmd) {
        case 'help':
            output = `Available commands:<br>
<span class="c-yellow">help</span>      Show this help message<br>
<span class="c-yellow">clear</span>     Clear the terminal screen<br>
<span class="c-yellow">date</span>      Show current date and time<br>
<span class="c-yellow">ls</span>        List directory contents (fake)<br>
<span class="c-yellow">whoami</span>    Print effective userid<br>
<span class="c-yellow">fastfetch</span>  Show system info<br>
<span class="c-yellow">reboot</span>    Reload the page<br>`;
            break;
        case 'clear':
            historyDiv.innerHTML = '';
            return; // 直接返回，不添加空行
        case 'date':
            output = new Date().toString();
            break;
        case 'whoami':
            output = 'root';
            break;
        case 'ls':
            output = '<span class="c-cyan">Documents</span>  <span class="c-cyan">Downloads</span>  <span class="c-cyan">Music</span>  <span class="c-cyan">Pictures</span>  notes.txt  script.js';
            break;
        case 'fastfetch':
            output = `<div class="ascii-art">${fastfetchArt}</div>`;
            break;
        case 'reboot':
            output = 'Rebooting system...';
            setTimeout(() => location.reload(), 1000);
            break;
        case '':
            return;
        default:
            output = `bash: ${cmd}: command not found`;
    }

    if (output) {
        const responseLine = document.createElement('div');
        responseLine.className = 'output-line';
        responseLine.innerHTML = output;
        historyDiv.appendChild(responseLine);
    }
}

// 保持输入框聚焦
document.addEventListener('click', () => {
        // 只有当用户没有选中文本时才强制聚焦，方便用户复制
    if(window.getSelection().toString() === "") {
        input.focus();
    }
});