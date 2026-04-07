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

const strArray = ['STI', '3rd', 'ANNIVERSARY', 'CELEBRATION', 'FLORANCE', 'Florance', 'CODEBOY', 'CodeBoy', 'CHOSEB', 'Chose_B', 'ERINA', 'Erina',  'USER694', 'P', 'AMYDXHS', 'TRUTHLUMING', 'TRUTHluming', 'LENZH', 'len_zh', 'Science', 'Technology', 'STI3rdAnniv', 'STI3rdAnniversary', 'STI3rd', 'Anniversary', 'STI3rdAnnivCelebration'];
const fontSize = 14;
const columns = canvas.width / fontSize;
const drops = Array(Math.floor(columns)).fill(1);
const columnsText = Array(Math.floor(columns)).fill('').map(() => [...strArray].sort(() => 0.5 - Math.random()).join(' '));

function drawMatrix() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; // 拖影效果
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0F0'; // 绿色文字
    ctx.font = fontSize + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
        const str = columnsText[i];
        const text = str.charAt(drops[i] % str.length);
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
            // 重新随机排列该列的字符串
            columnsText[i] = [...strArray].sort(() => 0.5 - Math.random()).join(' ');
        }
        drops[i]++;
    }
}
setInterval(drawMatrix, 50);

// 窗口大小改变时重置 Canvas
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const newColumns = Math.floor(canvas.width / fontSize);
    if (newColumns > drops.length) {
        for (let i = drops.length; i < newColumns; i++) {
            drops.push(1);
            columnsText.push([...strArray].sort(() => 0.5 - Math.random()).join(' '));
        }
    }
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
        const newWidth = Math.max(600, startWidth + (e.clientX - startX));
        const newHeight = Math.max(400, startHeight + (e.clientY - startY));
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
const promptSpan = document.querySelector('.command-line .prompt');

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'];
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov', 'm4v'];

// 可自定义的虚拟文件树（目录: type=dir，文件: type=file）
const FILE_SYSTEM = {
    type: 'dir',
    children: {
        Documents: {
            type: 'dir',
            children: {
                'plan.md': { type: 'file',
                            content: '# STI 3rd Anniversary\n\n- Build demo\n- Test UI\n- Ship it'
                        },
                'nameOFanother.txt': { type: 'file',
                    content: '科技楼神秘小团体'
                }
            }
        },
        Downloads: {
            type: 'dir',
            children: {
                'release-notes.txt': {
                    type: 'file',
                    content: 'v1.0.0\n- Initial web desktop release'
                }
            }
        },
        Music: {
            type: 'dir',
            children: {}
        },
        Pictures: {
            type: 'dir',
            children: {
                'flf.jpg': {
                    type: 'file',
                    mediaType: 'image',
                    src: './images/flf.jpg'
                }
            }
        },
        'notes.txt': {
            type: 'file',
            content: 'STI\'s 3rd anniversary is coming!'
        }
    }
};

let currentPath = '/';

function updatePrompt() {
    promptSpan.textContent = `root@stier:${currentPath}$`;
}

function pathToParts(path) {
    if (path === '/') {
        return [];
    }
    return path.split('/').filter(Boolean);
}

function partsToPath(parts) {
    return parts.length ? `/${parts.join('/')}` : '/';
}

function resolvePath(inputPath) {
    if (!inputPath || inputPath === '.') {
        return currentPath;
    }

    const baseParts = inputPath.startsWith('/') ? [] : pathToParts(currentPath);
    const inputParts = inputPath.split('/');

    for (const part of inputParts) {
        if (!part || part === '.') {
            continue;
        }
        if (part === '..') {
            if (baseParts.length) {
                baseParts.pop();
            }
            continue;
        }
        baseParts.push(part);
    }

    return partsToPath(baseParts);
}

