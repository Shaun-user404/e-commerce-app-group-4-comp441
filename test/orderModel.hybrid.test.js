
const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');
const Module = require('module');

describe('Order Model - Hybrid Tests', function () {
  let db;
  let orderModel;
  let queryStub;
  let clientQueryStub;
  let client;
  let originalLoad;

  beforeEach(function () {
    queryStub = sinon.stub();
    clientQueryStub = sinon.stub();

    client = {
      query: clientQueryStub,
      release: sinon.spy()
    };

    db = {
      query: queryStub,
      getClient: sinon.stub().resolves(client)
    };

    const modelPath = require.resolve('../models/orderModel');
    const source = fs.readFileSync(modelPath, 'utf8');
    const modelModule = new Module(modelPath, module);

    modelModule.filename = modelPath;
    modelModule.paths = Module._nodeModulePaths(
      path.dirname(modelPath)
    );

    originalLoad = Module._load;

    Module._load = function (request, parent, isMain) {
      if (
        request === '../db' &&
        parent &&
        parent.filename === modelPath
      ) {
        return db;
      }

      return originalLoad.call(this, request, parent, isMain);
    };

    try {
      modelModule._compile(source, modelPath);
      orderModel = modelModule.exports;
    } finally {
      Module._load = originalLoad;
    }
  });

  afterEach(function () {
    Module._load = originalLoad;
    sinon.restore();
  });

  it('returns undefined when an order does not exist', async function () {
    queryStub.resolves({ rows: [] });

    const result = await orderModel.getOrderById(999);

    expect(result).to.equal(undefined);
    expect(queryStub.calledOnce).to.equal(true);
    expect(queryStub.firstCall.args[1]).to.deep.equal([999]);
  });

  it('returns an order with its items', async function () {
    const order = {
      id: 1,
      user_id: 7,
      status: 'pending',
      total: '20.00'
    };
    const items = [
      { product_id: 3, quantity: 2, price_at_purchase: '10.00' }
    ];

    queryStub.onCall(0).resolves({ rows: [order] });
    queryStub.onCall(1).resolves({ rows: items });

    const result = await orderModel.getOrderById(1);

    expect(result).to.deep.equal({ ...order, items });
    expect(queryStub.calledTwice).to.equal(true);
    expect(queryStub.firstCall.args[1]).to.deep.equal([1]);
    expect(queryStub.secondCall.args[1]).to.deep.equal([1]);
    expect(queryStub.firstCall.args[0]).to.include('FROM orders');
    expect(queryStub.secondCall.args[0]).to.include('FROM order_items');
  });

  it('returns all orders in ascending ID order', async function () {
    const orders = [{ id: 1 }, { id: 2 }];
    queryStub.resolves({ rows: orders });

    const result = await orderModel.getAllOrders();

    expect(result).to.deep.equal(orders);
    expect(queryStub.calledOnce).to.equal(true);
    expect(queryStub.firstCall.args[0]).to.include('ORDER BY id ASC');
    expect(queryStub.firstCall.args).to.have.length(1);
  });

  it('returns orders for the specified user in ascending ID order', async function () {
    const orders = [{ id: 4, user_id: 7 }];
    queryStub.resolves({ rows: orders });

    const result = await orderModel.getOrdersByUserId(7);

    expect(result).to.deep.equal(orders);
    expect(queryStub.firstCall.args[1]).to.deep.equal([7]);
    expect(queryStub.firstCall.args[0]).to.include('WHERE user_id = $1');
    expect(queryStub.firstCall.args[0]).to.include('ORDER BY id ASC');
  });

  it('rolls back when the cart does not exist', async function () {
    clientQueryStub.callsFake(async (sql) => {
      if (sql === 'BEGIN') return { rows: [] };
      if (sql.includes('FROM carts')) return { rows: [] };
      if (sql === 'ROLLBACK') return { rows: [] };
      return { rows: [] };
    });

    const result = await orderModel.createOrderFromCart(7);

    expect(result).to.deep.equal({ error: 'Cart not found' });
    expect(clientQueryStub.firstCall.args[0]).to.equal('BEGIN');
    expect(clientQueryStub.calledWith('ROLLBACK')).to.equal(true);
    expect(clientQueryStub.calledWith(
      sinon.match('SELECT id, user_id')
    )).to.equal(true);
    expect(client.release.calledOnce).to.equal(true);
  });

  it('rolls back when the cart is empty', async function () {
    clientQueryStub.callsFake(async (sql) => {
      if (sql === 'BEGIN') return { rows: [] };
      if (sql.includes('FROM carts')) {
        return { rows: [{ id: 2, user_id: 7 }] };
      }
      if (sql.includes('FROM cart_items')) return { rows: [] };
      if (sql === 'ROLLBACK') return { rows: [] };
      return { rows: [] };
    });

    const result = await orderModel.createOrderFromCart(7);

    expect(result).to.deep.equal({ error: 'Cart is empty' });
    expect(clientQueryStub.calledWith('ROLLBACK')).to.equal(true);
    expect(clientQueryStub.calledWith(
      sinon.match('FROM cart_items')
    )).to.equal(true);
    expect(client.release.calledOnce).to.equal(true);
  });

  it('rejects items when inventory is insufficient', async function () {
    clientQueryStub.callsFake(async (sql) => {
      if (sql === 'BEGIN') return { rows: [] };
      if (sql.includes('FROM carts')) {
        return { rows: [{ id: 2, user_id: 7 }] };
      }
      if (sql.includes('FROM cart_items')) {
        return {
          rows: [{
            product_id: 3,
            quantity: 5,
            name: 'Keyboard',
            price: '10.00',
            inventory_quantity: 2
          }]
        };
      }
      if (sql === 'ROLLBACK') return { rows: [] };
      return { rows: [] };
    });

    const result = await orderModel.createOrderFromCart(7);

    expect(result).to.deep.equal({
      error: 'Not enough inventory for Keyboard'
    });
    expect(clientQueryStub.calledWith('ROLLBACK')).to.equal(true);
    expect(clientQueryStub.calledWith(
      sinon.match('INSERT INTO orders')
    )).to.equal(false);
    expect(clientQueryStub.calledWith(
      sinon.match('UPDATE products')
    )).to.equal(false);
    expect(client.release.calledOnce).to.equal(true);
  });

  it('allows an item when inventory exactly matches the quantity', async function () {
    clientQueryStub.callsFake(async (sql) => {
      if (sql === 'BEGIN') return { rows: [] };
      if (sql.includes('FROM carts')) {
        return { rows: [{ id: 2, user_id: 7 }] };
      }
      if (sql.includes('FROM cart_items')) {
        return {
          rows: [{
            product_id: 3,
            quantity: 2,
            name: 'Keyboard',
            price: '10.00',
            inventory_quantity: 2
          }]
        };
      }
      if (sql === 'ROLLBACK') return { rows: [] };
      return { rows: [] };
    });

    // The exact-inventory case reaches order insertion. This stub
    // supplies the returned order row for that insertion.
    clientQueryStub.callsFake(async (sql) => {
      if (sql === 'BEGIN') return { rows: [] };
      if (sql.includes('FROM carts')) {
        return { rows: [{ id: 2, user_id: 7 }] };
      }
      if (sql.includes('FROM cart_items')) {
        return {
          rows: [{
            product_id: 3,
            quantity: 2,
            name: 'Keyboard',
            price: '10.00',
            inventory_quantity: 2
          }]
        };
      }
      if (sql.includes('INSERT INTO orders')) {
        return {
          rows: [{
            id: 11,
            user_id: 7,
            status: 'pending',
            total: '20.00'
          }]
        };
      }
      return { rows: [] };
    });

    queryStub.onCall(0).resolves({
      rows: [{ id: 11, user_id: 7, status: 'pending', total: '20.00' }]
    });
    queryStub.onCall(1).resolves({ rows: [] });

    const result = await orderModel.createOrderFromCart(7);

    expect(result.id).to.equal(11);
    expect(clientQueryStub.calledWith(
      sinon.match('INSERT INTO orders'),
      [7, 'pending', '20.00']
    )).to.equal(true);
    expect(clientQueryStub.calledWith(
      sinon.match('COMMIT')
    )).to.equal(true);
    expect(client.release.calledOnce).to.equal(true);
  });

  it('calculates the order total from price multiplied by quantity', async function () {
    clientQueryStub.callsFake(async (sql) => {
      if (sql === 'BEGIN') return { rows: [] };
      if (sql.includes('FROM carts')) {
        return { rows: [{ id: 2, user_id: 7 }] };
      }
      if (sql.includes('FROM cart_items')) {
        return {
          rows: [
            {
              product_id: 3,
              quantity: 2,
              name: 'Keyboard',
              price: '10.00',
              inventory_quantity: 10
            },
            {
              product_id: 4,
              quantity: 3,
              name: 'Mouse',
              price: '5.00',
              inventory_quantity: 10
            }
          ]
        };
      }
      if (sql.includes('INSERT INTO orders')) {
        return {
          rows: [{
            id: 12,
            user_id: 7,
            status: 'pending',
            total: '35.00'
          }]
        };
      }
      return { rows: [] };
    });

    queryStub.onCall(0).resolves({
      rows: [{ id: 12, user_id: 7, status: 'pending', total: '35.00' }]
    });
    queryStub.onCall(1).resolves({ rows: [] });

    await orderModel.createOrderFromCart(7);

    expect(clientQueryStub.calledWith(
      sinon.match('INSERT INTO orders'),
      [7, 'pending', '35.00']
    )).to.equal(true);
  });

  it('inserts each order item and deducts its quantity from inventory', async function () {
    clientQueryStub.callsFake(async (sql) => {
      if (sql === 'BEGIN') return { rows: [] };
      if (sql.includes('FROM carts')) {
        return { rows: [{ id: 2, user_id: 7 }] };
      }
      if (sql.includes('FROM cart_items')) {
        return {
          rows: [{
            product_id: 3,
            quantity: 2,
            name: 'Keyboard',
            price: '10.00',
            inventory_quantity: 10
          }]
        };
      }
      if (sql.includes('INSERT INTO orders')) {
        return {
          rows: [{
            id: 13,
            user_id: 7,
            status: 'pending',
            total: '20.00'
          }]
        };
      }
      return { rows: [] };
    });

    queryStub.onCall(0).resolves({
      rows: [{ id: 13, user_id: 7, status: 'pending', total: '20.00' }]
    });
    queryStub.onCall(1).resolves({ rows: [] });

    await orderModel.createOrderFromCart(7);

    expect(clientQueryStub.calledWith(
      sinon.match('INSERT INTO order_items'),
      [13, 3, 2, '10.00']
    )).to.equal(true);
    expect(clientQueryStub.calledWith(
      sinon.match('UPDATE products'),
      [2, 3]
    )).to.equal(true);
  });

  it('clears cart items and commits after successful order creation', async function () {
    clientQueryStub.callsFake(async (sql) => {
      if (sql === 'BEGIN') return { rows: [] };
      if (sql.includes('FROM carts')) {
        return { rows: [{ id: 2, user_id: 7 }] };
      }
      if (sql.includes('FROM cart_items')) {
        return {
          rows: [{
            product_id: 3,
            quantity: 1,
            name: 'Keyboard',
            price: '10.00',
            inventory_quantity: 10
          }]
        };
      }
      if (sql.includes('INSERT INTO orders')) {
        return {
          rows: [{
            id: 14,
            user_id: 7,
            status: 'pending',
            total: '10.00'
          }]
        };
      }
      return { rows: [] };
    });

    queryStub.onCall(0).resolves({
      rows: [{ id: 14, user_id: 7, status: 'pending', total: '10.00' }]
    });
    queryStub.onCall(1).resolves({ rows: [] });

    await orderModel.createOrderFromCart(7);

    expect(clientQueryStub.calledWith(
      sinon.match('DELETE FROM cart_items'),
      [2]
    )).to.equal(true);
    expect(clientQueryStub.calledWith('COMMIT')).to.equal(true);

    const commitCall = clientQueryStub.getCalls().find(
      (call) => call.args[0] === 'COMMIT'
    );
    const deleteCall = clientQueryStub.getCalls().find(
      (call) => typeof call.args[0] === 'string' &&
        call.args[0].includes('DELETE FROM cart_items')
    );

    expect(deleteCall).to.exist;
    expect(commitCall).to.exist;
    expect(deleteCall.callId).to.be.lessThan(commitCall.callId);
    expect(client.release.calledOnce).to.equal(true);
  });

  it('rolls back and releases the client when a database operation fails', async function () {
    clientQueryStub.callsFake(async (sql) => {
      if (sql === 'BEGIN') return { rows: [] };
      if (sql.includes('FROM carts')) {
        return { rows: [{ id: 2, user_id: 7 }] };
      }
      if (sql.includes('FROM cart_items')) {
        return {
          rows: [{
            product_id: 3,
            quantity: 1,
            name: 'Keyboard',
            price: '10.00',
            inventory_quantity: 10
          }]
        };
      }
      if (sql.includes('INSERT INTO orders')) {
        throw new Error('Database insert failed');
      }
      if (sql === 'ROLLBACK') return { rows: [] };
      return { rows: [] };
    });

    let thrownError;

    try {
      await orderModel.createOrderFromCart(7);
    } catch (error) {
      thrownError = error;
    }

    expect(thrownError).to.be.instanceOf(Error);
    expect(thrownError.message).to.equal('Database insert failed');
    expect(clientQueryStub.calledWith('ROLLBACK')).to.equal(true);
    expect(client.release.calledOnce).to.equal(true);
  });

  it('updates an order status and returns the updated row', async function () {
    const updated = { id: 1, status: 'shipped' };
    queryStub.resolves({ rows: [updated] });

    const result = await orderModel.updateOrderStatus(1, 'shipped');

    expect(result).to.deep.equal(updated);
    expect(queryStub.firstCall.args[1]).to.deep.equal(['shipped', 1]);
    expect(queryStub.firstCall.args[0]).to.include('UPDATE orders');
    expect(queryStub.firstCall.args[0]).to.include('WHERE id = $2');
  });

  it('returns undefined when deleting a nonexistent order', async function () {
    queryStub.resolves({ rows: [] });

    const result = await orderModel.deleteOrder(999);

    expect(result).to.equal(undefined);
    expect(queryStub.calledOnce).to.equal(true);
    expect(queryStub.firstCall.args[1]).to.deep.equal([999]);
  });

  it('deletes an existing order and returns its previous data', async function () {
    const order = {
      id: 15,
      user_id: 7,
      status: 'pending',
      total: '20.00'
    };

    queryStub.onCall(0).resolves({ rows: [order] });
    queryStub.onCall(1).resolves({ rows: [] });
    queryStub.onCall(2).resolves({ rows: [] });

    const result = await orderModel.deleteOrder(15);

    expect(result).to.deep.equal({ ...order, items: [] });
    expect(queryStub.calledThrice).to.equal(true);
    expect(queryStub.secondCall.args[0]).to.include('FROM order_items');
    expect(queryStub.thirdCall.args[0]).to.include('DELETE FROM orders');
    expect(queryStub.thirdCall.args[1]).to.deep.equal([15]);
  });
});
