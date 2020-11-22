let express = require('../config/express-config');

let chai = require('chai');

let request = require('supertest')(express);

let expect = chai.expect;

describe('########## API DE CONVERSAS ##########', function () {

    it('Espero status 200', function (done) {
        request.get('/conversa/clientenafila/suporte')
            .end(function (err, res) {
                expect(res.statusCode).to.equal(200);
                done();
            });
    });

    describe('#POST', function () {

    });

});