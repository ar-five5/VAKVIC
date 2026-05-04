import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ML_DIR = path.resolve(__dirname, '../../ml');

const ALLOWED_SCRIPTS = new Set(['ingest.py', 'score.py', 'predict.py', 'optimize.py']);
const TIMEOUT_MS = 120_000;

/**
 * Runs a Python ML script and returns parsed JSON output.
 * @param {string} script - Script filename e.g. 'predict.py'
 * @param {string[]} args - CLI args array e.g. ['--asset_id','1']
 * @returns {Promise<object>} Parsed JSON from script stdout
 */
export const runPython = (script, args = []) => {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_SCRIPTS.has(script)) {
      return reject(new Error(`Script not allowed: ${script}`));
    }

    const pythonPath = process.env.PYTHON_PATH || 'python';
    const scriptPath = path.join(ML_DIR, script);

    const proc = spawn(pythonPath, [scriptPath, ...args], {
      cwd: ML_DIR,
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error(`Python script ${script} timed out after ${TIMEOUT_MS / 1000}s`));
    }, TIMEOUT_MS);

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        return reject(new Error(
          `Python script ${script} exited ${code}: ${stderr}`
        ));
      }
      try {
        const jsonStart = stdout.lastIndexOf('{');
        const jsonStr = jsonStart >= 0 ? stdout.slice(jsonStart) : stdout;
        resolve(JSON.parse(jsonStr));
      } catch {
        reject(new Error(`Failed to parse JSON from ${script}: ${stdout}`));
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
};
