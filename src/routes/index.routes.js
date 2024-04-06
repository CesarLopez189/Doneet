const { Router } = require('express');
const router = Router();

const { renderIndex, renderAbout} = require('../controllers/index.controller')
const { renderEstadisticas } = require('../controllers/estadisticas.controller');

router.get('/', renderIndex);

router.get('/about', renderAbout);

router.get('/estadisticas', renderEstadisticas);

module.exports = router;