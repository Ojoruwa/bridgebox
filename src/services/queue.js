// Simple file-based queue that survives server restarts
const fs = require('fs');
const path = require('path');
const queueFile = path.join(__dirname, '../../queue.json');

function loadQueue() {
  try {
    return JSON.parse(fs.readFileSync(queueFile, 'utf8'));
  } catch { return []; }
}
function saveQueue(q) {
  fs.writeFileSync(queueFile, JSON.stringify(q, null, 2));
}

async function addJob(job) {
  const q = loadQueue();
  q.push({ id: Date.now(), ...job, status: 'pending', attempts: 0 });
  saveQueue(q);
  console.log(`[Queue] Job added: ${job.type}`);
  processQueue(); // try to process immediately
}

async function processQueue() {
  const q = loadQueue();
  for (let job of q) {
    if (job.status !== 'pending') continue;
    try {
      job.attempts++;
      console.log(`[Queue] Processing job ${job.id} attempt ${job.attempts}`);
      
      // Simulate calling external webhook/endpoint
      if (job.type === 'webhook_retry') {
        console.log(`[Queue] Would deliver webhook to ${job.url}:`, job.payload);
        job.status = 'done'; // in real life, call axios here
      }
      
    } catch (e) {
      job.status = job.attempts >= 3 ? 'failed' : 'pending';
    }
  }
  saveQueue(q);
}

module.exports = { addJob, processQueue, loadQueue };