function getNodeByPath(path) {
    const parts = pathToParts(path);
    let node = FILE_SYSTEM;

    for (const part of parts) {
        if (node.type !== 'dir') {
            return null;
        }
        node = node.children[part];
        if (!node) {
            return null;
        }
    }

    return node;
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getExtension(pathOrUrl) {
    const clean = pathOrUrl.split(/[?#]/)[0];
    const name = clean.split('/').pop() || '';
    const dotIndex = name.lastIndexOf('.');
    if (dotIndex < 0) {
        return '';
    }
    return name.slice(dotIndex + 1).toLowerCase();
}

function inferMediaTypeFromSource(pathOrUrl) {
    if (/^data:image\//i.test(pathOrUrl)) {
        return 'image';
    }
    if (/^data:video\//i.test(pathOrUrl)) {
        return 'video';
    }

    const ext = getExtension(pathOrUrl);
    if (IMAGE_EXTENSIONS.includes(ext)) {
        return 'image';
    }
    if (VIDEO_EXTENSIONS.includes(ext)) {
        return 'video';
    }
    return null;
}

function resolveMediaTarget(rawArg) {
    const targetPath = resolvePath(rawArg);
    const node = getNodeByPath(targetPath);

    if (node) {
        if (node.type !== 'file') {
            return { error: `view: ${rawArg}: Is a directory` };
        }

        const source = node.src || node.content;
        if (!source || typeof source !== 'string') {
            return { error: `view: ${rawArg}: Not a media file` };
        }

        const mediaType = node.mediaType || inferMediaTypeFromSource(source) || inferMediaTypeFromSource(rawArg);
        if (!mediaType) {
            return { error: `view: ${rawArg}: Unsupported media format` };
        }

        return { mediaType, source, label: targetPath };
    }

    const mediaType = inferMediaTypeFromSource(rawArg);
    if (!mediaType) {
        return { error: `view: ${rawArg}: No such file or unsupported URL format` };
    }

    return { mediaType, source: rawArg, label: rawArg };
}

function buildMediaPreviewHtml(mediaType, source, label) {
    const safeSource = escapeHtml(source);
    const safeLabel = escapeHtml(label);

    if (mediaType === 'image') {
        return `<div class="term-media-wrap"><div class="term-media-label">${safeLabel}</div><img class="term-media" src="${safeSource}" alt="preview"></div>`;
    }

    return `<div class="term-media-wrap"><div class="term-media-label">${safeLabel}</div><video class="term-media" src="${safeSource}" controls preload="metadata"></video></div>`;
}

function renderTree(node, prefix = '', isLast = true, name = '') {
    const lines = [];

    if (name) {
        const connector = isLast ? '└── ' : '├── ';
        const coloredName = node.type === 'dir' ? `<span class="c-cyan">${name}</span>` : name;
        lines.push(`${prefix}${connector}${coloredName}`);
    }

    if (node.type !== 'dir') {
        return lines;
    }

    const childNames = Object.keys(node.children).sort((a, b) => a.localeCompare(b));
    const nextPrefix = name ? `${prefix}${isLast ? '    ' : '│   '}` : prefix;

    childNames.forEach((childName, index) => {
        const childNode = node.children[childName];
        const childIsLast = index === childNames.length - 1;
        lines.push(...renderTree(childNode, nextPrefix, childIsLast, childName));
    });

    return lines;
}

updatePrompt();

// ASCII Art Logo
const fastfetchArt = `
<span class="c-cyan">         __ </span>  <span class="c-green">root@stier</span>
<span class="c-cyan">        / / </span>  --------------
<span class="c-cyan">       / /  </span>  <span class="c-yellow">OS</span>: HTML5 Web Desktop
<span class="c-cyan">      / /   </span>  <span class="c-yellow">Kernel</span>: Browser Engine
<span class="c-cyan">     / /    </span>  <span class="c-yellow">Uptime</span>: Just now
<span class="c-cyan">    /  \\    </span>  <span class="c-yellow">Pubtime</span>: Apr 26, 2023
<span class="c-cyan">   /    \\   </span>  <span class="c-yellow">Resolution</span>: ${window.innerWidth}x${window.innerHeight}
<span class="c-cyan">  / | |\\ \\  </span>  <span class="c-yellow">Memory</span>: Simulated 100%
<span class="c-cyan"> / /| | \\ \\ </span>  <span class="c-yellow">CPU</span>: Simulated 100%
<span class="c-cyan">| | | | / / </span>  <span class="c-yellow">Shell</span>: JS-Bash
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
        userLine.innerHTML = `<span class="prompt">root@stier:${currentPath}$</span><span class="user-input">${escapeHtml(cmd)}</span>`;
        historyDiv.appendChild(userLine);

        // 2. 处理命令
        processCommand(cmd);

        // 3. 清空输入框并滚动到底部
        this.value = '';
        termBody.scrollTop = termBody.scrollHeight;
    }
});

function processCommand(cmd) {
    let output = '';
    const [command, ...args] = cmd.split(/\s+/);
    const normalizedCommand = (command || '').toLowerCase();

    switch(normalizedCommand) {
        case 'help':
            output = `
Available commands:<br>
<span class="c-yellow">help</span>      Show this help message<br>
<span class="c-yellow">clear</span>     Clear the terminal screen<br>
<span class="c-yellow">date</span>      Show current date and time<br>
<span class="c-yellow">ls</span>        List directory contents<br>
<span class="c-yellow">tree</span>      Show file tree (use: tree [path])<br>
<span class="c-yellow">cd</span>        Change directory (use: cd [path])<br>
<span class="c-yellow">cat</span>       Show file content (use: cat &lt;file&gt;)<br>
<span class="c-yellow">view</span>      Preview image/video (use: view &lt;file|url&gt;)<br>
<span class="c-yellow">pwd</span>       Print current directory<br>
<span class="c-yellow">whoami</span>    Print effective userid<br>
<span class="c-yellow">fastfetch</span>  Show system info<br>
<span class="c-yellow">reboot</span>    Reload the page<br>`;
            break;
        case 'clear':
            historyDiv.innerHTML = '';
            return;
        case 'date':
            output = new Date().toString();
            break;
        case 'whoami':
            output = 'root';
            break;
        case 'ls':
            {
                const node = getNodeByPath(currentPath);
                const childNames = Object.keys(node.children).sort((a, b) => a.localeCompare(b));
                output = childNames
                    .map((name) => {
                        const child = node.children[name];
                        return child.type === 'dir' ? `<span class="c-cyan">${name}</span>` : name;
                    })
                    .join('  ');
            }
            break;
        case 'tree':
            {
                const targetPath = resolvePath(args[0] || '.');
                const node = getNodeByPath(targetPath);

                if (!node) {
                    output = `tree: cannot access '${args[0] || '.'}': No such file or directory`;
                    break;
                }

                if (node.type !== 'dir') {
                    output = args[0] || targetPath;
                    break;
                }

                const title = targetPath === '/' ? '<span class="c-cyan">/</span>' : `<span class="c-cyan">${targetPath}</span>`;
                const treeLines = renderTree(node);
                output = `${title}<br>${treeLines.join('<br>')}`;
            }
            break;
        case 'cd':
            {
                const targetPath = resolvePath(args[0] || '/');
                const node = getNodeByPath(targetPath);

                if (!node) {
                    output = `cd: ${args[0] || ''}: No such file or directory`;
                    break;
                }

                if (node.type !== 'dir') {
                    output = `cd: ${args[0]}: Not a directory`;
                    break;
                }

                currentPath = targetPath;
                updatePrompt();
            }
            break;
        case 'cat':
            {
                if (!args[0]) {
                    output = 'cat: missing file operand';
                    break;
                }

                const targetPath = resolvePath(args[0]);
                const node = getNodeByPath(targetPath);

                if (!node) {
                    output = `cat: ${args[0]}: No such file or directory`;
                    break;
                }

                if (node.type !== 'file') {
                    output = `cat: ${args[0]}: Is a directory`;
                    break;
                }

                if (typeof node.content !== 'string') {
                    output = `cat: ${args[0]}: Binary/media file, use 'view ${args[0]}'`;
                    break;
                }

                output = node.content.replace(/\n/g, '<br>');
            }
            break;
        case 'open':
        case 'view':
            {
                if (!args[0]) {
                    output = 'view: missing file or URL';
                    break;
                }

                const media = resolveMediaTarget(args[0]);
                if (media.error) {
                    output = media.error;
                    break;
                }

                output = buildMediaPreviewHtml(media.mediaType, media.source, media.label);
            }
            break;
        case 'pwd':
            output = currentPath;
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
            output = `bash: ${command}: command not found`;
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