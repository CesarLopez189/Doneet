const { Router } = require('express');
const router = Router();

const { renderIndex, renderAbout } = require('../controllers/index.controller');
const { renderEstadisticas } = require('../controllers/estadisticas.controller');
const { renderEstadisticaschatbot } = require('../controllers/chatbot');
const { reportarAlergeno } = require('../controllers/reporteAlergenoController');
const { updateUser } = require('../controllers/users.controller');

router.get('/', renderIndex);
router.get('/about', renderAbout);
router.get('/estadisticas', renderEstadisticas);
router.get('/usuarios/chatbot', renderEstadisticaschatbot);
router.post('/reportar-alergeno', reportarAlergeno);
router.post('/usuarios/update', updateUser);

module.exports = router;
