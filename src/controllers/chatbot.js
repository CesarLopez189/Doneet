document.addEventListener('DOMContentLoaded', function() {
    // Selecciona el formulario y el input del mensaje
    const form = document.getElementById('message-form');
    const input = document.getElementById('message-input');
    const chatMessages = document.getElementById('chat-messages');

    form.addEventListener('submit', function(event) {
        // Previene el comportamiento por defecto del formulario
        event.preventDefault();
    
        // Obtiene el valor del input y lo limpia
        const message = input.value.trim();

        // Valida la entrada del usuario
        if (!message) {
            // Muestra un mensaje de error si el mensaje está vacío
            const errorMessage = document.createElement('div');
            errorMessage.className = 'message error-message';
            errorMessage.textContent = 'Por favor, ingrese un mensaje válido.';
            chatMessages.appendChild(errorMessage);
            return;
        }

        // Agrega el mensaje del usuario al chat
        const newMessage = document.createElement('div');
        newMessage.className = 'message user-message';
        newMessage.textContent = message;
        chatMessages.appendChild(newMessage);

        // Limpia el input
        input.value = '';
    });
});