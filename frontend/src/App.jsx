import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { Activity, AlertTriangle, Cpu, HardDrive, LayoutDashboard, MemoryStick, Network, Settings, Terminal, Search, SlidersHorizontal, Maximize2, RotateCcw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell } from 'recharts';

const socket = io('http://localhost:3001');

// --- Helper Components ---
const Card = ({ title, icon: Icon, children }) => (
  <div className="card h-full flex flex-col">
    <div className="card-header">
      <div className="card-title">
        {Icon && <Icon size={16} />}
        {title}
      </div>
      <div className="flex gap-2 text-gray-500">
        <RotateCcw size={14} className="cursor-pointer hover:text-white" />
        <Maximize2 size={14} className="cursor-pointer hover:text-white" />
      </div>
    </div>
    <div className="flex-grow overflow-auto">
      {children}
    </div>
  </div>
);

const ProgressBar = ({ label, used, free, total, usePercent, color = 'bg-success' }) => (
  <div className="mb-4 text-xs">
    <div className="flex justify-between mb-1">
      <span>{label}</span>
      <div className="flex gap-3">
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-pink-500"></div> Used</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-success"></div> Free</span>
      </div>
    </div>
    <div className="w-full bg-gray-800 rounded-full h-2.5 mb-1">
      <div className={`${color} h-2.5 rounded-full`} style={{ width: `${usePercent}%` }}></div>
    </div>
    <div className="text-gray-400">
      Free: {free} out of {total}
    </div>
  </div>
);

