const fs = require('fs');
const path = require('path');

const globalSkills = 'C:\\Users\\PlayM\\.gemini\\config\\skills';
const workspaceSkills = 'c:\\INTERN\\projects\\Projects\\web - SportiX\\.agents\\skills';

fs.mkdirSync(globalSkills, { recursive: true });
fs.mkdirSync(workspaceSkills, { recursive: true });

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(child => {
      copyRecursiveSync(path.join(src, child), path.join(dest, child));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// 1. UI-UX-Pro-Max Skills
const uiUxDir = path.join(__dirname, 'ui-ux-pro-max-skill', '.claude', 'skills');
if (fs.existsSync(uiUxDir)) {
  const dirs = fs.readdirSync(uiUxDir);
  dirs.forEach(d => {
    const full = path.join(uiUxDir, d);
    if (fs.statSync(full).isDirectory()) {
      copyRecursiveSync(full, path.join(globalSkills, d));
      copyRecursiveSync(full, path.join(workspaceSkills, d));
      console.log(`✅ Loaded UI-UX Pro Max Skill: ${d}`);
    }
  });
}

// 2. Emil Kowalski Skills
const emilDir = path.join(__dirname, 'emilkowalski-skills', 'skills');
if (fs.existsSync(emilDir)) {
  const dirs = fs.readdirSync(emilDir);
  dirs.forEach(d => {
    const full = path.join(emilDir, d);
    if (fs.statSync(full).isDirectory()) {
      copyRecursiveSync(full, path.join(globalSkills, d));
      copyRecursiveSync(full, path.join(workspaceSkills, d));
      console.log(`✅ Loaded Emil Kowalski Skill: ${d}`);
    }
  });
}

console.log('🎉 All skills successfully installed!');
