const ReporteAlergeno = require('../models/ReporteAlergeno');

exports.reportarAlergeno = async (req, res) => {
    try {
        const { alergenos, descripcion, productoId  } = req.body;
        let usuarioId = null;

        if (req.user) {
            usuarioId = req.user._id; // Asegúrate de que el ID del usuario sea un ObjectId válido
        }

        const nuevoReporte = new ReporteAlergeno({
            alergenos, // Asegúrate de que esto corresponda al modelo y al input del formulario
            descripcion,
            usuario: usuarioId,
            producto: productoId // Asegúrate de que esto corresponda al modelo y al input del formulario
        });
        await nuevoReporte.save();
        req.flash('success_msg', 'Reporte de alérgeno creado con éxito.');
        res.redirect('back');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error al crear el reporte de alérgeno.');
        res.redirect('back');
    }
};


