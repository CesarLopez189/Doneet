const {Schema, model} = require('mongoose')

const ProductoSchema = new Schema({
    nombre: {type:String, required: true},
    marca: {type: String, required: true},
    categoria: {type: String, required: true},
    elementos: {type: Object, default: [], required: true},
    imagenes: {type: Object, default: [], required: true}
}, {
    timestamps: true
})

module.exports = model('Producto', ProductoSchema);