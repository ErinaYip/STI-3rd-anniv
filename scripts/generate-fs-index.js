const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const fsRoot = path.join(repoRoot, 'fs');
const outputPath = path.join(fsRoot, 'index.json');

function toPosixPath(inputPath) {
    return inputPath.split(path.sep).join('/');
}

function buildNode(relativePath) {
    const absolutePath = path.join(fsRoot, relativePath);
    const stats = fs.statSync(absolutePath);

    if (stats.isDirectory()) {
        const children = {};
        const names = fs.readdirSync(absolutePath).sort((left, right) => left.localeCompare(right));

        names.forEach((name) => {
            if (name === 'index.json') {
                return;
            }
            const childRelativePath = path.join(relativePath, name);
            children[name] = buildNode(childRelativePath);
        });

        return {
            type: 'dir',
            children
        };
    }

    return {
        type: 'file',
        source: toPosixPath(`./fs/${relativePath}`)
    };
}

const manifest = buildNode('');
fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${path.relative(repoRoot, outputPath)}`);
