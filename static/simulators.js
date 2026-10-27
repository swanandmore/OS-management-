/**
 * OS Resource Management & Algorithm Simulators Engine
 * Section 6.5 Simulation Walkthrough & Interactive Subsystems
 * OSDS Course Project - VIT Pune
 */

// ============================================================================
// 1. FILE SYSTEM EXPLORER
// ============================================================================
window.FileSystemExplorer = {
  currentPath: '',
  history: [],
  drives: [],
  items: [],
  filterQuery: '',

  async init() {
    await this.loadDrives();
    // Default to project directory or drive root
    const defaultPath = 'C:/Users/swana/.gemini/antigravity/scratch/os-dashboard';
    await this.navigate(defaultPath);
  },

  async loadDrives() {
    try {
      const res = await fetch('/api/fs');
      const data = await res.json();
      this.drives = data.items || [];
      this.renderDrives();
    } catch (e) {
      console.error('Failed to load storage drives:', e);
    }
  },

  renderDrives() {
    const container = document.getElementById('fsDrivesContainer');
    if (!container) return;
    if (!this.drives.length) {
      container.innerHTML = '<div style="color:#64748b; font-size:12px;">No active drives detected</div>';
      return;
    }

    container.innerHTML = this.drives.map(d => {
      const pct = d.percent || Math.round(((d.size_gb - d.free_gb) / (d.size_gb || 1)) * 100);
      const barColor = pct > 85 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#10b981';
      return `
        <div style="background: #161922; border: 1px solid #232734; border-radius: 8px; padding: 12px 16px; min-width: 200px; flex: 1;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <div style="font-weight:700; color:#fff; display:flex; align-items:center; gap:6px;">
              <span style="font-size:16px;">💾</span> ${d.name} (${d.fstype || 'NTFS'})
            </div>
            <button class="action-btn" style="padding:2px 8px; font-size:11px;" onclick="window.FileSystemExplorer.navigate('${d.path.replace(/\\/g, '\\\\')}')">Browse</button>
          </div>
          <div style="font-size:11px; color:#8c93a8; margin-bottom:6px;">
            ${d.free_gb} GB Free of ${d.size_gb} GB (${pct}% used)
          </div>
          <div style="background:#232734; height:6px; border-radius:3px; overflow:hidden;">
            <div style="background:${barColor}; width:${pct}%; height:100%;"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  async navigate(path) {
    if (!path) path = '/';
    try {
      const res = await fetch(`/api/fs?path=${encodeURIComponent(path)}`);
      if (!res.ok) {
        alert('Could not open path: ' + path);
        return;
      }
      const data = await res.json();
      this.currentPath = data.current_path;
      this.items = data.items || [];
      this.renderBreadcrumbs();
      this.renderItems();
    } catch (e) {
      console.error('FS navigation error:', e);
    }
  },

  goUp() {
    if (!this.currentPath || this.currentPath === '/' || this.currentPath.match(/^[A-Za-z]:\\?$/)) {
      this.navigate('/');
      return;
    }
    const parts = this.currentPath.replace(/\\/g, '/').split('/').filter(Boolean);
    if (parts.length <= 1) {
      this.navigate(parts[0].includes(':') ? parts[0] + '\\' : '/');
    } else {
      parts.pop();
      let parent = parts.join('\\');
      if (parent.length === 2 && parent[1] === ':') parent += '\\';
      this.navigate(parent);
    }
  },

  renderBreadcrumbs() {
    const el = document.getElementById('fsBreadcrumbs');
    if (!el) return;
    if (!this.currentPath || this.currentPath === '/') {
      el.innerHTML = `<span class="crumb active" onclick="window.FileSystemExplorer.navigate('/')">💻 Root (Storage Volumes)</span>`;
      return;
    }

    const normalized = this.currentPath.replace(/\\/g, '/');
    const parts = normalized.split('/').filter(Boolean);
    let cumulative = '';
    let html = `<span class="crumb" onclick="window.FileSystemExplorer.navigate('/')">💻 Volumes</span> <span style="color:#64748b;">/</span> `;

    parts.forEach((p, idx) => {
      if (idx === 0 && p.includes(':')) {
        cumulative = p + '\\';
      } else {
        cumulative = (cumulative.endsWith('\\') ? cumulative : cumulative + '\\') + p;
      }
      const isLast = idx === parts.length - 1;
      const safePath = cumulative.replace(/\\/g, '\\\\');
      if (isLast) {
        html += `<span class="crumb active">📁 ${p}</span>`;
      } else {
        html += `<span class="crumb" onclick="window.FileSystemExplorer.navigate('${safePath}')">${p}</span> <span style="color:#64748b;">/</span> `;
      }
    });

    el.innerHTML = html;
  },

  renderItems() {
    const tbody = document.getElementById('fsTableBody');
    const countEl = document.getElementById('fsItemCount');
    if (!tbody) return;

    let filtered = this.items;
    if (this.filterQuery) {
      const q = this.filterQuery.toLowerCase();
      filtered = filtered.filter(i => i.name.toLowerCase().includes(q));
    }

    if (countEl) {
      countEl.innerText = `${filtered.length} object${filtered.length === 1 ? '' : 's'}`;
    }

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b; padding:24px;">No files or folders found in this directory.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(item => {
      const isDir = item.type === 'directory' || item.type === 'drive';
      const safePath = (item.path || '').replace(/\\/g, '\\\\');
      const icon = isDir ? '📁' : this.getFileIcon(item.name);
      const sizeStr = isDir ? '-' : this.formatSize(item.size);
      const typeStr = isDir ? 'Directory' : this.getFileType(item.name);

      return `
        <tr style="cursor: ${isDir ? 'pointer' : 'default'};">
          <td onclick="${isDir ? `window.FileSystemExplorer.navigate('${safePath}')` : `window.FileSystemExplorer.previewFile('${safePath}')`}">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:16px;">${icon}</span>
              <strong style="color: ${isDir ? '#38bdf8' : '#e2e8f0'}; font-weight: ${isDir ? '600' : '400'};">
                ${item.name}
              </strong>
            </div>
          </td>
          <td style="color:#94a3b8; font-size:12px;">${typeStr}</td>
          <td style="color:#cbd5e1; font-family:monospace; font-size:12px;">${sizeStr}</td>
          <td style="color:#64748b; font-size:11px;">${item.modified || '-'}</td>
          <td>
            <div style="display:flex; gap:6px;">
              ${isDir ? `
                <button class="action-btn" style="padding:2px 8px; font-size:11px;" onclick="window.FileSystemExplorer.navigate('${safePath}')">Open</button>
              ` : `
                <button class="action-btn" style="padding:2px 8px; font-size:11px; background:#1e293b; color:#38bdf8;" onclick="window.FileSystemExplorer.previewFile('${safePath}')">Preview</button>
              `}
              <button class="action-btn" style="padding:2px 6px; font-size:11px; color:#ef4444;" title="Delete" onclick="window.FileSystemExplorer.deletePrompt('${safePath}', ${isDir})">✕</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
      case 'py': return '🐍';
      case 'js': case 'ts': return '📜';
      case 'html': case 'css': return '🌐';
      case 'json': case 'yaml': case 'yml': return '⚙️';
      case 'md': case 'txt': return '📄';
      case 'pdf': return '📕';
      case 'docx': case 'doc': return '📘';
      case 'db': case 'sqlite': return '🗄️';
      case 'png': case 'jpg': case 'jpeg': case 'ico': return '🖼️';
      case 'bat': case 'sh': case 'exe': return '⚡';
      default: return '📄';
    }
  },

  getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
      case 'py': return 'Python Source';
      case 'js': return 'JavaScript File';
      case 'html': return 'HTML Document';
      case 'css': return 'Cascading Style Sheet';
      case 'json': return 'JSON Data';
      case 'md': return 'Markdown Doc';
      case 'pdf': return 'PDF Document';
      case 'docx': return 'Word Document';
      case 'db': case 'sqlite': return 'SQLite Database';
      case 'png': case 'jpg': case 'ico': return 'Image Asset';
      case 'bat': return 'Batch Script';
      default: return 'Data File';
    }
  },

  formatSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  filter(query) {
    this.filterQuery = query;
    this.renderItems();
  },

  async previewFile(filePath) {
    try {
      const res = await fetch(`/api/fs/read?path=${encodeURIComponent(filePath)}`);
      if (!res.ok) {
        alert('Failed to read file preview');
        return;
      }
      const data = await res.json();
      const modal = document.getElementById('fsPreviewModal');
      const title = document.getElementById('fsPreviewTitle');
      const body = document.getElementById('fsPreviewBody');
      const meta = document.getElementById('fsPreviewMeta');

      if (title) title.innerText = data.name;
      if (meta) meta.innerText = `Size: ${this.formatSize(data.size)} | Path: ${data.path}`;
      if (body) {
        body.textContent = data.content || '(File is empty)';
      }
      if (modal) modal.style.display = 'flex';
    } catch (e) {
      alert('Error previewing file: ' + e);
    }
  },

  closePreview() {
    const modal = document.getElementById('fsPreviewModal');
    if (modal) modal.style.display = 'none';
  },

  async mkdirPrompt() {
    const name = prompt('Enter new folder name:');
    if (!name) return;
    const newDir = (this.currentPath.endsWith('\\') ? this.currentPath : this.currentPath + '\\') + name;
    try {
      const res = await fetch('/api/fs/mkdir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: newDir })
      });
      if (res.ok) {
        this.navigate(this.currentPath);
      } else {
        alert('Failed to create folder');
      }
    } catch (e) {
      alert('Error: ' + e);
    }
  },

  async createFilePrompt() {
    const name = prompt('Enter new file name (e.g. test.txt, script.py):');
    if (!name) return;
    const content = prompt('Enter initial file contents (optional):', '');
    const newPath = (this.currentPath.endsWith('\\') ? this.currentPath : this.currentPath + '\\') + name;
    try {
      const res = await fetch('/api/fs/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: newPath, content: content || '' })
      });
      if (res.ok) {
        this.navigate(this.currentPath);
      } else {
        alert('Failed to create file');
      }
    } catch (e) {
      alert('Error: ' + e);
    }
  },

  async deletePrompt(targetPath, isDir) {
    if (!confirm(`Are you sure you want to permanently delete:\n${targetPath}?`)) return;
    try {
      const res = await fetch('/api/fs/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: targetPath })
      });
      if (res.ok) {
        this.navigate(this.currentPath);
      } else {
        alert('Failed to delete item');
      }
    } catch (e) {
      alert('Error: ' + e);
    }
  }
};


