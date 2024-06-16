const productoCtrl = {};

const Producto = require('../models/Producto');
const User = require('../models/Usuario');
const ReporteAlergeno = require('../models/ReporteAlergeno');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const apikeys = require('../config/smart-altar-420303-ce847d43b1d4.json');

async function authorize() {
    const jwtClient = new google.auth.JWT(
        apikeys.client_email,
        null,
        apikeys.private_key,
        ['https://www.googleapis.com/auth/drive']
    );
    await jwtClient.authorize();
    return jwtClient;
}

async function uploadFile(auth, buffer, fileName, mimeType) {
    const drive = google.drive({ version: 'v3', auth });
    const fileMetadata = {
        name: fileName,
        parents: ["1GPwccwLy0tGfBGkXH4O5cjgWM2gMuuhV"]
    };
    const media = {
        mimeType: mimeType,
        body: bufferStream(buffer),
    };

    return new Promise((resolve, reject) => {
        drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id'
        }, async (err, file) => {
            if (err) {
                reject(err);
            } else {
                const fileId = file.data.id;
                // Hacer el archivo público
                await drive.permissions.create({
                    fileId: fileId,
                    requestBody: {
                        role: 'reader',
                        type: 'anyone',
                    },
                });
                const webViewLink = `https://donnet-cesar.vercel.app/proxy-image?id=${fileId}`;
                resolve(webViewLink);
            }
        });
    });
}

function bufferStream(buffer) {
    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(Buffer.from(buffer));
    return bufferStream;
}


productoCtrl.renderProductoForm = (req, res) => {
    res.render('productos/new-producto');
};

productoCtrl.createNewProducto = async (req, res) => {
    const { nombre, marca, categoria, elementos, descripcion, trazas } = req.body;
    const newProducto = new Producto({
        nombre,
        marca,
        categoria,
        elementos,
        descripcion,
        trazas,
        imagenPrincipal: null, // Inicializa como null o una URL temporal
        imagenSecundaria: null
    });
    const filearray = req.files;
    const arrayFN = [];
    const auth = await authorize();

    console.log("esto es req.files en new-producto", req.files);

    if (filearray.length > 0) {
        // Asume que el primer archivo es la imagen principal y el segundo la secundaria, si existen
        newProducto.imagenPrincipal = await uploadFile(auth, filearray[0].buffer, filearray[0].originalname, filearray[0].mimetype);
        
        if (filearray.length > 1) {
            newProducto.imagenSecundaria = await uploadFile(auth, filearray[1].buffer, filearray[1].originalname, filearray[1].mimetype);
        }

        // Subir cualquier otra imagen y guardar los enlaces
        for (const file of filearray) {
            const fileLink = await uploadFile(auth, file.buffer, file.originalname, file.mimetype);
            arrayFN.push(fileLink);
        }
    }

    newProducto.imagenes = arrayFN; // Asigna las imágenes adicionales si las hay
    try {
        await newProducto.save();
        req.flash('success_msg', 'Producto Agregado Correctamente');
        res.redirect('/productos');
    } catch (error) {
        console.error('Error al guardar el producto:', error);
        res.status(500).send('Error al procesar la solicitud');
    }
};



productoCtrl.renderProductos = async (req, res) => {
    try {
        const productos = await Producto.find().lean();
        const isAdmin = req.user ? req.user.admin : false;

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

        //imprimir cuantos chocolates hay
        console.log("chocolates: ", chocolates.length);
        //imprimir chocolates
        console.log("chocolates: ", chocolates);



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
        const isAdmin = req.user && req.user.admin;
        const dulce = req.body.item;
        const dulces_encontrados = await Producto.find({ nombre: { $regex: dulce, $options: 'i' } }).lean();

        if (dulces_encontrados.length === 0) {
            req.flash('error_msg', 'No se encontraron productos con ese nombre');
            return res.redirect('/productos');
        }

        const producto = dulces_encontrados[0];
        let esCompatibleConUsuario = false;
        const productoSus = [];
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
        const isAdmin = req.user ? req.user.admin : false;
        let esCompatibleConUsuario = false;
        const productoSus = [];
        let mostrarFeedback = req.body.feedback === "true";

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
                valoracionExistente.valoracion = valoracion;
            } else {
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
        console.error(error);
        res.status(500).send('Error al procesar la solicitud');
    }
};

productoCtrl.renderProductoPost = async (req, res) => {
    try {
        const productoId = req.params.id;
        const producto = await Producto.findById(productoId).lean();
        const isAdmin = req.user && req.user.admin;
        let esCompatibleConUsuario = false;
        const productoSus = [];
        let mostrarFeedback = req.body.feedback === "true";
        let mostrarValoracion = false;

        if (req.body.valoracion) {
            const producto = await Producto.findById(productoId);
            const userId = req.user._id;
            const valoracionExistenteIndex = producto.valoraciones.findIndex(v => v.usuario.equals(userId));
        
            if (valoracionExistenteIndex !== -1) {
                producto.valoraciones[valoracionExistenteIndex].valoracion = req.body.valoracion;
            } else {
                producto.valoraciones.push({ valoracion: req.body.valoracion, usuario: userId });
            }
        
            await producto.save();
            esCompatibleConUsuario = true;
            mostrarFeedback = true;
            mostrarValoracion = true;
        }

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
    const { nombre, marca, categoria, elementos, descripcion, trazas } = req.body;
    const auth = await authorize();

    console.log("esto es req.files en edit-producto", req.files)

    let updatedProducto = {
        nombre,
        marca,
        categoria,
        elementos,
        descripcion,
        trazas,
    };

    try {
        const filearray = req.files;
        if (filearray.length > 0) {
            // Asume que el primer archivo es la imagen principal y el segundo la secundaria, si existen
            if (filearray[0]) {
                const newPrincipalLink = await uploadFile(auth, filearray[0].buffer, filearray[0].originalname, filearray[0].mimetype);
                updatedProducto.imagenPrincipal = newPrincipalLink;
            }
            if (filearray[1]) {
                const newSecundariaLink = await uploadFile(auth, filearray[1].buffer, filearray[1].originalname, filearray[1].mimetype);
                updatedProducto.imagenSecundaria = newSecundariaLink;
            }
        }

        // Actualizar el producto en la base de datos
        await Producto.findByIdAndUpdate(req.params.id, updatedProducto);

        req.flash('success_msg', 'Producto Actualizado Correctamente');
        res.redirect('/productos');
    } catch (error) {
        console.error('Error al actualizar el producto:', error);
        res.status(500).send('Error al procesar la solicitud');
    }
};


productoCtrl.deleteProducto = async (req, res) => {
    await Producto.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Producto Eliminado Correctamente');
    res.redirect('/productos');
};

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
            valoracionExistente.valoracion = valoracion;
        } else {
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
