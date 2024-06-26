const { Router } = require('express');
const router = Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const reporteAlergenoController = require('../controllers/reporteAlergenoController');
const productoCtrl = require('../controllers/producto.controller');

const storage = multer.diskStorage({
    destination: path.join(__dirname, '../public/images'),
    filename: (req, file, cb) => {
        cb(null, uuidv4() + path.extname(file.originalname));
    }
});

const { 
    renderProductoForm, 
    createNewProducto, 
    renderProductos,
    renderProductoSus,
    renderProducto,
    renderSearchProducto, 
    renderEditForm, 
    updateProducto, 
    deleteProducto, 
    renderProdCategory
} = require('../controllers/producto.controller');

// New producto
router.get('/producto/add', renderProductoForm);

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb("Error: Archivo debe ser una imagen válida");
    }
}).array("image", 2); // Ajusta el número '2' según el número máximo de imágenes que permitirás cargar.

router.post('/producto/new-producto', upload, createNewProducto);

// Get All Productos
router.get('/productos', renderProductos);


router.get('/productos-category/:id', renderProdCategory);

// Get Producto
router.get('/producto/ver/:id', renderProducto);

// Search Producto
router.post('/producto/search', renderSearchProducto);
//router.get('/producto/search/:nombre', renderSearchProducto);

// Edit Productos
router.get('/producto/edit/:id', renderEditForm);

router.put('/producto/edit/:id', upload, updateProducto);

// Delete Producto
router.delete('/producto/delete/:id', deleteProducto);

// Get Producto
router.post('/reportar-alergeno', reporteAlergenoController.reportarAlergeno);

router.post('/producto/ver/:id', productoCtrl.renderProductoPost);

router.post('/producto/rate/:id', productoCtrl.renderProductoPost);




module.exports = router;
