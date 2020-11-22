let express = require('../config/express-config');

let Fila = require('../api/fila/fila-model');

let chai = require('chai');

let request = require('supertest')(express);

let expect = chai.expect;

describe('########## FILAS ##########', function () {

    before(async () => {
        await Fila.deleteMany({});
    });

    it('Lista filas e espera status 200', function (done) {
        request.get('/filas')
            .end(function (err, res) {
                expect(res.statusCode).to.equal(200);
                done();
            });
    });

    it('Salva fila de maneira correta e recebe status 202', function (done) {
        request.post('/filas')
            .send({
                'nome': 'Fila do teste',
                'descricao': 'Fila do teste super legal'
            })
            .end(function (err, res) {
                expect(res.statusCode).to.equal(202);
                done();
            });
    });

    it('Tenta salvar fila e recebe status 400 pois o nome foi enviado vazio', function (done) {
        request.post('/filas')
            .send({
                'nome': '',
                'descricao': 'Fila do teste super legal'
            })
            .end(function (err, res) {
                expect(res.statusCode).to.equal(400);
                done();
            });
    });

    it('Tenta salvar fila e recebe status 400 pois a descrição foi enviada vazia', function (done) {
        request.post('/filas')
            .send({
                'nome': 'Suporte',
                'descricao': ''
            })
            .end(function (err, res) {
                expect(res.statusCode).to.equal(400);
                done();
            });
    });

});

