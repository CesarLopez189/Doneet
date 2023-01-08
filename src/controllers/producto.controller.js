const productoCtrl = {};

const Producto = require('../models/Producto');
const Usuario = require('../models/Usuario');

productoCtrl.renderProductoForm = (req, res) => {
    res.render('productos/new-producto');
};

productoCtrl.createNewProducto = async (req, res) => {
    const {nombre, marca, categoria, elementos, imagenes} = req.body;
    const newProducto = new Producto({nombre, marca, categoria, elementos, imagenes});

    //const { filename } = req.file;
    //newProducto.setImgUrl(filename);

    await newProducto.save();
    req.flash('success_msg', 'Producto Agregado Correctamente');
    res.redirect('/productos');
};

productoCtrl.renderProductos = async (req, res) => {
    const productos = await Producto.find().lean();
    res.render('productos/all-productos', { productos });
};

productoCtrl.renderProdCategory = async (req, res) => {
    await Producto.find({ categoria: { $all: [req.body.categoria]} }).lean()
        .then(productos => res.render('productos/all-productos', { productos }))
        .catch(e => console.log("Ha ocurrido un error: ", e));
};

productoCtrl.renderSearchProducto = async (req, res) => {
    await Producto.find({ nombre: { '$regex': `^${req.body.item}$`, $options: 'i' } }).lean()
        .then(searchproducto => res.render('productos/search-produco', { searchproducto }))
        .catch(e => console.log("Ha ocurrido un error: ", e));
};

productoCtrl.renderProducto = async (req, res) => {
    console.log(req.params);
    const producto = await Producto.findById(req.params.id).lean();
    //console.log(producto);
    const productoSus = await Producto.find(
        {
          //'$match': {
           // 'categoria': "picoso", 
           // 'elementos': {'$nin': "cacahuate"}
           // 'categoria': {'$in': ["picoso", "chocolate"]}, 
           // 'elementos': {'$nin': ["cacahuate"]}
            'categoria': {'$in': producto.categoria},
           // 'elementos': {'$nin': Usuario.elementos}
            'elementos': {'$nin': producto.elementos}
         // }
        }
    ).lean();
    res.render('productos/ver-producto', { producto, productoSus });
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