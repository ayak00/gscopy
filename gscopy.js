/*
 * GitのStaging状態のファイルを収集するnodeスクリプト
 * TODO: Windowsでしか確認してない
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const STATWORDS = [
  { key: 'modified:', stat: 'MOD' },
  { key: 'new file:', stat: 'NEW' },
  { key: 'deleted:', stat: 'DEL' },
];
const DEFAULT_OUT_DIR = 'copy';

main();

//
// Functions
//

async function main() {
  if (process.argv.length < 3) {
    console.error("Usege: node gscopy [gitコマンド実行場所] ([出力先])");
    return;
  }
  let execDir = process.argv[2];
  if (!existDir(execDir)) {
    console.log(`[${execDir}]がありません。`);
    return;
  }

  let outDir = DEFAULT_OUT_DIR;
  if (process.argv.length > 3) {
    outDir = process.argv[3];
  }

  const stdout = execSync('git status', { cwd : execDir });
  let lines = stdout.toString().split(/\r\n|\r|\n/);

  let collectFiles = [];

  for (let line of lines) {
    if (isEnd(line)) {
      break;
    }
    let changeFile = getChangeFile(line);
    if (changeFile) {
      collectFiles.push(changeFile);
    }
  }

  if (collectFiles.length == 0) {
    console.log('該当ファイル無し');
    return;
  }

  if (existDir(outDir)) {
    for (;;) {
      if (!await confirm(`出力先[${outDir}]が存在します。クリアして続けますか?(y/N) `)) {
        console.log("終了します。");
        process.exit(0);
      } else {
        fs.rmdirSync(outDir, { recursive: true });
        setTimeout(function () {
          execCopy(collectFiles, execDir, outDir);
        }, 1000);
        break;
      }
    }
  } else {
    execCopy(collectFiles, execDir, outDir);
  }
}

function confirm(msg) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve, reject) => {
    rl.question(msg, (answer) => {
      rl.close();
      if (answer.trim().toLowerCase() === 'y') {
        resolve(true);
      }
      resolve(false);
    });
  });
}

function getChangeFile(line) {
  for (let statword of STATWORDS) {
    if (line.includes(statword.key)) {
      let filePath = line.replace(statword.key, '').trim();
      if (filePath.startsWith('..')) {
        return false;
      }
      return {
        stat: statword.stat,
        filePath: filePath,
      }
    }
  }
  return false;
}

function isEnd(line) {
  if (line.includes('Changes not staged for commit:')
   || line.includes('Untracked files:')) {
    return true;
  }
  return false;
}

function existDir(path) {
  try {
    let stat = fs.statSync(path);
    if (stat.isDirectory()) {
      return true;
    }
    return false;
  } catch (err){
    if (err.code === 'ENOENT') return false;
  }
}

function execCopy(collectFiles, execDir, outDir) {
  // console.log(`execCopy:execDir[${execDir}] outDir[${outDir}]`);

  fs.mkdirSync(outDir, { recursive: true });

  for (let f of collectFiles) {
    let msg = `[${f.stat}][${f.filePath}]`;
    if (f.stat === 'DEL') {
      console.log('\u001b[31m' + msg + '\u001b[0m'); // 赤字表示
      continue;
    }
    console.log(msg);

    fs.mkdirSync(path.dirname(outDir + path.sep + f.filePath), { recursive: true });
    fs.copyFileSync(
      execDir + path.sep + f.filePath,
      outDir + path.sep + f.filePath);
  }
}
