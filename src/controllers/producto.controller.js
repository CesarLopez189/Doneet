const productoCtrl = {};

const Producto = require('../models/Producto');
const User = require('../models/Usuario');

productoCtrl.renderProductoForm = (req, res) => {
    res.render('productos/new-producto');
};

productoCtrl.createNewProducto = async (req, res) => {
    const {nombre, marca, categoria, elementos, imagenes, imagenPrincipal, imagenSecundaria, descripcion, trazas} = req.body;
    const newProducto = new Producto({nombre, marca, categoria, elementos, imagenes, imagenPrincipal, descripcion, trazas});
    const filearray=req.files;
    const arrayFN=[];
    filearray.forEach(elem=>arrayFN.push(`/images/${elem.filename}`));
    newProducto.imagenPrincipal = arrayFN[0];
    newProducto.imagenSecundaria = arrayFN[1];
    newProducto.imagenes = arrayFN;
    await newProducto.save();
    req.flash('success_msg', 'Producto Agregado Correctamente');
    res.redirect('/productos');
};

productoCtrl.renderProductos = async (req, res) => {
    const productos = await Producto.find().lean(); 
    res.render('productos/all-productos', { productos });
};

productoCtrl.renderProdCategory = async (req, res) => {
    await Producto.find({ categoria: { $all: [req.params.id]} }).lean()
        .then(productos => res.render('productos/all-productos', { productos }))
        .catch(e => console.log("Ha ocurrido un error: ", e));
};

productoCtrl.renderSearchProducto = async (req, res) => {
    const busqueda=req.body.item
    const array = busqueda.split(" ")
    const regex = new RegExp(array.join('|'))
    console.log("regex",regex)
    await Producto.find({ nombre: { '$regex':regex, $options: 'i' } }).lean()
        .then(searchproducto => res.render('productos/search-produco', { searchproducto }))
        //.then(searchproducto => console.log("No hay producto:"+req.body.item))
        .catch(e => console.log("Ha ocurrido un error: ", e));
};

productoCtrl.renderProducto = async (req, res) => {    
    const producto = await Producto.findById(req.params.id).lean();
    const user = await User.findOne(User.email);
    //console.log(User);
    //console.log(req.params);
    const productoSus = await Producto.find(
        {
          //'$match': {// 'categoria': "picoso", // 'elementos': {'$nin': "cacahuate"}
           // 'categoria': {'$in': ["picoso", "chocolate"]},// 'elementos': {'$nin': ["cacahuate"]}
            'categoria': {'$in': producto.categoria},    
            'elementos': {'$nin': user.elements.concat(producto.elementos).concat(producto.trazas)}
            //'elementos': {'$nin': producto.elementos}//'elementos': {'$nin': user.elements} 
        }
    ).lean();
    //console.log(producto)
    const prodNoConsumible = await Producto.find({
        'elementos': {'$in': producto.elementos.concat(producto.trazas).filter(value => user.elements.includes(value))}
    }
    ).lean();

    res.render('productos/ver-producto', { producto, productoSus, prodNoConsumible});
};

productoCtrl.renderEditForm = async (req, res) => {
    const producto = await Producto.findById(req.params.id).lean();
    res.render('productos/edit-producto', { producto });
};

productoCtrl.updateProducto = async (req, res) => {
    const { nombre, marca, categoria, elementos, imagenes} = req.body;
    await Producto.findByIdAndUpdate(req.params.id, {nombre, marca, categoria, elementos, imagenes});
    req.flash('success_msg', 'Producto Actualizado Correctamente')
    res.redirect('/productos');
};

productoCtrl.deleteProducto = async (req, res) => {
    await Producto.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Producto Eliminado Correctamente')
    res.redirect('/productos');
};

module.exports = productoCtrl;