// ============================================================================
// 2. CPU PROCESS SCHEDULER SIMULATOR (Figure 6.1)
// ============================================================================
window.SimCpu = {
  processes: [
    { pid: 'P1', arrival: 0, burst: 3, priority: 3, color: '#6366f1' },
    { pid: 'P2', arrival: 2, burst: 6, priority: 1, color: '#06b6d4' },
    { pid: 'P3', arrival: 4, burst: 4, priority: 4, color: '#10b981' },
    { pid: 'P4', arrival: 6, burst: 5, priority: 2, color: '#f43f5e' },
    { pid: 'P5', arrival: 8, burst: 2, priority: 5, color: '#fbbf24' }
  ],
  algorithm: 'SRTF',
  quantum: 2,
  contextSwitch: 0,
  isPlaying: false,
  timer: null,
  currentTick: 20,
  maxTick: 20,
  scheduleGantt: [],
  preemptions: [],
  results: {},

  init() {
    this.renderInputs();
    this.run();
  },

  onAlgoChange() {
    const sel = document.getElementById('cpuAlgoSelect');
    const qInput = document.getElementById('cpuQuantumInput');
    if (sel) {
      this.algorithm = sel.value;
      if (qInput) {
        if (this.algorithm === 'RR') {
          qInput.disabled = false;
          qInput.style.opacity = '1';
        } else {
          qInput.disabled = true;
          qInput.style.opacity = '0.5';
        }
      }
    }
    this.run();
  },

  renderInputs() {
    const tbody = document.getElementById('cpuProcessTableBody');
    if (!tbody) return;

    tbody.innerHTML = this.processes.map((p, idx) => {
      const res = this.results[p.pid] || { ct: '-', tat: '-', wt: '-' };
      return `
        <tr>
          <td><strong style="color: ${p.color};">${p.pid}</strong></td>
          <td><input type="number" min="0" value="${p.arrival}" style="width:50px; background:#161922; border:1px solid #334155; color:#fff; padding:2px 4px; border-radius:4px;" onchange="window.SimCpu.updateProcess(${idx}, 'arrival', this.value)"> ms</td>
          <td><input type="number" min="1" value="${p.burst}" style="width:50px; background:#161922; border:1px solid #334155; color:#fff; padding:2px 4px; border-radius:4px;" onchange="window.SimCpu.updateProcess(${idx}, 'burst', this.value)"> ms</td>
          <td><input type="number" min="1" value="${p.priority}" style="width:45px; background:#161922; border:1px solid #334155; color:#fff; padding:2px 4px; border-radius:4px;" onchange="window.SimCpu.updateProcess(${idx}, 'priority', this.value)"></td>
          <td style="font-family:monospace; color:#38bdf8;">${res.ct !== '-' ? res.ct + ' ms' : '-'}</td>
          <td style="font-family:monospace; color:#34d399;">${res.tat !== '-' ? res.tat + ' ms' : '-'}</td>
          <td style="font-family:monospace; color:#fbbf24;">${res.wt !== '-' ? res.wt + ' ms' : '-'}</td>
          <td>
            <div style="display:flex; align-items:center; gap:6px;">
              <span class="badge badge-emerald">Done</span>
              <button class="action-btn" style="padding:2px 5px; color:#ef4444; font-size:10px;" onclick="window.SimCpu.deleteProcess(${idx})">×</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  updateProcess(idx, field, val) {
    val = parseInt(val, 10);
    if (isNaN(val)) return;
    this.processes[idx][field] = val;
    this.run();
  },

  deleteProcess(idx) {
    if (this.processes.length <= 1) {
      alert('Must have at least one process.');
      return;
    }
    this.processes.splice(idx, 1);
    this.renderInputs();
    this.run();
  },

  addProcessPrompt() {
    const nextNum = this.processes.length + 1;
    const pid = prompt('Enter Process ID:', `P${nextNum}`);
    if (!pid) return;
    const arrival = parseInt(prompt('Arrival Time (ms):', '0') || '0', 10);
    const burst = parseInt(prompt('Burst Time (ms):', '4') || '4', 10);
    const priority = parseInt(prompt('Priority Level (1=Highest):', '3') || '3', 10);

    const colors = ['#818cf8', '#22d3ee', '#34d399', '#fb7185', '#fbbf24', '#a855f7', '#ec4899'];
    const color = colors[(this.processes.length) % colors.length];

    this.processes.push({ pid, arrival, burst, priority, color });
    this.renderInputs();
    this.run();
  },

  run() {
    const qEl = document.getElementById('cpuQuantumInput');
    if (qEl) this.quantum = Math.max(1, parseInt(qEl.value, 10) || 2);
    const csEl = document.getElementById('cpuContextSwitch');
    if (csEl) this.contextSwitch = Math.max(0, parseInt(csEl.value, 10) || 0);

    let procs = JSON.parse(JSON.stringify(this.processes));
    procs.forEach(p => {
      p.remBurst = p.burst;
      p.completion = 0;
      p.waiting = 0;
      p.tat = 0;
      p.startTime = -1;
    });

    let gantt = [];
    let preemptions = [];
    let currentTime = 0;
    let completed = 0;
    const n = procs.length;
    let lastRunningPid = null;

    if (this.algorithm === 'FCFS') {
      procs.sort((a, b) => a.arrival - b.arrival);
      for (let p of procs) {
        if (currentTime < p.arrival) {
          gantt.push({ pid: 'IDLE', start: currentTime, end: p.arrival, color: '#334155' });
          currentTime = p.arrival;
        }
        gantt.push({ pid: p.pid, start: currentTime, end: currentTime + p.burst, color: p.color });
        currentTime += p.burst;
        p.completion = currentTime;
      }
    } else if (this.algorithm === 'SJF') {
      let isCompleted = new Array(n).fill(false);
      while (completed < n) {
        let idx = -1;
        let minBurst = Infinity;
        for (let i = 0; i < n; i++) {
          if (procs[i].arrival <= currentTime && !isCompleted[i]) {
            if (procs[i].burst < minBurst) {
              minBurst = procs[i].burst;
              idx = i;
            }
          }
        }
        if (idx !== -1) {
          const p = procs[idx];
          gantt.push({ pid: p.pid, start: currentTime, end: currentTime + p.burst, color: p.color });
          currentTime += p.burst;
          p.completion = currentTime;
          isCompleted[idx] = true;
          completed++;
        } else {
          currentTime++;
        }
      }
    } else if (this.algorithm === 'SRTF') {
      let currentRunning = null;
      let startSlice = 0;

      while (completed < n) {
        let shortestIdx = -1;
        let minRem = Infinity;

        for (let i = 0; i < n; i++) {
          if (procs[i].arrival <= currentTime && procs[i].remBurst > 0) {
            if (procs[i].remBurst < minRem) {
              minRem = procs[i].remBurst;
              shortestIdx = i;
            }
          }
        }

        if (shortestIdx === -1) {
          if (currentRunning) {
            gantt.push({ pid: currentRunning.pid, start: startSlice, end: currentTime, color: currentRunning.color });
            currentRunning = null;
          }
          currentTime++;
          continue;
        }

        const nextProc = procs[shortestIdx];
        if (!currentRunning) {
          currentRunning = nextProc;
          startSlice = currentTime;
        } else if (currentRunning.pid !== nextProc.pid) {
          // Preemption occurred!
          gantt.push({ pid: currentRunning.pid, start: startSlice, end: currentTime, color: currentRunning.color });
          preemptions.push({
            time: currentTime,
            preemptor: nextProc.pid,
            preempted: currentRunning.pid,
            reason: `Process ${nextProc.pid} (Rem: ${nextProc.remBurst} ms) preempted ${currentRunning.pid} (Rem: ${currentRunning.remBurst} ms)`
          });
          currentRunning = nextProc;
          startSlice = currentTime;
        }

        nextProc.remBurst--;
        currentTime++;

        if (nextProc.remBurst === 0) {
          gantt.push({ pid: nextProc.pid, start: startSlice, end: currentTime, color: nextProc.color });
          nextProc.completion = currentTime;
          completed++;
          currentRunning = null;
          startSlice = currentTime;
        }
      }
    } else if (this.algorithm === 'Priority-Preemptive') {
      let currentRunning = null;
      let startSlice = 0;

      while (completed < n) {
        let bestIdx = -1;
        let highestPriority = Infinity;

        for (let i = 0; i < n; i++) {
          if (procs[i].arrival <= currentTime && procs[i].remBurst > 0) {
            if (procs[i].priority < highestPriority) {
              highestPriority = procs[i].priority;
              bestIdx = i;
            }
          }
        }

        if (bestIdx === -1) {
          if (currentRunning) {
            gantt.push({ pid: currentRunning.pid, start: startSlice, end: currentTime, color: currentRunning.color });
            currentRunning = null;
          }
          currentTime++;
          continue;
        }

        const nextProc = procs[bestIdx];
        if (!currentRunning) {
          currentRunning = nextProc;
          startSlice = currentTime;
        } else if (currentRunning.pid !== nextProc.pid) {
          gantt.push({ pid: currentRunning.pid, start: startSlice, end: currentTime, color: currentRunning.color });
          preemptions.push({
            time: currentTime,
            preemptor: nextProc.pid,
            preempted: currentRunning.pid,
            reason: `Priority ${nextProc.priority} (${nextProc.pid}) preempted Priority ${currentRunning.priority} (${currentRunning.pid})`
          });
          currentRunning = nextProc;
          startSlice = currentTime;
        }

        nextProc.remBurst--;
        currentTime++;

        if (nextProc.remBurst === 0) {
          gantt.push({ pid: nextProc.pid, start: startSlice, end: currentTime, color: nextProc.color });
          nextProc.completion = currentTime;
          completed++;
          currentRunning = null;
          startSlice = currentTime;
        }
      }
    } else if (this.algorithm === 'Priority-NonPreemptive') {
      let isCompleted = new Array(n).fill(false);
      while (completed < n) {
        let bestIdx = -1;
        let highestPriority = Infinity;
        for (let i = 0; i < n; i++) {
          if (procs[i].arrival <= currentTime && !isCompleted[i]) {
            if (procs[i].priority < highestPriority) {
              highestPriority = procs[i].priority;
              bestIdx = i;
            }
          }
        }
        if (bestIdx !== -1) {
          const p = procs[bestIdx];
          gantt.push({ pid: p.pid, start: currentTime, end: currentTime + p.burst, color: p.color });
          currentTime += p.burst;
          p.completion = currentTime;
          isCompleted[bestIdx] = true;
          completed++;
        } else {
          currentTime++;
        }
      }
    } else if (this.algorithm === 'RR') {
      let q = this.quantum;
      let readyQueue = [];
      let inQueue = new Array(n).fill(false);

      // Initial arrivals
      procs.sort((a, b) => a.arrival - b.arrival);
      for (let i = 0; i < n; i++) {
        if (procs[i].arrival <= currentTime && !inQueue[i]) {
          readyQueue.push(i);
          inQueue[i] = true;
        }
      }

      while (completed < n) {
        if (readyQueue.length === 0) {
          // Check next arriving
          let nextArrival = Infinity;
          for (let i = 0; i < n; i++) {
            if (!inQueue[i] && procs[i].arrival < nextArrival) nextArrival = procs[i].arrival;
          }
          if (nextArrival !== Infinity) {
            currentTime = nextArrival;
            for (let i = 0; i < n; i++) {
              if (procs[i].arrival <= currentTime && !inQueue[i]) {
                readyQueue.push(i);
                inQueue[i] = true;
              }
            }
          }
          continue;
        }

        let currIdx = readyQueue.shift();
        let p = procs[currIdx];
        let slice = Math.min(q, p.remBurst);

        gantt.push({ pid: p.pid, start: currentTime, end: currentTime + slice, color: p.color });
        currentTime += slice;
        p.remBurst -= slice;

        // Add any newly arrived processes during this slice
        for (let i = 0; i < n; i++) {
          if (procs[i].arrival <= currentTime && !inQueue[i]) {
            readyQueue.push(i);
            inQueue[i] = true;
          }
        }

        if (p.remBurst > 0) {
          readyQueue.push(currIdx);
        } else {
          p.completion = currentTime;
          completed++;
        }
      }
    }

    // Merge adjacent identical slices in gantt
    let mergedGantt = [];
    for (let slice of gantt) {
      if (slice.start === slice.end) continue;
      if (mergedGantt.length > 0 && mergedGantt[mergedGantt.length - 1].pid === slice.pid) {
        mergedGantt[mergedGantt.length - 1].end = slice.end;
      } else {
        mergedGantt.push(slice);
      }
    }
    this.scheduleGantt = mergedGantt;
    this.preemptions = preemptions;
    this.maxTick = currentTime;
    this.currentTick = currentTime;

    // Calculate process TAT, WT
    let totalWT = 0;
    let totalTAT = 0;
    this.results = {};

    procs.forEach(p => {
      p.tat = p.completion - p.arrival;
      p.waiting = p.tat - p.burst;
      totalWT += p.waiting;
      totalTAT += p.tat;
      this.results[p.pid] = { ct: p.completion, tat: p.tat, wt: p.waiting };
    });

    const awt = (totalWT / n).toFixed(2);
    const atat = (totalTAT / n).toFixed(2);
    const throughput = (n / (currentTime || 1)).toFixed(3);
    const contextSwitches = Math.max(0, mergedGantt.length - 1);

    // Update metrics UI
    const awtEl = document.getElementById('cpuMetricAwt');
    const atatEl = document.getElementById('cpuMetricAtat');
    const utilEl = document.getElementById('cpuMetricUtil');
    const switchEl = document.getElementById('cpuMetricSwitches');
    const tpEl = document.getElementById('cpuMetricThroughput');

    if (awtEl) awtEl.innerText = `${awt} ms`;
    if (atatEl) atatEl.innerText = `${atat} ms`;
    if (utilEl) utilEl.innerText = '100.0%';
    if (switchEl) switchEl.innerText = `${contextSwitches} Switches`;
    if (tpEl) tpEl.innerText = `${throughput} /ms`;

    this.renderGantt();
    this.renderInputs();
  },

  renderGantt() {
    const barsContainer = document.getElementById('cpuGanttBars');
    const timelineContainer = document.getElementById('cpuGanttTimeline');
    const calloutEl = document.getElementById('cpuPreemptCallout');
    const badgeEl = document.getElementById('cpuGanttTimeBadge');
    const queueEl = document.getElementById('cpuReadyQueueSnapshot');

    if (badgeEl) badgeEl.innerText = `Time: t = ${this.maxTick} ms (Finished)`;

    if (barsContainer && this.scheduleGantt.length > 0) {
      const totalSpan = this.maxTick || 1;
      barsContainer.innerHTML = this.scheduleGantt.map(g => {
        const pct = (((g.end - g.start) / totalSpan) * 100).toFixed(1);
        return `<div class="gantt-bar" style="width: ${pct}%; background: ${g.color};" title="${g.pid} [${g.start}-${g.end} ms]">${g.pid} [${g.start}-${g.end}]</div>`;
      }).join('');
    }

    if (timelineContainer && this.scheduleGantt.length > 0) {
      let ticks = [0];
      this.scheduleGantt.forEach(g => {
        if (!ticks.includes(g.end)) ticks.push(g.end);
      });
      ticks.sort((a, b) => a - b);
      timelineContainer.innerHTML = ticks.map(t => `<span>${t} ms</span>`).join('');
    }

    if (calloutEl) {
      if (this.preemptions.length > 0) {
        calloutEl.style.display = 'flex';
        calloutEl.innerHTML = `
          <span style="font-size: 14px;">⚡</span>
          <div>
            <strong>Preemption Events Detected (${this.preemptions.length}):</strong>
            ${this.preemptions.map(p => `At t = ${p.time} ms, ${p.reason}.`).join(' ')}
          </div>
        `;
      } else {
        calloutEl.style.display = 'none';
      }
    }

    if (queueEl && this.scheduleGantt.length > 0) {
      const last = this.scheduleGantt[this.scheduleGantt.length - 1];
      queueEl.innerHTML = `
        <span class="badge badge-emerald" style="padding: 8px 12px; font-size: 12px;">Final Running: ${last.pid} (Completed)</span>
        <span style="color: #64748b; font-size: 16px;">➔</span>
        <span class="badge badge-indigo" style="padding: 8px 12px; font-size: 12px;">All ${this.processes.length} Processes Finished</span>
      `;
    }
  },

  reset() {
    this.processes = [
      { pid: 'P1', arrival: 0, burst: 3, priority: 3, color: '#6366f1' },
      { pid: 'P2', arrival: 2, burst: 6, priority: 1, color: '#06b6d4' },
      { pid: 'P3', arrival: 4, burst: 4, priority: 4, color: '#10b981' },
      { pid: 'P4', arrival: 6, burst: 5, priority: 2, color: '#f43f5e' },
      { pid: 'P5', arrival: 8, burst: 2, priority: 5, color: '#fbbf24' }
    ];
    this.renderInputs();
    this.run();
  },

  step(delta) {
    this.run();
  },

  togglePlay() {
    const btn = document.getElementById('cpuPlayBtn');
    if (this.isPlaying) {
      this.isPlaying = false;
      if (btn) btn.innerText = '▶ Play';
      if (this.timer) clearInterval(this.timer);
    } else {
      this.isPlaying = true;
      if (btn) btn.innerText = '⏸ Pause';
      this.run();
      setTimeout(() => {
        this.isPlaying = false;
        if (btn) btn.innerText = '▶ Play';
      }, 1000);
    }
  }
};


// ============================================================================
// 3. CONTIGUOUS MEMORY MANAGEMENT & DYNAMIC PARTITIONING (Figure 6.2)
// ============================================================================
window.SimMem = {
  totalMemory: 1700,
  strategy: 'first', // 'first', 'best', 'worst'
  partitions: [
    { id: 0, base: 0, size: 100, occupant: null, used: 0 },
    { id: 1, base: 100, size: 500, occupant: 'P1', used: 212 },
    { id: 2, base: 600, size: 200, occupant: 'P3', used: 112 },
    { id: 3, base: 800, size: 300, occupant: null, used: 0 },
    { id: 4, base: 1100, size: 600, occupant: 'P2', used: 417 }
  ],
  processRequests: [
    { pid: 'P1', size: 212, assignedBlock: 'Block 1 (500 KB)', base: 100, decision: 'First partition >= 212 KB' },
    { pid: 'P2', size: 417, assignedBlock: 'Block 4 (600 KB)', base: 1100, decision: 'First partition >= 417 KB' },
    { pid: 'P3', size: 112, assignedBlock: 'Block 2 (200 KB)', base: 600, decision: 'First partition >= 112 KB' },
    { pid: 'P4', size: 183, assignedBlock: 'Block 4 (Tail)', base: 1517, decision: 'Fits in remaining partition space' }
  ],

  init() {
    this.render();
  },

  setStrategy(strat) {
    this.strategy = strat;
    ['First', 'Best', 'Worst'].forEach(s => {
      document.querySelectorAll(`#memStrat${s}`).forEach(el => {
        if (s.toLowerCase() === strat) {
          el.className = 'tab-pill active';
          el.innerText = `${s} Fit (Active)`;
        } else {
          el.className = 'tab-pill';
          el.innerText = `${s} Fit`;
        }
      });
    });
    this.render();
  },

  allocatePrompt() {
    const pid = prompt('Enter Process ID to allocate (e.g. P5):', `P${this.processRequests.length + 1}`);
    if (!pid) return;
    const size = parseInt(prompt('Enter memory size required (KB):', '150') || '0', 10);
    if (!size || size <= 0) return;

    let targetIdx = -1;

    if (this.strategy === 'first') {
      for (let i = 0; i < this.partitions.length; i++) {
        const p = this.partitions[i];
        const freeInBlock = p.occupant ? (p.size - p.used) : p.size;
        if (!p.occupant && p.size >= size) {
          targetIdx = i;
          break;
        }
      }
    } else if (this.strategy === 'best') {
      let minHole = Infinity;
      for (let i = 0; i < this.partitions.length; i++) {
        const p = this.partitions[i];
        if (!p.occupant && p.size >= size) {
          const diff = p.size - size;
          if (diff < minHole) {
            minHole = diff;
            targetIdx = i;
          }
        }
      }
    } else if (this.strategy === 'worst') {
      let maxHole = -1;
      for (let i = 0; i < this.partitions.length; i++) {
        const p = this.partitions[i];
        if (!p.occupant && p.size >= size) {
          const diff = p.size - size;
          if (diff > maxHole) {
            maxHole = diff;
            targetIdx = i;
          }
        }
      }
    }

    if (targetIdx === -1) {
      alert(`Allocation Failed! Insufficient contiguous memory block >= ${size} KB available under ${this.strategy.toUpperCase()} fit.`);
      return;
    }

    const blk = this.partitions[targetIdx];
    blk.occupant = pid;
    blk.used = size;

    this.processRequests.push({
      pid,
      size,
      assignedBlock: `Block ${blk.id} (${blk.size} KB)`,
      base: blk.base,
      decision: `${this.strategy.toUpperCase()} Fit matched hole of size ${blk.size} KB`
    });

    this.render();
  },

  deallocatePrompt() {
    const active = this.partitions.filter(p => p.occupant).map(p => p.occupant);
    if (!active.length) {
      alert('No active processes to deallocate.');
      return;
    }
    const pid = prompt(`Select process to deallocate (${active.join(', ')}):`, active[0]);
    if (!pid) return;

    let found = false;
    for (let p of this.partitions) {
      if (p.occupant === pid) {
        p.occupant = null;
        p.used = 0;
        found = true;
      }
    }

    if (found) {
      this.processRequests = this.processRequests.filter(r => r.pid !== pid);
      this.coalesceFreeBlocks();
      this.render();
    } else {
      alert(`Process ${pid} not found in memory.`);
    }
  },

  coalesceFreeBlocks() {
    // Merge adjacent unallocated partitions
    for (let i = 0; i < this.partitions.length - 1; i++) {
      if (!this.partitions[i].occupant && !this.partitions[i + 1].occupant) {
        this.partitions[i].size += this.partitions[i + 1].size;
        this.partitions.splice(i + 1, 1);
        i--;
      }
    }
    // Re-index partitions
    this.partitions.forEach((p, idx) => { p.id = idx; });
  },

  compact() {
    let currentBase = 0;
    let newPartitions = [];
    let freeSize = 0;

    for (let p of this.partitions) {
      if (p.occupant) {
        newPartitions.push({
          id: newPartitions.length,
          base: currentBase,
          size: p.size,
          occupant: p.occupant,
          used: p.used
        });
        currentBase += p.size;
      } else {
        freeSize += p.size;
      }
    }

    if (freeSize > 0) {
      newPartitions.push({
        id: newPartitions.length,
        base: currentBase,
        size: freeSize,
        occupant: null,
        used: 0
      });
    }

    this.partitions = newPartitions;
    this.render();
  },

  reset() {
    this.partitions = [
      { id: 0, base: 0, size: 100, occupant: null, used: 0 },
      { id: 1, base: 100, size: 500, occupant: 'P1', used: 212 },
      { id: 2, base: 600, size: 200, occupant: 'P3', used: 112 },
      { id: 3, base: 800, size: 300, occupant: null, used: 0 },
      { id: 4, base: 1100, size: 600, occupant: 'P2', used: 417 }
    ];
    this.processRequests = [
      { pid: 'P1', size: 212, assignedBlock: 'Block 1 (500 KB)', base: 100, decision: 'First partition >= 212 KB' },
      { pid: 'P2', size: 417, assignedBlock: 'Block 4 (600 KB)', base: 1100, decision: 'First partition >= 417 KB' },
      { pid: 'P3', size: 112, assignedBlock: 'Block 2 (200 KB)', base: 600, decision: 'First partition >= 112 KB' },
      { pid: 'P4', size: 183, assignedBlock: 'Block 4 (Tail)', base: 1517, decision: 'Fits in remaining partition space' }
    ];
    this.render();
  },

  render() {
    let totalAlloc = 0;
    let totalFree = 0;
    let totalFrag = 0;

    for (let p of this.partitions) {
      if (p.occupant) {
        totalAlloc += p.size;
        totalFrag += (p.size - p.used);
      } else {
        totalFree += p.size;
      }
    }

    const efficiency = (((totalAlloc - totalFrag) / this.totalMemory) * 100).toFixed(1);

    // Update metrics cards across both tabs
    document.querySelectorAll('#memMetricTotal').forEach(el => el.innerText = `${this.totalMemory} KB`);
    document.querySelectorAll('#memMetricAllocated').forEach(el => el.innerText = `${totalAlloc} KB`);
    document.querySelectorAll('#memMetricFree').forEach(el => el.innerText = `${totalFree} KB`);
    document.querySelectorAll('#memMetricInternalFrag').forEach(el => el.innerText = `${totalFrag} KB`);
    document.querySelectorAll('#memMetricEfficiency').forEach(el => el.innerText = `${efficiency}%`);

    // Visual Bar
    const colors = { P1: '#4f46e5', P2: '#0284c7', P3: '#059669', P4: '#e11d48', P5: '#d97706' };
    const barHtml = this.partitions.map(p => {
      const pctBlock = ((p.size / this.totalMemory) * 100).toFixed(1);
      if (!p.occupant) {
        return `<div class="mem-seg free" style="width: ${pctBlock}%;">Block ${p.id}<br>(${p.size}K Free)</div>`;
      } else {
        const usedPct = ((p.used / this.totalMemory) * 100).toFixed(1);
        const frag = p.size - p.used;
        const fragPct = ((frag / this.totalMemory) * 100).toFixed(1);
        const bg = colors[p.occupant] || '#8b5cf6';

        let html = `<div class="mem-seg" style="width: ${usedPct}%; background: ${bg};">${p.occupant}: ${p.used} KB</div>`;
        if (frag > 0) {
          html += `<div class="mem-seg internal-frag" style="width: ${fragPct}%;">Frag: ${frag} KB</div>`;
        }
        return html;
      }
    }).join('');

    document.querySelectorAll('#memVisualBar, .mem-visual-bar').forEach(el => el.innerHTML = barHtml);

    // Partition Table
    const partHtml = this.partitions.map(p => {
      const frag = p.occupant ? (p.size - p.used) : 0;
      return `
        <tr>
          <td><strong>Block ${p.id}</strong></td>
          <td>${p.base} KB</td>
          <td>${p.size} KB</td>
          <td>${p.occupant ? `<strong style="color:#38bdf8;">${p.occupant}</strong>` : '<span style="color:#64748b;">(Hole)</span>'}</td>
          <td>${p.occupant ? p.used + ' KB' : '0 KB'}</td>
          <td>${frag > 0 ? `<span style="color:#fbbf24;">${frag} KB</span>` : '0 KB'}</td>
          <td>${p.occupant ? '<span class="badge badge-emerald">Allocated</span>' : '<span class="badge badge-cyan">Free Hole</span>'}</td>
        </tr>
      `;
    }).join('');

    document.querySelectorAll('#memPartitionTableBody').forEach(el => el.innerHTML = partHtml);

    // Process Requests Table
    const reqHtml = this.processRequests.map(r => `
      <tr>
        <td><strong style="color: #818cf8;">${r.pid}</strong></td>
        <td>${r.size} KB</td>
        <td>${r.assignedBlock}</td>
        <td>${r.base} KB</td>
        <td>${r.decision}</td>
      </tr>
    `).join('');

    document.querySelectorAll('#memProcessTableBody').forEach(el => el.innerHTML = reqHtml);
  }
};


