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
        const productos = await Producto.find().lean();
        const isAdmin = req.user ? req.user.admin : false; // isAdmin será falso si el usuario no ha iniciado sesión

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

        res.render('productos/all-productos', {
            productos, isAdmin, chocolates, paletas, gomitas, caramelos_suaves, bombones, tipicos, biscochos, chicles, polvorosos, picosos
        });
    } catch (error) {
        console.error(error);   
        res.status(500).send('Error al procesar la solicitud');
    }
};


productoCtrl.renderProdCategory = async (req, res) => {
    var bandera = true;
    await Producto.find({ categoria: { $all: [req.params.id]} }).lean()
        .then(productos => res.render('productos/all-productos', { productos, bandera }))
        .catch(e => console.log("Ha ocurrido un error: ", e));
};

productoCtrl.renderSearchProducto = async (req, res) => {
    const isAdmin = req.user && req.user.admin; // Verifica si el usuario es un administrador
    const busqueda = req.query.item; // Asume que el término de búsqueda se pasa como un parámetro de consulta
    const regex = new RegExp(busqueda, 'i'); // Crea un regex para buscar de manera insensible a mayúsculas

    try {
        const searchproductoArray = await Producto.find({ nombre: { '$regex': regex } }).lean();
        if (searchproductoArray.length === 0) {
            // Si no se encuentra ningún producto, renderiza la vista sin producto
            return res.render('productos/search-producto', { producto: null, isAdmin });
        }

        // Tomar el primer producto encontrado
        const producto = searchproductoArray[0];

        // Ver reportes de alergenos y buscar los nombres de usuarios
        const reportes = await ReporteAlergeno.find({ producto: producto._id }).lean();
        for (let reporte of reportes) {
            const usuarioReporte = await User.findById(reporte.usuario).lean();
            reporte.usuarioNombre = usuarioReporte ? usuarioReporte.name : 'Anónimo';
            if (reporte.createdAt) {
                const fecha = new Date(reporte.createdAt);
                reporte.fechaFormateada = `${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
            }
        }
        producto.reportes = reportes;

        let esCompatibleConUsuario = false;
        const productoSus = [];
        let usuario;
        if (req.user) {
            usuario = await User.findById(req.user._id).lean();
            esCompatibleConUsuario = !usuario.elements.some(element => producto.elementos.includes(element));
        }

        // Solo busca productos sugeridos si el producto no es compatible con el usuario
        if (!esCompatibleConUsuario && usuario) {
            let elementos = usuario.elements;
            const productosSugeridos = await Producto.find({
                categoria: { $in: producto.categoria },
                elementos: { $nin: elementos }
            }).lean();

            productoSus.push(...productosSugeridos.filter(p => p._id.toString() !== producto._id.toString()));
        }

        res.render('productos/ver-producto', {
            producto,
            productoSus,
            isAdmin,
            esCompatibleConUsuario
        });

    } catch (error) {
        console.error("Error al buscar el producto:", error);
        res.status(500).send('Error al procesar la solicitud');
    }
};



productoCtrl.renderProducto = async (req, res) => {    
    try {
        const producto = await Producto.findById(req.params.id).lean();
        console.log("ESTO ES PRODUCTO",producto);
        const isAdmin = req.user ? req.user.admin : false; // Verifica si el usuario es un administrador
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
        } else {
            esCompatibleConUsuario = true;
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