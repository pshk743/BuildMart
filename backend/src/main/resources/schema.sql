CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  NOT NULL CHECK (role IN ('CUSTOMER', 'ADMIN')),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
    id             BIGSERIAL PRIMARY KEY,
    title          VARCHAR(255)     NOT NULL,
    description    TEXT             NOT NULL,
    price          NUMERIC(10, 2)   NOT NULL CHECK (price >= 0),
    rating         DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
    stock_quantity INTEGER          NOT NULL CHECK (stock_quantity >= 0),
    category       VARCHAR(100),
    specifications JSONB,
    created_at     TIMESTAMPTZ      NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_price  ON products (price);
CREATE INDEX IF NOT EXISTS idx_products_title  ON products (title);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products (rating);

CREATE TABLE IF NOT EXISTS product_images (
    product_id BIGINT       NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    position   INTEGER      NOT NULL,
    url        VARCHAR(1000) NOT NULL,
    PRIMARY KEY (product_id, position)
);

CREATE TABLE IF NOT EXISTS promo_codes (
    id                  BIGSERIAL PRIMARY KEY,
    code                VARCHAR(50) NOT NULL UNIQUE,
    discount_percentage INTEGER     NOT NULL CHECK (discount_percentage BETWEEN 1 AND 100),
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS carts (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    promo_code_id BIGINT REFERENCES promo_codes (id)
);

CREATE TABLE IF NOT EXISTS cart_items (
    id         BIGSERIAL PRIMARY KEY,
    cart_id    BIGINT  NOT NULL REFERENCES carts (id) ON DELETE CASCADE,
    product_id BIGINT  NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    quantity   INTEGER NOT NULL CHECK (quantity > 0),
    CONSTRAINT uq_cart_items_cart_product UNIQUE (cart_id, product_id)
);

INSERT INTO promo_codes (code, discount_percentage, is_active)
VALUES ('SAVE10', 10, TRUE)
ON CONFLICT (code) DO NOTHING;