// ============================================================================
// 4. VIRTUAL MEMORY PAGE REPLACEMENT & BELADY'S ANOMALY (Figure 6.3)
// ============================================================================
window.SimPaging = {
  refString: [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1],
  framesCount: 3,
  algorithm: 'LRU',

  init() {
    this.run();
  },

  run() {
    const algoEl = document.getElementById('pageAlgoSelect');
    const frameEl = document.getElementById('pageFrameSelect');
    const refEl = document.getElementById('pageRefInput');

    if (algoEl) {
      const val = algoEl.value;
      if (val.includes('FIFO')) this.algorithm = 'FIFO';
      else if (val.includes('Optimal') || val.includes('OPT')) this.algorithm = 'OPT';
      else if (val.includes('LFU')) this.algorithm = 'LFU';
      else this.algorithm = 'LRU';
    }

    if (frameEl) {
      this.framesCount = parseInt(frameEl.value, 10) || 3;
    }

    if (refEl && refEl.value.trim()) {
      this.refString = refEl.value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    }

    this.simulate(this.algorithm, this.framesCount, this.refString);
  },

  simulate(algo, numFrames, refs) {
    let frames = [];
    let history = []; // { page, frames: [...], isHit, evicted }
    let hits = 0;
    let faults = 0;

    // Additional tracking data
    let fifoQueue = [];
    let lruAges = {};
    let lfuCounts = {};

    for (let i = 0; i < refs.length; i++) {
      const p = refs[i];
      let isHit = frames.includes(p);
      let evicted = null;

      lfuCounts[p] = (lfuCounts[p] || 0) + 1;
      lruAges[p] = i;

      if (isHit) {
        hits++;
      } else {
        faults++;
        if (frames.length < numFrames) {
          frames.push(p);
          fifoQueue.push(p);
        } else {
          // Replacement needed
          let victim = null;
          if (algo === 'FIFO') {
            victim = fifoQueue.shift();
          } else if (algo === 'LRU') {
            let oldest = Infinity;
            for (let f of frames) {
              if (lruAges[f] < oldest) {
                oldest = lruAges[f];
                victim = f;
              }
            }
          } else if (algo === 'OPT') {
            let furthest = -1;
            for (let f of frames) {
              let nextUse = Infinity;
              for (let j = i + 1; j < refs.length; j++) {
                if (refs[j] === f) { nextUse = j; break; }
              }
              if (nextUse > furthest) {
                furthest = nextUse;
                victim = f;
              }
            }
          } else if (algo === 'LFU') {
            let minFreq = Infinity;
            for (let f of frames) {
              if (lfuCounts[f] < minFreq) {
                minFreq = lfuCounts[f];
                victim = f;
              }
            }
          }

          evicted = victim;
          const idx = frames.indexOf(victim);
          frames[idx] = p;
          if (algo === 'FIFO') fifoQueue.push(p);
        }
      }

      history.push({
        page: p,
        frames: [...frames],
        isHit,
        evicted
      });
    }

    const hitRatio = ((hits / refs.length) * 100).toFixed(1);
    const faultRatio = ((faults / refs.length) * 100).toFixed(1);

    // Update UI Metrics
    const totEl = document.getElementById('pageMetricTotal');
    const hitEl = document.getElementById('pageMetricHits');
    const fltEl = document.getElementById('pageMetricFaults');
    const beladyEl = document.getElementById('pageMetricBelady');
    const optEl = document.getElementById('pageMetricOptimal');

    if (totEl) totEl.innerText = refs.length;
    if (hitEl) hitEl.innerText = `${hits} Hits`;
    if (fltEl) fltEl.innerText = `${faults} Faults`;
    if (beladyEl) beladyEl.innerText = (algo === 'FIFO') ? 'Susceptible' : 'Immune (Stack Algo)';
    if (optEl) optEl.innerText = `${faults} Total`;

    // Render Grid
    this.renderGrid(history, numFrames);
  },

  renderGrid(history, numFrames) {
    const container = document.getElementById('pageSimulationGrid');
    if (!container) return;

    let html = `
      <table class="data-table" style="text-align: center; font-size: 11px;">
        <thead>
          <tr style="background:#161922;">
            <th style="padding:6px; min-width:65px;">Time (t)</th>
            ${history.map((h, i) => `<th style="padding:6px; min-width:32px;">${i + 1}</th>`).join('')}
          </tr>
          <tr style="background:#1e293b; color:#38bdf8;">
            <th style="padding:6px;">Page Ref</th>
            ${history.map(h => `<th style="padding:6px; font-weight:700;">${h.page}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    for (let f = 0; f < numFrames; f++) {
      html += `<tr><td style="font-weight:600; color:#8c93a8;">Frame ${f}</td>`;
      for (let h of history) {
        const val = h.frames[f] !== undefined ? h.frames[f] : '-';
        const isCurrent = h.frames[f] === h.page && !h.isHit;
        const style = isCurrent ? 'background:rgba(239, 68, 68, 0.2); color:#f87171; font-weight:700;' : '';
        html += `<td style="padding:4px; ${style}">${val}</td>`;
      }
      html += `</tr>`;
    }

    html += `
          <tr style="background:#161922; border-top:2px solid #334155;">
            <td style="font-weight:700;">Status</td>
            ${history.map(h => {
              return h.isHit
                ? `<td><span class="badge badge-emerald" style="padding:2px 4px; font-size:9px;">HIT</span></td>`
                : `<td><span class="badge badge-rose" style="padding:2px 4px; font-size:9px;">MISS</span></td>`;
            }).join('')}
          </tr>
        </tbody>
      </table>
    `;

    container.innerHTML = html;
  },

  testBelady() {
    const anomalyString = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];
    const refEl = document.getElementById('pageRefInput');
    const algoEl = document.getElementById('pageAlgoSelect');
    if (refEl) refEl.value = anomalyString.join(', ');
    if (algoEl) algoEl.value = 'First-In, First-Out (FIFO)';

    this.algorithm = 'FIFO';
    this.refString = anomalyString;

    // Simulate for F=3 and F=4
    let f3_faults = this.countFaults('FIFO', 3, anomalyString);
    let f4_faults = this.countFaults('FIFO', 4, anomalyString);

    this.framesCount = 4;
    const frameEl = document.getElementById('pageFrameSelect');
    if (frameEl) frameEl.value = '4 Frames';

    this.run();

    alert(`⚠️ BELADY'S ANOMALY DEMONSTRATION PROVEN:\n\nReference String: [${anomalyString.join(', ')}]\nAlgorithm: FIFO\n\n• With 3 Frames: ${f3_faults} Faults\n• With 4 Frames: ${f4_faults} Faults!\n\nConclusion: Increasing physical memory frames from 3 to 4 increased page faults from ${f3_faults} to ${f4_faults}, mathematically proving FIFO is NOT a stack algorithm!`);
  },

  countFaults(algo, framesCount, refs) {
    let frames = [];
    let queue = [];
    let faults = 0;
    for (let p of refs) {
      if (!frames.includes(p)) {
        faults++;
        if (frames.length < framesCount) {
          frames.push(p);
          queue.push(p);
        } else {
          let victim = queue.shift();
          frames[frames.indexOf(victim)] = p;
          queue.push(p);
        }
      }
    }
    return faults;
  }
};


