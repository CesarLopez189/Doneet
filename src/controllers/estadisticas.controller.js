const User = require('../models/Usuario');

const estadisticasCtrl = {};

estadisticasCtrl.renderEstadisticas = async (req, res) => {
    const alergiasEstadisticas = await User.aggregate([
        { $unwind: '$elements' },
        { $group: { _id: '$elements', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);

    // Convertir los datos al formato necesario para Chart.js
    const labels = alergiasEstadisticas.map(a => a._id);
    const data = alergiasEstadisticas.map(a => a.count);

    // Enviar los datos a la vista como JSON
    res.render('estadisticas', {
        alergiasData: JSON.stringify({ labels, data })
    });
};


module.exports = estadisticasCtrl;
