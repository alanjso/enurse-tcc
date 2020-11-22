const express = require('../config/express-config');

let chai = require('chai');

let request = require('supertest')(express);

let expect = chai.expect;

let Assunto = require('../api/assunto/assunto.model');

describe('########## API DE ASSUNTOS ##########', function(){

    before(async function(){
        await Assunto.deleteMany({});
    });

    it('Lista assuntos e espera status 200',function(done){
        request.get('/assuntos')
            .end(function(err,res){
                expect(res.statusCode).to.equal(200);
                done();
            });
    });

    it('Adiciona assunto de maneira correta e espera status 202',function(done){
        request.post('/assuntos')
            .send({
                'nome':'Assunto 001',
                'descricao':'Descricao 001 do assunto 001'
            })
            .end(function(err,res){
                expect(res.statusCode).to.equal(202);
                done();
            });
    });

    it('Adiciona assunto sem nome e recebe status code 400',function(done){
        request.post('/assuntos')
            .send({
                'nome':'',
                'descricao':'qwe asdzxc wqe'
            })
            .end(function(err,res){
                expect(res.statusCode).to.equal(400);
                done();
            })
    });

    it('Adiciona assunto sem descrição e recebe status code 400',function(done){
        request.post('/assuntos')
            .send({
                'nome':'wqer asfdf zxcv',
                'descricao':''
            })
            .end(function(err,res){
                expect(res.statusCode).to.equal(400);
                done();
            })
    });
});