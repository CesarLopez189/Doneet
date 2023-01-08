const {Schema, model} = require('mongoose')

const ProductoSchema = new Schema({
    nombre: {type:String, required: true},
    marca: {type: String, required: true},
    categoria: {type: [], required: true},
    elementos: {type: [], required: true},
    imagenes: {type: [], required: false}
}, {
    timestamps: true
})

ProductoSchema.methods.setImgUrl = function setImgUrl (filename) {
    this.imagenes = `http://localhost:4000/public/images/${filename}`
}

module.exports = model('Producto', ProductoSchema);