const Gauge = ({ value, label, color = '#003366', indicatorColor = '#00aaff' }) => {
  const rotation = (value / 100) * 180;
  return (
    <div className="relative flex flex-col items-center justify-center py-4">
      <div className="w-40 h-20 overflow-hidden relative">
        <div className="w-40 h-40 rounded-full border-[15px] border-gray-800 absolute top-0 left-0"></div>
        <div 
          className="w-40 h-40 rounded-full border-[15px] border-blue-900 absolute top-0 left-0 transition-transform duration-500 origin-center"
          style={{ clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)', transform: `rotate(${rotation}deg)` }}
        ></div>
        <div className="absolute bottom-0 left-0 w-full text-center text-xl font-bold">{value.toFixed(1)}%</div>
      </div>
      <div className="text-sm mt-2 text-gray-400">{label}</div>
    </div>
  );
}

// --- Main App ---
function App() {
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    socket.on('metrics', (data) => {
      setMetrics(data);
      setHistory(prev => {
        const newHistory = [...prev, { time: new Date(data.timestamp).toLocaleTimeString(), system: data.cpu.system, user: data.cpu.user, networkUp: data.network.stats[0]?.tx_sec || 0, networkDown: data.network.stats[0]?.rx_sec || 0 }];
        if (newHistory.length > 30) newHistory.shift(); // Keep last 30 data points
        return newHistory;
      });
    });

    return () => socket.off('metrics');
  }, []);

  if (!metrics) {
    return <div className="flex h-screen items-center justify-center text-primary">Loading System Data...</div>;
  }

  return (
    <div className="flex h-screen bg-background text-text overflow-hidden">
      {/* Top Navigation area */}
      <div className="absolute top-0 w-full h-16 border-b border-gray-800 flex items-center px-6 justify-between bg-background z-10">
        <div className="flex items-center gap-2">
           <h1 className="text-xl font-bold tracking-wider">Monitor Board</h1>
           <span className="text-xs text-gray-400 ml-2 italic">System Resource Usage Monitoring</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2 text-gray-500" size={16} />
            <input type="text" placeholder="Start typing to filter" className="bg-card border border-gray-800 rounded px-8 py-1.5 text-sm focus:outline-none focus:border-gray-600 w-64" />
          </div>
          <SlidersHorizontal className="text-gray-400 cursor-pointer hover:text-white" size={18} />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 overflow-auto mt-16 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          
          {/* CPU Usage */}
          <div className="col-span-1 xl:col-span-1">
            <Card title="CPU Usage" icon={AlertTriangle}>
               <Gauge value={metrics.cpu.usage} label="Show Less" />
               <div className="text-xs border-b border-gray-800 pb-2 mb-2">
                 <div className="flex justify-between"><span>User</span><span>{metrics.cpu.user.toFixed(1)}%</span></div>
                 <div className="flex justify-between"><span>System</span><span>{metrics.cpu.system.toFixed(1)}%</span></div>
                 <div className="flex justify-between"><span>Idle</span><span>{metrics.cpu.idle.toFixed(1)}%</span></div>
               </div>
               <div className="space-y-3 mt-4">
                 {metrics.cpu.coreLoad && metrics.cpu.coreLoad.slice(0, 4).map((core, i) => (
                   <div key={i} className="text-xs">
                     <div className="mb-1">Core #{i + 1}</div>
                     <div className="w-full bg-gray-800 h-2 flex rounded overflow-hidden">
                        <div className="bg-success h-full" style={{width: `${core.idle}%`}}></div>
                        <div className="bg-secondary h-full" style={{width: `${core.user}%`}}></div>
                        <div className="bg-primary h-full" style={{width: `${core.system}%`}}></div>
                     </div>
                     <div className="flex gap-2 mt-1 text-[10px] text-gray-500">
                        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-success"></div>Idle</span>
                        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>User</span>
                        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-primary"></div>System</span>
                     </div>
                   </div>
                 ))}
               </div>
            </Card>
          </div>

          {/* CPU History */}
          <div className="col-span-1 md:col-span-2">
            <Card title="CPU History" icon={Cpu}>
              <div className="text-xs text-gray-400 mb-2">CPU Usage over past 3 minutes</div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <XAxis dataKey="time" hide />
                    <YAxis stroke="#444" fontSize={10} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#16181d', border: '1px solid #333' }} />
                    <Line type="monotone" dataKey="system" stroke="#00e5ff" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="user" stroke="#a020f0" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-2 text-xs">
                 <span className="flex items-center gap-1"><div className="w-3 h-0.5 bg-primary"></div> System</span>
                 <span className="flex items-center gap-1"><div className="w-3 h-0.5 bg-secondary"></div> User</span>
              </div>
            </Card>
          </div>

          {/* Disk Space */}
          <div className="col-span-1 xl:col-span-1">
             <Card title="Disk Space" icon={HardDrive}>
               {metrics.disk.slice(0, 2).map((d, i) => (
                 <div key={i} className="mb-6">
                   <ProgressBar 
                      label={d.mount} 
                      used={d.used} 
                      free={`${(d.size - d.used) / (1024*1024*1024)} GB`}
                      total={`${d.size / (1024*1024*1024)} GB`}
                      usePercent={d.usePercent} 
                      color="bg-success"
                   />
                   <div className="text-xs text-gray-400 mt-1">
                      Mount Point: {d.mount}<br/>
                      File System: {d.type}
                   </div>
                 </div>
               ))}
             </Card>
          </div>
          
          {/* Bottom Row */}
          
          {/* Disk IO */}
          <div className="col-span-1">
            <Card title="Disk IO" icon={Activity}>
               {/* Simulating drives based on the single metric */}
               <div className="text-xs space-y-4">
                 <div className="border-b border-gray-800 pb-2">
                   <div className="font-semibold mb-1">sda</div>
                   <div className="text-gray-400">Read: {(metrics.diskIO.rIO_sec || 0).toFixed(2)} MB/s <span className="text-success">↑</span></div>
                   <div className="text-gray-400">Write: {(metrics.diskIO.wIO_sec || 0).toFixed(2)} KB/s <span className="text-success">↑</span></div>
                 </div>
                 <div className="border-b border-gray-800 pb-2">
                   <div className="font-semibold mb-1">sda1</div>
                   <div className="text-gray-400">Read: Idle</div>
                   <div className="text-gray-400">Write: Idle</div>
                 </div>
               </div>
            </Card>
          </div>

          {/* Network Interfaces */}
          <div className="col-span-1">
            <Card title="Network Interfaces" icon={Network}>
              <div className="text-xs space-y-4">
                {metrics.network.interfaces.slice(0, 3).map((ni, i) => (
                   <div key={i} className="border-b border-gray-800 pb-2">
                     <div className="flex justify-between font-semibold mb-1">
                        {ni.iface}
                        <span className={ni.operstate === 'up' ? 'text-success' : 'text-danger'}>
                           {ni.operstate === 'up' ? 'Up' : 'Down'}
                        </span>
                     </div>
                     <div className="text-center text-gray-300">
                        ↑ {Math.random().toFixed(2)} KB | ↓ {Math.random().toFixed(2)} KB
                     </div>
                     <div className="text-center text-gray-500 mt-1">
                        Total Up 0 Bytes | Down 0 Bytes
                     </div>
                   </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Network Activity */}
          <div className="col-span-1 md:col-span-2">
            <Card title="Network Activity" icon={Activity}>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <XAxis dataKey="time" hide />
                    <YAxis stroke="#444" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#16181d', border: '1px solid #333' }} />
                    <Area type="monotone" dataKey="networkUp" stackId="1" stroke="#ffc107" fill="#ffc107" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="networkDown" stackId="1" stroke="#00e5ff" fill="#00e5ff" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-2 text-xs">
                 <span className="flex items-center gap-1"><div className="w-3 h-0.5 bg-warning"></div> Upload</span>
                 <span className="flex items-center gap-1"><div className="w-3 h-0.5 bg-primary"></div> Download</span>
              </div>
            </Card>
          </div>

          {/* Memory Usage */}
          <div className="col-span-1">
            <Card title="Memory Usage" icon={MemoryStick}>
              <Gauge value={metrics.memory.usagePercent} label="Expand Details" color="#1a4d2e" indicatorColor="#00ff41" />
            </Card>
          </div>
          
          {/* System Load */}
          <div className="col-span-1">
             <Card title="System Load" icon={Server}>
                <div className="text-xs text-gray-400 mb-2">Load Averages over 4 Cores</div>
                <div className="h-32 w-full mt-4 flex items-end justify-around border-l border-b border-gray-700 pb-1 pl-1">
                   {[1, 5, 15].map((time, i) => (
                      <div key={i} className="w-12 bg-primary flex items-end justify-center text-black font-bold text-xs" style={{height: `${Math.min(100, (metrics.load.avgLoad || 0.5) * 20)}%`}}>
                         {metrics.load.avgLoad?.toFixed(2) || '2.0'}
                      </div>
                   ))}
                </div>
                <div className="flex justify-around text-xs text-gray-500 mt-1">
                   <span>1m</span><span>5m</span><span>15m</span>
                </div>
             </Card>
          </div>

          {/* System Alerts */}
          <div className="col-span-1 md:col-span-2">
            <Card title="System Alerts" icon={AlertTriangle}>
               <div className="space-y-3 mt-2">
                 <div className="flex justify-between items-center text-sm">
                   <span>CPU_IOWAIT - 50.7%</span>
                   <span className="border border-danger text-danger px-2 py-0.5 text-xs rounded">CRITICAL</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span>MEMORY - 69.2%</span>
                   <span className="border border-warning text-warning px-2 py-0.5 text-xs rounded">WARNING</span>
                 </div>
               </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;

// Mock server icon component
const Server = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
    <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
    <line x1="6" y1="6" x2="6.01" y2="6"></line>
    <line x1="6" y1="18" x2="6.01" y2="18"></line>
  </svg>
)
