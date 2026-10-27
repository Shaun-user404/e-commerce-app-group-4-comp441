
const { expect } = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');

const {
  requireAuth,
  requireSameUser
} = require('../../middleware/authMiddleware');

describe('AI Baseline: Authentication Middleware', function () {
  let req;
  let res;
  let next;

  beforeEach(function () {
    req = {
      headers: {},
      params: {},
      user: undefined
    };

    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis()
    };

    next = sinon.stub();
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('requireAuth', function () {
    it('should reject a request with no authorization header', function () {
      requireAuth(req, res, next);

      expect(res.status.calledOnceWithExactly(401)).to.equal(true);
      expect(res.json.calledOnceWithExactly({
        message: 'Authorization token required'
      })).to.equal(true);
      expect(next.called).to.equal(false);
    });

    it('should reject an authorization header with no token', function () {
      req.headers.authorization = 'Bearer';

      requireAuth(req, res, next);

      expect(res.status.calledOnceWithExactly(401)).to.equal(true);
      expect(res.json.calledOnceWithExactly({
        message: 'Authorization token required'
      })).to.equal(true);
      expect(next.called).to.equal(false);
    });

    it('should attach the decoded user and call next for a valid token', function () {
      const decodedUser = { id: 7, email: 'test@example.com' };

      req.headers.authorization = 'Bearer valid-token';

      const verifyStub = sinon.stub(jwt, 'verify')
        .returns(decodedUser);

      requireAuth(req, res, next);

      expect(verifyStub.calledOnceWithExactly(
        'valid-token',
        process.env.JWT_SECRET
      )).to.equal(true);
      expect(req.user).to.equal(decodedUser);
      expect(next.calledOnce).to.equal(true);
      expect(res.status.called).to.equal(false);
    });

    it('should reject an invalid or expired token', function () {
      req.headers.authorization = 'Bearer invalid-token';

      sinon.stub(jwt, 'verify').throws(new Error('Invalid token'));

      requireAuth(req, res, next);

      expect(res.status.calledOnceWithExactly(401)).to.equal(true);
      expect(res.json.calledOnceWithExactly({
        message: 'Invalid or expired token'
      })).to.equal(true);
      expect(next.called).to.equal(false);
    });
  });

  describe('requireSameUser', function () {
    it('should allow a user to access their own resources', function () {
      req.params.userId = '7';
      req.user = { id: 7 };

      requireSameUser()(req, res, next);

      expect(next.calledOnce).to.equal(true);
      expect(res.status.called).to.equal(false);
    });

    it('should reject access to another user resources', function () {
      req.params.userId = '8';
      req.user = { id: 7 };

      requireSameUser()(req, res, next);

      expect(res.status.calledOnceWithExactly(403)).to.equal(true);
      expect(res.json.calledOnceWithExactly({
        message: 'You can only access your own resources'
      })).to.equal(true);
      expect(next.called).to.equal(false);
    });

    it('should reject a non-integer user ID', function () {
      req.params.userId = 'abc';
      req.user = { id: 7 };

      requireSameUser()(req, res, next);

      expect(res.status.calledOnceWithExactly(400)).to.equal(true);
      expect(res.json.calledOnceWithExactly({
        message: 'Valid user id is required'
      })).to.equal(true);
      expect(next.called).to.equal(false);
    });

    it('should support a custom route parameter name', function () {
      req.params.accountId = '7';
      req.user = { id: 7 };

      requireSameUser('accountId')(req, res, next);

      expect(next.calledOnce).to.equal(true);
      expect(res.status.called).to.equal(false);
    });
  });
});
