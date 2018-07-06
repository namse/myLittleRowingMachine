const ergometer = require('./ergometer');

const performanceMonitor = new ergometer.PerformanceMonitor();
// performanceMonitor.rowingGeneralStatusEvent.sub(this, (data) => {
//   if (socket) {
//     socket.emit('data', data);
//   }
// });
// RowingAdditionalStatus1Event

performanceMonitor.startScan((device) => {
  console.log('connected');
  return true;
});


const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const port = 8080;

app.use(express.static('public'))

io.on('connection', (socket) => {
  console.log('찐따 입장!!');

  socket.on('sub', (eventName) => {
    const event = performanceMonitor[eventName];
    if (!event) {
      socket.emit('log', `no event : ${eventName}`);
      return;
    }
    socket.emit('log', `sub : ${eventName}`);
    event.sub(this, (data) => {
      socket.emit(eventName, data);
    });
  });
});

http.listen(port, () => {
  console.log(`listening on *:${port}`);
});