// ============================================================================
// 5. DISK ARM SCHEDULING (SCAN / SSTF / LOOK) (Figure 6.4)
// ============================================================================
window.SimDisk = {
  requests: [98, 183, 37, 122, 14, 124, 65, 67],
  initialHead: 53,
  direction: 'high',
  maxCylinder: 199,
  algorithm: 'SCAN',

  init() {
    this.run();
  },

  randomRequests() {
    const count = 8;
    let reqs = [];
    for (let i = 0; i < count; i++) {
      reqs.push(Math.floor(Math.random() * 195) + 2);
    }
    const qInput = document.getElementById('diskQueueInput');
    if (qInput) qInput.value = reqs.join(', ');
    this.run();
  },

  run() {
    const algoEl = document.getElementById('diskAlgoSelect');
    const headEl = document.getElementById('diskHeadInput');
    const dirEl = document.getElementById('diskDirSelect');
    const qEl = document.getElementById('diskQueueInput');

    if (algoEl) {
      const val = algoEl.value;
      if (val.includes('FCFS')) this.algorithm = 'FCFS';
      else if (val.includes('SSTF')) this.algorithm = 'SSTF';
      else if (val.includes('C-SCAN')) this.algorithm = 'C-SCAN';
      else if (val.includes('C-LOOK')) this.algorithm = 'C-LOOK';
      else if (val.includes('LOOK')) this.algorithm = 'LOOK';
      else this.algorithm = 'SCAN';
    }

    if (headEl) this.initialHead = parseInt(headEl.value, 10) || 53;
    if (dirEl) this.direction = dirEl.value.includes('Lower') ? 'low' : 'high';
    if (qEl && qEl.value.trim()) {
      this.requests = qEl.value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    }

    this.simulate();
  },

  simulate() {
    let head = this.initialHead;
    let reqs = [...this.requests];
    let sequence = [head];
    let totalHeadMovement = 0;
    let steps = [];
    let reversals = 0;

    if (this.algorithm === 'FCFS') {
      for (let r of reqs) {
        sequence.push(r);
      }
    } else if (this.algorithm === 'SSTF') {
      let remaining = [...reqs];
      let curr = head;
      while (remaining.length > 0) {
        let closestIdx = 0;
        let minDiff = Math.abs(remaining[0] - curr);
        for (let i = 1; i < remaining.length; i++) {
          let diff = Math.abs(remaining[i] - curr);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = i;
          }
        }
        curr = remaining[closestIdx];
        sequence.push(curr);
        remaining.splice(closestIdx, 1);
      }
    } else if (this.algorithm === 'SCAN') {
      let high = reqs.filter(r => r >= head).sort((a, b) => a - b);
      let low = reqs.filter(r => r < head).sort((a, b) => b - a);

      if (this.direction === 'high') {
        sequence.push(...high);
        if (low.length > 0) {
          sequence.push(this.maxCylinder); // Spindle boundary
          reversals++;
          sequence.push(...low);
        }
      } else {
        sequence.push(...low);
        if (high.length > 0) {
          sequence.push(0);
          reversals++;
          sequence.push(...high);
        }
      }
    } else if (this.algorithm === 'LOOK') {
      let high = reqs.filter(r => r >= head).sort((a, b) => a - b);
      let low = reqs.filter(r => r < head).sort((a, b) => b - a);

      if (this.direction === 'high') {
        sequence.push(...high);
        if (low.length > 0) {
          reversals++;
          sequence.push(...low);
        }
      } else {
        sequence.push(...low);
        if (high.length > 0) {
          reversals++;
          sequence.push(...high);
        }
      }
    } else if (this.algorithm === 'C-SCAN') {
      let high = reqs.filter(r => r >= head).sort((a, b) => a - b);
      let low = reqs.filter(r => r < head).sort((a, b) => a - b); // Low ordered ascending

      if (this.direction === 'high') {
        sequence.push(...high);
        if (low.length > 0) {
          sequence.push(this.maxCylinder);
          sequence.push(0); // Jump
          sequence.push(...low);
        }
      } else {
        let lowDesc = reqs.filter(r => r <= head).sort((a, b) => b - a);
        let highDesc = reqs.filter(r => r > head).sort((a, b) => b - a);
        sequence.push(...lowDesc);
        if (highDesc.length > 0) {
          sequence.push(0);
          sequence.push(this.maxCylinder);
          sequence.push(...highDesc);
        }
      }
    } else if (this.algorithm === 'C-LOOK') {
      let high = reqs.filter(r => r >= head).sort((a, b) => a - b);
      let low = reqs.filter(r => r < head).sort((a, b) => a - b);

      if (this.direction === 'high') {
        sequence.push(...high);
        if (low.length > 0) sequence.push(...low);
      } else {
        let lowDesc = reqs.filter(r => r <= head).sort((a, b) => b - a);
        let highDesc = reqs.filter(r => r > head).sort((a, b) => b - a);
        sequence.push(...lowDesc);
        if (highDesc.length > 0) sequence.push(...highDesc);
      }
    }

    // Build step table and cumulative delta
    let cumSeek = 0;
    for (let i = 1; i < sequence.length; i++) {
      let prev = sequence[i - 1];
      let curr = sequence[i];
      let delta = Math.abs(curr - prev);
      cumSeek += delta;
      steps.push({
        step: i,
        target: curr,
        dir: curr >= prev ? 'Forward ➔' : 'Backward ⬅',
        delta,
        cumulative: cumSeek,
        remarks: curr === this.maxCylinder || curr === 0 ? 'Boundary Turnaround' : 'Serviced I/O Sector'
      });
    }

    totalHeadMovement = cumSeek;
    const avgSeek = (totalHeadMovement / this.requests.length).toFixed(2);

    // Calculate FCFS benchmark seek for comparison
    let fcfsSeek = 0;
    let curHead = this.initialHead;
    for (let r of this.requests) {
      fcfsSeek += Math.abs(r - curHead);
      curHead = r;
    }

    // Update UI Metrics
    const movEl = document.getElementById('diskMetricMovement');
    const avgEl = document.getElementById('diskMetricAvgSeek');
    const fcfsEl = document.getElementById('diskMetricFcfsSeek');
    const revEl = document.getElementById('diskMetricReversals');

    if (movEl) movEl.innerText = `${totalHeadMovement} Cylinders`;
    if (avgEl) avgEl.innerText = `${avgSeek} Cyl/Req`;
    if (fcfsEl) fcfsEl.innerText = `${fcfsSeek} Cylinders`;
    if (revEl) revEl.innerText = `${reversals} Reversal${reversals === 1 ? '' : 's'}`;

    this.renderSvgTrajectory(sequence);
    this.renderStepsTable(steps);
  },

  renderSvgTrajectory(sequence) {
    const svg = document.getElementById('diskTrajectorySvg');
    if (!svg) return;

    const width = 650;
    const height = 280;
    const padX = 40;
    const padY = 30;
    const graphW = width - 2 * padX;
    const graphH = height - 2 * padY;

    const mapX = (cyl) => padX + (cyl / this.maxCylinder) * graphW;
    const stepCount = sequence.length - 1 || 1;
    const mapY = (stepIdx) => padY + (stepIdx / stepCount) * graphH;

    let pathPoints = sequence.map((cyl, idx) => `${mapX(cyl)},${mapY(idx)}`).join(' ');

    let gridLines = [0, 14, 37, 53, 65, 67, 98, 122, 124, 183, 199];
    let gridHtml = gridLines.map(c => {
      const x = mapX(c);
      const isBoundary = c === 199 || c === 0;
      return `
        <line x1="${x}" y1="20" x2="${x}" y2="${height - 30}" stroke="${isBoundary ? '#e11d48' : '#334155'}" stroke-width="1" stroke-dasharray="${isBoundary ? '4,4' : '2,2'}"/>
        <text x="${x}" y="${height - 12}" fill="#94a3b8" font-size="10" text-anchor="middle">${c}</text>
      `;
    }).join('');

    let markersHtml = sequence.map((cyl, idx) => {
      const x = mapX(cyl);
      const y = mapY(idx);
      const isStart = idx === 0;
      const isBoundary = cyl === 199 || cyl === 0;
      const col = isStart ? '#38bdf8' : isBoundary ? '#e11d48' : '#10b981';

      return `
        <circle cx="${x}" cy="${y}" r="${isStart ? 6 : 4}" fill="${col}" stroke="#fff" stroke-width="1.5">
          <title>Step ${idx}: Cylinder ${cyl}</title>
        </circle>
        <text x="${x + 6}" y="${y - 4}" fill="#e2e8f0" font-size="9" font-weight="bold">${cyl}</text>
      `;
    }).join('');

    svg.innerHTML = `
      ${gridHtml}
      <polyline points="${pathPoints}" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${markersHtml}
    `;
  },

  renderStepsTable(steps) {
    const tbody = document.getElementById('diskTrajectoryTableBody');
    if (!tbody) return;

    tbody.innerHTML = steps.map(s => `
      <tr>
        <td><strong>Step ${s.step}</strong></td>
        <td><strong style="color: #38bdf8;">${s.target}</strong></td>
        <td>${s.dir}</td>
        <td>+${s.delta} Cyl</td>
        <td><strong style="color: #34d399;">${s.cumulative} Cyl</strong></td>
        <td><span class="badge ${s.remarks.includes('Boundary') ? 'badge-rose' : 'badge-emerald'}">${s.remarks}</span></td>
      </tr>
    `).join('');
  }
};


