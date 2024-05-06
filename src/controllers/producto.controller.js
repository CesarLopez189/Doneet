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
    try {
        const isAdmin = req.user && req.user.admin; // Verifica si el usuario es un administrador
        const dulce = req.body.item; // Asume que el término de búsqueda se pasa como un parámetro de consulta
        const dulces_encontrados = await Producto.find({ nombre: { $regex: dulce, $options: 'i' } }).lean();

        if (dulces_encontrados.length === 0) {
            req.flash('error_msg', 'No se encontraron productos con ese nombre');
            return res.redirect('/productos');
        }

        // Selecciona el primer producto encontrado para simplificar
        const producto = dulces_encontrados[0];
        let esCompatibleConUsuario = false;
        const productoSus = []; // Inicializa la lista de productos sugeridos
        let mostrarFeedback = req.body.feedback === "true";

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

        let usuario;
        if (req.user) {
            usuario = await User.findById(req.user._id).lean();
            esCompatibleConUsuario = !usuario.elements.some(element => producto.elementos.includes(element));
        } else {
            esCompatibleConUsuario = true;
        }

        if (!esCompatibleConUsuario) {
            let elementos = usuario.elements;
            const productosAlternativos = await Producto.find({
                categoria: { $in: producto.categoria },
                elementos: { $nin: elementos }
            }).lean();

            productoSus.push(...productosAlternativos);
        }

        // Renderiza la misma vista de detalle de producto que se usa en renderProducto
        res.render('productos/ver-producto', {
            producto,
            productoSus,
            isAdmin,
            esCompatibleConUsuario,
            mostrarFeedback
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al procesar la solicitud');
    }
};





productoCtrl.renderProducto = async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id).lean();

        const isAdmin = req.user ? req.user.admin : false; // Verifica si el usuario es un administrador
        let esCompatibleConUsuario = false;
        const productoSus = []; // Inicializa la lista de productos sugeridos
        let mostrarFeedback = req.body.feedback === "true";






        // Ver reportes de alergenos y buscar los nombres de usuarios
        const reportes = await ReporteAlergeno.find({ producto: req.params.id }).lean();
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
            esCompatibleConUsuario = !usuario.elements.some(element => producto.elementos.includes(element));
        } else {
            esCompatibleConUsuario = true;
        }

        if (!esCompatibleConUsuario) {
            let elementos = usuario.elements;
            const productosAlternativos = await Producto.find({
                categoria: { $in: producto.categoria },
                elementos: { $nin: elementos }
            }).lean();
            productoSus.push(...productosAlternativos);
        }

        if (req.body.valoracion) {
            const valoracion = parseInt(req.body.valoracion);
            const userId = req.user._id;
            let valoracionExistente = producto.valoraciones.find(v => v.usuario.equals(userId));

            if (valoracionExistente) {
                // Actualizar la valoración existente
                valoracionExistente.valoracion = valoracion;
            } else {
                // Añadir nueva valoración
                producto.valoraciones.push({ valoracion, usuario: userId });
            }

            await producto.save();
        }

        

        res.render('productos/ver-producto', { 
            producto, 
            productoSus, 
            isAdmin, 
            esCompatibleConUsuario, 
            mostrarFeedback 
        });
    } catch (error) {
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
        let mostrarValoracion = false;

        if (req.body.valoracion) {
            const producto = await Producto.findById(productoId); // Encuentra el producto sin usar .lean() para usar métodos de Mongoose.
            const userId = req.user._id;
            const valoracionExistenteIndex = producto.valoraciones.findIndex(v => v.usuario.equals(userId));
        
            if (valoracionExistenteIndex !== -1) {
                // Actualizar la valoración existente
                producto.valoraciones[valoracionExistenteIndex].valoracion = req.body.valoracion;
            } else {
                // Añadir nueva valoración si no existe
                producto.valoraciones.push({ valoracion: req.body.valoracion, usuario: userId });
            }
        
            await producto.save(); // Guardar los cambios en el documento del producto
            esCompatibleConUsuario = true;
            mostrarFeedback = true;
            mostrarValoracion = true;
        }
         
            

        // Renderiza la página con la información adecuada
        res.render('productos/ver-producto', {
            producto,
            productoSus,
            isAdmin,
            esCompatibleConUsuario,
            mostrarFeedback,
            mostrarValoracion
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

// Función para manejar la valoración del producto
productoCtrl.rateProducto = async (req, res) => {
    const { valoracion, productoNombre } = req.body;
    try {
        const producto = await Producto.findOne({ nombre: productoNombre });
        if (!producto) {
            return res.status(404).send('Producto no encontrado');
        }

        const userId = req.user._id;
        let valoracionExistente = producto.valoraciones.find(v => v.usuario.equals(userId));


        if (valoracionExistente) {
            // Actualizar la valoración existente
            valoracionExistente.valoracion = valoracion;
        } else {
            // Añadir nueva valoración
            producto.valoraciones.push({ valoracion, usuario: userId });
        }

        await producto.save();
        res.status(200).send('Valoración actualizada correctamente');
    } catch (error) {
        console.error('Error al actualizar la valoración del producto:', error);
        res.status(500).send('Error al procesar la solicitud');
    }
};




module.exports = productoCtrl;