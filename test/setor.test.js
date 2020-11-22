const express = require('../config/express-config');

let chai = require('chai');

let request = require('supertest')(express);

let assert = chai.assert;

let Setor = require('../api/setor/setor.model');

let ObjectID = require('mongodb').ObjectID;

describe('########## SETOR ##########\n', function () {

    before(() => {

    })

    beforeEach(async () => {
        await Setor.deleteMany({});
    });

    it('Lista setor e espera status 200', async () => {
        await request.get('/setores')
            .expect(function (res) {
                assert.equal(res.statusCode, '200');
            });

    });

    it('Adiciona setor de maneira correta e espera status 202', async () => {
        await request.post('/setores')
            .send({
                'nome': 'Setor 001',
                'descricao': 'descricao do setor 001'
            })
            .expect(function (res) {
                assert.equal(res.statusCode, '202');
            });
    });

    it('Tenta adiciona setor sem nome e recebe status code 400', async () => {
        await request.post('/setores')
            .send({
                'nome': '',
                'descricao': 'descricao do status sem nome'
            })
            .expect(function (res) {
                assert.equal(res.statusCode, '400');
            });
    });

    it('Tenta adicionar um setor que já existe e recebe status code 400', async () => {

        const setor = {
            'nome': 'Setor 002',
            'descricao': 'descricao do status sem nome'
        }

        await Setor.create(setor);

        await request.post('/setores')
            .send(setor)
            .expect(function (res) {
                assert.equal(res.statusCode, 400);
            });
    });

    it('Tenta deletar um setor que não existe e recebe status code 404', async () => {

        const id = new ObjectID();

        await request.delete(`/setores/${id}`)
            .expect(function (res) {
                assert.equal(res.statusCode, '404');
            });
    });

    it('Deleta um setor que existe e recebe status code 200', async () => {

        let setor = {
            'nome': 'Setor 001',
            'descricao': 'descricao do status sem nome'
        }

        setor = await Setor.create(setor);

        await request.delete(`/setores/${setor.id}`)
            .expect(function (res) {
                assert.equal(res.statusCode, '200');
            });
    });
});