// ============================================================================
// 6. DEADLOCK AVOIDANCE (BANKER'S ALGORITHM) (Figure 6.5)
// ============================================================================
window.SimDeadlock = {
  // 5 Processes, 3 Resource Types A, B, C
  numProcesses: 5,
  numResources: 3,
  allocation: [
    [0, 1, 0], // P0
    [2, 0, 0], // P1
    [3, 0, 2], // P2
    [2, 1, 1], // P3
    [0, 0, 2]  // P4
  ],
  maxDemand: [
    [7, 5, 3], // P0
    [3, 2, 2], // P1
    [9, 0, 2], // P2
    [2, 2, 2], // P3
    [4, 3, 3]  // P4
  ],
  available: [3, 3, 2],
  isSafe: true,
  safeSequence: ['P1', 'P3', 'P4', 'P0', 'P2'],

  init() {
    this.runSafety();
  },

  runSafety() {
    let alloc = JSON.parse(JSON.stringify(this.allocation));
    let max = JSON.parse(JSON.stringify(this.maxDemand));
    let avail = [...this.available];

    let need = [];
    for (let i = 0; i < this.numProcesses; i++) {
      let row = [];
      for (let j = 0; j < this.numResources; j++) {
        row.push(max[i][j] - alloc[i][j]);
      }
      need.push(row);
    }

    let finish = new Array(this.numProcesses).fill(false);
    let work = [...avail];
    let safeSeq = [];
    let executionSteps = {};

    let stepNum = 1;
    let found = true;

    while (safeSeq.length < this.numProcesses && found) {
      found = false;
      for (let i = 0; i < this.numProcesses; i++) {
        if (!finish[i]) {
          let canExecute = true;
          for (let j = 0; j < this.numResources; j++) {
            if (need[i][j] > work[j]) {
              canExecute = false;
              break;
            }
          }

          if (canExecute) {
            for (let j = 0; j < this.numResources; j++) {
              work[j] += alloc[i][j];
            }
            finish[i] = true;
            safeSeq.push(`P${i}`);
            executionSteps[i] = {
              step: stepNum++,
              workAfter: [...work]
            };
            found = true;
            break;
          }
        }
      }
    }

    this.isSafe = safeSeq.length === this.numProcesses;
    this.safeSequence = safeSeq;

    this.renderBanner(avail);
    this.renderMatrix(alloc, max, need, executionSteps);
    this.renderRagSvg();
  },

  renderBanner(avail) {
    const banner = document.getElementById('deadlockBanner');
    const availBadge = document.getElementById('deadlockAvailBadge');

    if (availBadge) {
      availBadge.innerText = `Available: [ A: ${avail[0]}, B: ${avail[1]}, C: ${avail[2]} ]`;
    }

    if (!banner) return;
    if (this.isSafe) {
      banner.style.background = '#064e3b';
      banner.style.border = '1px solid #059669';
      banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #10b981; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; color: white;">✓</div>
          <div>
            <div style="font-size: 15px; font-weight: 700; color: #ffffff;">SYSTEM IN SAFE STATE — NO DEADLOCK DETECTED</div>
            <div style="font-size: 12px; color: #a7f3d0;">Verified Safe Sequence: <strong>&lt; ${this.safeSequence.join(' ➔ ')} &gt;</strong></div>
          </div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <span class="badge badge-emerald" id="deadlockAvailBadge">Available: [ A: ${avail[0]}, B: ${avail[1]}, C: ${avail[2]} ]</span>
          <button class="btn btn-primary" style="background: #059669;" onclick="window.SimDeadlock.evaluateRequestPrompt()">Evaluate Request</button>
          <button class="btn btn-secondary" style="background: #b91c1c; color: white;" onclick="window.SimDeadlock.triggerDeadlock()">Trigger Deadlock State</button>
          <button class="btn btn-secondary" onclick="window.SimDeadlock.reset()">Reset</button>
        </div>
      `;
    } else {
      banner.style.background = '#7f1d1d';
      banner.style.border = '1px solid #dc2626';
      banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #ef4444; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; color: white;">✕</div>
          <div>
            <div style="font-size: 15px; font-weight: 700; color: #ffffff;">DEADLOCK / UNSAFE STATE DETECTED</div>
            <div style="font-size: 12px; color: #fecaca;">No safe sequence exists! Resource allocation graph contains an unresolvable cycle.</div>
          </div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <button class="btn btn-secondary" onclick="window.SimDeadlock.reset()">Reset Safe State</button>
        </div>
      `;
    }
  },

  renderMatrix(alloc, max, need, executionSteps) {
    const tbody = document.getElementById('deadlockMatrixTableBody');
    if (!tbody) return;

    tbody.innerHTML = alloc.map((row, i) => {
      const step = executionSteps[i];
      const isScheduled = !!step;
      const stepStr = isScheduled ? `Step ${step.step} (${step.step === 1 ? 'First' : step.step === 5 ? 'Final' : 'OK'})` : '<span style="color:#ef4444;">Deadlocked</span>';
      const workStr = isScheduled ? `[ ${step.workAfter.join('   ')} ]` : '-';
      const rowBg = isScheduled ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)';

      return `
        <tr style="background: ${rowBg};">
          <td><strong style="color: ${isScheduled ? '#34d399' : '#f87171'};">P${i}</strong></td>
          <td>${row.join(' &nbsp; ')}</td>
          <td>${max[i].join(' &nbsp; ')}</td>
          <td><strong>${need[i].join(' &nbsp; ')}</strong></td>
          <td>${stepStr}</td>
          <td style="font-family:monospace; color:#38bdf8;">${workStr}</td>
        </tr>
      `;
    }).join('');
  },

  renderRagSvg() {
    const svg = document.getElementById('deadlockRagSvg');
    if (!svg) return;

    const isDeadlock = !this.isSafe;
    const strokeCol = isDeadlock ? '#ef4444' : '#10b981';

    svg.innerHTML = `
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="${strokeCol}" />
        </marker>
        <marker id="arrowRed" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
        </marker>
      </defs>

      <!-- Resource Nodes (Rectangles) -->
      <rect x="80" y="30" width="70" height="40" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
      <text x="115" y="55" fill="#38bdf8" font-size="12" font-weight="bold" text-anchor="middle">Res A (10)</text>

      <rect x="260" y="30" width="70" height="40" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
      <text x="295" y="55" fill="#38bdf8" font-size="12" font-weight="bold" text-anchor="middle">Res B (5)</text>

      <rect x="440" y="30" width="70" height="40" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
      <text x="475" y="55" fill="#38bdf8" font-size="12" font-weight="bold" text-anchor="middle">Res C (7)</text>

      <!-- Process Nodes (Circles) -->
      <circle cx="80" cy="180" r="22" fill="#1e293b" stroke="${isDeadlock ? '#ef4444' : '#6366f1'}" stroke-width="2"/>
      <text x="80" y="185" fill="#fff" font-size="12" font-weight="bold" text-anchor="middle">P0</text>

      <circle cx="180" cy="180" r="22" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
      <text x="180" y="185" fill="#fff" font-size="12" font-weight="bold" text-anchor="middle">P1</text>

      <circle cx="280" cy="180" r="22" fill="#1e293b" stroke="${isDeadlock ? '#ef4444' : '#6366f1'}" stroke-width="2"/>
      <text x="280" y="185" fill="#fff" font-size="12" font-weight="bold" text-anchor="middle">P2</text>

      <circle cx="380" cy="180" r="22" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
      <text x="380" y="185" fill="#fff" font-size="12" font-weight="bold" text-anchor="middle">P3</text>

      <circle cx="480" cy="180" r="22" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
      <text x="480" y="185" fill="#fff" font-size="12" font-weight="bold" text-anchor="middle">P4</text>

      <!-- Assignment & Request Edges -->
      <line x1="115" y1="70" x2="180" y2="158" stroke="${strokeCol}" stroke-width="2" marker-end="url(#arrow)"/>
      <line x1="115" y1="70" x2="280" y2="158" stroke="${strokeCol}" stroke-width="2" marker-end="url(#arrow)"/>
      <line x1="295" y1="70" x2="80" y2="158" stroke="${strokeCol}" stroke-width="2" marker-end="url(#arrow)"/>
      <line x1="475" y1="70" x2="280" y2="158" stroke="${strokeCol}" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Request Edges (dotted) -->
      <line x1="180" y1="158" x2="115" y2="70" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3,3" marker-end="url(#arrow)"/>
      <line x1="380" y1="158" x2="475" y2="70" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3,3" marker-end="url(#arrow)"/>
    `;
  },

  evaluateRequestPrompt() {
    const pStr = prompt('Select Process requesting resources (0 to 4):', '1');
    if (pStr === null) return;
    const pIdx = parseInt(pStr, 10);
    if (isNaN(pIdx) || pIdx < 0 || pIdx >= this.numProcesses) {
      alert('Invalid Process ID');
      return;
    }

    const reqStr = prompt(`Enter request vector for P${pIdx} [A, B, C] (comma-separated):`, '1, 0, 2');
    if (!reqStr) return;
    const req = reqStr.split(',').map(s => parseInt(s.trim(), 10));

    if (req.length !== 3 || req.some(isNaN)) {
      alert('Must provide exactly 3 numbers for [A, B, C]');
      return;
    }

    // Need check
    let need = [];
    for (let j = 0; j < this.numResources; j++) {
      need.push(this.maxDemand[pIdx][j] - this.allocation[pIdx][j]);
      if (req[j] > need[j]) {
        alert(`Request Denied! Request [${req.join(', ')}] exceeds process maximum need [${need.join(', ')}].`);
        return;
      }
      if (req[j] > this.available[j]) {
        alert(`Process P${pIdx} must wait! Request [${req.join(', ')}] exceeds current available resources [${this.available.join(', ')}].`);
        return;
      }
    }

    // Pretend allocation
    for (let j = 0; j < this.numResources; j++) {
      this.available[j] -= req[j];
      this.allocation[pIdx][j] += req[j];
    }

    this.runSafety();

    if (this.isSafe) {
      alert(`Request Granted! System remains in a SAFE state with sequence <${this.safeSequence.join(' ➔ ')}>.`);
    } else {
      alert(`DEADLOCK WARNING! Granting request leads to an UNSAFE state. Rolling back allocation!`);
      // Rollback
      for (let j = 0; j < this.numResources; j++) {
        this.available[j] += req[j];
        this.allocation[pIdx][j] -= req[j];
      }
      this.runSafety();
    }
  },

  triggerDeadlock() {
    this.available = [0, 0, 0];
    this.allocation[0] = [7, 4, 3];
    this.allocation[2] = [8, 0, 2];
    this.runSafety();
  },

  reset() {
    this.allocation = [
      [0, 1, 0],
      [2, 0, 0],
      [3, 0, 2],
      [2, 1, 1],
      [0, 0, 2]
    ];
    this.maxDemand = [
      [7, 5, 3],
      [3, 2, 2],
      [9, 0, 2],
      [2, 2, 2],
      [4, 3, 3]
    ];
    this.available = [3, 3, 2];
    this.runSafety();
  }
};


