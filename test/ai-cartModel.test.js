
const { assert } = require('chai');

// Mock the database before loading cartModel.
const dbPath = require.resolve('../db');
const originalDbModule = require.cache[dbPath];

let responses = [];
let calls = [];

const mockDb = {
  query: async (sql, params) => {
    calls.push({ sql, params });

    if (responses.length === 0) {
      throw new Error('No mock database response configured');
    }

    const response = responses.shift();

    if (response instanceof Error) {
      throw response;
    }

    return response;
  }
};

require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: mockDb
};

const cartModel = require('../models/cartModel');

const cart = {
  id: 10,
  user_id: 5,
  created_at: '2026-01-01',
  updated_at: '2026-01-01'
};

const item = {
  id: 20,
  cart_id: 10,
  product_id: 7,
  quantity: 2,
  created_at: '2026-01-01',
  updated_at: '2026-01-01'
};

const dbResult = (rows) => ({ rows });

const queueResponses = (...items) => {
  responses.push(...items);
};

describe('AI-generated unit tests: cartModel', function () {
  beforeEach(function () {
    responses = [];
    calls = [];
  });

  after(function () {
    // Restore the original database module cache entry.
    delete require.cache[require.resolve('../models/cartModel')];

    if (originalDbModule) {
      require.cache[dbPath] = originalDbModule;
    } else {
      delete require.cache[dbPath];
    }
  });

  describe('getOrCreateCartByUserId', function () {
    it('returns an existing cart', async function () {
      queueResponses(dbResult([cart]));

      const result =
        await cartModel.getOrCreateCartByUserId(5);

      assert.deepEqual(result, cart);
      assert.lengthOf(calls, 1);
      assert.include(calls[0].sql, 'SELECT');
      assert.deepEqual(calls[0].params, [5]);
    });

    it('creates a cart when none exists', async function () {
      queueResponses(dbResult([]), dbResult([cart]));

      const result =
        await cartModel.getOrCreateCartByUserId(5);

      assert.deepEqual(result, cart);
      assert.lengthOf(calls, 2);
      assert.include(calls[1].sql, 'INSERT INTO carts');
      assert.deepEqual(calls[1].params, [5]);
    });

    it('propagates database errors', async function () {
      const error = new Error('Database unavailable');
      queueResponses(error);

      try {
        await cartModel.getOrCreateCartByUserId(5);
        assert.fail('Expected a database error');
      } catch (actualError) {
        assert.strictEqual(actualError, error);
      }
    });
  });

  describe('getCartByUserId', function () {
    it('returns the cart and its items', async function () {
      queueResponses(dbResult([cart]), dbResult([item]));

      const result = await cartModel.getCartByUserId(5);

      assert.deepEqual(result.cart, cart);
      assert.deepEqual(result.items, [item]);
      assert.lengthOf(calls, 2);
      assert.include(calls[1].sql, 'JOIN products');
      assert.include(calls[1].sql, 'ORDER BY cart_items.id ASC');
      assert.deepEqual(calls[1].params, [cart.id]);
    });

    it('returns an empty items array for an empty cart', async function () {
      queueResponses(dbResult([cart]), dbResult([]));

      const result = await cartModel.getCartByUserId(5);

      assert.deepEqual(result.cart, cart);
      assert.deepEqual(result.items, []);
    });

    it('propagates errors when retrieving cart items', async function () {
      const error = new Error('Query failed');
      queueResponses(dbResult([cart]), error);

      try {
        await cartModel.getCartByUserId(5);
        assert.fail('Expected a database error');
      } catch (actualError) {
        assert.strictEqual(actualError, error);
      }
    });
  });

  describe('addItemToCart', function () {
    it('adds an item and returns the inserted row', async function () {
      queueResponses(dbResult([cart]), dbResult([item]));

      const result = await cartModel.addItemToCart({
        userId: 5,
        productId: 7,
        quantity: 2
      });

      assert.deepEqual(result, item);
      assert.lengthOf(calls, 2);
      assert.include(calls[1].sql, 'INSERT INTO cart_items');
      assert.include(calls[1].sql, 'ON CONFLICT (cart_id, product_id)');
      assert.deepEqual(calls[1].params, [10, 7, 2]);
    });

    it('uses an upsert to increment an existing item quantity', async function () {
      queueResponses(dbResult([cart]), dbResult([{
        ...item,
        quantity: 5
      }]));

      const result = await cartModel.addItemToCart({
        userId: 5,
        productId: 7,
        quantity: 3
      });

      assert.equal(result.quantity, 5);
      assert.include(
        calls[1].sql,
        'quantity = cart_items.quantity + EXCLUDED.quantity'
      );
      assert.deepEqual(calls[1].params, [10, 7, 3]);
    });
  });

  describe('updateCartItem', function () {
    it('updates the item quantity', async function () {
      const updatedItem = { ...item, quantity: 4 };
      queueResponses(dbResult([cart]), dbResult([updatedItem]));

      const result = await cartModel.updateCartItem({
        userId: 5,
        productId: 7,
        quantity: 4
      });

      assert.deepEqual(result, updatedItem);
      assert.include(calls[1].sql, 'UPDATE cart_items');
      assert.deepEqual(calls[1].params, [4, 10, 7]);
    });

    it('returns undefined when the item does not exist', async function () {
      queueResponses(dbResult([cart]), dbResult([]));

      const result = await cartModel.updateCartItem({
        userId: 5,
        productId: 999,
        quantity: 4
      });

      assert.isUndefined(result);
    });
  });

  describe('removeCartItem', function () {
    it('removes an item and returns the deleted row', async function () {
      queueResponses(dbResult([cart]), dbResult([item]));

      const result = await cartModel.removeCartItem({
        userId: 5,
        productId: 7
      });

      assert.deepEqual(result, item);
      assert.include(calls[1].sql, 'DELETE FROM cart_items');
      assert.deepEqual(calls[1].params, [10, 7]);
    });

    it('returns undefined when the item does not exist', async function () {
      queueResponses(dbResult([cart]), dbResult([]));

      const result = await cartModel.removeCartItem({
        userId: 5,
        productId: 999
      });

      assert.isUndefined(result);
    });
  });

  describe('clearCart', function () {
    it('deletes and returns all cart items', async function () {
      queueResponses(dbResult([cart]), dbResult([item]));

      const result = await cartModel.clearCart(5);

      assert.deepEqual(result, [item]);
      assert.include(calls[1].sql, 'DELETE FROM cart_items');
      assert.deepEqual(calls[1].params, [10]);
    });

    it('returns an empty array when the cart has no items', async function () {
      queueResponses(dbResult([cart]), dbResult([]));

      const result = await cartModel.clearCart(5);

      assert.deepEqual(result, []);
    });
  });
});
