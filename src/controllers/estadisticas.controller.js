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

    // Obtener las valoraciones promedio de los productos
    const valoracionesProductos = await Producto.aggregate([
        {
            $unwind: '$valoraciones' // Descomponer el array de valoraciones
        },
        {
            $group: {
                _id: '$_id',
                nombre: { $first: '$nombre' },
                averageRating: { $avg: '$valoraciones.valoracion' } // Calcular la valoración promedio
            }
        },
        {
            $sort: { averageRating: -1 } // Ordenar por valoración promedio descendente
        },
        {
            $limit: 5 // Limitar a los 5 productos más valorados
        }
    ]);

    // Convertir los datos para Chart.js
    const labelsValoraciones = valoracionesProductos.map(p => p.nombre);
    const dataValoraciones = valoracionesProductos.map(p => p.averageRating.toFixed(2)); // Formatear a 2 decimales

    // Definir las alergias y sus colores
    const alergias = [
        { nombre: 'huevo', color: 'rgba(255, 99, 132, 0.2)', borde: 'rgba(255, 99, 132, 1)' },
        { nombre: 'fresa', color: 'rgba(54, 162, 235, 0.2)', borde: 'rgba(54, 162, 235, 1)' },
        { nombre: 'lacteo', color: 'rgba(255, 206, 86, 0.2)', borde: 'rgba(255, 206, 86, 1)' },
        { nombre: 'almendra', color: 'rgba(75, 192, 192, 0.2)', borde: 'rgba(75, 192, 192, 1)' },
        { nombre: 'cacahuate', color: 'rgba(153, 102, 255, 0.2)', borde: 'rgba(153, 102, 255, 1)' },
        { nombre: 'chocolate', color: 'rgba(255, 159, 64, 0.2)', borde: 'rgba(255, 159, 64, 1)' },
        { nombre: 'nuez', color: 'rgba(199, 199, 199, 0.2)', borde: 'rgba(199, 199, 199, 1)' },
        { nombre: 'gluten', color: 'rgba(83, 102, 255, 0.2)', borde: 'rgba(83, 102, 255, 1)' },
        { nombre: 'tamarindo', color: 'rgba(255, 234, 0, 0.2)', borde: 'rgba(255, 234, 0, 1)' },
        { nombre: 'soya', color: 'rgba(255, 105, 180, 0.2)', borde: 'rgba(255, 105, 180, 1)' }
    ];

    // Obtener estadísticas de rango de edad con la alergia más presentada en cada rango
    const ageRanges = [
        { min: 0, max: 10 },
        { min: 10, max: 20 },
        { min: 20, max: 30 },
        { min: 30, max: 40 },
        { min: 40, max: 50 },
        { min: 50, max: 60 },
        { min: 60, max: 70 },
        { min: 70, max: 80 },
        { min: 80, max: 90 },
        { min: 90, max: 100 }
    ];

    const edadesEstadisticas = await Promise.all(ageRanges.map(async (range) => {
        const result = await User.aggregate([
            {
                $addFields: {
                    edadNum: { $toInt: "$age" } // Convertir la edad de cadena a entero
                }
            },
            { $match: { edadNum: { $gte: range.min, $lt: range.max } } },
            { $unwind: '$elements' },
            {
                $group: {
                    _id: '$elements',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);
        return {
            range: `${range.min}-${range.max}`,
            allergies: result
        };
    }));

    // Crear las etiquetas y los datos para Chart.js
    const labelsEdades = edadesEstadisticas.map(e => e.range);
    const datasets = alergias.map((alergia, index) => {
        return {
            label: alergia.nombre,
            data: labelsEdades.map(range => {
                const rangeData = edadesEstadisticas.find(e => e.range === range);
                const allergyData = rangeData.allergies.find(a => a._id === alergia.nombre);
                return allergyData ? allergyData.count : 0;
            }),
            backgroundColor: alergia.color,
            borderColor: alergia.borde,
            borderWidth: 1
        };
    });

    // Ordenar los datasets por la suma de sus datos
    datasets.sort((a, b) => {
        const sumA = a.data.reduce((sum, value) => sum + value, 0);
        const sumB = b.data.reduce((sum, value) => sum + value, 0);
        return sumB - sumA; // Ordenar de mayor a menor
    });

    console.log('edadesEstadisticas', edadesEstadisticas); // Para depuración

    // Enviar los datos a la vista como JSON
    res.render('estadisticas', {
        alergiasData: JSON.stringify({ labels: labelsAlergias, data: dataAlergias }),
        productosData: JSON.stringify({ labels: labelsProductos, data: dataProductos }),
        alergenosData: JSON.stringify({ labels: labelsAlergenos, data: dataAlergenos }),  // Nuevo dato agregado
        valoracionesData: JSON.stringify({ labels: labelsValoraciones, data: dataValoraciones }),
        edadesData: JSON.stringify({ labels: labelsEdades, datasets: datasets }) // Nueva estadística de edades
    });
};

module.exports = estadisticasCtrl;
