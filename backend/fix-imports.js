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

// 修复单个文件的导入路径
function fixImportsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  // 修复错误的 'from ' 前缀
  newContent = newContent.replace(/from 'from '../g, "from '../");
  
  // 替换路径别名为相对路径
  const fileDir = path.dirname(filePath);
  const srcDir = path.join(__dirname, 'src');
  
  // 计算从当前文件到 src 目录的相对路径
  const relativeToSrc = path.relative(fileDir, srcDir).replace(/\\/g, '/');
  const prefix = relativeToSrc ? relativeToSrc + '/' : './';
  
  // 替换各种路径别名
  newContent = newContent.replace(/@\/config\//g, `${prefix}config/`);
  newContent = newContent.replace(/@\/middleware\//g, `${prefix}middleware/`);
  newContent = newContent.replace(/@\/services\//g, `${prefix}services/`);
  newContent = newContent.replace(/@\/utils\//g, `${prefix}utils/`);
  newContent = newContent.replace(/@\/routes\//g, `${prefix}routes/`);
  newContent = newContent.replace(/@\/types\//g, `${prefix}types/`);
  
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
      if (fixImportsInFile(file)) {
        fixedCount++;
      }
    } catch (error) {
      console.error(`修复文件 ${file} 时出错:`, error.message);
    }
  }
  
  console.log(`路径修复完成! 共修复了 ${fixedCount} 个文件`);
}

main();