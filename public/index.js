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
  });
});
