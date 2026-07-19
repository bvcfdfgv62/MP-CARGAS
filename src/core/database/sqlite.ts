import * as SQLite from 'expo-sqlite';

// Inicializa o banco
let db: SQLite.SQLiteDatabase | null = null;

export const getDb = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('mpcargas.db');
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS deliveries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nf TEXT NOT NULL,
        cliente TEXT,
        cidade TEXT,
        etiqueta_uri TEXT,
        nota_fiscal_uri TEXT,
        produto_uri TEXT,
        recebedor_nome TEXT,
        recebedor_cpf TEXT,
        recebedor_parentesco TEXT,
        status TEXT DEFAULT 'pending_sync',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  return db;
};

export const saveDeliveryLocal = async (data: any) => {
  const database = await getDb();
  const statement = await database.prepareAsync(`
    INSERT INTO deliveries 
    (nf, cliente, cidade, etiqueta_uri, nota_fiscal_uri, produto_uri, recebedor_nome, recebedor_cpf, recebedor_parentesco) 
    VALUES ($nf, $cliente, $cidade, $etiqueta, $nota, $produto, $nome, $cpf, $parentesco)
  `);
  
  try {
    const result = await statement.executeAsync({
      $nf: data.nf || '000000',
      $cliente: data.cliente || 'CLIENTE NÃO IDENTIFICADO',
      $cidade: data.cidade || 'SÃO PAULO',
      $etiqueta: data.etiqueta_uri || '',
      $nota: data.nota_fiscal_uri || '',
      $produto: data.produto_uri || '',
      $nome: data.recebedor_nome || '',
      $cpf: data.recebedor_cpf || '',
      $parentesco: data.recebedor_parentesco || ''
    });
    return result.lastInsertRowId;
  } finally {
    await statement.finalizeAsync();
  }
};

export const getPendingDeliveries = async () => {
  const database = await getDb();
  return await database.getAllAsync('SELECT * FROM deliveries WHERE status = "pending_sync"');
};
