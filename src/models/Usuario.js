const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');

const UsuarioSchema = new Schema({
    name: { type: String, required: true},
    last_names: {type: String, required: true},
    age: {type: String, required: true},
    elements: {type: [], required: true},
    email: { type: String, required: true, unique: true},
    password: {type: String, required: true}
}, {
    timestamps: true
});

UsuarioSchema.methods.encryptPassword = async password => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

UsuarioSchema.methods.matchPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = model('Usuario', UsuarioSchema);