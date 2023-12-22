document.addEventListener('DOMContentLoaded', async () => {
    const boardId = 'default'; 
    const response = await fetch(`/api/boards/${boardId}`);
    const data = await response.json();
  
    // Отображаем рисунки на канвасе
    data.drawings.forEach((drawing) => {
      socket.emit('draw', { ...drawing, boardId });
    });
});