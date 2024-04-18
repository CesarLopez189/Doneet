const User = require('../models/Usuario');
const ReporteAlergeno = require('../models/ReporteAlergeno');
const Producto = require('../models/Producto'); // Asegúrate de importar el modelo de Producto

const estadisticasCtrl = {};

estadisticasCtrl.renderEstadisticas = async (req, res) => {
    // Obtener estadísticas de alergias de usuarios
    const alergiasEstadisticas = await User.aggregate([
        { $unwind: '$elements' },
        { $group: { _id: '$elements', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);

    // Convertir los datos de alergias al formato necesario para Chart.js
    const labelsAlergias = alergiasEstadisticas.map(a => a._id);
    const dataAlergias = alergiasEstadisticas.map(a => a.count);

    // Obtener estadísticas de productos reportados con nombre del producto
    const productosEstadisticas = await ReporteAlergeno.aggregate([
        {
            $lookup: {
                from: 'productos', // El nombre de la colección de productos
                localField: 'producto', // El campo en ReporteAlergeno que contiene el ID del producto
                foreignField: '_id', // El campo en la colección de productos que coincide con el ID
                as: 'productoInfo'
            }
        },
        { $unwind: '$productoInfo' },
        { $group: { _id: '$productoInfo.nombre', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);

    // Obtener estadísticas de alérgenos en productos reportados
    const alergenosProductos = await ReporteAlergeno.aggregate([
        { $unwind: '$alergenos' },
        { $group: { _id: '$alergenos', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);

    // Convertir los datos de productos y alergenos al formato necesario para Chart.js
    const labelsProductos = productosEstadisticas.map(p => p._id || 'No especificado');
    const dataProductos = productosEstadisticas.map(p => p.count);
    const labelsAlergenos = alergenosProductos.map(a => a._id || 'No especificado');
    const dataAlergenos = alergenosProductos.map(a => a.count);

    console.log( labelsProductos, dataProductos, labelsAlergenos, dataAlergenos)

    // Enviar los datos a la vista como JSON
    res.render('estadisticas', {
        alergiasData: JSON.stringify({ labels: labelsAlergias, data: dataAlergias }),
        productosData: JSON.stringify({ labels: labelsProductos, data: dataProductos }),
        alergenosData: JSON.stringify({ labels: labelsAlergenos, data: dataAlergenos })  // Nuevo dato agregado
    });
};

module.exports = estadisticasCtrl;
