document.addEventListener('DOMContentLoaded', function() {
    const boardLinks = document.querySelectorAll('.board-link');
    boardLinks.forEach(function(boardLink) {
      boardLink.addEventListener('click', function(event) {
        event.preventDefault();
        const boardId = boardLink.getAttribute('data-board-id');
        window.location.href = `/boards/${boardId}`;
      });
    });

    boardLinks.forEach(boardLink => {
      const boardId = boardLink.getAttribute('data-board-id');
      const drawings = boardData[boardId];


    const thumbnailWidth = 274;
    const thumbnailHeight = 150;
    const canvasWidth = document.documentElement.clientWidth;
    const canvasHeight = document.documentElement.clientHeight;
      if (drawings) {
        const canvasElement = boardLink.querySelector(`.board-canvas[data-board-id="${boardId}"]`);
        const canvas = new fabric.Canvas(canvasElement);
        drawings.forEach(drawing => {
          const scaleX = thumbnailWidth / canvasWidth; 
          const scaleY = thumbnailHeight / canvasHeight;
          let obj = drawOnCanvas(drawing, scaleX,scaleY );
          obj.set({
            selectable: false,
            evented: false, 
          });
          canvas.add(obj);
        });
        canvasElement.addEventListener('mouseover', () => {
          canvasElement.style.cursor = 'pointer';
        });
      
        canvasElement.addEventListener('mouseout', () => {
          canvasElement.style.cursor = 'default';
        });
      }
    });
});

function drawOnCanvas(data, scaleX, scaleY) {
  scaleX = scaleX || 1;
  scaleY = scaleY || 1;
  let obj;
  switch (data.type) {
    case 'line':
      obj = new fabric.Line([data.prevX * scaleX, data.prevY * scaleY, data.x * scaleX, data.y * scaleY], {
        stroke: data.color,
        strokeWidth: data.lineWidth * scaleX, // Учитывайте масштаб для толщины линии
        draggable: false,
      });
      break;
    case 'circle':
      const radius = Math.abs(data.y - data.prevY) / 2 * scaleY;
      obj = new fabric.Circle({
        left: (data.prevX + data.x) / 2 * scaleX,
        top: (data.prevY + data.y) / 2 * scaleY,
        radius: radius,
        stroke: data.color,
        fill: 'transparent',
        strokeWidth: data.lineWidth * scaleX,
        draggable: false,
      });
      break;
    case 'rectangle':
      obj = new fabric.Rect({
        left: data.prevX * scaleX,
        top: data.prevY * scaleY,
        width: (data.x - data.prevX) * scaleX,
        height: (data.y - data.prevY) * scaleY,
        fill: 'transparent',
        stroke: data.color,
        strokeWidth: data.lineWidth * scaleX, 
        draggable: false,
      });
      break;
    case 'triangle':
      obj = new fabric.Triangle({
        left: data.prevX * scaleX,
        top: data.prevY * scaleY,
        width: (data.x - data.prevX) * scaleX,
        height: (data.y - data.prevY) * scaleY,
        fill: 'transparent',
        stroke: data.color,
        strokeWidth: data.lineWidth * scaleX, 
        draggable: false,
      });
      break;
    case 'text':
      obj = new fabric.Text(data.text, {
        left: (data.prevX + data.x) / 2 * scaleX,
        top: (data.prevY + data.y) / 2 * scaleY,
        fill: data.color,  
        fontSize: Math.abs(data.y - data.prevY) * scaleY, 
        originX: 'center',
        originY: 'center',
        draggable: false,
      });
      break;
  }
  obj.id = data.id;
  return obj;
}

export {drawOnCanvas};