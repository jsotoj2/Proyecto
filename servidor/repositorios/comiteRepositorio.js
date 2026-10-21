const db = require('../configuracion/conexion');

async function asignarBecaAComite(beca_id, tipo_comite, asignado_por) {
  const [comites] = await db.query('SELECT id FROM comites WHERE tipo = ?', [tipo_comite]);
  if (comites.length === 0) throw new Error('Comité no encontrado');
  const comite_id = comites[0].id;
  const [result] = await db.query(
    'INSERT INTO beca_comite (beca_id, comite_id, asignado_por) VALUES (?, ?, ?)',
    [beca_id, comite_id, asignado_por]
  );
  return result;
}

module.exports = { asignarBecaAComite };