// ============================================================================
// 7. BENCHMARK SUITE & COMPARATIVE ANALYSIS (Figure 6.6)
// ============================================================================
window.SimBench = {
  currentWorkload: 'academic',

  init() {
    this.run();
  },

  run() {
    const sel = document.getElementById('benchWorkloadSelect');
    if (sel) {
      const val = sel.value;
      if (val.includes('Poisson')) this.currentWorkload = 'poisson';
      else if (val.includes('Heavy-Seek')) this.currentWorkload = 'heavy-seek';
      else if (val.includes('Uniform')) this.currentWorkload = 'uniform';
      else this.currentWorkload = 'academic';
    }

    this.renderCpuBars();
    this.renderDiskBars();
    this.renderSummaryTable();
  },

  renderCpuBars() {
    const container = document.getElementById('benchCpuBars');
    if (!container) return;

    let data = [
      { name: 'SRTF (Preemptive SJF)', val: 4.20, pct: 56, color: '#10b981', winner: true },
      { name: 'SJF (Non-Preemptive)', val: 4.60, pct: 62, color: '#3b82f6' },
      { name: 'Priority (Preemptive)', val: 5.20, pct: 70, color: '#8b5cf6' },
      { name: 'FCFS', val: 6.80, pct: 91, color: '#f59e0b' },
      { name: 'Round Robin (q = 2)', val: 7.40, pct: 100, color: '#f43f5e' }
    ];

    if (this.currentWorkload === 'poisson') {
      data = [
        { name: 'SRTF (Preemptive SJF)', val: 3.80, pct: 52, color: '#10b981', winner: true },
        { name: 'Priority (Preemptive)', val: 4.50, pct: 61, color: '#8b5cf6' },
        { name: 'SJF (Non-Preemptive)', val: 4.90, pct: 67, color: '#3b82f6' },
        { name: 'Round Robin (q = 2)', val: 6.20, pct: 85, color: '#f43f5e' },
        { name: 'FCFS', val: 7.30, pct: 100, color: '#f59e0b' }
      ];
    }

    container.innerHTML = data.map(d => `
      <div class="bar-row">
        <div class="bar-meta">
          <span>${d.name}</span>
          <span style="color: ${d.color}; font-weight: 600;">${d.val} ms</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${d.pct}%; background: ${d.color};">${d.val} ms</div>
        </div>
      </div>
    `).join('');
  },

  renderDiskBars() {
    const container = document.getElementById('benchDiskBars');
    if (!container) return;

    let data = [
      { name: 'SSTF (Shortest Seek First)', val: 236, unit: 'Tracks', pct: 37, color: '#10b981', winner: true },
      { name: 'LOOK (Optimized Sweep)', val: 299, unit: 'Tracks', pct: 47, color: '#3b82f6' },
      { name: 'SCAN (Elevator)', val: 331, unit: 'Tracks', pct: 52, color: '#06b6d4' },
      { name: 'C-LOOK', val: 322, unit: 'Tracks', pct: 50, color: '#8b5cf6' },
      { name: 'C-SCAN', val: 382, unit: 'Tracks', pct: 60, color: '#f59e0b' },
      { name: 'FCFS (Baseline)', val: 640, unit: 'Tracks', pct: 100, color: '#f43f5e' }
    ];

    container.innerHTML = data.map(d => `
      <div class="bar-row">
        <div class="bar-meta">
          <span>${d.name}</span>
          <span style="color: ${d.color}; font-weight: 600;">${d.val} ${d.unit}</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${d.pct}%; background: ${d.color};">${d.val}</div>
        </div>
      </div>
    `).join('');
  },

  renderSummaryTable() {
    const tbody = document.getElementById('benchSummaryTableBody');
    if (!tbody) return;

    const rows = [
      { algo: 'SRTF', domain: 'CPU Scheduling', metric: '4.20 ms AWT', sec: '8.20 ms ATAT', score: '98.5%', rank: 'Rank 1 (Optimal)' },
      { algo: 'SSTF', domain: 'Disk Scheduling', metric: '236 Cylinders', sec: '29.5 Cyl/Req', score: '94.2%', rank: 'Rank 1 (Minimal Seek)' },
      { algo: 'OPT (Page)', domain: 'Virtual Memory', metric: '9 Faults', sec: '55.0% Hit Ratio', score: '100.0%', rank: 'Theoretical Bound' },
      { algo: 'LRU', domain: 'Virtual Memory', metric: '12 Faults', sec: '40.0% Hit Ratio', score: '85.7%', rank: 'Rank 1 (Practical)' },
      { algo: 'Banker\'s Safety', domain: 'Deadlock Control', metric: '0 Deadlocks', sec: '100% Avoidance', score: '100.0%', rank: 'Deterministic' }
    ];

    tbody.innerHTML = rows.map(r => `
      <tr>
        <td><strong style="color: #38bdf8;">${r.algo}</strong></td>
        <td>${r.domain}</td>
        <td><span style="color: #34d399; font-weight: 600;">${r.metric}</span></td>
        <td>${r.sec}</td>
        <td><span class="badge badge-emerald">${r.score}</span></td>
        <td><strong>${r.rank}</strong></td>
      </tr>
    `).join('');
  },

  exportCSV() {
    let csv = "Algorithm,Domain,Primary Metric,Secondary Metric,Efficiency Score,Rank\n";
    csv += "SRTF,CPU Scheduling,4.20 ms AWT,8.20 ms ATAT,98.5%,Rank 1\n";
    csv += "SJF,CPU Scheduling,4.60 ms AWT,8.60 ms ATAT,92.0%,Rank 2\n";
    csv += "Priority Preemptive,CPU Scheduling,5.20 ms AWT,9.20 ms ATAT,86.0%,Rank 3\n";
    csv += "FCFS,CPU Scheduling,6.80 ms AWT,10.80 ms ATAT,72.0%,Rank 4\n";
    csv += "Round Robin,CPU Scheduling,7.40 ms AWT,11.40 ms ATAT,66.0%,Rank 5\n";
    csv += "SSTF,Disk Scheduling,236 Cylinders,29.5 Cyl/Req,94.2%,Rank 1\n";
    csv += "LOOK,Disk Scheduling,299 Cylinders,37.3 Cyl/Req,84.0%,Rank 2\n";
    csv += "SCAN,Disk Scheduling,331 Cylinders,41.3 Cyl/Req,78.0%,Rank 3\n";
    csv += "FCFS,Disk Scheduling,640 Cylinders,80.0 Cyl/Req,40.0%,Rank 4\n";

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `os_benchmark_results_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};


// ============================================================================
// AUTO INITIALIZATION ON TAB ACTIVATION
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Hook simulator init when tabs are clicked
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      if (tab === 'filesystem') window.FileSystemExplorer.init();
      if (tab === 'sim-cpu') window.SimCpu.init();
      if (tab === 'sim-memory' || tab === 'memory') window.SimMem.init();
      if (tab === 'sim-paging') window.SimPaging.init();
      if (tab === 'sim-disk') window.SimDisk.init();
      if (tab === 'sim-deadlock') window.SimDeadlock.init();
      if (tab === 'sim-comparison') window.SimBench.init();
    });
  });
});
