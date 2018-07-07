const socket = io('http://192.168.0.7:8080');

const dataDom = document.getElementById('data');

socket.on('data', (data) => {
  dataDom.innerHTML = JSON.stringify(data);
});

socket.on('log', (data) => {
  console.log(data);
});

const events = [
  'rowingGeneralStatusEvent',
  'rowingAdditionalStatus1Event',
  'rowingAdditionalStatus2Event',
];

events.forEach(event => {
  socket.emit('sub', event);
  socket.on(event, (data) => {
    console.log(event, data);
    const {
      elapsedTime,
      distance,
      strokeRate,
      currentPace,
    } = data;

    if (elapsedTime) {
      const minute = Math.floor((elapsedTime / 1000) / 60);
      const second = Math.floor((elapsedTime / 1000) % 60);
      document.getElementById('elapsed-time-value').innerHTML = `${minute === 0 ? '' : minute}:${second.toString().padStart(2, '0')}`;
    }

    if (distance) {
      document.getElementById('distance-value').innerHTML = `${Math.floor(distance)}`;
    }

    if (strokeRate) {
      document.getElementById('stroke-rate-value').innerHTML = `${strokeRate}`;
    }

    if (currentPace) {
      const minute = Math.floor((currentPace / 1000) / 60);
      const second = Math.floor((currentPace / 1000) % 60);
      document.getElementById('current-pace-value').innerHTML = `${minute === 0 ? '' : minute}:${second.toString().padStart(2, '0')}`;
    }
  });
});
