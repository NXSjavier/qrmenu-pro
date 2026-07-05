CREATE TABLE IF NOT EXISTS restaurantes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100),
    slug VARCHAR(50) UNIQUE,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    logo VARCHAR(255),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mesas (
    id SERIAL PRIMARY KEY,
    restaurante_id INT REFERENCES restaurantes(id) ON DELETE CASCADE,
    nombre_mesa VARCHAR(50),
    codigo_qr VARCHAR(20) UNIQUE,
    activa BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    restaurante_id INT REFERENCES restaurantes(id) ON DELETE CASCADE,
    nombre VARCHAR(100),
    icono VARCHAR(50) DEFAULT '🍽️',
    orden INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    restaurante_id INT REFERENCES restaurantes(id) ON DELETE CASCADE,
    categoria_id INT REFERENCES categorias(id) ON DELETE CASCADE,
    nombre VARCHAR(100),
    descripcion TEXT,
    precio NUMERIC(6,2),
    imagen TEXT,
    disponible BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    restaurante_id INT REFERENCES restaurantes(id) ON DELETE CASCADE,
    mesa_id INT REFERENCES mesas(id) ON DELETE CASCADE,
    estado VARCHAR(20) DEFAULT 'nuevo' CHECK (estado IN ('nuevo','preparando','listo','entregado')),
    total NUMERIC(8,2),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pedido_items (
    id SERIAL PRIMARY KEY,
    pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INT,
    cantidad INT,
    precio_unitario NUMERIC(6,2),
    nota VARCHAR(255)
);
