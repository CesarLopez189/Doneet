const { Router } = require('express');
const router = Router();

const { 
    renderProductoForm, 
    createNewProducto, 
    renderProductos, 
    renderEditForm, 
    updateProducto, 
    deleteProducto 
} = require('../controllers/producto.controller');

// New producto
router.get('/producto/add', renderProductoForm);

router.post('/producto/new-producto', createNewProducto);

// Get All Productos
router.get('/productos', renderProductos);

// Edit Productos
router.get('/producto/edit/:id', renderEditForm);

router.put('/producto/edit/:id', updateProducto);

// Delete Producto
router.delete('/producto/delete/:id', deleteProducto);

module.exports = router;