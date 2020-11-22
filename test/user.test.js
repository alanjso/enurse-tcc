const express = require('../config/express-config');

let chai = require('chai');

let request = require('supertest')(express);

let expect = chai.expect;

let assert = chai.assert;

let Usuario = require('../api/user/user-model');

describe('########## USUÁRIOS ##########',function(){

    before(async function(){
        await Usuario.deleteMany({});
    });

    it('Lista usuários e espera status 200',function(done) {
        request.get('/user')
            .end(function(err,res){
                expect(res.statusCode).to.equal(200);
                done();
            });
    });

    it('Adiciona usuário de maneira correta e recebe status code 202',function(done){
        request.post('/user')
            .send({
                'nome':'Felipe',
                'email':'felipe@felipe.com',
                'senha':'1234'
            })
            .end(function(err,res){
                expect(res.statusCode).to.equal(202);
                assert.equal(res.body.nome,'Felipe');
                done();
            })
    });

    it('Tenta salvar usuário sem nome e recebe status code 400',function(done){
        request.post('/user')
            .send({
                'nome':'',
                'email':'qw@qwe.com',
                'senha':'12344321'
            })
            .end(function(err,res){
                expect(res.statusCode).to.equal(400);
                done();
            });
    });

    it('Tenta salvar usuário sem email e recebe status code 400',function(done){
        request.post('/user')
            .send({
                'nome':'ASDF',
                'email':'',
                'senha':'12344321'
            })
            .end(function(err,res){
                expect(res.statusCode).to.equal(400);
                done();
            });
    });

    it('Tenta salvar usuário sem senha e recebe status code 400',function(done){
        request.post('/user')
            .send({
                'nome':'ASDF',
                'email':'qwer',
                'senha':''
            })
            .end(function(err,res){
                expect(res.statusCode).to.equal(400);
                done();
            });
    });

});