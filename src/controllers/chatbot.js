document.addEventListener('DOMContentLoaded', function() {
    // Selecciona el formulario y el input del mensaje
    const form = document.getElementById('message-form');
    const input = document.getElementById('message-input');
    const chatMessages = document.getElementById('chat-messages');

    form.addEventListener('submit', function(event) {
        // Previene el comportamiento por defecto del formulario
        event.preventDefault();
    
        // Obtiene el valor del input
        const message = input.value;

        // Si el mensaje no está vacío, agrega el mensaje al chat
        if (message) {
            const newMessage = document.createElement('div');
            newMessage.className = 'message user-message';
            newMessage.textContent = message;
            chatMessages.appendChild(newMessage);

            // Limpia el input
            input.value = '';
        }
    });
});
