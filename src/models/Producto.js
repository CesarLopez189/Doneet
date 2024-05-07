const {Schema, model} = require('mongoose')

const ProductoSchema = new Schema({
    nombre: {type:String, required: true},
    marca: {type: String, required: true},
    categoria: {type: [], required: true},
    elementos: {type: [], required: true},
    imagenes: {type: [], required: false},
    imagenPrincipal: {type: String, required: true},
    imagenSecundaria: {type: String, required: true},
    descripcion: {type: String, required: false},
    trazas: {type: [], required: false},
    valoraciones: [{
        usuario: Object,
        valoracion: Number
    }]
}, {
    timestamps: true
})

//Cambiominimo
module.exports = model('Producto', ProductoSchema);

