const productoCtrl = {};

const Producto = require('../models/Producto');
const User = require('../models/Usuario');
const ReporteAlergeno = require('../models/ReporteAlergeno');

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
    try {
        bandera = false;
        const productos = await Producto.find().lean();
        const isAdmin = req.user && req.user.admin;

        var chocolates = productos.filter(producto => producto.categoria.includes("chocolate"));
        var paletas = productos.filter(producto => producto.categoria.includes("paleta"));
        var gomitas = productos.filter(producto => producto.categoria.includes("gomita"));
        var caramelos_suaves = productos.filter(producto => producto.categoria.includes("caramelo_suave"));
        var bombones = productos.filter(producto => producto.categoria.includes("bombon"));
        var tipicos = productos.filter(producto => producto.categoria.includes("tipico"));
        var biscochos = productos.filter(producto => producto.categoria.includes("biscocho"));
        var chicles = productos.filter(producto => producto.categoria.includes("chicle"));
        var polvorosos = productos.filter(producto => producto.categoria.includes("polvoroso"));
        var picosos = productos.filter(producto => producto.categoria.includes("picoso"));


        res.render('productos/all-productos', { productos, isAdmin, chocolates, paletas, gomitas, caramelos_suaves, bombones, tipicos, biscochos, chicles, polvorosos, picosos, bandera });
      } catch (error) {
        console.error(error);   
      }
};

productoCtrl.renderProdCategory = async (req, res) => {
    var bandera = true;
    await Producto.find({ categoria: { $all: [req.params.id]} }).lean()
        .then(productos => res.render('productos/all-productos', { productos, bandera }))
        .catch(e => console.log("Ha ocurrido un error: ", e));
};

productoCtrl.renderSearchProducto = async (req, res) => {
    const isAdmin = req.user && req.user.admin;
    const busqueda = req.body.item;
    const array = busqueda.split(" ");
    const regex = new RegExp(array.join('|'));

    try {
        const searchproductoArray = await Producto.find({ nombre: { '$regex': regex, $options: 'i' } }).lean();

        // Tomar el primer elemento del arreglo (si existe)
        const producto = searchproductoArray.length > 0 ? searchproductoArray[0] : null;

        
        res.render('productos/ver-producto', { producto, isAdmin });
      
    } catch (e) {
        console.log("Ha ocurrido un error: ", e);
        res.render('productos/search-producto', { searchproducto: null, isAdmin });
    }
};


productoCtrl.renderProducto = async (req, res) => {    
    try {
        const producto = await Producto.findById(req.params.id).lean();
        console.log("ESTO ES PRODUCTO",producto);
        const isAdmin = req.user && req.user.admin; // Verifica si el usuario es un administrador
        let esCompatibleConUsuario = false;
        const productoSus = []; // Inicializa la lista de productos sugeridos
        let mostrarFeedback = req.body.feedback === "true";


        // Ver reportes de alergenos y buscar los nombres de usuarios
        const reportes = await ReporteAlergeno.find({ producto: req.params.id }).lean();

        // Obtener nombres de los usuarios de los reportes
        for (let reporte of reportes) {
            const usuarioReporte = await User.findById(reporte.usuario).lean();
            reporte.usuarioNombre = usuarioReporte ? usuarioReporte.name : 'Anónimo';

            if (reporte.createdAt) {
                const fecha = new Date(reporte.createdAt);
                reporte.fechaFormateada = `${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
            }
        }
        producto.reportes = reportes;

        let usuario;
        if (req.user) {
            usuario = await User.findById(req.user._id).lean();
            // Verifica si el producto no contiene elementos a los que el usuario es sensible
            esCompatibleConUsuario = !usuario.elements.some(element => producto.elementos.includes(element));
        }


        // Solo busca productos sugeridos si el producto no es compatible con el usuario
        if (!esCompatibleConUsuario) {
            // copia elemento al que es alergico el usuario
            let elementos = usuario.elements;
            console.log("ELEMENTOS", elementos);
            
            const p = await Producto.find({
                categoria: { $in: producto.categoria },
                elementos: { $nin: elementos }
            }).lean();

            for (let i = 0; i < p.length; i++) {
                productoSus.push(p[i]);
            }
        }
        
        console.log("ESTO ES PRODUCTOSUS",productoSus);
        res.render('productos/ver-producto', { producto, productoSus, isAdmin, esCompatibleConUsuario, mostrarFeedback });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ocurrió un error al procesar la solicitud');
    }
};

productoCtrl.renderProductoPost = async (req, res) => {
    try {
        const productoId = req.params.id; // Obtén el ID del producto de la URL
        const producto = await Producto.findById(productoId).lean();
        const isAdmin = req.user && req.user.admin;
        let esCompatibleConUsuario = false;
        const productoSus = [];
        let mostrarFeedback = req.body.feedback === "true"; // Captura el valor de 'feedback' desde el cuerpo de la solicitud POST


        // Aquí va tu lógica para determinar si es compatible con el usuario, etc.

        // Renderiza la página con la información adecuada
        res.render('productos/ver-producto', {
            producto,
            productoSus,
            isAdmin,
            esCompatibleConUsuario,
            mostrarFeedback
        });
    } catch (error) {
        console.error("Error al cargar el producto:", error);
        res.status(500).send('Error al procesar la solicitud');
    }
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