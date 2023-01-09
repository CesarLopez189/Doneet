const {Schema, model} = require('mongoose')

const ProductoSchema = new Schema({
    nombre: {type:String, required: true},
    marca: {type: String, required: true},
    categoria: {type: [], required: true},
    elementos: {type: [], required: true},
    imagenes: {type: [], required: false},
    descripcion: {type: String, required: false},
}, {
    timestamps: true
})

module.exports = model('Producto', ProductoSchema);