import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import AppError from './AppError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ML_DIR = path.resolve(__dirname, '../../ml');

const ALLOWED_SCRIPTS = new Set(['ingest.py', 'score.py', 'predict.py', 'optimize.py']);
const TIMEOUT_MS = 120_000;

function parsePythonJson(stdout) {
  const trimmed = stdout.trim();
  const jsonStart = trimmed.search(/[\[{]/);
  const jsonStr = jsonStart >= 0 ? trimmed.slice(jsonStart) : trimmed;
  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    const lastBrace = Math.max(jsonStr.lastIndexOf('}'), jsonStr.lastIndexOf(']'));
    if (lastBrace >= 0) {
      return JSON.parse(jsonStr.slice(0, lastBrace + 1));
    }
    throw err;
  }
}

function pythonFailure(script, stdout, stderr, code) {
  try {
    const parsed = parsePythonJson(stdout);
    if (parsed && parsed.success === false) {
      return new AppError(parsed.error || `${script} failed`, 422, 'ML_SCRIPT_ERROR');
    }
  } catch {
    // Fall through to the generic execution error below.
  }

  const detail = stderr.trim() || stdout.trim() || `exit code ${code}`;
  return new AppError(`Python script ${script} failed: ${detail}`, 502, 'PYTHON_EXECUTION_ERROR');
}

/**
 * Runs a Python ML script and returns parsed JSON output.
 * @param {string} script - Script filename e.g. 'predict.py'
 * @param {string[]} args - CLI args array e.g. ['--asset_id','1']
 * @returns {Promise<object>} Parsed JSON from script stdout
 */
export const runPython = (script, args = []) => {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_SCRIPTS.has(script)) {
      return reject(new AppError(`Script not allowed: ${script}`, 400, 'VALIDATION_ERROR'));
    }

    const pythonPath = process.env.PYTHON_PATH || 'python';
    const scriptPath = path.join(ML_DIR, script);

    const proc = spawn(pythonPath, [scriptPath, ...args], {
      cwd: ML_DIR,
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value);
    };

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      finish(
        reject,
        new AppError(`Python script ${script} timed out after ${TIMEOUT_MS / 1000}s`, 504, 'PYTHON_TIMEOUT')
      );
    }, TIMEOUT_MS);

    proc.on('close', (code) => {
      if (code !== 0) {
        return finish(reject, pythonFailure(script, stdout, stderr, code));
      }
      try {
        finish(resolve, parsePythonJson(stdout));
      } catch {
        finish(
          reject,
          new AppError(`Failed to parse JSON from ${script}: ${stdout}`, 502, 'PYTHON_PARSE_ERROR')
        );
      }
    });

    proc.on('error', (err) => {
      finish(reject, new AppError(`Unable to start Python: ${err.message}`, 502, 'PYTHON_EXECUTION_ERROR'));
    });
  });
};
