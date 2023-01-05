const { Router } = require('express');
const router = Router();

const { 
    renderProductoForm, 
    createNewProducto, 
    renderProductos,
    renderProducto, 
    renderEditForm, 
    updateProducto, 
    deleteProducto 
} = require('../controllers/producto.controller');

// New producto
router.get('/producto/add', renderProductoForm);

router.post('/producto/new-producto', createNewProducto);

// Get All Productos
router.get('/productos', renderProductos);

// Get Producto
router.get('/producto/ver/:id', renderProducto);

// Edit Productos
router.get('/producto/edit/:id', renderEditForm);

router.put('/producto/edit/:id', updateProducto);

// Delete Producto
router.delete('/producto/delete/:id', deleteProducto);

module.exports = router;