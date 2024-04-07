const mongoose = require('mongoose');
const { Schema } = mongoose;

const reporteAlergenoSchema = new Schema({
    alergenos: [String],
    descripcion: String,
    usuario: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Usuario',
        required: true
    },
    producto: {
        type: Schema.Types.ObjectId,
        ref: 'Producto',
        required: true // Opcional, dependiendo de si cada reporte debe estar vinculado a un producto
      }
}, {
    timestamps: true
});

module.exports = mongoose.model('ReporteAlergeno', reporteAlergenoSchema);
