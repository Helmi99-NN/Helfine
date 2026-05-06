const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src', 'components');

const replaceInFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace emerald with primary
    content = content.replace(/emerald-400/g, 'primary');
    content = content.replace(/emerald-500/g, 'primary');
    
    // Lighten text contrast
    content = content.replace(/text-slate-400/g, 'text-slate-300');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
};

const processDirectory = (dir) => {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            replaceInFile(fullPath);
        }
    });
};

processDirectory(directoryPath);

// Also process App.jsx
replaceInFile(path.join(__dirname, 'src', 'App.jsx'));
console.log('Migration complete.');
