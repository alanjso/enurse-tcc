#!groovy

pipeline {
    
  agent any
  
  tools {nodejs "nodejs"}

  stages {
        
        stage('parando e removendo o container'){
            steps {
                sh 'docker rm -f flex-chat-api || true'
            }
        }
      
        stage('Fazendo o clone do repositório') {
            steps {
                git branch: 'master',
                    credentialsId: 'Felipeas_Gitlab',
                    url: 'http://10.8.60.120:8081/felipeas/flex-chat-api.git'
                    sh 'ls'
            }
        }
        
        stage('Instalando as dependencias') {
            steps {
                sh 'npm install'
            }
        }
        stage('Rodando os testes') {
            steps {
                sh 'export NODE_ENV="tests"'
            }
        }
        
        stage('Removendo as dependencias') {
            steps {
                sh 'rm -rf node_modules'
            }
        }
        
        stage('Build da imagem'){
            steps{
                sh 'docker build -t flex-chat-api .'    
            }
        }
        stage('Rodando container em homologação'){
            steps{
                sh 'docker run -d -p 5200:4001 --name flex-chat-api --link redis --link mongo -e "NODE_ENV=tests"  -v "/var/arquivos/:/usr/src/app/uploads/" -e TZ=Brazil/East flex-chat-api'
            }
        }
        
        stage('Push para o registry private'){
            steps {
                sh 'docker tag flex-chat-api localhost:81/flex-chat-api'
                sh 'docker push localhost:81/flex-chat-api'
            }
            post {
                always {
                    emailext body: 'A Test EMail', recipientProviders: [[$class: 'DevelopersRecipientProvider'], [$class: 'RequesterRecipientProvider']], subject: 'Flex-Chat-API'
                }
            }
        }
        
    }
}