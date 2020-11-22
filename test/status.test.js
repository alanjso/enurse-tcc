const express = require('../config/express-config');

let chai = require('chai');

let request = require('supertest')(express);

let expect = chai.expect;

let Status = require('../api/status/status.model')

describe('########## STATUS ##########\n',function(){

    before(async function() {
       await Status.deleteMany({});
    })

    it('Lista status e espera status 200', function(done) {
        request.get('/status')
            .end(function(err,res){
                expect(res.statusCode).to.equal(200);
                done();
            });
    });

    it('Adiciona status de maneira correta e recebe code 202', function(done){
        request.post('/status')
            .send({
                'nome':'aStatus a 00 a1',
                'descricao':'descricao 001 ado status'
            })
            .end(function(err,res){
                expect(res.statusCode).to.equal(202);
                done();
            });
    });

    it('Tenta salvar status sem nome e recebe status 400',function(done){
        request.post('/status')
            .send({
                'nome':'',
                'descricao':'qwe asd zxc'
            })
            .end(function(err,res){
                expect(res.statusCode).to.equal(400);
                done();
            });
    });

    it('Tenta salvar status sem descricao e recebe status 400',function(done){
        request.post('/status')
            .send({
                'nome':'qwe asd',
                'descricao':''
            })
            .end(function(err,res){
                expect(res.statusCode).to.equal(400);
                done();
            });
    });

});