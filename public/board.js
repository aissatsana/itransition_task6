import { drawOnCanvas } from "./inner-page.js";
const canvas = new fabric.Canvas('canvas', { backgroundColor: 'white' });
const eraser = document.querySelector('#eraser');
const colorPicker = document.querySelector('#colorPicker');
const lineWidthPicker = document.querySelector('#lineWidthPicker');
const lineWidthLabel = document.querySelector('#lineWidthLabel');
const shapePicker = document.querySelector('#shapePicker');
const textButton = document.querySelector('#textButton');
const textInput = document.querySelector('#textInput');
const exportButton = document.querySelector('#exportButton');

let drawing = false;
let color = colorPicker.value;
let shape = shapePicker.value;
let lineWidth = parseInt(lineWidthPicker.value, 10);
let isTextMode = false;
let x1, x2, y1, y2;
let text = '';

socket.on('draw', (data) => {
  drawOnCanvas(data);
});

socket.on('joinBoard', (requestedBoardId) => {
  socket.join(requestedBoardId);
});

function initializeCanvas() {
  if (drawings.length > 0) {
    drawings.forEach((drawing) => {
      const obj = drawOnCanvas(drawing);
      canvas.add(obj);
    });
  }

  canvas.on('mouse:down', handleMouseDown);
  canvas.on('mouse:up', handleMouseUp);
  canvas.on('mouse:move', handleMouseMove);
}

function handleMouseDown(event) {
  drawing = true;
  const pointer = canvas.getPointer(event.e);
  x1 = pointer.x;
  y1 = pointer.y;
}

function handleMouseUp(event) {
  drawing = false;

  const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  if (distance < 5) {
    return; 
  }
  let id = generateUniqueId();
  socket.emit('draw', { prevX: x1, prevY: y1, x: x2, y: y2, color, lineWidth, type: shape, text, id });
}

function handleMouseMove(event) {
  if (!drawing) return;
  const pointer = canvas.getPointer(event.e);
  x2 = pointer.x;
  y2 = pointer.y;
}

eraser.addEventListener('click', () => {
  const activeObject = canvas.getActiveObject();
  if (activeObject) {
    canvas.remove(activeObject);
    socket.emit('delete', { objectId: activeObject.id });
  }
});

colorPicker.addEventListener('input', (e) => {
  color = colorPicker.value;
});

lineWidthPicker.addEventListener('input', (e) => {
  lineWidth = parseInt(e.target.value, 10);
  lineWidthLabel.textContent = lineWidth;
});

shapePicker.addEventListener('change', (e) => {
  shape = shapePicker.value;
  textButton.style.backgroundColor = 'rgb(108, 117, 125)';
});


function generateUniqueId() {
  return 'id-' + Math.random().toString(36).slice(2, 16);
}

textButton.addEventListener('click', () => {
  text = textInput.value;
  shape = 'text';
  textButton.style.backgroundColor = 'green';
});

initializeCanvas();
socket.emit('joinBoard', boardId);

exportButton.addEventListener('click', () => {
  const dataURL = canvas.toDataURL({
    format: 'jpeg',
    quality: 0.8,
  });
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = 'canvas.jpg';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

canvas.on('mouse:wheel', function(options) {
  var delta = options.e.deltaY;
  var zoom = canvas.getZoom();
  zoom *= 0.999 ** delta;

  if (zoom > 20) zoom = 20; 
  if (zoom < 0.01) zoom = 0.01;

  canvas.zoomToPoint({ x: options.e.offsetX, y: options.e.offsetY }, zoom);
});
