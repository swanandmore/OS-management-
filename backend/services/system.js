import si from 'systeminformation';

export const getSystemMetrics = async () => {
  try {
    const [cpu, cpuCurrentLoad, mem, fsSize, networkInterfaces, networkStats, blockDevices, disksIO, currentLoad] = await Promise.all([
      si.cpu(),
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.networkInterfaces(),
      si.networkStats(),
      si.blockDevices(),
      si.disksIO(),
      si.currentLoad() // For System Load widget
    ]);

    return {
      cpu: {
        manufacturer: cpu.manufacturer,
        brand: cpu.brand,
        speed: cpu.speed,
        cores: cpu.cores,
        usage: cpuCurrentLoad.currentLoad,
        coreLoad: cpuCurrentLoad.cpus.map(c => ({
          load: c.load,
          user: c.loadUser,
          system: c.loadSystem,
          idle: c.loadIdle,
          nice: c.loadNice,
          irq: c.loadIrq
        })),
        user: cpuCurrentLoad.currentLoadUser,
        system: cpuCurrentLoad.currentLoadSystem,
        idle: cpuCurrentLoad.currentLoadIdle
      },
      memory: {
        total: mem.total,
        free: mem.free,
        used: mem.active, // Active memory is more representative of "used"
        usagePercent: (mem.active / mem.total) * 100
      },
      disk: fsSize.map(fs => ({
        fs: fs.fs,
        mount: fs.mount,
        type: fs.type,
        size: fs.size,
        used: fs.used,
        usePercent: fs.use
      })),
      network: {
        interfaces: Array.isArray(networkInterfaces) ? networkInterfaces.map(ni => ({
          iface: ni.iface,
          operstate: ni.operstate,
          ip4: ni.ip4
        })) : [],
        stats: Array.isArray(networkStats) ? networkStats.map(ns => ({
          iface: ns.iface,
          rx_bytes: ns.rx_bytes,
          tx_bytes: ns.tx_bytes,
          rx_sec: ns.rx_sec,
          tx_sec: ns.tx_sec
        })) : []
      },
      diskIO: {
        rIO_sec: disksIO.rIO_sec,
        wIO_sec: disksIO.wIO_sec,
        tIO_sec: disksIO.tIO_sec
      },
      load: {
        avgLoad: currentLoad.avgLoad
      },
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error fetching system information:', error);
    throw error;
  }
};
