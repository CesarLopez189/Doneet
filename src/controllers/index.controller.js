const indexCtrl = {};

indexCtrl.renderIndex = (req, res) => {
    res.render('index')
}

indexCtrl.renderAbout = (req, res) => {
    res.render('about')
}

indexCtrl.renderNosotros = (req, res) => {
    res.render('nosotros')
}

indexCtrl.renderEstadisticas = (req, res) => {
    res.render('about')
}

module.exports = indexCtrl;
