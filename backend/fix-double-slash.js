const fs = require('fs');
const path = require('path');

// 递归获取所有 .ts 文件
function getAllTsFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && item !== 'node_modules' && item !== 'dist') {
      getAllTsFiles(fullPath, files);
    } else if (stat.isFile() && item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// 修复单个文件的双斜杠问题
function fixDoubleSlashInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // 修复双斜杠问题 - 更正正则表达式
  const newContent = content.replace(/from '\.\.\//g, "from '../");
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`修复了文件: ${path.relative(__dirname, filePath)}`);
    return true;
  }
  return false;
}

// 主函数
function main() {
  const srcDir = path.join(__dirname, 'src');
  const tsFiles = getAllTsFiles(srcDir);
  
  console.log(`找到 ${tsFiles.length} 个 TypeScript 文件`);
  
  let fixedCount = 0;
  for (const file of tsFiles) {
    try {
      if (fixDoubleSlashInFile(file)) {
        fixedCount++;
      }
    } catch (error) {
      console.error(`修复文件 ${file} 时出错:`, error.message);
    }
  }
  
  console.log(`双斜杠修复完成! 共修复了 ${fixedCount} 个文件`);
}

main();